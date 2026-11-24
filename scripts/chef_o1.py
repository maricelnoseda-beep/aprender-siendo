"""«Chef en Acción»: orden parcial de los pasos (RT-CHF-001-R v1.4, O1).

Cada receta declara qué paso tiene que ir antes de cuál (`antes_de`, con índices de paso de la misma receta).
Por defecto los pasos van en cadena (cada uno antes del siguiente). Las cuatro recetas de la tabla de PSP-SR tienen pasos
que se pueden intercambiar. Cada ítem u etapa de ordenar con receta recibe `orden_parcial`: los pares [antes, después]
entre sus propios pasos. Si el orden queda único, no se agrega nada y la corrección sigue igual que antes.
El contenido de los ítems no cambia: cambia cómo se corrigen.
"""

# Pares [i, j]: el paso i va antes que el j. Solo para las recetas de la tabla de O1; el resto, en cadena.
PARCIAL = {
 # 0 tuesta · 1 untar queso · 2 untar mermelada · 3 servir
 "tostadas": [(0, 1), (0, 2), (1, 3), (2, 3)],
 # 0 corta banana · 1 poner yogur · 2 repartir cereales · 3 sumar banana
 "yogur_cereales": [(0, 1), (1, 2), (1, 3)],
 # 0 ralla zanahoria · 1 corta tomate · 2 lavar lechuga · 3 poner todo en el bol · 4 condimentar y mezclar
 "ensalada_verde": [(0, 3), (1, 3), (2, 3), (3, 4)],
 # 0 prender el horno · 1 batir · 2 sumar la harina · 3 pasar a la fuente · 4 hornear
 "bizcochuelo": [(0, 4), (1, 2), (2, 3), (3, 4)],
}


def _cierre(n, pares):
    antes = {i: set() for i in range(n)}
    for a, b in pares: antes[b].add(a)
    cambio = True
    while cambio:
        cambio = False
        for b in range(n):
            nuevo = set().union(*[antes[a] for a in antes[b]]) - antes[b] if antes[b] else set()
            if nuevo: antes[b] |= nuevo; cambio = True
    return {(a, b) for b in range(n) for a in antes[b]}


def _walk(o, fn, padre=None):
    if isinstance(o, dict):
        fn(o, padre)
        p = o if o.get("receta") else padre
        for v in o.values(): _walk(v, fn, p)
    elif isinstance(o, list):
        for v in o: _walk(v, fn, padre)


def aplicar(R, B, log):
    REC = {r["id"]: r for r in R["recetas"]}
    CIERRE = {}
    for r in R["recetas"]:
        n = len(r["pasos"]); pares = PARCIAL.get(r["id"], [(i, i + 1) for i in range(n - 1)])
        for i, p in enumerate(r["pasos"]): p["antes_de"] = sorted(b for a, b in pares if a == i)
        CIERRE[r["id"]] = _cierre(n, pares)
    cambiados = []
    def ordenar(o, padre):
        if o.get("formato") != "ordenar" or not o.get("pasos"): return
        rid = o.get("receta") or (padre or {}).get("receta")
        if rid not in REC: return
        textos = [p["texto"] for p in REC[rid]["pasos"]]
        idx = {}
        for p in o["pasos"]:
            if p["txt"] in textos: idx[p["id"]] = textos.index(p["txt"])
        if len(idx) != len(o["pasos"]): return   # pasos que no son de la receta: queda en orden único
        ids = [p["id"] for p in o["pasos"]]
        par = [[a, b] for a in ids for b in ids if (idx[a], idx[b]) in CIERRE[rid]]
        total = len(par) == len(ids) * (len(ids) - 1) // 2
        if not total:
            o["orden_parcial"] = par
            cambiados.append((padre or o).get("id", "?"))
    _walk(B["variantes"], ordenar)
    cambiados = sorted(set(cambiados))
    log.append(f"O1 | {len(cambiados)} ítems de ordenar aceptan más de un orden: {', '.join(cambiados)}")
    return cambiados

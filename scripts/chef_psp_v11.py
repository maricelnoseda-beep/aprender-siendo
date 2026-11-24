"""«Chef en Acción»: correcciones de PSP-SR en RT-CHF-001-R v1.1, aplicadas sobre el banco generado.

- B1 y B2: es la lógica de `corregir_B1_B2.py` de PSP-SR (anexo B1–B2). Produce el mismo banco y las mismas recetas
  que entregó PSP-SR. Se aplica en memoria para que el generador no vuelva a producir el error.
- Sección 3 (ítems para corregir), sección 4 (recetas) y O6: correcciones pedidas en la respuesta, por id de ítem.
- Estado clínico: los 174 ítems validados quedan «validado por PSP-SR»; los 39 corregidos, «corregido, a revisar por PSP-SR».
Nada de esto es un registro de aprobación de la supervisora.
"""
import copy

VALIDADO = "validado por PSP-SR"
CORREGIDO = "corregido según RT-CHF-001-R v1.1, a revisar por PSP-SR"

# ---------- B1: pasos con calor ----------
HOT = {
 "Colar los fideos": dict(actor="adulto", riesgo="calor", texto="El adulto cuela los fideos"),
 "Sumar las verduras": dict(actor="adulto", riesgo="calor", texto="El adulto suma las verduras al arroz"),
 "Revolver de a ratos": dict(riesgo="calor"),
 "Cocinar en la sartén": dict(texto="El adulto cocina el panqueque y lo deja entibiar"),
}
# Recipiente en el que trabaja cada paso (para la regla de riesgo heredado del validador, B1.3) y pasos de enfriado.
RECIPIENTE = {"Hervir los fideos": "olla", "Calentar la salsa": "sarten", "El adulto cuela los fideos": "olla", "Hervir el arroz": "olla",
              "El adulto suma las verduras al arroz": "olla", "Hervir con agua": "olla", "Revolver de a ratos": "olla",
              "El adulto cocina el panqueque y lo deja entibiar": "sarten", "Cocinar el relleno": "sarten", "Freír en la sartén": "sarten"}
ENFRIA = {"El adulto cocina el panqueque y lo deja entibiar"}

# ---------- B2 ----------
HARINA = ("El súper no tiene la harina de siempre.", "Comprar otra harina")
FALT = {
 "ensalada_frutas": [("No hay banana.", "Usar otra fruta que haya")],
 "sandwich_queso":  [("No hay queso.", "Hacerlos de tomate")],
 "yogur_cereales":  [("No hay cereales.", "Usar avena")],
 "tostadas":        [("No hay mermelada.", "Usar dulce de leche"), ("No hay queso untable.", "Hacerlas solo con mermelada")],
 "ensalada_verde":  [("No hay zanahoria.", "Usar otra verdura que haya"), ("No hay lechuga.", "Hacerla de tomate y zanahoria")],
 "bolitas_coco":    [("No hay coco.", "Pasarlas por cacao")],
 "bizcochuelo":     [("No hay leche.", "Usar jugo de naranja"), HARINA],
 "galletitas":      [("No hay manteca.", "Usar aceite"), HARINA],
 "pizza":           [("No hay queso.", "Hacerla sin queso, con tomate"), HARINA],
 "panqueques":      [("No hay dulce de leche.", "Rellenar con mermelada"), HARINA],
 "tarta_verdura":   [("No hay espinaca.", "Usar acelga")],
 "empanadas":       [("No hay morrón.", "Hacerlas sin morrón")],
 "fideos_salsa":    [("No hay queso.", "Servir sin queso")],
 "arroz_verduras":  [("No hay choclo.", "Usar arvejas")],
 "tortas_fritas":   [("No hay manteca.", "Usar grasa o aceite"), HARINA],
 "locro":           [("No hay zapallo.", "Usar calabaza")],
}
# Ingrediente de cada faltante, para que el validador lo cruce con la receta (la zanahoria entra rallada: zanahoria_rallada)
FALT_ING = {"No hay banana.": "banana", "No hay queso.": "queso", "No hay cereales.": "cereales", "No hay mermelada.": "mermelada",
            "No hay queso untable.": "queso_untable", "No hay zanahoria.": "zanahoria_rallada", "No hay lechuga.": "lechuga", "No hay coco.": "coco",
            "No hay leche.": "leche", HARINA[0]: "harina", "No hay manteca.": "manteca", "No hay dulce de leche.": "dulce_leche",
            "No hay espinaca.": "espinaca", "No hay morrón.": "morron", "No hay choclo.": "choclo", "No hay zapallo.": "zapallo"}
def sit_de(recetas):
    return {
     "Hoy vienen amigos a merendar.": ["ensalada_frutas", "yogur_cereales", "tostadas", "sandwich_queso", "bolitas_coco", "bizcochuelo", "galletitas", "panqueques", "tortas_fritas"],
     "Es el cumpleaños de la abuela.": ["ensalada_frutas", "tostadas", "sandwich_queso", "bolitas_coco", "bizcochuelo", "galletitas", "panqueques", "tortas_fritas", "pizza", "empanadas"],
     "Vienen los primos a cenar.": ["ensalada_verde", "fideos_salsa", "arroz_verduras", "tarta_verdura", "empanadas", "pizza", "locro"],
     "Hoy cocinamos para la familia.": ["ensalada_verde", "fideos_salsa", "arroz_verduras", "tarta_verdura", "empanadas", "pizza", "locro", "panqueques"],
     "Llueve y nos quedamos en casa.": [r["id"] for r in recetas],
     "Vamos de picnic a la plaza.": ["sandwich_queso", "bolitas_coco", "galletitas", "bizcochuelo", "ensalada_frutas", "empanadas", "tarta_verdura"],
     "Hay que llevar algo a la escuela.": ["galletitas", "bizcochuelo", "bolitas_coco", "tortas_fritas", "empanadas", "pizza"],
     "Hay una juntada en el club.": ["galletitas", "bizcochuelo", "bolitas_coco", "tortas_fritas", "empanadas", "pizza", "sandwich_queso"],
    }
NADA = {"Volver sin nada": "Volver sin comprar", "Pagar con lo que no hay": "Pagar igual, aunque no alcance",
        "Seguir sin decir nada": "Seguir como si estuviera", "Hacer lo mismo": "Hacer la misma cantidad", "Seguir como si nada": "Seguir como si estuviera"}
FALTANTE_VIEJO = {"El súper no tiene la harina de siempre.", "No hay manteca."}


def _walk(o, fn):
    if isinstance(o, dict):
        fn(o)
        for v in o.values(): _walk(v, fn)
    elif isinstance(o, list):
        for v in o: _walk(v, fn)


def b1_b2(R, B, log):
    """Port fiel de corregir_B1_B2.py (PSP-SR). R = {"recetas": [...]}, B = banco completo."""
    def fix_step(p, where):
        t = p.get("texto") or p.get("txt")
        if t in HOT and ("actor" in p or "adulto" in p):
            ch = HOT[t]
            if "actor" in p:
                for k, v in ch.items(): p[k] = v
            else:
                if "texto" in ch: p["txt"] = ch["texto"]
                if ch.get("actor") == "adulto": p["adulto"] = True
            log.append(f"B1 | {where} | «{t}» -> {ch}")
    for r in R["recetas"]: _walk(r["pasos"], lambda p, w="receta " + r["id"]: fix_step(p, w))
    for vid, grados in B["variantes"].items():
        for g, lst in grados.items():
            for it in lst: _walk(it, lambda p, w=it.get("id", vid): fix_step(p, w))

    SIT = sit_de(R["recetas"])
    GENERALES = {}
    for lst in B["variantes"]["8-espacio"].values():
        for it in lst:
            for e in it.get("etapas", []):
                if e.get("imprevisto") and e["consigna"] in ("Se terminó el presupuesto.", "Vienen dos amigos más."):
                    GENERALES.setdefault(e["consigna"], copy.deepcopy(e))
    for r in R["recetas"]:
        r["faltantes_posibles"] = [{"consigna": c, "reemplazo": t} for c, t in FALT[r["id"]]]
    R["situaciones"] = SIT
    for g, lst in B["variantes"]["8-espacio"].items():
        usadas = {}
        for it in lst:
            rid = it["receta"]
            sit = it.get("situacion")
            if sit in SIT and rid not in SIT[sit]:
                libres = [s for s in SIT if rid in SIT[s] and s not in usadas.get(g, set()) and s != "Llueve y nos quedamos en casa."]
                nueva = libres[0] if libres else "Llueve y nos quedamos en casa."
                log.append(f"B2 | {it['id']} ({rid}) | situación «{sit}» -> «{nueva}»")
                it["situacion"] = nueva
                if it.get("consigna") == sit: it["consigna"] = nueva
            usadas.setdefault(g, set()).add(it["situacion"])
            pool = list(FALT[rid])
            en_item = {e["consigna"] for e in it.get("etapas", []) if e.get("imprevisto")}
            for e in it.get("etapas", []):
                if not e.get("imprevisto"): continue
                if e["consigna"] in FALTANTE_VIEJO and not any(f[0] == e["consigna"] for f in pool) and all(f[0] in en_item for f in pool):
                    gen = next(k for k in GENERALES if k not in en_item)
                    vieja = e["consigna"]; e.clear(); e.update(copy.deepcopy(GENERALES[gen])); en_item.add(gen)
                    log.append(f"B2 | {it['id']} ({rid}) | imprevisto «{vieja}» -> «{gen}» (la receta no tiene otro faltante)")
                    continue
                if e["consigna"] in FALTANTE_VIEJO:
                    propio = [f for f in pool if f[0] == e["consigna"]]
                    c, t = propio[0] if propio else [f for f in pool if f[0] not in en_item][0]
                    en_item.add(c)
                    vieja = e["consigna"]; e["consigna"] = c
                    for o in e["opciones"]:
                        if o["id"] == "reemplazar": o["txt"] = t
                        if o["id"] == "cambiar": o["txt"] = "Cambiar de receta"
                    if vieja != c: log.append(f"B2 | {it['id']} ({rid}) | imprevisto «{vieja}» -> «{c}» / correcta «{t}»")
                for o in e["opciones"]:
                    if o["id"] == "nada" and o["txt"] in NADA: o["txt"] = NADA[o["txt"]]
            it["estado"] = "corregido por PSP-SR (RT-CHF-001-R v1.1), pendiente de supervisora"
    for lst in B["variantes"]["8-zona"].values():
        for it in lst:
            for e in it.get("etapas", []):
                if e.get("imprevisto"):
                    for o in e["opciones"]:
                        if o["id"] == "nada" and o["txt"] in NADA: o["txt"] = NADA[o["txt"]]
    for r in R["recetas"]:
        if r["id"] == "locro": r["nombre"] = "Locro de verduras"
        if r["id"] == "fideos_salsa": r["sin_tacc"] = "fideos_sin_tacc"
        if r["id"] == "yogur_cereales": r["sin_tacc"] = "cereales_sin_tacc"
        if r["id"] == "pizza":
            for p in r["pasos"]:
                if p["texto"] == "Mezclar harina y levadura": p["texto"] = "Mezclar harina, levadura, agua y sal"
            for i in ("agua", "sal"):
                if i not in r["ingredientes"]: r["ingredientes"].append(i)
    R["estado"] = B["estado"] = "corregido por PSP-SR (B1 y B2 de RT-CHF-001-R v1.1); pendiente de supervisora"


def extras(R, B, ING, log):
    """Lo que el anexo deja a DEV-IA: campos para el validador, sección 3, sección 4, O6 y el estado clínico de cada ítem."""
    corregidos = set()
    def item(iid):
        for lst in B["variantes"][iid.rsplit("-", 1)[0]].values():
            for it in lst:
                if it["id"] == iid: return it
        raise KeyError(iid)
    # Campos para la regla de riesgo heredado (B1.3) y para cruzar faltantes con la receta (B2)
    def marca(p):
        t = p.get("texto")
        if "accion" in p and t in RECIPIENTE: p["recipiente"] = RECIPIENTE[t]
        if "accion" in p and t in ENFRIA: p["enfria"] = True
        if p.get("imprevisto") and p.get("consigna") in FALT_ING: p["falta"] = FALT_ING[p["consigna"]]
    for r in R["recetas"]: _walk(r["pasos"], marca)
    _walk(B["variantes"], marca)
    for r in R["recetas"]:
        for f in r["faltantes_posibles"]: f["ingrediente"] = FALT_ING[f["consigna"]]
    # Sección 4: la zanahoria del paso del adulto da zanahoria rallada (en 3–5 nunca hay zanahoria en trozos)
    for r in R["recetas"]:
        for p in r["pasos"]:
            if p.get("ingrediente") == "zanahoria" and "zanahoria_rallada" in r["ingredientes"]: p["resultado"] = "zanahoria_rallada"
        r["estado_clinico"] = VALIDADO   # sección 4: las 16 validadas con sus correcciones, pendientes de la supervisora
    # B2.3: las opciones claras también en los imprevistos generales que el anexo copió antes de reescribirlas (8-espacio-d5 y d8)
    def nada(e):
        if e.get("imprevisto"):
            for o in e.get("opciones", []):
                if o["id"] == "nada" and o["txt"] in NADA: o["txt"] = NADA[o["txt"]]; log.append(f"B2.3 | opción «{o['txt']}»")
    _walk(B["variantes"], nada)
    # Sección 4: el paso de la pizza también cambia en los ítems que lo copian (el anexo lo cambió solo en la receta)
    def pizza(p):
        if p.get("texto") == "Mezclar harina y levadura": p["texto"] = "Mezclar harina, levadura, agua y sal"
        if p.get("txt") == "Mezclar harina y levadura": p["txt"] = "Mezclar harina, levadura, agua y sal"
    _walk(B["variantes"], pizza)
    # Sección 3
    for iid in ["6-espacio-f1", "6-espacio-f2", "6-espacio-f3", "6-espacio-f4"]:
        item(iid)["pista1"] = "¿Qué se usa para eso en la cocina?"; corregidos.add(iid)
    t = item("4-zona-f4")
    t["pasos"] = [{"id": "p0", "txt": "El adulto tuesta el pan", "accion": "cocinar", "utensilio": "hornalla", "adulto": True},
                  {"id": "p1", "txt": "Untar el queso", "accion": "untar", "utensilio": "cuchillo_untar", "adulto": False},
                  {"id": "p2", "txt": "Servir", "accion": "servir", "utensilio": "plato", "adulto": False}]
    corregidos.add("4-zona-f4")
    for iid in ["1-zona-i1", "1-zona-i2", "1-zona-i3", "1-zona-i4"]:
        item(iid)["consigna"] = "Separá las recetas dulces de las saladas."; corregidos.add(iid)
    item("3-espacio-i5")["ok"] = "Calculaste el descuento y lo restaste."; corregidos.add("3-espacio-i5")
    item("6-espacio-d5")["consigna"] = "Armá las instrucciones para que otra persona haga la salsa."; corregidos.add("6-espacio-d5")
    corregidos |= {"7-zona-d3", "7-espacio-i4", "8-zona-d2"}
    corregidos |= {it["id"] for lst in B["variantes"]["8-espacio"].values() for it in lst}
    for lst in (l for g in B["variantes"].values() for l in g.values()):
        for it in lst:
            it["estado_clinico"] = CORREGIDO if it["id"] in corregidos else VALIDADO
            if it["id"] not in corregidos: it["estado"] = "validado por PSP-SR (RT-CHF-001-R v1.1), pendiente de supervisora"
    log.append(f"estado clínico: {len(corregidos)} corregidos a revisar por PSP-SR")
    return corregidos

"""«Chef en Acción»: correcciones de PSP-SR en RT-CHF-001-R v1.2, aplicadas sobre el banco que deja chef_psp_v11.

- C1: cada receta declara `sabor` («dulce», «salado» o «los dos»). Las de «los dos» (tostadas y tortas fritas) nunca entran
  en un ítem de dulce o salado. Si la receta del ítem es de «los dos», la consigna pasa a «Elegí una receta para la merienda.».
- C2: el ingrediente que falta en un imprevisto sale de la lista del Rincón 2 del mismo ítem; si la receta no tiene otro
  faltante posible, la lista incluye el que falta. El imprevisto va después de la búsqueda.
- C3: empanadas y tortas fritas enfrían dentro del paso del adulto (`enfria`), con `produce` y `usa` para el validador.
- C4: la situación de 13–18 no da por sentada la familia.
- Estado clínico: 194 «validado por PSP-SR» y 19 «corregido, a revisar por PSP-SR».
Nada de esto es un registro de aprobación de la supervisora.
"""
import chef_psp_v11 as v11

VALIDADO = "validado por PSP-SR"
CORREGIDO = "corregido según RT-CHF-001-R v1.2, a revisar por PSP-SR"
ESTADO_OK = "validado por PSP-SR (RT-CHF-001-R v1.2), pendiente de supervisora"
ESTADO_CORR = "corregido por DEV-IA según RT-CHF-001-R v1.2, a revisar por PSP-SR"

# Sección 6 de la respuesta: los 19 ítems a corregir (15 de los corregidos y 4 reabiertos por C1)
A_CORREGIR = {"1-zona-i1", "1-zona-i4", "1-espacio-f4", "8-zona-f2", "8-zona-i3", "8-zona-i4",
              "8-espacio-f5", "8-espacio-f7", "8-espacio-i1", "8-espacio-i3", "8-espacio-i4", "8-espacio-i8", "8-espacio-i9",
              "8-espacio-d1", "8-espacio-d3", "8-espacio-d4", "8-espacio-d5", "8-espacio-d6", "8-espacio-d7"}

LOS_DOS = {"tostadas", "tortas_fritas"}
DULCES = {"ensalada_frutas", "yogur_cereales", "bolitas_coco", "bizcochuelo", "galletitas", "panqueques"}
def sabor(rid): return "los dos" if rid in LOS_DOS else "dulce" if rid in DULCES else "salado"
MERIENDA = "Elegí una receta para la merienda."
# Recetas que no son de merienda, para la otra opción cuando la consigna es la merienda
NO_MERIENDA = ["fideos_salsa", "arroz_verduras", "tarta_verdura"]

# C3: el adulto enfría dentro de su paso (misma cantidad de pasos que antes)
C3 = {
 "Cocinar el relleno": dict(texto="El adulto cocina el relleno y lo deja enfriar", actor="adulto", enfria=True, produce="relleno"),
 "Freír en la sartén": dict(texto="El adulto fríe las tortas y las deja entibiar", actor="adulto", enfria=True, produce="tortas"),
}
USA = {"Rellenar las tapas": "relleno"}   # y «Servir» en tortas fritas usa «tortas»

C4 = "El domingo cocinás para varias personas. Falta un ingrediente y viene alguien más."
# El texto de PSP-SR tiene 83 caracteres y la regla de 13–18 admite hasta 80 en la consigna: la situación lleva el texto completo
# y la consigna su primera oración (los dos imprevistos ya dicen lo demás). Pregunta T20 a PSP-SR.
C4_CONSIGNA = "El domingo cocinás para varias personas."


def _todos(B):
    return [it for g in B["variantes"].values() for lst in g.values() for it in lst]


def aplicar(R, B, log):
    REC = {r["id"]: r for r in R["recetas"]}
    # ---------- C1: sabor por receta ----------
    for r in R["recetas"]:
        r["sabor"] = sabor(r["id"]); r.pop("dulce", None)
    # ---------- C3: recetas y todos los pasos que las copian ----------
    def c3(p):
        t = p.get("texto"); tx = p.get("txt")
        if "accion" in p and t in C3:
            ch = C3[t]; p.update(ch); p["recipiente"] = "sarten"; log.append(f"C3 | «{t}» -> «{ch['texto']}»")
        elif tx in C3:
            p["txt"] = C3[tx]["texto"]; p["adulto"] = True
        if "accion" in p and p.get("texto") in USA: p["usa"] = USA[p["texto"]]
    v11._walk(R["recetas"], c3); v11._walk(B["variantes"], c3)
    for r in R["recetas"]:
        if r["id"] == "tortas_fritas":
            for p in r["pasos"]:
                if p["texto"] == "Servir": p["usa"] = "tortas"
    def servir_tortas(it):
        if it.get("receta") == "tortas_fritas":
            for p in it.get("pasos", []) + [q for e in it.get("etapas", []) for q in e.get("pasos", [])]:
                if p.get("texto") == "Servir" and "accion" in p: p["usa"] = "tortas"
    for it in _todos(B): servir_tortas(it)

    # ---------- C1 en los ítems ----------
    giro = {"n": 0}
    def otra(sab, horno, rutas, fuera):
        pool = [r for r in R["recetas"] if r["sabor"] == sab and r["horno"] == horno and set(rutas) <= set(r["rutas"]) and r["id"] not in fuera]
        if not pool: pool = [r for r in R["recetas"] if r["sabor"] == sab and set(rutas) <= set(r["rutas"]) and r["id"] not in fuera]
        x = pool[giro["n"] % len(pool)]; giro["n"] += 1
        return x["id"]
    def no_merienda(rutas, fuera):
        pool = [i for i in NO_MERIENDA if set(rutas) <= set(REC[i]["rutas"]) and i not in fuera]
        x = pool[giro["n"] % len(pool)]; giro["n"] += 1
        return x
    def elegir_sabor(e, it):
        m = __import__("re").search(r"receta (dulce|salada)", e.get("consigna", ""))
        if not m or e.get("formato") != "elegir": return
        pedido = "dulce" if m.group(1) == "dulce" else "salado"; contrario = "salado" if pedido == "dulce" else "dulce"
        ids = [o["receta"] for o in e["opciones"] if o.get("receta")]
        correcta = e.get("correcta")
        if correcta in LOS_DOS:
            e["consigna"] = e["consigna"].replace(m.group(0), "receta para la merienda") if "sin horno" in e["consigna"] else MERIENDA
            for o in e["opciones"]:
                if o["id"] != correcta and (o["receta"] in LOS_DOS or o["receta"] not in NO_MERIENDA):
                    n = no_merienda(it["rutas"], ids); log.append(f"C1 | {it['id']} | consigna de merienda; opción {o['receta']} -> {n}")
                    o["id"] = o["receta"] = n; ids.append(n)
            log.append(f"C1 | {it['id']} | «{m.group(0)}» -> merienda (receta {correcta})")
            return
        for o in e["opciones"]:
            if o.get("receta") in LOS_DOS:
                n = otra(contrario, REC[o["receta"]]["horno"], it["rutas"], ids)
                log.append(f"C1 | {it['id']} | opción {o['receta']} -> {n}")
                o["id"] = o["receta"] = n; ids.append(n)
    for it in _todos(B):
        if it.get("formato") == "clasificar" and {c["id"] for c in it.get("canastas", [])} == {"dulce", "salado"}:
            ids = [f["receta"] for f in it["fichas"]]
            for f in it["fichas"]:
                if f["receta"] in LOS_DOS:
                    n = otra(f["destino"].replace("salado", "salado"), REC[f["receta"]]["horno"], it["rutas"], ids)
                    log.append(f"C1 | {it['id']} | ficha {f['receta']} -> {n}")
                    f["id"] = f["receta"] = n; ids.append(n)
        elegir_sabor(it, it)
        for e in it.get("etapas", []): elegir_sabor(e, it)

    # ---------- C4 ----------
    for it in _todos(B):
        if it.get("situacion", "").startswith("Cocinás para tu familia el domingo"):
            it["situacion"] = C4; it["consigna"] = C4_CONSIGNA; log.append(f"C4 | {it['id']} | situación -> «{C4}»")

    # ---------- C2: el faltante sale de la lista del Rincón 2 ----------
    for it in _todos(B):
        et = it.get("etapas") or []
        r2 = next((e for e in et if e["rincon"] == 2 and e.get("lista")), None)
        if not r2: continue
        rid = it["receta"]
        for e in [x for x in et if x.get("imprevisto")]:
            if not e.get("falta") and e["consigna"].startswith("Falta un ingrediente: no hay "):   # muestra de 13–18
                e["falta"] = e["consigna"].rsplit(" ", 1)[-1].rstrip(".")
            f = e.get("falta")
            if not f: continue
            if f not in r2["lista"]:
                usados = {x.get("falta") for x in et if x.get("imprevisto")}
                alt = [x for x in REC[rid]["faltantes_posibles"] if x["ingrediente"] in r2["lista"] and x["ingrediente"] not in usados]
                if alt:
                    a = alt[0]; vieja = e["consigna"]; e["consigna"] = a["consigna"]; e["falta"] = a["ingrediente"]
                    for o in e["opciones"]:
                        if o["id"] == "reemplazar": o["txt"] = a["reemplazo"]
                    log.append(f"C2 | {it['id']} | «{vieja}» -> «{a['consigna']}» (está en la lista)")
                else:
                    r2["lista"].append(f)
                    if f not in r2["escena"]: r2["escena"].insert(len(r2["escena"]) // 2, f)
                    log.append(f"C2 | {it['id']} | la lista suma {f}")
            # El imprevisto va después de la búsqueda del Rincón 2
            if et.index(e) < et.index(r2):
                et.remove(e); et.insert(et.index(r2) + 1, e); log.append(f"C2 | {it['id']} | «{e['consigna']}» pasa después del Rincón 2")

    # ---------- Estado clínico ----------
    n = {"ok": 0, "corr": 0}
    for it in _todos(B):
        if it["id"] in A_CORREGIR:
            it["estado_clinico"] = CORREGIDO; it["estado"] = ESTADO_CORR; n["corr"] += 1
        else:
            it["estado_clinico"] = VALIDADO
            it["estado"] = ESTADO_OK
            n["ok"] += 1
    R["estado"] = B["estado"] = "corregido según RT-CHF-001-R v1.2 (C1 a C4); pendiente de PSP-SR (19 ítems) y de la supervisora"
    log.append(f"estado clínico: {n['ok']} validados, {n['corr']} corregidos a revisar por PSP-SR")
    return n

"""«Chef en Acción» · correcciones de RT-CHF-001-R v1.4 (sección 3) sobre el banco v0.2.0.

Se aplican después de `chef_v020.ampliar` y antes de O1. Cambian solo los ítems que PSP-SR pidió corregir; el resto del banco
queda igual, byte por byte (las plantillas de v0.2.0 siguen sacando los mismos números al azar, y estos ítems se rehacen acá).
Las reglas nuevas quedan en el validador (Motor.validarBanco), para que ningún ítem futuro vuelva a tener el problema.

- 6-espacio-f5 a f12: pista «¿Qué se usa para eso en la cocina?» (la de la v1.1). Regla: ningún texto con «en tu casa» ni «tu familia».
  La regla alcanza también a 1-espacio-i5 («Hay juntada en tu casa.»), validado en v0.1.3: se corrige y se pregunta a PSP-SR.
- 4-zona-d5 a d12: el paso cambiado de lugar se reparte entre el primer par, el del medio y el último, siempre con pasos que no se pueden invertir.
- 1-espacio-d12: par con porciones y tiempo distintos (ensalada verde 4, corta; empanadas 12, larga).
- 8-espacio-d11: el segundo faltante usaba un ingrediente que ya faltaba; pasa a «Se terminó el presupuesto.».
- 1-zona-d8: «¿Cuáles llevan huevo?» en lugar de «sal».
- 4-espacio-i13: «Lavar el bol y las cucharas».
- 3-zona-d7 y d8: «Para dos tortas necesitamos 14 huevos.» y «Para tres tortas necesitamos 18 huevos.».
- Estado clínico: los 350 nuevos y los 7 cambiados que PSP-SR validó pasan a «validado por PSP-SR»; los corregidos, «a revisar».
"""
import json, random

VALIDADO = "validado por PSP-SR"
ESTADO_OK = "validado por PSP-SR (RT-CHF-001-R v1.4), pendiente de aprobación de la supervisora"
CORR = "corregido según RT-CHF-001-R v1.4, a revisar por PSP-SR"
PISTA_COCINA = "¿Qué se usa para eso en la cocina?"
# 4-zona Difícil: par cambiado de lugar (0 = primer par, 1 = el del medio, 2 = el último). Con d1 a d4 quedan 4 de cada uno.
PAR_4ZD = {"4-zona-d5": 1, "4-zona-d6": 0, "4-zona-d7": 2, "4-zona-d8": 1, "4-zona-d9": 0, "4-zona-d10": 2, "4-zona-d11": 1, "4-zona-d12": 2}
PRESUPUESTO = ([{"id": "menos", "txt": "Comprar menos cosas"}, {"id": "cambiar", "txt": "Cambiar de receta"}, {"id": "nada", "txt": "Pagar igual, aunque no alcance"}], ["menos", "cambiar"])


def _todos(B):
    for gs in B["variantes"].values():
        for lst in gs.values():
            yield from lst


def aplicar(R, B, V020, log):
    rnd = random.Random(14)
    REC = {r["id"]: r for r in R["recetas"]}
    IT = {it["id"]: it for it in _todos(B)}
    corregidos = []
    def corr(iid, que):
        corregidos.append(iid); log.append(f"v1.4 | {iid} | {que}")

    # 6-espacio-f5 a f12: pista
    for k in range(5, 13):
        it = IT[f"6-espacio-f{k}"]; assert "en tu casa" in it["pista1"]
        it["pista1"] = PISTA_COCINA; corr(it["id"], f"pista «{PISTA_COCINA}»")
    # 1-espacio-i5: la misma regla
    it = IT["1-espacio-i5"]; assert it["consigna"].startswith("Hay juntada en tu casa.")
    it["consigna"] = it["consigna"].replace("Hay juntada en tu casa.", "Hoy hay juntada."); corr(it["id"], f"consigna «{it['consigna']}»")

    # 4-zona-d5 a d12: el error en distintos lugares
    for iid, k in PAR_4ZD.items():
        it = IT[iid]; rec = REC[it["receta"]]
        pasos = [{"id": f"p{i}", "txt": p["texto"]} for i, p in enumerate(rec["pasos"][:4])]
        assert k + 1 in rec["pasos"][k]["antes_de"], (iid, "pasos que se pueden invertir")
        mal = pasos[:]; mal[k], mal[k + 1] = mal[k + 1], mal[k]
        it["secuencia"] = [p["txt"] for p in mal]; it["opciones"] = [dict(p) for p in mal]; it["correctas_una_de"] = [mal[k]["id"], mal[k + 1]["id"]]
        corr(iid, f"el error pasa al {['primer par', 'par del medio', 'último par'][k]}: «{mal[k]['txt']}» y «{mal[k + 1]['txt']}»")

    # 1-espacio-d12: porciones y tiempo distintos
    it = IT["1-espacio-d12"]; a, b = "ensalada_verde", "empanadas"; A, Bq = REC[a], REC[b]
    assert A["tiempo"] != Bq["tiempo"] and A["porciones"] != Bq["porciones"]
    it["opciones"] = [{"id": a, "receta": a}, {"id": b, "receta": b}]
    it["validas"] = [[a, "rapido"], [b, "alcanza"] if Bq["porciones"] > A["porciones"] else [a, "alcanza"], [a, "tenemos"], [b, "tenemos"]]
    corr(it["id"], f"par {a} ({A['porciones']}, {A['tiempo']}) y {b} ({Bq['porciones']}, {Bq['tiempo']})")

    # 8-espacio-d11: el segundo faltante no puede reemplazarse con lo que ya faltó
    it = IT["8-espacio-d11"]; imps = [e for e in it["etapas"] if e.get("imprevisto") and e.get("falta")]
    assert len(imps) == 2 and imps[1]["falta"] == "queso_untable"
    e = imps[1]; o, v = PRESUPUESTO
    for key in ("falta",): e.pop(key)
    e.update(consigna="Se terminó el presupuesto.", opciones=json.loads(json.dumps(o)), correctas=list(v))
    corr(it["id"], "el segundo faltante («No hay queso untable.») pasa a «Se terminó el presupuesto.»")

    # 1-zona-d8: sin ingredientes que casi todo lleva
    it = IT["1-zona-d8"]; assert it["consigna"] == "¿Cuáles llevan sal?"
    EN68 = [r["id"] for r in R["recetas"] if "6-8" in r["rutas"]]
    d1 = set(IT["1-zona-d1"]["correctas"])   # 1-zona-d1 ya pregunta por el huevo: otras recetas, para no repetir el ítem
    con = [x for x in EN68 if "huevo" in REC[x]["ingredientes"] and x not in d1][:2] + [x for x in EN68 if "huevo" in REC[x]["ingredientes"] and x in d1][:1]
    sin = rnd.sample([x for x in EN68 if "huevo" not in REC[x]["ingredientes"]], 2); ops = con + sin; rnd.shuffle(ops)
    it.update(consigna="¿Cuáles llevan huevo?", opciones=[{"id": i, "receta": i} for i in ops], correctas=con)
    corr(it["id"], f"«¿Cuáles llevan huevo?» (correctas: {', '.join(con)})")

    # 4-espacio-i13: lavado sin filo
    it = IT["4-espacio-i13"]; o = next(x for x in it["opciones"] if x["id"] == "ok"); assert o["txt"] == "Lavar los utensilios"
    o["txt"] = "Lavar el bol y las cucharas"; corr(it["id"], "«Lavar el bol y las cucharas»")

    # 3-zona-d7 y d8: la cantidad se justifica en la situación
    for iid, viejo, nuevo in [("3-zona-d7", "La receta pide 14 huevos.", "Para dos tortas necesitamos 14 huevos."), ("3-zona-d8", "La receta pide 18 huevos.", "Para tres tortas necesitamos 18 huevos.")]:
        it = IT[iid]; assert it["consigna"] == viejo; it["consigna"] = nuevo; corr(iid, f"«{nuevo}»")

    # Estado clínico
    nuevos, cambiados = set(V020["nuevos"]), set(V020["cambiados"])
    n = {"validados_v14": 0, "corregidos": 0}
    for it in _todos(B):
        if it["id"] in corregidos:
            it["estado_clinico"] = CORR; it["estado"] = CORR; n["corregidos"] += 1
        elif it["id"] in nuevos or it["id"] in cambiados:
            it["estado_clinico"] = VALIDADO; it["estado"] = ESTADO_OK; n["validados_v14"] += 1
    R["estado"] = B["estado"] = f"validado por PSP-SR en RT-CHF-001-R v1.4, salvo {n['corregidos']} ítems corregidos a revisar; pendiente de la supervisora"
    log.append(f"v1.4 | estado: {n['validados_v14']} validados en v1.4, {n['corregidos']} corregidos a revisar por PSP-SR")
    return dict(ids=corregidos, **n)

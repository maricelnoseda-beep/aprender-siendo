"""«Chef en Acción» · banco v0.2.0 (RT-CHF-001-R v1.3, sección 4; T12).

Parte del banco v0.1.3 validado por PSP-SR (213 ítems) y lo amplía hasta los mínimos de T12:
12 ítems por variante y grado en 6–8 y 9–12, y 8 en 3–5 donde la ficha ofrece esa ruta.

Reglas fijas del generador (todas validadas por PSP-SR):
- B1 y C3: los pasos salen de las recetas corregidas (calor, filo, enfriado).
- B2: imprevistos de faltante tomados de los faltantes posibles de la receta; situación admitida por la receta.
- C1 y T21: dulce o salado solo con recetas de sabor «dulce» o «salado». La otra opción es del sabor contrario y con la misma
  condición de horno. Si la receta es de «los dos», la consigna es «Elegí una receta para la merienda.» y la otra opción es un plato de cena.
- C2 y T22: el faltante está en la lista del Rincón 2 y su imprevisto va después de esa búsqueda.
- Harina (RT-CHF-001-R v1.3, 1): la opción incorrecta del imprevisto de la harina es siempre «Volver sin comprar».
- O9: «Hoy hay un cumpleaños.» y «Vienen visitas a cenar.».
Los ítems nuevos quedan «pendiente de PSP-SR» para la revisión por muestra (T10). Nada de esto es un registro de aprobación.
"""
import json, random

PEND = "pendiente de PSP-SR (banco v0.2.0, revisión por muestra T10)"
VALIDADO = "validado por PSP-SR"
CORR = "corregido según RT-CHF-001-R v1.3 (O9 u opción de la harina), a revisar por PSP-SR"
MERIENDA = "Elegí una receta para la merienda."
NO_MERIENDA = ["fideos_salsa", "arroz_verduras", "tarta_verdura"]
O9 = {"Es el cumpleaños de la abuela.": "Hoy hay un cumpleaños.", "Vienen los primos a cenar.": "Vienen visitas a cenar."}
HARINA = "El súper no tiene la harina de siempre."
GR = ["facil", "intermedio", "dificil"]
MIN = {"3-5": 8, "6-8": 12, "9-12": 12}
NADA_GENERAL = {"Se terminó el presupuesto.": ([{"id": "menos", "txt": "Comprar menos cosas"}, {"id": "cambiar", "txt": "Cambiar de receta"}, {"id": "nada", "txt": "Pagar igual, aunque no alcance"}], ["menos", "cambiar"]),
                "Vienen dos amigos más.": ([{"id": "adaptar", "txt": "Hacer más cantidad"}, {"id": "cambiar", "txt": "Hacer algo que rinda más"}, {"id": "nada", "txt": "Hacer la misma cantidad"}], ["adaptar", "cambiar"])}


def _walk(o, fn):
    if isinstance(o, dict):
        fn(o)
        for v in o.values(): _walk(v, fn)
    elif isinstance(o, list):
        for v in o: _walk(v, fn)


def ampliar(G, R_, log):
    """G: globales del generador (add, ING, UT, ALACENA, HELADERA, FV, REGLAS, ops, nomb, banco, DISP). R_: {"recetas", "situaciones"}."""
    rnd = random.Random(20)
    add0, ING, UT, ALA, HEL = G["add"], G["ING"], G["UT"], G["ALACENA"], G["HELADERA"]
    banco, ops, nomb, DISP = G["banco"], G["ops"], G["nomb"], G["DISP"]
    REC = {r["id"]: r for r in R_["recetas"]}
    SIT = R_["situaciones"]
    EN68 = [r["id"] for r in R_["recetas"] if "6-8" in r["rutas"]]
    EN35 = [r["id"] for r in R_["recetas"] if "3-5" in r["rutas"]]

    # ---------- Cambios sobre el banco validado ----------
    cambiados = set()
    for vieja, nueva in O9.items():
        SIT[nueva] = SIT.pop(vieja)
    for vid, gs in banco.items():
        for g, lst in gs.items():
            for it in lst:
                if it.get("situacion") in O9:
                    v = it["situacion"]; it["situacion"] = O9[v]
                    if it.get("consigna") == v: it["consigna"] = O9[v]
                    cambiados.add(it["id"]); log.append(f"O9 | {it['id']} | «{v}» -> «{O9[v]}»")
                for e in it.get("etapas", []):
                    if e.get("imprevisto") and e.get("consigna") == HARINA:
                        for o in e["opciones"]:
                            if o["id"] == "nada" and o["txt"] != "Volver sin comprar":
                                log.append(f"harina | {it['id']} | «{o['txt']}» -> «Volver sin comprar»"); o["txt"] = "Volver sin comprar"; cambiados.add(it["id"])
                if it["id"] in cambiados:
                    it["estado_clinico"] = CORR; it["estado"] = CORR
                elif it.get("estado_clinico") != VALIDADO:   # los 19 que RT-CHF-001-R v1.3 validó
                    it["estado_clinico"] = VALIDADO; it["estado"] = "validado por PSP-SR (RT-CHF-001-R v1.3), aprobado por la supervisora en v0.1.3 (APR-CHF-001)"
    log.append(f"banco validado: {len(cambiados)} ítems cambiados por O9 o por la opción de la harina")

    nuevos = []
    def add(vid, g, it):
        it = dict(it); it["estado"] = PEND; it["estado_clinico"] = "pendiente de PSP-SR"; it["nuevo_v020"] = True
        add0(vid, g, it)
        nuevo = banco[vid][g][-1]; nuevo["estado"] = PEND; nuevos.append(nuevo["id"])
        if vid == "2-espacio" and g == "facil" and len(nuevo.get("lista", [])) > 2: nuevo["rutas"] = [r for r in nuevo["rutas"] if r != "3-5"]
        return nuevo
    S = lambda xs, n: rnd.sample(xs, n)
    sab = lambda rid: REC[rid]["sabor"]
    def pasos_txt(rid):
        return [{"id": f"p{i}", "txt": p["texto"], "accion": p["accion"], "utensilio": p["utensilio"], "adulto": p["actor"] == "adulto"} for i, p in enumerate(REC[rid]["pasos"])]
    def copia(x): return json.loads(json.dumps(x))
    def otra_sabor(rid, rutas, fuera):   # T21
        contrario = "salado" if sab(rid) == "dulce" else "dulce"
        pool = [x for x in REC if sab(x) == contrario and REC[x]["horno"] == REC[rid]["horno"] and set(rutas) <= set(REC[x]["rutas"]) and x not in fuera] \
            or [x for x in REC if sab(x) == contrario and set(rutas) <= set(REC[x]["rutas"]) and x not in fuera]
        return rnd.choice(pool)
    def rincon1(rid, rutas):
        if sab(rid) == "los dos":
            o = rnd.choice([x for x in NO_MERIENDA if set(rutas) <= set(REC[x]["rutas"])])
            return dict(rincon=1, formato="elegir", tipo_error="categoria_cruzada", consigna=MERIENDA, opciones=[{"id": rid, "receta": rid}, {"id": o, "receta": o}], correcta=rid, ok="Elegiste la receta.")
        o = otra_sabor(rid, rutas, [rid])
        return dict(rincon=1, formato="elegir", tipo_error="categoria_cruzada", consigna=f"Elegí una receta {'dulce' if sab(rid) == 'dulce' else 'salada'}.",
                    opciones=S([{"id": rid, "receta": rid}, {"id": o, "receta": o}], 2), correcta=rid, ok="Elegiste la receta.")
    def rutas_de(vid, g, rid=None):
        rs = [r for r in ("3-5", "6-8", "9-12") if g in DISP[vid][r]]
        return [r for r in rs if not rid or r in REC[rid]["rutas"]]

    # ---------- Rincón 1 ----------
    pares = [(d, s) for d in EN35 for s in EN35 if sab(d) == "dulce" and sab(s) == "salado"]
    for k, (d, s) in enumerate(S(pares, 8)):
        pide = "dulce" if k % 2 == 0 else "salado"; c = d if pide == "dulce" else s
        add("1-zona", "facil", dict(formato="elegir", receta=c, tipo_error="categoria_cruzada", consigna="¿Cuál es dulce?" if pide == "dulce" else "¿Cuál es salada?",
            opciones=S([{"id": d, "receta": d}, {"id": s, "receta": s}], 2), correcta=c, pista1="Pensá: ¿lleva azúcar o fruta?", ok="Miraste qué lleva cada receta."))
    DS = [x for x in EN35 if sab(x) == "dulce"]; SS = [x for x in EN35 if sab(x) == "salado"]
    for k in range(8):
        el = S(DS, 2 + k % 2) + S(SS, 2 + (k + 1) % 2)
        add("1-zona", "intermedio", dict(formato="clasificar", consigna="Separá las recetas dulces de las saladas.", canastas=[{"id": "dulce", "txt": "Dulce"}, {"id": "salado", "txt": "Salado"}],
            fichas=[{"id": x, "receta": x, "destino": sab(x)} for x in S(el, len(el))], ok="Ordenaste las recetas por su sabor."))
    for ing in ["azucar", "cebolla", "manteca", "sal", "tomate_tri", "dulce_leche", "aceite", "banana"]:
        con = [x for x in EN68 if ing in REC[x]["ingredientes"]][:3]; sin = S([x for x in EN68 if ing not in REC[x]["ingredientes"]], 2)
        add("1-zona", "dificil", dict(formato="elegir", multiple=True, consigna=f"¿Cuáles llevan {nomb(ing)}?", mostrar_ingredientes=True,
            opciones=[{"id": i, "receta": i} for i in S(con + sin, len(con + sin))], correctas=con, pista1="Mirá los ingredientes de cada tarjeta.", ok="Revisaste los ingredientes de cada receta."))
    for k in range(8):
        pide = "dulce" if k % 2 == 0 else "salado"
        okp = [x for x in EN68 if sab(x) == pide and not REC[x]["horno"]]; c = okp[k // 2 % len(okp)]
        mismo_horno = [x for x in EN68 if sab(x) == pide and REC[x]["horno"]]; contra = [x for x in EN68 if sab(x) not in (pide, "los dos") and not REC[x]["horno"]]
        op = [c, rnd.choice(mismo_horno), rnd.choice(contra)]
        add("1-espacio", "facil", dict(formato="elegir", receta=c, tipo_error="condicion_negativa", mostrar_ingredientes=True, consigna=f"Elegí una receta {'dulce' if pide == 'dulce' else 'salada'} sin horno.",
            opciones=[{"id": x, "receta": x} for x in S(op, 3)], correcta=c, pista1="Fijate dos cosas: el sabor y el horno.", ok="Tuviste en cuenta las dos condiciones."))
    for amigos, hay, c in [(4, ["banana", "naranja"], "ensalada_frutas"), (3, ["harina", "leche"], "panqueques"), (4, ["fideos", "tomate_tri"], "fideos_salsa"), (2, ["arroz", "choclo"], "arroz_verduras"),
                           (2, ["pan", "mermelada"], "tostadas"), (6, ["harina", "aceite"], "tortas_fritas"), (4, ["lechuga", "aceite"], "ensalada_verde"), (2, ["yogur", "banana"], "yogur_cereales")]:
        assert set(hay) <= set(REC[c]["ingredientes"]) and not REC[c]["horno"]
        assert [x for x in EN68 if set(hay) <= set(REC[x]["ingredientes"]) and not REC[x]["horno"]] == [c], c
        con_horno = [x for x in EN68 if REC[x]["horno"]]; con_horno.sort(key=lambda x: -len(set(hay) & set(REC[x]["ingredientes"])))
        sin_horno = [x for x in EN68 if not REC[x]["horno"] and x != c and not set(hay) <= set(REC[x]["ingredientes"])]
        op = [c, con_horno[0], rnd.choice(sin_horno)]
        add("1-espacio", "intermedio", dict(formato="elegir", receta=c, tipo_error="condicion_omitida", mostrar_ingredientes=True, mostrar_porciones=True,
            consigna=f"Vienen {amigos}. Hay {nomb(hay[0])} y {nomb(hay[1])}. No hay horno.", pregunta="¿Qué preparamos?",
            opciones=[{"id": x, "receta": x} for x in S(op, 3)], correcta=c, pista1="Fijate qué hay y si hace falta horno.", ok="Pensaste en lo que tenemos y en el horno."))
    RAZONES = [{"id": "tenemos", "txt": "Tenemos todo"}, {"id": "rapido", "txt": "Lleva menos tiempo"}, {"id": "alcanza", "txt": "Alcanza para todos"}]
    for a, b in [("tostadas", "pizza"), ("ensalada_verde", "tarta_verdura"), ("sandwich_queso", "empanadas"), ("bolitas_coco", "bizcochuelo"),
                 ("ensalada_frutas", "panqueques"), ("yogur_cereales", "galletitas"), ("tostadas", "bizcochuelo"), ("ensalada_verde", "fideos_salsa")]:
        A, B = REC[a], REC[b]; assert A["tiempo"] == "corto" and B["tiempo"] == "largo"
        validas = [[a, "rapido"], [b, "alcanza"] if B["porciones"] > A["porciones"] else [a, "alcanza"], [a, "tenemos"], [b, "tenemos"]]
        add("1-espacio", "dificil", dict(formato="elegir", con_razon=True, mostrar_ingredientes=True, mostrar_porciones=True, mostrar_tiempo=True,
            consigna="Las dos sirven. ¿Cuál elegís?", pregunta="¿Por qué?", opciones=[{"id": a, "receta": a}, {"id": b, "receta": b}], razones=RAZONES, validas=validas,
            pista1="Mirá el tiempo y las porciones de cada una.", ok="Elegiste y diste una razón que va con tu elección."))

    # ---------- Rincón 2 ----------
    for k, obj in enumerate(["queso", "manzana", "pan", "tomate", "arroz", "naranja", "azucar", "frutilla"]):
        dis = S([i for i in ALA + HEL if i != obj and ING[i]["dib"] != ING[obj]["dib"]], 2 + k % 2)
        add("2-zona", "facil", dict(formato="buscar", consigna=f"Buscá: {nomb(obj)}.", lista=[obj], escena=S([obj] + dis, len(dis) + 1), lugar="alacena",
            pista1="Mirá la lista y buscá ese dibujo.", ok="Miraste la lista y lo encontraste."))
    for k, rid in enumerate(["tostadas", "ensalada_verde", "sandwich_queso", "yogur_cereales", "bolitas_coco", "tarta_verdura", "empanadas", "fideos_salsa"]):
        lista = REC[rid]["ingredientes"][:3]; esc = lista + S([i for i in ALA + HEL if i not in lista], 8 + k % 4)
        add("2-zona", "intermedio", dict(formato="buscar", receta=rid, consigna="Buscá lo que dice la lista.", lista=lista, escena=S(esc, len(esc)), lugar="alacena",
            pista1="Buscá de a uno, en orden.", ok="Buscaste uno por uno lo de la lista."))
    for rid in ["bizcochuelo", "galletitas", "ensalada_verde", "yogur_cereales", "bolitas_coco", "pizza", "fideos_salsa", "empanadas"]:
        ings = REC[rid]["ingredientes"]; lista = ings[:3]
        if not any(ING[i].get("parecido") for i in lista):
            con = next(i for i in ings if ING[i].get("parecido")); lista = lista[:2] + [con]
        par = [ING[i]["parecido"] for i in lista if ING[i].get("parecido") and ING[i]["parecido"] not in lista]
        esc = lista + par + S([i for i in ALA + HEL if i not in lista + par], 9)
        add("2-zona", "dificil", dict(formato="buscar", receta=rid, consigna="Buscá todo. Ojo: hay cosas parecidas.", lista=lista, escena=S(esc, len(esc)), lugar="heladera-y-alacena",
            pista1="Antes de tocar, mirá bien la forma.", ok="Te fijaste bien para no confundirte."))
    for rid in ["tostadas", "bolitas_coco", "sandwich_queso", "ensalada_verde", "yogur_cereales", "pizza", "bizcochuelo", "galletitas"]:
        lista = REC[rid]["ingredientes"][:2]; esc = lista + S([i for i in ALA + HEL if i not in lista], 5)
        add("2-espacio", "facil", dict(formato="buscar", receta=rid, recordar=True, consigna="Mirá la lista. Después buscá todo.", lista=lista, escena=S(esc, len(esc)), lugar="alacena",
            pista1="¿Cuántas cosas tenía la lista?", ok="Recordaste la lista."))
    def tfs(g, rid, lista, en, extra, consigna, agregado=None):
        fichas = [{"id": i, "ing": i, "destino": "tengo" if i in en else "falta"} for i in lista] + [{"id": i, "ing": i, "destino": "sobra"} for i in extra]
        can = [{"id": "tengo", "txt": "Tengo"}, {"id": "falta", "txt": "Falta"}] + ([{"id": "sobra", "txt": "Sobra"}] if extra else [])
        return add("2-espacio", g, dict(formato="clasificar", receta=rid, recordar=True, lista=lista, mesada=en + extra, agregado=agregado, consigna=consigna, canastas=can,
            fichas=S(fichas, len(fichas)), pista1="Mirá la mesada y pensá en la lista.", ok="Comparaste la lista con la mesada."))
    for k, rid in enumerate(["tarta_verdura", "empanadas", "fideos_salsa", "arroz_verduras", "ensalada_verde", "tostadas", "sandwich_queso", "tortas_fritas"]):
        lista = REC[rid]["ingredientes"][:4]; tfs("intermedio", rid, lista, lista[:2 + k % 2 if len(lista) > 3 else 2], [], "¿Qué tenemos y qué falta?")
    for k, (rid, o) in enumerate([("ensalada_frutas", 0), ("ensalada_verde", 0), ("bizcochuelo", 0), ("galletitas", 0), ("pizza", 0), ("fideos_salsa", 1), ("tortas_fritas", 0), ("arroz_verduras", 1)]):
        ings = REC[rid]["ingredientes"]
        base = ings[o:o + 3]; extra = ings[o + 3]; sobra = S([i for i in ALA + HEL if i not in ings], 1)
        it = tfs("dificil", rid, base, base[:2], sobra, f"Agregamos {nomb(extra)}. ¿Qué tenemos, qué falta, qué sobra?", agregado=extra)
        it["fichas"].append({"id": extra, "ing": extra, "destino": "falta"})

    # ---------- Rincón 3 ----------
    for ing, n in [("frutilla", 2), ("pera", 3), ("papa", 4), ("tomate", 5), ("huevo", 1), ("banana", 4), ("naranja", 2), ("manzana", 5)]:
        add("3-zona", "facil", dict(formato="carrito", consigna=f"Poné {n} en el carrito.", ing=ing, cantidad=n, maximo=5, pista1="Contá de a uno.", ok=f"Contaste de a uno y llegaste a {n}."))
    for k in range(8):
        ing = rnd.choice(["naranja", "manzana", "papa", "tomate", "pera", "huevo", "banana", "cebolla"]); a, b = S(range(2, 11), 2); mas = k % 2 == 0
        add("3-zona", "intermedio", dict(formato="elegir", consigna="¿En qué cajón hay más?" if mas else "¿En qué cajón hay menos?",
            opciones=[{"id": "a", "ing": ing, "cantidad": a, "txt": "Este cajón"}, {"id": "b", "ing": ing, "cantidad": b, "txt": "Este otro"}],
            correcta=("a" if a > b else "b") if mas else ("a" if a < b else "b"), tipo_error="comparacion_invertida", pista1="Contá los de cada cajón.", ok="Comparaste las dos cantidades."))
    for pide, caja, alcanza in [(10, 12, True), (12, 12, True), (14, 12, False), (18, 12, False), (3, 6, True), (7, 6, False), (5, 6, True), (9, 6, False)]:
        cual = "una docena" if caja == 12 else "media docena"
        add("3-zona", "dificil", dict(formato="elegir", tipo_error="equivalencia", consigna=f"La receta pide {pide} huevos.", pregunta=f"¿Alcanza con {cual}?", ing="huevo", cantidad_vista=caja,
            opciones=[{"id": "si", "txt": "Sí, alcanza"}, {"id": "no", "txt": "No, falta"}], correcta="si" if alcanza else "no",
            pista1="Una docena son 12." if caja == 12 else "Media docena son 6.", ok=f"Usaste que {cual} son {caja}."))
    for pide, hay, ing in [(7, 3, "huevo"), (9, 4, "manzana"), (6, 2, "banana"), (10, 6, "naranja"), (5, 3, "tomate"), (8, 1, "papa"), (4, 2, "pera"), (9, 5, "huevo")]:
        add("3-espacio", "facil", dict(formato="numero", consigna=f"Necesitamos {pide}. Tenemos {hay}.", pregunta="¿Cuántos faltan?", ing=ing, tenemos=hay, respuesta=pide - hay,
            tipo_error="calculo", error_si={str(pide + hay): "operacion_invertida"}, pista1="¿Cuántos tenés y cuántos necesitás?", ok="Pensaste cuánto faltaba."))
    for k in range(8):
        if k % 2 == 0:
            a, b = S(["leche", "harina", "azucar", "queso", "yogur", "arroz", "fideos", "pan"], 2); pa, pb = S([10, 20, 30, 40, 50, 60, 70, 80], 2)
            add("3-espacio", "intermedio", dict(formato="elegir", tipo_error="comparacion_precio", consigna="¿Cuál cuesta menos?", opciones=[{"id": a, "ing": a, "precio": pa}, {"id": b, "ing": b, "precio": pb}],
                correcta=a if pa < pb else b, pista1="Mirá los números de los precios.", ok="Comparaste los dos precios."))
        else:
            monto = [25, 60, 85, 120][k // 2]
            add("3-espacio", "intermedio", dict(formato="pagar", consigna=f"Pagá {monto} pesos.", monto=monto, billetes=[1, 2, 5, 10, 20, 50], pista1="Empezá por el billete más grande que entre.", ok="Juntaste el monto justo."))
    for presu, rid in [(150, "tostadas"), (200, "sandwich_queso"), (180, "yogur_cereales"), (250, "galletitas"), (220, "fideos_salsa"), (260, "tarta_verdura"), (240, "empanadas"), (120, "bolitas_coco")]:
        productos = []
        for i in REC[rid]["ingredientes"][:3]:
            p1 = rnd.choice([20, 30, 40, 50]); productos.append({"ing": i, "precios": [p1, p1 + rnd.choice([30, 40, 60])]})
        barato = sum(o["precios"][0] for o in productos)
        if barato > presu: presu = barato + 20
        add("3-espacio", "dificil", dict(formato="presupuesto", receta=rid, consigna=f"Tenés {presu} pesos. Elegí sin pasarte.", presupuesto=presu, productos=productos,
            pista1="Sumá lo que elegiste y comparalo con lo que tenés.", ok="Hiciste la cuenta antes de pagar.", calculadora=True))

    # ---------- Rincón 4 ----------
    for k, rid in enumerate(["sandwich_queso", "galletitas", "pizza", "bizcochuelo", "panqueques", "tortas_fritas", "empanadas", "tarta_verdura"]):
        add("4-zona", "facil", dict(formato="ordenar", receta=rid, consigna="Ordená los pasos.", pasos=pasos_txt(rid)[1:1 + 2 + k % 2], modelo_disponible=True,
            pista1="¿Qué se hace primero en la cocina?", ok="Pensaste qué va primero."))
    for rid in ["tostadas", "sandwich_queso", "yogur_cereales", "bolitas_coco", "panqueques", "tarta_verdura", "empanadas", "fideos_salsa"]:
        pasos = pasos_txt(rid)[:5]; falta = rnd.randrange(1, len(pasos) - 1)
        add("4-zona", "intermedio", dict(formato="ordenar", receta=rid, consigna="Ordená los pasos. Uno falta: elegilo.", pasos=pasos, faltante=pasos[falta]["id"],
            distractor={"id": "x", "txt": rnd.choice(["Lavar los platos", "Poner la mesa", "Apagar la luz"])}, pista1="Leé los pasos y pensá cuál no está.", ok="Encontraste el paso que faltaba."))
    for rid in ["bizcochuelo", "empanadas", "fideos_salsa", "bolitas_coco", "tortas_fritas", "arroz_verduras", "ensalada_frutas", "galletitas"]:
        pasos = pasos_txt(rid)[:4]; mal = pasos[:]; mal[2], mal[3] = mal[3], mal[2]   # siempre los dos últimos: orden que no se puede invertir
        add("4-zona", "dificil", dict(formato="elegir", receta=rid, consigna="Algo está mal. ¿Qué paso cambiarías de lugar?", secuencia=[p["txt"] for p in mal],
            opciones=[{"id": p["id"], "txt": p["txt"]} for p in mal], correctas_una_de=[mal[2]["id"], mal[3]["id"]], tipo_error="error_no_detectado",
            pista1="Leé en orden y pensá si se puede hacer así.", ok="Revisaste el orden y encontraste el error."))
    for a, b in [("Lavar la fruta", "Poner la fruta en el bol"), ("Estirar la masa", "Poner la masa en la fuente"), ("Mezclar la masa", "Estirar la masa"), ("Abrir los cereales", "Repartir los cereales"),
                 ("Batir el huevo", "Sumar la harina"), ("Formar las bolitas", "Pasarlas por coco"), ("Rellenar las tapas", "Cerrar las empanadas"), ("Poner el pan en el plato", "Poner el queso sobre el pan")]:
        add("4-espacio", "facil", dict(formato="elegir", consigna="¿Qué tiene que pasar antes?", pregunta=f"Para: «{b}».", opciones=[{"id": "a", "txt": a}, {"id": "b", "txt": b}, {"id": "c", "txt": "Servir en los platos"}],
            correcta="a", tipo_error="dependencia_rota", pista1="¿Qué hace falta para poder hacerlo?", ok="Pensaste qué hace falta antes."))
    for c, ok_, malas in [("Mientras se hornea la pizza, ¿qué podemos hacer?", "Poner la mesa", ["Sacar la pizza", "Cortar la pizza"]),
                          ("Mientras se enfría el relleno, ¿qué podemos hacer?", "Separar las tapas", ["Rellenar las tapas", "Hornear las empanadas"]),
                          ("Mientras hierve el arroz, ¿qué podemos hacer?", "Lavar la tabla", ["Servir el arroz", "Comer el arroz"]),
                          ("Mientras se hornean las galletitas, ¿qué hacemos?", "Lavar el bol", ["Sacar las galletitas", "Comer las galletitas"]),
                          ("Mientras se calienta la sartén, ¿qué podemos hacer?", "Batir el huevo y la leche", ["Servir el panqueque", "Untar el panqueque"]),
                          ("Mientras se entibian las tortas, ¿qué podemos hacer?", "Preparar los platos", ["Comer las tortas", "Servirlas calientes"]),
                          ("Mientras se tuesta el pan, ¿qué podemos hacer?", "Abrir la mermelada", ["Untar el pan", "Servir las tostadas"]),
                          ("Mientras se cocina la tarta, ¿qué podemos hacer?", "Lavar los utensilios", ["Cortar la tarta", "Servir la tarta"])]:
        opsx = [{"id": "ok", "txt": ok_}] + [{"id": f"m{j}", "txt": m} for j, m in enumerate(malas)]
        add("4-espacio", "intermedio", dict(formato="elegir", tipo_error="paralelo_no_identificado", consigna=c, opciones=S(opsx, 3), correcta="ok", pista1="¿Qué se puede hacer sin esperar?", ok="Usaste el tiempo de espera."))
    for c, ok_, malas in [("¿Qué pasa si no prendemos el horno?", "La torta no se cocina", ["Se cocina igual", "Sale más rica"]),
                          ("¿Qué pasa si no colamos los fideos?", "Quedan con agua", ["Quedan secos", "No pasa nada"]),
                          ("¿Qué pasa si no esperamos que se enfríe el relleno?", "Te podés quemar", ["Queda más frío", "No pasa nada"]),
                          ("¿Qué pasa si no lavamos la lechuga?", "Queda con tierra", ["Queda más verde", "No pasa nada"]),
                          ("¿Qué pasa si servimos el arroz sin hervir?", "Queda duro", ["Queda blando", "Queda igual"]),
                          ("¿Qué pasa si no cerramos las empanadas?", "Se sale el relleno", ["Quedan cerradas", "No pasa nada"]),
                          ("¿Qué pasa si no batimos los huevos?", "La mezcla queda despareja", ["Queda batida", "Se hornea sola"]),
                          ("¿Qué pasa si no formamos las bolitas?", "No se pueden pasar por coco", ["Quedan redondas", "No pasa nada"])]:
        opsx = [{"id": "ok", "txt": ok_}] + [{"id": f"m{j}", "txt": m} for j, m in enumerate(malas)]
        add("4-espacio", "dificil", dict(formato="elegir", consigna=c, opciones=S(opsx, 3), correcta="ok", tipo_error="consecuencia", pista1="Imaginá el paso que cambia.", ok="Anticipaste qué iba a pasar."))

    # ---------- Rincón 5 ----------
    for g, n, par in [("facil", (3, 4), False), ("intermedio", (6, 9), True), ("dificil", (6, 8), True)]:
        for k in range(8):
            obj = rnd.choice([i for i in ING if ING[i].get("parecido")] if par else list(HEL)); nn = rnd.randint(*n)
            dis = ([ING[obj]["parecido"]] if par else []) + S([i for i in ALA + HEL if i not in (obj, ING[obj].get("parecido"))], nn - 1 - (1 if par else 0))
            add("5-zona", g, dict(formato="encontrar", consigna="Encontrá el igual al modelo.", modelo=obj, opciones=ops(S([obj] + dis, len(dis) + 1)), correcta=obj,
                exposicion=g == "dificil", audio_objetivo=g == "intermedio", pista1="Mirá bien la forma del modelo.", ok="Miraste con cuidado antes de tocar."))
    for g in GR:
        for k in range(8):
            n = 6 if g == "facil" else 8
            if g == "facil": seq = (["tipo"] * (n // 2) + ["forma"] * (n - n // 2)) if k % 2 == 0 else (["forma"] * (n // 2) + ["tipo"] * (n - n // 2))
            elif g == "intermedio": seq = [("tipo" if (j // 2) % 2 == k % 2 else "forma") for j in range(n)]
            else: seq = [rnd.choice(["tipo", "forma"]) for _ in range(n)]
            add("5-espacio", g, dict(formato="regla", consigna="Mirá el gorro y ubicá cada cosa.", ensayos=[{"ing": rnd.choice(G["FV"]), "regla": r} for r in seq], aviso=g == "facil", reglas=G["REGLAS"],
                pista1="¿Qué dice el gorro ahora?", ok="Cambiaste de regla cuando cambió el gorro."))

    # ---------- Rincón 6 ----------
    for k in range(8):
        obj = rnd.choice(list(HEL)); dis = S([i for i in ALA + HEL if i != obj], 2)
        add("6-zona", "facil", dict(formato="elegir", consigna=f"Señalá: {nomb(obj)}.", opciones=ops(S([obj] + dis, 3)), correcta=obj, sin_nombre=True, audio_objetivo=True,
            tipo_error="palabra_imagen", pista1="Escuchá otra vez el nombre.", ok="Escuchaste y encontraste lo que se pedía."))
    MASC = {"bol", "plato", "colador", "batidor", "rodillo"}
    for a, b in [("fuente", "chica"), ("olla", "grande"), ("colador", "chica"), ("bol", "chica"), ("plato", "chica"), ("cuchara", "grande"), ("taza", "grande"), ("olla", "chica")]:
        adj = ("chico" if a in MASC else "chica") if b == "chica" else "grande"
        otro = rnd.choice([u for u in ["fuente", "olla", "colador", "bol", "plato", "taza", "cuchara"] if u != a])
        opsx = [{"id": "ok", "ut": a, "tam": b}, {"id": "m1", "ut": a, "tam": "chica" if b == "grande" else "grande"}, {"id": "m2", "ut": otro, "tam": b}]
        add("6-zona", "intermedio", dict(formato="elegir", consigna=f"Tocá {'el' if a in MASC else 'la'} {UT[a]['nombre']} {adj}.", opciones=S(opsx, 3), correcta="ok", sin_nombre=True,
            tipo_error="atributo_omitido", pista1="Fijate en el tamaño.", ok="Te fijaste en el objeto y en su tamaño."))
    for acc, ut, malas in [("mezclar", "cuchara", ["colador", "rodillo"]), ("medir la leche", "taza", ["plato", "colador"]), ("poner la masa", "fuente", ["taza", "colador"]), ("servir", "plato", ["colador", "rodillo"]),
                           ("dar vuelta el panqueque", "espatula", ["taza", "colador"]), ("lavar la lechuga", "colador", ["plato", "rodillo"]), ("poner la fruta", "bol", ["rodillo", "espatula"]), ("untar la mermelada", "cuchillo_untar", ["colador", "taza"])]:
        add("6-zona", "dificil", dict(formato="elegir", tipo_error="pregunta_escena", escena_chef={"accion": acc, "ut": ut}, consigna=f"¿Qué usó el chef para {acc}?", opciones=S([{"id": ut, "ut": ut}] + [{"id": m, "ut": m} for m in malas], 3),
            correcta=ut, pista1="Mirá otra vez lo que hizo el chef.", ok="Recordaste lo que viste en la escena."))
    for frase, ok_, malas in [("Para mezclar usamos la ___.", "cuchara", ["colador", "rodillo"]), ("Para estirar la masa usamos el ___.", "rodillo", ["taza", "colador"]),
                              ("Para servir usamos el ___.", "plato", ["batidor", "rodillo"]), ("Para lavar la lechuga usamos el ___.", "colador", ["rodillo", "taza"]),
                              ("Para hornear usamos la ___.", "fuente", ["taza", "colador"]), ("Para untar usamos el ___.", "cuchillo_untar", ["colador", "batidor"]),
                              ("Para dar vuelta el panqueque usamos la ___.", "espatula", ["taza", "colador"]), ("Para poner la fruta usamos el ___.", "bol", ["rodillo", "espatula"])]:
        add("6-espacio", "facil", dict(formato="elegir", consigna=frase, opciones=S([{"id": ok_, "ut": ok_, "txt": UT[ok_]["nombre"]}] + [{"id": m, "ut": m, "txt": UT[m]["nombre"]} for m in malas], 3),
            correcta=ok_, nota_adulto=None, tipo_error="palabra_equivocada", pista1="¿Qué usás para eso en tu casa?", ok="Elegiste la palabra que completa la frase."))
    for ins, seq in [("Buscá el bol y después la cuchara.", ["bol", "cuchara"]), ("Poné la manzana en el bol.", ["manzana", "bol"]), ("Buscá la harina y después la taza.", ["harina", "taza"]),
                     ("Poné el queso en el plato y después el pan.", ["queso", "plato", "pan"]), ("Buscá la olla y después los fideos.", ["olla", "fideos"]),
                     ("Poné la banana en el plato.", ["banana", "plato"]), ("Buscá la cuchara y después el yogur.", ["cuchara", "yogur"]), ("Poné el huevo en el bol y después la leche.", ["huevo", "bol", "leche"])]:
        pool = list(dict.fromkeys(seq + S([x for x in ["cuchara", "fuente", "manzana", "harina", "olla", "plato", "taza"] if x not in seq], 3)))
        add("6-espacio", "intermedio", dict(formato="secuencia_toques", consigna=ins, objetos=S(pool, len(pool)), orden=seq, pista1="Hacé primero lo primero que dijo.", ok="Seguiste las instrucciones en orden."))
    for rid in ["tostadas", "ensalada_verde", "galletitas", "pizza", "panqueques", "bizcochuelo", "tortas_fritas", "arroz_verduras"]:
        add("6-espacio", "dificil", dict(formato="ordenar", receta=rid, consigna="Armá las instrucciones para otro chef.", pasos=pasos_txt(rid)[:4], tarjetas_oracion=True,
            pista1="Pensá cómo se lo contarías a alguien.", ok="Armaste instrucciones que otro chef puede seguir."))

    # ---------- Rincón 7 ----------
    for g, rids, modelo, n in [("facil", ["sandwich_queso", "ensalada_verde", "bolitas_coco", "yogur_cereales", "tostadas", "panqueques", "galletitas", "pizza"], "permanente", 4),
                               ("intermedio", ["galletitas", "pizza", "tostadas", "bolitas_coco", "yogur_cereales", "tortas_fritas", "empanadas", "tarta_verdura"], "a_pedido", 4),
                               ("dificil", ["bizcochuelo", "panqueques", "empanadas", "tortas_fritas", "arroz_verduras", "ensalada_verde", "sandwich_queso", "tostadas"], "guia", 5)]:
        for rid in rids:
            add("7-zona", g, dict(formato="cocina", receta=rid, consigna=f"Preparemos: {REC[rid]['nombre'].lower()}.", modelo=modelo, pasos=copia(REC[rid]["pasos"][:n]),
                pista1="Mirá qué hizo el chef en este paso.", ok="Hiciste los pasos como el chef."))
    for g, rids, modelo in [("facil", ["ensalada_verde", "tostadas", "panqueques", "pizza", "galletitas", "bizcochuelo", "tarta_verdura", "fideos_salsa"], "primer_paso"),
                            ("intermedio", ["ensalada_frutas", "yogur_cereales", "bolitas_coco", "sandwich_queso", "tostadas", "ensalada_verde", "empanadas", "tortas_fritas"], "ninguno")]:
        for rid in rids:
            add("7-espacio", g, dict(formato="cocina", receta=rid, consigna=f"Preparemos: {REC[rid]['nombre'].lower()}.", modelo=modelo, pasos=copia(REC[rid]["pasos"][:5]),
                instrucciones_parciales=g == "intermedio", pista1="¿Qué hacía falta en este paso?", ok="Cocinaste con menos ayuda."))
    for rid in ["galletitas", "tarta_verdura", "empanadas", "fideos_salsa", "arroz_verduras", "tortas_fritas", "sandwich_queso", "yogur_cereales"]:
        ps = REC[rid]["pasos"]; falta = rnd.randrange(1, len(ps) - 1); hechos = [p["texto"] for j, p in enumerate(ps) if j != falta]
        add("7-espacio", "dificil", dict(formato="elegir", receta=rid, consigna="¿Falta algo?", secuencia=hechos, tipo_error="error_no_detectado",
            opciones=S([{"id": "ok", "txt": ps[falta]["texto"]}, {"id": "m1", "txt": "Lavar los platos"}, {"id": "m2", "txt": "Nada, está todo"}], 3), correcta="ok",
            pista1="Pensá qué hace falta para que salga.", ok="Revisaste lo hecho y encontraste lo que faltaba."))

    # ---------- Rincón 8 ----------
    def etapas(rid, k, rutas):
        r = REC[rid]; lista = r["ingredientes"][:3]
        return [rincon1(rid, rutas),
                dict(rincon=2, formato="buscar", consigna="Buscá lo de la lista.", lista=list(lista), escena=S(lista + S([i for i in ALA + HEL if i not in lista], 5), len(lista) + 5), lugar="alacena", ok="Juntaste los ingredientes."),
                dict(rincon=3, formato="carrito", consigna=f"Poné {3 + k % 2} en el carrito.", ing=lista[0], cantidad=3 + k % 2, maximo=5, ok="Contaste bien."),
                dict(rincon=4, formato="ordenar", consigna="Ordená los pasos.", pasos=pasos_txt(rid)[:3], modelo_disponible=True, ok="Ordenaste los pasos."),
                dict(rincon=7, formato="cocina", consigna="¡A cocinar!", modelo="a_pedido", pasos=copia(r["pasos"][:3]), ok="Preparaste la receta.")]
    for g, rids in [("facil", ["sandwich_queso", "bolitas_coco", "tostadas", "yogur_cereales", "galletitas", "ensalada_verde", "pizza", "bizcochuelo"]),
                    ("intermedio", ["sandwich_queso", "galletitas", "empanadas", "tarta_verdura", "fideos_salsa", "arroz_verduras", "tortas_fritas", "panqueques"]),
                    ("dificil", ["pizza", "bizcochuelo", "empanadas", "tortas_fritas", "arroz_verduras", "panqueques", "yogur_cereales", "bolitas_coco"])]:
        for k, rid in enumerate(rids):
            et = etapas(rid, k, rutas_de("8-zona", g, rid))
            add("8-zona", g, dict(formato="aventura", receta=rid, consigna="Hoy cocinamos de principio a fin.", situacion=f"Hoy preparamos {REC[rid]['nombre'].lower()}.",
                etapas=et if g != "facil" else [e for e in et if e["rincon"] != 3], apoyo_por_etapa={"facil": 2, "intermedio": 1, "dificil": 0}[g], ok="Hiciste toda la receta."))
    def faltante(rid, lista, usados):
        fs = [f for f in REC[rid]["faltantes_posibles"] if f["ingrediente"] not in usados]
        en = [f for f in fs if f["ingrediente"] in lista]
        f = rnd.choice(en) if en else rnd.choice(fs)
        if f["ingrediente"] not in lista: lista.append(f["ingrediente"])
        nada = "Volver sin comprar" if f["consigna"] == HARINA else "Seguir como si estuviera"
        return dict(rincon=8, formato="elegir", imprevisto=True, consigna=f["consigna"], pregunta="¿Qué hacemos?", falta=f["ingrediente"],
                    opciones=[{"id": "reemplazar", "txt": f["reemplazo"]}, {"id": "cambiar", "txt": "Cambiar de receta"}, {"id": "nada", "txt": nada}],
                    correctas=["reemplazar", "cambiar"], tipo_error="imprevisto_no_resuelto", ok="Buscaste otra opción.")
    def general(c):
        o, v = NADA_GENERAL[c]
        return dict(rincon=8, formato="elegir", imprevisto=True, consigna=c, pregunta="¿Qué hacemos?", opciones=copia(o), correctas=v, tipo_error="imprevisto_no_resuelto", ok="Buscaste otra opción.")
    sits = [s for s in SIT if s != "Llueve y nos quedamos en casa."] + ["Llueve y nos quedamos en casa."]
    for g, n_imp in [("facil", 1), ("intermedio", 2), ("dificil", 3)]:
        for k in range(4):
            sit = sits[(k * 3 + GR.index(g)) % len(sits)]
            usados = {(it["situacion"], it["receta"]) for it in banco["8-espacio"][g]}   # sin repetir situación y receta en el grado
            rid = rnd.choice([x for x in SIT[sit] if "9-12" in REC[x]["rutas"] and (sit, x) not in usados])
            et = etapas(rid, k, ["9-12"]); r2 = et[1]; lista = r2["lista"]
            imps = [faltante(rid, lista, set())]
            if n_imp >= 2: imps.append(general("Vienen dos amigos más."))
            if n_imp >= 3:
                fs2 = [f for f in REC[rid]["faltantes_posibles"] if f["ingrediente"] != imps[0]["falta"]]
                imps.append(faltante(rid, lista, {imps[0]["falta"]}) if fs2 else general("Se terminó el presupuesto."))
            for e in imps:   # T22: los de faltante, después del Rincón 2; los generales, en cualquier lugar
                desde = (et.index(r2) + 1) if e.get("falta") else 1
                hasta = next(i for i, x in enumerate(et) if x["rincon"] == 7)   # todo imprevisto pasa antes de cocinar
                et.insert(rnd.randrange(desde, hasta + 1), e)
            for i in lista:
                if i not in r2["escena"]: r2["escena"].insert(rnd.randrange(len(r2["escena"]) + 1), i)
            add("8-espacio", g, dict(formato="aventura", receta=rid, situacion=sit, consigna=sit, etapas=et, apoyo_por_etapa=0, como_salio=True, ok="Resolviste los imprevistos."))
    log.append(f"v0.2.0: {len(nuevos)} ítems nuevos")
    return dict(nuevos=nuevos, cambiados=sorted(cambiados))

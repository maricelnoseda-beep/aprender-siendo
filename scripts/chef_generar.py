#!/usr/bin/env python3
"""«Chef en Acción» (FEC-016 v0.3, RT-CHF-001 v1.0): genera el banco de recetas, el banco de ítems y la ficha técnica.

  python3 scripts/chef_generar.py   → app/herramientas/chef/recetas.json, banco.json y modulo.json

CONTENIDO DE PRUEBA NO VALIDADO. Las recetas, consignas, devoluciones y parámetros son un borrador de DEV-IA armado con los
ejemplos de la FEC-016; todo lleva «pendiente de PSP-SR». Estación, grados, disponibilidades por ruta y reglas son las de la FEC.
Prototipo v0.1.0: 4 ítems por variante y grado (la FEC pide 12 en 6–8 para el paquete de revisión; ver RT-CHF-001 Parte D).
Ningún modelo de lenguaje: todo el banco se arma con reglas fijas y semilla fija.
"""
import json, pathlib, random

raiz = pathlib.Path(__file__).resolve().parent.parent
dest = raiz / "app" / "herramientas" / "chef"
VERSION, FECHA = "0.1.0-prueba", "2026-11-21"
PEND = "pendiente de PSP-SR (prototipo v0.1.0, RT-CHF-001 v1.0)"
R = random.Random(16)
GR = ["facil", "intermedio", "dificil"]
RUTAS = ["3-5", "6-8", "9-12", "13-18"]

# ---------------- Catálogo de ingredientes (pictograma propio: forma + color + nombre; el color nunca es la única señal) ----------------
# tipo: fruta | verdura | lacteo | almacen | panaderia | huevo ; forma: para el dibujo y para la regla «por forma» (redonda | larga | otra)
ING = {
  "harina":      dict(nombre="harina", dib="bolsa", color="#F4EBDD", tipo="almacen", forma="otra", alergenos=["gluten"]),
  "azucar":      dict(nombre="azúcar", dib="bolsa", color="#FFFFFF", tipo="almacen", forma="otra", alergenos=[], parecido="sal"),
  "sal":         dict(nombre="sal", dib="salero", color="#FFFFFF", tipo="almacen", forma="otra", alergenos=[], parecido="azucar"),
  "leche":       dict(nombre="leche", dib="carton", color="#E7F0FA", tipo="lacteo", forma="otra", alergenos=["leche"], parecido="yogur"),
  "yogur":       dict(nombre="yogur", dib="pote", color="#F7E6EF", tipo="lacteo", forma="otra", alergenos=["leche"], parecido="leche"),
  "huevo":       dict(nombre="huevo", dib="huevo", color="#F6E7CF", tipo="huevo", forma="redonda", alergenos=["huevo"]),
  "manteca":     dict(nombre="manteca", dib="barra", color="#FFE9A8", tipo="lacteo", forma="larga", alergenos=["leche"], parecido="queso"),
  "queso":       dict(nombre="queso", dib="cuna", color="#FFD35C", tipo="lacteo", forma="otra", alergenos=["leche"], parecido="manteca"),
  "queso_untable": dict(nombre="queso untable", dib="pote", color="#FFFFFF", tipo="lacteo", forma="otra", alergenos=["leche"]),
  "pan":         dict(nombre="pan", dib="pan", color="#E3A866", tipo="panaderia", forma="larga", alergenos=["gluten"]),
  "pan_miga":    dict(nombre="pan de miga", dib="rebanada", color="#F8EED8", tipo="panaderia", forma="otra", alergenos=["gluten"]),
  "mermelada":   dict(nombre="mermelada", dib="frasco", color="#D9485F", tipo="almacen", forma="otra", alergenos=[], parecido="dulce_leche"),
  "dulce_leche": dict(nombre="dulce de leche", dib="frasco", color="#A86B32", tipo="almacen", forma="otra", alergenos=["leche"], parecido="mermelada"),
  "coco":        dict(nombre="coco rallado", dib="bolsa", color="#FFFFFF", tipo="almacen", forma="otra", alergenos=[]),
  "cereales":    dict(nombre="cereales", dib="caja", color="#FFB82E", tipo="almacen", forma="otra", alergenos=["gluten"]),
  "cacao":       dict(nombre="cacao", dib="lata", color="#7A4A2A", tipo="almacen", forma="otra", alergenos=[]),
  "aceite":      dict(nombre="aceite", dib="botella", color="#F2D55B", tipo="almacen", forma="larga", alergenos=[]),
  "fideos":      dict(nombre="fideos", dib="paquete", color="#F6D88A", tipo="almacen", forma="larga", alergenos=["gluten"]),
  "arroz":       dict(nombre="arroz", dib="bolsa", color="#FDFBF5", tipo="almacen", forma="otra", alergenos=[]),
  "tomate_tri":  dict(nombre="tomate triturado", dib="lata", color="#D9485F", tipo="almacen", forma="otra", alergenos=[]),
  "banana":      dict(nombre="banana", dib="banana", color="#FFD84D", tipo="fruta", forma="larga", alergenos=[]),
  "manzana":     dict(nombre="manzana", dib="manzana", color="#E2514A", tipo="fruta", forma="redonda", alergenos=[]),
  "naranja":     dict(nombre="naranja", dib="redonda", color="#F5953A", tipo="fruta", forma="redonda", alergenos=[]),
  "frutilla":    dict(nombre="frutilla", dib="frutilla", color="#E04B5A", tipo="fruta", forma="otra", alergenos=[]),
  "pera":        dict(nombre="pera", dib="pera", color="#B9D46A", tipo="fruta", forma="otra", alergenos=[]),
  "uva":         dict(nombre="uvas", dib="racimo", color="#8C5BA8", tipo="fruta", forma="otra", alergenos=[], atragantamiento_3_5=True),
  "lechuga":     dict(nombre="lechuga", dib="hoja", color="#7CC26A", tipo="verdura", forma="otra", alergenos=[]),
  "tomate":      dict(nombre="tomate", dib="redonda", color="#E5483F", tipo="verdura", forma="redonda", alergenos=[], parecido="morron"),
  "morron":      dict(nombre="morrón", dib="morron", color="#E5483F", tipo="verdura", forma="otra", alergenos=[], parecido="tomate"),
  "zanahoria":   dict(nombre="zanahoria", dib="zanahoria", color="#F28C28", tipo="verdura", forma="larga", alergenos=[]),
  "papa":        dict(nombre="papa", dib="papa", color="#C9A36B", tipo="verdura", forma="redonda", alergenos=[]),
  "cebolla":     dict(nombre="cebolla", dib="cebolla", color="#E9D7C0", tipo="verdura", forma="redonda", alergenos=[]),
  "zapallo":     dict(nombre="zapallo", dib="zapallo", color="#F0A33B", tipo="verdura", forma="redonda", alergenos=[]),
  "choclo":      dict(nombre="choclo", dib="choclo", color="#F7D046", tipo="verdura", forma="larga", alergenos=[]),
  "espinaca":    dict(nombre="espinaca", dib="hoja", color="#3E8E4E", tipo="verdura", forma="otra", alergenos=[]),
  "tapa_tarta":  dict(nombre="tapas de tarta", dib="disco", color="#F3E2C0", tipo="panaderia", forma="redonda", alergenos=["gluten"]),
  "tapa_empanada": dict(nombre="tapas de empanada", dib="disco", color="#F3E2C0", tipo="panaderia", forma="redonda", alergenos=["gluten"]),
  "levadura":    dict(nombre="levadura", dib="paquete", color="#EDE2C8", tipo="almacen", forma="otra", alergenos=[]),
  "harina_sin_tacc": dict(nombre="harina sin TACC", dib="bolsa", color="#E0F2EB", tipo="almacen", forma="otra", alergenos=[]),
  "pan_sin_tacc": dict(nombre="pan sin TACC", dib="rebanada", color="#E0F2EB", tipo="panaderia", forma="otra", alergenos=[]),
}
for k, v in ING.items(): v["id"] = k

# Utensilios. riesgo: calor | filo | electrico (FEC 5.8: en 3–12 los usa siempre el personaje adulto)
UT = {
  "bol": dict(nombre="bol"), "cuchara": dict(nombre="cuchara"), "batidor": dict(nombre="batidor de mano"), "fuente": dict(nombre="fuente"),
  "plato": dict(nombre="plato"), "taza": dict(nombre="taza de medir"), "colador": dict(nombre="colador"), "espatula": dict(nombre="espátula"),
  "cuchillo_untar": dict(nombre="cuchillo sin filo"), "tabla": dict(nombre="tabla"), "rodillo": dict(nombre="palo de amasar"),
  "olla": dict(nombre="olla", riesgo="calor"), "sarten": dict(nombre="sartén", riesgo="calor"),
  "cuchillo": dict(nombre="cuchillo", riesgo="filo"), "rallador": dict(nombre="rallador", riesgo="filo"),
  "horno": dict(nombre="horno", riesgo="calor"), "hornalla": dict(nombre="hornalla", riesgo="calor"),
  "licuadora": dict(nombre="licuadora", riesgo="electrico"), "batidora": dict(nombre="batidora eléctrica", riesgo="electrico"),
}
for k, v in UT.items(): v["id"] = k; v.setdefault("riesgo", None)

ACCIONES = {"seleccionar": "Elegir", "trasladar": "Llevar", "colocar": "Poner", "mezclar": "Mezclar", "distribuir": "Repartir",
            "completar": "Completar", "lavar": "Lavar", "untar": "Untar", "cortar": "Cortar", "rallar": "Rallar", "hornear": "Hornear",
            "cocinar": "Cocinar", "hervir": "Hervir", "amasar": "Amasar", "servir": "Servir", "batir": "Batir"}

def paso(accion, ut, ing=None, actor="persona", momento="durante", texto=None):
    r = UT[ut]["riesgo"]
    if r: actor = "adulto"
    return dict(accion=accion, utensilio=ut, ingrediente=ing, actor=actor, riesgo=r, momento=momento if r is None else (momento if momento != "durante" else "durante"), texto=texto)

def P(accion, ut, ing, texto, **k): return paso(accion, ut, ing, texto=texto, **k)

# ---------------- Banco de recetas (FEC 5.10; borrador para validar por PSP-SR, T10) ----------------
RECETAS = [
  dict(id="ensalada_frutas", nombre="Ensalada de frutas", dulce=True, coccion=False, horno=False, porciones=4, tiempo="corto", region="todo el país",
       ingredientes=["banana", "manzana", "naranja", "frutilla"], utensilios=["bol", "cuchara", "cuchillo"],
       pasos=[P("cortar", "cuchillo", "manzana", "El adulto corta la fruta", momento="antes"), P("colocar", "bol", "banana", "Poner la fruta en el bol"),
              P("mezclar", "cuchara", None, "Mezclar con la cuchara"), P("servir", "plato", None, "Servir en los platos")]),
  dict(id="sandwich_queso", nombre="Sándwiches de pan con queso", dulce=False, coccion=False, horno=False, porciones=2, tiempo="corto", region="todo el país",
       ingredientes=["pan_miga", "queso", "tomate"], utensilios=["plato", "cuchillo"], sin_tacc="pan_sin_tacc",
       pasos=[P("cortar", "cuchillo", "tomate", "El adulto corta el tomate", momento="antes"), P("colocar", "plato", "pan_miga", "Poner el pan en el plato"),
              P("colocar", "plato", "queso", "Poner el queso sobre el pan"), P("completar", "plato", "pan_miga", "Tapar con otro pan")]),
  dict(id="yogur_cereales", nombre="Yogur con cereales y fruta", dulce=True, coccion=False, horno=False, porciones=1, tiempo="corto", region="todo el país",
       ingredientes=["yogur", "cereales", "banana"], utensilios=["bol", "cuchara", "cuchillo"], sin_tacc="arroz",
       pasos=[P("cortar", "cuchillo", "banana", "El adulto corta la banana", momento="antes"), P("colocar", "bol", "yogur", "Poner el yogur en el bol"),
              P("distribuir", "cuchara", "cereales", "Repartir los cereales arriba"), P("colocar", "bol", "banana", "Sumar la banana")]),
  dict(id="tostadas", nombre="Tostadas con queso untable y mermelada", dulce=True, coccion=False, horno=False, porciones=2, tiempo="corto", region="todo el país",
       ingredientes=["pan", "queso_untable", "mermelada"], utensilios=["plato", "cuchillo_untar"], sin_tacc="pan_sin_tacc",
       pasos=[P("cocinar", "hornalla", "pan", "El adulto tuesta el pan", momento="antes"), P("untar", "cuchillo_untar", "queso_untable", "Untar el queso"),
              P("untar", "cuchillo_untar", "mermelada", "Untar la mermelada"), P("servir", "plato", None, "Servir")]),
  dict(id="ensalada_verde", nombre="Ensalada de lechuga, tomate y zanahoria", dulce=False, coccion=False, horno=False, porciones=4, tiempo="corto", region="todo el país",
       ingredientes=["lechuga", "tomate", "zanahoria", "aceite", "sal"], utensilios=["bol", "colador", "rallador", "cuchillo", "cuchara"],
       pasos=[P("rallar", "rallador", "zanahoria", "El adulto ralla la zanahoria", momento="antes"), P("cortar", "cuchillo", "tomate", "El adulto corta el tomate", momento="antes"),
              P("lavar", "colador", "lechuga", "Lavar la lechuga"), P("colocar", "bol", "lechuga", "Poner todo en el bol"), P("mezclar", "cuchara", "aceite", "Condimentar y mezclar")]),
  dict(id="bolitas_coco", nombre="Bolitas de coco y dulce de leche", dulce=True, coccion=False, horno=False, porciones=6, tiempo="corto", region="todo el país",
       ingredientes=["coco", "dulce_leche"], utensilios=["bol", "cuchara", "plato"],
       pasos=[P("colocar", "bol", "dulce_leche", "Poner el dulce de leche en el bol"), P("mezclar", "cuchara", "coco", "Mezclar con el coco"),
              P("amasar", "plato", None, "Formar bolitas"), P("distribuir", "plato", "coco", "Pasarlas por coco")]),
  dict(id="bizcochuelo", nombre="Bizcochuelo", dulce=True, coccion=True, horno=True, porciones=8, tiempo="largo", region="todo el país",
       ingredientes=["harina", "azucar", "huevo", "leche"], utensilios=["bol", "batidor", "fuente", "horno"], sin_tacc="harina_sin_tacc",
       pasos=[P("hornear", "horno", None, "Prender el horno", momento="antes"), P("batir", "batidor", "huevo", "Batir los huevos con el azúcar"),
              P("mezclar", "batidor", "harina", "Sumar la harina y mezclar"), P("colocar", "fuente", None, "Pasar a la fuente"), P("hornear", "horno", None, "Hornear")]),
  dict(id="galletitas", nombre="Galletitas", dulce=True, coccion=True, horno=True, porciones=12, tiempo="largo", region="todo el país",
       ingredientes=["harina", "manteca", "azucar", "huevo"], utensilios=["bol", "rodillo", "fuente", "horno"], sin_tacc="harina_sin_tacc",
       pasos=[P("mezclar", "bol", "manteca", "Mezclar manteca y azúcar"), P("mezclar", "bol", "harina", "Sumar huevo y harina"),
              P("amasar", "rodillo", None, "Estirar la masa"), P("colocar", "fuente", None, "Poner en la fuente"), P("hornear", "horno", None, "Hornear")]),
  dict(id="pizza", nombre="Pizza", dulce=False, coccion=True, horno=True, porciones=8, tiempo="largo", region="todo el país",
       ingredientes=["harina", "levadura", "tomate_tri", "queso", "aceite"], utensilios=["bol", "rodillo", "fuente", "cuchara", "horno"], sin_tacc="harina_sin_tacc",
       pasos=[P("mezclar", "bol", "harina", "Mezclar harina y levadura"), P("amasar", "rodillo", None, "Estirar la masa"), P("distribuir", "cuchara", "tomate_tri", "Poner la salsa"),
              P("distribuir", "fuente", "queso", "Repartir el queso"), P("hornear", "horno", None, "Hornear")]),
  dict(id="panqueques", nombre="Panqueques", dulce=True, coccion=True, horno=False, porciones=6, tiempo="largo", region="todo el país",
       ingredientes=["harina", "leche", "huevo", "dulce_leche"], utensilios=["bol", "batidor", "sarten", "hornalla"], sin_tacc="harina_sin_tacc",
       pasos=[P("batir", "batidor", "huevo", "Batir huevo y leche"), P("mezclar", "batidor", "harina", "Sumar la harina"), P("cocinar", "sarten", None, "Cocinar en la sartén"),
              P("untar", "cuchillo_untar", "dulce_leche", "Untar con dulce de leche")]),
  dict(id="tarta_verdura", nombre="Tarta de verdura", dulce=False, coccion=True, horno=True, porciones=6, tiempo="largo", region="todo el país",
       ingredientes=["tapa_tarta", "espinaca", "huevo", "queso", "cebolla"], utensilios=["bol", "fuente", "cuchillo", "horno"], sin_tacc="harina_sin_tacc",
       pasos=[P("cortar", "cuchillo", "cebolla", "Cortar la cebolla"), P("mezclar", "bol", "espinaca", "Mezclar espinaca, huevo y queso"), P("colocar", "fuente", "tapa_tarta", "Poner la tapa en la fuente"),
              P("distribuir", "cuchara", None, "Rellenar la tarta"), P("hornear", "horno", None, "Hornear")]),
  dict(id="empanadas", nombre="Empanadas", dulce=False, coccion=True, horno=True, porciones=12, tiempo="largo", region="noroeste y todo el país",
       ingredientes=["tapa_empanada", "cebolla", "huevo", "morron"], utensilios=["olla", "cuchara", "fuente", "cuchillo", "horno"], sin_tacc="harina_sin_tacc",
       pasos=[P("cortar", "cuchillo", "cebolla", "Cortar la cebolla"), P("cocinar", "sarten", "cebolla", "Cocinar el relleno"), P("distribuir", "cuchara", None, "Rellenar las tapas"),
              P("completar", "fuente", "tapa_empanada", "Cerrar las empanadas"), P("hornear", "horno", None, "Hornear")]),
  dict(id="fideos_salsa", nombre="Fideos con salsa", dulce=False, coccion=True, horno=False, porciones=4, tiempo="largo", region="todo el país",
       ingredientes=["fideos", "tomate_tri", "cebolla", "queso", "sal"], utensilios=["olla", "colador", "sarten", "hornalla"], sin_tacc="arroz",
       pasos=[P("hervir", "olla", "fideos", "Hervir los fideos"), P("cocinar", "sarten", "tomate_tri", "Calentar la salsa"), P("trasladar", "colador", "fideos", "Colar los fideos"),
              P("servir", "plato", "queso", "Servir con queso")]),
  dict(id="arroz_verduras", nombre="Arroz con verduras", dulce=False, coccion=True, horno=False, porciones=4, tiempo="largo", region="todo el país",
       ingredientes=["arroz", "zanahoria", "choclo", "morron", "sal"], utensilios=["olla", "cuchara", "cuchillo", "hornalla"],
       pasos=[P("cortar", "cuchillo", "morron", "Cortar las verduras"), P("hervir", "olla", "arroz", "Hervir el arroz"), P("mezclar", "cuchara", "choclo", "Sumar las verduras"),
              P("servir", "plato", None, "Servir")]),
  dict(id="tortas_fritas", nombre="Tortas fritas", dulce=False, coccion=True, horno=False, porciones=10, tiempo="largo", region="todo el país",
       ingredientes=["harina", "sal", "aceite", "manteca"], utensilios=["bol", "rodillo", "sarten", "hornalla"], sin_tacc="harina_sin_tacc",
       pasos=[P("mezclar", "bol", "harina", "Mezclar harina, sal y manteca"), P("amasar", "rodillo", None, "Estirar la masa"), P("cocinar", "sarten", None, "Freír en la sartén"),
              P("servir", "plato", None, "Servir")]),
  dict(id="locro", nombre="Locro", dulce=False, coccion=True, horno=False, porciones=8, tiempo="largo", region="noroeste y todo el país", rutas=["13-18"],
       ingredientes=["zapallo", "choclo", "papa", "cebolla", "sal"], utensilios=["olla", "cuchara", "cuchillo", "hornalla"],
       pasos=[P("cortar", "cuchillo", "zapallo", "Cortar las verduras"), P("hervir", "olla", "zapallo", "Hervir con agua"), P("mezclar", "cuchara", None, "Revolver de a ratos"),
              P("servir", "plato", None, "Servir")]),
]
for r in RECETAS:
    r.setdefault("rutas", ["3-5", "6-8", "9-12", "13-18"]); r["sin_carne"] = True; r["estado"] = PEND
    r["alergenos"] = sorted({a for i in r["ingredientes"] for a in ING[i]["alergenos"]})
    r.setdefault("sin_tacc", None)
    if r["alergenos"].count("gluten") and not r["sin_tacc"]: raise SystemExit("receta con gluten sin alternativa: " + r["id"])
    if any(ING[i].get("atragantamiento_3_5") for i in r["ingredientes"]): r["rutas"] = [x for x in r["rutas"] if x != "3-5"]
REC = {r["id"]: r for r in RECETAS}
SIN_COCCION = [r["id"] for r in RECETAS if not r["coccion"]]
CON_COCCION = [r["id"] for r in RECETAS if r["coccion"] and "6-8" in r["rutas"]]

# ---------------- Variantes (FEC 5.1 y 5.2; D3: Zona y Espacio) ----------------
V = [
 ("1-zona", 1, "Reconocer recetas", "reconocer", "categorizacion", ["seguimiento-de-consignas", "vocabulario"]),
 ("1-espacio", 1, "Decidir con condiciones", "integrar", "toma-de-decisiones", ["organizacion-y-planificacion"]),
 ("2-zona", 2, "Encontrar ingredientes", "reconocer", "atencion-sostenida", ["reconocimiento-visual"]),
 ("2-espacio", 2, "Recordar la lista", "integrar", "memoria-de-trabajo", ["autocorreccion"]),
 ("3-zona", 3, "Contar y elegir cantidades", "reconocer", "calculo-funcional", ["seguimiento-de-consignas"]),
 ("3-espacio", 3, "Calcular y pagar", "integrar", "manejo-del-dinero", ["calculo-funcional", "organizacion-y-planificacion"]),
 ("4-zona", 4, "Ordenar pasos", "reconocer", "secuenciacion", ["comprension-verbal"]),
 ("4-espacio", 4, "Planificar", "integrar", "organizacion-y-planificacion", ["secuenciacion", "flexibilidad-cognitiva"]),
 ("5-zona", 5, "Encontrar con precisión", "reconocer", "velocidad-de-procesamiento-visual", ["atencion-sostenida"]),
 ("5-espacio", 5, "Cambiar de regla", "integrar", "flexibilidad-cognitiva", ["atencion-sostenida"]),
 ("6-zona", 6, "Comprender", "reconocer", "comprension-verbal", ["vocabulario"]),
 ("6-espacio", 6, "Armar y explicar", "integrar", "comunicacion-funcional", ["secuenciacion", "construccion-sintactica"]),
 ("7-zona", 7, "Hacer con modelo", "reconocer", "aprendizaje-procedimental", ["seguimiento-de-consignas"]),
 ("7-espacio", 7, "Hacer con menos ayuda", "integrar", "aprendizaje-procedimental", ["autocorreccion"]),
 ("8-zona", 8, "Aventura guiada", "integrar", "organizacion-y-planificacion", ["integra los rincones"]),
 ("8-espacio", 8, "Aventura con imprevistos", "transferir", "transferencia-a-situaciones-nuevas", ["generalizacion", "autocorreccion", "toma-de-decisiones"]),
]
RINCON = {1: "El recetario", 2: "La despensa", 3: "El súper", 4: "La mesa de los pasos", 5: "Los retos del chef", 6: "La charla en la cocina", 7: "La mesada", 8: "El gran reto"}
RINCON_DR = {1: "¿Qué vamos a cocinar?", 2: "La despensa del chef", 3: "Vamos al supermercado", 4: "Organizamos la receta", 5: "Retos del chef", 6: "El lenguaje del chef", 7: "¡Manos a la obra!", 8: "El gran reto"}
ACCION_NINO = {"1-zona": "Mirar recetas", "1-espacio": "Elegir qué cocinar", "2-zona": "Buscar ingredientes", "2-espacio": "Recordar la lista",
  "3-zona": "Contar y llenar el carrito", "3-espacio": "Hacer las cuentas", "4-zona": "Ordenar los pasos", "4-espacio": "Pensar qué va antes",
  "5-zona": "Encontrar con cuidado", "5-espacio": "Seguir el gorro", "6-zona": "Escuchar y señalar", "6-espacio": "Armar frases de cocina",
  "7-zona": "Cocinar con el chef", "7-espacio": "Cocinar casi solo", "8-zona": "Preparar todo", "8-espacio": "Resolver imprevistos"}
# Disponibilidad por ruta (FEC 5.11). 13–18 queda deshabilitada en el prototipo hasta tener los textos de PSP-SR (T1).
DISP = {
 "1-zona":   {"3-5": ["facil", "intermedio"], "6-8": GR, "9-12": GR, "13-18": GR},
 "1-espacio": {"3-5": [], "6-8": ["facil", "intermedio"], "9-12": GR, "13-18": GR},
 "2-zona":   {"3-5": ["facil", "intermedio"], "6-8": GR, "9-12": GR, "13-18": GR},
 "2-espacio": {"3-5": ["facil"], "6-8": GR, "9-12": GR, "13-18": GR},
 "3-zona":   {"3-5": ["facil"], "6-8": GR, "9-12": GR, "13-18": GR},
 "3-espacio": {"3-5": [], "6-8": ["facil", "intermedio"], "9-12": GR, "13-18": GR},
 "4-zona":   {"3-5": ["facil"], "6-8": GR, "9-12": GR, "13-18": GR},
 "4-espacio": {"3-5": [], "6-8": ["facil"], "9-12": GR, "13-18": GR},
 "5-zona":   {"3-5": [], "6-8": ["facil", "intermedio"], "9-12": GR, "13-18": GR},
 "5-espacio": {"3-5": [], "6-8": ["facil"], "9-12": GR, "13-18": GR},
 "6-zona":   {"3-5": GR, "6-8": GR, "9-12": GR, "13-18": GR},
 "6-espacio": {"3-5": [], "6-8": ["facil", "intermedio"], "9-12": GR, "13-18": GR},
 "7-zona":   {"3-5": GR, "6-8": GR, "9-12": GR, "13-18": GR},
 "7-espacio": {"3-5": [], "6-8": ["facil", "intermedio"], "9-12": GR, "13-18": GR},
 "8-zona":   {"3-5": ["facil"], "6-8": GR, "9-12": GR, "13-18": GR},
 "8-espacio": {"3-5": [], "6-8": [], "9-12": GR, "13-18": GR},
}
# Dimensión de DR-§4.B que cambia en cada grado (REQ-CLI-CHF-01): nunca solo «cantidad-estimulos».
DIM = {
 "1-zona": [["informacion"], ["relaciones", "cantidad-estimulos"], ["consignas", "relaciones"]],
 "1-espacio": [["consignas"], ["informacion", "planificacion"], ["resolucion"]],
 "2-zona": [["informacion"], ["informacion", "cantidad-estimulos"], ["relaciones"]],
 "2-espacio": [["autonomia"], ["informacion"], ["planificacion", "relaciones"]],
 "3-zona": [["informacion"], ["relaciones"], ["relaciones", "resolucion"]],
 "3-espacio": [["resolucion"], ["relaciones"], ["planificacion", "resolucion"]],
 "4-zona": [["autonomia"], ["informacion"], ["resolucion"]],
 "4-espacio": [["relaciones"], ["planificacion"], ["planificacion", "resolucion"]],
 "5-zona": [["informacion"], ["consignas"], ["informacion", "resolucion"]],
 "5-espacio": [["consignas"], ["consignas", "relaciones"], ["autonomia", "relaciones"]],
 "6-zona": [["informacion"], ["consignas"], ["relaciones"]],
 "6-espacio": [["consignas"], ["consignas", "relaciones"], ["planificacion", "resolucion"]],
 "7-zona": [["autonomia"], ["resolucion"], ["planificacion"]],
 "7-espacio": [["autonomia"], ["autonomia", "informacion"], ["resolucion"]],
 "8-zona": [["autonomia"], ["autonomia", "planificacion"], ["autonomia", "resolucion"]],
 "8-espacio": [["relaciones", "resolucion"], ["planificacion", "resolucion"], ["planificacion", "resolucion", "autonomia"]],
}
DESC = {  # Qué cambia (FEC 5.4 a 5.9)
 "1-zona": ["2 recetas muy distintas; una característica visible", "4 a 6 recetas; clasificar en dulce y salado", "Dos condiciones combinadas; recetas que comparten ingredientes"],
 "1-espacio": ["Dos condiciones, una negativa", "Tres condiciones, con la información en la tarjeta de cada receta", "Comparar dos recetas que cumplen; elegir la razón"],
 "2-zona": ["1 ingrediente, 3 a 4 opciones, lista visible", "2 o 3 ingredientes, alacena con 8 a 12 objetos", "Heladera y alacena; ingredientes parecidos"],
 "2-espacio": ["Lista que se tapa con «Ya miré», 2 o 3 ingredientes", "4 ingredientes; «Tengo / Falta»", "Actualizar la lista; faltantes y sobrantes"],
 "3-zona": ["Contar hasta 5 con objetos", "Hasta 10; comparar más y menos", "Equivalencias simples (docena, media docena)"],
 "3-espacio": ["Sumas y restas simples de cantidades", "Precios redondos; comparar; pagar con billetes", "Presupuesto, total y vuelto"],
 "4-zona": ["2 o 3 pasos con imágenes; modelo disponible", "4 o 5 pasos; un paso faltante", "Detectar el error en una secuencia armada"],
 "4-espacio": ["Pasos que dependen de otros", "Qué se puede hacer mientras tanto", "Anticipar qué pasa si cambia el orden"],
 "5-zona": ["Encontrar un ingrediente entre 3 o 4 iguales", "Entre 6 y 9, con distractores parecidos", "Exposición breve que se puede desactivar"],
 "5-espacio": ["Una regla que cambia una vez, avisada", "Alternar dos reglas con señal visible", "La regla cambia sin aviso previo, con señal en la escena"],
 "6-zona": ["Nombre → imagen, 3 opciones", "Consignas de una acción con un atributo", "Preguntas concretas sobre una escena"],
 "6-espacio": ["Completar una oración con una tarjeta", "Para qué sirve; instrucciones de 2 o 3 pasos", "Armar las instrucciones de una receta para otro chef"],
 "7-zona": ["El personaje hace la acción; modelo permanente", "Elegir utensilio y acción; modelo a pedido", "Receta corta con guía paso a paso"],
 "7-espacio": ["Receta conocida con menos modelos", "Retomar una receta sin todas las instrucciones", "Detectar el error durante la preparación"],
 "8-zona": ["Etapas con apoyos", "Menos apoyos; más etapas solas", "Casi todas las etapas solas"],
 "8-espacio": ["Situación nueva con un imprevisto", "Situación nueva con dos imprevistos", "Imprevistos en cada etapa y evaluar el resultado"],
}
# Apoyos de acceso y de aprendizaje por variante (FEC 5.3, REQ-CLI-CHF-10)
APOYOS = {}
for vid, *_ in V:
    acceso = ["audio-consigna", "repetir-consigna", "zoom", "contraste", "sin-arrastre", "tiempo-sin-limite", "letra"]
    aprendizaje = ["pista-general", "resaltar", "sacar-opciones", "demostracion"]
    if vid in ("2-zona", "3-zona", "3-espacio", "7-zona", "7-espacio", "8-zona", "8-espacio"): acceso.append("lista-visual")
    if vid == "2-espacio": aprendizaje.append("volver-a-ver-lista")
    if vid in ("3-zona", "3-espacio"): aprendizaje.append("calculadora")
    if vid == "3-espacio": acceso.append("calculadora-en-planificacion")
    if vid == "7-zona": acceso.append("modelo-de-secuencia")
    if vid in ("4-zona", "4-espacio"): aprendizaje.append("modelo-de-secuencia")
    if vid == "5-zona": aprendizaje.append("tiempo-amplio"); acceso.remove("tiempo-sin-limite")
    if vid == "6-zona": aprendizaje.append("imagen-con-palabra")
    else: acceso.append("imagen-con-palabra")
    APOYOS[vid] = {"acceso": acceso, "aprendizaje": aprendizaje}

TIPOS_ERROR = {  # Taxonomía provisoria (FEC 5.16 da ejemplos; la lista cerrada es la pregunta T4)
 "1-zona": ["confundio-categoria", "eligio-otra-receta"], "1-espacio": ["no-cumplio-condicion", "razon-incoherente"],
 "2-zona": ["eligio-parecido", "eligio-otro"], "2-espacio": ["olvido-ingrediente", "agrego-sobrante", "confundio-tengo-falta"],
 "3-zona": ["conto-de-mas", "conto-de-menos", "comparo-al-reves"], "3-espacio": ["sumo-en-lugar-de-restar", "no-conto-el-vuelto", "se-paso-del-presupuesto", "monto-incorrecto"],
 "4-zona": ["invirtio-dos-pasos", "omitio-un-paso", "no-detecto-error"], "4-espacio": ["dependencia-al-reves", "no-anticipo"],
 "5-zona": ["eligio-parecido", "eligio-otro"], "5-espacio": ["siguio-regla-anterior", "error-de-clasificacion"],
 "6-zona": ["confundio-palabra", "omitio-atributo"], "6-espacio": ["tarjeta-incorrecta", "orden-incorrecto"],
 "7-zona": ["utensilio-incorrecto", "accion-incorrecta"], "7-espacio": ["utensilio-incorrecto", "accion-incorrecta", "no-detecto-error"],
 "8-zona": ["etapa-con-error"], "8-espacio": ["etapa-con-error", "alternativa-no-valida"],
}

# ---------------- Ítems (formatos F1–F10 de RT-CHF-001 B.5) ----------------
banco = {v[0]: {g: [] for g in GR} for v in V}
def add(vid, g, it, rutas=None):
    n = len(banco[vid][g]) + 1
    it = dict(it); it["id"] = f"{vid}-{g[0]}{n}"
    it["rutas"] = rutas or [r for r in RUTAS if g in DISP[vid][r]]
    it.setdefault("estado", PEND)
    rec = it.get("receta")
    if rec: it["rutas"] = [r for r in it["rutas"] if r in REC[rec]["rutas"]]
    it["dimension"] = DIM[vid][GR.index(g)]
    banco[vid][g].append(it)

def ops(ids): return [{"id": i, "ing": i} for i in ids]
def nomb(i): return ING[i]["nombre"]
DULCES = [r for r in RECETAS if r["dulce"] and "6-8" in r["rutas"]]
SALADAS = [r for r in RECETAS if not r["dulce"] and "6-8" in r["rutas"]]

# Rincón 1 · Zona (E2)
for k, (a, b) in enumerate([("bizcochuelo", "pizza"), ("ensalada_frutas", "fideos_salsa"), ("panqueques", "empanadas"), ("bolitas_coco", "sandwich_queso")]):
    add("1-zona", "facil", dict(formato="elegir", receta=a, consigna="¿Cuál es dulce?", opciones=[{"id": a, "receta": a}, {"id": b, "receta": b}], correcta=a,
        pista1="Pensá: ¿lleva azúcar o fruta?", ok="Miraste qué lleva cada receta."))
for k in range(4):
    ds = R.sample(DULCES, 2 + k % 2); ss = R.sample(SALADAS, 2 + (k + 1) % 2)
    add("1-zona", "intermedio", dict(formato="clasificar", consigna="Poné las recetas dulces y las saladas.", canastas=[{"id": "dulce", "txt": "Dulce"}, {"id": "salado", "txt": "Salado"}],
        fichas=[{"id": r["id"], "receta": r["id"], "destino": "dulce" if r["dulce"] else "salado"} for r in R.sample(ds + ss, len(ds + ss))], ok="Ordenaste las recetas por su sabor."))
for k, ing in enumerate(["huevo", "harina", "queso", "leche"]):
    pool = [r for r in RECETAS if "6-8" in r["rutas"]]
    con = [r["id"] for r in pool if ing in r["ingredientes"]][:3]; sin = [r["id"] for r in pool if ing not in r["ingredientes"]][:2]
    add("1-zona", "dificil", dict(formato="elegir", multiple=True, consigna=f"¿Cuáles llevan {nomb(ing)}?", mostrar_ingredientes=True,
        opciones=[{"id": i, "receta": i} for i in R.sample(con + sin, len(con + sin))], correctas=con, pista1="Mirá los ingredientes de cada tarjeta.", ok="Revisaste los ingredientes de cada receta."))
# Rincón 1 · Espacio (E3)
for k, (cond_d, cond_h) in enumerate([(True, False), (False, False), (True, False), (False, False)]):
    pool = [r for r in RECETAS if "6-8" in r["rutas"]]
    ok_ = [r for r in pool if r["dulce"] == cond_d and r["horno"] == cond_h]; no = [r for r in pool if r["dulce"] == cond_d and r["horno"]] + [r for r in pool if r["dulce"] != cond_d and not r["horno"]]
    c = R.choice(ok_); otros = R.sample(no, 2)
    add("1-espacio", "facil", dict(formato="elegir", receta=c["id"], mostrar_ingredientes=True, consigna=f"Elegí una receta {'dulce' if cond_d else 'salada'} sin horno.",
        opciones=[{"id": x["id"], "receta": x["id"]} for x in R.sample([c] + otros, 3)], correcta=c["id"], pista1="Fijate dos cosas: el sabor y el horno.", ok="Tuviste en cuenta las dos condiciones."))
for k, (amigos, hay, horno) in enumerate([(4, ["pan_miga", "queso"], False), (2, ["yogur", "cereales"], False), (6, ["coco", "dulce_leche"], False), (3, ["lechuga", "tomate"], False)]):
    c = next(r for r in RECETAS if set(hay) <= set(r["ingredientes"]) and not r["horno"] and "6-8" in r["rutas"])
    otros = R.sample([r for r in RECETAS if r["horno"] and "6-8" in r["rutas"]], 1) + R.sample([r for r in RECETAS if not r["horno"] and r["id"] != c["id"] and "6-8" in r["rutas"] and not set(hay) <= set(r["ingredientes"])], 1)
    add("1-espacio", "intermedio", dict(formato="elegir", receta=c["id"], mostrar_ingredientes=True, mostrar_porciones=True,
        consigna=f"Vienen {amigos}. Hay {nomb(hay[0])} y {nomb(hay[1])}. No hay horno.", pregunta="¿Qué preparamos?",
        opciones=[{"id": x["id"], "receta": x["id"]} for x in R.sample([c] + otros, 3)], correcta=c["id"], pista1="Fijate qué hay y si hace falta horno.", ok="Pensaste en lo que tenemos y en el horno."))
RAZONES = [{"id": "tenemos", "txt": "Tenemos todo"}, {"id": "rapido", "txt": "Lleva menos tiempo"}, {"id": "alcanza", "txt": "Alcanza para todos"}]
for k, (a, b) in enumerate([("ensalada_frutas", "bizcochuelo"), ("sandwich_queso", "pizza"), ("yogur_cereales", "panqueques"), ("bolitas_coco", "galletitas")]):
    A, B = REC[a], REC[b]
    validas = [[a, "rapido"]]
    if B["porciones"] > A["porciones"]: validas.append([b, "alcanza"])
    else: validas.append([a, "alcanza"])
    validas.append([a, "tenemos"]); validas.append([b, "tenemos"])
    add("1-espacio", "dificil", dict(formato="elegir", con_razon=True, mostrar_ingredientes=True, mostrar_porciones=True, mostrar_tiempo=True,
        consigna="Las dos sirven. ¿Cuál elegís?", pregunta="¿Por qué?", opciones=[{"id": a, "receta": a}, {"id": b, "receta": b}], razones=RAZONES, validas=validas,
        pista1="Mirá el tiempo y las porciones de cada una.", ok="Elegiste y diste una razón que va con tu elección."))

# Rincón 2 · Zona (E2): buscar en la despensa con la lista a la vista
ALACENA = [i for i in ING if ING[i]["tipo"] in ("almacen", "panaderia") and "sin_tacc" not in i]
HELADERA = [i for i in ING if ING[i]["tipo"] in ("lacteo", "huevo", "fruta", "verdura") and i != "uva"]
for k, obj in enumerate(["leche", "huevo", "harina", "banana"]):
    dis = R.sample([i for i in ALACENA + HELADERA if i != obj and ING[i]["dib"] != ING[obj]["dib"]], 2 + k % 2)
    add("2-zona", "facil", dict(formato="buscar", consigna=f"Buscá: {nomb(obj)}.", lista=[obj], escena=R.sample([obj] + dis, len(dis) + 1), lugar="alacena",
        pista1="Mirá la lista y buscá ese dibujo.", ok="Miraste la lista y lo encontraste."))
for k, rid in enumerate(["bizcochuelo", "panqueques", "pizza", "galletitas"]):
    lista = REC[rid]["ingredientes"][:3]
    esc = lista + R.sample([i for i in ALACENA + HELADERA if i not in lista], 8 + k)
    add("2-zona", "intermedio", dict(formato="buscar", receta=rid, consigna="Buscá lo que dice la lista.", lista=lista, escena=R.sample(esc, len(esc)), lugar="alacena",
        pista1="Buscá de a uno, en orden.", ok="Buscaste uno por uno lo de la lista."))
for k, rid in enumerate(["tortas_fritas", "panqueques", "tostadas", "sandwich_queso"]):
    lista = REC[rid]["ingredientes"][:3]
    par = [ING[i]["parecido"] for i in lista if ING[i].get("parecido")]
    esc = lista + par + R.sample([i for i in ALACENA + HELADERA if i not in lista + par], 9)
    add("2-zona", "dificil", dict(formato="buscar", receta=rid, consigna="Buscá todo. Ojo: hay cosas parecidas.", lista=lista, escena=R.sample(esc, len(esc)), lugar="heladera-y-alacena",
        pista1="Antes de tocar, mirá bien la forma.", ok="Te fijaste bien para no confundirte."))
# Rincón 2 · Espacio (E3): recordar la lista (se tapa con «Ya miré», nunca por tiempo)
for k, rid in enumerate(["ensalada_frutas", "yogur_cereales", "bolitas_coco", "sandwich_queso"]):
    lista = REC[rid]["ingredientes"][:2 + k % 2]
    esc = lista + R.sample([i for i in ALACENA + HELADERA if i not in lista], 5)
    add("2-espacio", "facil", dict(formato="buscar", receta=rid, recordar=True, consigna="Mirá la lista. Después buscá todo.", lista=lista, escena=R.sample(esc, len(esc)), lugar="alacena",
        pista1="¿Cuántas cosas tenía la lista?", ok="Recordaste la lista."))
def tfs(vid, g, rid, lista, en_mesada, extra, consigna, agregado=None):
    fichas = [{"id": i, "ing": i, "destino": "tengo" if i in en_mesada else "falta"} for i in lista] + [{"id": i, "ing": i, "destino": "sobra"} for i in extra]
    can = [{"id": "tengo", "txt": "Tengo"}, {"id": "falta", "txt": "Falta"}] + ([{"id": "sobra", "txt": "Sobra"}] if extra else [])
    add(vid, g, dict(formato="clasificar", receta=rid, recordar=True, lista=lista, mesada=en_mesada + extra, agregado=agregado, consigna=consigna, canastas=can,
        fichas=R.sample(fichas, len(fichas)), pista1="Mirá la mesada y pensá en la lista.", ok="Comparaste la lista con la mesada."))
for k, rid in enumerate(["bizcochuelo", "galletitas", "pizza", "panqueques"]):
    lista = REC[rid]["ingredientes"][:4]; en = lista[:2 + k % 2]
    tfs("2-espacio", "intermedio", rid, lista, en, [], "¿Qué tenemos y qué falta?")
for k, rid in enumerate(["empanadas", "tarta_verdura", "fideos_salsa", "arroz_verduras"]):
    base = REC[rid]["ingredientes"][:3]; extra_lista = REC[rid]["ingredientes"][3]
    lista = base + [extra_lista]; en = base[:2]; sobra = R.sample([i for i in ALACENA + HELADERA if i not in lista], 1)
    tfs("2-espacio", "dificil", rid, base, en, sobra, f"Agregamos {nomb(extra_lista)}. ¿Qué tenemos, qué falta, qué sobra?", agregado=extra_lista)
    banco["2-espacio"]["dificil"][-1]["fichas"].append({"id": extra_lista, "ing": extra_lista, "destino": "falta"})

# Rincón 3 · Zona (E2): contar y cantidades
for k, (ing, n) in enumerate([("manzana", 3), ("banana", 2), ("huevo", 5), ("naranja", 4)]):
    add("3-zona", "facil", dict(formato="carrito", consigna=f"Poné {n} en el carrito.", ing=ing, cantidad=n, maximo=5, pista1="Contá de a uno.", ok=f"Contaste de a uno y llegaste a {n}."))
for k, (ing, a, b) in enumerate([("naranja", 7, 4), ("manzana", 3, 8), ("papa", 9, 6), ("tomate", 5, 10)]):
    add("3-zona", "intermedio", dict(formato="elegir", consigna=f"¿En qué cajón hay más?", opciones=[{"id": "a", "ing": ing, "cantidad": a, "txt": "Este cajón"}, {"id": "b", "ing": ing, "cantidad": b, "txt": "Este otro"}],
        correcta="a" if a > b else "b", tipo_error="comparo-al-reves", pista1="Contá los de cada cajón.", ok="Comparaste las dos cantidades."))
for k, (pide, caja, alcanza) in enumerate([(6, 6, True), (12, 6, False), (4, 6, True), (8, 6, False)]):
    add("3-zona", "dificil", dict(formato="elegir", consigna=f"La receta pide {pide} huevos.", pregunta="¿Alcanza con media docena?", ing="huevo", cantidad_vista=caja,
        opciones=[{"id": "si", "txt": "Sí, alcanza"}, {"id": "no", "txt": "No, falta"}], correcta="si" if alcanza else "no", pista1="Media docena son 6.", ok="Usaste que media docena son 6."))
# Rincón 3 · Espacio (E3): calcular y pagar (dinero propio del juego, precios inventados y redondos; P4)
for k, (pide, hay, ing) in enumerate([(6, 4, "huevo"), (5, 2, "manzana"), (8, 5, "banana"), (4, 1, "naranja")]):
    add("3-espacio", "facil", dict(formato="numero", consigna=f"Necesitamos {pide}. Tenemos {hay}.", pregunta="¿Cuántos faltan?", ing=ing, tenemos=hay, respuesta=pide - hay,
        tipo_error="sumo-en-lugar-de-restar", error_si={str(pide + hay): "sumo-en-lugar-de-restar"}, pista1="¿Cuántos tenés y cuántos necesitás?", ok="Pensaste cuánto faltaba."))
for k in range(4):
    if k % 2 == 0:
        a, b = R.sample(["leche", "harina", "azucar", "queso", "yogur"], 2); pa, pb = R.choice([(30, 50), (40, 20), (60, 80), (10, 30)])
        add("3-espacio", "intermedio", dict(formato="elegir", consigna="¿Cuál cuesta menos?", opciones=[{"id": a, "ing": a, "precio": pa}, {"id": b, "ing": b, "precio": pb}],
            correcta=a if pa < pb else b, pista1="Mirá los números de los precios.", ok="Comparaste los dos precios."))
    else:
        monto = [35, 70, 45, 90][k]
        add("3-espacio", "intermedio", dict(formato="pagar", consigna=f"Pagá {monto} pesos.", monto=monto, billetes=[1, 2, 5, 10, 20, 50], pista1="Empezá por el billete más grande que entre.", ok="Juntaste el monto justo."))
for k, (presu, rid) in enumerate([(200, "panqueques"), (300, "pizza"), (150, "ensalada_frutas"), (250, "bizcochuelo")]):
    neces = REC[rid]["ingredientes"][:3]
    opciones = []
    for i in neces:
        p1 = R.choice([20, 30, 40, 50]); p2 = p1 + R.choice([30, 40, 60])
        opciones.append({"ing": i, "precios": [p1, p2]})
    barato = sum(o["precios"][0] for o in opciones)
    if barato > presu: presu = barato + 20
    add("3-espacio", "dificil", dict(formato="presupuesto", receta=rid, consigna=f"Tenés {presu} pesos. Elegí sin pasarte.", presupuesto=presu, productos=opciones,
        pista1="Sumá lo que elegiste y comparalo con lo que tenés.", ok="Hiciste la cuenta antes de pagar.", calculadora=True))

# Rincón 4 · Zona (E2): ordenar pasos
def pasos_txt(rid, n=None):
    ps = [p for p in REC[rid]["pasos"]]
    return [{"id": f"p{i}", "txt": p["texto"], "accion": p["accion"], "utensilio": p["utensilio"], "adulto": p["actor"] == "adulto"} for i, p in enumerate(ps)][:n] if n else \
           [{"id": f"p{i}", "txt": p["texto"], "accion": p["accion"], "utensilio": p["utensilio"], "adulto": p["actor"] == "adulto"} for i, p in enumerate(ps)]
for k, rid in enumerate(["ensalada_frutas", "bolitas_coco", "yogur_cereales", "tostadas"]):
    pasos = pasos_txt(rid)[1:1 + 2 + k % 2]
    add("4-zona", "facil", dict(formato="ordenar", receta=rid, consigna="Ordená los pasos.", pasos=pasos, modelo_disponible=True, pista1="¿Qué se hace primero en la cocina?", ok="Pensaste qué va primero."))
for k, rid in enumerate(["ensalada_verde", "pizza", "galletitas", "bizcochuelo"]):
    pasos = pasos_txt(rid)[:5]; falta = R.randrange(1, len(pasos) - 1)
    add("4-zona", "intermedio", dict(formato="ordenar", receta=rid, consigna="Ordená los pasos. Uno falta: elegilo.", pasos=pasos, faltante=pasos[falta]["id"],
        distractor={"id": "x", "txt": R.choice(["Lavar los platos", "Poner la mesa", "Apagar la luz"])}, pista1="Leé los pasos y pensá cuál no está.", ok="Encontraste el paso que faltaba."))
for k, rid in enumerate(["pizza", "panqueques", "galletitas", "tarta_verdura"]):
    pasos = pasos_txt(rid)[:4]; i = R.randrange(0, len(pasos) - 1); mal = pasos[:]; mal[i], mal[i + 1] = mal[i + 1], mal[i]
    add("4-zona", "dificil", dict(formato="elegir", receta=rid, consigna="Algo está mal. ¿Qué paso cambiarías de lugar?", secuencia=[p["txt"] for p in mal],
        opciones=[{"id": p["id"], "txt": p["txt"]} for p in mal], correctas_una_de=[mal[i]["id"], mal[i + 1]["id"]], tipo_error="no-detecto-error",
        pista1="Leé en orden y pensá si se puede hacer así.", ok="Revisaste el orden y encontraste el error."))
# Rincón 4 · Espacio (E3): planificar
DEP = [("Prender el horno", "Poner la torta en el horno"), ("Lavar la lechuga", "Poner la lechuga en el bol"), ("Hervir el agua", "Poner los fideos"), ("Batir los huevos", "Sumar la harina")]
for k, (a, b) in enumerate(DEP):
    add("4-espacio", "facil", dict(formato="elegir", consigna="¿Qué tiene que pasar antes?", pregunta=f"Para: «{b}».", opciones=[{"id": "a", "txt": a}, {"id": "b", "txt": b}, {"id": "c", "txt": "Servir en los platos"}],
        correcta="a", tipo_error="dependencia-al-reves", pista1="¿Qué hace falta para poder hacerlo?", ok="Pensaste qué hace falta antes."))
MIENTRAS = [("Mientras la torta se cocina, ¿qué podemos hacer?", "Lavar el bol", ["Sacar la torta", "Comer la torta"]),
            ("Mientras hierve el agua, ¿qué podemos hacer?", "Rallar el queso (adulto)", ["Colar los fideos", "Servir los fideos"]),
            ("Mientras se enfría el bizcochuelo, ¿qué podemos hacer?", "Poner la mesa", ["Cortar el bizcochuelo", "Hornear otra vez"]),
            ("Mientras se cocina el arroz, ¿qué podemos hacer?", "Preparar los platos", ["Colar el arroz", "Servir el arroz"])]
for k, (c, ok_, malas) in enumerate(MIENTRAS):
    opsx = [{"id": "ok", "txt": ok_}] + [{"id": f"m{j}", "txt": m} for j, m in enumerate(malas)]
    add("4-espacio", "intermedio", dict(formato="elegir", consigna=c, opciones=R.sample(opsx, 3), correcta="ok", pista1="¿Qué se puede hacer sin esperar?", ok="Usaste el tiempo de espera."))
ANT = [("¿Qué pasa si ponemos los huevos después de hornear?", "La torta no sale bien", ["Sale igual", "Se cocina antes"]),
       ("¿Qué pasa si no lavamos la fruta?", "Queda sucia", ["Queda más rica", "No pasa nada"]),
       ("¿Qué pasa si servimos los fideos sin hervir?", "Quedan duros", ["Quedan blandos", "Quedan igual"]),
       ("¿Qué pasa si no esperamos que se enfríe?", "Está muy caliente", ["Está frío", "Se ve más grande"])]
for k, (c, ok_, malas) in enumerate(ANT):
    opsx = [{"id": "ok", "txt": ok_}] + [{"id": f"m{j}", "txt": m} for j, m in enumerate(malas)]
    add("4-espacio", "dificil", dict(formato="elegir", consigna=c, opciones=R.sample(opsx, 3), correcta="ok", tipo_error="no-anticipo", pista1="Imaginá el paso que cambia.", ok="Anticipaste qué iba a pasar."))

# Rincón 5 · Zona (E2): encontrar con precisión (sin reloj visible; exposición breve solo en Difícil)
for g, n, dist_par in [("facil", (3, 4), False), ("intermedio", (6, 9), True), ("dificil", (6, 8), True)]:
    for k in range(4):
        obj = R.choice([i for i in ING if ING[i].get("parecido")] if dist_par else list(HELADERA))
        nn = R.randint(*n)
        dis = ([ING[obj]["parecido"]] if dist_par else []) + R.sample([i for i in ALACENA + HELADERA if i not in (obj, ING[obj].get("parecido"))], nn - 1 - (1 if dist_par else 0))
        add("5-zona", g, dict(formato="encontrar", consigna="Encontrá el igual al modelo.", modelo=obj, opciones=ops(R.sample([obj] + dis, len(dis) + 1)), correcta=obj,
            exposicion=g == "dificil", audio_objetivo=g == "intermedio", pista1="Mirá bien la forma del modelo.", ok="Miraste con cuidado antes de tocar."))
# Rincón 5 · Espacio (E3): cambiar de regla (señal del gorro; sin tiempo)
REGLAS = {"tipo": {"txt": "Por tipo", "canastas": [{"id": "fruta", "txt": "Fruta"}, {"id": "verdura", "txt": "Verdura"}]},
          "forma": {"txt": "Por forma", "canastas": [{"id": "redonda", "txt": "Redonda"}, {"id": "larga", "txt": "Larga"}]}}
FV = [i for i in ING if ING[i]["tipo"] in ("fruta", "verdura") and ING[i]["forma"] in ("redonda", "larga") and i != "uva"]
for g in GR:
    for k in range(4):
        n = 6 if g == "facil" else 8
        if g == "facil": seq = ["tipo"] * (n // 2) + ["forma"] * (n - n // 2)
        elif g == "intermedio": seq = [("tipo" if (j // 2) % 2 == 0 else "forma") for j in range(n)]
        else: seq = [R.choice(["tipo", "forma"]) for _ in range(n)]
        ens = [{"ing": R.choice(FV), "regla": r} for r in seq]
        add("5-espacio", g, dict(formato="regla", consigna="Mirá el gorro y ubicá cada cosa.", ensayos=ens, aviso=g == "facil", reglas=REGLAS,
            pista1="¿Qué dice el gorro ahora?", ok="Cambiaste de regla cuando cambió el gorro."))

# Rincón 6 · Zona (E2): comprender
for k in range(4):
    obj = R.choice(list(HELADERA)); dis = R.sample([i for i in ALACENA + HELADERA if i != obj], 2)
    add("6-zona", "facil", dict(formato="elegir", consigna=f"Señalá: {nomb(obj)}.", opciones=ops(R.sample([obj] + dis, 3)), correcta=obj, sin_nombre=True, audio_objetivo=True,
        tipo_error="confundio-palabra", pista1="Escuchá otra vez el nombre.", ok="Escuchaste y encontraste lo que se pedía."))
for k, (a, b) in enumerate([("bol", "grande"), ("cuchara", "chica"), ("plato", "grande"), ("taza", "chica")]):
    opsx = [{"id": "ok", "ut": a, "tam": b}, {"id": "m1", "ut": a, "tam": "chica" if b == "grande" else "grande"}, {"id": "m2", "ut": R.choice(["fuente", "olla", "colador"]), "tam": b}]
    add("6-zona", "intermedio", dict(formato="elegir", consigna=f"Tocá {'el' if a in ('bol','plato') else 'la'} {UT[a]['nombre']} {b}.", opciones=R.sample(opsx, 3), correcta="ok", sin_nombre=True,
        tipo_error="omitio-atributo", pista1="Fijate en el tamaño.", ok="Te fijaste en el objeto y en su tamaño."))
for k, (acc, ut, malas) in enumerate([("batir", "batidor", ["cuchara", "colador"]), ("colar", "colador", ["bol", "batidor"]), ("untar", "cuchillo_untar", ["cuchara", "taza"]), ("estirar la masa", "rodillo", ["espatula", "plato"])]):
    add("6-zona", "dificil", dict(formato="elegir", escena_chef={"accion": acc, "ut": ut}, consigna=f"¿Qué usó el chef para {acc}?", opciones=R.sample([{"id": ut, "ut": ut}] + [{"id": m, "ut": m} for m in malas], 3),
        correcta=ut, pista1="Mirá otra vez lo que hizo el chef.", ok="Recordaste lo que viste en la escena."))
# Rincón 6 · Espacio (E3): armar y explicar con tarjetas
for k, (frase, ok_, malas) in enumerate([("Para cortar el pan usamos el ___.", "cuchillo", ["bol", "colador"]), ("Para batir los huevos usamos el ___.", "batidor", ["plato", "rodillo"]),
                                          ("Para colar los fideos usamos el ___.", "colador", ["batidor", "taza"]), ("Para medir la leche usamos la ___.", "taza", ["espatula", "sarten"])]):
    add("6-espacio", "facil", dict(formato="elegir", consigna=frase, opciones=R.sample([{"id": ok_, "ut": ok_, "txt": UT[ok_]["nombre"]}] + [{"id": m, "ut": m, "txt": UT[m]["nombre"]} for m in malas], 3),
        correcta=ok_, nota_adulto="El cuchillo lo usa siempre el adulto." if ok_ == "cuchillo" else None, tipo_error="tarjeta-incorrecta", pista1="¿Qué usás para eso en tu casa?", ok="Elegiste la palabra que completa la frase."))
for k, (ins, seq) in enumerate([("Poné el huevo en el bol y después buscá el batidor.", ["huevo", "bol", "batidor"]), ("Buscá la taza y después la leche.", ["taza", "leche"]),
                                ("Poné el pan en el plato y después el queso.", ["pan", "plato", "queso"]), ("Buscá el colador y después los fideos.", ["colador", "fideos"])]):
    pool = list(dict.fromkeys(seq + R.sample(["cuchara", "fuente", "manzana", "harina", "olla"], 3)))
    add("6-espacio", "intermedio", dict(formato="secuencia_toques", consigna=ins, objetos=R.sample(pool, len(pool)), orden=seq, pista1="Hacé primero lo primero que dijo.", ok="Seguiste las instrucciones en orden."))
for k, rid in enumerate(["ensalada_frutas", "bolitas_coco", "yogur_cereales", "sandwich_queso"]):
    pasos = pasos_txt(rid)[:4]
    add("6-espacio", "dificil", dict(formato="ordenar", receta=rid, consigna="Armá las instrucciones para otro chef.", pasos=pasos, tarjetas_oracion=True,
        pista1="Pensá cómo se lo contarías a alguien.", ok="Armaste instrucciones que otro chef puede seguir."))

# Rincón 7: la cocina de juego (acciones por botón; fuego y filo los usa el chef en 3–12)
for g, rids, modelo in [("facil", ["ensalada_frutas", "bolitas_coco", "yogur_cereales", "tostadas"], "permanente"),
                        ("intermedio", ["sandwich_queso", "ensalada_verde", "bizcochuelo", "panqueques"], "a_pedido"),
                        ("dificil", ["pizza", "galletitas", "fideos_salsa", "tarta_verdura"], "guia")]:
    for rid in rids:
        add("7-zona", g, dict(formato="cocina", receta=rid, consigna=f"Preparemos: {REC[rid]['nombre'].lower()}.", modelo=modelo, pasos=REC[rid]["pasos"][:4 if g != "dificil" else 5],
            pista1="Mirá qué hizo el chef en este paso.", ok="Hiciste los pasos como el chef."))
for g, rids, modelo in [("facil", ["ensalada_frutas", "bolitas_coco", "yogur_cereales", "sandwich_queso"], "primer_paso"),
                        ("intermedio", ["panqueques", "pizza", "galletitas", "arroz_verduras"], "ninguno")]:
    for rid in rids:
        add("7-espacio", g, dict(formato="cocina", receta=rid, consigna=f"Preparemos: {REC[rid]['nombre'].lower()}.", modelo=modelo, pasos=REC[rid]["pasos"][:5],
            instrucciones_parciales=g == "intermedio", pista1="¿Qué hacía falta en este paso?", ok="Cocinaste con menos ayuda."))
for k, rid in enumerate(["bizcochuelo", "pizza", "ensalada_frutas", "panqueques"]):
    ps = REC[rid]["pasos"]; falta = R.randrange(1, len(ps) - 1)
    hechos = [p["texto"] for j, p in enumerate(ps) if j != falta]
    add("7-espacio", "dificil", dict(formato="elegir", receta=rid, consigna="¿Falta algo?", secuencia=hechos, tipo_error="no-detecto-error",
        opciones=R.sample([{"id": "ok", "txt": ps[falta]["texto"]}, {"id": "m1", "txt": "Lavar los platos"}, {"id": "m2", "txt": "Nada, está todo"}], 3), correcta="ok",
        pista1="Pensá qué hace falta para que salga.", ok="Revisaste lo hecho y encontraste lo que faltaba."))

# Rincón 8: el gran reto (etapas que integran los rincones; cada etapa se registra por separado)
def etapas_8a(rid, k):
    r = REC[rid]; otra = R.choice([x for x in RECETAS if x["dulce"] != r["dulce"] and "6-8" in x["rutas"]])
    lista = r["ingredientes"][:3]
    return [
      dict(rincon=1, formato="elegir", consigna=f"Elegí una receta {'dulce' if r['dulce'] else 'salada'}.", opciones=[{"id": rid, "receta": rid}, {"id": otra["id"], "receta": otra["id"]}], correcta=rid, ok="Elegiste la receta."),
      dict(rincon=2, formato="buscar", consigna="Buscá lo de la lista.", lista=lista, escena=R.sample(lista + R.sample([i for i in ALACENA + HELADERA if i not in lista], 5), len(lista) + 5), lugar="alacena", ok="Juntaste los ingredientes."),
      dict(rincon=3, formato="carrito", consigna=f"Poné {3 + k % 2} en el carrito.", ing=lista[0], cantidad=3 + k % 2, maximo=5, ok="Contaste bien."),
      dict(rincon=4, formato="ordenar", consigna="Ordená los pasos.", pasos=pasos_txt(rid)[:3], modelo_disponible=True, ok="Ordenaste los pasos."),
      dict(rincon=7, formato="cocina", consigna="¡A cocinar!", modelo="a_pedido", pasos=r["pasos"][:3], ok="Preparaste la receta."),
    ]
for g, rids in [("facil", ["ensalada_frutas", "yogur_cereales", "sandwich_queso", "bolitas_coco"]), ("intermedio", ["panqueques", "pizza", "bizcochuelo", "tostadas"]),
                ("dificil", ["galletitas", "fideos_salsa", "ensalada_verde", "tarta_verdura"])]:
    for k, rid in enumerate(rids):
        et = etapas_8a(rid, k)
        apoyo_por_etapa = {"facil": 2, "intermedio": 1, "dificil": 0}[g]
        add("8-zona", g, dict(formato="aventura", receta=rid, consigna="Hoy cocinamos de principio a fin.", situacion=f"Hoy preparamos {REC[rid]['nombre'].lower()}.",
            etapas=et if g != "facil" else [e for e in et if e["rincon"] != 3] , apoyo_por_etapa=apoyo_por_etapa, ok="Hiciste toda la receta."))
IMPREVISTOS = [
  ("No hay manteca.", [{"id": "reemplazar", "txt": "Usar aceite en su lugar"}, {"id": "cambiar", "txt": "Hacer otra receta"}, {"id": "nada", "txt": "Seguir sin decir nada"}], ["reemplazar", "cambiar"]),
  ("Vienen dos amigos más.", [{"id": "adaptar", "txt": "Hacer más cantidad"}, {"id": "cambiar", "txt": "Hacer algo que rinda más"}, {"id": "nada", "txt": "Hacer lo mismo"}], ["adaptar", "cambiar"]),
  ("El súper no tiene la harina de siempre.", [{"id": "reemplazar", "txt": "Comprar otra harina"}, {"id": "cambiar", "txt": "Elegir otra receta"}, {"id": "nada", "txt": "Volver sin nada"}], ["reemplazar", "cambiar"]),
  ("Se terminó el presupuesto.", [{"id": "menos", "txt": "Comprar menos cosas"}, {"id": "cambiar", "txt": "Cambiar de receta"}, {"id": "nada", "txt": "Pagar con lo que no hay"}], ["menos", "cambiar"]),
]
SITUACIONES = ["Hoy vienen amigos a merendar.", "Es el cumpleaños de la abuela.", "Hay una juntada en el club.", "Hoy cocinamos para la familia.",
               "Vamos de picnic a la plaza.", "Llueve y nos quedamos en casa.", "Vienen los primos a cenar.", "Hay que llevar algo a la escuela."]
for g, n_imp in [("facil", 1), ("intermedio", 2), ("dificil", 3)]:
    for k in range(8):
        rid = R.choice([r["id"] for r in RECETAS if "9-12" in r["rutas"]])
        et = etapas_8a(rid, k)
        imps = R.sample(IMPREVISTOS, n_imp)
        pos = R.sample(range(1, len(et)), n_imp)
        for (txt, opciones, validas), p in sorted(zip(imps, pos), key=lambda x: -x[1]):
            et.insert(p, dict(rincon=8, formato="elegir", imprevisto=True, consigna=txt, pregunta="¿Qué hacemos?", opciones=opciones, correctas=validas, tipo_error="alternativa-no-valida", ok="Buscaste otra opción."))
        add("8-espacio", g, dict(formato="aventura", receta=rid, situacion=SITUACIONES[k], consigna=SITUACIONES[k], etapas=et, apoyo_por_etapa=0, como_salio=True, ok="Resolviste los imprevistos."))

# 3–5: en 2B solo Fácil con 2 ingredientes (FEC 5.11)
for it in banco["2-espacio"]["facil"]:
    if len(it["lista"]) > 2: it["rutas"] = [r for r in it["rutas"] if r != "3-5"]

# ---------------- Textos (borrador; los de PSP-SR van literales cuando lleguen) ----------------
TEXTOS = {
 "rotulo": "Contenido de prueba no validado",
 "nino": {"cocinaConsigna": "¿A qué rincón de la cocina vamos?", "historiaTitulo": "¡Hoy cocinamos!", "escuchar": "Escuchar", "escucharHistoria": "Escuchar la historia",
   "ayuda": "Pedir ayuda", "seguir": "Seguir", "volver": "Volver a la cocina", "empezar": "Empezar", "siguiente": "Siguiente", "anterior": "Anterior", "alaCocina": "Ir a la cocina",
   "ofrecerAyuda": "Si querés, pedí ayuda.", "listo": "Listo", "yaMire": "Ya miré", "verLista": "Ver la lista otra vez", "recetario": "Mi recetario",
   "tarjetaNueva": "¡Nueva tarjeta para tu recetario!", "tarjetaOtraVez": "¡Otra receta para tu recetario!", "ideaTitulo": "Idea para hacer fuera de la pantalla",
   "otraVez": "Jugar otra vez", "pedirChef": "Pedile al chef que", "cierreTiempo": "Por hoy cocinamos un montón. Seguimos otro día.",
   "cierrePiso": "Hoy practicaste mucho. Probemos otro rincón.", "recetaEnCurso": "Receta de hoy", "cambiarReceta": "Cambiar la receta",
   "comoSalio": "¿Cómo salió?", "verHistoria": "Ver la historia", "mejora": "Esta vez lo hiciste con menos ayuda.", "carritoQuitar": "Sacar uno", "carritoPoner": "Poner uno",
   "borrar": "Borrar", "pagar": "Pagar", "total": "Total", "tenes": "Tenés", "calculadora": "Calculadora"},
 "historia": [
   {"lamina": "cocina", "frases": ["Esta es la cocina.", "Acá cocinamos juntos."]},
   {"lamina": "chef", "frases": ["Te presento al chef y al ayudante.", "El chef usa el horno y el cuchillo."]},
   {"lamina": "rincones", "frases": ["La cocina tiene ocho rincones.", "Podés ir al que quieras."]},
 ],
 "como_salio": [{"id": "como-queriamos", "txt": "Salió como queríamos"}, {"id": "cambiamos", "txt": "Cambiamos algo y salió igual"}, {"id": "distinto", "txt": "La próxima lo haría distinto"}],
 "contar": {"titulo": "Contar (con la persona adulta)", "pregunta": "¿Qué te ayudó?", "opciones": [{"id": "mirar", "txt": "Mirar bien"}, {"id": "pensar", "txt": "Pensar antes"}, {"id": "ayuda", "txt": "Pedir ayuda"}, {"id": "otra", "txt": "Otra cosa"}],
            "oral": "Pedile que te cuente cómo lo hizo, sin mirar la pantalla. Escuchá sin corregir.", "con_adulto_3_5": "En 3 a 5 años, «Contar» se hace con la persona adulta."},
 "adulto": {"intro": "Prototipo para probar cómo se juega. Banco de prueba armado por DEV-IA con los ejemplos de la FEC-016; falta la validación de PSP-SR.",
   "parlante": "Ningún texto suena solo: tocá el parlante para escuchar cualquier texto.", "letra": "La letra es un apoyo de acceso. Si hay un ejercicio en curso, el cambio rige desde el siguiente.",
   "libre": "En modo libre, quien juega no ve Estación, grado ni variante. Pasar de Zona a Espacio nunca es automático.",
   "sinExposicion": "Sin exposición breve en «Los retos del chef» (el modelo queda a la vista)", "sinArrastre": "Arrastrar es opcional: siempre se puede tocar y después tocar el destino.",
   "letraSiguiente": "La letra cambia en el próximo ejercicio.", "ruta1318": "13 a 18 años: incluida por decisión de la supervisora (D1), pero deshabilitada en este prototipo hasta tener los textos de PSP-SR (RT-CHF-001, pregunta T1)."},
 "ideaNota": "Opcional, sin registro, sin cocinar y sin comprar nada.",
 "desafio": {"titulo": "Cocinamos de verdad (desafío para casa, opcional)", "aviso_alergias": "Antes de empezar, revisen los ingredientes si alguien en casa tiene alergia a algún alimento o celiaquía.",
   "higiene": "Lávense las manos antes de empezar. No prueben masa ni harina crudas.", "lo_hicimos": "Lo hicimos", "nota": "Opcional y no diario. Sin fotos, sin calificar y sin cronometrar. Las tareas del chico son sin calor, sin filo y sin electrodomésticos."},
}
IDEAS = {1: "Abran la alacena: busquen tres cosas dulces y tres saladas.", 2: "Uno dice tres cosas de la heladera; el otro las busca sin mirar una lista.",
  3: "La próxima vez que vayan a comprar, que lleve la cuenta de cuántas cosas ponen en la bolsa.", 4: "Cuenten en orden cómo se prepara un vaso de leche con cacao: ¿qué va primero?",
  5: "En la mesa, junten todas las cucharas; ahora, todo lo que sea de metal.", 6: "Jueguen a «adiviná el utensilio»: uno lo describe y el otro lo adivina.",
  7: "Pongan la mesa juntos: platos, vasos y cubiertos sin filo.", 8: "Piensen juntos qué podrían preparar si vinieran visitas mañana."}
ESTRATEGIA = {v[0]: {"asi_se_juega": t, "estrategia": e} for v, (t, e) in zip(V, [
 ("Mirá las recetas y elegí.", "Primero miro qué lleva cada receta."), ("Leé las condiciones y elegí.", "Reviso cada condición, de a una."),
 ("Buscá en la despensa lo de la lista.", "Miro la lista y busco de a uno."), ("Mirá la lista y tocá «Ya miré».", "Digo la lista en voz baja para recordarla."),
 ("Contá y poné en el carrito.", "Cuento de a uno, tocando cada cosa."), ("Hacé la cuenta y pagá.", "Me fijo cuánto tengo y cuánto cuesta."),
 ("Ordená los pasos de la receta.", "Pienso qué va primero, después y al final."), ("Pensá qué va antes y qué mientras.", "Me pregunto qué hace falta antes."),
 ("Encontrá el igual al modelo.", "Miro con cuidado antes de tocar."), ("Mirá el gorro y ubicá cada cosa.", "Antes de ubicar, miro el gorro."),
 ("Escuchá y tocá lo que se pide.", "Escucho todo hasta el final."), ("Armá frases con las tarjetas.", "Leo la frase completa antes de elegir."),
 ("Mirá al chef y hacé lo mismo.", "Miro qué usa el chef y qué hace."), ("Cociná con menos ayuda.", "Me acuerdo de lo que hizo el chef."),
 ("Prepará todo, paso a paso.", "Hago una cosa por vez."), ("Si algo cambia, buscá otra opción.", "Si algo falta, pienso en otra opción."),
])}
DESAFIO_RECETAS = ["ensalada_frutas", "yogur_cereales", "sandwich_queso", "bolitas_coco"]

# ---------------- Ficha técnica (M04-1, EST-08) ----------------
variantes = []
for vid, rin, nombre_accion, est, hab, sec in V:
    variantes.append(dict(variante=vid, rincon=rin, nombre_variante="Zona" if vid.endswith("zona") else "Espacio", nombre_accion=nombre_accion, rincon_nino=RINCON[rin],
        rincon_fec=RINCON_DR[rin], titulo_nino=ACCION_NINO[vid], estacion=est, estacion_provisoria=vid in ("3-zona", "3-espacio", "5-zona"), habilidad_referencia=hab, secundarias=sec,
        grados={g: {"que_cambia": DESC[vid][i], "dimension": DIM[vid][i]} for i, g in enumerate(GR)}, disponibilidad=DISP[vid], transferencia="B",
        texto_transferir="Se practica en una situación nueva, con imprevistos. Lo que se observa acá no se generaliza solo: conviene practicarlo en la vida diaria con apoyo." if vid == "8-espacio" else None,
        apoyos=APOYOS[vid], tipos_error=TIPOS_ERROR[vid], idea_fuera=IDEAS[rin], recetas_usadas=sorted({it.get("receta") for g in GR for it in banco[vid][g] if it.get("receta")})))
# Recetas usadas con alérgenos (REQ-CLI-CHF-28)
for v in variantes: v["recetas_alergenos"] = {r: REC[r]["alergenos"] for r in v["recetas_usadas"]}

modulo = dict(id="chef", nombre="Chef en Acción", nombre_trabajo=True, tipo="herramienta", version=VERSION, fecha=FECHA,
  fec="FEC-016 v0.3", revision_tecnica="RT-CHF-001 v1.0", estado="borrador: sin registro de aprobación · solo entorno de prueba con datos sintéticos", activo=True,
  _nota="Ficha técnica generada por scripts/chef_generar.py. Estación, habilidades, grados, disponibilidades y reglas salen de la FEC-016 v0.3 (contenido clínico de PSP-SR, nivel C). Recetas, consignas y devoluciones son borrador de DEV-IA, pendientes de PSP-SR.",
  ficha=dict(
    proposito="Practicar habilidades cognitivas y funcionales dentro de una actividad cotidiana: elegir, reunir, comprar, organizar y preparar una receta.",
    para_que_sirve="En esta aventura se prepara una receta de principio a fin: elegir qué cocinar, buscar los ingredientes, hacer las compras, ordenar los pasos y cocinar en una cocina de juego. Cada parte se puede jugar por separado. Sirve para practicar cosas que usamos todos los días: recordar, contar, calcular, entender consignas y planificar.",
    texto_profesional_7_1="Esta aventura no es una evaluación de funciones ejecutivas, memoria, atención, lenguaje ni conducta adaptativa, y no tiene baremos. El registro describe cómo se resolvieron estas actividades y con qué apoyos; no describe a la persona. Si observa dificultades persistentes en actividades de la vida diaria, considere una evaluación con instrumentos estandarizados y, según el caso, la interconsulta con terapia ocupacional, fonoaudiología o psicología.",
    transferencia_B="Lo que se practica acá mejora estas actividades. No hay evidencia de que mejore por sí solo la memoria, la atención o la velocidad en general.",
    nivel_evidencia="C", rotulo_evidencia="Basada en práctica clínica, con evidencia limitada", edad="3 a 18 años (13 a 18 deshabilitada en el prototipo, T1)",
    dosis_sugerida="1 o 2 rincones por sesión, 2 o 3 veces por semana; el gran reto, en una sesión propia.", dosis_nota="Propuesta de PSP-SR [Suposición, nivel C], sin estudios que la respalden.",
    limitacion="Para personas ciegas, la cocina visual no es accesible (limitación declarada).", riesgo="Alto (Ejercitación adaptativa). Desafío para casa: Medio (M06)."),
  decisiones_supervisora={"D1": "Ruta 13–18 incluida con presentación no infantil", "D2": "Rincones", "D3": "Zona (ex A) y Espacio (ex B)"},
  por_defecto_mientras_tanto={"P4": "precios inventados y redondos", "P5": "sin «Conocé la cocina»", "P9": "audio solo con parlante y letra elegible", "P10": "desafío para casa solo sin cocción en todas las rutas"},
  audio={"automatico": False}, letra={"por_defecto": {"3-5": "mayuscula", "6-8": "mayuscula", "9-12": "minuscula", "13-18": "minuscula"}}, consigna_breve_max=60,
  apoyos_escala={"niveles": ["Sin apoyo de aprendizaje", "Pista general", "Ayuda específica", "Demostración"], "retiro": "El ejercicio siguiente empieza un nivel por debajo del máximo usado, hasta 0."},
  m10={"ventana": 10, "minimo": 5, "subir_aciertos": 0.85, "subir_sin_ayuda": 0.7, "mantener_desde": 0.6, "errores_seguidos": 3, "_nota": "Heredado de FEC-015 hasta la respuesta de PSP-SR (T3)."},
  error_repetido_umbral=3,
  exposicion_5a={"inicial_ms": 2500, "paso_ms": 300, "minimo_ms": {"6-8": 1000, "9-12": 700, "13-18": 700}, "pausa_ms": 500, "precision_para_acortar": 0.85, "una_vez_por_sesion": True, "_nota": "Heredado de 8A de FEC-015 hasta T2."},
  rutas={"3-5": {"sesion_min": 10, "items_por_ronda": 4, "con_adulto": True}, "6-8": {"sesion_min": 20, "items_por_ronda": 4}, "9-12": {"sesion_min": 25, "items_por_ronda": 4}},
  rutas_deshabilitadas={"13-18": TEXTOS["adulto"]["ruta1318"]},
  coccion_13_18=False,
  estaciones={"variantes": variantes},
  dinero={"billetes": [10, 20, 50, 100, 200, 500, 1000], "monedas": [1, 2, 5], "precios": "inventados y redondos (P4)", "acumulado": False},
  palabras_no_admitidas={
    "todas": ["mision", "misiones", "chatarra", "engorda", "engordar", "caloria", "calorias", "dieta", "dietas", "light", "sano", "sana", "insalubre", "prohibido", "prohibida", "alcohol", "vino", "cerveza",
              "genio", "inteligente", "fallaste", "rapido", "rapida", "cerebro", "tdah", "tea", "dislexia", "autismo"],
    "nino": ["estacion", "nivel", "facil", "intermedio", "dificil", "zona", "espacio", "desafio", "desafios", "estimulacion"],
    "familia": ["estimulacion", "madurez"]},
  originalidad="Arte SVG de relleno dibujado en código, sin imágenes externas ni IA generativa. Los nombres de los productos de referencia (FEC I.3.F) se controlan por huella en scripts/originalidad.py.")

banco_out = dict(version=VERSION, fecha=FECHA, fec="FEC-016 v0.3", estado=PEND, ingredientes=ING, utensilios=UT, acciones=ACCIONES, recetas=RECETAS,
  textos=TEXTOS, estrategias=ESTRATEGIA, desafio_recetas=DESAFIO_RECETAS, atragantamiento_3_5=sorted(i for i in ING if ING[i].get("atragantamiento_3_5")),
  variantes=banco)
dest.mkdir(parents=True, exist_ok=True)
(dest / "banco.json").write_text(json.dumps(banco_out, ensure_ascii=False, indent=1))
(dest / "modulo.json").write_text(json.dumps(modulo, ensure_ascii=False, indent=1))
n = sum(len(banco[v][g]) for v in banco for g in GR)
print(f"ok chef: {n} ítems en {len(V)} variantes, {len(RECETAS)} recetas, {len(ING)} ingredientes")

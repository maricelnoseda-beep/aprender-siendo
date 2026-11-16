#!/usr/bin/env python3
"""«Los cuatro exploradores» (FEC-015 v0.3 + RT-CEX-001-R v1.0): genera la ficha técnica (modulo.json) y el banco de prueba (banco.json).

Contenido de prueba: no hay registro de aprobación. Los parámetros por grado traducen a código lo que dice la FEC-015 v0.3 (PSP-SR,
nivel C). Los textos para quien juega, los conjuntos de letras y palabras y los nombres de los lugares salen de RT-CEX-001-R v1.0
(validados por PSP-SR, pendientes de aprobación de la supervisora). Los textos de interfaz que PSP-SR no mandó siguen siendo propuesta
de DEV-IA y están marcados. El banco se arma con una semilla fija: el mismo comando da siempre el mismo banco.

Uso: python3 scripts/exploradores_generar.py   (escribe app/herramientas/exploradores/{modulo,banco}.json)
"""
import json, math, pathlib, random

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DIR = RAIZ / "app" / "herramientas" / "exploradores"
rnd = random.Random(15015)
TODAS = ["3-5", "6-8", "9-12"]
LEEN = ["6-8", "9-12"]
PENDIENTE = "propuesta de DEV-IA · pendiente de PSP-SR (RT-CEX-001 v1.1)"
VALIDADO = "validado por PSP-SR"   # RT-CEX-001-R v1.0: validado por PSP-SR, pendiente de aprobación de la supervisora

# ------------------------------------------------------------------ textos ------------------------------------------------------------------
NOMBRES = {"huella": "huella de perro", "huella_pajaro": "huella de pájaro", "huella_conejo": "huella de conejo", "hoja": "hoja", "hoja_roble": "hoja con puntas",
           "hoja_larga": "hoja larga", "piedra": "piedra", "piedra_triangular": "piedra con punta", "piedra_cuadrada": "piedra cuadrada", "llave": "llave",
           "mochila": "mochila", "linterna": "linterna", "pelota": "pelota", "zapato": "zapato", "regadera": "regadera", "flor": "flor", "carpa": "carpa",
           "carpa_bandera": "carpa con bandera", "engranaje": "engranaje", "bandera": "bandera", "hueso": "hueso", "tronco": "tronco", "arbol": "árbol",
           "arbusto": "arbusto", "hongo": "hongo", "pluma": "pluma", "taza": "taza", "gorro": "gorro", "caracol": "caracol", "pina": "piña", "cartel": "cartel",
           "puerta": "puerta", "chispa": "chispa", "fuente": "fuente", "cofre": "cofre", "tesoro": "tesoro", "pieza": "pieza del mapa", "lupa": "lupa",
           "roco": "Roco", "michi": "Michi", "luna": "Luna", "tomas": "Tomás", "letra": "letra"}
COLORES = {"verde": "verde", "sol": "amarillo", "coral": "naranja", "lila": "lila", "celeste": "celeste", "gris": "gris", "marron": "marrón", "dorado": "dorado",
           "plata": "plateado", "azul": "azul", "crema": "crema"}

NINO = {
    "_estado": "Textos fijos de pantalla. Los que vienen de RT-CEX-001-R v1.0 (sección 2) están listados en _validados; el resto es " + PENDIENTE + ". Nada suena solo: se escucha al tocar el parlante (D7).",
    "_validados": ["cajaLuna", "cajaOtras", "mostrarMas", "girar", "listo", "empezarAMover", "verModelo", "miraElCofre", "tocaLasHojas", "yaMire", "estaba", "noEstaba",
                   "esIgual", "noEsIgual", "elegiComo", "cumple", "si", "revisar", "yaEncontraste", "escucharHistoria", "demostracion", "relaciones.arriba", "relaciones.abajo",
                   "criterios.forma", "criterios.color", "criterios.marca", "tesoroTexto"],
    "escuchar": "Escuchar", "escucharHistoria": "Escuchar la historia", "historiaTitulo": "La gran aventura", "anterior": "Antes", "siguiente": "Seguir", "alMapa": "Ir al mapa",
    "mapaConsigna": "Elegí un lugar del bosque.", "piezaLista": "Ya tenés esta pieza", "piezasEtiqueta": "Piezas del mapa", "pieza": "Pieza del mapa",
    "abrirTesoro": "¡Abrir el tesoro!", "verHistoria": "Ver la historia", "volverMapa": "Volver al mapa", "empezar": "Empezar", "ayuda": "Pedir una pista",
    "ofrecerAyuda": "¿Querés una pista?", "seguir": "Seguir", "cierreTiempo": "Por hoy terminamos. ¡Gracias por explorar!",
    "cierrePiso": "Probaste de muchas formas. Otro día seguimos.", "piezaNueva": "¡Una pieza nueva del mapa!", "piezaOtraVez": "Exploraste otra vez este lugar.",
    "ideaTitulo": "Para jugar fuera de la pantalla", "otraVez": "Jugar otra vez", "tesoroTitulo": "¡El tesoro!",
    "tesoroTexto": ["¡Juntamos todas las piezas! Encontramos el tesoro.", "Es una lupa de explorador para seguir mirando afuera."],
    "letra": "letra", "cajaLuna": "Caja de iguales", "cajaOtras": "Caja de distintos",
    "antes": "Antes", "ahora": "Ahora", "yaEncontraste": "Ya encontraste {k} de {n}.", "sombra": "Sombra", "imagenTapada": "Imagen tapada", "mostrarMas": "Despejar un poco",
    "buscamos": "Buscamos esto", "escena": "Escena", "acercar": "Acercar", "alejar": "Alejar", "laberinto": "Laberinto",
    "hayArbusto": "Ahí hay un arbusto. Probá por otro lado.", "girar": "Girar", "listo": "Listo", "empezarAMover": "Empezar a mover", "cartelApunta": "El cartel apunta a",
    "caminoDe": "Camino de la fábrica", "empezaEnLaChispa": "Empezá en la chispa.", "seguiDondeQuedaste": "Seguí desde donde quedaste.", "punto": "Punto",
    "tocaEnOrden": "Tocá los puntos en orden.", "modelo": "Modelo", "verModelo": "Ver el modelo", "tablero": "Tablero de puntos",
    "miraElCofre": "Mirá lo que Michi guarda en el cofre.", "yaMire": "Ya miré", "cofreCerrado": "Cofre cerrado",
    "cofreCierra": "Michi cierra el cofre…", "tocaLasHojas": "Ahora tocá las hojas que caen.", "hoja": "Hoja", "estaba": "Estaba", "noEstaba": "No estaba",
    "casillero": "Casillero", "vacio": "Lugar vacío", "collarDeRoco": "El collar de Roco", "esIgual": "Es igual", "noEsIgual": "No es igual",
    "guardarEn": "Guardar", "mirala": "Mirala otra vez", "pausaBosque": "Bosque tranquilo", "elegiComo": "¿Cómo vas a buscar? Elegí una forma.", "juntaste": "Juntaste:",
    "empezarDeNuevo": "Empezar de nuevo", "cumple": "¿Cumple todas las pistas?", "si": "Sí, listo", "revisar": "Reviso", "su": "Roco mira para este lado",
    "demostracion": "Así se resuelve este paso. Ahora probá vos.",
    "mover": {"arriba": "Mover para arriba", "abajo": "Mover para abajo", "derecha": "Mover a la derecha", "izquierda": "Mover a la izquierda"},
    "relaciones": {"arriba": "Arriba", "abajo": "Abajo", "al-lado": "Al lado", "adentro": "Adentro", "afuera": "Afuera", "adelante": "Adelante", "atras": "Atrás"},
    "criterios": {"forma": "Por la forma", "color": "Por el color", "marca": "Por la marca", "tamano": "Por el tamaño"},
    "contar": {"titulo": "Contar", "conAdulto": "Para hacer con la persona adulta.", "ayudo": "¿Qué te ayudó?", "resulto": "¿Cómo te resultó?",
               "opciones_resulto": [{"id": "me-salio", "cara": "🙂", "txt": "Me salió"}, {"id": "medio", "cara": "😐", "txt": "Más o menos"}, {"id": "costo", "cara": "😕", "txt": "Me costó"}],
               "sugerencia_niebla": "Contale a alguien qué era la imagen escondida."},
}
ADULTO = {
    "intro": "Para la persona adulta. Quien juega ve un mapa con lugares; no ve la Estación, el grado ni los aciertos.",
    "parlante": "Tocá el parlante para escuchar cualquier texto.",
    "letra": "Cambia la forma de la letra en lo que ve quien juega. También se cambia con ABC / abc arriba; si hay un ejercicio en curso, el cambio rige desde el siguiente. Es un apoyo de acceso y no cuenta como ayuda. Los retos con letras usan letras pensadas para cada forma.",
    "letraSiguiente": "La letra cambia desde el próximo ejercicio.",
    "libre": "Los retos están abiertos desde el inicio, sin orden obligatorio ni desbloqueos. El grado se ajusta solo dentro de cada reto y por habilidad; nunca cambia de reto ni de Estación solo.",
    "sinTrazoFino": "Sin trazo fino (Juego 6): se une tocando los puntos en orden. Así ya no se practica integración visomotora y el registro va a organización y planificación.",
    "sinExposicionBreve": "Sin exposición breve (Juego 8A): las pistas no se tapan. Los tiempos quedan marcados como «sin exposición breve».",
    "evitarColor": "Evitar diferencias solo de color (Juego 1).",
    "audioNombres": "Permitir escuchar el nombre de cada imagen en el cofre (Juego 7A). Si se usa, el registro lo indica.",
    "audio": "Nada suena solo (D7): cada texto tiene un parlante al lado y se escucha solo al tocarlo. En 3 a 5 años, una persona adulta acompaña siempre: toca el parlante o lee en voz alta.",
}
TEXTOS = {"rotulo": "Contenido de prueba", "letraGrupo": "Forma de la letra", "letraMayuscula": "Letra mayúscula imprenta",
          "letraMinuscula": "Letra minúscula imprenta", "ideaNota": "Opcional. Sin registro, sin fotos y sin evaluar a nadie. Con cosas que ya hay en casa.",
          "adulto": ADULTO, "nino": NINO}

HISTORIA = {   # RT-CEX-001-R 2.1
    "estado_clinico": VALIDADO,
    "laminas": [
        {"lamina": "historia_mapa", "descripcion": "Los cuatro encuentran un mapa viejo; Roco lo olfatea",
         "frases": ["Luna, Tomás, Roco y Michi encuentran un mapa viejo.", "¡Tiene dibujado un tesoro!"]},
        {"lamina": "bosque", "descripcion": "La entrada luminosa del Bosque de los Mil Secretos",
         "frases": ["El mapa los lleva al Bosque de los Mil Secretos.", "Para llegar al tesoro hay ocho retos."]},
        {"lamina": "historia_lugares", "descripcion": "El mapa con los lugares de los retos",
         "frases": ["En cada reto hay que mirar con mucha atención.", "Comparar, buscar, recordar y encontrar caminos."]},
        {"lamina": "historia_bosque", "descripcion": "Los cuatro miran hacia quien juega",
         "frases": ["Vos sos el quinto explorador del equipo.", "¡Vamos a resolverlos juntos!"]},
        {"lamina": "historia_piezas", "descripcion": "El mapa con un hueco para cada pieza",
         "frases": ["Cada reto que juguemos nos da una pieza del mapa.", "Podés empezar por el lugar que quieras."]},
    ],
    "guia_adulto_3_5": "Acompañe sin dar las respuestas. Puede tocar el parlante, tocar «Escuchar la historia» o leer cada texto en voz alta.",
    "tesoro_descripcion": "Una lupa de explorador dibujada junto al cofre abierto",
}

# RT-CEX-001-R 2.3: «Así se juega», dos frases. La primera dice qué se hace; la segunda, la estrategia de la FEC.
# La estrategia larga de la FEC-015 queda en la ficha profesional de cada variante.
ESTRATEGIAS_FEC = {
    "objetos": "Miro una parte por vez y comparo: la forma, el tamaño, el color, los detalles.",
    "sombras": "Me fijo en la forma, no en el color ni en el tamaño. Si está girada, la giro en mi cabeza.",
    "niebla": "Miro las partes que se ven y pienso qué cosa tiene esas partes.",
    "jardin": "Primero miro bien qué busco. Después recorro el jardín de a una parte, sin saltar.",
    "laberinto": "Me pongo en el lugar de Roco: ¿para dónde mira? Después sigo una indicación por vez.",
    "fabrica": "Miro dónde empieza, voy despacio y miro el modelo cada tanto.",
    "cofre_cuales": "Miro cada imagen y le pongo un nombre en mi cabeza.",
    "cofre_orden": "Digo el orden bajito: primero, después, al final.",
    "pistas_relampago": "Miro bien la pista del collar y comparo con cuidado.",
    "pistas_nuevas": "Pienso qué me sirvió antes y lo uso en este lugar nuevo.",
}
ASI_SE_JUEGA = {
    "objetos": ("Guardá en la caja las cosas iguales al modelo.", "Mirá una parte por vez: forma, tamaño y detalles."),
    "sombras": ("Las cosas cambiaron por magia. Llevalas a su sombra.", "Fijate en la forma, no en el color ni el tamaño."),
    "niebla": ("Hay algo escondido en la niebla. ¿Qué es?", "Mirá las partes que se ven y pensá qué las tiene."),
    "jardin": ("Buscá en el jardín solo lo que te pide Michi.", "Primero mirá qué buscás. Después, de a una parte."),
    "laberinto": ("Ayudá a Roco a encontrar el camino.", "Pensá hacia dónde mira Roco y seguí de a un paso."),
    "fabrica": ("Hacé el camino o la pieza igual al modelo.", "Mirá dónde empieza y andá despacio."),
    "cofre_cuales": ("Mirá lo que Michi guarda. Después, ¿estaba o no?", "A cada cosa ponele un nombre en tu cabeza."),
    "cofre_orden": ("Mirá el orden de las cosas y después armalo.", "Decí el orden bajito: primero, después, al final."),
    "pistas_relampago": ("Las pistas pasan de a una. ¿Es igual a la de Roco?", "Mirá bien antes de tocar. No hay apuro."),
    "pistas_nuevas": ("Este lugar es nuevo. Usá lo que ya sabés.", "Elegí cómo buscar y revisá si cumple todo."),
}
DEMO = "Así se resuelve este paso. Ahora probá vos."   # RT-CEX-001-R 2.4: frase de cierre común del nivel 3 (R10)
AYUDAS = {   # Nivel 1: RT-CEX-001-R 2.4 (validado). Nivel 2: propuesta de DEV-IA (pendiente). Nivel 3: frase común de PSP-SR.
    "_estado": "Nivel 1 y frase del nivel 3: " + VALIDADO + ". Nivel 2 y textos auxiliares: " + PENDIENTE + ".",
    "objetos": {"1": "Mirá otra vez el modelo.", "2": "Esta tiene algo distinto. ¿Qué es?", "3": DEMO,
                "quedan_dos": "Quedan dos. ¿Cuál es distinta?", "zona": "Mirá en esta parte.", "mostrada": "Acá había una diferencia. ¡Buscá las otras!"},
    "sombras": {"1": "Mirá la forma, no el color.", "2": "Esa sombra no es. Quedan menos.", "3": DEMO},
    "niebla": {"1": "Mirá las partes que se ven: ¿qué forma tienen?", "2": "Ahora se ve un poco más.", "3": DEMO, "quedan_dos": "Quedan dos. ¿Cuál es?"},
    "jardin": {"1": "Mirá otra vez qué buscamos.", "2": "Está en esta parte del jardín.", "3": DEMO},
    "laberinto": {"1": "Escuchá de nuevo la indicación.", "2": "Seguí la flecha del camino.", "3": DEMO,
                  "relacion2": "Mirá dónde está la cosa grande.", "cartel2": "Mirá dónde está lo que buscamos.", "su2": "Mirá hacia dónde mira Roco."},
    "fabrica": {"1": "Mirá dónde empieza.", "2": "Ahora el camino es más ancho.", "3": DEMO},
    "cofre_cuales": {"1": "¿Le pusiste nombre?", "2": "Miralas otra vez.", "3": DEMO},
    "cofre_orden": {"1": "Pensá cuál viste primero.", "2": "Una ya está en su lugar.", "3": DEMO, "segunda": "Miralas otra vez."},
    "pistas_relampago": {"1": "Mirá bien. No hay apuro.", "2": "Fijate en un detalle.", "3": DEMO},
    "pistas_nuevas": {"1": "Esto es como en otro reto. ¿En cuál?", "2": "Está en esta parte.", "3": DEMO,
                      "recorrido2": "Acá están las pistas otra vez."},
}
DEVOLUCIONES = {   # Acierto y esfuerzo: FEC-015 5.14. Error y parciales: RT-CEX-001-R 2.5.
    "estado_clinico": VALIDADO,
    "acierto": {"objetos": "Comparaste parte por parte y la encontraste.", "sombras": "Te fijaste en la forma aunque cambió.",
                "niebla": "Miraste las partes que se veían y descubriste qué era.", "jardin": "Recorriste el jardín sin saltear y lo encontraste.",
                "laberinto": "Seguiste las indicaciones de a una.", "fabrica": "Fuiste despacio y miraste el modelo.",
                "cofre_cuales": "Le pusiste nombre a cada imagen y te acordaste.", "cofre_orden": "Le pusiste nombre a cada imagen y te acordaste del orden.",
                "pistas_relampago": "Miraste cada pista con atención.", "pistas_nuevas": "Usaste lo que aprendiste en un lugar nuevo."},
    "cierre": {"objetos": "Probaste otra vez con otra forma de mirar.", "sombras": "Miraste la forma con mucha atención.", "niebla": "Pensaste con las partes que se veían.",
               "jardin": "Recorriste todo el jardín.", "laberinto": "Ayudaste a Roco paso a paso.", "fabrica": "Fuiste despacio por el camino.",
               "cofre_cuales": "Te acordaste de las cosas del cofre.", "cofre_orden": "Te acordaste del camino de vuelta.",
               "pistas_relampago": "Miraste cada pista con cuidado.", "pistas_nuevas": "Revisaste y lo cambiaste: así queda bien."},
    # Acierto parcial (2.5). {k}, {n} y {zona} los completa el reto.
    "parcial": {"objetos": "Encontraste {k}. Falta {n}: mirá la parte de {zona}.", "objetos_plural": "Encontraste {k}. Faltan {n}: mirá la parte de {zona}.",
                "jardin": "Ya encontraste {k}. Falta {n}.", "jardin_plural": "Ya encontraste {k}. Faltan {n}.",
                "laberinto": "El primer paso está bien. Escuchá el segundo.", "fabrica": "Llegaste a la puerta. Probá ir más por el centro.",
                "cofre_orden": "Las primeras están bien. Revisá las últimas.", "pistas_nuevas": "Cumple una pista. Revisá la otra."},
    # Error neutro con pista (2.5). Cada tipo de error del banco va a una de las frases de PSP-SR; «*» es la primera.
    "error": {
        "*": "Mirá otra vez.",
        "objetos": {"*": "Se parece. Mirá el detalle de arriba.", "tamano": "Mirá otra vez el tamaño.", "orientacion": "Fijate hacia dónde apunta."},
        "sombras": {"*": "Tiene el mismo color, pero ¿tiene la misma forma?", "girada": "Girala en tu cabeza y compará."},
        "niebla": {"*": "Mirá otra vez las partes que se ven.", "puede-despejar": "Podés despejar un poco más."},
        "jardin": {"*": "Ese se parece. Mirá qué buscamos.", "otro-objeto": "Seguí recorriendo de a una parte."},
        "laberinto": {"*": "Probá mirando hacia dónde mira Roco.", "omision": "Escuchá de nuevo el primer paso."},
        "fabrica": {"*": "Mirá el modelo: ¿qué punto sigue?", "salida": "Volvé al camino y seguí despacio."},
        "cofre_cuales": {"*": "Esa no estaba. Mirá la próxima con calma.", "omision": "Esa sí estaba. ¿Te acordás dónde?"},
        "cofre_orden": {"*": "Casi. ¿Cuál viste primero?", "cambio": "Revisá el orden del final."},
        "pistas_relampago": {"*": "Mirá bien el detalle de la pista.", "falsa-alarma": "Esa no era igual. Va otra."},
        "pistas_nuevas": {"*": "Revisá si cumple todas las pistas.", "omision": "Probá otra forma de buscar.", "transposicion": "Probá otra forma de buscar."},
    },
    # Tipos de error que registra cada reto (para la ficha y la vista profesional); la frase sale de «error».
    "tipos": {"objetos": ["forma", "tamano", "orientacion", "color", "detalle", "omision"], "sombras": ["forma", "se-guio-por-tamano", "girada"],
              "niebla": ["otro-objeto", "misma-categoria"], "jardin": ["un-solo-rasgo", "otro-objeto"],
              "laberinto": ["confusion-vertical", "confusion-derecha-izquierda", "omision", "relacion", "orientacion"], "fabrica": ["segmento-de-mas", "orden", "salida"],
              "cofre_cuales": ["omision", "falsa-alarma"], "cofre_orden": ["transposicion", "intrusion", "cambio"], "pistas_relampago": ["falsa-alarma", "omision", "rasgo"],
              "pistas_nuevas": ["un-solo-rasgo", "omision", "transposicion"]},
}
IDEAS = {   # FEC-015 5.16 (PSP-SR), tal cual
    "1": "Pongan en la mesa tres cucharas y una distinta. Uno cierra los ojos, el otro cambia algo. ¿Qué cambió?",
    "2": "Busquen en la casa la misma forma en cosas de distinto tamaño: un círculo en un plato, en una moneda, en una tapa.",
    "3": "Tapen con un repasador una parte de un objeto y adivinen qué es.",
    "4": "En el cajón de los cubiertos, o entre los juguetes, encuentren todas las cucharitas.",
    "5": "Uno esconde un juguete y da indicaciones: dos pasos adelante, uno a la derecha.",
    "6": "Con papel y lápiz, dibujen un camino y que otro lo siga con el dedo; después cambien.",
    "7": "Pongan cuatro objetos en fila, mírenlos, tápenlos con una tela y digan el orden.",
    "8": "Jueguen a encontrar en la cocina algo que sea igual a lo que el otro muestra.",
}
CONTAR = {   # «¿Qué te ayudó?»: las estrategias de cada reto (opciones cerradas; la app no infiere estrategias)
    "objetos": [("una-parte", "Mirar una parte por vez"), ("forma", "Mirar la forma"), ("detalles", "Mirar los detalles")],
    "sombras": [("forma", "Mirar la forma"), ("girar", "Girarla en mi cabeza")],
    "niebla": [("partes", "Mirar las partes"), ("mas", "Ver un poco más")],
    "jardin": [("que-busco", "Mirar qué busco"), ("partes", "Buscar de a una parte")],
    "laberinto": [("roco", "Ponerme en el lugar de Roco"), ("una", "Una indicación por vez")],
    "fabrica": [("inicio", "Mirar dónde empieza"), ("despacio", "Ir despacio"), ("modelo", "Mirar el modelo")],
    "cofre_cuales": [("nombre", "Ponerle nombre"), ("mirar", "Mirar bien antes")],
    "cofre_orden": [("orden", "Decir el orden bajito"), ("nombre", "Ponerle nombre")],
    "pistas_relampago": [("collar", "Mirar el collar"), ("detalle", "Mirar un detalle")],
    "pistas_nuevas": [("antes", "Usar lo de antes"), ("revisar", "Revisar al final")],
}
CONTAR_8B = [{"id": "por-partes", "txt": "Por partes"}, {"id": "por-la-forma", "txt": "Por la forma"}, {"id": "por-el-color", "txt": "Por el color"}]   # RT-CEX-001-R 2.4

# ------------------------------------------------------------------ banco ------------------------------------------------------------------
# Consignas: plantillas de RT-CEX-001-R 2.4 (validadas por PSP-SR). Cada ítem cambia solo el objeto entre corchetes; DEV-IA ajusta el
# artículo y el plural al objeto («la llave», «el hueso»). Donde la plantilla no encaja con el ítem, se dice en «plantilla».
FEM = {"huella", "hoja", "piedra", "llave", "mochila", "linterna", "pelota", "regadera", "flor", "carpa", "carpa_bandera", "bandera", "taza", "pluma", "pina",
       "puerta", "chispa", "fuente", "pieza", "lupa", "letra", "huella_pajaro", "huella_conejo", "hoja_roble", "hoja_larga", "piedra_triangular", "piedra_cuadrada"}
NOMBRE_CORTO = {"huella": "huella", "huella_pajaro": "huella", "huella_conejo": "huella", "hoja_roble": "hoja", "hoja_larga": "hoja", "piedra_triangular": "piedra", "piedra_cuadrada": "piedra"}
def nom(f): return NOMBRE_CORTO.get(f, NOMBRES.get(f, f))
def el(f): return ("la " if f in FEM else "el ") + nom(f)
def del_(f): return ("de la " if f in FEM else "del ") + nom(f)
def al(f): return ("a la " if f in FEM else "al ") + nom(f)
def plural(f):
    n = nom(f); return n + ("es" if n[-1] in "lrn" else "s")
def las(f): return ("las " if f in FEM else "los ") + plural(f)
def esta(f): return ("Esta " if f in FEM else "Este ") + nom(f)

def it(id, consigna, **k):
    d = {"id": id, "consigna": consigna, "estado_clinico": VALIDADO}; d.update(k); return d

def objetos():
    F, I, Dd = [], [], []
    temas = [("huella", ["huella_pajaro", "huella_conejo"], "marron", "Guardá en la caja las huellas iguales a esta."),
             ("hoja", ["hoja_roble", "hoja_larga"], "verde", "Guardá en la caja las hojas iguales a esta."),
             ("piedra", ["piedra_triangular", "piedra_cuadrada"], "gris", "Guardá en la caja las piedras iguales a esta.")]
    for n, (f, otros, c, cons) in enumerate(temas * 2):
        k = 3 if n < 3 else 4
        objs = [{"f": f, "c": c}] * (2 if k == 3 else 2) + [{"f": o, "c": c} for o in (otros[:1] if k == 3 else otros)]
        F.append(it(f"obj-f{n+1}", cons, tipo="cajas", modelo={"f": f, "c": c}, objetos=[dict(o) for o in objs], criterio=["f", "s", "r", "m"], rasgo="forma"))
    # Intermedio: el intruso (detalle, orientación), diferencias entre dos escenas y tamaño menos evidente
    I.append(it("obj-i1", "Tocá el intruso: el que es distinto.", tipo="intruso", objetos=[{"f": "hoja", "c": "verde"}] * 4 + [{"f": "hoja", "c": "verde", "b": "nervios"}], intruso=4, rasgo="detalle"))
    I.append(it("obj-i2", "Tocá el intruso: el que es distinto.", tipo="intruso", objetos=[{"f": "llave", "c": "dorado"}] * 4 + [{"f": "llave", "c": "dorado", "m": "agujero-cuadrado"}], intruso=4, rasgo="detalle"))
    I.append(it("obj-i3", "Tocá el intruso: el que es distinto.", tipo="intruso", objetos=[{"f": "pluma", "c": "celeste"}] * 5 + [{"f": "pluma", "c": "celeste", "r": 180}], intruso=5, rasgo="orientacion"))
    I.append(it("obj-i4", "Tocá el intruso: el que es distinto.", tipo="intruso", objetos=[{"f": "taza", "c": "azul"}] * 4 + [{"f": "taza", "c": "sol"}], intruso=4, rasgo="color", colores=["azul", "sol"]))
    for n in range(2):
        base = [{"f": "arbol", "x": 160, "y": 330, "s": 1.6}, {"f": "hongo", "c": "coral", "x": 420, "y": 600, "s": 1.1}, {"f": "mochila", "c": "coral", "x": 640, "y": 560, "s": 1.1},
                {"f": "piedra", "c": "gris", "x": 860, "y": 650, "s": 1.0}, {"f": "flor", "c": "lila", "x": 1040, "y": 560, "s": 1.0}, {"f": "linterna", "c": "azul", "x": 300, "y": 700, "s": 0.9},
                {"f": "caracol", "c": "sol", "x": 760, "y": 380, "s": 0.9}]
        b = [dict(e) for e in base]
        cambios = [(1, {"m": "punto"}), (2, {"s": 0.8}), (4, {"f": "hongo", "c": "coral"})] if n == 0 else [(3, {"f": "piedra_triangular"}), (5, {"r": 90}), (6, {"s": 0.6})]
        for i, ch in cambios: b[i].update(ch)
        I.append(it(f"obj-i{5+n}", "¿Qué cambió en el claro? Buscá 3 diferencias.", tipo="diferencias", escena="claro", a=base, b=b, diferencias=[i for i, _ in cambios], cantidad=3, rasgo="detalle"))
    I.append(it("obj-i7", "Guardá en la caja las piedras iguales a esta.", plantilla="la de Fácil: es la única de cajas en Intermedio (tamaño menos evidente)", tipo="cajas", modelo={"f": "piedra", "c": "gris", "s": 1}, objetos=[{"f": "piedra", "c": "gris", "s": 1}, {"f": "piedra", "c": "gris", "s": 0.75},
             {"f": "piedra", "c": "gris", "s": 1}, {"f": "piedra", "c": "gris", "s": 0.75}, {"f": "piedra", "c": "gris", "s": 1}], criterio=["f", "s"], rasgo="tamano"))
    # Difícil: dos criterios a la vez, elegir el criterio y letras parecidas (rutas que leen)
    for n, (f, f2, c) in enumerate([("piedra", "piedra_triangular", "gris"), ("mochila", "mochila", "coral"), ("taza", "taza", "celeste")]):
        objs = [{"f": f, "c": c, "m": "punto"}, {"f": f, "c": c, "m": "raya"}, {"f": f2 if f2 != f else f, "c": c, "m": "rayas" if f2 == f else "punto"},
                {"f": f, "c": c, "m": "punto"}, {"f": f, "c": c, "m": "cruz"}, {"f": f, "c": c, "m": "punto"}]
        if f2 != f: objs[2] = {"f": f2, "c": c, "m": "punto"}
        Dd.append(it(f"obj-d{n+1}", f"Guardá {las(f)} de igual forma y marca.", tipo="cajas", modelo={"f": f, "c": c, "m": "punto"}, objetos=objs, criterio=["f", "m"], rasgo="detalle", rasgos=["forma", "detalle"]))
    Dd.append(it("obj-d4", "¿En qué se parecen? Elegí cómo separarlas.", tipo="criterio", par=[{"f": "hoja", "c": "verde", "m": "punto"}, {"f": "hoja", "c": "sol", "m": "raya"}], opciones=["forma", "color", "marca"], correcta="forma",
                 explica="Las dos tienen la misma forma de hoja.", rasgo="forma"))
    Dd.append(it("obj-d5", "¿En qué se parecen? Elegí cómo separarlas.", tipo="criterio", par=[{"f": "piedra", "c": "gris", "m": "raya"}, {"f": "piedra_cuadrada", "c": "marron", "m": "raya"}], opciones=["forma", "color", "marca"], correcta="marca",
                 explica="Las dos tienen la misma marca: una raya.", rasgo="detalle"))
    # RT-CEX-001-R 3.1 y 3.2: un ítem por forma de letra. En mayúscula no hay ítems de orientación con letras; nada de letras espejadas.
    letras = [("minuscula", "b", ["b", "d", "b", "p", "q", "b"], "orientacion"), ("minuscula", "d", ["d", "b", "d", "q", "d", "p"], "orientacion"),
              ("minuscula", "n", ["n", "m", "n", "h", "n", "u"], "detalle"), ("minuscula", "c", ["c", "e", "c", "e", "c", "e"], "detalle"),
              ("mayuscula", "E", ["E", "F", "E", "F", "E", "F"], "detalle"), ("mayuscula", "R", ["R", "P", "R", "B", "R", "P"], "detalle"),
              ("mayuscula", "O", ["O", "Q", "O", "Q", "O", "Q"], "detalle"), ("mayuscula", "M", ["M", "N", "M", "N", "M", "N"], "forma")]
    for n, (forma, m, ls, rasgo) in enumerate(letras):
        Dd.append(it(f"obj-d{6+n}", "Guardá las letras iguales a esta.", tipo="letras", lee=True, rutas=LEEN, letra_forma=forma, modelo=m, letras=ls, rasgo=rasgo))
    return {"facil": F, "intermedio": I, "dificil": Dd}

def sombras():
    F, I, Dd = [], [], []
    for n, (f, otros) in enumerate([("llave", ["hueso", "zapato"]), ("hueso", ["llave"]), ("zapato", ["regadera", "taza"]), ("regadera", ["zapato"]), ("hongo", ["arbol", "pelota"]), ("linterna", ["hongo"])]):
        s = [1.35, 1.25][n % 2]   # la plantilla dice «creció»
        F.append(it(f"som-f{n+1}", f"{esta(f)} creció. Llevala a su sombra." if f in FEM else f"{esta(f)} creció. Llevalo a su sombra.",
                    objeto={"f": f, "s": s}, sombras=[{"f": f}] + [{"f": o, "error": "forma"} for o in otros], correcta=0, transformaciones=["tamano"], rasgo="forma"))
    pares = [("hoja", ["hoja_roble", "hoja_larga"], {"r": 90}), ("piedra_triangular", ["piedra", "piedra_cuadrada"], {"r": 180}), ("huella_conejo", ["huella", "huella_pajaro"], {"r": -90}),
             ("llave", ["hueso", "engranaje"], {"c": "coral"}), ("zapato", ["mochila", "regadera"], {"r": 90}), ("hongo", ["flor", "arbol"], {"c": "lila"})]
    for n, (f, otros, t) in enumerate(pares):
        I.append(it(f"som-i{n+1}", f"{el(f).capitalize()} {'giró' if 'r' in t else 'cambió de color'}. ¿Y su sombra?",
                    plantilla="«La [llave] giró y cambió de color. ¿Y su sombra?» partida en dos: la FEC 5.5 pide una sola transformación en Intermedio", objeto={"f": f, **t}, sombras=[{"f": f}] + [{"f": o, "error": "forma"} for o in otros],
                    correcta=0, transformaciones=["orientacion" if "r" in t else "color"], rasgo="orientacion" if "r" in t else "forma"))
    for n, (f, otros, t) in enumerate([("hoja_roble", ["hoja", "hoja_larga", "pluma"], {"r": 135, "s": 0.7, "c": "sol"}), ("huella", ["huella_conejo", "huella_pajaro", "pina"], {"r": 160, "s": 1.3, "c": "lila"}),
                                       ("piedra_cuadrada", ["piedra", "piedra_triangular", "taza"], {"r": 45, "s": 0.65, "c": "coral"}), ("zapato", ["mochila", "regadera", "gorro"], {"e": True, "r": 30, "s": 1.25, "c": "coral"}),
                                       ("caracol", ["pina", "hongo", "piedra"], {"e": True, "r": -60, "s": 0.7, "c": "verde"})]):
        Dd.append(it(f"som-d{n+1}", f"{el(f).capitalize()} giró y cambió de color. ¿Y su sombra?",
                     plantilla="la de Intermedio de 2.4: estos ítems giran, cambian de color y de tamaño; «desde arriba» necesita dibujos vistos desde arriba que todavía no hay", objeto={"f": f, **t}, sombras=[{"f": f}] + [{"f": o, "error": "forma"} for o in otros], correcta=0,
                     transformaciones=["tamano", "orientacion"] + (["color"] if "c" in t else []) + (["espejado"] if t.get("e") else []), rasgo="orientacion"))
    # RT-CEX-001-R 3.2: misma letra en otra tipografía de imprenta (con serifa → sin serifa). La a y la g de dos formas (solo 9–12) quedan
    # pendientes: hace falta una tipografía de imprenta que las traiga y se pueda incluir en el archivo.
    for n, (forma, l, otros) in enumerate([("mayuscula", "A", ["M", "R"]), ("mayuscula", "G", ["S", "E"]), ("minuscula", "e", ["r", "s"]), ("minuscula", "r", ["t", "s"])]):
        Dd.append(it(f"som-d{6+n}", "Esta letra cambió de forma. ¿Cuál es su sombra?", lee=True, rutas=LEEN, letra_forma=forma, objeto={"f": "letra", "letra": l, "fuente": "serif"},
                     sombras=[{"f": "letra", "letra": l}] + [{"f": "letra", "letra": o, "error": "forma"} for o in otros], correcta=0, transformaciones=["tipografia"], rasgo="forma"))
    return {"facil": F, "intermedio": I, "dificil": Dd}

def niebla():
    F, I, Dd = [], [], []
    fam = [("linterna", ["pelota", "zapato"]), ("pelota", ["linterna", "gorro"]), ("zapato", ["taza", "pelota"]), ("taza", ["zapato", "mochila"]), ("mochila", ["regadera", "taza"]), ("gorro", ["pelota", "linterna"])]
    for n, (f, otros) in enumerate(fam):
        x, y = [(70, 30), (30, 72), (72, 70), (28, 30), (50, 78), (74, 50)][n]
        F.append(it(f"nie-f{n+1}", "¿Qué hay detrás de la niebla?", objeto={"f": f}, manchas=[{"hoja": True, "x": x, "y": y, "s": 0.55, "r": 30 * n}], por_paso=1,
                    opciones=[f] + otros, correcta=f, errores={o: "otro-objeto" for o in otros}, rasgo="forma"))
    medio = [("regadera", ["taza", "linterna", "mochila"]), ("caracol", ["pina", "hongo", "pelota"]), ("llave", ["hueso", "engranaje", "pluma"]), ("hongo", ["flor", "arbol", "caracol"]),
             ("engranaje", ["chispa", "pelota", "flor"]), ("puerta", ["mochila", "cofre", "taza"])]
    for n, (f, otros) in enumerate(medio):
        r = rnd.Random(n) if False else random.Random(100 + n)
        ms = [{"x": r.randint(15, 85), "y": r.randint(15, 85), "radio": r.randint(16, 22)} for _ in range(5)]
        I.append(it(f"nie-i{n+1}", "¿Qué se esconde detrás de las ramas?", objeto={"f": f, "r": [0, 20, -30, 0, 45, 0][n]}, manchas=ms, por_paso=1, opciones=[f] + otros, correcta=f,
                    errores={o: "otro-objeto" for o in otros}, rasgo="forma"))
    dif = [("hoja_roble", ["hoja", "hoja_larga", "pluma"]), ("huella_conejo", ["huella", "huella_pajaro", "hueso"]), ("piedra_triangular", ["piedra", "piedra_cuadrada", "carpa"]),
           ("pluma", ["hoja_larga", "hoja", "chispa"]), ("carpa", ["piedra_triangular", "cofre", "puerta"]), ("pina", ["hongo", "caracol", "piedra"])]
    for n, (f, otros) in enumerate(dif):
        r = random.Random(200 + n)
        ms = [{"x": r.randint(10, 90), "y": r.randint(10, 90), "radio": r.randint(18, 26)} for _ in range(8)]
        Dd.append(it(f"nie-d{n+1}", "Se ven pocas partes. ¿Qué es?", objeto={"f": f}, manchas=ms, por_paso=2, opciones=[f] + otros, correcta=f,
                     errores={o: "misma-categoria" for o in otros}, rasgo="forma"))
    # RT-CEX-001-R 3.2: palabras validadas; en mayúscula se tapa la mitad de abajo y en minúscula la de arriba [Probable; calibrar].
    for n, (forma, p, otros) in enumerate([("mayuscula", "CASA", ["MESA", "MAPA", "TAZA"]), ("mayuscula", "PATO", ["GATO", "PALA", "BOTA"]),
                                           ("minuscula", "mesa", ["casa", "mapa", "taza"]), ("minuscula", "gato", ["pato", "bota", "pala"])]):
        Dd.append(it(f"nie-d{7+n}", "Las hojas tapan una palabra. ¿Cuál es?", tipo="palabra", lee=True, rutas=LEEN, letra_forma=forma, palabra=p, tapa_pct=55,
                     tapa="abajo" if forma == "mayuscula" else "arriba", opciones=[p] + otros, correcta=p, errores={o: "misma-categoria" for o in otros}, rasgo="forma"))
    return {"facil": F, "intermedio": I, "dificil": Dd}

def escena(seed, n, objetivos, distractores, superponer=False, margen=110):
    """Ubica elementos en una escena de 1200 × 800 sin que los objetivos se superpongan entre sí."""
    r = random.Random(seed); out = []
    def libre(x, y, s, estricto=False):
        for e in out:
            d = 100 * (s + e.get("s", 1)) / 2 * (0.65 if superponer and not estricto and not e.get("objetivo") else 1.0)
            if abs(e["x"] - x) < d and abs(e["y"] - y) < d: return False
        return True
    for o in objetivos:
        for _ in range(400):
            x, y, s = r.randint(margen, 1200 - margen), r.randint(margen + 40, 800 - margen), o.get("s", 1)
            if libre(x, y, s + 0.4, estricto=True): out.append({**o, "x": x, "y": y, "objetivo": True}); break
    k = 0
    while len(out) < n and k < 4000:
        k += 1; d = dict(r.choice(distractores)); s = d.get("s", round(r.uniform(0.75, 1.1), 2)); d["s"] = s
        x, y = r.randint(margen - 40, 1200 - margen + 40), r.randint(margen, 800 - margen + 40)
        if libre(x, y, s): d.update({"x": x, "y": y, "r": r.choice([0, 0, 15, -15, 30])}); out.append(d)
    obj = [e for e in out if e.get("objetivo")]; resto = [e for e in out if not e.get("objetivo")]
    return resto + obj   # los objetivos se dibujan arriba: siempre se pueden tocar

def jardin():
    F, I, Dd = [], [], []
    plantas = [{"f": "flor", "c": "lila"}, {"f": "flor", "c": "sol"}, {"f": "arbusto"}, {"f": "hongo", "c": "coral"}, {"f": "hoja", "c": "verde"}, {"f": "piedra", "c": "gris"}, {"f": "hoja_roble", "c": "verde"}]
    for n, t in enumerate(["regadera", "caracol", "gorro", "taza", "linterna", "pelota"]):
        o = {"f": t, "c": {"regadera": "verde", "caracol": "sol", "gorro": "verde", "taza": "celeste", "linterna": "azul", "pelota": "coral"}[t]}
        F.append(it(f"jar-f{n+1}", f"Michi busca {el(t)}. ¿Dónde está?", fondo="jardin", modelo=o, cantidad=1, destacado=True,
                    elementos=escena(300 + n, 10 + n, [{**o, "s": 1.1}], plantas), rasgo="semejanza"))
    for n, (t, otros) in enumerate([("llave", [{"f": "engranaje", "c": "dorado"}, {"f": "chispa", "c": "sol"}, {"f": "hueso"}]), ("hoja_roble", [{"f": "hoja", "c": "verde"}, {"f": "hoja_larga", "c": "verde"}]),
                                    ("caracol", [{"f": "pina"}, {"f": "hongo", "c": "sol"}]), ("huella", [{"f": "huella_conejo", "c": "marron"}, {"f": "piedra", "c": "marron"}]),
                                    ("pluma", [{"f": "hoja_larga", "c": "celeste"}, {"f": "hoja", "c": "celeste"}]), ("hongo", [{"f": "flor", "c": "coral"}, {"f": "gorro", "c": "coral"}])]):
        o = {"f": t, "c": {"llave": "dorado", "hoja_roble": "sol", "caracol": "sol", "huella": "marron", "pluma": "celeste", "hongo": "lila"}[t]}
        cant = 3 if n % 2 == 0 else 2
        I.append(it(f"jar-i{n+1}", f"Encontrá {'las' if t in FEM else 'los'} {cant} {plural(t)} del jardín.",
                    fondo="jardin", modelo=o, cantidad=cant, elementos=escena(400 + n, 22 + n, [o] * cant, plantas + otros, superponer=True), rasgo="semejanza"))
    for n in range(4):
        o = {"f": "llave", "c": "dorado", "m": "agujero-redondo"}
        dis = plantas + [{"f": "llave", "c": "dorado", "m": "agujero-cuadrado"}, {"f": "llave", "c": "plata", "m": "agujero-redondo"}, {"f": "llave", "c": "plata", "m": "agujero-cuadrado"}]
        cant = 2 + n % 2
        Dd.append(it(f"jar-d{n+1}", "Buscá las llaves doradas con agujero redondo.", fondo="jardin", modelo=o, cantidad=cant, rutas=LEEN,
                     elementos=escena(500 + n, 28, [o] * cant, dis, superponer=True), rasgo="semejanza", rasgos=["semejanza", "detalle"]))
    for n, t in enumerate(["llave", "caracol", "regadera", "pelota"]):   # 3–5: Difícil con un solo rasgo (5.12)
        o = {"f": t, "c": {"llave": "dorado", "caracol": "sol", "regadera": "verde", "pelota": "coral"}[t]}
        Dd.append(it(f"jar-d{5+n}", f"Encontrá {'las' if t in FEM else 'los'} 2 {plural(t)} del jardín.", plantilla="la de Intermedio: en 3–5 Difícil tiene un solo rasgo (5.12)", fondo="jardin", modelo=o, cantidad=2, rutas=["3-5"],
                     elementos=escena(600 + n, 24, [o, o], plantas, superponer=True), rasgo="semejanza"))
    return {"facil": F, "intermedio": I, "dificil": Dd}

def laberinto():
    F, I, Dd = [], [], []
    rel = [("hueso", "tronco", "arriba", ["arriba", "abajo"]), ("pelota", "tronco", "abajo", ["arriba", "abajo"]), ("hueso", "cofre", "adentro", ["adentro", "afuera"]),
           ("caracol", "piedra_cuadrada", "al-lado", ["al-lado", "arriba"])]
    pos = {"arriba": (600, 240), "abajo": (600, 600), "adentro": (600, 470), "afuera": (300, 250), "al-lado": (840, 470)}
    for n, (o, ref, c, ops) in enumerate(rel):
        x, y = pos[c]
        a, b = ops[0], ops[1]; rel_txt = {"arriba": "arriba", "abajo": "abajo", "adentro": "adentro", "afuera": "afuera", "al-lado": "al lado"}
        F.append(it(f"lab-f{n+1}", f"¿{el(o).capitalize()} está {rel_txt[a]} o {rel_txt[b]} {del_(ref)}?", tipo="relacion",
                    plantilla="«¿El [hueso] está arriba o abajo del [tronco]?»: las dos alternativas son las del ítem", ref={"f": ref, "x": 600, "y": 470, "s": 2.4 if ref == "cofre" else 2.0},
                    objeto={"f": o, "x": x, "y": y, "s": 1.0 if c != "adentro" else 0.8}, opciones=ops, correcta=c, habilidad="relaciones-espaciales", rasgo="vertical" if c in ("arriba", "abajo") else "relacion"))
    for n in range(2):   # «adelante» es para arriba en la grilla
        F.append(it(f"lab-f{5+n}", "Mové a Roco un paso para adelante.", tipo="mover", cols=3, filas=3, paredes=[[0, 0], [2, 2]] if n else [],
                    roco={"x": 1 if n == 0 else 0, "y": 2}, meta={"x": 1 if n == 0 else 0, "y": 1, "f": "hueso" if n == 0 else "fuente"}, botones=["arriba", "abajo"], secuencia=["arriba"],
                    habilidad="relaciones-espaciales", rasgo="vertical"))
    # Intermedio: girar el cartel (posición en el espacio) y 2 o 3 indicaciones seguidas
    for n, (alr, obj, nom_) in enumerate([({"arriba": "arbol", "derecha": "fuente", "abajo": "carpa", "izquierda": "cofre"}, 1, "fuente"),
                                         ({"arriba": "cofre", "derecha": "carpa", "abajo": "fuente", "izquierda": "arbol"}, 3, "arbol"),
                                         ({"arriba": "carpa", "derecha": "arbol", "abajo": "cofre", "izquierda": "fuente"}, 2, "cofre")]):
        I.append(it(f"lab-i{n+1}", f"Girá el cartel para que apunte {al(nom_)}.", tipo="cartel", dir_inicial=(obj + 2) % 4, objetivo=obj, alrededor=alr, habilidad="posicion-en-el-espacio", rasgo="orientacion"))
    for n, sec in enumerate([["arriba", "arriba", "derecha"], ["derecha", "derecha", "arriba"], ["arriba", "izquierda", "izquierda"]]):
        x, y = 2, 3
        for d in sec: x += {"derecha": 1, "izquierda": -1}.get(d, 0); y += {"arriba": -1, "abajo": 1}.get(d, 0)
        txt = {"arriba": "adelante", "derecha": "a la derecha", "izquierda": "a la izquierda"}
        partes = []
        i = 0
        while i < len(sec):
            j = i
            while j < len(sec) and sec[j] == sec[i]: j += 1
            partes.append((["", "un paso", "dos pasos", "tres pasos"] if not partes else ["", "uno", "dos", "tres"])[j - i] + " " + txt[sec[i]]); i = j
        frase = " y ".join(partes) + "."
        I.append(it(f"lab-i{4+n}", frase[0].upper() + frase[1:], tipo="mover", cols=5, filas=4, roco={"x": 2, "y": 3}, meta={"x": x, "y": y, "f": "hueso"},
                    secuencia=sec, derecha_izquierda=True, rutas=LEEN, habilidad="relaciones-espaciales", rasgo="derecha-izquierda"))
    for n in range(2):   # 3–5 sin derecha ni izquierda
        I.append(it(f"lab-i{7+n}", "Dos pasos adelante.", plantilla="«Dos pasos adelante y uno a la derecha.» sin derecha ni izquierda (3–5, 5.8)", tipo="mover", cols=3, filas=3,
                    roco={"x": 1 if n == 0 else 2, "y": 2}, meta={"x": 1 if n == 0 else 2, "y": 0, "f": "hueso"}, secuencia=["arriba", "arriba"], botones=["arriba", "abajo"], rutas=["3-5"],
                    habilidad="relaciones-espaciales", rasgo="vertical"))
    I.append(it("lab-i9", "¿El caracol está arriba, abajo o al lado del tronco?", plantilla="la de Fácil con tres alternativas", tipo="relacion", ref={"f": "tronco", "x": 600, "y": 470, "s": 2.0}, objeto={"f": "caracol", "x": 840, "y": 470, "s": 1.0},
                opciones=["arriba", "abajo", "al-lado"], correcta="al-lado", rutas=["3-5"], habilidad="relaciones-espaciales", rasgo="relacion"))
    # Difícil: planificar el recorrido pasando por un lugar; perspectiva de Roco solo en 9–12
    mapas = [([[1, 0], [1, 1], [3, 2], [3, 3], [0, 3]], {"x": 0, "y": 0}, {"x": 4, "y": 0}, {"x": 2, "y": 3}), ([[1, 1], [2, 1], [3, 1], [1, 3]], {"x": 0, "y": 3}, {"x": 4, "y": 0}, {"x": 2, "y": 0}),
             ([[2, 0], [2, 1], [2, 3], [0, 2]], {"x": 0, "y": 0}, {"x": 4, "y": 3}, {"x": 1, "y": 3}), ([[1, 2], [2, 2], [3, 2], [3, 0]], {"x": 0, "y": 3}, {"x": 4, "y": 1}, {"x": 2, "y": 0})]
    for n, (par, ro, me, por) in enumerate(mapas):
        Dd.append(it(f"lab-d{n+1}", "Pensá el camino a la salida, pasando por la fuente.", tipo="mover", plan_previo=True, cols=5, filas=4, paredes=par, roco=ro, meta={**me, "f": "puerta"},
                     pasa_por={**por, "f": "fuente"}, derecha_izquierda=True, rutas=LEEN, habilidad="relaciones-espaciales", rasgo="orden"))
    # 9–12: la derecha desde el punto de vista de Roco. Roco mira hacia un lado y hay una cosa en cada lado; se toca la que queda a su derecha.
    for n, (d, alr) in enumerate([("abajo", {"arriba": "arbol", "derecha": "fuente", "abajo": "carpa", "izquierda": "cofre"}), ("izquierda", {"arriba": "cofre", "derecha": "carpa", "abajo": "fuente", "izquierda": "arbol"}),
                                  ("abajo", {"arriba": "carpa", "derecha": "arbol", "abajo": "cofre", "izquierda": "fuente"}), ("derecha", {"arriba": "fuente", "derecha": "cofre", "abajo": "arbol", "izquierda": "carpa"})]):
        orden = ["arriba", "derecha", "abajo", "izquierda"]
        Dd.append(it(f"lab-d{5+n}", "Desde donde mira Roco, ¿dónde está su derecha?", tipo="su_lado", dir=d, alrededor=alr, correcta=orden[(orden.index(d) + 1) % 4],
                     derecha_izquierda=True, perspectiva=True, rutas=["9-12"], habilidad="posicion-en-el-espacio", rasgo="derecha-izquierda"))
    return {"facil": F, "intermedio": I, "dificil": Dd}

def camino(seed, tramos, ancho):
    r = random.Random(seed); x, y = 90, r.randint(200, 420); pts = [{"x": x, "y": y}]
    paso = (1000 - 180) / max(1, tramos * 6)
    for t in range(tramos):
        dy = r.choice([-1, 1]) * r.randint(80, 160) if tramos > 1 else r.choice([-1, 1]) * 90
        for k in range(6):
            x += paso; yy = y + dy * math.sin(math.pi * (k + 1) / 6 / 2) if tramos == 1 else y + dy * (k + 1) / 6
            pts.append({"x": round(x), "y": round(max(70, min(530, yy)))})
        y = pts[-1]["y"]
    return pts

def fabrica():
    F, I, Dd = [], [], []
    for n in range(4):
        F.append(it(f"fab-f{n+1}", "Llevá la chispa por el camino hasta la puerta.", tipo="camino", puntos=camino(700 + n, 1, 90) if n else [{"x": 90 + 70 * k, "y": 300} for k in range(13)], ancho=90, rasgo="precision"))
    for n, pts in enumerate([[{"x": 200, "y": 150}, {"x": 800, "y": 150}, {"x": 800, "y": 450}, {"x": 200, "y": 450}], [{"x": 500, "y": 100}, {"x": 800, "y": 300}, {"x": 500, "y": 500}, {"x": 200, "y": 300}]]):
        F.append(it(f"fab-f{5+n}", "Uní los puntos en orden.", tipo="puntos", puntos=pts, rasgo="orden"))
    piezas = [("llave", 4, 3, [[0, 1], [1, 2], [2, 3], [1, 5], [2, 6]]), ("puerta", 4, 3, [[1, 2], [2, 6], [6, 10], [10, 9], [9, 5], [5, 1]]),
              ("engranaje", 4, 3, [[1, 4], [4, 9], [9, 6], [6, 1], [2, 7]]), ("cartel", 4, 3, [[0, 1], [1, 2], [2, 7], [7, 6], [6, 5], [5, 0], [1, 9]])]
    for n, (p, c, f, m) in enumerate(piezas):
        I.append(it(f"fab-i{n+1}", f"Armá {esta(p).lower()} en el tablero, igual al modelo.", consigna_tocar=f"Tocá los puntos en orden para armar {el(p)}.", tipo="tablero", pieza=p, cols=c, filas=f, modelo=m, rutas=LEEN, rasgo="forma"))
    for n, (p, m) in enumerate([("chispa", [[0, 4], [4, 8]]), ("llave", [[3, 4], [4, 5], [5, 2]]), ("puerta", [[0, 3], [3, 4]])]):
        I.append(it(f"fab-i{5+n}", f"Armá {esta(p).lower()} en el tablero, igual al modelo.", consigna_tocar=f"Tocá los puntos en orden para armar {el(p)}.", tipo="tablero", pieza=p, cols=3, filas=3, modelo=m, rutas=["3-5"], rasgo="forma"))
    for n in range(2):
        I.append(it(f"fab-i{8+n}", "Llevá la chispa por el camino hasta la puerta.", plantilla="la de Fácil", tipo="camino", puntos=camino(800 + n, 2, 60), ancho=60, rasgo="precision"))
    compuestas = [("puerta", 5, 4, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 9], [9, 14], [14, 19], [0, 5], [5, 10], [10, 15], [7, 12], [12, 17]]),
                  ("engranaje", 5, 4, [[1, 2], [2, 3], [3, 9], [9, 14], [14, 18], [18, 17], [17, 16], [16, 10], [10, 5], [5, 1], [7, 12]]),
                  ("llave", 5, 4, [[5, 6], [6, 7], [7, 8], [8, 9], [0, 5], [0, 1], [1, 6], [8, 13], [13, 14], [6, 11]])]
    for n, (p, c, f, m) in enumerate(compuestas):
        Dd.append(it(f"fab-d{n+1}", f"Pensá por dónde empezás y armá {el(p)}.", consigna_tocar=f"Tocá los puntos en orden para armar {el(p)}.", tipo="tablero", pieza=p, cols=c, filas=f, modelo=m, rutas=LEEN, rasgo="orden"))
    for n in range(2):
        Dd.append(it(f"fab-d{4+n}", "Llevá la chispa por el camino hasta la puerta.", plantilla="la de Fácil", tipo="camino", puntos=camino(900 + n, 3, 45), ancho=45, rutas=LEEN, rasgo="precision"))
    return {"facil": F, "intermedio": I, "dificil": Dd}

COSAS = ["llave", "hueso", "zapato", "pelota", "taza", "linterna", "regadera", "gorro", "mochila", "caracol", "pina", "pluma", "hongo", "engranaje", "flor", "cofre", "puerta", "carpa"]
COLOR_DE = {"llave": "dorado", "pelota": "coral", "taza": "celeste", "linterna": "azul", "regadera": "verde", "gorro": "verde", "mochila": "coral", "caracol": "sol", "pluma": "celeste",
            "hongo": "coral", "engranaje": "plata", "flor": "lila", "zapato": "lila"}
def cosa(f, **k): return {"f": f, **({"c": COLOR_DE[f]} if f in COLOR_DE else {}), **k}

def cofre_cuales():
    out = {"facil": [], "intermedio": [], "dificil": []}
    for g, (nm, ns, dem, inter, aud) in {"facil": (2, 4, 0, 0, True), "intermedio": (4, 6, 2500, 0, True), "dificil": (6, 8, 4000, 5, False)}.items():
        for n in range(5):
            r = random.Random(1000 + 10 * n + len(g))
            if g == "facil": pool = r.sample(COSAS, nm + 2)
            else:   # las nuevas son de la misma categoría o parecidas (semejanza)
                fam = r.choice([["hoja", "hoja_roble", "hoja_larga", "pluma", "flor", "hongo", "arbol", "arbusto"], ["llave", "engranaje", "chispa", "puerta", "cofre", "linterna", "taza", "mochila"],
                                ["huella", "huella_pajaro", "huella_conejo", "hueso", "piedra", "piedra_triangular", "piedra_cuadrada", "caracol"]])
                pool = r.sample(fam, min(len(fam), nm + (ns - nm)))
            vistos = pool[:nm] if g == "facil" else pool[:nm]
            nuevos = [p for p in pool if p not in vistos][: ns - min(nm, ns // 2)]
            sondas = [{"o": cosa(f), "estaba": True} for f in vistos[: max(2, ns // 2)]] + [{"o": cosa(f), "estaba": False} for f in nuevos[: ns - max(2, ns // 2)]]
            r.shuffle(sondas)
            out[g].append(it(f"c7a-{g[0]}{n+1}", "¿Esto estaba en el cofre?", mostrar=[cosa(f) for f in vistos], sondas=sondas, demora_ms=dem, interferencia=inter, audio_nombre=aud,
                             rasgo="semejanza"))
    return out

def cofre_orden():
    F, I, Dd = [], [], []
    for n in range(5):
        r = random.Random(1100 + n); s = r.sample(COSAS, 2 + n % 2)
        F.append(it(f"c7b-f{n+1}", "Poné las cosas en el orden en que las viste.", tipo="ordenar", secuencia=[cosa(f) for f in s], fijo_primero=True, rasgo="orden"))
    for n in range(3):
        r = random.Random(1200 + n); s = r.sample(COSAS, 4 + n % 2)
        I.append(it(f"c7b-i{n+1}", "Poné las cosas en el orden en que las viste.", plantilla="la de Fácil, sin la primera ubicada", tipo="ordenar", secuencia=[cosa(f) for f in s], fijo_primero=False, rutas=LEEN, rasgo="orden"))
    for n in range(2):
        r = random.Random(1300 + n); s = r.sample(COSAS, 6); k = r.randint(1, 3)
        I.append(it(f"c7b-i{4+n}", "¿Qué cosa falta en el camino de vuelta?", tipo="falta", secuencia=[cosa(f) for f in s[:5]], falta=k, opciones=[s[k], s[5], s[(k + 1) % 5]], correcta=s[k], rutas=LEEN, rasgo="orden"))
    for n in range(5):
        r = random.Random(1400 + n); s = r.sample(COSAS, 6); i = r.randint(0, 2); j = r.randint(3, 5)
        Dd.append(it(f"c7b-d{n+1}", "Dos cosas cambiaron de lugar. ¿Cuáles?", tipo="cambiaron", secuencia=[cosa(f) for f in s], cambiados=[i, j], rutas=LEEN, rasgo="orden"))
    return {"facil": F, "intermedio": I, "dificil": Dd}

def pistas_relampago():
    F, I, Dd = [], [], []
    for n, (obj, dist) in enumerate([("huella", ["hoja", "llave", "pluma"]), ("hoja_roble", ["huella", "piedra", "taza"]), ("llave", ["hongo", "hoja", "caracol"]), ("caracol", ["llave", "pluma", "piedra"])]):
        r = random.Random(1500 + n); pistas = []
        for k in range(8):
            igual = k % 2 == 0 if n % 2 else k % 3 != 1
            pistas.append({"o": cosa(obj) if igual else cosa(r.choice(dist)), "igual": igual})
        F.append(it(f"8a-f{n+1}", "¿Es igual a la pista del collar de Roco?", modo="una", objetivo=cosa(obj), pistas=pistas, rutas=LEEN, rasgo="semejanza"))
    for n, (obj, par) in enumerate([("hoja", ["hoja_roble", "hoja_larga"]), ("huella", ["huella_conejo", "huella_pajaro"]), ("piedra", ["piedra_triangular", "piedra_cuadrada"]), ("llave", ["engranaje", "hueso"])]):
        r = random.Random(1600 + n); pistas = []
        for k in range(6):
            ops = [cosa(obj)] + [cosa(f) for f in r.sample(par, 1 + k % 2)]; r.shuffle(ops)
            pistas.append({"opciones": ops, "correcta": next(i for i, o in enumerate(ops) if o["f"] == obj)})
        I.append(it(f"8a-i{n+1}", "Tocá la pista igual a la del collar.", modo="grupo", objetivo=cosa(obj), pistas=pistas, rutas=LEEN, rasgo="semejanza"))
    # Difícil: pistas muy parecidas que se separan por la forma (RT-CEX-001-R 2.4: «Las de punta, acá. Las redondas, allá.»). La marca y el
    # color cambian y no deciden nada.
    PUNTA, REDONDA = [("piedra_triangular", "gris"), ("hoja_roble", "verde")], [("piedra", "gris"), ("pelota", "coral")]
    for n in range(4):
        r = random.Random(1700 + n); pistas = []
        for k in range(8):
            a = r.random() < 0.5; f, c = (PUNTA if a else REDONDA)[n % 2]
            pistas.append({"o": {"f": f, "c": c, "m": r.choice(["punto", "raya", ""])}, "mochila": "a" if a else "b"})
        Dd.append(it(f"8a-d{n+1}", "Guardá cada pista en su mochila.", regla="Las de punta, acá. Las redondas, allá.", modo="mochilas",
                     mochilas={"a": {"txt": "acá", "o": {"f": PUNTA[n % 2][0], "c": PUNTA[n % 2][1]}}, "b": {"txt": "allá", "o": {"f": REDONDA[n % 2][0], "c": REDONDA[n % 2][1]}}},
                     pistas=pistas, rutas=["9-12"], rasgo="forma"))
    return {"facil": F, "intermedio": I, "dificil": Dd}

def pistas_nuevas():
    F, I, Dd = [], [], []
    plantas = [{"f": "flor", "c": "lila"}, {"f": "arbusto"}, {"f": "hongo", "c": "coral"}, {"f": "piedra", "c": "gris"}, {"f": "hoja", "c": "verde"}, {"f": "caracol", "c": "sol"}]
    for n, (t, de) in enumerate([("llave", "de la fábrica"), ("hueso", "del laberinto"), ("huella", "del claro"), ("engranaje", "de la fábrica")]):
        o = cosa(t); tgt = {**o, "r": [90, 135, 180, -90][n], "s": 1.0}
        F.append(it(f"8b-f{n+1}", f"Buscá {el(t)} {de} en el río.", tipo="escena", fondo="rio", modelo=o, cantidad=1,
                    elementos=escena(1800 + n, 16, [tgt], plantas), rasgo="orientacion"))
    for n, m in enumerate(["rayas", "punto", "cruz", "rayas"]):
        r = random.Random(1900 + n)
        arbol = {"f": "arbol", "x": r.choice([300, 600, 900]), "y": 330, "s": 2.2, "ref": True}
        otras = [mm for mm in ["rayas", "punto", "cruz", ""] if mm != m]
        els = [arbol, {"f": "carpa_bandera", "c": "sol", "m": m, "x": arbol["x"] + 230 if arbol["x"] < 900 else arbol["x"] - 230, "y": 470, "s": 1.3, "objetivo": True},
              {"f": "carpa_bandera", "c": "sol", "m": otras[0], "x": arbol["x"] - 230 if arbol["x"] > 300 else arbol["x"] + 460, "y": 470, "s": 1.3},
              {"f": "carpa_bandera", "c": "sol", "m": m, "x": 1080 if arbol["x"] < 700 else 120, "y": 640, "s": 1.3},
              {"f": "carpa_bandera", "c": "sol", "m": otras[1], "x": 600 if arbol["x"] != 600 else 300, "y": 680, "s": 1.3}]
        for e in els:
            if not e.get("objetivo") and not e.get("ref") and e["x"] == els[1]["x"] and e["y"] == els[1]["y"]: e["x"] += 120
        I.append(it(f"8b-i{n+1}", "Buscá la carpa de bandera igual, junto al árbol.", tipo="campamento", fondo="campamento", modelo={"f": "carpa_bandera", "c": "sol", "m": m},
                    cantidad=1, relacional=True, distancia_al_lado=300, elementos=els, rasgo="semejanza", rasgos=["semejanza", "relacion"]))
    for n in range(4):
        r = random.Random(2000 + n); celdas = [(x, y) for x in range(5) for y in range(4) if (x, y) != (0, 3)]
        r.shuffle(celdas); objs = [cosa(f, x=celdas[i][0], y=celdas[i][1]) for i, f in enumerate(r.sample(["hueso", "llave", "pelota", "taza", "caracol", "gorro"], 5))]
        paredes = [list(c) for c in celdas[5:8]]
        Dd.append(it(f"8b-d{n+1}", "Seguí las pistas en orden y llevá a Roco.", tipo="recorrido", cols=5, filas=4, paredes=paredes, roco={"x": 0, "y": 3}, objetos=objs, orden=r.sample(range(5), 3), rasgo="orden"))
    return {"facil": F, "intermedio": I, "dificil": Dd}

BANCO = {
    "_nota": "Banco de PRUEBA de «Los cuatro exploradores» (FEC-015 v0.3). Ítems generados por scripts/exploradores_generar.py con semilla fija, con las consignas, letras y palabras de RT-CEX-001-R v1.0 (estado_clinico: validado por PSP-SR, pendiente de aprobación de la supervisora). La validación ítem por ítem la hace PSP-SR con este archivo. Estímulos del mundo de la aventura (0.4), ninguno tomado de un test. La FEC pide al menos 12 por variante y grado en 6–8: este banco tiene entre 4 y 9 por variante, grado, ruta y forma de letra (ver RT-CEX-001 v1.1).",
    "textos": TEXTOS, "historia": HISTORIA,
    "estrategias": {k: {"asi_se_juega": a, "estrategia": b, "estado_clinico": VALIDADO} for k, (a, b) in ASI_SE_JUEGA.items()},
    "ayudas": AYUDAS, "devoluciones": DEVOLUCIONES, "ideas_fuera": IDEAS, "contar": {k: [{"id": i, "txt": t} for i, t in v] for k, v in CONTAR.items()},
    "contar_estrategias_8b": CONTAR_8B, "nombres": NOMBRES, "nombres_color": COLORES,
    "variantes": {"objetos": objetos(), "sombras": sombras(), "niebla": niebla(), "jardin": jardin(), "laberinto": laberinto(), "fabrica": fabrica(),
                  "cofre_cuales": cofre_cuales(), "cofre_orden": cofre_orden(), "pistas_relampago": pistas_relampago(), "pistas_nuevas": pistas_nuevas()},
    "letras_validadas": {"_nota": "RT-CEX-001-R 3.2. El validador exige que cada ítem con letras use solo estas letras y palabras, en su forma.",
                         "mayuscula": {"letras": sorted(set("EFPRBOQCGMNVYITU") | set("AMERGS")), "palabras": ["SOL", "PAN", "MESA", "CASA", "PATO", "GATO", "MAPA", "HOJA", "NUBE", "BOTA", "TAZA", "PALA"]},
                         "minuscula": {"letras": sorted(set("mnhuaoceilft") | set("bdpq") | set("aegrts")), "palabras": ["sol", "pan", "mesa", "casa", "pato", "gato", "mapa", "hoja", "nube", "bota", "taza", "pala"]}},
    "laminas": {"_nota": "Registro de láminas (FEC-015 0.5): todas de relleno, hechas en código por DEV-IA, sin IA generativa ni terceros. Revisión de parecido pendiente.",
                "autor": "DEV-IA (relleno)", "fecha": "2026-11-15", "origen": "propio", "terceros": False, "ia_generativa": False, "cesion_de_derechos": "no aplica (relleno)",
                "revision_parecido": {"estado": "pendiente", "por": "persona distinta de quien produjo (REQ-CLI-EXP-00b)"}},
}

# ------------------------------------------------------------------ ficha técnica ------------------------------------------------------------------
G = ["facil", "intermedio", "dificil"]
def grados(desc, cambios, params):
    return {g: {"describe": desc[i], "cambia_respecto_al_anterior": cambios[i], "parametros": params[i]} for i, g in enumerate(G)}

VARIANTES = [
    {"variante": "objetos", "juego": 1, "lugar": "El claro de los objetos", "lamina": "claro", "personaje": "luna", "titulo": "1. Los objetos misteriosos · Las cajas de Luna", "titulo_nino": "Las cajas de Luna",
     "estacion": "reconocer", "habilidad_referencia": "discriminacion-visual", "habilidades": ["discriminacion-visual"], "habilidades_secundarias": ["atencion-sostenida", "identificacion-de-letras"],
     "dimensiones_que_cambian": ["semejanza-distractores", "disponibilidad-apoyos", "complejidad-consignas"],
     "grados": grados(["Modelo pegado en la caja y 3 o 4 objetos; los distintos difieren en la forma. Modelo visible todo el ítem.",
                       "El intruso del grupo, qué cambió entre dos escenas o tamaño menos evidente (4 a 6 objetos o 2 escenas).",
                       "Dos criterios a la vez (forma y marca), elegir el criterio y, en rutas que leen, letras parecidas en la forma de letra elegida."],
                      [[], ["semejanza-distractores", "disponibilidad-apoyos"], ["complejidad-consignas", "grado-abstraccion"]],
                      [{"objetos": [3, 4], "rasgo": "forma"}, {"objetos": [4, 6], "rasgos": ["detalle", "orientacion", "tamano"]}, {"criterios": 2}])},
    {"variante": "sombras", "juego": 2, "lugar": "El bosque de las sombras", "lamina": "bosque", "personaje": "michi", "titulo": "2. El bosque de las formas cambiantes · Las sombras del bosque", "titulo_nino": "Las sombras del bosque",
     "estacion": "explorar", "habilidad_referencia": "constancia-de-forma", "habilidades": ["constancia-de-forma"], "habilidades_secundarias": ["reconocimiento-visual"],
     "dimensiones_que_cambian": ["semejanza-distractores", "grado-abstraccion"],
     "grados": grados(["Una transformación (tamaño); objetos familiares; 2 o 3 sombras.", "Una transformación de otro tipo (giro o color); sombras de forma parecida.",
                       "Dos o tres transformaciones a la vez (tamaño, giro, espejo, color) o la misma letra en otra tipografía (rutas que leen)."],
                      [[], ["grado-abstraccion", "semejanza-distractores"], ["complejidad-relaciones", "grado-abstraccion"]],
                      [{"transformaciones": 1, "sombras": [2, 3]}, {"transformaciones": 1, "sombras": 3}, {"transformaciones": [2, 3], "sombras": 4}])},
    {"variante": "niebla", "juego": 3, "lugar": "El puente de la niebla", "lamina": "puente", "personaje": "luna", "titulo": "3. El puente de las imágenes incompletas · La niebla del puente", "titulo_nino": "La niebla del puente",
     "estacion": "reconocer", "habilidad_referencia": "cierre-visual", "habilidades": ["cierre-visual"], "habilidades_secundarias": ["reconocimiento-visual"],
     "dimensiones_que_cambian": ["cantidad-informacion-visual", "grado-abstraccion", "semejanza-distractores"],
     "grados": grados(["Objeto muy familiar con una hoja que tapa cerca del 20 %; 3 opciones con dibujo completo.", "Varias partes tapadas por ramas; objetos girados; 4 opciones.",
                       "Pocos indicios; 4 opciones de la misma categoría; en rutas que leen, palabra con la mitad de abajo tapada."],
                      [[], ["cantidad-informacion-visual", "grado-abstraccion"], ["grado-abstraccion", "semejanza-distractores"]],
                      [{"tapado_pct": 20, "opciones": 3}, {"manchas": 5, "opciones": 4}, {"manchas": 8, "opciones": 4}])},
    {"variante": "jardin", "juego": 4, "lugar": "El jardín de Michi", "lamina": "jardin", "personaje": "michi", "titulo": "4. El jardín escondido de Michi", "titulo_nino": "El jardín de Michi",
     "estacion": "reconocer", "habilidad_referencia": "figura-fondo", "habilidades": ["figura-fondo"], "habilidades_secundarias": ["atencion-sostenida", "seguimiento-de-consignas"],
     "dimensiones_que_cambian": ["semejanza-distractores", "superposicion", "complejidad-consignas"],
     "grados": grados(["Escena simple (10 a 15 elementos); objetivo destacado; modelo visible.", "20 a 30 elementos; superposición parcial; distractores que comparten un rasgo; 2 o 3 objetivos.",
                       "Escena compleja; consigna combinada (dos rasgos). En 3–5, Difícil con un solo rasgo."],
                      [[], ["semejanza-distractores", "superposicion"], ["complejidad-consignas", "semejanza-distractores"]],
                      [{"elementos": [10, 15]}, {"elementos": [20, 30], "objetivos": [2, 3]}, {"elementos": 28, "rasgos": 2}])},
    {"variante": "laberinto", "juego": 5, "lugar": "El laberinto de Roco", "lamina": "laberinto", "personaje": "roco", "titulo": "5. El laberinto de las direcciones · Los carteles de Roco", "titulo_nino": "Los carteles de Roco",
     "estacion": "integrar", "habilidad_referencia": "relaciones-espaciales", "habilidades": ["relaciones-espaciales", "posicion-en-el-espacio"], "habilidades_secundarias": ["seguimiento-de-consignas", "organizacion-y-planificacion"],
     "dimensiones_que_cambian": ["cantidad-pasos", "complejidad-relaciones", "necesidad-planificacion"],
     "grados": grados(["Una relación entre dos alternativas o una indicación (arriba, abajo, adentro, al lado).", "Girar el cartel (posición en el espacio) o 2 o 3 indicaciones seguidas.",
                       "Planear el recorrido pasando por un lugar; en 9–12, derecha e izquierda desde el punto de vista de Roco."],
                      [[], ["cantidad-pasos", "complejidad-relaciones"], ["necesidad-planificacion", "complejidad-relaciones"]],
                      [{"indicaciones": 1}, {"indicaciones": [2, 3]}, {"planificar": True}])},
    {"variante": "fabrica", "juego": 6, "lugar": "La fábrica de caminos", "lamina": "fabrica", "personaje": "tomas", "titulo": "6. La fábrica de los caminos mágicos · El tablero de la fábrica", "titulo_nino": "El tablero de la fábrica",
     "estacion": "integrar", "estacion_provisoria": True, "habilidad_referencia": "integracion-visomotora", "habilidades": ["integracion-visomotora", "organizacion-y-planificacion"], "habilidades_secundarias": ["organizacion-y-planificacion"],
     "dimensiones_que_cambian": ["complejidad-forma", "precision-requerida", "necesidad-planificacion"],
     "grados": grados(["Caminos anchos y delimitados, rectos o con una curva suave; unir 4 puntos numerados.", "Piezas en la grilla de puntos con varios segmentos; caminos más angostos; modelo al lado.",
                       "Pieza compuesta en la grilla o camino con varios tramos; planificar el orden de los trazos."],
                      [[], ["complejidad-forma", "precision-requerida"], ["necesidad-planificacion", "complejidad-forma"]],
                      [{"ancho": 90}, {"ancho": 60, "segmentos": [4, 7]}, {"ancho": 45, "segmentos": [10, 12]}]),
     "nota_clinica": "Trazar en una pantalla no es una intervención para la escritura ni para la motricidad. La escritura mejora con enseñanza explícita de la letra (Santangelo y Graham, 2016, nivel A). El entrenamiento perceptivo-motor no mejoró resultados académicos (Kavale y Mattson, 1983, nivel A). Si observa torpeza motora significativa, considere la derivación a terapia ocupacional o psicomotricidad."},
    {"variante": "cofre_cuales", "juego": 7, "lugar": "El cofre de los recuerdos", "lamina": "cofre", "personaje": "michi", "titulo": "7A. El cofre de los recuerdos: ¿cuáles viste?", "titulo_nino": "¿Cuáles viste?",
     "estacion": "integrar", "habilidad_referencia": "memoria-visual", "habilidades": ["memoria-visual"], "habilidades_secundarias": ["atencion-sostenida"],
     "dimensiones_que_cambian": ["demora", "semejanza-distractores", "interferencia"],
     "grados": grados(["2 o 3 cosas muy distintas; después aparecen de a una (4 o 5) y se responde «Estaba» o «No estaba»; sin demora.", "4 o 5 cosas; demora breve; las nuevas son de la misma categoría.",
                       "6 cosas; demora mayor; tocar las hojas entre mirar y responder (interferencia)."],
                      [[], ["demora", "semejanza-distractores"], ["interferencia"]], [{"mostrar": [2, 3], "demora_ms": 0}, {"mostrar": [4, 5], "demora_ms": 2500}, {"mostrar": 6, "demora_ms": 4000, "interferencia": 5}])},
    {"variante": "cofre_orden", "juego": 7, "lugar": "El cofre de los recuerdos", "lamina": "cofre", "personaje": "michi", "titulo": "7B. El cofre de los recuerdos: ¿en qué orden?", "titulo_nino": "¿En qué orden?",
     "estacion": "integrar", "habilidad_referencia": "memoria-visual-secuencial", "habilidades": ["memoria-visual-secuencial"], "habilidades_secundarias": ["memoria-de-trabajo"],
     "dimensiones_que_cambian": ["cantidad-pasos", "disponibilidad-apoyos", "tipo-operacion"],
     "grados": grados(["2 o 3 cosas en fila; casilleros numerados y la primera ya ubicada.", "4 o 5 cosas sin ayuda de ubicación, o «¿cuál falta?».", "6 cosas: «¿cuáles dos cambiaron de lugar?»."],
                      [[], ["cantidad-pasos", "disponibilidad-apoyos"], ["tipo-operacion"]], [{"secuencia": [2, 3], "primero_ubicado": True}, {"secuencia": [4, 5]}, {"secuencia": 6, "cambiados": 2}])},
    {"variante": "pistas_relampago", "juego": 8, "lugar": "La carrera de pistas", "lamina": "sendero", "personaje": "roco", "titulo": "8A. Pistas relámpago · La carrera de pistas", "titulo_nino": "Pistas relámpago",
     "estacion": "reconocer", "habilidad_referencia": "velocidad-de-procesamiento-visual", "habilidades": ["velocidad-de-procesamiento-visual"], "habilidades_secundarias": ["discriminacion-visual"],
     "disenado_para_tiempo": True, "dimensiones_que_cambian": ["semejanza-distractores", "cantidad-estimulos", "exigencia-temporal-individual"],
     "grados": grados(["Las pistas aparecen de a una; «Es igual» o «No es igual»; sin límite; pistas muy distintas.", "2 o 3 pistas juntas para tocar la igual; más parecidas; el tiempo se registra y no se muestra.",
                       "Pistas muy parecidas; exposición breve ajustada al desempeño de la propia persona; guardar cada pista en una de dos mochilas."],
                      [[], ["semejanza-distractores", "cantidad-estimulos"], ["semejanza-distractores", "exigencia-temporal-individual"]],
                      [{"pistas": 8, "limite": None}, {"pistas": 6, "alternativas": [2, 3]}, {"pistas": 8, "exposicion": "individual"}])},
    {"variante": "pistas_nuevas", "juego": 8, "lugar": "El campamento nuevo", "lugar_id": 9, "lamina": "campamento", "personaje": "tomas", "titulo": "8B. Pistas nuevas", "titulo_nino": "Pistas nuevas",
     "estacion": "transferir", "habilidad_referencia": "transferencia-a-situaciones-nuevas", "habilidades": ["transferencia-a-situaciones-nuevas"], "habilidades_secundarias": ["generalizacion", "autocorreccion"],
     "dimensiones_que_cambian": ["situacion-nueva", "cantidad-estrategias", "necesidad-planificacion"],
     "grados": grados(["Escena nueva con un objeto de otro reto, ahora girado.", "Dos estrategias combinadas: bandera igual y al lado del árbol.", "Plan previo, recordar el orden de las pistas, llevar a Roco y revisar («¿Cumple todas las pistas?»)."],
                      [[], ["cantidad-estrategias", "complejidad-consignas"], ["necesidad-planificacion", "cantidad-estrategias"]], [{"estrategias": 1}, {"estrategias": 2}, {"estrategias": 3, "plan_previo": True}])},
]
for v in VARIANTES:
    v.setdefault("lugar_id", v["juego"])   # RT-CEX-001-R 2.2: 8B tiene un lugar propio en el mapa (y su pieza)
    v.setdefault("estrategia", ESTRATEGIAS_FEC[v["variante"]])
    v["apoyos"] = {k: AYUDAS[v["variante"]][k] for k in ("1", "2", "3")}
    v["modalidad_respuesta"] = {"fabrica": ["trazo", "tocar-en-orden (sin trazo fino)"], "laberinto": ["tocar", "flechas", "teclado"]}.get(v["variante"], ["tocar", "tocar-y-ubicar", "arrastre opcional", "teclado"])
    v["adaptaciones"] = ["letra mayúscula o minúscula", "parlante en cada texto", "pantalla completa", "zoom (Juego 4 y 8B)"] + {"objetos": ["evitar diferencias solo de color"], "fabrica": ["sin trazo fino"], "pistas_relampago": ["sin exposición breve"], "cofre_cuales": ["nombre de la imagen en audio (se registra)"]}.get(v["variante"], [])
    v["transferencia"] = "B"
    v["idea_fuera"] = IDEAS[str(v["juego"])]
    v["tipos_error"] = DEVOLUCIONES["tipos"][v["variante"]]
    v["limitaciones"] = "No accesible para personas ciegas (P7 de la FEC-015)."

RUTAS = {
    "3-5": {"lee": False, "items_por_ronda": 3, "sesion_min": 12, "sesion_rango": "10 a 15 min, con una persona adulta",
            "variantes": {"objetos": ["facil", "intermedio"], "sombras": ["facil", "intermedio"], "niebla": ["facil", "intermedio"], "jardin": G, "laberinto": ["facil", "intermedio"],
                          "fabrica": ["facil", "intermedio"], "cofre_cuales": ["facil", "intermedio"], "cofre_orden": ["facil"], "pistas_relampago": [], "pistas_nuevas": []}},
    "6-8": {"lee": True, "items_por_ronda": 4, "sesion_min": 20, "sesion_rango": "20 min",
            "variantes": {**{v: G for v in ["objetos", "sombras", "niebla", "jardin", "laberinto", "fabrica", "cofre_cuales", "cofre_orden", "pistas_nuevas"]}, "pistas_relampago": ["facil", "intermedio"]}},
    "9-12": {"lee": True, "items_por_ronda": 4, "sesion_min": 28, "sesion_rango": "25 a 30 min", "variantes": {v: G for v in ["objetos", "sombras", "niebla", "jardin", "laberinto", "fabrica", "cofre_cuales", "cofre_orden", "pistas_relampago", "pistas_nuevas"]}},
}

MODULO = {
    "id": "exploradores", "nombre": "Los cuatro exploradores", "tipo": "herramienta", "version": "0.2.0-prueba", "fecha": "2026-11-15",
    "origen": "Documento rector «La gran aventura de los cuatro exploradores» de la supervisora (2026-11-15), decisiones D1–D8, FEC-015 v0.3 y RT-CEX-001-R v1.0 de PSP-SR",
    "fec": "FEC-015 v0.3", "respuesta_psp_sr": "RT-CEX-001-R v1.0", "revision_tecnica": "RT-CEX-001 v1.1", "estado": "borrador: sin registro de aprobación · solo entorno de prueba con datos sintéticos", "activo": True,
    "_nota": "Ficha técnica. Estación, habilidades, grados, apoyos y números salen de la FEC-015 (contenido clínico de PSP-SR, nivel C). DEV-IA solo traduce a parámetros de código. Generada por scripts/exploradores_generar.py.",
    "ficha": {
        "proposito": "Practicar percepción y procesamiento visual en ocho retos de una aventura, con tres grados, apoyos graduados y recorrido libre.",
        "habilidad": "Mirar con atención, comparar, reconocer formas que cambian, completar imágenes, encontrar cosas escondidas, ubicarse en un camino, trazar recorridos y recordar lo que se vio.",
        "para_que_sirve": "En esta aventura, Luna, Tomás, Roco y Michi buscan un tesoro en un bosque. Para avanzar hay que mirar con atención, comparar, encontrar cosas escondidas, ubicarse en un camino, trazar recorridos y recordar lo que se vio.",
        "texto_familia": "En esta aventura se practica mirar con atención, comparar, encontrar cosas escondidas, ubicarse en un camino, trazar recorridos y recordar lo que se vio. No es un tratamiento ni una evaluación.",
        "texto_profesional": "Estimulación de la percepción visual en ocho juegos (diez variantes) por Estaciones, tres grados y escala de apoyos 0–3 con retiro progresivo. Registro por habilidad, sin puntajes ni comparación con la edad. Nivel C.",
        "texto_profesional_7_1": "Esta aventura no es un test de percepción visual, de visión ni de motricidad, y no tiene baremos. El registro describe el desempeño en estas tareas y los apoyos usados; no describe a la persona ni es una evaluación diagnóstica. Si observa en la vida diaria señales visuales persistentes (acercarse mucho a las imágenes, entrecerrar los ojos, cansancio visual, dolor de cabeza al leer), considere la derivación a oftalmología. Si observa torpeza motora significativa, a terapia ocupacional o psicomotricidad.",
        "nota_juego_5": "La práctica de tareas espaciales mejora el desempeño en otras tareas espaciales (Uttal et al., 2013, nivel A). No hay evidencia de que esta aventura, por sí sola, mejore la matemática o la lectura.",
        "edad": "3 a 12 años (detalle por reto en rutas). 13 a 18 excluida (D6)", "nivel_evidencia": "C", "rotulo_evidencia": "Basada en práctica clínica, con evidencia limitada",
        "dosis_sugerida": "1 o 2 retos por sesión, 2 o 3 veces por semana, dentro del tiempo de sesión de su edad.", "dosis_nota_profesional": "Dosis orientativa, sin estudios que la respalden.",
        "fuentes": ["Kavale y Mattson (1983). Journal of Learning Disabilities, 16(3), 165–173. DOI 10.1177/002221948301600307 (A)",
                    "AAP y sociedades de oftalmología (2009). Joint statement: Learning disabilities, dyslexia, and vision. Pediatrics. PMID 19651597 (consenso)",
                    "Uttal et al. (2013). Psychological Bulletin, 139(2), 352–402. DOI 10.1037/a0028446 (A, tareas espaciales)",
                    "Santangelo y Graham (2016). Educational Psychology Review, 28(2), 225–265. DOI 10.1007/s10648-015-9335-1 (A)",
                    "Woods et al. (2013). Acta Psychologica, 143(2), 191–199. DOI 10.1016/j.actpsy.2013.03.008 (B)",
                    "Fisher, Godwin y Seltman (2014). Psychological Science, 25(7), 1362–1370. DOI 10.1177/0956797614533801 (B)",
                    "Melby-Lervåg y Hulme (2013). Developmental Psychology. DOI 10.1037/a0028228 (A)",
                    "Sala y Gobet (2017). Current Directions in Psychological Science, 26(6), 515–520. DOI 10.1177/0963721417712760 (A)",
                    "Wood, Bruner y Ross (1976). Journal of Child Psychology and Psychiatry, 17(2), 89–100 (marco teórico)",
                    "Belland et al. (2017). Review of Educational Research, 87(2), 309–344 (A, STEM)",
                    "Mueller y Dweck (1998). Journal of Personality and Social Psychology, 75(1), 33–52 (B)"],
        "declaracion_transferencia": {"B": "Se practica dentro de la app. No hay evidencia de que mejore por sí sola habilidades fuera de la app.",
                                      "transferir": "Transferir describe lo que pide la actividad: aplicar una estrategia a situaciones nuevas dentro de la app. No garantiza que la persona la use fuera de la app."},
        "no_es": "No es un test de percepción visual, de visión, de atención ni de motricidad; no da un perfil perceptivo; no ubica a nadie en una Estación; no reemplaza la enseñanza explícita de lectura y escritura ni la evaluación de oftalmología, terapia ocupacional o psicomotricidad.",
        "limitaciones": "No accesible para personas ciegas (P7 de la FEC-015). Baja visión: zoom, objetivos grandes y contraste.",
        "autor": "Lic. M. G. Noseda, Mat. 101 (diseño pedagógico) · PSP-SR (FEC-015)", "revisor_clinico": "Lic. M. G. Noseda (pendiente)",
    },
    "decisiones_supervisora": {
        "_nota": "Decisiones de diseño (FEC-015 §17) y pedidos del 2026-11-15. No son el registro de aprobación de una versión.",
        "D1": "Actividades e imágenes rediseñadas (0.4) e ilustraciones originales (0.5).", "D2": "Evidencia aceptada.",
        "D3": "Piezas del mapa en lugar de estrellas y medallas; sin voz grabada; sin reloj visible en 8A; trazo no guardado.", "D4": "Cada juego se llama «reto».",
        "D5": "Juego 1 y 8A en E2 Reconocer; 8B en E4 Transferir. El orden del mapa sigue el documento rector.", "D6": "Ruta 13–18 excluida.",
        "D7": "Ningún texto suena solo: se escucha al tocar su parlante (REQ-CLI-EXP-21). Reemplaza, para esta aventura, el audio activado por defecto de M11 en 3–8.",
        "D8": "Letra mayúscula o minúscula de imprenta elegible por la persona adulta; mayúscula por defecto en 3–8 y minúscula en 9–12 (REQ-CLI-EXP-22).",
    },
    "letra": {"opciones": ["mayuscula", "minuscula"], "por_defecto": {"3-5": "mayuscula", "6-8": "mayuscula", "9-12": "minuscula"}, "rige_desde": "item-siguiente",
              "_estado": "D8 y RT-CEX-001-R 3.3. Cambiar la letra es apoyo de acceso (R11); con un ítem en curso, rige desde el siguiente. Se registra tipo_letra por ítem."},
    "audio": {"automatico": False, "parlante_min_px": 44, "escuchar_historia": True, "regla": "D7: nada suena solo; cada texto tiene su parlante al lado y se escucha al tocarlo (REQ-CLI-EXP-21)."},
    "consigna_breve_max": 60,
    "habilidades_nuevas_propuestas": {"_nota": "FEC-015 5.2: provisorias hasta la tabla de anclajes EST-07 y la aprobación de la supervisora.",
                                      "constancia-de-forma": "Juego 2", "cierre-visual": "Juego 3", "figura-fondo": "Juego 4", "posicion-en-el-espacio": "Juego 5",
                                      "integracion-visomotora": "Juego 6 (solo con la nota de 5.9)", "memoria-visual": "Juego 7A", "memoria-visual-secuencial": "Juego 7B",
                                      "velocidad-de-procesamiento-visual": "Juego 8A"},
    "vocabulario_dimensiones_propuesto": {"_nota": "Dimensiones que la FEC-015 usa y no están en la lista cerrada del §4 de CRIT-001 (pendiente PSP-SR).",
                                          "semejanza-distractores": "propuesta de RT-LUC-001", "cantidad-informacion-visual": "Juego 3", "superposicion": "Juego 4", "complejidad-forma": "Juego 6",
                                          "precision-requerida": "Juego 6", "demora": "Juego 7A", "interferencia": "Juego 7A", "tipo-operacion": "Juego 7B",
                                          "exigencia-temporal-individual": "Juego 8A", "situacion-nueva": "Juego 8B", "cantidad-estrategias": "Juego 8B"},
    "apoyos_escala": {"_nota": "FEC-015 5.3 = FEC-014 5.4.", "niveles": {"0": "Sin apoyo de aprendizaje. Los apoyos de acceso (parlante, letra, zoom, contraste, sin arrastre) no suben el nivel",
                      "1": "Pista general: orienta la atención sin reducir la tarea", "2": "Ayuda específica: destaca una característica o reduce el campo o las opciones",
                      "3": "Demostración: se muestra cómo se resuelve un paso, se explica y se propone un nuevo intento"},
                      "retiro": {"regla": "si el ítem terminó con apoyo_max 2 o 3, el siguiente arranca con un nivel menos, hasta 0", "texto_adulto": "Después, cada ejercicio arranca con un nivel menos que el máximo que se usó en el anterior, hasta llegar a 0. Las ayudas se ofrecen; nunca se imponen."},
                      "sin_ayuda_para_m10": "apoyo_max 0 (REQ-CLI-CER-08)",
                      "apoyos_de_acceso": ["escuchar", "letra", "zoom", "tocar-y-ubicar", "sin-trazo-fino", "sin-exposicion-breve"],
                      "por_juego": "Juego 3: «Mostrame un poco más» cuenta como nivel 2. Juego 8A: «Mirala otra vez» cuenta como nivel 1 (alargar la exposición cambia la variable medida)."},
    "registro": {"_nota": "FEC-015 §8. Por ítem, en código, sin modelo de lenguaje. Nunca se guardan trazos, dibujos, voz, texto, imagen, cámara, ubicación ni mirada.",
                 "campos": ["variante", "juego", "estacion", "grado", "item", "habilidad", "resultado", "intentos", "errores", "tipos_error", "apoyos", "apoyo_inicial", "apoyo_max", "autonomia", "modalidad", "autocorreccion", "ms", "extra"],
                 "extra": ["paso_revelado (3)", "precision_trazo, salidas, entrada, pantalla, sin_trazo_fino (6)", "audio_objetivo, omisiones, falsas_alarmas (7A)", "exposicion_ms, sin_exposicion_breve, precision, tiempo_respuesta_mediana_ms (8A)", "estrategia (8B)"],
                 "leyenda_tiempo": "El tiempo se registra como contexto. No cuenta como error ni indica por sí solo una dificultad (salvo en 8A, donde precisión y tiempo van en columnas separadas)."},
    "criterio_acierto": {"_estado": "RT-CEX-001-R 5 (PSP-SR): de acuerdo para arrancar; en 3–5, 0,6 en el Juego 6", "general": "sin errores en el ítem",
                         "fabrica_precision_minima": 0.7, "fabrica_precision_minima_por_ruta": {"3-5": 0.6}, "pistas_precision_minima": 0.85},
    "m10": {"_nota": "Beta 2, 6.10, dentro de cada variante y por habilidad (FEC-015 5.17). Nunca cambia de reto ni de Estación solo. El tiempo no interviene salvo 8A (M10-7).",
            "ventana": 10, "minimo": 5, "subir_aciertos": 0.85, "subir_sin_ayuda": 0.7, "mantener_desde": 0.6, "errores_seguidos": 3, "pasos_por_sesion": 1},
    "error_repetido_umbral": 3,
    "trazo": {"_estado": "[Suposición] valores de DEV-IA, a calibrar en el entorno de prueba (FEC-015 5.9 punto 3)", "factor_entrada": {"touch": 1.6, "pen": 1.0, "mouse": 1.0},
              "pantalla_chica_px": 600, "factor_pantalla_chica": 1.25, "tolerancia_segmento": 26, "radio_punto": 40},
    "exposicion_8a": {"_estado": "RT-CEX-001-R 5 [Suposición, nivel C]: valores de arranque para calibrar; mínimo de 1000 ms en 6–8; nunca más de un acortamiento por sesión",
                      "inicial_ms": 2000, "min_ms": 700, "min_ms_por_ruta": {"6-8": 1000, "9-12": 700}, "factor": 0.85, "umbral_precision": 0.85, "pausa_ms": 500, "acortamientos_por_sesion": 1},
    "colores_daltonismo": {"_nota": "Pares de la paleta con diferencia de color CIE76 de 20 o más en simulación de deuteranopía, protanopía y tritanopía (matrices de Machado, Oliveira y Fernandes, 2009, severidad 1). Cálculo de DEV-IA del 2026-11-15; falta la revisión manual con un simulador (RT-CEX-001).",
                           "pares_validados": ["azul|sol", "celeste|coral", "lila|sol", "azul|coral"],
                           "solo_en_grados": {"lila|sol": ["intermedio", "dificil"]}, "_psp_sr": "RT-CEX-001-R 5: de acuerdo, con revisión humana con simulador antes del paquete de revisión; lila|sol solo en Intermedio y Difícil"},
    "items_minimos_prueba": 4,
    "rutas": RUTAS,
    "rutas_excluidas": {"13-18": "Esta aventura no se ofrece de 13 a 18 años (decisión de la supervisora D6): los protagonistas infantiles infantilizarían a un adolescente."},
    "estaciones": {"criterio": "CRIT-EST-001 v1.0 (CRIT-001 v1.1)", "estado_clinico": "FEC-015 v0.3 de PSP-SR · pendiente de registro de aprobación", "variantes": VARIANTES},
    "originalidad": {"_nota": "FEC-015 sección 0 (bloqueante). Ningún ítem, lámina, orden ni formato de tests con derechos de autor; los nombres de esos instrumentos no figuran en el código: scripts/originalidad.py los busca por huella.",
                     "formatos": "rediseñados según 0.4 (cajas, sombras, despejar la niebla, girar el cartel, tablero de puntos, Estaba/No estaba, casilleros, pistas de a una)"},
}

DIR.mkdir(parents=True, exist_ok=True)
(DIR / "banco.json").write_text(json.dumps(BANCO, ensure_ascii=False, indent=1) + "\n")
(DIR / "modulo.json").write_text(json.dumps(MODULO, ensure_ascii=False, indent=1) + "\n")
print("ok", sum(len(g) for v in BANCO["variantes"].values() for g in v.values()), "ítems")

# RT-CEX-001 — «Los cuatro exploradores»: revisión técnica y prototipo

| Campo | Valor |
| --- | --- |
| TIPO | Revisión técnica |
| DE | DEV-IA |
| PARA | PSP-SR (copia: Supervisora) |
| ID | RT-CEX-001 v1.1 |
| FECHA | 2026-11-16 (v1.0: 2026-11-15) |
| REFIERE A | FEC-015 v0.3 y RT-CEX-001-R v1.0 de PSP-SR (paquete único del 2026-11-15); decisiones D1 a D8 de la supervisora |

- **Estado:** prototipo v0.2.0 **en entorno de prueba, con datos sintéticos**. No hay registro de aprobación: nada sale del entorno de prueba.
- **Qué cambia respecto de v1.0:** se cargaron los textos, las letras y las palabras de RT-CEX-001-R v1.0 y se aplicaron sus correcciones (secciones 3.1, 3.3, 5 y 6) y la FEC v0.3 (REQ-CLI-EXP-21 y 22, casos 25 y 26). Esta versión reemplaza a la v1.0.
- **Alcance:** cómo se construyó lo que pide el paquete y qué falta. Textos, grados, umbrales y Estaciones son contenido clínico de PSP-SR, a aprobar por la supervisora. Esta revisión no los valida.
- **Tests de la sección 0.2:** ni esta revisión ni el código los nombran (REQ-CLI-EXP-00d). Se los menciona como «los instrumentos de la sección 0.2».

---

## Parte A. Resumen para la supervisora (sin jerga)

**El juego ya tiene los textos de PSP-SR y las correcciones que pidió.** [Seguro] El archivo de prueba nuevo está en la carpeta de descargas, `AprenderSiendo_Los_cuatro_exploradores_prueba.html`, y la versión anterior quedó en `Históricos/`.

**Qué vas a notar al probarlo:**

1. **La historia** tiene los textos de PSP-SR. Cada frase tiene su parlante al lado. Arriba hay un botón «Escuchar la historia» que la cuenta entera de una vez. Nada suena solo.
2. **Los lugares del mapa** tienen los nombres que eligió PSP-SR. «Pistas nuevas» ahora tiene su propio lugar: «El campamento nuevo».
3. **Las consignas, las pistas y las devoluciones** son las de PSP-SR.
4. **La letra.** Si cambiás entre ABC y abc en medio de un ejercicio, el cambio se aplica desde el ejercicio siguiente. Así lo pidió PSP-SR, para no mezclar ejercicios distintos. Los ejercicios con letras ahora están hechos para una sola forma de letra: en mayúscula no hay ejercicios de «letras dadas vuelta» como b y d.
5. **En el Juego 6**, la ayuda más fuerte ahora pinta el tramo del camino que sigue. Antes era solo un mensaje.
6. **En el Juego 5** de 9 a 12 años hay un ejercicio nuevo: «Desde donde mira Roco, ¿dónde está su derecha?».

**Qué falta:**

- Que PSP-SR revise **uno por uno** los 186 ejercicios del banco. Dejé el archivo `banco.json` en la carpeta compartida para que se lo lleves.
- La **alerta al profesional** cuando alguien se traba mucho en un juego: hay que probarla junto con el portal antes del paquete de revisión.
- Las **ilustraciones finales** del equipo de marca, la **revisión de colores** con un simulador hecha por una persona y algunos detalles menores (Parte D).

**Qué te pido:** que pruebes el archivo y que le lleves a PSP-SR esta revisión y el `banco.json`.

**Cuánto lleva lo que falta.** [Suposición] Unas 5 a 8 jornadas de trabajo técnico, más las ilustraciones originales. Calculo entre 150 y 220 horas de dibujo, unas 5 a 7 semanas con una persona a medio tiempo. El costo depende de su tarifa.

---

## Parte B. Trazabilidad (REQ-CLI-EXP-00a a 00g y 01 a 22)

| Requisito | Cómo se cumple | Dónde se verifica |
| --- | --- | --- |
| 00a | Figuras y escenas SVG dibujadas en código, con la paleta de marca y tinta #102F54. Sin imágenes ni recursos externos. Son de relleno hasta las láminas finales. | `tests/exploradores.test.js` |
| 00b | Sin IA generativa para ilustrar. Sin generación en vivo. Registro de láminas en `banco.json`. | banco |
| 00c | Estímulos del mundo de la aventura. Ningún formato de cinco opciones en blanco y negro. | Revisión humana pendiente (caso 20) |
| 00d | Ningún texto, metadato ni comentario nombra los instrumentos de 0.2. Sus huellas están en `scripts/originalidad_huellas.json`. | `scripts/originalidad.py` (CI) |
| 00e | Sin puntajes estándar, percentiles, edades equivalentes ni puntos de corte. | Vista profesional |
| 00f | Formatos de 0.4 (Parte C de v1.0). | e2e |
| 00g | Orden por graduación y azar con semilla fija. | generador |
| 01 | Cada paso de grado declara una dimensión distinta de `cantidad-estimulos`. | `validarBanco` (CI) |
| 02 | Todos los lugares de la ruta abiertos, sin desbloqueos (9 en 6–8 y 9–12; 7 en 3–5). | e2e |
| 03 | Lugares nombrados por acción (RT-CEX-001-R 2.2); el validador rechaza «estación», «nivel», «fácil», etc. | `validarBanco` y e2e |
| 04 | Sin promesas de mejora. Cada variante lleva la transferencia B y el Juego 6 la nota de 5.9. | ficha |
| 05 | M10 por variante y por habilidad. Sin nivel general. | test |
| 06 | Primer error: pista de nivel 1. Nivel 3: demostración con la frase común «Así se resuelve este paso. Ahora probá vos.» | e2e |
| 07 | Sin reloj ni tapado automático salvo 8A. En el Juego 7 se tapa con «Ya miré». | e2e |
| 08 | 8A sin reloj visible. Se acorta solo con 85 % o más y **una vez por sesión como máximo**. El mínimo es **1000 ms en 6–8** y 700 ms en 9–12, más 500 ms de pausa. Se puede desactivar. | test |
| 09 | El trazo se procesa en el dispositivo. Solo quedan `precision_trazo`, `salidas`, entrada y pantalla. | test y e2e |
| 10 | «Sin trazo fino» → `organizacion-y-planificacion`, con la consigna «Tocá los puntos en orden para armar la [llave].» | test y e2e |
| 11 | Alternativa sin arrastre y con teclado en cada juego. Sin voz, texto ni imagen. | e2e |
| 12 | `rasgo: color` solo con pares validados. **lila–sol solo en Intermedio y Difícil**. Se puede excluir. | `validarBanco` |
| 13 | Pieza del mapa por lugar, sin importar los aciertos. El tesoro depende de los lugares de la ruta. | e2e |
| 14 | 7A/7B y 8A/8B con habilidad, ventana M10 y fila propias. | test y e2e |
| 15 | La herramienta no le manda a la vista de la familia aciertos, apoyos ni tiempos. | `herramienta.js` |
| 16 | Vista profesional por habilidad, sin puntaje global ni colores, con la leyenda de 7.1. Los ítems con letras van en filas aparte por tipo de letra. | test y e2e |
| 17 | 3–5 sin 8A ni 8B; 13–18 excluida. | `validarBanco` |
| 18 | Error repetido 3 veces → ítem de ese rasgo con apoyo 1. | test |
| 19 | Palabras no admitidas en el validador y huellas de los nombres de los instrumentos. | CI |
| 20 | Ficha completa por variante (M04-1, EST-08), con la dosis de PSP-SR y su nota «Dosis orientativa, sin estudios que la respalden.» | ficha |
| **21** | Todos los textos de PSP-SR tienen 60 caracteres o menos; lo verifica el validador sobre consignas, historia, «Así se juega», ayudas de nivel 1 y devoluciones. Nada suena hasta que se toca su parlante, que está al lado del texto y mide 48 px. La historia tiene «Escuchar la historia». La persona adulta ve «Tocá el parlante para escuchar cualquier texto.» | test y e2e (casos 1 y 25) |
| **22** | La letra es apoyo de acceso y no sube `apoyo_max`. Con un ítem en curso, rige desde el siguiente. Se registra `tipo_letra`. Cada ítem con letras declara `letra_forma` y `rasgo`. En mayúscula no hay orientación con letras ni letras espejadas: el validador exige que cada letra y palabra esté en el conjunto validado de su forma. Por defecto: mayúscula en 3–8 y minúscula en 9–12. | test y e2e (caso 26) |

**Pruebas.** [Seguro] `tests/exploradores.test.js` pasa 1672 de 1672 verificaciones. `tests/exploradores.e2e.js` pasa 394 de 394 en navegador y juega los diez formatos en las tres rutas. La prueba de punta a punta del portal y la prueba de reglas (39 de 39) también pasan. Todas corren en CI.

---

## Parte C. Cómo se aplicó RT-CEX-001-R

### C.1 Textos (sección 2)

- **Historia:** cinco láminas con dos frases cada una, y la escena del tesoro con la lupa. Cada frase tiene su parlante. «Escuchar la historia» narra las cinco láminas seguidas. Dos láminas nuevas de relleno: el mapa con los lugares y el mapa con los huecos para las piezas.
- **Lugares:** los nueve nombres de 2.2. 8B tiene lugar y pieza propios, así que el mapa tiene 9 lugares en 6–12 y 7 en 3–5.
- **«Así se juega»:** las dos frases de 2.3, en ese orden. La estrategia larga de la FEC queda en la ficha profesional.
- **Consignas:** las plantillas de 2.4. Cada ítem cambia solo el objeto entre corchetes. DEV-IA ajustó el artículo y el plural («la llave», «el hueso», «los caracoles»). Donde la plantilla no encajaba con el ítem, el ítem lo dice en el campo `plantilla` (ver D.1).
- **Botones:** «Caja de iguales», «Caja de distintos», «Despejar un poco», «Girar», «Listo», «Empezar a mover», «Ver el modelo», «Ya miré», «Estaba», «No estaba», «Es igual», «No es igual», «Por partes», «Por la forma», «Por el color», «¿Cumple todas las pistas?», «Sí, listo», «Reviso» y «Ya encontraste 1 de 3.».
- **Ayudas:** las de nivel 1 de 2.4. El nivel 3 termina con la frase común.
- **Devoluciones:** las de error y de acierto parcial de 2.5. Cada tipo de error que registra un reto va a una de las frases de PSP-SR (tabla en `banco.json`, `devoluciones.error`). Se mantiene sin sonido de error, sin cruz roja ni vibración, y con el mismo estilo que la de acierto.
- Cada ítem lleva `estado_clinico: "validado por PSP-SR"`. Se quitó la marca «propuesta de DEV-IA» de todos los ítems.

### C.2 Letras y palabras (sección 3)

- **3.1:** cada ítem con letras es de una sola forma de letra (`letra_forma`) y declara su `rasgo`. En minúscula, b–d–p–q trabajan orientación y m–n y c–e trabajan detalle. En mayúscula, E–F, P–R–B y O–Q trabajan detalle y M–N trabaja forma. No hay letras espejadas.
- **3.2:** el Juego 2 usa A, G, e y r. Cada una aparece con serifa y se busca su sombra sin serifa, entre letras del mismo conjunto. El Juego 3 usa CASA, PATO, mesa y gato, con opciones del conjunto validado. En mayúscula se tapa la mitad de abajo y en minúscula la de arriba. Los conjuntos validados quedan en `banco.json` (`letras_validadas`) y el validador rechaza cualquier letra o palabra que no esté ahí.
- **3.3:** la letra inicial se toma de D8. Se registra `tipo_letra` por ítem y la vista profesional separa los ítems con letras por tipo de letra.

### C.3 Valores (sección 5)

- **8A:** mínimo de 1000 ms en 6–8 y 700 ms en 9–12. Un solo acortamiento por sesión. Hoy 8A Difícil, el único grado con exposición breve, se publica solo en 9–12, así que el mínimo de 6–8 queda preparado para cuando se publique.
- **Juego 6:** precisión mínima de 0,6 en 3–5 y de 0,7 en las demás rutas.
- **Colores:** el validador exige que lila–sol aparezca solo en Intermedio y Difícil. Hoy ningún ítem lo usa.

### C.4 Lo que el prototipo no hacía (sección 6)

- **Juego 6, nivel 3 en caminos:** ahora resalta el camino desde donde llegó la persona hasta la próxima curva, y después sigue ella. En el tablero de puntos ya marcaba el segmento que falta.
- **Demostraciones:** dibujo fijo con el paso resuelto y la frase común. En el Juego 2 se mantiene la rotación animada.
- **Personas ciegas:** declarado como limitación en la ficha (P7).
- **Alerta del piso:** no está hecha (ver D.2).

---

## Parte D. Pendientes y preguntas para PSP-SR

### D.1 Plantillas que no encajaban tal cual con el ítem

| Reto | Qué pasó | Qué hice |
| --- | --- | --- |
| 2 Intermedio | La plantilla dice «giró y cambió de color», pero la FEC 5.5 pide una sola transformación en Intermedio. | La partí en dos: «La [hoja] giró. ¿Y su sombra?» y «La [llave] cambió de color. ¿Y su sombra?» |
| 2 Difícil | «Así se ve la [carpa] desde arriba» necesita dibujos vistos desde arriba, que no hay. | Usé «La [x] giró y cambió de color. ¿Y su sombra?» en los ítems que giran, cambian de color y de tamaño. Los dibujos desde arriba quedan para las láminas finales. |
| 2 Fácil | La plantilla dice «creció». | Todos los ítems de Fácil ahora agrandan el objeto. |
| 5 Fácil | La plantilla dice «arriba o abajo», pero hay ítems con «adentro o afuera» y «al lado o arriba». | Usé las dos alternativas de cada ítem: «¿El hueso está adentro o afuera del cofre?» |
| 5 Intermedio, 3–5 | En 3–5 no se usan derecha ni izquierda (5.8). | Usé «Dos pasos adelante.» |
| 5 Intermedio, 3–5 | Un ítem tiene tres alternativas. | Usé «¿El caracol está arriba, abajo o al lado del tronco?» |
| 5 Difícil | «¿Dónde está su derecha?» es una pregunta, no un recorrido. | Reemplacé el recorrido «desde donde mira Roco» por un ítem nuevo de 9–12: Roco mira hacia un lado, hay una cosa en cada lado y se toca la que queda a su derecha. |
| 1 Intermedio, 4 Difícil en 3–5, 6 Intermedio y Difícil (caminos), 7B Intermedio | No tienen plantilla propia en 2.4. | Usé la plantilla del grado más cercano (detalle en el campo `plantilla` de cada ítem). |
| 8A Difícil | La regla «Las de punta, acá. Las redondas, allá.» separa por forma. | Rehíce los ítems: se separan por forma (punta o redonda), y la marca y el color cambian sin decidir nada. |
| 8B Fácil | «la [llave] de la fábrica» | Cada objeto nombra el reto de donde viene: la llave y el engranaje de la fábrica, el hueso del laberinto, la huella del claro. |

**Pregunta 1.** ¿Validan esas adaptaciones o prefieren otra redacción?

### D.2 Lo que falta antes del paquete de revisión

1. **Validación ítem por ítem.** Dejé `banco.json` en la carpeta compartida (`propuestas/banco_Los_cuatro_exploradores_v0.2.0.json`). Tiene 186 ítems, entre 4 y 9 por variante, grado, ruta y forma de letra. La FEC pide 12 en 6–8. Subir la cantidad es cuestión de contenido, no de programación.
2. **Alerta del piso con el portal.** La herramienta avisa al portal cuando se llega al piso, igual que «Los tres cerditos». Todavía falta la prueba de punta a punta con un profesional vinculado (alerta de M10-6) y sin profesional vinculado (sin alerta).
3. **La a y la g de dos formas (Juego 2, solo 9–12).** No están. Hace falta una tipografía de imprenta que traiga esas formas y se pueda incluir en el archivo sin conexión. **Pregunta 2.** ¿Las dejamos para las láminas finales o prefieren que se dibujen como figura?
4. **Revisión humana de los pares de colores** con un simulador.
5. **Calibración** de la tolerancia del trazo y de la exposición de 8A. El informe del entorno de prueba va a reportar `precision_trazo` por tipo de entrada y tamaño de pantalla.

### D.3 Textos de interfaz que siguen siendo de DEV-IA

PSP-SR no mandó estos textos, así que siguen como propuesta de DEV-IA (marcados en `banco.json`):

- Ayudas de nivel 2 y avisos auxiliares: «Quedan dos», «Mirá en esta parte», «Ahora el camino es más ancho».
- Los textos «¿Querés una pista?», «Pedir una pista», «Volver al mapa», «Antes / Ahora», «Seguir», «Jugar otra vez» y «Elegí un lugar del bosque.».
- Los cierres por tiempo y por piso, y los títulos de las pantallas.
- Los textos para la persona adulta, entre ellos el aviso «La letra cambia desde el próximo ejercicio.».

**Pregunta 3.** ¿Los validan como están o mandan otros?

### D.4 Detalle para la historia

La lámina 2 dice «hay ocho retos», pero en el mapa hay nueve lugares y diez actividades, porque el cofre tiene dos retos y las pistas tienen dos lugares. **Pregunta 4.** ¿Se mantiene «ocho retos»?

### D.5 Abiertos de la FEC

P2, P6, P7 y P8 siguen abiertas, sin cambios. Falta también el contrato de cesión con quien ilustre.

---

## Parte E. Archivos

- `app/herramientas/exploradores/exploradores.html`: la herramienta.
- `app/herramientas/exploradores/banco.json` y `modulo.json`: generados por `scripts/exploradores_generar.py`, versión 0.2.0-prueba.
- `python3 app/build.py --exploradores` arma el archivo suelto de prueba.
- Pruebas: `tests/exploradores.test.js` y `tests/exploradores.e2e.js`.

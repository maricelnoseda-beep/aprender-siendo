# RT-CEX-001 — «Los cuatro exploradores»: revisión técnica y prototipo

| Campo | Valor |
| --- | --- |
| TIPO | Revisión técnica |
| DE | DEV-IA |
| PARA | PSP-SR (copia: Supervisora) |
| ID | RT-CEX-001 v1.2 |
| FECHA | 2026-11-21 (v1.0: 2026-11-15; v1.1: 2026-11-16) |
| REFIERE A | RT-CEX-001-R v1.1 de PSP-SR (observación bloqueante para el paquete de revisión, 2026-11-21); FEC-015 v0.3; decisiones D1 a D8 de la supervisora |

- **Estado:** prototipo v0.3.0 y banco v0.3.0 **en entorno de prueba, con datos sintéticos**. No hay registro de aprobación: nada sale del entorno de prueba.
- **Qué cambia respecto de v1.1:** se aplicó el dictamen ítem por ítem de RT-CEX-001-R v1.1: los 25 ítems de B.1, las 8 correcciones globales de B.2, la Parte E y los cambios de texto de C.3. Se generaron los ítems que pide D.1 y se cargaron las mejoras viables de B.3. Esta versión reemplaza a la v1.1.
- **Alcance:** cómo se construyó lo que pide el dictamen y qué falta. Textos, grados, umbrales y Estaciones son contenido clínico de PSP-SR, a aprobar por la supervisora. Esta revisión no los valida.
- **Tests de la sección 0.2:** ni esta revisión ni el código los nombran (REQ-CLI-EXP-00d). Se los menciona como «los instrumentos de la sección 0.2».
- **Lista de cambios ítem por ítem:** `docs/herramientas/RT-CEX-001_cambios_banco_v0.3.0.md` (se genera desde el banco con `scripts/exploradores_cambios.py`).

---

## Parte A. Resumen para la supervisora (sin jerga)

**Ya está aplicado todo lo que pidió PSP-SR.** [Seguro] El archivo de prueba nuevo está en la carpeta de descargas, `AprenderSiendo_Los_cuatro_exploradores_prueba.html`. La versión anterior quedó en `Históricos/`.

**Qué cambió:**

1. **Los 25 ejercicios con problemas están corregidos.** Por ejemplo, en el jardín la consigna ahora dice «Encontrá las 2 hojas iguales a esta», en el laberinto la consigna y el botón dicen la misma palabra («para arriba») y en el cofre ya no aparece el cofre como cosa para recordar.
2. **Hay muchos más ejercicios: 394 en vez de 186.** PSP-SR pidió al menos 12 por juego y por grado para los chicos de 6 a 8 años. Ahora todos los juegos tienen 12 o más, también de 3 a 5 y de 9 a 12, salvo «Pistas relámpago» Difícil (8, solo de 9 a 12 años: con más saldrían ejercicios casi iguales).
3. **Textos para la persona adulta:** ahora con voseo y sin códigos internos. «Sin trazo fino» está explicado en lenguaje llano.
4. **«¿Cómo te resultó?»** usa caritas dibujadas por el portal, no emojis del teléfono.

**Una decisión tuya.** [Seguro] PSP-SR cambió la lámina 4 de la historia: «Vos sos el quinto explorador del equipo» pasó a **«¡Vos también sos parte del equipo!»**, para que no quede en masculino cuando juega una nena. Ya está puesto. Si preferís el texto anterior, decímelo y lo vuelvo a poner. También cambió la lámina 2 («En el camino al tesoro hay muchos retos»), porque en el mapa hay nueve lugares y no ocho.

**Qué falta antes del paquete de revisión:**

- Que PSP-SR revise los ejercicios nuevos y los que cambiaron. Los otros 133 ya están validados y no cambian.
- La alerta al profesional, la revisión de colores con un simulador hecha por una persona y la calibración (Parte D.2).
- Las ilustraciones finales. Su costo y plazo los decide el responsable del proyecto.

**Qué te pido:** que pruebes el archivo, que me digas qué preferís para la lámina 4 y que le lleves a PSP-SR esta revisión, el banco v0.3.0, la lista de cambios y las capturas.

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


**Agregados de v1.2 a la trazabilidad.** [Seguro] REQ-CLI-EXP-22 suma la regla E.1: si un ítem mezcla letras de un mismo grupo de orientación (b–d–p–q o n–u), el validador exige rasgo «orientacion». REQ-CLI-EXP-21 suma la regla B.2.3: el validador rechaza códigos internos (D7, REQ-…, «Juego 6») en los textos para la persona adulta. Las dos están en `tests/exploradores.test.js` con su caso en contra.

---

## Parte C. Cómo se aplicó RT-CEX-001-R v1.1

### C.1 Ítems a corregir (B.1)

Los 25 están corregidos. Cada uno lleva en el banco el campo `cambio_v030` con lo que cambió.

| Ítems | Qué se hizo | Estado en el banco |
| --- | --- | --- |
| obj-d2, obj-d3 | Se agregó un objeto de otra forma con la misma marca: una taza con punto entre las mochilas y una mochila con punto entre las tazas, como en obj-d1. | A revisar |
| obj-d4, obj-d5 | Consigna «¿En qué se parecen estas dos? Elegí una.» y botones «La forma» · «El color» · «La marca» (E.2). | Validado (texto de PSP-SR) |
| obj-d8 | Letras «n, m, n, h, n, m» (E.1). | Validado |
| jar-i2, jar-i4, jar-i6 | Plantilla «iguales a esta/este» (E.3). | Validado |
| jar-d5 a jar-d8 | Rehechos: una sola característica en la consigna, distractores de la misma categoría que difieren en un rasgo (llaves plateadas y con agujero cuadrado entre las doradas, caracol azul, regadera azul, pelota azul), 28 a 30 elementos y más superposición que en Intermedio. Consigna con la plantilla de E.3. | A revisar |
| lab-f5, lab-f6, lab-i4 a lab-i8 | Consignas de E.4: «para arriba», la misma palabra que el botón. | Validado |
| fab-i5 | Chispa en zigzag: tres segmentos, dos cambios de dirección. | A revisar |
| c7a-f1, c7a-i4, c7a-d2, c7a-f2, c7a-i5 | El cofre se reemplazó por otro objeto que no estaba en el ítem. El generador comprueba que los ítems cambiados son exactamente los de la lista de PSP-SR. | A revisar |

**Regla nueva en el generador.** [Seguro] El cofre no se usa como estímulo en todo el Juego 7 (7A y 7B). Lo verifica la prueba.

### C.2 Correcciones globales (B.2)

1. **Marca de validación.** [Seguro] «validado por PSP-SR» queda solo en lo que PSP-SR validó o escribió literalmente. Lo que armó DEV-IA lleva «pendiente de revisión de PSP-SR (banco v0.3.0, RT-CEX-001 v1.2)» y dice qué cambió en `cambio_v030`. En el banco hay **164 validados** (133 sin cambios y 31 cambiados con texto literal de PSP-SR) y **230 a revisar** (22 cambiados y 208 nuevos).
2. **Voseo:** «Acompañá sin dar las respuestas. Podés tocar el parlante, tocar «Escuchar la historia» o leer cada texto en voz alta.»
3. **Sin códigos a la vista:** se sacó «(D7)» y los números de juego pasaron a nombres de lugar en «sin trazo fino», «sin exposición breve», «evitar color» y «nombres en audio».
4. **«Sin trazo fino»:** el texto de PSP-SR, tal cual.
5. **Historia:** láminas 2, 3 y 4 con los textos de PSP-SR. La lámina 4 lleva el campo `pendiente_supervisora` con el texto anterior, por si la supervisora prefiere mantenerlo.
6. **Idea fuera de la pantalla del Juego 5 en 3–5:** el texto de PSP-SR. La herramienta elige la idea por ruta.
7. **Devoluciones de error:** las de B.2.7 y E.5. La frase del Juego 2 que hablaba del color de la sombra se retiró. «Se parece. Mirá el detalle de arriba.» quedó guardada para ítems que declaren la zona; hoy ninguno la declara.
8. **Rutas en Difícil y en 8B (respuesta a la pregunta).** [Seguro] Se cumple de las dos formas:
   - **Campo `rutas`:** todos los ítems Difícil de los Juegos 1, 2, 3 y 7A y todos los de 8B declaran `rutas: ["6-8", "9-12"]` (el Juego 6 y 7B ya lo tenían; 8A Difícil dice `["9-12"]`).
   - **Filtro de la ficha:** `modulo.json` no publica Difícil de esos juegos en 3–5 ni 8A u 8B en 3–5.
   - **Casos de prueba:** uno exige el campo `rutas` sin 3–5 en cada uno de esos ítems. Otro comprueba que la ficha no ofrece esos grados en 3–5. Un tercero muestra que, aunque un ítem perdiera el campo, Difícil igual no aparece en 3–5.

### C.3 Parte E (correcciones a RT-CEX-001-R v1.0)

| Punto | Cómo quedó |
| --- | --- |
| E.1 | n–u pasa a orientación, solo en minúscula. El banco guarda los grupos de orientación (`letras_validadas.orientacion`). El validador rechaza un ítem de «detalle» o «forma» que mezcle letras de un mismo grupo; hay un caso de prueba que pone una u en obj-d8 y lo rechaza. Se sumó obj-d16 (n–u, orientación, minúscula). |
| E.2 | Consigna y botones nuevos en el Juego 1. En 8B Difícil siguen «Por partes», «Por la forma» y «Por el color». |
| E.3 | Plantilla «iguales a esta/este» en todo Intermedio del jardín y en Difícil de 3–5. El validador comprueba que la escena tenga exactamente la cantidad de objetivos que dice la consigna y que ningún distractor sea igual al objetivo. |
| E.4 | Todas las consignas de mover usan la misma palabra que el botón; ninguna dice «adelante» ni «atrás». Difícil 9–12: «Roco mira para allá. Tocá lo que está a su derecha.» |
| E.5 | Devoluciones de B.2.7. |
| E.6 | Láminas 2 y 4. |
| E.7 | Se sigue con la FEC-015 v0.3. |

### C.4 Textos de interfaz (C.3 de PSP-SR)

Todos los textos de interfaz quedaron validados como están, salvo los de la tabla de C.3, que ya tienen el texto de PSP-SR:

- «Antes» pasó a «Volver» en la historia.
- La ayuda de nivel 2 de las sombras dice «Ahora hay menos sombras para elegir.».
- La ayuda de nivel 2 de «¿arriba o abajo?» nombra el objeto de referencia de cada ítem («Mirá dónde está el tronco.»). Cada ítem lo trae en el campo `ayuda2`.
- En el tablero del Juego 6, el nivel 2 dice «Mirá los puntos marcados en el modelo.».
- 8B cierra con «Revisaste y lo cambiaste: así queda bien.» solo si hubo autocorrección. Si no, cierra con «Usaste lo que sabías en un lugar nuevo.».
- Las caritas son pictogramas dibujados por el portal.
- «piña» pasó a «piña de pino».

### C.5 Mejoras de B.3

| Ítems | ¿Se aplicó? | Cómo |
| --- | --- | --- |
| obj-i5, obj-i6 | Sí | obj-i6 tiene escena propia (carpa, bandera, regadera…). Cada ítem de diferencias declara el rasgo de cada diferencia (`rasgos_diferencias`). Se sumó obj-i11 con una tercera escena. |
| som-f1 a f6 | Sí | Seis ítems nuevos «se achicó» (som-f7 a f12). |
| som-i4, som-i6 | No, en esos dos | No hay otra llave ni otro hongo de forma distinta entre los objetos de `nombres`, y PSP-SR pidió que los objetos nuevos se le manden antes de generar. Los seis ítems nuevos de Intermedio (som-i7 a i12) sí usan distractores de la misma categoría. **Pregunta 1:** ¿dibujo una segunda llave y un segundo hongo y te los mando? |
| som-d1 a d5 | Sí | Consigna «A la [hoja] le pasaron muchas cosas. ¿Y su sombra?» (y «Al [zapato]…»). |
| Juego 2 en general | Sí, en los nuevos | Las sombras ahora pueden dibujarse giradas o con otro tamaño. Los nuevos de Fácil tienen una sombra de otra forma con el tamaño del objeto transformado (error «se-guio-por-tamano»). Los nuevos de Intermedio y Difícil que giran tienen una sombra de otra forma girada igual (error «girada»). |
| nie-i3, nie-i5 | Medido | Ver D.3: porcentaje tapado de cada ítem. No cambié las manchas de los ítems validados. |
| nie-d3 | Sí | La carpa pasa a «forma-parecida». Los nuevos de Difícil distinguen las dos clases de error. |
| jar-i1, i3, i5 | Sí | Plantilla «iguales a esta». |
| lab-d5 a d8 | Sí | Consigna de PSP-SR. lab-d7 ahora tiene a Roco mirando para arriba. |
| fab-i7 | Sí | Puerta como marco (⊓) de tres segmentos. |
| c7b-f4, i3, i5 | Sí | Sin cofre. |
| 8a-d2, 8a-d4 | Sí | Hoja con puntas contra hoja redonda. |
| 8b-f1 a f4 | Sí | «junto al río». |
| 8b-i1, 8b-i3 | Sí | Una carpa de otra bandera junto al árbol. Lo cumplen también los 8 campamentos nuevos. |

**Un arreglo que no pidió PSP-SR.** [Seguro] En fab-i4 (el cartel), el palo era un segmento que pasaba por encima de otro punto del tablero. Si el chico tocaba ese punto, el juego lo tomaba como error. Lo partí en dos en ese punto: se ve igual. La prueba ahora exige que ningún segmento de ningún tablero pase por encima de otro punto.

---

## Parte D. Ítems nuevos y lo que falta

### D.1 Cantidad de ítems

[Seguro] Cantidad por variante y grado, contada por forma de letra, como la cuenta la herramienta. Primero 3–5, después 6–8 y después 9–12; «—» quiere decir que ese grado no se publica en esa ruta.

| Variante | Fácil | Intermedio | Difícil |
| --- | --- | --- | --- |
| 1 · Objetos | 12 · 12 · 12 | 12 · 12 · 12 | — · 12 · 12 |
| 2 · Sombras | 12 · 12 · 12 | 12 · 12 · 12 | — · 12 · 12 |
| 3 · Niebla | 12 · 12 · 12 | 12 · 12 · 12 | — · 12 · 12 |
| 4 · Jardín | 12 · 12 · 12 | 12 · 12 · 12 | 12 · 12 · 12 |
| 5 · Laberinto | 12 · 12 · 12 | 12 · 12 · 12 | — · 12 · 16 |
| 6 · Fábrica | 12 · 12 · 12 | 12 · 12 · 12 | — · 12 · 12 |
| 7A · ¿Cuáles? | 12 · 12 · 12 | 12 · 12 · 12 | — · 12 · 12 |
| 7B · Orden | 12 · 12 · 12 | — · 12 · 12 | — · 12 · 12 |
| 8A · Pistas relámpago | — · 12 · 12 | — · 12 · 12 | — · — · 8 |
| 8B · Pistas nuevas | — · 12 · 12 | — · 12 · 12 | — · 12 · 12 |

Hay **208 ítems nuevos**, todos «a revisar». La prueba exige al menos 12 por variante, grado y forma de letra en 6–8 (`items_minimos_paquete` en `modulo.json`).

**Cómo se respetaron las reglas de D.1:**

- **Objetos.** Solo se usaron objetos de `nombres` y letras de `letras_validadas`. No hizo falta ningún objeto nuevo.
- **Escenas.** Hay tres escenas distintas del claro y doce campamentos distintos. La prueba comprueba que no se repite ninguna. En 7A, el generador no repite el mismo grupo de cosas para mirar.
- **Cofre.** Nunca es estímulo en el Juego 7.
- **Jardín.** Usa «iguales a esta» y tiene exactamente la cantidad que dice la consigna. Difícil de 6 a 12 tiene ocho combinaciones nuevas de color y marca, con pares de colores validados en simulación: celeste/naranja, azul/naranja y azul/amarillo. Difícil de 3 a 5 tiene doce ítems con distractores de la misma categoría.
- **Laberinto.** La consigna y el botón dicen la misma palabra. Los ocho recorridos nuevos de Difícil:
  - no usan perspectiva, así que sirven en 6–8;
  - tienen solución, y pasar por la fuente alarga el camino;
  - se comprueban con una búsqueda de camino.
- **8B Difícil.** Los recorridos nuevos se comprueban de la misma forma.
- **8A Difícil.** Quedó en 8 y no en 12. Los dos pares que separan «de punta» y «redondas» son pocos: los cuatro nuevos mezclan los dos pares y cambian el color sin que decida nada. Más ítems serían casi iguales. **Pregunta 2:** ¿preferís 8 distintos o 12 con ítems más parecidos? ¿Hay otro par de formas «de punta» y «redonda» que te sirva?

### D.2 Lo demás

| Pendiente | Estado |
| --- | --- |
| Alerta del piso de punta a punta (con profesional vinculado y sin él) | Sigue pendiente: se prueba junto con el portal. Sin cambios en esta versión. |
| Revisión humana de los pares de colores con simulador | Sigue pendiente: la tiene que hacer una persona, con registro. Hay pares nuevos en uso (jardín Difícil): celeste/naranja, azul/naranja y azul/amarillo, todos de la lista validada en simulación. |
| Calibración de la tolerancia del trazo y de la exposición de 8A | Sigue pendiente: necesita personas probando en el entorno de prueba. |
| Lugares del mapa | Listo: ahora están también en `banco.json` (`lugares`), con su número y las variantes de cada uno. |
| Capturas de un ítem por juego y grado | Listo: 39 capturas, una por juego y grado (y Difícil del jardín en 3–5), más los corregidos que dependen del dibujo, la lámina 4 y las caritas. Van junto con esta revisión, y también va el archivo HTML de prueba. |
| La a y la g de dos formas (C.2 de PSP-SR) | Pendiente para la próxima entrega: las dibujo como figura vectorial y te mando la captura antes de cargarlas. |
| Caso de prueba 20 (revisión por una persona con formación en evaluación) | Sigue pendiente. |

### D.3 Porcentaje tapado en la niebla (B.3)

[Seguro] Se midió sobre los píxeles del dibujo del objeto al empezar el ítem, antes de despejar. Lo hace `scripts/exploradores_capturas.js`, que deja el detalle en `niebla_tapado.json`.

| Grado | Ítems validados (v0.2.0) | Ítems nuevos |
| --- | --- | --- |
| Fácil (meta: alrededor del 20 %) | f1 13 · f2 16 · f3 25 · f4 10 · f5 26 · f6 16 | f7 19 · f8 20 · f9 19 · f10 20 · f11 21 · f12 20 |
| Intermedio | i1 69 · i2 65 · **i3 83** · i4 88 · **i5 45** · i6 79 | i7 35 · i8 65 · i9 46 · i10 64 · i11 78 · i12 85 |
| Difícil | d1 76 · d2 76 · **d3 99** · d4 75 · d5 86 · d6 80 | d11 79 · d12 80 · d13 80 · d14 78 |

En los ítems nuevos, la posición de la hoja (Fácil) y la semilla de las manchas (Difícil) se eligieron midiendo, para quedar cerca del 20 % y del 80 %. En las palabras se tapa el 55 % de la altura.

**Pregunta 3.** [Probable] Tres ítems validados se apartan bastante: nie-f4 (10 %), nie-d3 (99 %, al empezar casi no se ve nada) y nie-i4 (88 %). ¿Querés que los ajuste a una meta? Si es así, ¿qué meta usamos para Intermedio y Difícil?

---

## Parte E. Archivos

- **Generador:** `scripts/exploradores_generar.py` arma el banco v0.3.0: 394 ítems con semilla fija, marcas de B.2.1 y control de la lista del cofre.
- **Banco y ficha:** `app/herramientas/exploradores/banco.json` y `modulo.json`, versión 0.3.0-prueba.
- **Lista de cambios:** `scripts/exploradores_cambios.py` genera `docs/herramientas/RT-CEX-001_cambios_banco_v0.3.0.md`.
- **Herramienta:** `app/herramientas/exploradores/exploradores.html`. Cambios de esta versión:
  - sombras giradas o con otro tamaño;
  - ayudas de nivel 2 por ítem y en el tablero;
  - cierre de 8B según haya habido autocorrección;
  - idea fuera de la pantalla por ruta;
  - pictogramas;
  - validador con E.1 y B.2.3.
- **Capturas y medición:** `scripts/exploradores_capturas.js`.
- **Pruebas:** `tests/exploradores.test.js` hace 4136 verificaciones, entre ellas las de RT-CEX-001-R v1.1. `tests/exploradores.e2e.js` hace 394 de punta a punta.
- **En la carpeta compartida:**
  - `descargas/AprenderSiendo_Los_cuatro_exploradores_prueba.html` (y su copia en `Históricos/`);
  - `propuestas/banco_Los_cuatro_exploradores_v0.3.0.json`;
  - `propuestas/RT-CEX-001_cambios_banco_v0.3.0.md`;
  - `propuestas/capturas_Los_cuatro_exploradores_v0.3.0/`;
  - esta revisión.

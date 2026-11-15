# RT-CEX-001 — «Los cuatro exploradores»: revisión técnica y prototipo

| Campo | Valor |
| --- | --- |
| TIPO | Revisión técnica |
| DE | DEV-IA |
| PARA | PSP-SR |
| ID | RT-CEX-001 v1.0 |
| FECHA | 2026-11-15 |
| REFIERE A | FEC-015 v0.2 «La gran aventura de los cuatro exploradores» y decisiones D1 a D6 de la supervisora (2026-11-15) |

- **Estado:** prototipo **en entorno de prueba, con datos sintéticos**. No hay registro de aprobación: nada sale del entorno de prueba.
- **Alcance:** si se puede construir, cómo se construyó y qué falta. Los textos para quien juega, los grados, los umbrales y las Estaciones son contenido clínico. Los valida PSP-SR y los aprueba la supervisora. Esta revisión no los valida.
- **Sobre el identificador.** La FEC pide «RT-EXP-001», pero ese número ya lo usa la revisión de Explorapalabras (entregada). Para no pisarla, esta revisión se llama **RT-CEX-001** (CEX: cuatro exploradores). [Seguro]
- **Sobre los tests de la sección 0.2.** Siguiendo REQ-CLI-EXP-00d, ni esta revisión ni el código nombran esos instrumentos. Se los menciona como «los instrumentos de la sección 0.2».

---

## Parte A. Resumen para la supervisora (sin jerga)

**Ya está armado un prototipo con los ocho juegos para que lo pruebes.** [Seguro] Lo dejé en la carpeta de descargas como `AprenderSiendo_Los_cuatro_exploradores_prueba.html`. Se abre con doble clic, sin internet y sin instalar nada.

**Tus dos pedidos de hoy:**

1. [Seguro] **Letra mayúscula o minúscula de imprenta.** La persona adulta la elige antes de empezar, y además hay un botón **ABC / abc** arriba de todo que la cambia en cualquier momento. Cambia todo lo que ve quien juega. En los retos con letras, el juego usa letras pensadas para cada forma, porque algunas letras que se confunden en minúscula (b, d, p, q) en mayúscula son letras distintas y el reto perdería sentido. Cambiar la letra cuenta como apoyo de acceso: no sube el nivel de ayuda.
2. [Seguro] **Consignas breves que solo suenan con el parlante.** Ninguna consigna tiene más de 60 caracteres (lo revisa una prueba automática cada vez que se cambia algo). Nada suena solo: cada texto tiene su ícono de parlante y se escucha únicamente al tocarlo.

**Qué tiene el prototipo:**

- La historia (cinco láminas), el mapa con ocho lugares que se nombran por lo que se hace ahí (nunca por Estación ni por grado) y una pieza del mapa al cerrar cada juego, sin importar los aciertos. Al juntar las piezas aparece el tesoro.
- Los ocho juegos, con diez variantes y tres grados cada una, abiertos sin orden obligatorio.
- La escala de ayudas 0 a 3. Las ayudas se van retirando de a poco. Ante el primer error aparece una pista, no la respuesta.
- Cada juego se puede jugar sin arrastrar y con teclado. En el Juego 6 hay una opción «sin trazo fino».
- El registro por habilidad para el profesional, sin puntaje general, sin colores de rendimiento y con la leyenda de 7.1.
- Todas las ilustraciones son dibujos simples hechos de cero con la paleta del portal. Son de relleno: las ilustraciones finales las hace el equipo de marca.

**Lo que falta y tiene que ver PSP-SR** (detalle en la Parte D):

1. **Los textos para quien juega.** La FEC no trae los textos de las consignas, de la historia ni de las explicaciones «así se juega». Escribí versiones breves de relleno, rotuladas «pendiente de PSP-SR». No son definitivas.
2. **Un choque con tu pedido.** La FEC dice que en 3 a 5 años «todo va en audio» y que la historia «se escucha». Apliqué tu regla: suena solo con el parlante. PSP-SR tiene que ajustar la ficha.
3. **Cantidad de ejercicios.** La FEC propone 12 por variante y grado. Para la prueba armé entre 4 y 8 (175 en total). Alcanza para probar cómo funciona, no para usarlo con chicos.
4. Algunos números técnicos (cuánto puede salirse el trazo del camino, cuánto se acorta la exposición en 8A) son propuestas mías para calibrar en la prueba.

**Cuánto lleva lo que falta.** [Suposición] Unas 8 a 12 jornadas de trabajo técnico después de recibir los textos y el banco validados por PSP-SR, más las ilustraciones originales (estimo entre 150 y 220 horas de dibujo, unas 5 a 7 semanas con una persona a medio tiempo; el costo depende de su tarifa).

**Qué te pido:** que pruebes el archivo y que lleves la Parte D a PSP-SR.

---

## Parte B. Viabilidad y trazabilidad

**Viabilidad: sí.** [Seguro] La aventura entra en la estructura modular (ADR-009) como una herramienta aislada (`app/herramientas/exploradores/`) con su ficha (`modulo.json`), su banco (`banco.json`) y su pieza de conexión al portal (`herramienta.js`). Reutiliza la escala 0–3, el retiro progresivo y el registro de «Los tres cerditos», y la búsqueda en escenas de la aventura de Luci.

| Requisito | Cómo se cumple | Dónde se verifica |
| --- | --- | --- |
| 00a | Todas las figuras y escenas son SVG dibujados en código, con la paleta de marca y contorno en tinta #102F54. Sin imágenes incrustadas ni recursos externos. Son de relleno hasta que el equipo de marca haga las finales. | `tests/exploradores.test.js` |
| 00b | No se usó IA generativa para ilustrar. No hay generación en vivo. | Registro de láminas en `banco.json` |
| 00c | Los estímulos salen del mundo de la aventura (huellas, hojas, piedras, llaves, objetos del campamento). Ningún formato de cinco opciones en blanco y negro. | Revisión humana pendiente (caso 20) |
| 00d | Ningún texto, metadato ni comentario nombra los instrumentos de 0.2. Se agregaron sus huellas a `scripts/originalidad_huellas.json`, de modo que la prueba de originalidad falla si aparecen en el repositorio. | `scripts/originalidad.py` (CI) |
| 00e | Sin puntajes estándar, percentiles, edades equivalentes ni puntos de corte. | Vista profesional |
| 00f | Cada juego usa el formato de 0.4 (Parte C). | e2e |
| 00g | El orden de los ítems sale de la graduación y del azar con semilla fija; no sigue ninguna serie de un test. | `scripts/exploradores_generar.py` |
| 01 | El validador exige que cada paso de grado declare una dimensión distinta de `cantidad-estimulos`. | `validarBanco` (CI) |
| 02 | Mapa con todos los juegos de la ruta abiertos, sin desbloqueos. | e2e |
| 03 | Los lugares del mapa se nombran por acción; el validador rechaza «estación», «nivel», «fácil», etc. en textos para quien juega. | `validarBanco` |
| 04 | Ningún texto promete mejoras; cada variante lleva la declaración de transferencia B; el Juego 6 lleva la nota de 5.9. | `modulo.json` |
| 05 | M10 corre por variante y por habilidad. No hay nivel general. | `tests/exploradores.test.js` |
| 06 | Primer error: pista de nivel 1. Al final de la escalera se muestra y explica la respuesta. | e2e |
| 07 | Sin reloj ni tapado automático salvo 8A. Juego 7 se tapa con «Ya miré». | e2e |
| 08 | 8A sin reloj visible; la exposición se acorta solo con 85 % o más; mínimo 700 ms más 500 ms de pausa (menos de 3 cambios por segundo); la persona adulta puede desactivarla. | test y e2e |
| 09 | El trazo se procesa en el dispositivo. Solo quedan `precision_trazo`, `salidas`, tipo de entrada y tamaño de pantalla. | test (el registro descarta cualquier otro campo) |
| 10 | Con «sin trazo fino» se unen puntos tocando y el resultado va a `organizacion-y-planificacion`. | test |
| 11 | Cada juego tiene una forma sin arrastre (tocar origen y destino) y con teclado. Sin voz, texto ni imagen. | e2e |
| 12 | Ítems con `rasgo: color` usan solo pares validados en simulación de daltonismo; la persona adulta puede excluirlos; ningún grado depende solo del color. | `validarBanco` |
| 13 | Pieza del mapa al cerrar cada juego, sin importar los aciertos. Sin estrellas, medallas ni contadores. El tesoro depende de los juegos de la ruta. | e2e |
| 14 | 7A/7B y 8A/8B tienen habilidad, ventana M10 y fila propias. | test y e2e |
| 15 | La vista de la familia la arma el portal; esta herramienta no le manda aciertos, apoyos ni tiempos. | `herramienta.js` |
| 16 | Vista profesional por habilidad, sin puntaje global ni colores, con la leyenda de 7.1. | e2e |
| 17 | 3–5 sin 8A ni 8B y solo en los grados de 5.12; 13–18 excluida (D6). | `validarBanco` |
| 18 | Tres veces el mismo tipo de error en un grado: el próximo ítem trabaja ese rasgo con apoyo 1 y el grado no cambia. El tipo de error sale del banco (la opción elegida), no de interpretar toques. | test |
| 19 | Lista de palabras no admitidas en el validador; huellas de los nombres de tests en la prueba de originalidad. | CI |
| 20 | La ficha tiene por variante los campos de M04-1 y EST-08, habilidades secundarias, apoyos, idea fuera de la pantalla y transferencia; 8B trae el texto de Transferir. | `modulo.json` |

**Pruebas.** [Seguro] `tests/exploradores.test.js`: 1372 verificaciones (motor, banco, letra, audio). `tests/exploradores.e2e.js`: 383 verificaciones en navegador sobre el archivo suelto, que juegan los diez formatos de punta a punta. Las dos corren en CI. También se agregó la aventura a la prueba de punta a punta del portal.

---

## Parte C. Lo que pide «Qué necesito de vos»

1. **Formatos de 0.4.** Juego 1: cajas para guardar los objetos iguales al modelo, intruso y diferencias. Juego 2: sombras, con rotación animada que no parpadea. Juego 3: despejar la niebla de a un paso. Juego 4: escena con objetivos que no se superponen. Juego 5: girar el cartel y caminos en el laberinto. Juego 6: caminos de trazo libre en todos los grados y tablero de puntos en Intermedio y Difícil. Juego 7: 7A «Estaba / No estaba» y 7B casilleros (orden, el que falta, los que cambiaron). Juego 8: 8A pistas de a una y 8B pistas nuevas en escena.
2. **Componentes reutilizados.** La búsqueda en escenas de FEC-013 (Juegos 4 y 8B) y la escala 0–3 con retiro progresivo de FEC-014.
3. **Trazo del Juego 6.** Las muestras del trazo viven solo en la memoria del navegador mientras dura el ítem. Al terminar se calcula la proporción de muestras dentro de la tolerancia y la cantidad de salidas, y las muestras se descartan. La tolerancia se agranda con el dedo (×1,6) y en pantallas de menos de 600 px (×1,25). [Suposición: valores a calibrar.]
4. **Exposición de 8A.** Arranca en 2000 ms y se multiplica por 0,85 solo si el bloque tuvo 85 % o más. Si baja, vuelve al valor anterior. Nunca baja de 700 ms y entre pista y pista hay 500 ms. No hay reloj visible; la falta de respuesta no cuenta como error. [Suposición: valores iniciales; el 85 % es de la FEC.]
5. **Validación en CI.** `validarBanco` revisa: respuestas únicas en cada formato, objetivos que no se superponen, `rasgo: color` con par validado, grados publicados por ruta, mínimo de ítems por ruta y grado, la ruta 13–18 excluida, el límite de parpadeo de 8A, palabras no admitidas y largo de consignas.
6. **Cantidad de ítems.** El prototipo tiene 175 ítems, entre 4 y 8 por variante, grado y ruta. [Seguro] Las 12 por variante y grado en 6–8 que propone la FEC son viables: el generador ya produce ítems con reglas y semilla fija, así que subir la cantidad es cuestión de que PSP-SR valide el contenido (palabras, letras, escenas), no de programar más.
7. **Costo y plazo.** Ver Parte A.

---

## Parte D. Pendientes para PSP-SR

### D.1 Textos de relleno (escritos por DEV-IA, no definitivos)

Todos están marcados en el banco con «propuesta de DEV-IA · pendiente de PSP-SR (RT-CEX-001)».

| Texto | Dónde está | Qué hace falta |
| --- | --- | --- |
| Consignas de los 175 ítems | `banco.json`, `variantes` | Validar o reemplazar, con un máximo de 60 caracteres |
| Historia (cinco láminas) | `banco.json`, `historia` | La FEC describe la historia pero no trae su texto |
| «Así se juega» de cada reto | `banco.json`, `estrategias` | La estrategia es de la FEC; la explicación breve es mía |
| Frases de error y de acierto parcial | `banco.json`, `devoluciones` | Las de acierto y esfuerzo son de 5.14; las de error son mías |
| Letras y palabras de los ítems con letras | Juegos 1, 2 y 3 | Validar los conjuntos para mayúscula y para minúscula |
| Consigna de 8B en el campamento | Juego 8B | La acorté para cumplir el límite de 60 caracteres |
| Nombre del lugar del Juego 2 en el mapa | «El bosque de las sombras» | La FEC titula el juego «El bosque de las formas cambiantes» pero no da nombre de lugar por acción |

Lo que sí sale tal cual de la FEC: las estrategias, las ideas fuera de la pantalla, las frases de acierto y esfuerzo, la leyenda de 7.1 y las rutas de 5.12.

### D.2 Ajustes de la FEC por el pedido de la supervisora (2026-11-15)

1. **Audio.** La FEC dice que en 3–5 «todo va en audio» y el caso de prueba 1 espera que la niña «escuche la historia en audio». Con la regla de la supervisora, nada suena solo: se escucha al tocar el parlante. Propongo cambiar el caso 1 a «puede escuchar la historia tocando el parlante».
2. **Letra.** Propongo como letra inicial mayúscula en 3–5 y 6–8, y minúscula en 9–12. [Suposición] Lo decide PSP-SR.
3. **Ítems de orientación de letras.** En minúscula usan b, d, p y q. En mayúscula esas letras no se confunden, así que el ítem usa otras parecidas (E, F, B). Hace falta validar que en mayúscula el ítem sigue trabajando el mismo rasgo.

### D.3 Valores a calibrar [Suposición]

- Tolerancia del trazo y factores por entrada y pantalla (Juego 6).
- Exposición inicial, factor y mínimo de 8A.
- Criterio de acierto para M10: sin errores en el ítem; en el Juego 6 además precisión de 0,7 o más; en 8A precisión de 0,85 o más.
- Pares de colores: azul|sol, celeste|coral, lila|sol y azul|coral pasan una diferencia de color de 20 o más en simulación de los tres tipos de daltonismo (el par más justo es lila|sol en tritanopía, 24,9). Falta la revisión con un simulador por una persona.

### D.4 Lo que el prototipo todavía no hace

- Las demostraciones de estrategia son un texto con dibujo fijo, no una animación.
- En el Juego 6, la ayuda de nivel 3 en los caminos es un mensaje; en el tablero de puntos sí marca el segmento que falta.
- No hay versión auditiva para personas ciegas (pregunta P7).
- Cuando se llega al piso (caso 5), la herramienta cierra el reto y se lo avisa al portal, igual que «Los tres cerditos». La alerta al profesional depende del portal y no la probé en esta revisión.

### D.5 Preguntas abiertas de la FEC

Siguen abiertas P2 (Juego 6 como integración visomotora con la nota de 5.9), P6 (Juego 7: «Ya miré» en todos los grados o exposición fija en Difícil), P7 (personas ciegas) y P8 (CRIT-003). Ninguna bloquea la prueba. El prototipo aplica «Ya miré» en todos los grados y declara `integracion-visomotora` con la nota de 5.9.

### D.6 Datos que faltan (sección 15 de la FEC)

Contrato de cesión de derechos con quien ilustre, y la dosis sugerida por juego.

---

## Parte E. Archivos

- `app/herramientas/exploradores/exploradores.html`: la herramienta (motor, dibujos, interfaz y los diez formatos).
- `app/herramientas/exploradores/banco.json` y `modulo.json`: banco y ficha, generados por `scripts/exploradores_generar.py`.
- `app/herramientas/exploradores/herramienta.js`: conexión con el portal.
- `python3 app/build.py --exploradores` arma `app/dist-exploradores/Los_cuatro_exploradores.html`, el archivo suelto de prueba.
- Pruebas: `tests/exploradores.test.js` y `tests/exploradores.e2e.js`.

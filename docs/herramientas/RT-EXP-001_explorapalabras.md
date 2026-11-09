# RT-EXP-001 — Explorapalabras: revisión técnica y prototipo en entorno de prueba

- **Versión:** 1.0 · **Fecha:** 2026-11-09 · **Autor:** DEV-IA
- **Refiere a:** especificación «Explorapalabras» de la supervisora (2026-11-09); CRIT-EST-001 v1.0 (Estaciones); RT-EST-001 v1.0; INSTRUCCIONES_DEV-IA_Beta2 v1.0 (REQ-CLI-T01 a T11, M04, M05, M07, M08, M10, M18); ADR-009 (estructura modular); guía de interfaz (`docs/marca/guia-de-interfaz.md`).
- **Estado:** prototipo en entorno de prueba, con **contenido de prueba no validado** (palabras, imágenes, textos y parámetros de cada grado). Sin aprobación clínica ni técnica. No se publica.
- **Código:** `app/herramientas/explorapalabras/` (juego, banco de prueba, ficha con Estaciones), `tests/explorapalabras.test.js`.

---

## Parte A. Resumen para la supervisora (sin jerga)

**Qué está hecho.** [Seguro] El juego funciona completo en el entorno de prueba: las 15 temáticas, las 4 Estaciones con sus 3 grados, el modo palabras y el modo dibujos, letra MAYÚSCULA o minúscula, las dos pistas de primera letra, el marcado de cada palabra encontrada, la comprobación automática y el cierre con devolución positiva. Funciona en computadora, tablet y celular, con audio en los textos.

**Cómo lo probé.** [Seguro] El programa armó 12 sopas distintas para cada una de las 360 combinaciones posibles (15 temáticas × 4 Estaciones × 3 grados × 2 modos): 4.320 sopas, todas correctas. Cada palabra aparece una sola vez, en las direcciones de su Estación. Además lo jugué de punta a punta en computadora y en celular, solo y dentro del portal.

**Cuatro ajustes respecto de tu especificación**, porque chocaban con reglas que ya están vigentes. No debilité ninguna regla: propongo una alternativa y PSP-SR confirma.

1. **La Estación y el grado los elige la persona adulta, no quien juega.** Regla vigente: el chico no ve niveles (M05-2) y la familia en modo libre tampoco (M08). El recorrido queda así: persona adulta (Estación y grado) → quien juega elige la temática → dibujos o palabras y mayúscula o minúscula → juego. Para cambiar la Estación o el grado al final hay un botón que se mantiene apretado, como en el resto del portal. En el portal, esa pantalla aparece solo en consulta. En casa se usa lo último que eligió el profesional. Si querés que la familia también pueda elegir, lo decide PSP-SR (pregunta P1).
2. **"Reconocer los aciertos y el esfuerzo"** se hace nombrando lo que hizo ("Buscaste la primera letra y seguiste el camino"), no elogiando a la persona. Regla vigente M18-2: nada de "¡qué inteligente!". Cuando marca algo que no es una palabra, aparece un mensaje tranquilo, sin cruz roja ni sonido de error.
3. **"Mostrar la cantidad de palabras encontradas"**: si completa la sopa, dice "Encontraste las 6 palabras". Si decide terminar antes, no aparece "4 de 6", porque eso es un "te falta" (M05-2). Se muestran las palabras que sí encontró.
4. **Temáticas "Fútbol" y "Juegos actuales" sin marcas.** No hay clubes ni videojuegos con nombre comercial, porque la regla T07 no permite publicidad. Usé palabras generales como pelota, arco, control y joystick.

**Lo que todavía falta definir** (está en las preguntas a PSP-SR): las palabras definitivas de cada temática, sobre todo Familia (cada familia es distinta) y Juegos actuales; las imágenes definitivas (hoy son emojis del sistema, solo para probar); los textos que ve el chico; y si se aceptan palabras al revés y letras más chicas en celulares con las cuadrículas grandes.

**Qué te pido.** Que pruebes el archivo de doble clic y me digas si el recorrido y la estética te resultan bien. Nada de esto se publica hasta tener la validación de PSP-SR y las dos aprobaciones.

---

## Parte B. Análisis técnico (para PSP-SR y responsable técnico)

### B.1 Arquitectura

- **Herramienta del portal (ADR-009):** carpeta propia `app/herramientas/explorapalabras/` con `herramienta.js` (anfitrión en el portal), `explorapalabras.html` (el juego), `banco.json` (palabras, imágenes y textos para personas, separados del código para que PSP-SR los revise sin leer código) y `modulo.json` (ficha con el bloque `estaciones` del diseño RT-EST-001 B.2).
- **Aislamiento:** el juego corre en un marco aislado (`iframe sandbox="allow-scripts"`), igual que la Isla de Juegos. No accede a la app ni a datos de la persona. Solo envía al portal el resultado de cada sopa. Así también funciona solo, en un archivo, para la prueba con doble clic (`python3 app/build.py --explorapalabras`).
- **Sin modelo de lenguaje.** Todo es determinista: generación de la sopa, validación y pistas son código. Nada se genera en vivo (T11): las palabras salen de un banco escrito de antemano.
- **Generador:** elige palabras de la temática que entran en la cuadrícula; en Explorar y Reconocer prioriza las marcadas como familiares; las ubica en las direcciones permitidas; rellena según el tipo de relleno del grado y verifica que **cada palabra aparezca una sola vez** en toda la cuadrícula, leyendo en las 8 direcciones. Si no lo logra, vuelve a armarla.
- **Validación automática:** la selección (primera y última letra, tocando o arrastrando) se acepta si coincide exactamente con las celdas de una palabra, en cualquiera de los dos sentidos.
- **Pistas:** dos, independientes. Cada una revela solo la primera letra de la próxima palabra pendiente, al lado de esa palabra o dibujo. No marca nada en la cuadrícula (lo verifica la prueba de punta a punta).
- **Datos que llegan al profesional** (por sopa): temática, Estación, grado, modo, letras, palabras, encontradas, pistas usadas, selecciones que no eran palabra y si se completó. Nada de esto se muestra a quien juega.
- **Sin ajuste automático (M10).** El grado queda fijo, elegido por la persona adulta. La Estación nunca cambia sola (RT-EST-001).

### B.2 Trazabilidad con la especificación

| Especificación | Implementación | Estado |
| --- | --- | --- |
| §2 15 temáticas con banco | `banco.json`: 15 temáticas, entre 10 y 20 palabras cada una | Hecho, contenido de prueba |
| §3 4 Estaciones × 3 grados en cada temática | `modulo.json` › `estaciones.variantes[].grados` | Hecho, parámetros a validar (B.3) |
| §4 Características por Estación | Direcciones, tamaño, cantidad, largo, relleno, cruces y apoyos por grado (B.3) | Hecho |
| §5 Modo palabras / modo imágenes | Elección antes de empezar; en modo dibujos no se muestra la escritura hasta encontrarla | Hecho |
| §6 Mayúscula / minúscula | Cuadrícula, lista, pista y cierre respetan la elección | Hecho |
| §7 Dos pistas de primera letra | Ver B.1 | Hecho; ver P8 |
| §8 Recorrido | Persona adulta (Estación, grado) → temática → modo y letras → juego | **Ajustado** (Parte A, punto 1) |
| §8.9 Palabra encontrada marcada | Trazo de color sobre la cuadrícula y tilde verde en la lista | Hecho |
| §9 Cierre | Completó, cantidad, proceso, pistas; jugar otra vez, otra temática, otro modo; Estación y grado con botón para la persona adulta | Hecho; **ajustado** (puntos 2 y 3) |
| §10 Accesibilidad | Audio en todo texto (T09), teclado completo, foco visible, nombres accesibles, contraste de marca, movimiento reducido | Hecho; ver P10 |
| §11 Validación automática y dispositivos | Ver B.1; tamaño de celda adaptable | Hecho |

### B.3 Parámetros propuestos por grado ([Suposición]: propuesta técnica a validar por PSP-SR)

| Estación | Grado | Cuadrícula | Palabras | Largo | Direcciones | Relleno | Otros |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Explorar | Fácil | 6 × 4 | 3 | 3–6 | → | distinto | una por fila; familiares |
| Explorar | Intermedio | 7 × 5 | 4 | 3–6 | → | mixto | una por fila; familiares |
| Explorar | Difícil | 8 × 6 | 5 | 3–7 | → | parecido | una por fila; familiares |
| Reconocer | Fácil | 7 × 7 | 4 | 3–6 | → ↓ | distinto | familiares |
| Reconocer | Intermedio | 8 × 8 | 6 | 3–7 | → ↓ | mixto | familiares |
| Reconocer | Difícil | 9 × 9 | 7 | 3–8 | → ↓ | parecido | pueden cruzarse |
| Integrar | Fácil | 9 × 9 | 6 | 4–8 | → ↓ ↘ | mixto | cruces |
| Integrar | Intermedio | 10 × 10 | 7 | 4–9 | → ↓ ↘ ↗ | mixto | cruces |
| Integrar | Difícil | 11 × 11 | 8 | 4–10 | → ↓ ↘ ↗ | parecido | cruces |
| Transferir | Fácil | 11 × 11 | 8 | 4–11 | → ↓ ↘ ↗ | mixto | cruces |
| Transferir | Intermedio | 12 × 12 | 9 | 4–12 | + ← ↑ (al revés) | parecido | 2 señuelos |
| Transferir | Difícil | 13 × 13 | 10 | 4–13 | las 8 | parecido | 4 señuelos |

- **Relleno:** *distinto* = las letras de relleno no aparecen en las palabras (discriminación más fácil); *mixto* = letras frecuentes del español; *parecido* = letras de las mismas palabras y letras visualmente parecidas (b/d/p, m/n, o/c/g). **Señuelo:** el comienzo de una palabra (2 o 3 letras) que no la completa.
- **CRIT-EST-001 §4:** entre grados cambian también el relleno, las direcciones, el largo, los cruces o los señuelos, no solo la cantidad. Lo verifica la prueba automática en cada cambio.
- **Apoyos por Estación:** Explorar y Reconocer tienen dibujo junto a la palabra (modo palabras) y nombre en audio al tocar el dibujo (modo dibujos). Integrar y Transferir mantienen el audio de las palabras escritas (T09) y las pistas, pero no el nombre en audio de los dibujos.
- **Banco de prueba con faltantes:** Familia en modo dibujos tiene 8 palabras con imagen, así que Transferir intermedio y difícil arman 8 palabras en vez de 9 o 10. La persona adulta ve un aviso.

### B.4 Riesgos y controles

| Riesgo | Control |
| --- | --- |
| Que el chico o la familia vean Estación o grado como etiqueta | Pantalla solo para la persona adulta; en el portal, solo en consulta; el cierre no muestra Estación ni grado (lo verifica la prueba de punta a punta) |
| Frustración ante el error | Sin cruces, sin sonidos de error, sin tiempo límite ni vidas; mensaje neutro con pista de estrategia; "Quiero terminar acá" siempre visible |
| Contenido inadecuado en el banco | Banco escrito de antemano, sin generación en vivo, rotulado como prueba hasta la validación de PSP-SR |
| Marcas comerciales y publicidad (T07) | Sin nombres de marcas, clubes ni videojuegos |
| Cuadrículas grandes en pantallas chicas | Celda mínima de 44 px con tablero que se desliza, y opción "Ver la cuadrícula entera" que nunca baja de 24 px (WCAG 2.2, 2.5.8). Ver P10 |
| Emojis que se ven distinto según el dispositivo | Solo para la prueba; las imágenes definitivas van como archivos (guía de interfaz, regla 5). Ver P3 |

### B.5 Pruebas

- `node tests/explorapalabras.test.js`: ficha de Estaciones (4 Estaciones, 3 grados, 7 campos del CRIT-EST-001 §5, lista cerrada de dimensiones, "no solo cantidad") y generador en las 360 combinaciones con 12 semillas: 148.027 comprobaciones correctas.
- `tests/e2e.js`: en consulta, la persona adulta elige el grado, quien juega elige Frutas, modo dibujos y minúsculas, usa una pista, resuelve la sopa y el cierre no muestra Estación, grado ni elogios a la persona. Toda la prueba de punta a punta del portal sigue pasando.
- Prueba manual en navegador: computadora (1280 px), celular (390 px) con Explorar fácil y Transferir difícil, arrastre con mouse, toque, teclado y página sin desborde horizontal.

### B.6 Costo y plazo

[Seguro] Sin costo de infraestructura: corre en el navegador. [Suposición] Incorporar el banco y los textos validados por PSP-SR: media jornada. Imágenes definitivas: depende de quién las provea (P3).

---

## Parte C. Mensaje tipificado para PSP-SR

(Para copiar y llevar al proyecto de PSP-SR. Adjuntar este archivo, `app/herramientas/explorapalabras/banco.json`, `app/herramientas/explorapalabras/modulo.json` y el archivo de prueba `Explorapalabras_prueba.html`.)

```
TIPO: Revisión técnica
DE: DEV-IA
PARA: PSP-SR
ID: RT-EXP-001 v1.0
FECHA: 2026-11-09
REFIERE A: Especificación «Explorapalabras» (supervisora, 2026-11-09); CRIT-EST-001 v1.0; RT-EST-001 v1.0
```

PSP-SR: la supervisora especificó Explorapalabras, un juego de 15 sopas de letras temáticas organizado por las 4 Estaciones y 3 grados. Construí un prototipo en el entorno de prueba con **contenido de prueba no validado**. Te pido la validación clínica del contenido y de los criterios de cada grado. Nada se publica sin tu validación y las dos aprobaciones.

**Viabilidad:** [Seguro] viable y hecho. Es determinista: no interviene ningún modelo de lenguaje. Corre aislado del portal y no recibe datos de la persona.

**Ajustes que hice para respetar tus reglas** (detalle en Parte A y B):
1. Estación y grado los elige la persona adulta (M05-2, tabla 6.12, RT-EST-001); en el portal, solo en consulta.
2. Devoluciones que nombran el proceso; sin cruces, sonidos de error, tiempo límite ni elogios a la persona (M18-2).
3. Si termina antes, no se muestra "x de y" (M05-2).
4. Sin marcas comerciales ni clubes (T07).

**Preguntas concretas:**
- **P1. Quién elige Estación y grado.** La especificación dice "el usuario". Lo dejé en manos de la persona adulta y, en el portal, solo del profesional. ¿La familia en modo libre puede elegir Estación y grado en casa, o eso choca con la tabla 6.12 ("nunca ve niveles")?
- **P2. Banco de palabras** (`banco.json`, 15 temáticas): ¿validás las palabras y la marca de vocabulario familiar (`f`)? En particular:
  - *Fútbol:* sin clubes; incluí palabras sin imagen (gol, penal, árbitro, tribuna) que solo aparecen en modo palabras.
  - *Juegos actuales:* ¿videojuegos, juegos de mesa actuales o ambos? Usé términos generales (control, joystick, celular, tablet, pantalla, robot, dados, cartas, ajedrez, bloques), sin marcas. ¿Hay reparo con promover pantallas, dado el límite de tiempo de pantalla?
  - *Familia:* hay familias muy distintas (monoparentales, con dos mamás o dos papás, chicos en cuidado institucional o en duelo). ¿Se mantiene la temática? ¿Con qué palabras?
  - *Insectos:* usé "vaquita" (de San Antonio) por regionalismo. Excluí la araña, que no es insecto.
  - *Deportes:* excluí boxeo.
- **P3. Imágenes:** hoy son emojis del sistema, solo para probar. ¿Quién provee las definitivas, con qué estilo y con qué licencia? En Familia los dibujos son ambiguos (abuela o señora). ¿Se prefiere modo palabras solamente?
- **P4. Textos para personas** (`banco.json` › `textos`): consignas, devolución al encontrar una palabra, mensaje cuando la selección no es una palabra, pista y cierre (completo y parcial). Validalos o reescribilos.
- **P5. Parámetros por grado** (tabla B.3): cantidad, tamaño, largo, direcciones, tipo de relleno, señuelos y cruces. ¿Cumplen CRIT-EST-001 §4 y reflejan bien cada Estación? ¿Validás las habilidades asignadas a cada Estación en `modulo.json`?
- **P6. Palabras al revés** (Transferir, intermedio y difícil). Las pide la especificación. ¿Hay reparo para personas con dificultades de lectura? ¿Quedan solo en difícil?
- **P7. Tildes:** la cuadrícula va sin tildes ni diéresis (LIMON, PINGUINO), conserva la Ñ, y la lista va bien escrita (LIMÓN). ¿Correcto, o preferís evitar palabras con tilde en Explorar y Reconocer?
- **P8. Pista en modo palabras:** revelar la primera letra de una palabra que ya está escrita aporta poco. Alternativa no implementada: en modo palabras, la pista dice la dirección ("va de arriba hacia abajo") sin señalar la ubicación. ¿Se mantiene la especificación o se cambia?
- **P9. Nombre en audio en modo dibujos:** en Explorar y Reconocer, al tocar un dibujo se escucha su nombre (apoyo); en Integrar y Transferir no. ¿Validás?
- **P10. Celulares:** con cuadrículas de 11 a 13 columnas, las letras de 44 px no entran. Ofrezco deslizar el tablero o "ver la cuadrícula entera" con letras más chicas (mínimo 24 px). ¿Es aceptable, o Integrar y Transferir se recomiendan solo en tablet o computadora?
- **P11. Ajuste automático (M10):** no lo apliqué; el grado queda fijo. ¿Debe ajustarse solo dentro de la Estación con las franjas de M10? ¿Se registran para el profesional las selecciones que no eran palabra?
- **P12. Ficha de aventura (M04):** habilidad, para qué sirve, nivel de evidencia y fuente, edad (puse 5 a 18 como relleno), dosis y variante de la declaración de transferencia (puse B provisoria). ¿Cuáles corresponden?

**Riesgo:** clínico-técnico bajo con los ajustes descritos. Ninguna regla se debilitó.
**Costo y plazo:** [Suposición] media jornada para incorporar tu banco y textos validados; imágenes según P3.
**Estado:** prototipo en el entorno de prueba con contenido de prueba no validado. Pull request en borrador sobre la rama de la estructura modular (PR #5). No toca la beta 2 en revisión (PAQ-BETA2).

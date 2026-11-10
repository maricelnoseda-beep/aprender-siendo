# RT-LUC-001 — Aventura de búsqueda con Luci: revisión técnica y prototipo en entorno de prueba

- **Versión:** 1.0 · **Fecha:** 2026-11-09 · **Autor:** DEV-IA
- **Refiere a:** FEC-013 v0.1 (PSP-SR, 2026-11-09), aventura «¿Dónde está Luci?» (título de trabajo); CRIT-EST-001 v1.0 y RT-EST-001 (Estaciones); INSTRUCCIONES_DEV-IA_Beta2 v1.0 (T01 a T11, M03, M04, M06, M07, M10, M18, A10 a A18); ADR-009 (estructura modular); identidad visual del portal (index de referencia y Manual de marca).
- **Estado:** prototipo en entorno de prueba con **contenido de prueba no validado** (láminas, consignas, devoluciones, pistas y números de cada grado). Datos sintéticos. Sin aprobación clínica ni técnica. No se publica.
- **Código:** `app/herramientas/luci/` (aventura, banco de láminas de relleno, ficha por variante y grado), `tests/luci.test.js`, `tests/luci.e2e.js`, `scripts/originalidad.py`.
- **Archivo para probar con doble clic:** `descargas/AprenderSiendo_Aventura_Luci_prueba.html`.

---

## Parte A. Resumen para la supervisora (sin jerga)

**Qué está hecho.** [Seguro] La aventura funciona completa en el entorno de prueba: las cuatro variantes (una por Estación), cada una con sus tres grados, en las cuatro rutas de edad. Tiene el recorrido entero: «Así se busca» (la estrategia en voz y texto), jugar, el mapa de Luci que se ilumina, «Hacer» fuera de la pantalla y «Contar». También está la «Lámina para conversar» para 3 a 5 años, que no registra nada.

**Cómo lo probé.** [Seguro] Un programa armó cada una de las 147 láminas de prueba cuatro veces (588 escenas) y revisó 32.000 condiciones: que Luci sea la única con su forma, que en Fácil nada tenga su color, que las pistas dejen un solo lugar posible, que ningún paso de grado cambie solo la cantidad, que ningún texto use «misión», elogios o promesas, y más. Después lo jugué de punta a punta en computadora y en celular, solo y dentro del portal.

**Cómo cuidé que sea original (sección 0).** [Seguro] Luci es la luciérnaga que el portal ya tiene como guía («Ayuda con Luci»), con su luz como rasgo. No hay rayas, gorros con pompón, anteojos redondos, bastones de caminante ni personajes acompañantes. En todo el proyecto hay un control automático que busca los nombres de la obra original y hoy encuentra cero. El control guarda esos nombres «cifrados», así que ni siquiera el control los escribe. Lo que la máquina no puede juzgar es si un dibujo «se parece»: eso lo confirma por escrito una persona que no dibujó la lámina, como pide la ficha.

**Las láminas de esta prueba son de relleno.** [Seguro] Las armé con formas simples y la paleta de marca, sin inteligencia artificial que genere imágenes. Sirven para probar cómo se juega. Las definitivas las dibuja el equipo de marca.

**Cuánto lleva hacer las láminas reales (pregunta P5 de la ficha).** [Suposición] Propongo dibujar por capas: un fondo (la plaza, la feria) y, encima, los objetos sueltos. Con 14 fondos y unos 85 objetos se arman las 144 escenas que pide la ficha (6 por variante y grado en las rutas 6–8 y 13–18). Estimo entre 190 y 280 horas de dibujo y revisión, unas 6 a 8 semanas con una persona ilustradora a medio tiempo. El costo en pesos depende de su tarifa, que no tengo.

**Qué necesito de vos.**

1. Que pruebes el archivo de doble clic y me digas si el recorrido y la estética te resultan bien.
2. Una decisión de diseño: durante esta aventura, el botón «Ayuda con Luci» del portal muestra a Luci, con movimiento, fuera del dibujo. Puede confundir (la persona busca a Luci y la ve en otro lado) y choca con «nada se mueve durante la actividad». Propongo ocultar ese botón solo mientras dura esta aventura. Como toca la interfaz del portal, no lo hago sin tu visto bueno.
3. Un dato: ¿de dónde salió el dibujo de Luci que usa el portal? Si se hizo con una herramienta de inteligencia artificial, la ficha pide nombrarla en los créditos y que una persona revise el parecido con obras protegidas.

Nada de esto se publica hasta tener la validación de PSP-SR y las dos aprobaciones.

---

## Parte B. Análisis técnico (para PSP-SR y responsable técnico)

### B.1 Viabilidad

[Seguro] Viable con la arquitectura actual. Es una herramienta más de la estructura modular (ADR-009): corre aislada en un marco (iframe con `sandbox="allow-scripts"`, sin acceso a la app ni a sus datos), igual que la Isla de Juegos y Explorapalabras, y devuelve al portal solo el resultado de cada ítem por `postMessage`. Todo es determinista: no interviene ningún modelo de lenguaje y no hay generación en vivo (T11). M10, el piso, la escalera de ayudas, las pistas y el control de toque están en código.

[Seguro] Patrón aplicado (DEV-IA §5): «Ejercitación adaptativa, ítems aprobados de antemano». Cada ítem se arma a partir de una lámina del banco y de una semilla fija, así que la misma lámina produce siempre la misma escena: se puede revisar, versionar y aprobar.

Limitaciones que conviene declarar:

- [Seguro] No es accesible para personas ciegas (lo dice la FEC; queda en la ficha). Para baja visión hay zoom, alto contraste y zonas de toque grandes.
- [Probable] En teléfonos chicos la escena entera se ve pequeña; el zoom y el desplazamiento la resuelven, pero en 3–5 conviene recomendar tablet o pantalla completa (pregunta T4).

### B.2 Cómo se producen y versionan las láminas

**Modelo por capas (propuesto).** Cada escena = un **fondo** ilustrado (escenario) + una **capa de objetos** (Luci, sus cosas, señuelos y relleno) ubicada por datos. Ventajas: [Seguro] la zona de toque sale sola del rectángulo de cada objeto; la semejanza de los señuelos (forma y color) se controla en código; un mismo fondo sirve para varios grados; y cambiar un objeto no obliga a redibujar la escena.

**Formato.** SVG por capas optimizado, con respaldo WebP para gama baja. Objetivo [Suposición]: ≤ 150 KB comprimidos por escena y carga a demanda (T10). Las escenas son estáticas: sin animaciones ni sonido de fondo (M03-3).

**Circuito de producción de cada lámina:**

1. Equipo de marca dibuja el fondo o el objeto (paleta de marca, contorno tinta #102F54, sin tramas).
2. Si usa IA generativa: la herramienta queda en el campo `origen` de la lámina y en los créditos (REQ-CLI-LUC-00c). [Seguro] En la experiencia no hay generación en vivo.
3. Revisión humana registrada en `banco.json`, campo `revision`: parecido con obras protegidas (sección 0), escala de grises (REQ-CLI-LUC-01), contenido M03-4 y A14, revisor (distinto de quien dibujó) y fecha.
4. Recién con las tres revisiones en «ok» la lámina pasa a `estado: "aprobada"`. CI bloquea una lámina aprobada sin revisión completa o revisada por su autor.
5. Versión semántica por lámina; la huella SHA-256 de cada archivo entra en el manifiesto del módulo (ADR-009). Cambiar una lámina cambia la huella y obliga a revisar y aprobar esa versión.

### B.3 Cómo se marca la zona de toque

- **Por capas:** la zona es el rectángulo del objeto en coordenadas de la lámina (1200 × 800). No se dibuja a mano.
- **Si alguna lámina llega dibujada entera** (sin capas): se marca un polígono por objetivo y por señuelo en un archivo de zonas, con un editor interno simple. [Suposición] 20 a 30 minutos por lámina.
- **En pantalla:** la zona nunca es menor que 24 × 24 px de CSS (44 en la ruta 3–5), más 6 px de tolerancia, y se recalcula con cada zoom (WCAG 2.2 AA 2.5.8). Si dos zonas se tocan, gana el objeto con el centro más cercano; objetivos y señuelos se tratan igual. CI verifica que el objetivo no se superponga con ningún otro objeto.
- **Teclado:** flechas mueven un señalador y Enter «toca»; no revela dónde está el objetivo.
- **Revisión:** la pantalla adulta tiene «Mostrar zonas de toque», «Ver en escala de grises» y «Simular visión de colores atípica» para la revisión humana de cada lámina.

### B.4 Cómo se valida en CI la sección 0 y REQ-CLI-LUC-02

**Sección 0.**

| Control | Qué verifica | Dónde |
| --- | --- | --- |
| Nombres de la obra original | Recorre todos los archivos versionados (código, textos, fichas, metadatos, documentación) y compara cada palabra y par de palabras contra huellas SHA-256. Hoy: cero apariciones. El control no contiene los nombres; la lista en claro la custodia el equipo legal | `scripts/originalidad.py` + `scripts/originalidad_huellas.json` |
| Rasgos y roles prohibidos | Ningún objeto o personaje del banco lleva rayas, gorro con pompón, anteojos redondos, bastón de caminante, ni roles de mago, perro compañero, gemelo malvado o grupo de seguidores | `tests/luci.test.js` contra `modulo.json` → `originalidad` |
| Sin tramas | No hay patrones repetidos (`<pattern>`, gradientes repetidos) en el dibujo, y la paleta no tiene rojo puro: no se pueden armar rayas rojas y blancas | `tests/luci.test.js` |
| Revisión humana | Una lámina «aprobada» exige registro de parecido, revisor distinto del autor y fecha | `tests/luci.test.js` |

[Seguro] Límite: la máquina no juzga el parecido de un dibujo. El criterio de aceptación de la sección 0 (confirmación escrita de una persona ajena al diseño) sigue siendo humano; CI solo verifica que esté registrado. [Probable] Las palabras clave de tienda y el material de prensa conviene versionarlos en el repositorio (`docs/tienda/`) para que el mismo control los revise.

**REQ-CLI-LUC-02.** Cada grado declara en `modulo.json` el campo `cambia_respecto_al_anterior`. CI bloquea si un paso (Fácil → Intermedio o Intermedio → Difícil) declara solo `cantidad-estimulos` o usa una dimensión fuera del vocabulario. El vocabulario es la lista cerrada de CRIT-EST-001 §4 más tres dimensiones que usa FEC-013 y no están en esa lista: `semejanza-distractores`, `modalidad-presentacion` y `tipo-objetivo` (pregunta T1).

| Variante | Fácil → Intermedio | Intermedio → Difícil |
| --- | --- | --- |
| E1 Encontrá a Luci | cantidad-estimulos, semejanza-distractores, disponibilidad-apoyos | cantidad-pasos, tipo-objetivo |
| E2 Las cosas perdidas | modalidad-presentacion, semejanza-distractores, disponibilidad-apoyos | complejidad-consignas, grado-abstraccion, complejidad-relaciones |
| E3 El recorrido | disponibilidad-apoyos, necesidad-planificacion | grado-abstraccion, complejidad-consignas |
| E4 Las pistas | complejidad-relaciones, cantidad-pasos, disponibilidad-apoyos | grado-abstraccion, necesidad-planificacion |

### B.5 Decisiones técnicas del prototipo (para validar)

1. [Suposición] **E2 Intermedio «solo por su nombre» con señuelos de la misma categoría:** para que la consigna no sea ambigua, la cosa de Luci lleva su **gota de luz** como detalle distintivo y los señuelos (otras mochilas) no. Es coherente con la estrategia «me fijo en el detalle». Lo valida PSP-SR (T2).
2. [Suposición] **E4 en 3–12:** el mapa de un barrio con 8 lugares. Luci no se ve hasta elegir el lugar correcto; así hay que integrar las pistas y no se encuentra «a ojo». Las pistas se eligen por programa de un banco cerrado, con estas reglas: ninguna pista sola alcanza, todas juntas dejan un solo lugar, cantidad de negativas e inferencias según el grado. En 13–18, un horario de colectivos o una cartelera de club con datos de prueba.
3. [Seguro] **E4 usa escenas que no aparecen en E1 a E3** (verificado en CI): «situaciones nuevas».
4. **Modelo o lista «al inicio»** (E1 y E3 Intermedio y Difícil): se ven al empezar y se ocultan con el primer toque en la escena. Volver a verlos es el paso 2 de la escalera.
5. **Piso (caso 1):** 3 toques seguidos en señuelos cierran el ítem como no logrado; el siguiente llega con más ayuda (modelo visible) y «Vamos a probar algo nuevo». Si en Fácil vuelven 3 errores seguidos: demostración guiada, cierre de la aventura por esta sesión y aviso al profesional solo si hay profesional vinculado. Nunca hay bucle.
6. **Variante y grado** los elige el profesional en consulta; en casa se usa lo último que eligió. La variante nunca cambia sola: la regla de sugerencia (3 sesiones en Difícil en días distintos) está programada y probada, pero mostrarla necesita el historial entre sesiones del portal (fase 2 de ADR-009).
7. **Ruta 13–18:** estética editorial, «la marca de Luci» (cuadrado con gota de luz), sin la luciérnaga ilustrada, audio apagado por defecto y «modo sobrio» (sin mapa).
8. **Sin almacenamiento en el dispositivo** dentro del juego. El juego envía al portal: variante, grado, lámina, acierto, toques en señuelos, paso máximo de ayuda, tiempo, autocorrecciones y plan elegido. Sin ubicación, cámara ni seguimiento de la mirada.

### B.6 Costo y plazo (respuesta a P5)

[Suposición] Todas las horas son estimaciones; las tarifas las define el responsable del proyecto.

**Banco mínimo de la ficha:** 6 escenas × 4 variantes × 3 grados × 2 rutas (6–8 y 13–18) = **144 escenas**. Con el modelo por capas:

| Pieza | Cantidad | Horas estimadas |
| --- | --- | --- |
| Fondos infantiles (6 compartidos E1–E3 + 2 exclusivos E4) | 8 | 50–80 |
| Fondos editoriales (4 compartidos + horario y cartelera) | 6 | 30–45 |
| Objetos sueltos (infantiles y editoriales) | ~65 | 45–65 |
| Luci en 6 posturas + marca de Luci | 7 | 10–15 |
| Revisión humana (sección 0, grises, M03-4/A14) | 144 escenas + ~85 piezas | 55–75 |
| **Total ilustración y revisión** | | **190–280** |

Más: integración y pruebas de DEV-IA, 2 a 3 semanas después de FEC v1.0; la batería de evaluación ampliada (riesgo Alto) incluida.

**Recomendación de alcance para el entorno de prueba.** Empezar por 6–8 y 13–18 como propone PSP-SR. Si el presupuesto no alcanza, la alternativa es E1 y E2 completas primero (las que también sirven a 3–5) y E3–E4 en una segunda entrega.

### B.7 Riesgos técnicos

| Riesgo | Mitigación |
| --- | --- |
| Lámina que reproduce rasgos protegidos | Sección 0: controles automáticos + revisión humana registrada; título de trabajo hasta P1 |
| El objetivo se confunde con la guía Luci del portal | Ocultar «Ayuda con Luci» durante la aventura (pregunta a la supervisora) |
| Escena pesada en gama baja | SVG optimizado, WebP de respaldo, carga a demanda, objetivo de peso por escena |
| Objetivo demasiado chico en teléfono | Zona de toque mínima, zoom con gestos y botones, recomendación de tablet en 3–5 |
| Pistas ambiguas | Programa que garantiza un solo lugar posible, verificado en CI en todas las láminas |
| Se lea como test | Sin puntaje; la ficha y la vista profesional llevan el texto fijo de la sección 7.1 |

---

## Parte C. Trazabilidad a cada REQ-CLI de FEC-013

| Requisito | Cómo se cumple | Verificación | Estado |
| --- | --- | --- | --- |
| LUC-00a Diseño original, sin rasgos prohibidos | Luci luciérnaga del portal; catálogo sin rasgos ni roles prohibidos; sin tramas ni rojo puro | `tests/luci.test.js` + revisión humana | Automático ✔ · revisión humana pendiente |
| LUC-00b Sin mención ni comparación con la obra original | Búsqueda por huellas en todo el repositorio | `scripts/originalidad.py` (cero apariciones) | ✔ en repositorio · tienda y prensa: proceso |
| LUC-00c IA generativa: revisión y créditos; sin generación en vivo | Campo `origen` y `revision` por lámina; láminas del prototipo sin IA; el juego solo carga láminas del banco | `tests/luci.test.js` | ✔ · falta origen de la imagen de Luci (pregunta a la supervisora) |
| LUC-00d Título de trabajo | Se muestra «(título de trabajo)»; `nombre_es_de_trabajo: true` | Visual | ✔ hasta P1 |
| LUC-01 Objetivo distinguible por forma en grises | Forma de Luci única en cada escena (CI); herramienta «escala de grises» para la revisión | `tests/luci.test.js` + revisión humana | Control previo ✔ · revisión humana pendiente |
| LUC-02 Paso de grado con dimensión distinta de cantidad | `cambia_respecto_al_anterior` por grado | `tests/luci.test.js` | ✔ (con T1) |
| LUC-03 Sin reloj ni efecto del tiempo | Sin cuenta regresiva; M10 no usa el tiempo | `tests/luci.test.js` (caso 6) | ✔ |
| LUC-04 Sin promesas; declaración de transferencia | Banco de textos revisado; declaración B y texto de Transferir en la ficha | `tests/luci.test.js` | ✔ |
| LUC-05 Señuelo: devolución neutra con pista | Banco cerrado, sin cruz roja ni sonido | `tests/luci.test.js` + `tests/luci.e2e.js` | ✔ |
| LUC-06 13–18: marca de Luci y estética editorial | Estilo por ruta | `tests/luci.e2e.js` (caso 2) | ✔ |
| LUC-07 Escena estática | Sin animaciones ni sonidos en la escena | `tests/luci.test.js` | ✔ en la escena · ver T3 (guía animada del portal) |
| LUC-08 Pasos 2 a 5 cuentan como ayuda | `cuentaComoAyuda` | `tests/luci.test.js` | ✔ |
| LUC-09 Catálogo por ruta | `publicacion` por ruta; 3–5 sin E3/E4 hasta P3 | `tests/luci.test.js` + `tests/luci.e2e.js` | ✔ |
| LUC-10 Cero «misión», «nivel» visible, nombres de la obra, diagnósticos | Controles de texto + originalidad | Ambos | ✔ |
| LUC-11 Ficha completa por variante | Campos M04-1 y EST-08 en `modulo.json`; publicación bloqueada sin revisor clínico | `tests/luci.test.js` | ✔ estructura · revisor clínico pendiente |
| T01–T11, A10–A18 | Sin ingreso de texto, audio ni imagen; sin rachas ni puntajes; audio en todo texto; cierre suave por tiempo de la ruta; sin datos en el dispositivo | `tests/luci.test.js`, `tests/e2e.js` | ✔ en el prototipo |
| EST-01 a EST-10 | Estación de la actividad; quien juega no la ve; cambio nunca automático | Ambas pruebas | ✔ |
| M10-1 a M10-9 | Reglas en código con valores de la beta 2 | `tests/luci.test.js` | ✔ (M10-1: texto de familia en el portal) |
| M18-1, M18-2 | Avance del mapa por participación; devolución que nombra el proceso | Ambas | ✔ |

**Casos de prueba de la FEC:** 1 ✔ (e2e) · 2 ✔ (e2e) · 3 ✔ si P3 habilita E3 en 3–5 (hoy no se ofrece) · 4 ✔ (regla probada; falta historial entre sesiones) · 5 control previo ✔, revisión humana pendiente · 6 ✔ · 7 ✔ · 8 pendiente (revisión humana de láminas definitivas) · 9 parcial (vista familia en el portal, fase 2) · 10 ✔ · 11 pendiente (revisión del banco definitivo) · 12 ✔.

---

## Parte D. Mensaje tipificado para llevar al proyecto de PSP-SR

(Para copiar y llevar al Proyecto de PSP-SR. Adjuntar este archivo.)

```
TIPO: Revisión técnica
DE: DEV-IA
PARA: PSP-SR
ID: RT-LUC-001 v1.0
FECHA: 2026-11-09
REFIERE A: FEC-013 v0.1 (aventura de búsqueda con Luci, título de trabajo)
```

PSP-SR: recibí FEC-013 v0.1. La aventura es viable con la arquitectura actual y ya hay un prototipo en el entorno de prueba con láminas de relleno y datos sintéticos (rotulado «Contenido de prueba no validado»). Este documento no es un registro de aprobación.

**Respuesta a tu P5.** [Suposición] 144 escenas (6 por variante y grado en 6–8 y 13–18) son viables con producción por capas (fondo + objetos): 14 fondos, unos 85 objetos y 7 piezas de Luci. entre 190 y 280 horas de ilustración y revisión; 6 a 8 semanas con una persona ilustradora a medio tiempo. Detalle en B.2 y B.6.

**Hallazgos.**

1. [Seguro] Luci ya existe en el portal como guía («Ayuda con Luci»): una luciérnaga con la luz como rasgo. Coincide con tu propuesta 5.1; tu P2 queda parcialmente respondida por la identidad vigente. Origen de esa imagen: lo consulto con la supervisora (LUC-00c).
2. [Seguro] El botón de la guía Luci aparece, con movimiento, en las pantallas infantiles del portal. Durante esta aventura compite con la consigna (M03-3) y muestra el objetivo fuera de la escena. Propuse a la supervisora ocultarlo mientras dura la aventura.

**Preguntas técnicas.**

- **T1.** El vocabulario cerrado de dimensiones (CRIT-EST-001 §4) no tiene «semejanza de los distractores», «modalidad de presentación» ni «tipo de objetivo», que tu ficha usa. ¿Las sumamos al vocabulario o las mapeamos a las existentes?
- **T2.** E2 Intermedio («solo por su nombre», con señuelos de la misma categoría): resolví la ambigüedad con la gota de luz de Luci como detalle distintivo de sus cosas. ¿Lo validás?
- **T3.** En E4 (3–12), Luci no se ve hasta elegir el lugar correcto, para que haya que integrar las pistas. ¿Lo validás? ¿Y las pistas de inferencia del banco de prueba (por ejemplo, «Está donde se vende lo que se planta» → vivero)?
- **T4.** ¿Recomendamos tablet o pantalla completa en 3–5? En teléfonos chicos la escena entera se ve pequeña aunque haya zoom.
- **T5.** Los números de cada grado (12, 24 y 26 elementos en E1; 5 señuelos del color de Luci; 3 ítems por recorrido en 3–5 y 4 en las demás rutas) son propuesta mía. ¿Los validás o los fijás vos?
- **T6.** Textos para personas: todos los del banco son relleno a partir de tu ficha (consignas, devoluciones, pistas, «Hacer», preguntas de la Lámina para conversar). Necesito el banco cerrado definitivo.

---

*DEV-IA · Portal Especializado en Psicopedagogía Moderna · Bajo supervisión clínica de la Lic. Maricel Guadalupe Noseda, Mat. 101, Provincia del Neuquén. Este documento no es un registro de aprobación.*

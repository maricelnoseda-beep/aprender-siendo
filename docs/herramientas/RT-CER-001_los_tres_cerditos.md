# RT-CER-001 — «Los tres cerditos»: revisión técnica de la reelaboración por Estaciones

- **Versión:** 1.3 · **Fecha:** 2026-11-14 (v1.0: 2026-11-10; v1.1: decisiones de la supervisora, Parte D; v1.2: prototipo en entorno de prueba, Parte E; v1.3: respuesta a la FEC-014 v0.2 y prototipo actualizado, Parte F) · **Autor:** DEV-IA
- **Refiere a:** reelaboración del juego «Los tres cerditos» escrita por la supervisora (2026-11-10), que incluye además una propuesta de modelo institucional (ficha técnica, escala de apoyos 0–3, registro de desempeño y plantilla de 14 puntos); CRIT-EST-001 v1.0 y RT-EST-001 v1.0 (Estaciones); INSTRUCCIONES_DEV-IA_Beta2 v1.0 (REQ-CLI-T01 a T11, M03, M04, M05, M07, M10, M17, M18, A10 a A16); ADR-009 (estructura modular); identidad visual del portal (index de referencia y Manual de marca); RT-LUC-001 y RT-EXP-001 (motores ya construidos que se reutilizan). **FEC-014 v0.2 de PSP-SR (2026-11-12) y decisiones D5 a D7.**
- **Estado:** revisión técnica y **prototipo actualizado según la FEC-014 v0.2, en entorno de prueba con datos sintéticos**. Sin registro de aprobación: nada sale del entorno de prueba. **Sobre el número de versión:** la FEC pide «RT-CER-001 v1.2», pero la v1.2 ya existía (prototipo del 2026-11-12, Parte E); esta respuesta es la **v1.3** para no pisar un documento ya entregado. Las Partes A a E quedan como historia; lo vigente está en la **Parte F**.
- **Alcance:** si se puede construir, cómo, qué choca con reglas vigentes y qué falta. Qué Estación corresponde a cada actividad, qué habilidades trabaja, qué cambia en cada grado, los textos, la versión del cuento y los umbrales son contenido clínico: los valida PSP-SR y los aprueba la supervisora. Esta revisión no los valida.

---

## Parte A. Resumen para la supervisora (sin jerga)

**Mi conclusión: técnicamente sí se puede construir, y el diseño es muy bueno para el sistema.** [Seguro] Las cinco actividades entran en la estructura del portal que ya existe, y dos de ellas pueden reutilizar piezas que ya están hechas (la búsqueda en escenas de la aventura de Luci y el juego de memoria). La separación entre Estación, grado y apoyos es exactamente la que ya está preparada en la "ficha" de cada herramienta, así que no hay que inventar nada nuevo para eso.

**Lo que está bien resuelto, desde lo técnico:**

1. [Seguro] **Las cinco actividades cumplen tu regla de que la dificultad no sea solo "más cosas".** En cada una, de Fácil a Difícil cambian también las relaciones, los pasos o la planificación (detalle en B.3).
2. [Seguro] **La escala de apoyos 0 a 3 se puede programar igual en todos los juegos.** El sistema anota, en cada ejercicio, cuál fue el apoyo más alto que se usó. Eso sirve para que las ayudas se retiren de a poco y para que el profesional vea *cómo* resolvió la persona, no solo si acertó.
3. [Seguro] **El registro de desempeño que pedís se puede hacer sin datos reales y sin inteligencia artificial.** Todo se calcula con reglas fijas. En el entorno de prueba se usan solo datos inventados.
4. [Seguro] **Que la Actividad 3 evalúe por separado "asociar escena y frase" y "ordenar"** se resuelve guardando dos resultados distintos por ejercicio.

**Cuatro puntos que chocan con reglas que ya aprobaste y que tenés que decidir (con PSP-SR) antes de construir:**

1. **"Justificar" y "explicar oralmente o por escrito" (Actividades 3 y 5, grado Difícil).** Hoy la regla es que los chicos no escriben texto libre ni se graba su voz (protección de datos). Propongo dos caminos que respetan esa regla: elegir la justificación entre opciones con dibujos ("Va antes porque…"), o que la explicación se haga en voz alta con la persona adulta, fuera de la pantalla, sin que la app la guarde. Lo tienen que elegir PSP-SR y vos.
2. **El lobo y "¡Salvemos a los cerditos!" para 3 a 5 años.** La regla vigente dice que en esa edad no hay miedo, peligro ni amenaza. Hace falta decidir si el juego no se ofrece en esa edad, o si hay una versión del cuento sin amenaza (por ejemplo, el viento en lugar del lobo). También qué final del cuento se usa: las versiones tradicionales terminan con el lobo lastimado.
3. **Las imágenes que pegaste vienen de otros sitios (infonegocios, twinkl, maxmax, vyravid, entre otros).** [Seguro] No se pueden usar: tienen dueño. Todas las ilustraciones las hace el equipo de marca, originales y con la estética del portal. También hay que evitar parecerse a versiones famosas del cuento (por ejemplo, la de los dibujos animados de 1933). Para la prueba uso dibujos de relleno, como hice con Luci.
4. **"Ver un rato y después se tapa" (Memotest y rompecabezas).** Si se tapa solo con un reloj, una persona más lenta queda en desventaja, y eso va contra tu regla de que el tiempo no cuente como error. Propongo que se tape cuando la persona toca "Ya miré", o que el profesional fije el tiempo.

**Lo que falta para pasarlo a construcción:**

- [Seguro] **La FEC de PSP-SR.** Tu texto es el diseño pedagógico; para construirlo hace falta que PSP-SR lo convierta en ficha clínica: fuentes y nivel de evidencia, textos para el chico, la familia y el profesional, la versión del cuento, los números de cada grado y los casos de prueba.
- [Seguro] **Registrar el modelo institucional.** La escala de apoyos 0–3, el registro mínimo y la plantilla de 14 puntos son criterios nuevos que sirven para todos los juegos. Como CRIT-EST-001 v1.0 no se edita, propongo guardarlos como **CRIT-EST-001 v1.1** (o un criterio aparte), con tu texto tal cual.

**Cuánto lleva.** [Suposición] Unas 15 a 20 jornadas de trabajo técnico después de recibir la FEC, más las ilustraciones originales (estimo entre 120 y 180 horas de dibujo, unas 4 a 6 semanas con una persona a medio tiempo; el costo depende de su tarifa).

**Qué te pido:**

1. Que me digas dónde está el juego "original" de cinco actividades que mencionás: en el portal y en el repositorio no lo encuentro. Si existe en otro lado, me sirve verlo.
2. Que lleves el mensaje de la Parte C al proyecto de PSP-SR.
3. Si querés, mientras PSP-SR responde puedo armar un prototipo de prueba con contenido de relleno rotulado "no validado", como hice con Luci y Explorapalabras. No lo hago sin tu visto bueno.

---

## Parte B. Análisis técnico (para PSP-SR y responsable técnico)

### B.1 Viabilidad y patrón

[Seguro] Viable sin cambios de arquitectura. Es **una herramienta** de la estructura modular (ADR-009) con **cinco variantes**, una por actividad, que corre aislada en un marco (`iframe sandbox="allow-scripts"`) y devuelve al núcleo solo el resultado de cada ítem por `postMessage`, igual que Luci y Explorapalabras.

[Seguro] Patrón (DEV-IA §5): «Ejercitación adaptativa, ítems aprobados de antemano». Todo es determinista. **Ningún modelo de lenguaje** interviene en la experiencia, en la corrección ni en el registro (DEV-IA §4; REQ-CLI-T11). Esto incluye la Actividad 5: las situaciones, las alternativas y la clasificación de cada respuesta salen de un banco escrito por PSP-SR, nunca de generación en vivo ni de un modelo que "evalúe" una respuesta abierta.

| Actividad | Estación propuesta (decisión clínica) | Motor | Reutiliza |
| --- | --- | --- | --- |
| 1. Detectives del cuento | Explorar | Búsqueda en escena por capas, zonas de toque por datos | Motor de Luci (RT-LUC-001 B.2–B.3), con objetivos por consigna y relaciones espaciales |
| 2. Memotest: descubrimos las relaciones | Reconocer | Pares con tipos de tarjeta (imagen, palabra) y relación declarada | Motor de Memoria de pares, extendido |
| 3. Escena y frase: organizamos el cuento | Integrar | Nuevo: dos etapas, asociar (emparejar) y ordenar (secuencia) | Parte de «¿Qué sigue?» |
| 4. Construimos el cuento | Integrar | Nuevo: rompecabezas con encastre por posición | — |
| 5. ¡Salvemos a los cerditos! | Transferir | Nuevo: situaciones con alternativas, pasos para ordenar y revisión | — |

[Seguro] Que dos actividades estén en Integrar no es problema: el bloque `estaciones.variantes` admite varias variantes en la misma Estación (RT-EST-001, P2).

### B.2 Trazabilidad

Hoy no hay FEC, así que no hay REQ-CLI propios. La trazabilidad es al texto de la supervisora (TC-§n) y a las reglas vigentes.

| Punto del texto | Cómo se implementa | Regla vigente relacionada |
| --- | --- | --- |
| TC-§1.1 Estación por habilidades, no por posición | `estaciones.variantes[].estacion` + `habilidades` (vocabulario cerrado del núcleo); el orden de las actividades no implica secuencia obligatoria | CRIT-EST-001 §3; RT-EST-001 B.2 |
| TC-§1.2 Tres grados por actividad | `grados.facil/intermedio/dificil` con `parametros` y `cambia_respecto_al_anterior` | CRIT-EST-001 §4; M10 |
| TC-§1.3 Apoyos graduables y retirables | Escala común 0–3 en el núcleo (B.4) | M10-3, M10-5 |
| TC-§1.4 No solo cantidad | Validación en CI: se bloquea un paso de grado cuyo único cambio sea `cantidad-estimulos` (ya existe en Luci) | CRIT-EST-001 §4 |
| TC-§1.5 La respuesta correcta no es el único indicador | Registro por ítem (B.5) | M09, M17 |
| TC-§3.A Ficha técnica (10 campos) | `modulo.json`: los 7 campos de CRIT §5 + `proposito`, `indicadores`, `habilidades_secundarias` | M04-1 |
| TC-§6 Estación de referencia y habilidades secundarias | Campo nuevo `habilidades_secundarias` en cada variante, mismo vocabulario cerrado | RT-EST-001 P1 |
| TC-§4 Estación ≠ dificultad | Estación es atributo de la herramienta; el grado se ajusta dentro de la variante; nunca se guarda "Estación de la persona" | RT-EST-001 B.2.3 |

### B.3 Revisión actividad por actividad

#### Actividad 1 — Detectives del cuento

- [Seguro] Cumple §4: Fácil → Intermedio cambia cantidad, **semejanza de distractores** (color, forma, ubicación) y **cantidad de pasos** (consigna de dos pasos); Intermedio → Difícil cambia **complejidad de relaciones** (espaciales: "detrás de") y **grado de abstracción** (función: "podría usarse para construirla").
- [Seguro] Técnica: escena por capas como Luci. Cada objeto lleva en datos su rectángulo, su posición relativa a otros ("detrás de la casa de ladrillos") y sus atributos (material, función). La corrección es por zona, en código.
- [Probable] "Detrás de" en una escena 2D necesita un dibujo inequívoco (objeto parcialmente tapado). Lo debe revisar una persona distinta de quien dibujó, como en Luci.
- Necesita definición: los tres cerditos deben poder diferenciarse (si son idénticos, «Encontrá al cerdito» tiene tres respuestas). Diversidad de personajes, incluida la discapacidad (M03-4).

#### Actividad 2 — Memotest

- [Seguro] Cumple §4: cambia el **sistema de representación** (imagen-imagen → imagen-palabra → palabra-palabra) y la **complejidad de la relación** (idéntica → referencial → semántica o funcional). Propongo sumar `sistema-representacion` al vocabulario de dimensiones, o mapearlo a `grado-abstraccion` (pregunta T3).
- [Seguro] Técnica: cada pareja se declara en el banco con su tipo de relación (`identica`, `imagen-palabra`, `semantica`, `funcional`). En Difícil, una tarjeta puede tener **una sola** pareja válida en el tablero; si «lobo» se relaciona con «soplar» y también con «casa», el juego no puede decidir. CI valida que cada tarjeta tenga una pareja única.
- [Seguro] En Intermedio y Difícil hay lectura: toda palabra tiene audio (T09). Si la persona usa "leer en voz alta", la tarea deja de medir reconocimiento de la palabra escrita: se registra como apoyo (pregunta T5).
- Riesgo de accesibilidad: "todas las tarjetas visibles durante un tiempo inicial". Un tapado automático por reloj va contra M10-7 y WCAG 2.2 (criterio 2.2.1, tiempo ajustable). Propuesta: se tapan cuando la persona toca «Ya miré», o con un tiempo que fija el profesional.

#### Actividad 3 — Escena y frase

- [Seguro] Cumple §4: cambia la **complejidad de la consigna** (frase literal → frase con información adicional → frase con causa-consecuencia no literal), la **complejidad de las relaciones** (temporales y causales) y la **disponibilidad de apoyos** (inicio y final ubicados → sin referencia).
- [Seguro] Técnica: el ítem tiene dos etapas y **dos resultados separados** (`etapa_asociar`, `etapa_ordenar`). Si la asociación queda con errores, la etapa de ordenar arranca con las parejas correctas ya ubicadas (si no, se evaluaría ordenar sobre una base errónea). Esto es una decisión clínica (pregunta T6).
- [Seguro] Para M10 (ajuste por habilidad), cada etapa alimenta una habilidad distinta (por ejemplo `comprension-frase` y `organizacion-temporal`), así el ajuste no se mezcla.
- **Choque con regla vigente:** "Justificar el orden" y "explicar por qué un acontecimiento va antes" (Difícil). REQ-CLI-T01 y A13 prohíben texto libre, dictado que se guarde y grabación de voz. Ver B.6.
- [Seguro] Ordenar se resuelve con arrastre **y** con alternativa sin arrastre (tocar la escena y luego la posición, o numerar), por WCAG 2.2, criterio 2.5.7 (movimientos de arrastre).
- Observación de contenido para PSP-SR: en Fácil, el orden paja → madera → ladrillos depende de conocer el cuento, no de una relación temporal visible en la escena. Si la intención es evaluar organización temporal, las escenas necesitan una pista temporal propia.

#### Actividad 4 — Construimos el cuento

- [Seguro] Cumple §4: cambia la **semejanza** entre piezas, la **disponibilidad del modelo** (permanente → a demanda → ausente) y la **necesidad de planificación**.
- [Seguro] Técnica: las piezas se generan cortando una escena ya aprobada con una grilla o contornos fijos definidos en el banco (no al azar), para que cada ítem sea reproducible y revisable. Encastre por posición con tolerancia en código.
- [Seguro] "Coordinación visomotora" y arrastre: hay que ofrecer siempre la alternativa de tocar pieza y luego destino, y control por teclado (WCAG 2.5.7 y 2.1.1). Si la variante con alternativa sin arrastre deja de trabajar coordinación visomotora, esa habilidad no debería declararse como objetivo cuando se usa la alternativa (pregunta T7).
- "Imagen de referencia disponible pero no permanente": mismo criterio que el Memotest (botón «Ver el modelo», cuyo uso se registra como apoyo; nunca reloj automático).
- "Seleccionar una estrategia y corregirla": se puede registrar en código como **autocorrección** (pieza mal ubicada que la persona mueve sin pedir ayuda).

#### Actividad 5 — ¡Salvemos a los cerditos!

- [Seguro] Cumple §4: cambia **cantidad de condiciones**, **cantidad de pasos**, **necesidad de planificación** y **grado de abstracción** (situación familiar → nueva → con imprevisto).
- [Seguro] Técnica: es la más compleja. Cada situación es un pequeño árbol escrito de antemano: alternativas, pasos para ordenar y, en Difícil, un imprevisto ("empieza a llover") que vuelve a abrir la decisión. Cada alternativa lleva en el banco una clasificación hecha por PSP-SR (`adecuada`, `parcial`, `no-adecuada`) y la consecuencia que se muestra. **Se corrige con esa tabla, nunca con un modelo de lenguaje.**
- [Seguro] Como hay más de una solución válida, "correcto/incorrecto" no alcanza: el registro guarda la categoría elegida y si la persona la revisó después de ver la consecuencia (autocorrección).
- **Choques con reglas vigentes:**
  - "Explicación oral o escrita": mismo problema que en la Actividad 3 (B.6).
  - "Salvemos", lobo, peligro: REQ-CLI-M03-4 prohíbe miedo, peligro y amenaza en la ruta de 3 a 5 años (B.6).
  - "Mostrar consecuencias claras de cada elección": las consecuencias no pueden mostrar daño a un personaje en 3–5, y en ninguna ruta pueden funcionar como castigo (M18-2: ante un error, tono neutro).
  - Transferir: la ficha debe llevar la declaración de transferencia (6.1.1, RT-EST-001 P5) para que no se lea como promesa de que la persona aplicará esto fuera de la app.

### B.4 Escala de apoyos 0–3 (común a todos los juegos)

[Seguro] Encaja con la "escalera de ayudas" que ya tienen Luci y Explorapalabras. Propuesta de implementación en el núcleo:

- Cada apoyo de cada actividad se declara en el banco con su **nivel** (0 a 3). Ejemplo en Actividad 1: repetir la consigna = 1; resaltar la zona = 2; señalar el objeto y tocarlo juntos = 3.
- Por ítem se registra el **nivel máximo usado** y la **lista de apoyos** usados. El nivel lo calcula el código, no se "observa" a ojo.
- El nivel 3 ("resolución compartida") dentro de la app es una **demostración** (la app hace un paso). Si incluye a una persona adulta, la app no puede saberlo: se registra como "demostración", no como "resuelto con un adulto".
- **Retiro progresivo:** la regla tiene que estar en código y sus números son clínicos. Propuesta para que PSP-SR corrija: el ítem siguiente arranca con el apoyo un nivel por debajo del último usado; las ayudas se ofrecen, no se imponen (la persona puede pedirlas). Pregunta T2.
- Relación con M10-3 ("70 % o más sin usar ayuda" para subir de grado): hay que definir si "sin ayuda" significa nivel 0, o nivel 0–1 (pregunta T2).

### B.5 Registro de desempeño

Campos por ítem (todos calculados en código, sin modelo de lenguaje):

| Campo del texto | Campo técnico | Cómo se obtiene |
| --- | --- | --- |
| Actividad y Estación | `herramienta`, `variante`, `estacion` | De la ficha |
| Grado | `grado` | Del motor (M10 o fijado por el profesional, M10-9) |
| Correctas e incorrectas | `resultado` (`correcto`/`incorrecto`, o `adecuada`/`parcial`/`no-adecuada` en Act. 5); en Act. 3, uno por etapa | Comparación con el banco |
| Intentos | `intentos` | Contador |
| Tipo y nivel de apoyo | `apoyos[]`, `apoyo_max` (0–3) | Escala B.4 |
| Tiempo, cuando sea pertinente | `tiempo_ms` | Se registra para el profesional; **nunca cuenta como error ni baja el grado** (M10-7) |
| Autocorrección | `autocorreccion` (sí/no) | Error seguido de corrección propia en el mismo ítem, **sin** apoyo entre medio |
| Autonomía | `autonomia` derivada de `apoyo_max`: 0 autónomo · 1 con pista · 2 con ayuda específica · 3 con demostración | Por ítem, nunca como rótulo de la persona |

Reglas de datos (PSP-SR 9.4, DEV-IA §9, M05, M17, A10):

- [Seguro] **Entorno de prueba: solo datos sintéticos.** Las pruebas automáticas generan sesiones inventadas. Nunca datos reales fuera de producción.
- [Seguro] **Minimización:** no se guarda nombre, voz, texto, imagen ni producción de la persona; solo los campos de la tabla, vinculados al identificador interno (identidad separada de datos clínicos).
- [Seguro] **Quién ve qué:** el chico no ve nada de esto (M05-2: sin números, niveles ni colores de rendimiento). La familia en modo libre no ve grados ni apoyos; la familia de un adolescente ve solo tiempo y aventuras (A10). El profesional vinculado ve todo.
- [Seguro] **No es evaluación:** sin baremos, percentiles ni comparación con la edad (M17-3). La "autonomía" es descriptiva por ítem, no una categoría de la persona.
- [Probable] "Tiempo de resolución" es un dato sensible para algunas personas (por ejemplo, lentitud lectora): propongo que se muestre solo al profesional y como mediana por grado, no ítem por ítem a la familia.

### B.6 Choques con reglas vigentes (requieren decisión clínica)

| Punto | Regla | Opciones técnicas | Decide |
| --- | --- | --- | --- |
| Justificar / explicar oral o escrito (Act. 3 y 5, Difícil) | T01, A13: sin texto libre, sin dictado guardado, sin grabación | (a) justificación entre 2–4 opciones con pictogramas, corregida por tabla; (b) explicación oral con la persona adulta fuera de pantalla («Hacer»/«Contar», M06–M07), sin registro; (c) ambas | PSP-SR y supervisora |
| Lobo, amenaza, "salvar" | M03-4: en 3–5 sin miedo, peligro ni amenaza | (a) herramienta no disponible en la ruta 3–5; (b) versión 3–5 sin amenaza (viento, lluvia); (c) solo con profesional | PSP-SR y supervisora |
| Final del cuento | M03-4, A14 | Elegir una versión sin daño al personaje | PSP-SR |
| Tapado automático (Act. 2 y 4) | M10-7; WCAG 2.2.1 | «Ya miré» o tiempo fijado por el profesional | PSP-SR (técnicamente recomiendo «Ya miré») |
| Consecuencias visibles (Act. 5) | M18-2 | Consecuencia informativa, sin daño ni tono de castigo | PSP-SR |

Mientras no se decida, rige la opción más restrictiva (DEV-IA §2): no hay respuesta abierta y la herramienta no se ofrece en la ruta de 3 a 5 años.

### B.7 Ilustraciones y originalidad

- [Seguro] Las imágenes que acompañan el texto (infonegocios.com.py, nationaleducation.s3.amazonaws.com, twinkl.jp, maxmax.sk, vyravid.com) **no se usan** ni se descargan: son de terceros y no tenemos licencia.
- [Probable] El cuento es tradicional y de dominio público como relato (versiones escritas del siglo XIX). Lo que sí tiene dueño son las versiones ilustradas o animadas posteriores: los personajes no deben parecerse a ninguna (por ejemplo, la animación de 1933 y sus derivados). Se aplica el mismo control que en Luci: revisión humana de parecido, por una persona distinta de quien dibujó, registrada en el banco.
- [Seguro] Estética del portal (vinculante): paleta de marca, contorno tinta #102F54, Nunito, paneles de 22 px, objetivos ≥ 44 px, sin animación durante la actividad (M03-3). Los cerditos y el lobo pueden integrarse al catálogo de animales del núcleo (Granja), si la supervisora lo prefiere.
- [Suposición] Producción por capas: unos 10 a 12 fondos (escenas del cuento) y 40 a 50 objetos y personajes, que sirven a la vez para las Actividades 1, 3 y 4. Si se usa IA generativa de imágenes, se declara en el banco y en los créditos y pasa por revisión humana.

### B.8 Ficha y modelo institucional

- [Seguro] La ficha técnica del texto (10 campos) entra en `modulo.json`: los 7 de CRIT-EST-001 §5 más `proposito`, `indicadores` y `habilidades_secundarias`. La plantilla de 14 puntos (TC-§5) se puede validar en CI igual que la ficha de aventura (M04-1): sin los 14 puntos, una herramienta nueva no se publica.
- [Seguro] Faltan para M04-1, y los aporta PSP-SR: nivel de evidencia y fuentes (DOI, PMID o URL), texto para el profesional, texto para la familia, ruta(s) de edad, declaración de transferencia.
- [Seguro] El modelo (apoyos 0–3, registro mínimo, plantilla de 14 puntos, Estación de referencia + habilidades secundarias) se registra como criterio institucional versionado, sin editar CRIT-EST-001 v1.0.

### B.9 Riesgos

| Riesgo | Control |
| --- | --- |
| La "autonomía" o el nivel de apoyo se lee como etiqueta de la persona | Por ítem, descriptivo, solo para el profesional; textos con "referencia orientativa, no diagnóstica" (texto de PSP-SR) |
| Respuestas abiertas en Transferir corregidas por un modelo | Prohibido: tabla de clasificación en el banco |
| Una tarjeta o escena con más de una respuesta válida | Validación en CI del banco (pareja única, zona única, orden único o declarado) |
| Contenido amenazante en 3–5 | Bloqueo por ruta en código hasta decisión clínica |
| Imágenes de terceros o con parecido a obras protegidas | Solo ilustraciones originales con revisión registrada; CI bloquea láminas sin revisión |
| Tiempo usado como error | M10-7 en código; prueba automática que lo verifica |

### B.10 Costo y plazo

[Suposición] Después de recibir la FEC:

| Parte | Jornadas DEV-IA |
| --- | --- |
| Escala de apoyos 0–3 y registro en el núcleo (sirve para todos los juegos) | 2–3 |
| Act. 1 sobre motor de Luci | 1–2 |
| Act. 2 sobre motor de Memoria | 2 |
| Act. 3 (dos etapas) | 3–4 |
| Act. 4 (rompecabezas accesible) | 3–4 |
| Act. 5 (situaciones con árbol y revisión) | 4–5 |
| Pruebas, accesibilidad y paquete de revisión | 2 |
| **Total** | **≈ 15–20** |

Ilustraciones: 120 a 180 horas de dibujo y revisión. Sin costo de infraestructura.

### B.11 Orden propuesto

1. La supervisora lleva la Parte C a PSP-SR.
2. PSP-SR emite la FEC (11 campos) y responde T1–T9; supervisora y PSP-SR deciden los choques de B.6.
3. Se registra el modelo institucional como criterio versionado.
4. DEV-IA construye en la rama de la estructura modular, con contenido de la FEC y pruebas; las ilustraciones entran por el circuito de revisión.
5. Paquete de revisión y doble aprobación.

(Opcional, solo con visto bueno de la supervisora: prototipo con contenido de relleno rotulado "no validado" mientras se espera la FEC.)

---

## Parte C. Mensaje tipificado para PSP-SR (v1.2, histórico: el vigente está en F.9)

(Para copiar y llevar al Proyecto de PSP-SR. Adjuntar este archivo y el texto de la supervisora.)

```
TIPO: Revisión técnica
DE: DEV-IA
PARA: PSP-SR
ID: RT-CER-001 v1.2
FECHA: 2026-11-12
REFIERE A: Reelaboración de «Los tres cerditos» por Estaciones (supervisora, 2026-11-10); CRIT-EST-001 v1.0; RT-EST-001 v1.0
```

PSP-SR: la supervisora reelaboró el juego «Los tres cerditos» en cinco actividades (Explorar, Reconocer, Integrar ×2, Transferir), cada una con tres grados, y propuso un modelo común para todas las herramientas: escala de apoyos 0–3, registro de desempeño mínimo y plantilla de 14 puntos. Te adjunto su texto y mi revisión.

**Viabilidad:** [Seguro] viable con la arquitectura actual. Una herramienta modular con cinco variantes, determinista, sin modelo de lenguaje en la experiencia, la corrección ni el registro. Act. 1 y 2 reutilizan los motores de Luci y Memoria.

**Hallazgos:**
1. [Seguro] Las cinco actividades cumplen CRIT-EST-001 §4: ningún paso de grado cambia solo la cantidad.
2. [Seguro] Choques con reglas vigentes (detalle B.6): justificar/explicar de forma oral o escrita (T01, A13); lobo y "salvar" en la ruta 3–5 (M03-4); tapado por tiempo (M10-7, WCAG 2.2.1); consecuencias visibles en Act. 5 (M18-2). Hasta que decidas, rige lo más restrictivo.
3. [Seguro] Las imágenes de referencia son de terceros: no se usan. Ilustraciones originales con revisión de parecido.
4. [Seguro] Para construir falta la FEC: evidencia y fuentes, textos para chico, familia y profesional, versión del cuento, parámetros por grado y casos de prueba.

**Preguntas concretas:**
- **T1.** ¿Validás la asignación de Estación de las cinco actividades y las habilidades (de referencia y secundarias) de cada una, dentro del vocabulario cerrado de RT-EST-001 P1?
- **T2.** Escala de apoyos 0–3: ¿qué apoyos de cada actividad van en cada nivel? ¿Cuál es la regla de retiro (propuesta: el ítem siguiente arranca un nivel por debajo del último usado)? Para M10-3, ¿"sin ayuda" es nivel 0, o 0–1?
- **T3.** ¿Sumamos `sistema-representacion` (imagen-imagen, imagen-palabra, palabra-palabra) al vocabulario de dimensiones de CRIT-EST-001 §4, o lo tratamos como `grado-abstraccion`?
- **T4.** Justificación en Act. 3 y 5 (Difícil): ¿opciones cerradas con pictogramas, explicación con el adulto fuera de pantalla sin registro, o ambas? Si son opciones cerradas, ¿quién escribe las opciones y su clasificación?
- **T5.** Lectura en voz alta en Act. 2 y 3: ¿se registra como apoyo (cambia lo que se mide) o es la presentación por defecto según la ruta de edad?
- **T6.** Act. 3: si la asociación escena-frase queda con errores, ¿la etapa de ordenar arranca con las parejas correctas ya ubicadas?
- **T7.** Act. 4: cuando se usa la alternativa sin arrastre (tocar pieza y destino), ¿se sigue declarando "coordinación visomotora" como habilidad trabajada?
- **T8.** Ruta 3–5: ¿la herramienta no se ofrece, se ofrece una versión sin amenaza, o solo con profesional? ¿Qué versión del cuento y qué final se usan en cada ruta?
- **T9.** Registro: ¿el tiempo de resolución se muestra al profesional ítem por ítem o como mediana por grado? ¿Alguno de los campos del registro mínimo no debe verlo la familia vinculada?

**Riesgo:** clínico-técnico bajo si se respetan B.5 y B.6; alto si se habilitan respuestas abiertas corregidas por un modelo o contenido amenazante en 3–5.
**Costo y plazo:** [Suposición] 15–20 jornadas DEV-IA después de la FEC; ilustraciones 120–180 h; sin costo de infraestructura.
**Decisiones de la supervisora (2026-11-11), que debés reflejar en la FEC:** justificación por opciones con dibujos (T4 resuelta: queda por definir quién escribe las opciones y su clasificación); el lobo sopla las casas sin que haya peligro para los cerditos, y el final es que el lobo se quema y sale corriendo (T8, versión del cuento); ilustraciones originales; tapado con «Ya miré». Te pido que confirmes cómo se presenta ese final en la ruta de 3 a 5 años para que sea compatible con REQ-CLI-M03-4, o que registres la excepción con la supervisora.
**Estado:** con autorización de la supervisora hay un prototipo en el entorno de prueba con contenido de relleno rotulado «no validado» (Parte E). Tu FEC y tus respuestas reemplazan el banco y los parámetros sin tocar el motor. Nada se publica sin tu validación y las dos aprobaciones.

---

## Parte D. Decisiones de la supervisora (2026-11-11)

Registradas tal como las dio la supervisora en el hilo del proyecto DEV-IA. Son decisiones de diseño, no el registro de aprobación de una versión (Contexto §4).

| # | Punto (B.6) | Decisión | Efecto técnico |
| --- | --- | --- | --- |
| D1 | Justificar / explicar (Act. 3 y 5, Difícil) | **Elegir entre opciones con dibujos.** | Opción (a) de B.6. Sin texto libre ni voz (T01, A13 se mantienen). Cada opción lleva en el banco su clasificación, escrita por PSP-SR; se corrige por tabla. |
| D2 | Lobo y final del cuento | **El lobo sopla las casas sin idea de peligro para los cerditos. Final: el lobo se quema y sale corriendo.** | Las escenas no muestran a los cerditos en riesgo. Queda para PSP-SR cómo se dibuja y narra el final en la ruta 3–5 (M03-4: sin miedo, peligro ni amenaza) [Probable: "se quema" puede requerir un tratamiento suave en esa ruta, por ejemplo sin mostrar la quemadura]. Hasta su respuesta, en 3–5 rige lo más restrictivo. |
| D3 | Imágenes | **Ilustraciones originales del portal.** | B.7 sin cambios. |
| D4 | Tapado de tarjetas y modelo | **«Ya miré».** | Se tapa al tocar «Ya miré»; ver el modelo de nuevo es un apoyo que se registra. Sin reloj. |

Siguen abiertas para PSP-SR: T1, T2, T3, T5, T6, T7, T9, la parte de T4 sobre quién escribe las opciones, y la parte de T8 sobre rutas de edad.

---

## Parte E. Prototipo en el entorno de prueba (2026-11-12)

Autorizado por la supervisora el 2026-11-12 («si, armalo»). **Contenido de prueba no validado**: consignas, frases, parejas, situaciones, clasificación de respuestas, pistas, devoluciones y números de cada grado los escribió DEV-IA para poder probar el funcionamiento, y los reemplaza PSP-SR. Solo datos sintéticos.

**Dónde está.**
- Archivo para probar con doble clic: carpeta compartida `descargas/AprenderSiendo_Los_tres_cerditos_prueba.html` (copia con versión y fecha en `descargas/Históricos/`).
- Código: `app/herramientas/cerditos/` (`cerditos.html` aislado en marco, `banco.json` de prueba, `modulo.json` con la ficha TC-§3.A por actividad y grado), `tests/cerditos.test.js`, `tests/cerditos.e2e.js`. `python3 app/build.py --cerditos` arma el archivo suelto. También aparece en el portal como aventura, dentro de un marco aislado.

**Qué tiene.** [Seguro]
- Las cinco actividades con sus tres grados, según la reelaboración: Detectives (búsqueda en escena, un paso, dos pasos en orden, relación espacial + función), Memotest (imagen-imagen, imagen-palabra con palabras parecidas, palabra-palabra semántica), Escena y frase (asociar y ordenar como dos etapas registradas por separado; referencia de inicio y final en Fácil; en Difícil se arma todo, se revisa al final y se justifica con opciones con dibujos, D1), Rompecabezas (4 piezas con lugar marcado y modelo visible; 6 con modelo a demanda; 12 parecidas con revisión al final) y ¡Salvemos a los cerditos! (dos alternativas con consecuencia; 3–4 alternativas con justificación por dibujos, D1; plan de materiales, tareas, imprevisto y revisión).
- Escala de apoyos 0–3 común: botón «Pedir ayuda» que sube de a un nivel; se ofrece (resaltado) después de dos errores, nunca se impone. Apoyo inicial elegible por la persona adulta y retiro progresivo (propuesta T2: si el ejercicio sale sin errores, el siguiente empieza un nivel más abajo).
- Registro mínimo por ejercicio, calculado en código: actividad, Estación, grado, ejercicio, resultado (o clase adecuada/parcial/no adecuada), etapas, intentos, errores, apoyos y apoyo máximo, lectura en voz alta (aparte, T5), autocorrección, autonomía derivada del apoyo máximo y tiempo (que no cuenta como error). La persona adulta lo ve en «Registro»; no se guarda ni sale del dispositivo. Dentro del portal, la herramienta envía solo esos campos, acotados.
- M10 dentro de cada actividad (el profesional puede fijar el grado); nunca cambia de actividad ni de Estación sola.
- D2: escenas sin cerditos en riesgo; final con el lobo que se quema y sale corriendo. **Rutas 3–5 y 13–18 no disponibles** hasta la respuesta de PSP-SR. D3: ilustraciones de relleno hechas con formas simples en código, sin imágenes de terceros. D4: «Ya miré», sin reloj.
- Quien juega no ve Estación, grado, números ni elogios. Todo se toca (sin arrastre) y funciona con teclado; textos con audio.

**Cómo se probó.** [Seguro] 345 comprobaciones sin navegador (ficha, banco, regla de §4, registro, M10, retiro de apoyos, detección de parejas ambiguas, de textos con elogios o amenaza) y una prueba de punta a punta que juega las 15 combinaciones, la escalera de ayudas, el retiro, la autocorrección, «Ya miré» sin reloj, el registro y la vista en celular de 375 px. La batería completa del portal sigue pasando.

**Limitaciones del prototipo.** [Seguro] No tiene «Hacer» ni «Contar» (M06–M07): falta que PSP-SR los defina para este juego. Los dibujos son de relleno. El criterio de acierto para M10 por actividad es propuesta de DEV-IA (`modulo.json`, `criterio_acierto`) y lo valida PSP-SR.

---

## Parte F. Respuesta a la FEC-014 v0.2 y prototipo actualizado (2026-11-14)

La supervisora pasó la FEC-014 v0.2 de PSP-SR («adjunto para que puedas construir el juego», 2026-11-14). Construí el prototipo actualizado según la ficha, **solo en el entorno de prueba y con datos sintéticos**. Esta parte reemplaza a la E como descripción vigente.

### F.1 Resumen para la supervisora (sin jerga)

- [Seguro] **El juego ya sigue la ficha de PSP-SR.** Tiene el cuento narrado antes de cada actividad (con el final suave para 3 a 5 años que aprobaste, D5), las cinco actividades con «¡Ayudemos a los cerditos!» como título (D6), y no se ofrece en 13 a 18 años (D7).
- [Seguro] **La ruta de 3 a 5 años ya está abierta**, como pide la ficha: Detectives y Memotest en sus tres grados (sin palabras escritas), Escena y frase solo en Fácil y con frases en audio, el rompecabezas en Fácil e Intermedio, y sin la Actividad 5.
- [Seguro] **Las ayudas se retiran de a poco:** si un ejercicio necesitó mucha ayuda, el siguiente ya arranca con un poco menos, hasta no necesitar ninguna. La persona siempre puede pedir más.
- [Seguro] **El profesional ve el tiempo como mediana por actividad y grado**, sin colores y con la leyenda de la ficha; la familia no ve grados, aciertos ni apoyos.
- [Seguro] **Todo se probó con datos inventados:** 663 comprobaciones automáticas del motor y del banco, y una prueba en navegador que juega las 39 combinaciones de ruta, actividad y grado publicadas, más los casos de la ficha.
- [Probable] **Hay cuatro puntos chicos que PSP-SR tiene que aclarar** (F.8). Ninguno frena el entorno de prueba.

### F.2 Qué cambió en el prototipo (v0.1.0 → v0.2.0-prueba)

| Tema | Antes (v0.1.0, Parte E) | Ahora (v0.2.0, FEC-014) |
| --- | --- | --- |
| Cuento | No había | Narración lámina por lámina antes del primer ítem de cada actividad y a pedido; versión 6–12 y versión 3–5 (D5) |
| Rutas | 6–8 y 9–12 | 3–5, 6–8 y 9–12 con catálogo por ruta (5.6); 13–18 excluida (D7) |
| Act. 5 | «¡Salvemos…!», dos tipos de ítem | «¡Ayudemos a los cerditos!» (D6): Fácil con 1 condición, 3 alternativas y 2 pasos; Intermedio con situaciones nuevas, 2 condiciones y 3–4 pasos; Difícil con plan previo, imprevisto y justificación |
| Parámetros | Propuesta de DEV-IA | Los de 5.3 (rangos de elementos, parejas, escenas, palabras y piezas por ruta) |
| Apoyos | Retiro si no hubo errores | Retiro de 5.4: un nivel menos que el máximo del ítem anterior; desde 1, arranca en 0 con el botón destacado |
| Lectura en voz alta | Campo `lectura` aparte | `audio_objetivo` e imputación a la habilidad oral (5.7) |
| Registro | 14 campos | 17 campos de la sección 8, con `habilidad`, `apoyo_inicial`, `modalidad` y `audio_objetivo` |
| Rompecabezas | Solo tocar y ubicar | Tocar y ubicar **o** arrastrar (misma habilidad, la modalidad es contexto); tolerancia amplia en 3–5; plan previo en Difícil |
| Act. 3 | Sin pista temporal | Pista temporal visible en Fácil (sol de mañana, mediodía y tarde, luna a la noche); distractor en Intermedio; si la asociación tiene errores, «Así van juntas. Ahora las ordenamos.» |
| Cierre | Sin Contar | Idea fuera de la pantalla (5.5), Contar con opciones cerradas, cierre suave por tiempo de la ruta |
| Láminas | Sin registro | Registro de autoría y revisión de parecido por lámina y figura (REQ-CLI-CER-00) |

### F.3 Trazabilidad a REQ-CLI-CER-00 a 16

Archivos: `app/herramientas/cerditos/` (`cerditos.html`, `banco.json`, `modulo.json`, `herramienta.js`), `app/areas/profesional/profesional.js`, `tests/cerditos.test.js` (unitaria), `tests/cerditos.e2e.js` (navegador, archivo suelto), `tests/e2e.js` (portal).

| Requisito | Cómo se cumple | Prueba |
| --- | --- | --- |
| **00a** Ilustraciones originales | Relleno con formas simples en código; ninguna imagen ni recurso externo. `banco.laminas` registra autor, origen propio, sin terceros, sin IA generativa y revisión de parecido (pendiente) por cada escena y figura | Unitaria: cada escena y figura dibujada está en el registro; sin `<img>` ni URLs |
| **00b** Sin comparación comercial | El validador busca «al estilo de», «como en la película» y marcas | Unitaria: banco, ficha y código; detecta un texto plantado |
| **00c** IA generativa con revisión | No se usa IA generativa; el campo queda en el registro para las láminas definitivas | Unitaria: `ia_generativa` y `revision_parecido` presentes |
| **01** Dimensión distinta de la cantidad | Cada paso de grado declara al menos una dimensión distinta de `cantidad-estimulos` | Unitaria, por actividad y grado |
| **02** Una sola respuesta | Detectives: una sola zona correcta por paso, calculada por apariencia, relación espacial (detrás, arriba, abajo, al lado) o función. Memotest: cada tarjeta con una sola pareja. Escena y frase: frases distintas, una sola justificación adecuada. Act. 5: cada alternativa con clase y consecuencia | Unitaria: banco válido y 5 bancos rotos detectados (dos zonas, dos baldes detrás, dos parejas, frases repetidas, situación sin adecuada) |
| **03** Cuento antes del primer ítem | La primera vez en cada actividad se narra el cuento; en el portal se recuerda por actividad; botón «Escuchar el cuento otra vez» | Navegador: cuento antes de jugar en las 39 combinaciones, no se repite en el ítem siguiente, a pedido desde el cierre; portal |
| **04** 3–5 sin amenaza; 13–18 excluida | Final 3–5 de D5 con lámina sin casa, chimenea, olla ni cola; Act. 5 sin publicar en 3–5 (catálogo y validador); 13–18 sin ruta y fuera del catálogo del portal (3 a 12 años) | Unitaria: cuento 3–5 sin olla, cola, fuego ni lesión; láminas sin cerditos cuando sopla; catálogo 3–5 y 13–18. Navegador: casos 1, 2 y 2b |
| **05** «Ya miré» sin reloj | Memotest y rompecabezas Intermedio: se tapa solo con «Ya miré»; verlo de nuevo se registra como apoyo 1 | Navegador: caso 3 (2 s sin tocar, siguen visibles) y «Ver el modelo» registrado |
| **06** Asociar con errores | Se muestran las parejas correctas con la frase neutra y ordenar arranca con ellas; `etapas.asociar` y `etapas.ordenar` con resultado y habilidad propios | Navegador: caso 4 |
| **07** Justificación por dibujos | 3 opciones con dibujo, corregidas por tabla (`ok` en Act. 3; `clase` por elección en Act. 5); sin texto libre, dictado ni audio | Unitaria y navegador: caso 11 |
| **08** Sin ayuda = `apoyo_max` 0 | `Motor.sinAyuda`; los apoyos de acceso se registran como `0:repetir`, `0:por-que-van-juntas` y nunca suben el nivel | Unitaria: caso 8 (90 % con «Ver el modelo» no sube) |
| **09** Retiro progresivo | `Motor.siguienteApoyo`: 3 → 2 → 1 → 0; desde 1, arranca en 0 con el botón destacado; el nivel de entrada se aplica y entra en `apoyo_max` | Unitaria y navegador: caso 7 |
| **10** Arrastre o tocar, mismas habilidades | Habilidad de la variante, sin coordinación visomotora; `modalidad` (tocar, tocar-y-ubicar, arrastre, mixta) como contexto | Navegador: caso 9 |
| **11** Consecuencias sin daño | Consecuencias del banco sobre la construcción; el validador rechaza daño a un personaje; las opciones quedan habilitadas para volver a elegir | Unitaria y navegador: caso 10 |
| **12** Audio objetivo | Escuchar la palabra o la frase objetivo marca `audio_objetivo`, no cambia `apoyo_max` e imputa el ítem a la habilidad oral | Unitaria y navegador: caso 6 |
| **13** Vista de la familia | La familia ve fecha, aventura y si la completó; nunca grados, aciertos, apoyos, autonomía ni tiempo de resolución | Revisión del código de `familia.js` (sin cambios) |
| **14** Mediana del tiempo | Archivo suelto y portal: mediana por actividad y grado, sin colores, con las dos leyendas; detalle por ítem solo a pedido | Navegador (archivo suelto y portal) |
| **15** Palabras prohibidas | El validador rechaza «misión», «salvemos», «vago», «tonto», «nivel», elogios y categorías diagnósticas en todo texto para quien juega; la prueba en navegador revisa cada pantalla | Unitaria y navegador |
| **16** Ficha completa | Por variante: Estación, habilidad de referencia, secundarias, estrategia, transferencia (A en Act. 3 con la aclaración; B en las demás), idea fuera de la pantalla, limitaciones, apoyos y grados; en la Act. 5, el texto de Transferir | Unitaria |

Casos de la sección 10: 1 a 12 y 14 a 16 tienen prueba automática; el 13 se cubre por revisión del código de la vista de la familia; el 17 (señal de riesgo) es del protocolo 9.2 del portal y no pasa por la herramienta.

### F.4 Escala 0–3 y retiro progresivo en el núcleo

[Seguro] Hoy vive como funciones puras en el bloque `Motor` de la herramienta, sin estado ni modelo de lenguaje:

- `siguienteApoyo(apoyoMax)` → nivel de entrada del ítem siguiente (y si el botón va destacado).
- `sinAyuda(registro)` → `apoyo_max === 0` (M10-3).
- `registro(...)` → normaliza los 17 campos; `autonomia` se deriva de `apoyo_max`; el apoyo de entrada nunca supera el máximo.
- `ajusteM10(historial, grado, { grados })` → M10 dentro de los grados que la ruta publica; `combinarAjustes` para las dos etapas de la Act. 3.
- `habilidadDe(...)` → habilidad a la que se imputa el ítem (lectura u oral).

Cada actividad aporta solo su escalera (qué hace cada nivel). La interfaz común aplica el nivel de entrada llamando a la misma escalera con la marca `inicial:`, así queda registrado como apoyo y no como pedido.

**Cuando se apruebe CRIT-003** [Probable]: esas funciones pasan a `app/nucleo/apoyos.js` y cada herramienta las importa. Es mover código sin cambiar reglas (2 a 3 jornadas, con pruebas compartidas).

### F.5 Validación en CI

`node tests/cerditos.test.js` corre en CI antes de armar el archivo y bloquea si falla. `Motor.validarBanco` comprueba:

- **Una sola respuesta:** zonas correctas de Detectives (con el relleno determinista incluido), parejas únicas del Memotest, frases distintas, una sola justificación adecuada y clases de la Act. 5.
- **Ausencia de la Act. 5 en 3–5:** en el catálogo de la ruta (`modulo.rutas["3-5"]`) y en cada ítem (`rutas`). También que la Act. 3 esté solo en Fácil y el rompecabezas sin Difícil en 3–5, y que no exista la ruta 13–18.
- **Parámetros de 5.3:** cantidad de elementos, pasos, parejas, tipo de pareja por ruta, sílabas, palabras por frase, pista temporal en orden, piezas por ruta, condiciones, alternativas, pasos y planes.
- **Cuento y láminas:** que existan; que en 3–5 no haya láminas solo de 6–12, ni olla, cola, fuego o lesión en los textos.
- **Textos:** palabras prohibidas para quien juega (REQ-15) y comparaciones comerciales (REQ-00b).

La prueba también confirma que el validador detecta bancos rotos a propósito.

### F.6 Costo y plazo (B.10 actualizado)

[Suposición] Con la FEC cambia el alcance: cuento narrado con dos finales, ruta 3–5, arrastre accesible con tolerancia, Contar y vista de medianas.

| Parte | Jornadas DEV-IA |
| --- | --- |
| Total estimado del juego con la FEC-014 (antes 15–20) | **18–24** |
| Ya hecho en el prototipo v0.2.0 | ≈ 14–16 |
| Pasar la escala y el registro al núcleo (CRIT-003) | 2–3 |
| Retiro progresivo en Luci y Explorapalabras (P6) | 2–3 |
| Narración grabada, láminas definitivas y paquete de revisión | 2–3 |

- **Ilustración:** 140–200 h (antes 120–180): 11 láminas del cuento (dos finales), unas 40 figuras y siluetas, con revisión de parecido por una persona distinta de quien dibuja.
- **Voz:** [Suposición] grabación con voz humana del cuento (dos versiones, 2 a 3 min cada una), consignas y frases: 6 a 10 h de estudio y edición. Mientras tanto, voz del sistema.
- **Infraestructura:** sin costo.

### F.7 Respuesta a P6: retiro progresivo en Luci y Explorapalabras

- **Luci: viable.** [Seguro] Ya arranca un ítem con apoyo de entrada (`S.item.ayuda`, hoy 2 después de 3 errores, M10-5). Hay que fijarlo con `siguienteApoyo(apoyo_max del ítem anterior)` y registrarlo como `inicial:`. Alrededor de 1 jornada.
- **Explorapalabras: viable después de una decisión clínica.** [Probable] Tiene dos pistas (primera letra) y apoyos de acceso por variante, pero no una escalera 0–3. PSP-SR tiene que decir a qué nivel corresponde cada pista (por ejemplo, 1 = recordar la estrategia; 2 = primera letra; 3 = mostrar la palabra). Con eso, 1–2 jornadas.

### F.8 Diferencias con la FEC y preguntas para PSP-SR

1. **Texto del cuento.** [Seguro] Dice «Los dos cerditos ya estaban de visita en la casa de ladrillos» justo antes de que el lobo sople esa casa. El criterio de 5.1 pide que ningún cerdito esté adentro cuando sopla. Las láminas no muestran cerditos. ¿Cambiás el texto (por ejemplo, «estaban de paseo en la plaza»)? Hasta tu respuesta, uso el texto tal cual.
2. **5.4 contra 5.7.** [Seguro] 5.4 pone «volver a escuchar la frase objetivo» como nivel 1 de la Act. 3; 5.7 y REQ-CLI-CER-12 dicen que no cambia `apoyo_max`. Apliqué REQ-12: es nivel 0 y se imputa a la habilidad oral. ¿Confirmás?
3. **Imputación oral en 6–8.** [Probable] 5.7 la define para 9–12, pero 6–8 también lee, con audio por defecto. La apliqué en toda ruta que lee; en 6–8 casi todos los ítems con palabras van a la habilidad oral. ¿Es lo que querés?
4. **Memotest, nivel 2.** [Seguro] 5.4 propone «destapar por un momento la pareja». Un tapado por tiempo choca con D4 y M10-7. Dejé «se marcan tres tarjetas entre las que hay una pareja», sin reloj. ¿Te sirve?
5. **Criterio de acierto para M10.** [Seguro] La FEC no lo define. Uso el de `modulo.criterio_acierto`. En la Act. 5, acierto es la primera elección adecuada, sin errores en los pasos y con la justificación adecuada al primer intento; en la Act. 3, cada etapa por separado.
6. **Retiro «de la misma habilidad».** [Probable] Lo apliqué por actividad, porque cada una tiene una sola habilidad de referencia (la Act. 3 también, aunque sus etapas alimenten M10 por separado). ¿Correcto?
7. **Habilidad escrita de la etapa asociar.** [Suposición] En rutas que leen, sin audio, usé `comprension-de-consignas-escritas`, la secundaria de 5.2. ¿Es esa o proponés otra?
8. **Rompecabezas Intermedio.** [Suposición] Lo dejé con revisión al final, como Difícil, para que haya autocorrección. Fácil revisa al poner cada pieza.
9. **Ítems del banco.** [Seguro] Los ejemplos de la FEC están tal cual (casa de paja, cerdito de la casa de madera y su martillo, balde detrás de la casa, algo para construir, parejas de 5.3, frases y justificación de la Act. 3, viento, refugio de bicicletas y carpa con lluvia). El resto del banco (39 ítems en total) lo escribí como relleno para probar. Van por el circuito de 5.3.1: los escribís o validás vos, con la segunda clasificación.
10. **Identificador del modelo institucional.** Coincido con **CRIT-003** (sección 13). Dejo de usar «CRIT-EST-001 v1.1».

### F.9 Mensaje tipificado para PSP-SR (vigente)

```
TIPO: Revisión técnica
DE: DEV-IA
PARA: PSP-SR
ID: RT-CER-001 v1.3
FECHA: 2026-11-14
REFIERE A: FEC-014 v0.2 «Los tres cerditos» (2026-11-12); decisiones D1 a D7 de la supervisora; RT-CER-001 v1.2
```

PSP-SR: construí el prototipo según la FEC-014 v0.2, solo en el entorno de prueba y con datos sintéticos. Te respondo con la **v1.3** porque la v1.2 ya existía (prototipo del 2026-11-12).

**Trazabilidad:** [Seguro] REQ-CLI-CER-00 a 16, cada uno con su implementación y su prueba (F.3). Casos 1 a 12 y 14 a 16 con prueba automática; el 13, por revisión de código; el 17 es del protocolo 9.2 del portal.

**Escala 0–3 y retiro:** [Seguro] funciones puras del motor (F.4). «Sin ayuda» = `apoyo_max` 0; el retiro baja un nivel por ítem; los apoyos de acceso son nivel 0. Pasan al núcleo cuando se apruebe CRIT-003, nombre con el que coincido.

**CI:** [Seguro] el validador del banco comprueba respuestas únicas, ausencia de la Act. 5 en 3–5 (catálogo e ítems), parámetros de 5.3, cuento 3–5 y palabras prohibidas. La prueba confirma que detecta bancos rotos a propósito (F.5).

**Costo y plazo:** [Suposición] 18–24 jornadas en total (antes 15–20), de las que el prototipo cubre unas 14–16; ilustración 140–200 h; voz grabada 6–10 h (F.6).

**P6:** [Seguro] viable en Luci (1 jornada). [Probable] Viable en Explorapalabras cuando definas a qué nivel va cada pista (F.7).

**Preguntas:**
1. El texto del cuento pone a dos cerditos adentro de la casa de ladrillos cuando el lobo sopla.
2. 5.4 contra 5.7 sobre escuchar la frase objetivo.
3. La imputación oral en 6–8.
4. El nivel 2 del Memotest sin reloj.
5. El criterio de acierto para M10 por actividad.
6. El retiro por actividad.
7. La habilidad escrita de la etapa asociar.

El banco fuera de tus ejemplos es relleno de DEV-IA y va por el circuito de 5.3.1 (detalle en F.8).

**Estado:** [Seguro] nada sale del entorno de prueba sin registro de aprobación y las dos aprobaciones.

### F.10 Dónde está y cómo se probó

- **Archivo para probar con doble clic:** `descargas/AprenderSiendo_Los_tres_cerditos_prueba.html` (v0.2.0-prueba). La versión anterior está en `descargas/Históricos/AprenderSiendo_Los_tres_cerditos_v0.1.0-prueba_2026-11-12.html`, y la actual también queda con versión y fecha en `Históricos/`.
- **Código:** rama `claude/project-thread-fv68pm`, PR #8 (borrador).
- **Pruebas:** [Seguro]
  - `node tests/cerditos.test.js`: 663 comprobaciones.
  - `node tests/cerditos.e2e.js`: juega las 39 combinaciones de ruta, actividad y grado publicadas y los casos de la sección 10, con capturas y la vista de 375 px.
  - Batería completa del portal: reglas, Explorapalabras, originalidad, Luci y portal de punta a punta, que ahora incluye la vista de medianas.
  - Todo en verde.

```
TIPO: Revisión técnica
DE: DEV-IA
PARA: PSP-SR (copia: Supervisora; Responsable del proyecto)
ID: RT-CHF-001 v1.6
FECHA: 2026-11-24 (v1.5 y v1.4: 2026-11-23; v1.3, v1.2 y v1.1: 2026-11-22; v1.0: 2026-11-21)
REFIERE A: RT-CHF-001-R v1.4 y decisión D5 (2026-11-24); RT-CHF-001-R v1.3 y APR-CHF-001 (2026-11-22); RT-CHF-001-R v1.2 y decisión D4 de la supervisora (2026-11-22); RT-CHF-001-R v1.1 y su anexo B1–B2 (2026-11-22); RT-CHF-001-R v1.0 de PSP-SR (2026-11-22); FEC-016 v0.3 («Chef en Acción: ¡Hoy cocinamos!»); decisiones D1 a D3 de la supervisora (2026-11-21); FEC-013 v0.1; FEC-014 v0.2; FEC-015 v0.3 y RT-CEX-001 v1.2; RT-EST-001-R v1.0; ADR-009
```

# RT-CHF-001 · «Chef en Acción»: revisión técnica

- **Estado:** revisión técnica de la FEC-016 v0.3, actualizada con la respuesta RT-CHF-001-R v1.0 de PSP-SR (Parte G). No hay registro de aprobación: nada sale del entorno de prueba (solo datos sintéticos).
- **Alcance:** cómo se construye. Textos, grados, umbrales, Estaciones, recetas y taxonomías de error son contenido clínico de PSP-SR y de la supervisora. Esta revisión no los valida ni los completa por suposición: donde faltan, hay una pregunta (Parte F).
- **Sección 0 de la FEC:** esta revisión no nombra los productos de I.3.F ni el banco de pictogramas citado en REQ-CLI-CHF-00d, para no romper REQ-CLI-CHF-00c y 19 desde el primer documento técnico. Se los menciona como «los productos de I.3.F» y «el banco de pictogramas no comercial».

---

## Parte A. Resumen para la supervisora (sin jerga)

**Se puede construir.** [Seguro] Todo lo que pide la ficha se resuelve con reglas fijas escritas en el programa. No hace falta inteligencia artificial en ninguna parte del juego ni de la corrección, como en las aventuras anteriores.

**Es la aventura más grande hasta ahora.** [Seguro] Tiene 16 variantes (8 rincones, cada uno con Zona y Espacio), tres grados en cada una, cuatro rutas de edad y una cocina de juego con acciones. Para compararla: «Los cuatro exploradores» tiene 10 variantes y no incluye la ruta 13–18.

**Cómo la vamos a construir para que sea manejable:**

1. **Pocas «piezas» de juego que se repiten.** Las 16 variantes se arman con 10 formas de jugar (por ejemplo: tocar la opción, ordenar tarjetas, poner en el carrito, pagar con billetes). Si una pieza funciona bien, funciona en todos los rincones que la usan.
2. **Las recetas son una lista aparte.** Cada receta dice sus ingredientes, sus pasos, qué pasos hace la persona adulta y qué alérgenos tiene. Los rincones toman las recetas de esa lista. Así, la receta que la persona eligió en un rincón puede seguir en el siguiente, sin obligarla.
3. **Controles automáticos antes de cada versión.** El programa rechaza solo: palabras no admitidas («misión», «chatarra», «engorda»…), recetas sin alérgenos declarados, recetas con alimentos de riesgo de atragantamiento en 3–5, pasos con fuego o cuchillo hechos por un chico en la cocina de juego, y variantes ofrecidas en una edad donde la ficha dice que no.

**Lo que decidí mientras no respondas P4 a P10** (rige lo más prudente, se cambia en una línea):

- **Dinero (P4):** precios inventados y redondos, con billetes y monedas dibujados por el portal, como recomienda PSP-SR.
- **Audio y letra (P9):** nada suena solo y la letra se elige, como en «Los cuatro exploradores».
- **Cocina con calor para adolescentes (P10):** por ahora, solo recetas sin cocción para todas las edades en el desafío para casa. Si decidís que sí, se habilita.
- **«Conocé la cocina» (P5):** no se construye hasta que lo decidas. Agregarla cuesta poco (2 jornadas).

**Costo y plazo** [Suposición: depende de las respuestas de la Parte F]:

- **Programación:** entre 24 y 32 jornadas para la versión completa en el entorno de prueba.
- **Ilustraciones finales:** entre 260 y 400 horas de ilustración. Es la parte más cara. La decide el responsable del proyecto.
- **Uso de inteligencia artificial:** costo cero, porque no se usa.

**Qué te pido:** que le lleves esta revisión a PSP-SR. Mientras tanto avanzo con un prototipo de prueba con dibujos y ejercicios provisorios, para que puedas ver cómo se juega cada rincón. Todo va rotulado «Contenido de prueba no validado».

---

## Parte B. Viabilidad y arquitectura

### B.1 Viabilidad

| Aspecto | Dictamen |
| --- | --- |
| Técnica | [Seguro] Viable. Flujo determinista sin modelo de lenguaje (DEV-IA §1 y §5; T11). Ningún componente necesita IA para jugar, corregir, adaptar ni registrar. |
| Seguridad clínica | [Seguro] Todas las reglas de la FEC son verificables en código o en CI (Parte C). Las que dependen de revisión humana (parecido de láminas, colores, lista de atragantamiento) quedan señaladas. |
| Riesgo | Alto (Ejercitación adaptativa), como dice la FEC §6. El desafío para casa, Medio (M06). |
| Dependencias | Reutiliza el núcleo de ADR-009 (PR #5) y los motores de FEC-013, 014 y 015 (PR #7 a #9). Se apila sobre la rama de «Los cuatro exploradores». |

### B.2 Dónde vive

[Seguro] Igual que «Los tres cerditos» y «Los cuatro exploradores» (ADR-009):

- `app/herramientas/chef/chef.html`: la aventura completa, aislada en un marco sin acceso al portal ni a sus datos. Devuelve al portal solo el registro mínimo de cada ítem.
- `app/herramientas/chef/banco.json`: ítems de las 16 variantes.
- `app/herramientas/chef/recetas.json`: banco de recetas (sección B.4).
- `app/herramientas/chef/modulo.json`: ficha técnica por variante (M04-1, EST-08), disponibilidades por ruta (5.11), parámetros de apoyos, de M10 y de 5A.
- `app/herramientas/chef/herramienta.js`: enlace con el portal, que acota y valida cada campo que recibe.
- `scripts/chef_generar.py`: generador del banco a partir de plantillas por variante y grado y del banco de recetas.
- `tests/chef.test.js` (reglas, banco y validador, en CI) y `tests/chef.e2e.js` (navegador, en CI).
- `python3 app/build.py --chef` arma el archivo suelto de prueba.

### B.3 Las 16 variantes con sus Estaciones y grados

[Seguro] Cada variante es una unidad propia en `modulo.json`, con su Estación, su habilidad de referencia, sus secundarias, sus tres grados, su ventana de M10 y su fila en la vista profesional. Es la misma solución que 7A/7B y 8A/8B de FEC-015 (REQ-CLI-EXP-14), extendida a los ocho rincones.

```
variante: { id: "3-espacio", rincon: 3, nombre_variante: "Espacio",
            nombre_accion: "Calcular y pagar", rincon_nino: "El súper",
            estacion: "E3", estacion_provisoria: true,
            habilidad: "manejo-del-dinero", secundarias: [...],
            grados: { facil: {dimension: [...]}, intermedio: {...}, dificil: {...} },
            disponibilidad: { "3-5": [], "6-8": ["facil","intermedio"], "9-12": [...], "13-18": [...] },
            transferencia: "B", tipos_error: [...] }
```

- **Identificadores internos:** `1-zona`, `1-espacio`, …, `8-espacio` (FEC 5.1). Quien juega nunca los ve. La vista profesional y el catálogo muestran «Rincón 3 · Espacio».
- **M10 por variante y por habilidad:** el grado de `2-espacio` no se mueve por lo que pasa en `3-espacio` (REQ-CLI-CHF-05). No existe nivel general.
- **Zona → Espacio y cambio de Estación:** nunca automático (EST-05). Con profesional, el aviso «Revisar cambio de Estación»; en modo libre, «Hay retos nuevos para probar» (RT-EST-001-R, P3). El código no tiene ninguna función que cambie de variante sola: lo verifica una prueba.
- **Dimensión por paso de grado (REQ-CLI-CHF-01):** cada grado declara al menos una dimensión del vocabulario cerrado de DR-§4.B distinta de `cantidad-estimulos` (información, consignas, relaciones, planificación, resolución, autonomía). El validador rechaza la ficha si no.

### B.4 Banco de recetas y «hilo de la receta»

**Banco de recetas** (`recetas.json`). [Seguro] Cada receta declara, con vocabulario cerrado:

| Campo | Para qué |
| --- | --- |
| `ingredientes` (id del catálogo de ingredientes) y `utensilios` | Que los rincones 2, 3, 6 y 7 usen la misma receta |
| `pasos` con `actor` (`persona` o `adulto`), `riesgo` (`calor`, `filo`, `electrico` o ninguno) y `momento` (`antes` o `durante`) | REQ-CLI-CHF-12, 20 y 21 |
| `coccion` (sí o no) | Solo las sin cocción van al desafío para casa (CHF-20) |
| `alergenos` (gluten, leche, huevo, maní, frutos secos, soja, pescado y mariscos) | CHF-22 y 5.10 |
| `alternativa_sin_tacc` (obligatoria si tiene gluten) | CHF-22 |
| `rutas`, `region`, `sin_carne` | 5.11 y 5.13 |
| `estado` (`pendiente de PSP-SR` o `validado por PSP-SR`) | Marca de validación (antecedente B.2.1 de RT-CEX-001-R) |

**Catálogo de ingredientes.** [Seguro] Cada ingrediente tiene id, nombre, pictograma, ilustración, forma distintiva (para no depender del color, WCAG 1.4.1), alérgenos y una marca `atragantamiento_3_5`. Ningún ingrediente es una bebida alcohólica: el vocabulario no la admite (CHF-14).

**Hilo de la receta** (FEC §4). [Seguro] Es un dato de la sesión, no una regla:

1. Si la persona eligió una receta en el Rincón 1, queda como «receta en curso» en la memoria de esa sesión del portal.
2. Al entrar a otro rincón, se usan los ítems de esa receta **si existen** para esa variante, grado y ruta. Si no existen, se usa otra receta del banco y no se avisa nada (no es un error).
3. Si entra directo a un rincón, el juego asigna una receta del banco (caso de prueba 2).
4. No hay orden, candado ni mensaje del tipo «primero tenés que…» (REQ-CLI-CHF-02). La receta en curso se puede cambiar en cualquier momento.
5. Se registra el id de la receta por ítem (FEC §8). No se registra si siguió el orden.

### B.5 Las 10 formas de jugar

[Seguro] Las 16 variantes se arman con estos formatos. Todos tienen alternativa sin arrastre y con teclado (WCAG 2.1.1, 2.5.1 y 2.5.7; REQ-CLI-CHF-09) y objetivos de 44 px o más.

| Formato | Variantes | Se reutiliza de |
| --- | --- | --- |
| F1 · Elegir opción (con razón cerrada opcional) | 1A, 1B, 3A Intermedio, 6A | Motor común de opciones |
| F2 · Clasificar en canastas (2 o 3) | 1A Intermedio, 5B | «Contar y elegir» / FEC-015 Juego 1 |
| F3 · Buscar en la escena y llevar a la mesada | 2A, 5A, 6A Difícil | Componente de escenas de FEC-013 (Luci) |
| F4 · Lista con «Ya miré» y «Tengo / Falta / Sobra» | 2B | Tapado con «Ya miré» de FEC-014 y FEC-015 (Juego 7) |
| F5 · Carrito con contador visible | 3A | Nuevo |
| F6 · Billetes, monedas y teclado numérico (solo dígitos) | 3B | Nuevo |
| F7 · Ordenar tarjetas en casilleros (uno o dos carriles) | 4A, 4B, 6B Difícil | «Secuencias» de la beta 2 |
| F8 · Armar oración con tarjetas | 6B | Nuevo, sobre F7 |
| F9 · Cocina de juego (acciones por botón) | 7A, 7B | Nuevo (B.7) |
| F10 · Aventura en etapas | 8A, 8B | Encadena F1, F3, F4, F5, F7 y F9 |

### B.6 Rincón 5 y el control de exposición

[Seguro] 5A reutiliza el control de exposición de 8A de FEC-015 (`exposicionSiguiente`):

- Sin reloj visible ni cuenta regresiva. Sin devoluciones sobre la rapidez.
- La exposición breve solo se acorta con 85 % o más de precisión. Propongo heredar de FEC-015 «una vez por sesión como máximo» y los mínimos por ruta. **Pregunta T2.**
- La falta de respuesta no es error. La exposición breve se desactiva desde la configuración del adulto. Nada parpadea más de 3 veces por segundo (WCAG 2.3.1).
- 5B no mide tiempo: el registro de 5B no guarda tiempo de respuesta como dato de desempeño, solo como contexto.
- 5A y 5B no existen en 3–5: el filtro de ruta y el validador lo garantizan por separado.

### B.7 La cocina de juego (Rincón 7) y la regla del fuego y el filo

**Acciones por botón.** [Seguro] Las seis acciones de la FEC (seleccionar, trasladar, colocar, mezclar, distribuir, completar) son botones con pictograma y texto. Arrastrar es opcional, nunca necesario. «Mezclar» es un toque: la cuchara se anima sola. Nadie tiene que hacer gestos en círculo (WCAG 2.5.1).

**Cómo se arma.** [Seguro] Cada receta es una lista de pasos. Cada paso dice qué acción, qué utensilio y qué ingrediente hacen falta. La pantalla muestra la mesada, los utensilios y los botones de acción. Quien juega elige utensilio y acción; el programa compara con el paso esperado.

**Fuego y filo en las rutas 3–12** (REQ-CLI-CHF-12). [Seguro] Tres candados independientes:

1. **En los datos:** todo paso con `riesgo` distinto de ninguno lleva `actor: adulto` en 3–12. El validador rechaza el banco si un paso de riesgo tiene `actor: persona` en esas rutas.
2. **En la pantalla:** en 3–12 los botones de horno, hornalla, microondas, licuadora, batidora eléctrica, pava y cuchillo no existen para quien juega. En su lugar aparece «Pedile al chef que…», y tocarlo cuenta como paso correcto (caso de prueba 8).
3. **En las animaciones:** no existen estados de quemado, roto, derramado peligroso ni herido. El error se muestra solo con la pista neutra. Una prueba busca esos estados en el código y espera cero.

En 13–18 la persona puede hacer el paso, con los pasos de seguridad visibles (manopla, mango hacia adentro, tabla) como parte del ítem.

**Repetición y mejora.** [Seguro] A la persona solo se le muestra una frase de proceso sin números («Esta vez lo hiciste con menos ayuda»), calculada por comparación interna de `apoyo_max` con el intento anterior de la misma receta. Nunca se muestra el número.

### B.8 El gran reto (Rincón 8)

[Seguro] 8A y 8B son una secuencia de etapas, y cada etapa usa el formato del rincón que integra. Propuesta de registro (**pregunta T5**):

- Cada etapa es un ítem, con la habilidad de su rincón de origen y la marca `integrado: true`.
- M10 se aplica sobre la variante 8A u 8B, no sobre los rincones de origen: lo que pase en el gran reto no cambia el grado del Rincón 3.
- 8B guarda la alternativa elegida ante cada imprevisto y la respuesta de «¿Cómo salió?» (opciones cerradas, sin calificación).
- REQ-CLI-CHF-16: hay al menos 8 situaciones por grado, y no se repite la de la sesión anterior (se guarda solo el id de la última situación, en la memoria de sesión).
- REQ-CLI-CHF-29: antes de armar el gran reto, se filtran las etapas a los rincones disponibles en la ruta. Por ejemplo, en 3–5 el 8A Fácil no incluye etapas de dinero.

### B.9 Registro y vistas

[Seguro] Igual que FEC-015, con los campos de FEC §8: rincón, variante, Estación, habilidad, grado, receta, resultado, intentos, tipo de error, apoyos y `apoyo_max`, repeticiones de consigna, autocorrección, modalidad, `tipo_letra` y tiempo (contexto). En 5A, exposición y tiempo de respuesta. En 1B y 8B, la razón o alternativa elegida.

- **Nunca se guarda:** voz, texto libre, imagen, cámara, ubicación, alergias, celiaquía, dietas ni datos de la casa o de la economía familiar. No existen campos para eso: la prueba de `herramienta.js` verifica que cualquier campo no previsto se descarta.
- **Familia:** tiempo de uso y rincones jugados; en 13–18, solo tiempo y aventuras (A10). La herramienta no le manda a esa vista ni aciertos, ni apoyos, ni tiempos.
- **Profesional:** una fila por habilidad con la tabla de FEC §8, las tres columnas como «En esta actividad: resuelve sin apoyo / con apoyo / todavía con demostración», sin puntaje global ni colores, con la leyenda 7.1.
- **La app no infiere estrategias.** La fila «Estrategias» solo muestra lo elegido en «Contar» y las razones de 1B y 8B.

### B.10 Ruta 13–18 (D1)

[Seguro] Es la primera aventura con ruta 13–18. Técnicamente implica:

- **Una segunda estética** (ilustración plana sobria, sin personajes infantiles) y el «modo sobrio» (A15). Se resuelve con una hoja de estilo por ruta y un juego de láminas propio. No cambia el motor.
- **Textos propios** para consignas, situaciones y devoluciones (vida adolescente). Es contenido de PSP-SR: **pregunta T1**.
- **Montos mayores y decimales** en 3B. **Pregunta T9.**
- Reglas A10 a A18: la familia ve solo tiempo y aventuras; sin funciones sociales; sin contenidos de dieta, peso ni calorías.

---

## Parte C. Trazabilidad (REQ-CLI-CHF-00a a 00f y 01 a 29)

| Requisito | Cómo se cumple | Dónde se verifica |
| --- | --- | --- |
| 00a | Todo el arte es original. En el prototipo, SVG dibujado en código con la paleta de marca y contorno tinta #102F54, sin imágenes externas. Las láminas finales, con el registro de 0.3. | Prueba: el archivo no carga recursos externos |
| 00b | Sin IA generativa en el prototipo. Si se usara para las láminas finales: revisión de parecido por otra persona y la herramienta en créditos. Sin generación en vivo. | Registro de láminas en `banco.json`; revisión humana |
| 00c | Ningún texto, metadato ni comentario nombra los productos de I.3.F. Sus nombres se guardan solo como huellas (SHA-256), como en FEC-013 y 015. | `scripts/originalidad.py` en CI |
| 00d | Pictogramas propios del portal. El nombre del banco no comercial también va como huella. | `scripts/originalidad.py` |
| 00e | Recetas y pasos redactados de cero. Ninguna marca comercial: el catálogo de ingredientes no tiene campo de marca y los envases son genéricos. | Revisión humana de recetas (PSP-SR) |
| 00f | Billetes y monedas propios: rectángulo y círculo con el valor grande y un pictograma de cocina. Sin próceres, animales ni guardas. | Prueba de dibujo; asesoría legal (Parte E) |
| 01 | Cada paso de grado declara al menos una dimensión distinta de `cantidad-estimulos`. | Validador (CI) |
| 02 | Los rincones de la ruta, abiertos desde el inicio, sin orden ni desbloqueo. | e2e |
| 03 | Pantallas de quien juega con nombres de acción. El validador rechaza «estación», «nivel», «fácil», «difícil», «zona», «espacio» y letras de variante en textos de quien juega. | Validador y e2e |
| 04 | Sin promesas de mejora. Cada variante lleva la declaración de transferencia B; 8B, además, el texto de Transferir. | Validador de palabras y ficha |
| 05 | M10 por variante y por habilidad. Sin nivel general. | Prueba (caso 3) |
| 06 | Primer error → pista de nivel 1. Al final de la escalera, demostración que explica y devuelve el turno (R10). | e2e (caso 5) |
| 07 | Sin reloj, cuenta regresiva ni tapado automático salvo 5A. 2B tapa con «Ya miré». Sin clientes que esperan. | e2e |
| 08 | 5A como B.6. | Prueba de `exposicionSiguiente` (caso 7) |
| 09 | Alternativa sin arrastre y con teclado en los 10 formatos. Sin voz, texto libre ni imagen. El teclado de 3B solo acepta dígitos. | e2e |
| 10 | Cada ítem declara sus apoyos de acceso y de aprendizaje según la tabla 5.3 (lista visual, calculadora, modelo de secuencia, tiempo amplio, imagen con palabra, repetición). | Validador (caso 21) |
| 11 | Tarjeta de «Mi recetario» al cerrar un rincón, sin importar los aciertos. Sin estrellas, medallas, puntos, monedas, propinas ni contadores. | e2e (caso 23) |
| 12 | Tres candados de B.7. | Validador y e2e (caso 8) |
| 13 | Dinero propio, precios del banco, sin acumulado entre ítems ni sesiones (el monto se crea en cada ítem). 3B no existe en 3–5. | Prueba y validador |
| 14 | Lista de palabras no admitidas sobre comida y cuerpo, con búsqueda por palabra entera y sin tildes. Sin ingredientes alcohólicos en el vocabulario. | Validador (caso 11) |
| 15 | 1B Difícil y 8B declaran `validas: [{opcion, razon}]`; se acepta toda combinación declarada. | Prueba (caso 13) |
| 16 | 8B: 8 o más situaciones por grado; no repite la última. | Validador y prueba |
| 17 | La vista de la familia no recibe grados, aciertos, apoyos, errores ni tiempos. | Prueba de `herramienta.js` (caso 15) |
| 18 | Vista profesional por habilidad, sin puntaje global ni colores, con la leyenda 7.1. No infiere estrategias. | e2e (caso 16) |
| 19 | Validador de palabras: «misión», «desafío» fuera del desafío para casa o aula, «estación» para un rincón, «nivel» visible, «estimulación» en textos de familias, categorías diagnósticas; más las huellas de 00c y 00d. | CI (caso 19) |
| 20 | Desafío para casa solo con recetas `coccion: no`; tareas de la persona sin riesgo. | Validador |
| 21 | Todo paso con riesgo es `actor: adulto` y `momento: antes`; el texto dice «Antes de empezar, el adulto…». Rechaza «usá el cuchillo». | Validador |
| 22 | Aviso fijo de alergias y celiaquía en cada propuesta para casa; alternativa sin TACC obligatoria si hay gluten. No hay ningún campo para alergias ni dietas. | Validador y prueba |
| 23 | Ruta 3–5: ninguna receta con ingredientes marcados `atragantamiento_3_5`. La lista la define PSP-SR (revisión con guía pediátrica pendiente). | Validador (caso 10) |
| 24 | Higiene en el texto fijo. Ninguna receta sin cocción con huevo crudo. | Validador |
| 25 | 2 o 3 recetas alternativas, opcionales, sin lista de compras. No diario (M06-1). | Ficha |
| 26 | «Lo hicimos» es un toque. Sin foto, calificación, cronómetro ni comparación. | e2e (caso 9) |
| 27 | **Deshabilitado** hasta que la supervisora responda P10: rige lo más restrictivo (solo sin cocción en todas las rutas). Queda preparado como un interruptor en `modulo.json`. | Validador |
| 28 | Ficha por variante con los campos de M04-1 y EST-08, idea fuera de la pantalla, transferencia, recetas usadas con alérgenos y, en 8B, el texto de Transferir. Sin eso, no se publica. | Validador |
| 29 | Disponibilidades de la tabla 5.11 en `modulo.json`; el validador cruza cada ítem con su ruta; 8A y 8B filtran etapas. | Validador (caso 1) |

**Reglas que siguen sin cambios** (T01 a T11, EST-01 a 10, ACT-01 a 12, M06, M10, M18, A10 a A18, REQ-CLI-CER-08, 09 y 14): [Seguro] se reutilizan los mismos componentes que ya las cumplen en FEC-014 y FEC-015. REQ-CLI-EXP-21 y 22 (audio solo con parlante y letra elegible) se aplican por defecto mientras la supervisora no responda P9.

**Caso 22 (señal de riesgo).** [Seguro] La aventura no tiene canal de contacto propio. El canal de contacto del portal aplica el protocolo 9.2 sin cambios; esta herramienta no agrega preguntas orientadoras.

---

## Parte D. Banco de ítems: cuántos son viables

**Lo que pide PSP-SR:** 12 por variante y grado en 6–8, y 8 situaciones por grado en 8B.

**La cuenta** [Seguro, sobre la tabla 5.11]:

| Ruta | Combinaciones de variante y grado disponibles | Ítems a 12 por combinación |
| --- | --- | --- |
| 6–8 | 36 | 432 |
| Agrega 9–12 (grados que en 6–8 no están) | 9, más 8B con 3 grados | 108 + 24 situaciones de 8B |
| **Total para la prueba** | | **≈ 564 ítems** |

En 3–5 y 13–18 se reutilizan ítems de las mismas combinaciones con su filtro de ruta y, en 13–18, con textos propios (T1).

**Viabilidad.** [Probable] Es viable con generador, como en «Los cuatro exploradores» (394 ítems). El generador arma ítems a partir de dos cosas: plantillas por variante y grado, y el banco de recetas. **Propuesta para PSP-SR:** que valide primero **las plantillas y las recetas** (≈ 48 plantillas y 16 recetas), y después una muestra de ítems por combinación. Revisar 564 ítems uno por uno no es razonable para un primer paquete.

**Plan por fases** [Suposición sobre plazos]:

| Fase | Contenido | Programación |
| --- | --- | --- |
| Prototipo v0.1.0 | Los 8 rincones y 16 variantes jugables, 3 o 4 ítems provisorios por combinación, recetas provisorias, arte SVG de relleno, rutas 6–8 y 9–12 | 6 a 8 jornadas |
| v0.2.0 | Con las respuestas de PSP-SR: recetas y plantillas validadas, 12 ítems por combinación, rutas 3–5 y 13–18, vista profesional completa | 10 a 13 jornadas |
| v0.3.0 | Desafío para casa, 8B completo, pruebas de accesibilidad, paquete de revisión | 8 a 11 jornadas |

---

## Parte E. Riesgos técnicos, costo y plazo

| Riesgo | Mitigación |
| --- | --- |
| Alcance: 16 variantes, 4 rutas y 10 formatos | Formatos reutilizables y fases (Parte D) |
| Ruta 13–18 duplica textos y láminas | Motor único; solo cambian textos y hoja de estilo |
| Cocina de juego: muchos estados posibles | Máquina de pasos simple: un paso esperado por vez, sin física ni simulación libre |
| Ítems con varias respuestas válidas (1B Difícil, 8B) | Combinaciones válidas declaradas en el banco; ninguna se calcula al vuelo |
| Lista de atragantamiento no validada | Lista cerrada en datos, editable por PSP-SR; el validador la aplica |
| Billetes y nombre de la aventura | Diseño propio; consulta legal del responsable del proyecto (FEC 00f y I.3.F) |
| Accesibilidad para personas ciegas | Limitación declarada en la ficha, como en FEC-015 |
| Peso del archivo con muchas láminas | Carga a demanda por rincón (ADR-009 fase 2) |

**Costo de operación.** [Seguro] No hay llamadas a modelos. Alojamiento: el mismo del portal, sin costo adicional relevante.

**Costo de desarrollo.** [Suposición] 24 a 32 jornadas de programación (Parte D). Ilustración final: 260 a 400 horas, por estas piezas: cocina 3–12 (alacena, heladera, mesada, pileta, horno), supermercado (góndolas, cajones, carrito, caja), unos 60 ingredientes con pictograma e ilustración, unos 25 utensilios, 10 billetes y monedas, 2 guías y el personaje personalizable con sus opciones, y la segunda estética para 13–18.

---

## Parte F. Preguntas

### F.1 Para PSP-SR (contenido clínico; no las completo por suposición)

- **T1. Textos de 13–18.** ¿Escribís un juego de consignas, situaciones y devoluciones propio para 13–18, o los ítems de 9–12 se usan con otra redacción que vos definís? Sin esos textos, la ruta 13–18 del prototipo queda deshabilitada.
- **T2. Parámetros de 5A.** ¿Heredamos de 8A de FEC-015 «una vez por sesión como máximo» y los mínimos de exposición (1000 ms en 6–8, 700 ms en 9–12, más 500 ms de pausa)? ¿Cuál es el mínimo en 13–18?
- **T3. Criterio de acierto y ventana de M10** por variante. ¿Los mismos que en FEC-015, o hay variantes con criterio distinto (por ejemplo, 1B Difícil con varias respuestas válidas)?
- **T4. Taxonomía de errores.** La sección 5.16 da ejemplos para 3B y 4A. Para que funcione la regla de «el mismo error 3 veces», necesito la lista cerrada de tipos de error de las 16 variantes.
- **T5. Registro del gran reto.** ¿Te sirve que cada etapa sea un ítem con la habilidad de su rincón de origen, y que M10 se aplique solo sobre 8A u 8B (B.8)?
- **T6. Selección múltiple.** En 1A Difícil («¿Cuáles llevan huevo?») y en 2B («Tengo / Falta / Sobra»), ¿cuándo es acierto: todas bien, o hay acierto parcial? ¿Cuenta como error marcar uno de más?
- **T7. Dos carriles en 4B.** Para quien no puede usar una línea de tiempo con dos carriles (lector de pantalla, teclado), propongo una lista vertical donde cada tarjeta lleva el botón «Al mismo tiempo que el anterior». ¿Es equivalente para vos?
- **T8. «Volver a ver» en 2B.** Cuenta como nivel 2. ¿También si la persona la vuelve a ver antes de responder por primera vez?
- **T9. Dinero en 13–18.** Hoy los precios en pesos casi no usan centavos. ¿«Decimales» significa centavos, o precios con cifras más grandes y operaciones con porcentajes simples (descuentos)?
- **T10. Recetas y plantillas.** ¿Validás primero el banco de recetas (ingredientes, pasos, alérgenos, pasos del adulto) y las plantillas por variante y grado, y después una muestra de ítems (Parte D)? Para el prototipo, armo un borrador de 16 recetas de la tabla 5.10, rotulado «pendiente de PSP-SR».
- **T11. Lista de atragantamiento.** ¿Me pasás la lista cerrada definitiva de ingredientes con riesgo en 3–5, cuando la revises con la guía pediátrica? Mientras tanto uso la de REQ-CLI-CHF-23.
- **T12. Cantidad mínima en otras rutas.** ¿El mínimo de 12 por combinación vale también para 3–5, 9–12 y 13–18?
- **T13. Calculadora en 3B.** Propongo una calculadora simple en pantalla con dígitos y las cuatro operaciones, sin memoria. ¿Está bien, o preferís solo suma y resta?
- **T14. «Contar».** Necesito el texto de las opciones cerradas de «Contar» para cada rincón, y el de «¿Cómo salió?» completo (la tercera opción de 8B termina en «…»).

### F.2 Para la supervisora (decisiones que ya están en la FEC, P4 a P10)

Mientras no las respondas, el prototipo usa lo indicado en la Parte A. Ninguna bloquea el prototipo. La única que cambia mucho el trabajo es **P5** («Conocé la cocina»): son 2 jornadas si decís que sí.

### F.3 Para el responsable del proyecto

- Consulta legal del nombre «Chef en Acción» y del diseño de billetes (FEC I.3.F y 00f).
- Presupuesto y plazo de las ilustraciones finales (Parte E).
- Contrato de cesión de derechos con quien ilustre.

---

*DEV-IA · Portal Especializado en Psicopedagogía Moderna · Bajo supervisión clínica de la Lic. Maricel Guadalupe Noseda, Mat. 101, Provincia del Neuquén. Este documento no es un registro de aprobación.*

---

## Parte G. Cómo se aplicó la respuesta de PSP-SR (RT-CHF-001-R v1.0) · prototipo v0.1.1

**Para la supervisora, en una línea.** [Seguro] El prototipo ya tiene todo lo que PSP-SR respondió: los tipos de error por rincón, las preguntas de «Contar», la lista de alimentos con riesgo de atragantamiento y la ruta de 13 a 18 con sus ocho ejemplos. En pantalla sigue el cartel «Contenido de prueba no validado» y nada sale del entorno de prueba.

**Estado clínico.** [Seguro] Lo que viene de RT-CHF-001-R se carga con `estado_clinico: "validado por PSP-SR"`: taxonomías (T4), «Contar» y «¿Qué cambiarías?» (T14), lista de atragantamiento (T11), reglas de 13–18 y sus ocho muestras (T1), mínimo de 700 ms (T2), calculadora por ruta (T13). Las 16 recetas, el resto de las consignas y los textos nuevos que escribió DEV-IA siguen `pendiente de PSP-SR`.

| Punto | Qué se hizo en v0.1.1 | Dónde |
| --- | --- | --- |
| T1 | Ruta 13–18 habilitada. Muestra **solo** las combinaciones con textos propios: las ocho muestras (1B, 2B, 3B ×3, 4B, 6B, 8B). Por eso en 13–18 hoy se ven los rincones 1, 2, 3, 4, 6 y 8, cada uno con su variante B. El resto queda pendiente de los textos de PSP-SR. Presentación sobria: sin personajes, sin historia inicial, sin exclamaciones. En la cocina de juego la persona hace los pasos con calor o filo y ve el paso de seguridad. El validador aplica las reglas: consigna de hasta 80 caracteres, sin diminutivos (salvo «galletitas») y sin «¡». | `chef_generar.py`, `chef_cuerpo.html` (`reglas1318`) |
| T2 | 13–18 con mínimo de 700 ms en 5A (5A no se ofrece todavía en 13–18). | `modulo.json` |
| T3 | Cambiar la respuesta antes de confirmar (desmarcar, cambiar de opción, borrar un dígito, sacar un producto) se registra como `autocorreccion` y no es error. «¿Cómo salió?» no se puntúa ni entra en M10. | `chef_cuerpo.html` |
| T4 | Lista cerrada por variante, más `sin_respuesta` y `otro`. En el gran reto, los tipos del rincón de origen de cada etapa (8B suma los suyos). La interfaz solo puede registrar tipos de la lista; si ninguno corresponde, registra `otro`. El validador rechaza un tipo fuera de la lista. Los tipos no se muestran como rasgo de la persona. | `Motor.tiposPermitidos`, `tipoCerrado` |
| T5 | Vista profesional con la columna «En el gran reto» por habilidad. Esos ítems no entran en las demás columnas ni mueven el grado del rincón de origen. | `vistaPorHabilidad` |
| T6 | Selección múltiple: acierto si están todas las correctas y ninguna de más. Parcial = error `omision` o `de_mas`, con devolución «Encontraste dos. Falta una.». Se registran `correctas_marcadas` y `total_correctas`. | `validaMultiple` |
| T7 | Aceptado. La lista vertical de 4B queda para v0.2.0 (en v0.1.1, 4B Intermedio sigue como elección). | pendiente |
| T8 | Cada vez que se vuelve a ver la lista después de «Ya miré» suma apoyo 2. No es error ni tiene devolución. Antes de «Ya miré» no cuenta. | `prepararYaMire` |
| T9 | 13–18: montos de miles, redondos; descuento del 25 %; precio por unidad; repartir un gasto. Los ítems de 3B con montos chicos no se ofrecen en 13–18. | banco |
| T11 | Lista provisoria cargada. Manzana y zanahoria marcadas: no se usan en 3–5. La ensalada usa `zanahoria_rallada`, que es otro id. | `banco.json` |
| T12 | Mínimos registrados en `modulo.json` (8 en 3–5, 12 en el resto). Rigen desde v0.2.0; v0.1.1 tiene 4 por combinación. | `modulo.json` |
| T13 | Calculadora simple, sin memoria: ninguna en 6–8; 9–12 con + − ×; 13–18 con las cuatro y %. En ítems de cálculo es apoyo 2; en el presupuesto, apoyo de acceso. | `calculadoraHTML` |
| T14 | «¿Cómo te resultó?», «¿Qué te ayudó?» por rincón (selección múltiple, siempre con «Otra cosa»; en 13–18 el rincón 3 suma «Usar la calculadora»), «¿Cómo salió?» y «¿Qué cambiarías?», con los textos de PSP-SR. | `textos` |
| O1 | «Fácil», «Más o menos» y «Difícil» se exceptúan solo como opciones de «¿Cómo te resultó?», por id. «Zona» y «Espacio» se rechazan solo como rótulo de variante. Además se corrigió el validador para que revise todos los textos de pantalla (antes salteaba algunos). | `textosNino`, `rotuloVariante` |
| O2 | La frase de mejora aparece solo si el apoyo bajó; si no, no se dice nada sobre apoyo ni tiempo. | `cierre` |
| O3 | La receta en curso no se guarda entre sesiones ni se muestra en ninguna pantalla. | `S.receta` |
| O4 | El desafío para casa solo se muestra con recetas validadas por PSP-SR. Hoy ninguna lo está, así que no aparece. La prueba automática lo verifica. | `cierre` |
| B.4 | Las recetas pasan a `recetas.json`, como estaba en v1.0 de esta revisión. | `recetas.json` |

**Textos nuevos de DEV-IA, pendientes de PSP-SR** [Suposición]: los de pantalla de 13–18 (`nino_13_18`: «¿Qué querés hacer?», «Nueva receta en tu recetario.», «Listo por ahora.», «Listo: la comida está servida.»); los pasos de seguridad de 13–18 (`seguridad_13_18`); la opción de 3B de repartir un gasto («Gastaron $4800 entre 4…»); las devoluciones de la selección múltiple cuando sobra una opción («Hay una que no va.»); las opciones de las muestras de 1B, 3B y 4B, y los imprevistos de la muestra de 8B.

**Preguntas nuevas para PSP-SR**
- **T15.** [Probable] En la muestra de 1B («Son 6 y no hay horno»), tomé como correctas las recetas sin horno que rinden 6 porciones o más. ¿Está bien, o también vale una que rinde menos si se hace doble?
- **T16.** [Seguro] Para no repetir los textos de 9–12, en 13–18 solo se ofrecen las combinaciones con textos propios. ¿Preferís eso hasta tener el banco completo, o abrir todas con los textos de 9–12 marcados como pendientes?

**Pruebas.** [Seguro] La prueba de punta a punta pasa 970 de 970 verificaciones en las cuatro rutas: cada variante y grado, más las reglas nuevas (T1, T3 a T6, T8, T11, T13, T14, O1 a O4). El validador del banco devuelve cero observaciones.

---

## Parte H. Respuesta RT-CHF-001-R v1.1 y anexo B1–B2 · prototipo v0.1.2

**Para la supervisora, en una línea.** [Seguro] Ya están aplicadas las dos correcciones de PSP-SR. El agua hirviendo y la olla caliente quedan siempre en manos del adulto, y los imprevistos del gran reto tienen que ver con la receta. También están los otros arreglos que pidió y la imagen nueva con volumen. Siguen el cartel «Contenido de prueba no validado» y el entorno de prueba.

**Cómo se usaron los archivos de PSP-SR.** [Seguro] La lógica de `corregir_B1_B2.py` se pasó al generador (`scripts/chef_psp_v11.py`), así que el banco ya sale corregido cada vez que se genera. Comparé el resultado con `banco.json` y `recetas.json` del anexo: **son iguales**, ítem por ítem y receta por receta. Las únicas diferencias son los campos nuevos para el validador y los cambios de abajo.

| Punto | Qué se hizo | Dónde |
| --- | --- | --- |
| B1 | Colar los fideos y sumar las verduras al arroz los hace el adulto, con calor. En 3–12 aparece como «Pedile al chef que use el colador / la cuchara». El paso del locro lleva calor, y en 13–18 se ve el paso de seguridad. Los panqueques se entibian en el mismo paso del adulto. | recetas, ítems |
| B1.3 | Nueva regla del validador, **riesgo heredado**: un paso que trabaja en un recipiente que estuvo en el fuego (`recipiente`: olla o sartén) hereda calor, salvo que antes haya un paso de enfriado (`enfria`). Si se quita el calor del paso de colar, la prueba automática falla. | `Motor.riesgoHeredado` |
| B2 | Cada receta trae `faltantes_posibles` (con el `ingrediente`) y `recetas.json` trae `situaciones`. El validador rechaza tres cosas: un faltante que la receta no lleva, un imprevisto repetido y una situación que no va con la receta. También rechaza las opciones viejas poco claras. | validador |
| Sección 3 | Se corrigieron los 11 ítems: pista de 6B, pasos de 4-zona-f4, consigna de 1-zona, devolución de 3-espacio-i5 y «otra persona» en 6-espacio-d5. | `chef_psp_v11.extras` |
| Sección 4 | Las 16 recetas quedan con `estado_clinico: validado por PSP-SR`. La pizza lleva agua y sal, los fideos y el yogur tienen alternativa sin TACC, y el plato se llama «Locro de verduras». El paso de la zanahoria da `zanahoria_rallada`; el validador revisa que en 3–5 no aparezca la zanahoria en trozos. **El desafío para casa ya aparece** con las cuatro recetas validadas (ensalada de frutas solo fuera de 3–5). | recetas |
| O5 | «Pedir una pista». | textos |
| O6 | «Cocinar con menos ayuda». | ficha |
| O7 | En 3–12, el menú de cada rincón muestra solo las variantes que habilita la persona adulta. Por defecto es la de base. La de mayor demanda se habilita en una casilla nueva de «Persona adulta» o cuando aparece «Hay retos nuevos para probar». En 13–18 elige el adolescente. | `elegirVariante` |
| O8 | En 7A el chef aparece con el utensilio y la acción («El chef: mezclar con cuchara. Ahora vos.»), con un movimiento corto que se apaga si el equipo pide menos movimiento. Al segundo y medio se resalta el botón. **Aclaración:** el cuadro vacío que vio PSP-SR era un error mío de la v0.1.1, que dejaba sin texto el modelo del chef. Ya está corregido y la prueba automática lo revisa. | `cocina` |
| Estado clínico | 174 ítems «validado por PSP-SR» y 39 «corregido, a revisar por PSP-SR». Es el mismo conteo de la respuesta. | banco |

**Imagen (pedido de la supervisora del 2026-11-22).** [Seguro] Todos los dibujos tienen ahora volumen, como en una película de animación 3D: degradé con luz desde arriba a la izquierda, contorno en un tono más oscuro del mismo color y una sombra suave. El chef y el ayudante son personajes nuevos y originales, de cabeza grande, ojos con brillo y mejillas. Todo está dibujado en código, con la paleta de marca, sin imágenes externas y sin tomar personajes ni estética de ninguna película. La interfaz (tipografía, botones, paneles) no cambió. [Suposición] Es una propuesta de estilo que espera la aprobación de la supervisora. Las ilustraciones finales siguen en el presupuesto de la Parte E.

**Para revisar por PSP-SR** (punto 7.3: solo lo nuevo o corregido): `propuestas/Chef_v0.1.2_items_corregidos_para_PSP-SR.json`, con 39 ítems.

**Preguntas nuevas**
- **T17. Ocho situaciones distintas por grado (REQ-CLI-CHF-16).** [Seguro] Después de B2 quedaron situaciones repetidas en Fácil, Intermedio y Difícil de 8B, y el validador no las aceptaba. Las resolví sin salir de tu tabla situación–receta:
  - 8-espacio-f3 pasa a bolitas de coco en el picnic;
  - 8-espacio-f7 pasa a tortas fritas en la juntada del club;
  - 8-espacio-i7 pasa a sándwiches en el picnic;
  - 8-espacio-d6 queda en «llevar algo a la escuela»;
  - 8-espacio-d7 queda en «cocinar para la familia».

  En los ítems nuevos el faltante sale de tu lista; en Intermedio se suma «Vienen dos amigos más». ¿Los validás?
- **T18. Dos detalles del anexo.** [Seguro]
  - En 8-espacio-d5 y d8, el imprevisto general que se copió todavía decía «Pagar con lo que no hay» y «Hacer lo mismo». Los pasé a las opciones nuevas.
  - En los ítems que copian los pasos de la pizza también quedó «Mezclar harina, levadura, agua y sal».
- **T19. Empanadas.** [Probable] «Cocinar el relleno» va en la sartén y el paso siguiente, «Rellenar las tapas», lo hace quien juega. ¿Hace falta un paso «El adulto deja enfriar el relleno»? Hoy el validador no lo marca, porque rellenar no usa la sartén.

**Pruebas.** [Seguro] La prueba de punta a punta pasa 924 de 924 verificaciones; ahora controla menos cosas en cada cierre de rincón porque el desafío solo aparece con recetas validadas. Se sumaron pruebas de B1, B2, CHF-16, O5 a O8 y del desafío. El validador devuelve cero observaciones.

---

## Parte I. Respuesta RT-CHF-001-R v1.2 · prototipo v0.1.3

**Para la supervisora, en una línea.** [Seguro] Están aplicadas las cuatro correcciones de PSP-SR y las dos condiciones de la decisión D4 sobre la imagen. Quedan 19 ítems para que PSP-SR los revise. Siguen el cartel «Contenido de prueba no validado» y el entorno de prueba.

**Cómo se aplicó.** [Seguro] Las correcciones están en el generador (`scripts/chef_psp_v12.py`, después de `chef_psp_v11.py`), así que el banco sale corregido cada vez que se genera. Comparé el banco nuevo con el de la v0.1.2: **cambiaron exactamente los 19 ítems de la sección 6 y ninguno más.**

| Punto | Qué se hizo | Dónde |
| --- | --- | --- |
| C1 | Cada receta declara `sabor` con tu tabla, y tostadas y tortas fritas son «los dos». Ya no aparecen en ningún ítem de dulce o salado. En el Rincón 1 se cambió la otra opción por una receta del sabor contrario, sin cambiar la condición del horno. Cuando la receta del ítem es de «los dos», la consigna pasa a **«Elegí una receta para la merienda.»** y la otra opción es un plato de cena (fideos con salsa, arroz con verduras o tarta de verdura). El dibujo de la receta usa un tercer color para «los dos». | recetas, 13 ítems |
| C1, validador | Rechaza una receta sin `sabor`, una receta de «los dos» en un ítem de dulce o salado, y una correcta que no tiene el sabor pedido. | validador |
| C2 | Si la receta tiene otro faltante que está en la lista, se usa ese. En 8-espacio-f7 es «El súper no tiene la harina de siempre.». Si no lo tiene, la lista del Rincón 2 suma el ingrediente que falta (i8, i9, d1, d3, d4, d6 y d7). Además, **el imprevisto del faltante va siempre después de buscar la lista** (f5, i3, d1, d3 y d6 lo tenían antes). | 8 ítems de C2 y f5, i3 |
| C2, validador | Rechaza un faltante que no está en la lista, un imprevisto de faltante que aparece antes de la búsqueda y un «No hay…» sin el campo `falta`. | validador |
| C3 | Empanadas: «El adulto cocina el relleno y lo deja enfriar». Tortas fritas: «El adulto fríe las tortas y las deja entibiar». Los dos pasos llevan `enfria` y la cantidad de pasos no cambia. | recetas, f7, i8, d4, d6 |
| C3, validador | Nueva regla `Motor.productoCaliente`: lo que sale de un paso con calor (el campo `produce`, por ejemplo el relleno o lo frito, o el ingrediente que se cocinó) solo lo usa quien juega si ese paso lo dejó enfriar. Si se quita el enfriado de las empanadas, la prueba automática falla en «Rellenar las tapas». | validador |
| C4 | La situación de 8-espacio-i9 es tu texto: «El domingo cocinás para varias personas. Falta un ingrediente y viene alguien más.». Ver T20. | 13–18 |
| Estado clínico | 194 ítems «validado por PSP-SR» y 19 «corregido según RT-CHF-001-R v1.2, a revisar por PSP-SR». Es el mismo conteo de tu sección 6. | banco |
| O9 | Queda para el banco v0.2.0, como pediste. | — |

**Decisión D4: imagen con volumen.** [Seguro] Están aplicadas las dos condiciones.
1. **Sin personajes con cara en 13–18.** Antes solo se ocultaban con estilos. Ahora, en esa ruta, el chef y el ayudante **no se dibujan**. La prueba automática juega toda la ruta 13–18 y revisa en cada pantalla que no aparezca ninguna cara, con un control que confirma que la revisión funciona.
2. **Contraste de 3:1 o más (WCAG 2.2, 1.4.11).** El contorno de cada dibujo se calcula para que tenga al menos 3:1 contra los 12 fondos donde aparecen los dibujos: tarjetas, mesada, estante, rincones y recetas. Si el tono del mismo color no alcanza, se oscurece hasta llegar. La prueba mide el contorno de todas las formas de ingredientes, utensilios y recetas. Ninguna baja de 3:1.

**Para revisar por PSP-SR** (punto 7.2: solo los 19): `propuestas/Chef_v0.1.3_items_corregidos_para_PSP-SR.json`. Cada ítem trae la lista de lo que cambió, la tabla de sabores y las dos recetas con enfriado.

**Preguntas nuevas**
- **T20. Largo de la consigna en 8-espacio-i9.** [Seguro] Tu texto de C4 tiene 83 caracteres, y la regla de 13–18 admite hasta 80 en la consigna. Lo dejé completo como situación, que es lo que se ve en pantalla al empezar. La consigna corta quedó en «El domingo cocinás para varias personas.», porque los dos imprevistos ya dicen el resto. ¿Te sirve así o preferís otro texto de 80 caracteres o menos?
- **T21. Opciones nuevas del Rincón 1.** [Probable] Las elegí con una regla fija: el sabor contrario y la misma condición del horno; para la merienda, un plato de cena. ¿Las validás? Los cambios por ítem están en el JSON.
- **T22. Orden del faltante.** [Probable] Moví el imprevisto del faltante después del Rincón 2 en cinco ítems, para que la persona pueda vincularlo con la lista que acaba de usar, como pide C2. ¿Lo dejamos como regla del validador?

**Pruebas.** [Seguro] La prueba de punta a punta pasa 936 de 936 verificaciones (12 nuevas: C1 a C4, el estado clínico, el validador roto a propósito y D4). El validador devuelve cero observaciones y el control de originalidad pasa.

---

## Parte J. RT-CHF-001-R v1.3, APR-CHF-001 y prototipo v0.1.4

**Para la supervisora, en una línea.** [Seguro] PSP-SR validó los 213 ítems y vos aprobaste el contenido clínico de la v0.1.3 (APR-CHF-001). El archivo aprobado está guardado sin cambios: `propuestas/AprenderSiendo_Chef_en_Accion_prueba_v0.1.3.html`, con el SHA-256 4354d094… del registro, verificado. La aprobación técnica sigue pendiente.

**v0.1.4 (APR-CHF-001, 3.1).** [Seguro] Es la v0.1.3 con el rótulo «Versión de prueba» y el aviso de la persona adulta actualizado; no cambia nada más. El detalle completo y la verificación byte por byte están en `propuestas/Chef_v0.1.4_cambios_respecto_de_v0.1.3_para_aprobacion.md`. Necesita su propio registro de aprobación.

**T20, T21 y T22.** [Seguro] Quedan como las validó PSP-SR. Pasan a ser reglas fijas del generador en v0.2.0:
- T21: sabor contrario y misma condición de horno; para la merienda, un plato de cena.
- T22: un imprevisto de faltante nunca aparece antes de la búsqueda del Rincón 2. El validador ya lo controla desde la v0.1.3.

**v0.2.0.** [Seguro] Arranca con todas las reglas acumuladas (B1, B2, C1 a C3, T21, T22, O9 y la opción «Volver sin comprar» para la harina) y los mínimos de T12. Va en una versión aparte, para no tocar la v0.1.4 que espera aprobación.

---

## Parte K. Banco v0.2.0 (RT-CHF-001-R v1.3, sección 4)

**Para la supervisora, en una línea.** [Seguro] El banco de prueba v0.2.0 tiene 585 ítems y cumple los mínimos de T12 en todas las combinaciones. Los 372 ítems nuevos esperan la revisión de PSP-SR, así que esta versión vuelve a mostrar «Contenido de prueba no validado». No reemplaza a la v0.1.4 que espera aprobación.

**Qué se hizo.** [Seguro] El banco nuevo sale de `scripts/chef_v020.py`, que parte del banco v0.1.3 validado y lo amplía.

| Punto | Qué se hizo |
| --- | --- |
| T12 | 12 ítems por variante y grado en 6–8 y 9–12, y 8 en 3–5 donde la ficha ofrece esa ruta. 8B tiene 12 por grado. Ninguna combinación queda por debajo del mínimo, y el validador lo controla desde la versión 0.2.0. |
| Reglas fijas | B1 y C3 (pasos de las recetas corregidas), B2 (faltantes de la receta y situación admitida), C1 y T21 (sabor contrario con la misma condición de horno; merienda con plato de cena) y C2 y T22 (faltante en la lista y después de buscarla). |
| Harina | La opción incorrecta del imprevisto de la harina es siempre «Volver sin comprar», también en 8-espacio-f7. |
| O9 | «Hoy hay un cumpleaños.» y «Vienen visitas a cenar.», en la tabla y en los ítems. |
| Regla nueva | Ningún imprevisto aparece después de cocinar. Los 213 ítems validados ya la cumplían; la sumé al validador para los nuevos. |
| CHF-16 | Cada grado de 8B tiene 8 situaciones o más, sin repetir situación y receta en el mismo grado. |
| Estado clínico | 206 validados por PSP-SR, 7 cambiados por O9 o por la harina (a revisar) y 372 nuevos pendientes de PSP-SR. |

**Para revisar por PSP-SR (T10).** `propuestas/Chef_v0.2.0_banco_para_PSP-SR.json` trae:
- las plantillas nuevas, en 12 líneas;
- los 7 ítems cambiados, con lo que cambió;
- una muestra de 96 ítems (2 nuevos por variante y grado);
- los 372 ítems nuevos completos.

**Preguntas nuevas**
- **T23. Plantillas nuevas.** [Probable] Sumé consignas que no estaban en la v0.1.3. Algunas son «¿Cuál es salada?», «¿En qué cajón hay menos?» y «¿Alcanza con una docena?». También hay dependencias, situaciones de «Mientras…» y consecuencias nuevas en 4B, y tamaños con concordancia en 6A. ¿Las validás?
- **T24. Muestra.** [Probable] ¿Te alcanza con 2 ítems nuevos por variante y grado (96 en total), o preferís otra muestra?
- **T25. Imprevistos después de cocinar.** [Probable] ¿Dejamos como regla que ningún imprevisto aparezca después de cocinar?

**Lo que falta para la v0.2.0.** [Seguro] El banco propio de 13–18 lo escribe PSP-SR con estas plantillas (T16). La lista vertical de 4B (T7) sigue pendiente.

**Pruebas.** [Seguro] La prueba de punta a punta pasa 928 de 928 verificaciones; con el banco más grande cambia la cantidad de cierres que se revisan. Las pruebas nuevas cubren T12 (y el validador roto a propósito), la harina, O9, T21 y CHF-16. El validador devuelve cero observaciones y el control de originalidad pasa.

## Parte L. RT-CHF-001-R v1.4, decisión D5, v0.1.5 y banco v0.2.1

**O1 · orden parcial.** [Seguro] Implementado en el generador, el validador y la corrección (`scripts/chef_o1.py`).
- Cada paso de receta declara `antes_de`. Por defecto van en cadena; tostadas, yogur con cereales, ensalada verde y bizcochuelo siguen la tabla de O1.
- Un ítem o etapa de ordenar con pasos intercambiables lleva `orden_parcial` y acepta cualquier paso cuyos anteriores ya estén puestos. La ayuda resalta un paso que se puede poner.
- El validador rechaza un ítem de ordenar con pasos intercambiables sin `orden_parcial`, y un `orden_parcial` que no coincide con la receta.

**v0.1.5 (D5).** [Seguro] Es la v0.1.4 más O1 y nada más. Cambia la corrección de los 11 ítems de la lista. SHA-256 `e33d96e73d162259b86206ad8acc1481669341eca084deba14f896f8dd4034a1`. Los cambios respecto de la v0.1.3, verificados byte por byte, están en `propuestas/Chef_v0.1.5_cambios_respecto_de_v0.1.3_para_aprobacion.md`. APR-CHF-002 queda sin efecto.

**Banco v0.2.1.** [Seguro] Es el v0.2.0 con O1 y la sección 3 (`scripts/chef_psp_v14.py`). Fuera de los ítems corregidos, el banco es igual al v0.2.0, campo por campo.
- **O1:** 24 ítems cambian de corrección, los 11 de la v0.1.3 y 13 nuevos: 4-zona-i5 e i7, 6-espacio-d6, d7 y d11, el Rincón 4 de 8-zona-f7, f10, f12 y d6, y el de 8-espacio-i10, i11, d10 y d11.
- **Los 22 corregidos,** como pediste.
  - En 4-zona Difícil el error queda repartido 4, 4 y 4 entre el primer par, el del medio y el último, contando d1 a d4.
  - 4-zona-d7, d10 y d12 siguen en el último par.
- **1-espacio-i5.** Lo alcanza la regla «en tu casa». Estaba validado en v0.1.3, y pasó a «Hoy hay juntada. Son 6 y no hay horno. ¿Qué preparás?». Necesito que lo confirmes.
- **Estado:** 562 validados y 23 a revisar por PSP-SR.

**Reglas nuevas del validador.** [Seguro]
- Ningún texto dice «en tu casa» ni «tu familia».
- No se pregunta por un ingrediente que casi todo lleva (sal).
- El lavado no puede incluir utensilios con filo.
- Si se piden más de 12, la situación justifica la cantidad.
- En «¿Cuál elegís?», las dos recetas tienen distinto tiempo y distintas porciones.
- Con dos faltantes, el reemplazo del segundo no usa un ingrediente que ya faltó.
- En «¿Qué paso cambiarías de lugar?»:
  - los pasos cambiados no se pueden invertir;
  - en cada variante y grado, ningún lugar del error tiene más de la mitad de los ítems.
- Ningún imprevisto aparece después de cocinar (T25), como regla fija.

Cada regla se probó rompiendo el banco a propósito.

**Preguntas nuevas.** [Probable]
- **T26.** En 8-zona-d3, 8-espacio-f1 e i2, los tres pasos del Rincón 4 de la ensalada no dependen entre sí, así que cualquier orden vale. ¿Le sumamos «Poner todo en el bol» para que haya un paso que vaya último?
- **T27.** En fideos con salsa, «Hervir los fideos» y «Calentar la salsa» parecen intercambiables. Lo mismo pasa en arroz con verduras con «Cortar las verduras» y «Hervir el arroz». No están en la tabla de O1. ¿Los sumo?
- **Sugerencia «Rinde más porciones».** No la apliqué todavía, porque cambiaría 12 ítems ya validados (1-espacio-d1 a d12). Si la querés, la aplico en la próxima versión.

**Envío.** [Seguro] Solo los ítems corregidos y la lista de O1, en `propuestas/Chef_v0.2.1_items_corregidos_y_O1_para_PSP-SR.json`.

**Pruebas.** [Seguro]
- v0.1.5: 946 de 946 verificaciones.
- v0.2.1: 940 de 940 verificaciones.
- El validador devuelve cero observaciones y el control de originalidad pasa.


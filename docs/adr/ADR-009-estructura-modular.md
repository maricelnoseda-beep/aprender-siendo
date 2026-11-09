# ADR-009 — Estructura modular del portal

- **Estado:** opción C aprobada por la supervisora (2026-11-09) con un ajuste: la interfaz del «index (1)» que aportó y el Manual de marca (`docs/marca/`) son la identidad visual vinculante; la reestructura no la modifica. Fase 1 implementada; fase 2 pendiente. Falta la validación del responsable técnico cuando se designe.
- **Reemplaza:** ADR-003 (beta en un solo archivo).
- **Trazabilidad:** DEV-IA §3 (capa de aplicación: portal accesible, modo liviano y sin conexión, tres áreas), §7 (regresión completa; rendimiento en móviles de gama baja y conexiones lentas), §8 (mismo artefacto aprobado, verificado por huella; interruptores por herramienta); ADR-001 (Cloudflare Pages + Supabase); RT-MEJ-001 (ADR-005 a 008).

---

## Resumen para la supervisora (sin jerga)

**Tenés razón en lo importante, con dos matices.**

1. **[Seguro] Hoy el portal se entrega como un solo archivo** de unos 338 KB (beta 2). Cualquier persona que entra descarga todo: un chico que va a jugar descarga también los informes del profesional y el panel de administración.
2. **[Seguro] Ese archivo no es pesado todavía.** Comprimido, como viaja por internet, ocupa unos 100 KB: menos que una foto de celular, y menos de una décima parte de la imagen de marca (1,3 MB). Hoy carga bien incluso con datos móviles.
3. **[Probable] El problema es hacia adelante.** Cada herramienta nueva (simulador, biblioteca, generador de materiales, pesquisa) se suma a ese mismo archivo. Con 10 o 15 herramientas, todos descargarían todo y los celulares básicos lo notarían.
4. **[Seguro] El problema más serio no es el peso, es la aprobación.** La regla del proyecto es que a producción llega exactamente lo aprobado. Con un solo archivo, cambiar una coma en un juego cambia "el" archivo, y técnicamente hay que volver a aprobar todo el portal. Con módulos, se aprueba y se retira cada herramienta por separado.
5. **Matiz 1: "subpáginas independientes" no del todo.** Hay piezas que tienen que ser una sola para todo el portal: el ingreso con usuario, los permisos (quién ve a qué paciente), las reglas de seguridad infantil y la accesibilidad. Si cada subpágina tuviera su propia copia, tarde o temprano una quedaría desactualizada, y eso sería un riesgo para los chicos. Por eso propongo **un núcleo común + una carpeta por herramienta**.
6. **Matiz 2: el código ya está dividido por partes** (pantallas, datos, contenido, actividades). Lo único que se junta en un archivo es lo que se publica. O sea que el cambio no es empezar de cero: es dejar de juntarlo al final.

**Qué cambia para quien usa el portal:** cada sección tiene su propia dirección (por ejemplo `aprendersiendo.ar/profesional/informes`), se puede guardar en favoritos, carga más rápido la primera vez y funciona sin conexión lo que ya se usó.

**Qué te pido decidir:** si aprobás esta dirección. Recomiendo **no** aplicarla sobre la beta 2 que está revisando PSP-SR, sino en la versión siguiente (ver "Cuándo").

---

## Contexto técnico

Medición sobre la rama de la beta 2 (PR #4, `0.4.0-beta2`), 2026-11-09:

| Pieza | Tamaño | Comprimido (gzip) |
| --- | --- | --- |
| `app/src/app.js` (pantallas de todos los perfiles) | 113 KB | 33 KB |
| `app/tools/isla-de-juegos.html` (incrustado como texto) | 57 KB | 20 KB |
| `app/src/styles.css` | 38 KB | 9 KB |
| `app/src/store.js` (datos y permisos) | 34 KB | 10 KB |
| `app/src/child.js` (modo niño) | 28 KB | 8 KB |
| `app/src/content.js` (contenido clínico, REVISAR) | 19 KB | 8 KB |
| **`beta2/index.html` completo** | **338 KB** | **≈100 KB** |

[Seguro] `app/build.py` concatena todos los fuentes y la Isla de Juegos en un único HTML. [Seguro] `app/src/app.js` mezcla pantallas de familia, profesional y administración en un solo archivo de ~1.100 líneas: es el punto de mayor fricción de mantenimiento. [Seguro] La navegación es interna (`go(view)`), sin direcciones propias por sección.

ADR-003 eligió un solo archivo para que la beta se pudiera abrir con doble clic, sin servidor. Esa ventaja deja de pesar cuando se publica en Cloudflare Pages (ADR-001), que sirve muchos archivos sin costo extra.

## Opciones evaluadas

| Opción | A favor | En contra |
| --- | --- | --- |
| A. Seguir con un solo archivo | Nada que cambiar; se abre sin servidor | Todo se descarga siempre; un cambio mínimo obliga a reaprobar todo; `app.js` crece sin límite |
| B. Subpáginas totalmente independientes (cada una con su copia de ingreso, permisos y reglas) | Cada sección es autónoma | Duplica guardrails y permisos: riesgo de que una copia quede desactualizada (DEV-IA §6); sesión y accesibilidad inconsistentes |
| **C. Núcleo común + módulos por área y por herramienta, cada uno con su dirección, cargados solo cuando se abren** | Se descarga solo lo que se usa; aprobación y retiro por herramienta; guardrails en un único lugar; funciona sin conexión con lo ya visitado | Requiere un paso de armado algo más elaborado y un manifiesto de versiones |
| D. Adoptar un framework grande (React, Next.js, etc.) | Ecosistema amplio | Más peso para celulares básicos, más dependencias que auditar (DEV-IA §6.1, cadena de suministro); no lo exige ninguna FEC |

## Decisión propuesta

**Opción C**, con JavaScript estándar del navegador (módulos ES) y sin framework, siguiendo el principio de la solución más simple.

### Estructura de carpetas

```
app/
  modulos.json                orden de carga, estilos y versión del portal
  build.py                    arma dist/ (modular) o dist-un-archivo/ (--un-archivo)
  nucleo/                     una sola copia para todo el portal; cambiarlo exige regresión completa
    recursos.js               carga de recursos a demanda (y versión incrustada)
    reglas.js                 reglas deterministas (código, nunca modelo)
    datos.js                  capa de datos simulada y permisos (futura API, ADR-001)
    indicadores.js            indicadores de seguimiento calculados en código
    ilustraciones.js, marca.js   escenas, símbolo
    motor-actividades.js      motor común de rondas; cada herramienta se registra aparte
    utilidades.js, interfaz-comun.js, render.js, arranque.js   sesión, encabezado, Luci, pie, navegación
    estilos/                  identidad.css (estándar de interfaz + Nunito), portal.css, actividades.css
    fuentes/                  Nunito (licencia OFL)
    imagenes/                 símbolo, Luci, escenas por perfil
    animales/                 catálogo de 31 animales en 5 categorías, 10 expresiones cada uno
  contenido/contenido.js      textos para personas y umbrales (REVISAR: PSP-SR y supervisora)
  areas/                      inicio, ninos, familia, profesional, cuenta, administracion, legal
  herramientas/               isla-de-juegos, memoria, secuencias, distinto, contar, clasificar
    <id>/herramienta.js       mecánica
    <id>/modulo.json          id, nombre, versión, FEC, estado, interruptor
tests/                        reglas (sin navegador) y punta a punta
```

### Reglas de la estructura

1. **Una herramienta solo usa el núcleo; nunca importa a otra herramienta.** Una prueba automática lo verifica. Así un cambio en una herramienta no puede romper otra.
2. **El contenido clínico queda aislado** en `contenido.js` de cada herramienta, como hoy en `content.js`. PSP-SR revisa solo esos archivos y el manifiesto.
3. **El modo niño siempre pasa por `reglas-infantiles.js`.** `navegacion.js` no deja abrir una herramienta del área niños sin ese envoltorio (T01, T07, T09 de PSP-SR).
4. **Carga a demanda:** la portada de cada área descarga el núcleo y su propia pantalla; una herramienta se descarga al abrirla. Las rutas de cada perfil no descargan las de otros perfiles.
5. **Sin conexión:** un service worker (programa del navegador que guarda copias locales) conserva el núcleo y las herramientas ya usadas. Cumple "modo liviano y sin conexión" (DEV-IA §3).
6. **Presupuesto de peso** controlado por la integración continua: núcleo ≤ 60 KB comprimido; cada herramienta ≤ 40 KB comprimido; la portada de cada área, con todo lo que necesita para abrir, ≤ 120 KB. [Suposición: umbrales iniciales, se ajustan con la medición en un celular de gama baja con red 3G simulada]

### Versiones, aprobación y despliegue por módulo

- Cada módulo tiene versión y huella (hash) propias. Un **manifiesto del portal** lista qué versión de cada módulo está publicada.
- **Aprobación por herramienta:** un cambio que toca solo `herramientas/X/` requiere batería de esa herramienta + prueba de punta a punta de humo, y doble aprobación sobre la nueva huella de X. [Probable] Lo valida el responsable técnico.
- **Aprobación del núcleo:** un cambio en `nucleo/` requiere la batería completa de todas las herramientas (DEV-IA §7.4) y doble aprobación del núcleo. El núcleo es la parte que nunca se aprueba "por partes".
- `scripts/check_approvals.py` pasa a verificar, por cada módulo del manifiesto, que su huella tenga los dos registros de aprobación. Producción sigue bloqueada técnicamente si falta uno (DEV-IA §8).
- **Retiro de emergencia:** el interruptor desactiva una herramienta en el manifiesto sin tocar las demás; la herramienta muestra un aviso de "no disponible por ahora" (texto a definir por PSP-SR).

### Compatibilidad con celulares básicos y conexión lenta

- [Probable] La primera carga de un chico o una familia baja de ~100 KB (todo) a ~50–70 KB (núcleo + su área), y las visitas siguientes casi no descargan nada gracias al service worker.
- Sin framework y sin librerías nuevas: menos código para interpretar en celulares de gama baja.
- Las fuentes de Google se pueden alojar en el propio dominio para no depender de otra conexión (además evita enviar la dirección IP a un tercero). [Probable]
- Se mantiene la opción de armar **un solo archivo** para la demo portable y para los paquetes de revisión de PSP-SR, que hoy se revisan sin servidor.

## Implementación

**Fase 1 (hecha, 2026-11-09)**

- Interfaz del «index (1)» llevada a los archivos fuente sin cambios: la versión `--un-archivo` reproduce las mismas hojas de estilo, el mismo catálogo de animales y el mismo código, salvo el registro de cada herramienta en su archivo y la carga a demanda de Isla de Juegos.
- Separación en núcleo, contenido, áreas y herramientas (tabla de arriba). Cada área y herramienta tiene su `modulo.json`.
- Imágenes, fuente y documento de Isla de Juegos como archivos aparte: se descargan solo cuando aparecen en pantalla. La fuente viaja en WOFF2 (misma fuente, empaque comprimido).
- `dist/manifiesto.json` con la huella de cada archivo y de cada módulo; el bloqueo de producción verifica todos los archivos contra el manifiesto.
- Verificación: las 13 capturas de la prueba de punta a punta comparadas píxel a píxel entre la referencia y la versión modular (idénticas, salvo la flotación de Luci en celular, que es animación) y la prueba de punta a punta y las 39 pruebas de reglas en verde.

**Fase 2 (pendiente)**

- Dirección propia por sección (`/profesional/informes`) y carga del código de cada área solo al entrar.
- Service worker para uso sin conexión.
- Aprobación por módulo en `check_approvals.py` (requiere acuerdo del responsable técnico, pregunta 2).
- Presupuesto de peso controlado por la integración continua.

## Cuándo y cómo (planteo original)

1. **No ahora sobre la beta 2.** PSP-SR está revisando PAQ-BETA2 sobre la versión `0.4.0-beta2`. Reorganizar archivos en esa rama cambiaría todo lo que está en revisión y obligaría a repetirla. [Seguro]
2. Con la decisión de la supervisora, abro una rama aparte y hago la migración **sin cambiar ningún texto ni comportamiento**: mismas pantallas, misma batería de pruebas pasando antes y después. Primero sale la Isla de Juegos (ya es un archivo aparte) y las 5 actividades; después familia, profesional y administración.
3. Una vez aprobada la beta 2, se integra la reestructura y la versión siguiente ya se revisa por módulo.
4. Costo estimado: [Suposición] dos a tres jornadas de trabajo de DEV-IA, sin costo de infraestructura adicional (Cloudflare Pages ya lo cubre).

## Consecuencias

- ADR-003 queda reemplazado al aprobarse este ADR.
- El paquete de revisión para PSP-SR pasa a listar los módulos que cambiaron y su huella, en lugar de un único archivo.
- Hace falta definir con el responsable técnico el circuito abreviado de aprobación por herramienta (DEV-IA §8).

## Preguntas abiertas

1. Supervisora: ¿aprobás la opción C y el orden propuesto (después de cerrar la revisión de la beta 2)?
2. Responsable técnico (a designar): ¿acepta que un cambio limitado a una herramienta se apruebe con la batería de esa herramienta más la prueba de humo, y no la batería completa?
3. PSP-SR: ¿prefiere seguir recibiendo un archivo único para revisar, además de la lista de módulos cambiados?

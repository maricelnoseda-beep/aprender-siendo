# Aprender Siendo

App de recursos psicopedagógicos para consulta y hogar, con participación de las familias, supervisión profesional y seguimiento de la experiencia del paciente. Dominio: aprendersiendo.ar.

> **Estado: beta 2 (0.4.0-beta2) con estructura modular e interfaz de marca (2026-11-09).** Datos ficticios, todo en el navegador. **No usar con datos reales.** Ninguna versión está aprobada para producción (ver `approvals/`).

## Probar
```
python3 app/build.py                         # versión modular en app/dist/ (la que se publica)
(cd app/dist && python3 -m http.server 8765)  # abrir http://localhost:8765/
python3 app/build.py --un-archivo            # un solo HTML en app/dist-un-archivo/ (demo sin servidor, paquete de revisión)
python3 app/build.py --explorapalabras       # Explorapalabras solo, para probar con doble clic (app/dist-explorapalabras/)
python3 app/build.py --luci                  # Aventura de búsqueda con Luci sola, para probar con doble clic (app/dist-luci/)
python3 app/build.py --cerditos              # «Los tres cerditos» (5 actividades por Estaciones), para probar con doble clic (app/dist-cerditos/)
```
Cuentas de demostración en la portada. Contraseña: `beta2026`.

## Estructura (ADR-009: núcleo común + áreas + herramientas)
| Ruta | Qué hay |
| --- | --- |
| `app/modulos.json` | Orden de carga, estilos y versión |
| `app/nucleo/` | Una sola copia para todo el portal: datos y permisos (`datos.js`), reglas en código (`reglas.js`), indicadores (`indicadores.js`), encabezado, Luci, navegación, estilos, fuente, imágenes y animales. **Un cambio acá exige la batería completa** |
| `app/contenido/contenido.js` | **Contenido clínico y textos para personas (BORRADOR, REVISAR por PSP-SR y la supervisora)** |
| `app/areas/<área>/` | Inicio, niños (aventuras), familia, profesional, cuenta, administración, textos legales |
| `app/herramientas/<id>/` | Una carpeta por herramienta (`herramienta.js` + `modulo.json`): Isla de Juegos, Memoria, ¿Qué sigue?, Encontrá el distinto, Contar y elegir, Ordená por color o forma, Explorapalabras (con `banco.json` de prueba y ficha de Estaciones en `modulo.json`; ver `docs/herramientas/RT-EXP-001_explorapalabras.md`), Aventura de búsqueda con Luci (FEC-013, título de trabajo; láminas de relleno en `banco.json`, ficha por variante y grado en `modulo.json`; ver `docs/herramientas/RT-LUC-001_aventura_luci.md`), Los tres cerditos (5 actividades × 3 grados, escala de apoyos 0–3 y registro mínimo; banco de prueba en `banco.json`; ver `docs/herramientas/RT-CER-001_los_tres_cerditos.md`) |
| `docs/marca/` | **Manual de marca y guía de interfaz: vinculantes para todo cambio o agregado** |
| `tests/e2e.js`, `tests/rules.test.js`, `tests/explorapalabras.test.js`, `tests/luci.test.js`, `tests/luci.e2e.js`, `tests/cerditos.test.js`, `tests/cerditos.e2e.js` | Punta a punta (con `SEMILLA=1` para comparar capturas) y reglas deterministas |
| `docs/adr/` | Decisiones: alojamiento (001), proveedor de IA (002), beta en un archivo (003, reemplazada), estructura modular (009) |
| `scripts/originalidad.py` | Sección 0 de FEC-013: busca nombres de la obra original en todo el repositorio por huellas (el control no contiene los nombres) |
| `approvals/`, `scripts/check_approvals.py` | Registros de aprobación y bloqueo técnico del pase a producción (huella de `app/dist/manifiesto.json`) |
| `.github/workflows/` | CI, despliegue al entorno de prueba y pase a producción con doble aprobación |

## Camino a la beta con personas reales
1. FEC de PSP-SR para el contenido (actividades, edades, umbrales, textos).
2. Designar responsable técnico.
3. Crear las cuentas de Cloudflare y Supabase (ADR-001) y cargar los secretos en GitHub.
4. Reemplazar `store.js` por Supabase con permisos RLS, segundo factor real y correo transaccional.
5. Revisión jurídica de los textos legales y de la transferencia internacional; inscripción ante la AAIP.
6. Batería de evaluación y doble aprobación registrada sobre la misma versión.

Necesidad de origen: NEC-002 (carpeta compartida del proyecto).

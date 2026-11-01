# Aprender Siendo

App de recursos psicopedagógicos para consulta y hogar, con participación de las familias, supervisión profesional y seguimiento de la experiencia del paciente. Dominio: aprendersiendo.ar.

> **Estado: beta de demostración v0.2.0 (2026-11-01).** Datos ficticios, todo en el navegador. **No usar con datos reales.** Ninguna versión está aprobada para producción (ver `approvals/`).

## Probar
```
python3 app/build.py            # genera app/dist/index.html
open app/dist/index.html        # o abrirlo con doble clic
```
Cuentas de demostración en la portada. Contraseña: `beta2026`.

## Estructura
| Ruta | Qué hay |
| --- | --- |
| `app/src/content.js` | **Contenido clínico y textos para personas (BORRADOR, REVISAR por PSP-SR y la supervisora)** |
| `app/src/store.js` | Capa de datos simulada y permisos por rol (futura API) |
| `app/src/followup.js` | Indicadores de seguimiento, calculados en código |
| `app/src/activities.js` | Mecánicas de las 5 actividades |
| `app/src/illustrations.js`, `avatars.js` | Ilustraciones y logo originales en SVG |
| `app/src/app.js`, `styles.css` | Pantallas y estilo |
| `tests/e2e.js` | Prueba de punta a punta de los tres perfiles |
| `docs/adr/` | Decisiones: alojamiento (001), proveedor de IA (002), beta en un archivo (003) |
| `approvals/`, `scripts/check_approvals.py` | Registros de aprobación y bloqueo técnico del pase a producción |
| `.github/workflows/` | CI, despliegue al entorno de prueba y pase a producción con doble aprobación |

## Camino a la beta con personas reales
1. FEC de PSP-SR para el contenido (actividades, edades, umbrales, textos).
2. Designar responsable técnico.
3. Crear las cuentas de Cloudflare y Supabase (ADR-001) y cargar los secretos en GitHub.
4. Reemplazar `store.js` por Supabase con permisos RLS, segundo factor real y correo transaccional.
5. Revisión jurídica de los textos legales y de la transferencia internacional; inscripción ante la AAIP.
6. Batería de evaluación y doble aprobación registrada sobre la misma versión.

Necesidad de origen: NEC-002 (carpeta compartida del proyecto).

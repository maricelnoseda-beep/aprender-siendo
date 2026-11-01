# ADR-001 — Alojamiento de la app

- **Estado:** propuesto por DEV-IA (2026-11-01), elegido por delegación de la responsable del proyecto. Pendiente de validación del responsable técnico cuando se designe.
- **Trazabilidad:** NEC-002 §5, §7, §9; DEV-IA §3, §8, §9; PSP-SR §9.4.

## Contexto
La app trata datos de salud de niñas, niños y adolescentes (datos sensibles, Ley 25.326 arts. 2 y 7). Hace falta: dos entornos separados (prueba y producción), autenticación con segundo factor, permisos por rol en la base de datos, cifrado en tránsito y en reposo, copias de seguridad, y poca carga operativa porque todavía no hay responsable técnico. El dominio aprendersiendo.ar ya está comprado.

## Opciones evaluadas
| Opción | A favor | En contra |
| --- | --- | --- |
| **A. Cloudflare Pages (interfaz) + Supabase en San Pablo (base de datos, autenticación y funciones)** | Servicio administrado; PostgreSQL con permisos por fila (RLS) para aplicar los roles en la base; autenticación con segundo factor TOTP; región sa-east-1 (la más cercana); plan gratuito para el entorno de prueba | Datos fuera de Argentina; depende de dos proveedores |
| B. Google Cloud Run + Cloud SQL (southamerica-east1) | Más control, un solo proveedor | Más operación: redes, parches, usuarios; costo base mayor |
| C. Cloudflare Workers + D1 | Todo en un proveedor, muy económico | [Probable] D1 no ofrece ubicación en Sudamérica; base menos madura para datos clínicos |
| D. Servidor propio (VPS) en Argentina | Datos en el país | Toda la seguridad y la operación a cargo del equipo; riesgo alto sin responsable técnico |

## Decisión
**Opción A.**
- **Interfaz:** Cloudflare Pages. `beta.aprendersiendo.ar` para el entorno de prueba, `app.aprendersiendo.ar` para producción. DNS del dominio en Cloudflare.
- **Servidor:** dos proyectos Supabase separados (`aprender-siendo-prueba` y `aprender-siendo-produccion`) en San Pablo. Identidad (correo, pago) en un esquema separado de los datos clínicos (código de paciente, registros), vinculados por un identificador interno (DEV-IA §9).
- **Permisos** con políticas RLS que reproducen las reglas que hoy están en `app/src/store.js` (`canSeePatient`): la profesional ve solo sus pacientes, la familia solo los vinculados y la administración ningún registro individual.
- **Secretos:** solo en los gestores de secretos de GitHub, Cloudflare y Supabase. Nunca en el código ni en mensajes.

## Consecuencias
- [Probable] Transferencia internacional: Brasil no figura entre los países con protección adecuada reconocidos por la AAIP. Hace falta un contrato con cláusulas modelo (Ley 25.326 art. 12) y revisión jurídica **antes** de cargar datos reales. Si la revisión lo desaconseja, se pasa a la opción D con un proveedor argentino certificado.
- Hay que inscribir las bases ante la AAIP (PSP-SR §9.4).
- [Suposición] Costo: entorno de prueba gratis. Producción estimada en el plan pago inicial de cada proveedor; se confirma al dimensionar la cantidad de usuarios.
- Lo que tiene que hacer la responsable: crear las cuentas de Cloudflare y Supabase a nombre del proyecto y dar acceso al responsable técnico. DEV-IA no recibe contraseñas.

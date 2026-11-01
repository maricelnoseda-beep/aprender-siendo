# ADR-004 — Medio de pago y cobro de la suscripción

- **Estado:** propuesto por DEV-IA (2026-11-01). Condiciones comerciales decididas por la responsable del proyecto. Pendiente de validación del responsable técnico cuando se designe, de revisión jurídica de los textos y de las dos aprobaciones antes de producción.
- **Trazabilidad:** DEV-IA §4 (pagos en código), §8 (doble aprobación), §9 (identidad separada; pasarela PCI DSS; aviso previo y baja simple); PSP-SR §8 (prueba gratuita, consentimiento expreso, baja tan simple como el alta) y §9.4.

## Contexto
Al terminar los 15 días de prueba gratuita, la app pasa a ser paga. Condiciones decididas por la responsable (2026-11-01): **suscripción mensual de US$ 20** y **opción anual con 10 % de descuento (US$ 216)**. La mayoría de los usuarios están en Argentina. El portal no debe ver ni guardar datos de tarjeta.

## Opciones evaluadas
| Opción | A favor | En contra |
| --- | --- | --- |
| **A. Mercado Pago, Suscripciones (preapproval)** | Medio más usado en Argentina; tarjetas de crédito y débito locales y dinero en cuenta; página de pago alojada por Mercado Pago (certificada PCI DSS); cobro recurrente y cancelación por API; avisos firmados | Cobra en pesos: hay que convertir el precio en dólares; comisión por cobro [Probable: verificar la tarifa vigente en la cuenta] |
| B. Stripe | Excelente API, cobra en dólares | [Probable] No abre cuentas a empresas radicadas en Argentina; exigiría una sociedad en el exterior |
| C. Google Pay / Google Wallet | Conocido por el usuario | No es un procesador: es una billetera que necesita otro procesador detrás. Google Play Billing solo sirve para apps publicadas en Play Store y cobra 15 % o más |
| D. PayPal / dLocal | Cobro en dólares o internacional | PayPal es poco usado en Argentina para pagos locales; dLocal apunta a volúmenes grandes y requiere contrato |

## Decisión
**Opción A: Mercado Pago Suscripciones**, con el pago en la página de Mercado Pago.
- **Reglas en código** (`server/supabase/functions/_shared/billing-rules.mjs`, fuente única que también usa la beta): planes, montos en centavos, conversión a pesos, acceso, gracia, arrepentimiento y verificación de firma. Ningún modelo de lenguaje participa.
- **Servidor** (Supabase Edge Functions): `suscripcion-iniciar`, `suscripcion-cancelar`, `suscripcion-arrepentimiento`, `suscripcion-estado` y `webhook-mercadopago`. El navegador solo elige "mensual" o "anual"; el monto lo calcula el servidor.
- **Avisos de Mercado Pago:** se verifica la firma `x-signature` (HMAC-SHA256 con la clave secreta) y la antigüedad; después se relee el recurso desde la API con nuestra credencial y se compara referencia, moneda, monto y frecuencia. Cada aviso y cada pago se procesan una sola vez. Si algo no coincide, no se habilita acceso y queda una alerta para la administración.
- **Datos:** esquema `billing` separado de los datos clínicos, sin datos de tarjeta, con permisos por fila (cada persona ve solo lo suyo; solo el servidor escribe). Función `billing.tengo_acceso()` para usar en los permisos de los datos de la app.
- **Consentimiento y baja:** casilla expresa con versión del texto registrada; cancelación en un paso desde «Mi cuenta» (se respeta lo ya pagado); botón de arrepentimiento visible en el pie (10 días, Ley 24.240 art. 34 y Res. SCI 424/2020). El reembolso lo ejecuta una persona en Mercado Pago (acción con dinero: control humano).
- **Precio en pesos:** tipo de cambio fijado por la responsable en `billing.config`. Si no está cargado, no se puede suscribir nadie (falla cerrado). Un cambio afecta solo a suscripciones nuevas; actualizar las vigentes exige aviso previo y es una decisión comercial pendiente.

## Consecuencias
- Hace falta una cuenta de Mercado Pago de la responsable (ver `docs/cobros-mercado-pago.md`) y facturar los cobros: inscripción en ARCA (monotributo u otro régimen) [Probable: consultar con contador].
- Las credenciales de PRUEBA van al entorno de prueba; las de PRODUCCIÓN las carga solo el responsable técnico en el gestor de secretos de Supabase. DEV-IA no las recibe.
- [Probable] En suscripciones, Mercado Pago puede exigir que el correo del pagador coincida con su cuenta de Mercado Pago; se valida en el entorno de prueba con usuarios de prueba.
- [Probable] Formato de la firma y de los avisos según la documentación vigente de Mercado Pago (2026); se confirma con el simulador de avisos del panel antes de aprobar.
- La beta de demostración simula el pago (sin Mercado Pago ni campos de tarjeta) con las mismas reglas.
- El servidor no está desplegado: depende de ADR-001 (cuentas de Supabase), del responsable técnico y de las dos aprobaciones.

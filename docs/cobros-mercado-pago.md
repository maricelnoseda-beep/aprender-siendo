# Cobros con Mercado Pago: qué hace la responsable del proyecto

Guía paso a paso. **Ninguna clave se le pasa a DEV-IA ni se escribe en mensajes ni en el repositorio:** se cargan directo en el gestor de secretos de Supabase.

## Antes de empezar (decisiones y trámites)
1. **Precio en pesos.** Mercado Pago cobra en pesos. Hay que decidir el tipo de cambio que se usa para convertir US$ 20 y US$ 216, y cada cuánto se revisa.
2. **Facturación.** Para cobrar hace falta estar inscripta en ARCA (ex AFIP) y emitir factura por cada cobro. Conviene consultarlo con un contador.
3. **Textos.** Los textos del cobro (`app/src/content.js`, bloque `BILLING_TEXT`) necesitan revisión jurídica.

## 1. Cuenta de Mercado Pago
1. Si no tenés, creá una cuenta en https://www.mercadopago.com.ar con tus datos fiscales (idealmente una cuenta a nombre del proyecto o de tu actividad profesional, no la personal de uso diario).
2. Completá la validación de identidad que pide Mercado Pago.

## 2. Crear la aplicación (para obtener las credenciales)
1. Entrá a **Tus integraciones**: https://www.mercadopago.com.ar/developers/panel/app
2. **Crear aplicación** → nombre `Aprender Siendo` → tipo de solución: **Pagos online** → producto: **Suscripciones**.
3. Ahí vas a ver dos juegos de credenciales: **de prueba** y **de producción**. No las copies en ningún mensaje.

## 3. Avisos (webhooks)
1. En la aplicación → **Webhooks** → **Configurar notificaciones**.
2. Modo de prueba, URL: `https://<proyecto-de-prueba>.supabase.co/functions/v1/webhook-mercadopago` (la dirección exacta te la confirma el responsable técnico cuando exista el proyecto de Supabase).
3. Eventos: **Planes y suscripciones** (suscripciones y pagos autorizados).
4. Guardá. Mercado Pago muestra una **clave secreta** de los avisos: la vas a cargar en el paso 4.

## 4. Cargar las claves en Supabase (no en el chat)
Supabase → proyecto `aprender-siendo-prueba` → **Edge Functions** → **Secrets**:
- `MP_ACCESS_TOKEN` → el *Access Token* **de prueba**.
- `MP_WEBHOOK_SECRET` → la clave secreta de los avisos.
- `APP_URL` → `https://beta.aprendersiendo.ar`

Las credenciales **de producción** las carga solo el responsable técnico en el proyecto `aprender-siendo-produccion`, después de las dos aprobaciones.

## 5. Probar sin dinero real
1. En la aplicación → **Cuentas de prueba** → crear un *vendedor* y un *comprador* de prueba.
2. Con el comprador de prueba, suscribirse en `beta.aprendersiendo.ar` usando las tarjetas de prueba que muestra Mercado Pago.
3. Revisar que la cuenta pase a "Activa", que la cancelación y el botón de arrepentimiento funcionen y que el panel de administración muestre el reembolso pendiente.

## 6. Reembolsos (botón de arrepentimiento)
Cuando alguien se arrepiente dentro de los 10 días, la app cancela la suscripción y marca el reembolso como pendiente. La devolución la hacés vos en Mercado Pago (**Actividad** → el cobro → **Devolver dinero**) y después tocás «Registré el reembolso en Mercado Pago» en el panel de administración.

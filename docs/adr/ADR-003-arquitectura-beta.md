# ADR-003 — Beta de demostración en un solo archivo

- **Estado:** reemplazado por ADR-009 (2026-11-09). La versión de un solo archivo sigue existiendo solo como salida opcional del armado (`--un-archivo`).

## Decisión
La v0.x es una app web en un solo archivo HTML, sin dependencias salvo Google Fonts. Los datos son sintéticos y se guardan en el navegador (`localStorage`) mediante una capa (`app/src/store.js`) que expone las operaciones de la futura API. Los permisos se programan en código. El contenido clínico está aislado en `app/src/content.js` y marcado REVISAR.

## Por qué
Permite que la supervisora y el equipo prueben el recorrido completo hoy, sin servidor ni datos reales (DEV-IA §2 y §8). Al pasar a ADR-001 se reemplaza `store.js` por llamadas a Supabase sin rehacer las pantallas.

## Consecuencias
No es apta para personas reales: los datos no se comparten entre dispositivos y no hay servidor. Las ilustraciones son SVG originales (`app/src/illustrations.js`); las imágenes de referencia de banco no se incluyen.

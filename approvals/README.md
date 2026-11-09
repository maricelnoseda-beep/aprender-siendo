# Registros de aprobación

Un archivo por versión: `approvals/<versión>.md` (por ejemplo `approvals/v0.2.0.md`). Formato (Contexto de interacción, §4, más la huella del artefacto):

```
APROBACIÓN
QUIÉN: Supervisora clínica
VERSIÓN: v0.2.0
ALCANCE: <qué se aprueba>
DECISIÓN: Aprobado
FECHA: AAAA-MM-DD
HUELLA: <sha256 de app/dist/manifiesto.json que se va a desplegar>

APROBACIÓN
QUIÉN: Responsable técnico
VERSIÓN: v0.2.0
ALCANCE: <seguridad, infraestructura y despliegue>
DECISIÓN: Aprobado
FECHA: AAAA-MM-DD
HUELLA: <misma sha256>
```

La huella es la de `app/dist/manifiesto.json`, que a su vez lista la huella de cada archivo publicado y de cada módulo (ADR-009). `check_approvals.py` verifica que todos los archivos coincidan con el manifiesto antes de comparar la huella.

El flujo de producción (`.github/workflows/production.yml`) corre `scripts/check_approvals.py` y se detiene si falta alguna de las dos aprobaciones o si la huella no coincide. Además, el entorno `production` de GitHub debe configurarse con revisores obligatorios. No hay aprobación tácita ni por vencimiento de plazo.

Hoy no hay ningún registro: **ninguna versión está aprobada para producción**.

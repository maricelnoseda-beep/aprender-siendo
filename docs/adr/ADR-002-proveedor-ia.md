# ADR-002 — Proveedor de modelo de lenguaje

- **Estado:** propuesto por DEV-IA (2026-11-01), elegido por delegación de la responsable del proyecto. **Provisional** hasta correr la batería de evaluación comparativa (DEV-IA §4 y §7).
- **Trazabilidad:** NEC-002 §4; DEV-IA §4, §5, §6; PSP-SR §9.1, §9.4.

## Para qué se usa (y para qué no)
El modelo **solo redacta un resumen en lenguaje claro** de indicadores que ya calculó el código (adhesión, participación, desempeño, ánimo declarado) para que la profesional lo lea y lo revise. No calcula indicadores, no decide señales, no diagnostica, no habla con niños ni familias (DEV-IA §4; PSP-SR §8, exclusiones). Si el modelo falla o se desactiva, la app sigue funcionando con las sugerencias por reglas que tiene hoy.

## Opciones evaluadas
| Opción | Notas |
| --- | --- |
| **A. Anthropic Claude por API** (Claude Sonnet 5.5 fijado; Claude Haiku 5.5 como alternativa económica a evaluar) | Buen desempeño en español; permite fijar la versión del modelo |
| B. OpenAI por API | Alternativa equivalente |
| C. Google Gemini (Vertex AI, región San Pablo) | Procesamiento regional |
| D. Claude a través de AWS Bedrock o Google Vertex | Mismo modelo que A, contratado mediante una nube con acuerdos regionales |

## Decisión
**Opción A**, con la versión fijada `claude-sonnet-5-5`, llamada **solo desde una función del servidor** (Supabase Edge Function) y nunca desde el navegador.
- **Entrada:** solo los indicadores numéricos y el código del paciente, ya seudonimizados. Nada de texto libre de familias, notas ni datos de cuenta (DEV-IA §6.1).
- **Salida:** se valida contra un esquema y pasa por filtros de reglas clínicas (sin diagnóstico, sin medicación, sin interpretación clínica). Se muestra rotulada como "Generado con IA · requiere tu revisión" y se registra en la auditoría.
- **Límites:** costo por usuario y por día, tiempo máximo por llamada e interruptor de apagado.

## Consecuencias y verificaciones pendientes
- [Probable] Hay que contratar con condiciones que excluyan el entrenamiento con nuestros datos y pedir retención mínima o nula. Se verifica en el contrato vigente antes de producción.
- [Probable] Es una transferencia internacional: rigen las mismas cláusulas que en ADR-001.
- Nota de transparencia: DEV-IA funciona sobre un modelo de Anthropic. Por eso la elección queda provisional hasta comparar A, B y C con la batería propia en español rioplatense, y gana el que mejor resultado tenga sin empeorar en seguridad ni en ningún subgrupo.
- La clave de API la custodia el responsable técnico en el gestor de secretos de Supabase.

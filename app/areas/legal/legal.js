"use strict";
/* ==========================================================================
   TEXTOS LEGALES (BORRADOR)
   ========================================================================== */
const draftBanner = `<div class="notice notice-warn"><strong>Borrador ${esc(LEGAL.version)} (${esc(LEGAL.updated)}).</strong> Pendiente de revisión jurídica y de la supervisora clínica. No usar como texto definitivo.</div>`;
const LegalDocs = {
  beta: { title: "Qué significa que sea una versión beta", body: () => `
    <p>Aprender Siendo está en <strong>etapa beta</strong>: una versión de prueba que usamos con un grupo de participantes invitados para validar que todo funcione antes del lanzamiento.</p>
    <ul><li>Puede haber errores. Si encontrás uno, usá «Reportar un inconveniente» (está en todas las pantallas).</li>
    <li>Las aventuras y textos todavía están en revisión profesional. Lo que dice «${PRUEBA}» es relleno para probar.</li>
    <li>Esta demostración guarda todo solo en tu navegador, con datos ficticios. No cargues datos reales de chicos ni de familias.</li>
    <li>Si tenés una idea para mejorar, usá el botón «Sugerencias».</li>
    <li>Durante la beta evaluamos: facilidad de uso, funcionamiento de actividades y seguimiento, permisos y privacidad, control de sesiones, prueba gratuita, baja de cuentas y reportes.</li></ul>` },
  terminos: { title: "Términos de uso", body: () => `${draftBanner}
    <h3>1. Qué es Aprender Siendo</h3><p>Una aplicación con recursos psicopedagógicos para usar en consulta y en casa, con participación de las familias y supervisión profesional. No reemplaza la evaluación ni el tratamiento profesional.</p>
    <h3>2. Versión beta</h3><p>El servicio está en etapa beta, con acceso por invitación. Puede tener errores o cambios.</p>
    <h3>3. Cuentas</h3><p>Hay cuentas de familia o responsable, de profesional (con matrícula verificada) y de administración. Cada cuenta puede tener una sola sesión activa a la vez. Una familia puede crear un perfil libre (sin profesional), que no incluye interpretación ni seguimiento clínico.</p>
    <h3>3 bis. Chicos, chicas y adolescentes</h3><p>Entre 3 y 12 años usa la app con el consentimiento de su representante y su propio asentimiento. De 13 a 15 años hacen falta el consentimiento del representante y el asentimiento del adolescente. Desde los 16 años el adolescente puede consentir por sí mismo; se avisa al representante y, si se opone, decide la profesional según el interés superior del adolescente. A los 18 años la persona toma la titularidad de su cuenta.</p>
    <p class="legal-ph">Texto jurídico pendiente.</p>
    <h3>4. Prueba gratuita</h3><p>Cada cuenta tiene ${Store.db.config.trialDays} días de prueba gratuita desde su activación. La app muestra el tiempo restante y avisa antes del vencimiento. Condiciones posteriores: ${esc(LEGAL.postTrialConditions)}</p>
    <h3>5. Uso responsable</h3><p>Las actividades se hacen siguiendo la indicación de la profesional. Las sugerencias automáticas son orientativas y las revisa la profesional; el desempeño en la app no equivale a mejoría o retroceso clínico.</p>
    <h3>6. Baja</h3><p>Podés dar de baja tu cuenta en cualquier momento desde «Dar de baja mi cuenta».</p>
    <h3>7. Contacto</h3><p>${esc(LEGAL.contact)}</p>` },
  privacidad: { title: "Información de privacidad", body: () => `${draftBanner}
    <h3>Qué datos tratamos</h3>
    <ul><li><strong>De tu cuenta:</strong> correo, nombre para mostrar, contraseña cifrada, fechas de alta y activación, autorizaciones otorgadas y datos técnicos de la sesión (identificador del dispositivo y navegador, inicio y última actividad).</li>
    <li><strong>De profesionales:</strong> número de matrícula, provincia y fecha de verificación.</li>
    <li><strong>Del chico, la chica o el adolescente:</strong> un código asignado por el sistema, un apodo, mes y año de nacimiento, categoría (solo la ve la profesional), aventuras indicadas y, por cada aventura, fecha, lugar (casa o consulta), resultados (ítems, aciertos al primer intento, pistas, nivel), el personaje y el compañero elegidos, y las respuestas de «Contar». El check-in de ánimo se guarda vinculado solo si hay profesional, la vinculación está activa y el representante lo consintió; si no, solo se cuenta en forma agregada. No pedimos nombre, documento, escuela ni domicilio.</li>
    <li><strong>Consentimientos:</strong> quién, cuándo, qué versión del formulario y una huella digital encadenada que permite verificar que el registro no se alteró.</li>
    <li><strong>Sugerencias:</strong> el texto que escribas, para que lo evalúe el equipo.</li>
    <li><strong>Reportes y solicitudes:</strong> el texto que escribas y la captura que adjuntes.</li></ul>
    <h3>Para qué los usamos</h3><ul><li>Prestar el servicio: mostrar las actividades indicadas y que la profesional haga el seguimiento.</li>
    <li>Solo si lo autorizás aparte: mejorar los programas con datos agregados y sin identificación.</li></ul>
    <h3>Quién puede verlos</h3><ul><li>La profesional a cargo ve los registros de sus pacientes solo mientras la vinculación está activa.</li><li>La familia ve qué se practicó, cuánto tiempo y los desafíos hechos; no ve porcentajes, alertas, interpretación ni el ánimo. Si el paciente tiene 13 años o más, la familia ve solo tiempo y aventuras.</li><li>El adolescente puede descargar sus propios datos.</li>
    <li>La administración ve datos de cuentas e indicadores agregados, no registros individuales de pacientes.</li></ul>
    <h3>Un aviso importante sobre el anonimato</h3><p>Para seguir la evolución de cada paciente usamos un código persistente. Eso <strong>no es anonimato absoluto</strong>: la profesional sabe a quién corresponde y, combinado con otros datos, podría permitir identificar a una persona. Por eso el seguimiento individual se guarda separado de las estadísticas generales, que son agregadas y ocultan los grupos chicos.</p>
    <h3>Cómo los protegemos y cuánto tiempo</h3><p>Acceso según el perfil, contraseñas cifradas, segundo factor para profesionales y administración, una sesión activa por cuenta y registro de auditoría. Conservación: ${esc(LEGAL.retention)}</p>
    <h3>Tus derechos</h3><p>Podés pedir acceso, corrección o supresión de tus datos desde «Mi cuenta» (Ley 25.326), o escribir a ${esc(LEGAL.contact)}.</p>
    <h3>En esta demostración</h3><p>Todo queda guardado solo en tu navegador; no se envía a ningún servidor.</p>` },
  ia: { title: "Uso de inteligencia artificial", body: () => `${draftBanner}
    <p>Siempre te decimos cuándo interviene una herramienta automática.</p>
    <ul><li>Los indicadores, las alertas, el nivel de cada aventura y los permisos se calculan con reglas fijas y verificables, no con un modelo de lenguaje.</li>
    <li>En esta beta no interviene ningún modelo de lenguaje: el borrador de informe es una plantilla fija que la profesional revisa, edita y firma.</li>
    <li>Las preguntas y posibles ajustes que ve la profesional junto a una alerta son orientativos. Nunca se muestran a familias ni a chicos.</li>
    <li>Cuando se incorpore un modelo de lenguaje para redactar resúmenes, recibirá solo indicadores con el código del paciente, sin datos personales, y lo vamos a informar acá antes de activarlo.</li>
    <li>El desempeño en la app no equivale a una mejoría ni a un retroceso clínico. La interpretación es de la profesional.</li></ul>` },
  post: { title: "Qué pasa cuando termina la prueba", body: () => `${draftBanner}
    <p>Condiciones después de la prueba: ${esc(LEGAL.postTrialConditions)}</p><p>Conservación de los datos: ${esc(LEGAL.retention)}</p>
    <p>Podés dar de baja tu cuenta en cualquier momento.</p>` }
};
Views.legal = () => {
  const d = LegalDocs[State.params.doc] || LegalDocs.beta;
  return `<button class="linklike back" id="legal-back">← Volver</button><article class="narrow card legal"><h1>${esc(d.title)}</h1>${d.body()}</article>`;
};
Binders.legal = () => { $("#legal-back").addEventListener("click", () => go(State.params.back && State.params.back !== "legal" ? State.params.back : "home")); };

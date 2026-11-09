"use strict";
/* ==========================================================================
   Vistas
   ========================================================================== */
const Views = {};
const Binders = {};

/* ---------- Portada e ingreso ---------- */
Views.landing = () => `
  <section class="hero-band"><div class="wrap hero">
    <div class="hero-text">
      <p class="eyebrow">Portal psicopedagógico · Beta</p>
      <h1>Aprender es <br><span>también ser.</span></h1>
      <p class="lead">Un espacio para descubrir, experimentar y crecer. Actividades para compartir en casa y en consulta, con el acompañamiento de familias y profesionales.</p>
      <div class="row wrap-row hero-cta"><a class="btn btn-primary btn-lg" href="#ingresar">Ingresar a la beta <svg class="arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></a><button class="btn btn-outline btn-lg" data-go="register">Crear cuenta de familia</button></div>
      <p class="hint">Prueba gratuita de ${Store.db.config.trialDays} días desde la activación de tu cuenta.</p>
    </div>
    <div class="hero-art">${Scenes.hero()}<button type="button" class="story-control" aria-label="Pausar animación" title="Pausar animación"><svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4h3.5v12H5zm6.5 0H15v12h-3.5z"/></svg></button></div>
  </div></section>

  <section class="values" aria-label="Aprender Siendo"><ul class="wrap">
<li><svg viewBox="0 0 40 40" fill="none" stroke="#178a90" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 8c-2-6-10-5-11 2-6 0-7 8-3 11-3 6 2 11 7 10 0 6 8 7 8 1V10c1-8 10-7 11 0 6 1 7 8 3 12 3 5-1 10-6 10-1 5-6 5-8 1"/><path d="M9 12q7 1 5 6 M8 25q2-5 7-2 M26 14q2 4 6 2 M25 25q0-4 5-5"/></svg>Aprender</li>
<li><svg viewBox="0 0 40 40" fill="none" stroke="#e97650" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="26" cy="8" r="4" fill="#f28a57" stroke="none"/><path d="m8 19 7-6 8 2 5 3 7-6 M22 16l-6 9 7 4-4 7 M17 25l-6 6-6 2"/></svg>Jugar</li>
<li><svg viewBox="0 0 40 40" fill="none" stroke="#ab7fb4" stroke-width="3" stroke-linejoin="round" aria-hidden="true"><path d="M20 34C15 27 4 22 4 13 4 3 15 1 20 10 25 1 36 3 36 13 36 22 25 29 20 34Z"/></svg>Descubrir</li>
<li><svg viewBox="0 0 40 40" fill="none" stroke="#6d9f49" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 36V21 M20 25C10 26 5 20 4 12c10-1 16 5 16 13Z M20 21C19 10 25 6 36 4c0 10-5 18-16 17Z"/></svg>Crecer</li>
</ul></section>

  <section class="wrap band-section" id="participar">
    <p class="eyebrow center">Cuentas de demostración</p>
    <h2 class="section-title">Elegí cómo participar</h2>
    <div class="role-grid">
      ${[["familia", "Familias y responsables", "Acompañan en casa las aventuras que indica la profesional, o crean un perfil libre para jugar sin profesional.", Scenes.family(150), "familia@demo.aprendersiendo.ar", "role-coral"],
         ["profesional", "Profesionales", "Indican aventuras, arman el plan de intervención y siguen la participación con alertas calculadas por reglas fijas.", Scenes.professional(150), "profesional@demo.aprendersiendo.ar", "role-verde"],
         ["admin", "Administración", "Gestiona cuentas, contenidos, reportes de la beta e indicadores generales.", Scenes.admin(150), "admin@demo.aprendersiendo.ar", "role-azul"]].map(([k, t, d, art, e, cls]) => `
        <article class="role-card ${cls}"><div class="role-art">${art}</div><h3>${t}</h3><p>${d}</p>
          <button class="btn btn-soft demo-acc" data-email="${e}">Probar como ${k === "admin" ? "administración" : k} <svg class="arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button></article>`).join("")}
    </div>
  </section>

  <section class="journey-band" id="recorrido"><div class="wrap">
    <p class="eyebrow center">La aventura del chico o la chica</p>
    <h2 class="section-title">Descubrir, jugar, hacer y contar</h2>
    <ol class="journey">
      <li><span class="j-art">${animalImage("mariposa", "alegria", 92)}</span><strong>Descubrir</strong><span>Mira cómo se hace, después de contar cómo viene (o saltearlo).</span></li>
      <li><span class="j-art">${actIcon("secuencias", 92)}</span><strong>Jugar</strong><span>La dificultad se ajusta sola con reglas fijas para que sea un desafío justo.</span></li>
      <li><span class="j-art">${animalImage("abeja", "alegria", 92)}</span><strong>Hacer</strong><span>Un desafío cortito para casa o el aula, fuera de la pantalla.</span></li>
      <li><span class="j-art">${animalImage("delfin", "calma", 92)}</span><strong>Contar</strong><span>Qué le ayudó y cómo le resultó. Su compañero crece con cada aventura.</span></li>
    </ol>
  </div></section>

  <section class="wrap login-section" id="ingresar">
    <div class="card login-card">
      <h2>Ingresar</h2>
      <form id="login" class="form" autocomplete="on">
        <label for="li-email">Correo electrónico</label>
        <input id="li-email" type="email" required autocomplete="username">
        <label for="li-pass">Contraseña</label>
        <input id="li-pass" type="password" required autocomplete="current-password">
        <p class="err" id="li-err" role="alert"></p>
        <button class="btn btn-primary" type="submit">Ingresar</button>
      </form>
      <div class="row wrap-row"><button class="btn btn-ghost" data-go="register">Crear cuenta de familia</button><button class="btn btn-ghost" data-go="request-pro">Solicitar acceso profesional</button></div>
    </div>
    <div class="login-aside">
      <h2>Cuentas de demostración</h2>
      <p>Para probar los tres perfiles con pacientes ficticios. La contraseña de todas es <code>beta2026</code>.</p>
      <ul class="demo-list">
        <li><button class="linklike demo-acc" data-email="familia@demo.aprendersiendo.ar">familia@demo.aprendersiendo.ar</button> <span class="hint">(chicos de 4 a 14 años)</span></li>
        <li><button class="linklike demo-acc" data-email="familia2@demo.aprendersiendo.ar">familia2@demo.aprendersiendo.ar</button> <span class="hint">(adolescente de 17)</span></li>
        <li><button class="linklike demo-acc" data-email="profesional@demo.aprendersiendo.ar">profesional@demo.aprendersiendo.ar</button></li>
        <li><button class="linklike demo-acc" data-email="admin@demo.aprendersiendo.ar">admin@demo.aprendersiendo.ar</button></li>
      </ul>
      <p class="hint">Para probar el control de sesiones, abrí la demostración en otra pestaña e ingresá con la misma cuenta.</p>
      <div class="promise"><strong>Tecnología para aprender, con criterio profesional.</strong> Cada herramienta pasa por revisión psicopedagógica antes de publicarse.</div>
    </div>
  </section>`;

Binders.landing = () => {
  const art = $(".hero-art");
  const control = art.querySelector(".story-control");
  let inView = false;
  let pausedByUser = false;
  const updatePlayback = () => {
    art.dataset.paused = String(pausedByUser || !inView || document.hidden);
  };
  const visibility = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updatePlayback();
  });
  visibility.observe(art);
  document.addEventListener("visibilitychange", updatePlayback);
  updatePlayback();
  releaseLandingStory = () => {
    visibility.disconnect();
    document.removeEventListener("visibilitychange", updatePlayback);
  };
  control.addEventListener("click", () => {
    pausedByUser = !pausedByUser;
    const label = pausedByUser ? "Continuar animación" : "Pausar animación";
    control.setAttribute("aria-label", label);
    control.title = label;
    control.querySelector("path").setAttribute("d", pausedByUser ? "M5 3l12 7-12 7z" : "M5 4h3.5v12H5zm6.5 0H15v12h-3.5z");
    updatePlayback();
  });
  $$(".demo-acc").forEach((b) => b.addEventListener("click", () => { $("#li-email").value = b.dataset.email; $("#li-pass").value = "beta2026"; $("#ingresar").scrollIntoView({ behavior: "smooth", block: "center" }); $("#li-pass").focus({ preventScroll: true }); }));
  $("#login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const r = await Store.checkCredentials($("#li-email").value, $("#li-pass").value);
    if (r.error) { $("#li-err").textContent = r.error; return; }
    State.pending = { userId: r.user.id, conflict: r.conflict, code: r.needs2fa ? String(Math.floor(100000 + Math.random() * 900000)) : null };
    if (r.needs2fa) return go("twofa");
    if (r.conflict) return go("conflict");
    Store.login(r.user); go("home");
  });
};

/* ---------- Segundo factor (simulado en la demostración) ---------- */
Views.twofa = () => `
  <section class="narrow card">
    <h1>Verificá que sos vos</h1>
    <p>Las cuentas profesionales y de administración usan un segundo paso de verificación.</p>
    <div class="notice notice-info"><strong>Solo en la demostración:</strong> tu código es <span class="mono big">${esc(State.pending?.code)}</span>. En la versión real llega por correo o por una app de autenticación.</div>
    <form id="tf" class="form"><label for="tf-code">Código de 6 números</label>
      <input id="tf-code" inputmode="numeric" maxlength="6" required autocomplete="one-time-code">
      <p class="err" id="tf-err" role="alert"></p>
      <button class="btn btn-primary">Continuar</button></form>
  </section>`;
Binders.twofa = () => {
  if (!State.pending) return go("landing");
  $("#tf").addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#tf-code").value.trim() !== State.pending.code) { $("#tf-err").textContent = "El código no coincide."; return; }
    State.pending.verified = true;
    const u = Store.db.users.find((x) => x.id === State.pending.userId);
    if (State.pending.conflict) return go("conflict");
    Store.login(u); State.pending = null; go("home");
  });
};

/* ---------- Sesión abierta en otro dispositivo ---------- */
Views.conflict = () => {
  const u = Store.db.users.find((x) => x.id === State.pending?.userId);
  const s = u && Store.db.activeSessions[u.id];
  return `<section class="narrow card">
    <h1>Tu cuenta ya está abierta en otro lugar</h1>
    <p>Cada cuenta puede tener <strong>una sola sesión activa a la vez</strong>. Hay una sesión abierta desde ${s ? fmtDateTime(s.startedAt) : "otro dispositivo"}.</p>
    <p>Si fuiste vos, podés cerrar esa sesión y seguir acá. Para hacerlo, confirmá tu contraseña.</p>
    <form id="cf" class="form">
      <label for="cf-pass">Contraseña</label><input id="cf-pass" type="password" required autocomplete="current-password">
      <p class="err" id="cf-err" role="alert"></p>
      <div class="row"><button class="btn btn-primary">Cerrar la otra sesión y entrar</button><button class="btn btn-ghost" type="button" data-go="landing">No, volver</button></div>
    </form>
    <p class="hint">Si no fuiste vos, cambiá tu contraseña y reportalo con «Reportar un inconveniente».</p>
  </section>`;
};
Binders.conflict = () => {
  if (!State.pending) return go("landing");
  $("#cf").addEventListener("submit", async (e) => {
    e.preventDefault();
    const u = Store.db.users.find((x) => x.id === State.pending.userId);
    if ((await Store.hash($("#cf-pass").value, u.salt)) !== u.passHash) { $("#cf-err").textContent = "La contraseña no coincide."; return; }
    if (u.role !== "familia" && !State.pending.verified) return go("twofa");
    Store.login(u, { replace: true }); State.pending = null;
    notice("Cerramos la sesión anterior. Ahora tu cuenta está abierta solo acá.", "ok"); go("home");
  });
};

/* ---------- Consentimientos comunes al registro ---------- */
function consentBlock() {
  return `<fieldset class="consents"><legend>Antes de crear la cuenta</legend>
    <div class="notice notice-info">Esta es una <strong>versión beta</strong>: la usamos para probar el funcionamiento con un grupo de participantes invitados.
      La prueba gratuita dura <strong>${Store.db.config.trialDays} días desde la activación</strong> de tu cuenta.
      <br><strong>Condiciones después de la prueba:</strong> ${esc(LEGAL.postTrialConditions)}</div>
    <label class="check"><input type="checkbox" id="c-terms" required> Leí y acepto los <button type="button" class="linklike" data-doc-open="terminos">Términos de uso</button>.</label>
    <label class="check"><input type="checkbox" id="c-priv" required> Leí la <button type="button" class="linklike" data-doc-open="privacidad">información de privacidad</button> y autorizo el uso de los datos necesarios para prestar el servicio.</label>
    <label class="check"><input type="checkbox" id="c-impr"> <span><strong>Opcional:</strong> autorizo usar datos sin identificación, agregados con los de otras personas, para mejorar los programas. Puedo retirar esta autorización cuando quiera desde «Mi cuenta».</span></label>
  </fieldset>`;
}
function bindConsentLinks() {
  $$("[data-doc-open]").forEach((b) => b.addEventListener("click", () => modal(`<h2 id="modal-title">${esc(LegalDocs[b.dataset.docOpen].title)}</h2><div class="legal">${LegalDocs[b.dataset.docOpen].body()}</div><button class="btn btn-primary" data-close>Cerrar</button>`)));
}

Views.register = () => `
  <section class="narrow card">
    <h1>Crear cuenta de familia o responsable</h1>
    <p>Para acompañar en casa las aventuras que indica la profesional, o para jugar en modo libre.</p>
    <div class="notice notice-info" id="rg-trial"><strong>Prueba gratuita de ${Store.db.config.trialDays} días.</strong> Si creás la cuenta hoy, la prueba termina el ${fmtDate(Store.now() + Store.db.config.trialDays * DAY)}.
      ${esc(LEGAL.postTrialConditions)}</div>
    <form id="rg" class="form">
      <label for="rg-alias">¿Cómo querés que te llamemos?</label>
      <input id="rg-alias" required maxlength="40" placeholder="Por ejemplo: Familia de Sol">
      <p class="hint">No hace falta tu nombre real. Evitá poner el nombre completo del niño.</p>
      <label for="rg-email">Correo electrónico</label><input id="rg-email" type="email" required autocomplete="email">
      <label for="rg-pass">Contraseña (mínimo 8 caracteres)</label><input id="rg-pass" type="password" minlength="8" required autocomplete="new-password">
      <label for="rg-code">Código de vinculación (si tu profesional te dio uno)</label><input id="rg-code" maxlength="9" placeholder="XXXX-XXXX">
      ${consentBlock()}
      <p class="err" id="rg-err" role="alert"></p>
      <button class="btn btn-primary">Crear cuenta y empezar la prueba</button>
    </form>
  </section>`;
Binders.register = () => {
  bindConsentLinks();
  $("#rg").addEventListener("submit", async (e) => {
    e.preventDefault();
    const r = await Store.register({ role: "familia", email: $("#rg-email").value, alias: $("#rg-alias").value, pass: $("#rg-pass").value,
      consents: { improvement: $("#c-impr").checked }, inviteCode: $("#rg-code").value });
    if (r.error) { $("#rg-err").textContent = r.error; return; }
    Store.login(r.user); notice(`¡Listo! Tu prueba gratuita de ${Store.db.config.trialDays} días empezó hoy y termina el ${fmtDate(Store.now() + Store.db.config.trialDays * DAY)}. Te avisamos antes de que termine.`, "ok"); go("home");
  });
};

function normalizeProfessionalPortrait(value) {
  return value === "masculino" || value === "femenino" ? value : "";
}

function professionalPortraitField(value = "") {
  const selected = normalizeProfessionalPortrait(value);
  const choices = [["", "Usar la ilustración predeterminada"], ["femenino", "Psicopedagoga con una niña"], ["masculino", "Psicopedagogo con un niño"]];
  return `<label for="professional-portrait">Ilustración de tu Espacio Profesional (opcional)</label>
    <select id="professional-portrait">${choices.map(([key, label]) => `<option value="${key}" ${key === selected ? "selected" : ""}>${label}</option>`).join("")}</select>`;
}

Views["request-pro"] = () => `
  <section class="narrow card">
    <h1>Solicitar acceso profesional</h1>
    <p>El Espacio Profesional es para psicopedagogas y psicopedagogos con matrícula vigente. Durante la beta verificamos cada matrícula a mano antes de activar la cuenta; la prueba gratuita empieza el día de la activación.</p>
    <form id="rp" class="form">
      <label for="rp-alias">Nombre para mostrar</label><input id="rp-alias" required maxlength="60">
      ${professionalPortraitField()}
      <label for="rp-email">Correo electrónico</label><input id="rp-email" type="email" required autocomplete="email">
      <label for="rp-pass">Contraseña (mínimo 8 caracteres)</label><input id="rp-pass" type="password" minlength="8" required autocomplete="new-password">
      <div class="two"><div><label for="rp-mat">N.º de matrícula</label><input id="rp-mat" required maxlength="20"></div>
      <div><label for="rp-prov">Provincia que la otorgó</label><select id="rp-prov" required>${["", "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"].map((p) => `<option value="${p}">${p || "Elegí una"}</option>`).join("")}</select></div></div>
      ${consentBlock()}
      <p class="err" id="rp-err" role="alert"></p>
      <button class="btn btn-primary">Enviar solicitud</button>
    </form>
  </section>`;
Binders["request-pro"] = () => {
  bindConsentLinks();
  $("#rp").addEventListener("submit", async (e) => {
    e.preventDefault();
    const r = await Store.register({ role: "profesional", email: $("#rp-email").value, alias: $("#rp-alias").value, pass: $("#rp-pass").value, professionalPortrait: $("#professional-portrait").value,
      consents: { improvement: $("#c-impr").checked }, matricula: { numero: $("#rp-mat").value.trim(), provincia: $("#rp-prov").value } });
    if (r.error) { $("#rp-err").textContent = r.error; return; }
    notice("Recibimos tu solicitud. Cuando verifiquemos tu matrícula vas a poder ingresar y empieza tu prueba gratuita.", "ok"); go("landing");
  });
};

/* ---------- Prueba vencida ---------- */
function viewExpired(user, t) {
  return `<section class="narrow card">
    <h1>Tu prueba gratuita terminó</h1>
    <p>La prueba de ${Store.db.config.trialDays} días terminó el ${fmtDate(t.end)}. Mientras dure la beta, las actividades quedan en pausa para esta cuenta.</p>
    <p><strong>Condiciones después de la prueba:</strong> ${esc(LEGAL.postTrialConditions)}</p>
    <div class="row wrap-row"><button class="btn btn-soft" data-go="account">Ver mi cuenta y mis datos</button>
    <button class="btn btn-soft" data-act="legal" data-doc="post">Qué pasa con mis datos</button></div>
  </section>`;
}

/* ---------- Inicio según rol ---------- */
Views.home = (user) => user.role === "familia" ? familyHome(user) : user.role === "profesional" ? proHome(user) : adminHome(user);
Binders.home = (user) => (user.role === "familia" ? bindFamily : user.role === "profesional" ? bindPro : bindAdmin)(user);

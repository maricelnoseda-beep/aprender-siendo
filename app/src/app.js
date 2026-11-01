/* ==========================================================================
   app.js — Interfaz de la beta de demostración de Aprender Siendo
   ========================================================================== */

const APP_VERSION = "0.2.0-beta-demo (2026-11-01)";
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (t) => new Date(t).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDateTime = (t) => new Date(t).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const dxLabel = (id) => (DIAGNOSIS_CATEGORIES.find((d) => d.id === id) || { label: id }).label;
const moodLabel = (id) => (MOODS.find((m) => m.id === id) || { label: "—" }).label;
const actById = (id) => ACTIVITIES.find((a) => a.id === id);
const roleLabel = { admin: "Administración", profesional: "Profesional", familia: "Familia o responsable" };

const State = { view: "landing", params: {}, pending: null, notice: null, child: null };
const app = () => $("#app");

function go(view, params = {}) { State.view = view; State.params = params; render(); window.scrollTo(0, 0); }
function notice(text, kind = "info") { State.notice = { text, kind }; }

/* ---------- Lectura de voz (opcional, si el navegador la ofrece) ---------- */
const Voice = {
  on: false,
  say(text) {
    if (!this.on || !text || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ""));
      u.lang = "es-AR"; u.rate = 0.92; speechSynthesis.speak(u);
    } catch (e) { /* sin voz disponible */ }
  }
};

/* ---------- Preferencias de lectura (solo comodidad de este navegador) ---------- */
const Prefs = {
  get() { try { return JSON.parse(localStorage.getItem("as_beta_prefs") || "{}"); } catch (e) { return {}; } },
  set(p) { try { localStorage.setItem("as_beta_prefs", JSON.stringify({ ...this.get(), ...p })); } catch (e) {} this.apply(); },
  apply() {
    const p = this.get(), r = document.documentElement;
    r.dataset.size = p.size || "1"; r.dataset.spacing = p.spacing ? "wide" : ""; r.dataset.contrast = p.contrast ? "high" : "";
  }
};

/* ==========================================================================
   Estructura común: banda beta, encabezado, pie con enlaces permanentes
   ========================================================================== */
function shell(user, inner, { child = false } = {}) {
  const trial = user && Store.trialInfo(user);
  const canLeave = user && user.role !== "admin";
  return `
  <div class="beta-band" role="note">
    <div class="wrap"><strong>Versión beta de prueba.</strong> Estás usando una demostración con datos ficticios. No cargues datos reales de pacientes.
      <button class="linklike" data-act="beta-info">Qué significa</button></div>
  </div>
  ${child ? "" : `
  <header class="top"><div class="wrap top-in">
    <button class="brand" data-act="home" aria-label="Aprender Siendo, ir al inicio">${brandMark(42)}<span class="brand-words"><span class="brand-name">Aprender Siendo</span><span class="brand-sub">Psicopedagogía · Educación · Innovación</span></span><span class="beta-tag">Beta</span></button>
    <nav class="top-nav" aria-label="Principal">
      ${user ? navFor(user) : ""}
      <button class="btn btn-ghost" data-act="prefs" aria-expanded="false">Modo lectura</button>
      ${user ? `<span class="who">${esc(user.alias)} · ${roleLabel[user.role]}</span><button class="btn btn-ghost" data-act="logout">Salir</button>` : ""}
    </nav>
  </div>
  <div class="wrap prefs" id="prefs" hidden>
    <span>Tamaño de letra</span>
    <button class="btn btn-soft" data-size="1">A</button><button class="btn btn-soft" data-size="2">A+</button><button class="btn btn-soft" data-size="3">A++</button>
    <label><input type="checkbox" id="pref-spacing"> Más espaciado</label>
    <label><input type="checkbox" id="pref-contrast"> Más contraste</label>
    <label><input type="checkbox" id="pref-voice"> Leer en voz alta las consignas</label>
  </div></header>
  ${trial ? trialBar(trial) : ""}`}
  ${State.notice ? `<div class="wrap"><div class="notice notice-${State.notice.kind}" role="status">${State.notice.text}</div></div>` : ""}
  <main id="main" class="${child ? "child-main" : State.view === "landing" && !user ? "bleed" : "wrap main"}">${child ? childBackdrop() : ""}${inner}</main>
  <footer class="foot ${child ? "foot-child" : ""}">${child ? "" : `<div class="wrap foot-brand">${brandMark(48)}<div><strong class="brand-name">Aprender Siendo</strong><p>Cada persona, un modo único de aprender.</p></div></div>`}<div class="wrap foot-in">
    <button class="foot-link strong" data-act="report">Reportar un inconveniente</button>
    ${canLeave && !child ? `<button class="foot-link strong" data-act="leave">Dar de baja mi cuenta</button>` : ""}
    ${child ? "" : `
    <button class="foot-link" data-act="legal" data-doc="terminos">Términos de uso</button>
    <button class="foot-link" data-act="legal" data-doc="privacidad">Privacidad</button>
    <button class="foot-link" data-act="legal" data-doc="ia">Uso de inteligencia artificial</button>
    <span class="foot-meta">Aprender Siendo · aprendersiendo.ar · ${APP_VERSION}. Las herramientas no reemplazan la evaluación profesional.</span>`}
  </div></footer>
  <div id="modal-root"></div>`;
}

function navFor(user) {
  const items = {
    familia: [["home", "Inicio"], ["account", "Mi cuenta"]],
    profesional: [["home", "Pacientes"], ["catalog", "Actividades"], ["account", "Mi cuenta"]],
    admin: [["home", "Panel"]]
  }[user.role];
  return items.map(([v, l]) => `<button class="btn btn-ghost ${State.view === v ? "is-on" : ""}" data-go="${v}">${l}</button>`).join("");
}

function trialBar(t) {
  if (t.expired) return "";
  const cls = t.warn ? "trial warn" : "trial";
  return `<div class="${cls}"><div class="wrap">
    ${t.warn ? `<strong>Tu prueba gratuita vence pronto.</strong> ` : ""}Prueba gratuita: te quedan <strong>${t.daysLeft} ${t.daysLeft === 1 ? "día" : "días"}</strong> (hasta el ${fmtDate(t.end)}).
    ${t.warn ? ` <button class="linklike" data-act="legal" data-doc="post">Ver qué pasa después</button>` : ""}
  </div></div>`;
}

/* ---------- Íconos ilustrados de actividad y fondo del modo niño ---------- */
const ACT_COLORS = { memoria: ["#F2B8A2", "#E07B5F"], secuencias: ["#C9D8EE", "#4F7BB0"], distinto: ["#F4E3B8", "#C99528"], contar: ["#DCE9E2", "#55867D"], clasificar: ["#E4DBF2", "#8A72B8"] };
function actIcon(id, size = 64) {
  const [bg, fg] = ACT_COLORS[id] || ["#DCE9E2", "#315F59"];
  const art = {
    memoria: `<rect x="18" y="26" width="26" height="36" rx="6" fill="${fg}" transform="rotate(-10 31 44)"/><rect x="40" y="24" width="26" height="36" rx="6" fill="#fff" stroke="${fg}" stroke-width="3" transform="rotate(8 53 42)"/><circle cx="53" cy="42" r="7" fill="${fg}"/>`,
    secuencias: `<circle cx="22" cy="42" r="9" fill="${fg}"/><rect x="36" y="33" width="18" height="18" rx="4" fill="#E8B44C"/><rect x="60" y="33" width="18" height="18" rx="5" fill="none" stroke="${fg}" stroke-width="3" stroke-dasharray="4 3"/>`,
    distinto: [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => (r === 1 && c === 2 ? `<path d="M${62} ${26 + r * 18} l8 14 h-16z" fill="#E07B5F"/>` : `<circle cx="${28 + c * 17}" cy="${33 + r * 18}" r="6.5" fill="${fg}"/>`))).join(""),
    contar: `<circle cx="22" cy="30" r="6" fill="${fg}"/><circle cx="36" cy="30" r="6" fill="${fg}"/><circle cx="29" cy="44" r="6" fill="${fg}"/><text x="58" y="56" font-family="Manrope, sans-serif" font-weight="800" font-size="32" fill="#315F59">3</text>`,
    clasificar: `<path d="M14 50 h28 v16 h-28z" fill="${fg}"/><path d="M50 50 h28 v16 h-28z" fill="#E8B44C"/><circle cx="28" cy="36" r="8" fill="${fg}"/><path d="M64 26 l9 16 h-18z" fill="#E8B44C"/>`
  }[id] || "";
  return `<svg viewBox="0 0 92 92" width="${size}" height="${size}" aria-hidden="true" class="act-icon"><rect width="92" height="92" rx="24" fill="${bg}"/>${art}</svg>`;
}
function childBackdrop() {
  return `<svg class="child-backdrop" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${Deco.circle(110, 120, 60, Pal.ocre, .35)}${Deco.cloud(900, 70, 2, Pal.salvia)}${Deco.cloud(60, 520, 1.6, Pal.azulGris)}
    ${Deco.squiggle(980, 420, 1.6, Pal.agua, 8)}${Deco.tri(1100, 640, 3, Pal.coralSuave, 18)}${Deco.circle(1080, 260, 22, Pal.rosa, .6)}
    ${Deco.dots(260, 720, Pal.agua)}${Deco.lines(180, 300, Pal.verde)}${Deco.hill(1200, 800, Pal.salvia)}</svg>`;
}

/* ==========================================================================
   Render principal
   ========================================================================== */
function render() {
  Store.reload();
  const cur = Store.currentUser();
  if (cur && cur.kicked) { notice("Se cerró esta sesión porque tu cuenta se abrió en otro dispositivo o navegador.", "warn"); return go("landing"); }
  if (cur && cur.expired) { notice("Tu sesión se cerró por inactividad. Ingresá de nuevo.", "info"); return go("landing"); }
  const user = cur && cur.id ? cur : null;

  const publicViews = ["landing", "register", "request-pro", "legal", "twofa", "conflict", "left"];
  if (!user && !publicViews.includes(State.view)) State.view = "landing";
  if (user && ["landing", "register", "request-pro", "twofa", "conflict"].includes(State.view)) State.view = "home";

  const trial = user && Store.trialInfo(user);
  let html;
  if (State.view === "child") return renderChild(user);
  const blocked = user && trial && trial.expired && !["account", "leave", "legal"].includes(State.view);
  if (blocked) html = viewExpired(user, trial);
  else html = (Views[State.view] || Views.landing)(user);
  app().innerHTML = shell(user, html);
  State.notice = null;
  bindCommon(user);
  if (!blocked) (Binders[State.view] || (() => {}))(user);
}

function bindCommon(user) {
  $$("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
  $$("[data-act='home']").forEach((b) => b.addEventListener("click", () => go(user ? "home" : "landing")));
  $$("[data-act='logout']").forEach((b) => b.addEventListener("click", () => { Store.logout(); notice("Cerraste la sesión."); go("landing"); }));
  $$("[data-act='report']").forEach((b) => b.addEventListener("click", () => openReport(user)));
  $$("[data-act='leave']").forEach((b) => b.addEventListener("click", () => go("leave", { step: 1 })));
  $$("[data-act='legal']").forEach((b) => b.addEventListener("click", () => go("legal", { doc: b.dataset.doc, back: State.view })));
  $$("[data-act='beta-info']").forEach((b) => b.addEventListener("click", () => go("legal", { doc: "beta", back: State.view })));
  const pb = $("[data-act='prefs']");
  if (pb) pb.addEventListener("click", () => { const p = $("#prefs"); p.hidden = !p.hidden; pb.setAttribute("aria-expanded", String(!p.hidden)); });
  const pr = Prefs.get();
  $$("[data-size]").forEach((b) => { b.setAttribute("aria-pressed", String((pr.size || "1") === b.dataset.size)); b.addEventListener("click", () => { Prefs.set({ size: b.dataset.size }); $$("[data-size]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }); });
  const sp = $("#pref-spacing"), co = $("#pref-contrast"), vo = $("#pref-voice");
  if (sp) { sp.checked = !!pr.spacing; sp.addEventListener("change", () => Prefs.set({ spacing: sp.checked })); }
  if (co) { co.checked = !!pr.contrast; co.addEventListener("change", () => Prefs.set({ contrast: co.checked })); }
  if (vo) { vo.checked = !!pr.voice; Voice.on = !!pr.voice; vo.addEventListener("change", () => { Prefs.set({ voice: vo.checked }); Voice.on = vo.checked; }); }
}

/* ---------- Modal genérico (en la página: no se usan alert/confirm) ---------- */
function modal(html, onMount) {
  const root = $("#modal-root");
  root.innerHTML = `<div class="modal-back"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">${html}</div></div>`;
  const close = () => { root.innerHTML = ""; };
  root.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
  root.querySelector(".modal-back").addEventListener("click", (e) => { if (e.target.classList.contains("modal-back")) close(); });
  document.addEventListener("keydown", function k(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", k); } });
  const first = root.querySelector("textarea, input, button"); if (first) first.focus();
  onMount && onMount(root, close);
}

/* ---------- Reportar un inconveniente (desde cualquier pantalla) ---------- */
function openReport(user) {
  const screen = State.view === "child" ? "Modo niño" : State.view;
  modal(`
    <h2 id="modal-title">Reportar un inconveniente</h2>
    <p>Contanos qué pasó. <strong>No incluyas nombres, datos que identifiquen a un paciente ni información clínica.</strong></p>
    <form id="rep-form" class="form">
      <label for="rep-desc">¿Qué pasó y en qué pantalla?</label>
      <textarea id="rep-desc" rows="5" required maxlength="2000" placeholder="Por ejemplo: al tocar «Terminar» no pasó nada."></textarea>
      <label for="rep-file">Captura de pantalla (opcional)</label>
      <input id="rep-file" type="file" accept="image/*">
      <p class="hint">Antes de adjuntarla, revisá que no se vean datos de pacientes.</p>
      <div class="row"><button class="btn btn-primary" type="submit">Enviar reporte</button><button class="btn btn-ghost" type="button" data-close>Cancelar</button></div>
    </form>`, (root, close) => {
    $("#rep-form", root).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = $("#rep-file", root).files[0];
      let shot = null;
      if (f) shot = await shrinkImage(f).catch(() => null);
      const number = Store.addReport(user, { description: $("#rep-desc", root).value.trim(), screenshot: shot, screen });
      $(".modal", root).innerHTML = `<h2 id="modal-title">Recibimos tu reporte</h2>
        <p>Tu número de seguimiento es <strong class="mono">${number}</strong>. Guardalo por si necesitás consultarnos.</p>
        <p>Los reportes de la beta nos ayudan a decidir qué corregir antes del lanzamiento.</p>
        <button class="btn btn-primary" data-close>Listo</button>`;
      $("[data-close]", root).addEventListener("click", close);
    });
  });
}
function shrinkImage(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => {
      const k = Math.min(1, 800 / img.width); const c = document.createElement("canvas");
      c.width = img.width * k; c.height = img.height * k; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.7)); }; img.onerror = rej; img.src = r.result; };
    r.onerror = rej; r.readAsDataURL(file);
  });
}

/* ==========================================================================
   Vistas
   ========================================================================== */
const Views = {};
const Binders = {};

/* ---------- Portada e ingreso ---------- */
Views.landing = () => `
  <section class="hero-band"><div class="wrap hero">
    <div class="hero-text">
      <p class="eyebrow">Versión beta · por invitación</p>
      <h1>Cada persona, un modo único de <span class="hl">aprender</span>.</h1>
      <p class="lead">Recursos psicopedagógicos para usar en consulta y en casa, con la familia acompañando y la profesional supervisando cada paso.</p>
      <div class="row wrap-row hero-cta"><a class="btn btn-primary btn-lg" href="#ingresar">Ingresar a la beta</a><button class="btn btn-outline btn-lg" data-go="register">Crear cuenta de familia</button></div>
      <p class="hint">Prueba gratuita de ${Store.db.config.trialDays} días desde la activación de tu cuenta.</p>
    </div>
    <div class="hero-art">${Scenes.hero()}</div>
  </div></section>

  <section class="wrap band-section">
    <p class="eyebrow center">Tres maneras de participar</p>
    <h2 class="section-title">Un mismo recorrido, cada quien en su rol</h2>
    <div class="role-grid">
      ${[["familia", "Familias y responsables", "Acompañan en casa las actividades que indica la profesional, sin resolver por el niño.", Scenes.family(150), "familia@demo.aprendersiendo.ar", "role-coral"],
         ["profesional", "Profesionales", "Indican actividades, siguen la participación y revisan las sugerencias automáticas.", Scenes.professional(150), "profesional@demo.aprendersiendo.ar", "role-verde"],
         ["admin", "Administración", "Gestiona cuentas, contenidos, reportes de la beta e indicadores generales.", Scenes.admin(150), "admin@demo.aprendersiendo.ar", "role-azul"]].map(([k, t, d, art, e, cls]) => `
        <article class="role-card ${cls}"><div class="role-art">${art}</div><h3>${t}</h3><p>${d}</p>
          <button class="btn btn-soft demo-acc" data-email="${e}">Probar con la cuenta de demostración</button></article>`).join("")}
    </div>
  </section>

  <section class="journey-band"><div class="wrap">
    <p class="eyebrow center">La experiencia del niño</p>
    <h2 class="section-title">Cuatro pasos, siempre en el mismo orden</h2>
    <ol class="journey">
      <li><span class="j-art">${Avatar.svg("rodetes", "alegria", 92)}</span><strong>Elige su personaje</strong><span>y cuenta cómo se siente al empezar.</span></li>
      <li><span class="j-art">${actIcon("secuencias", 92)}</span><strong>Hace la actividad</strong><span>con consignas claras y pistas que no resuelven por él.</span></li>
      <li><span class="j-art">${Avatar.svg("rulos", "alegria", 92)}</span><strong>Recibe un reconocimiento</strong><span>a su esfuerzo, no solo al resultado.</span></li>
      <li><span class="j-art">${Avatar.svg("largo", "calma", 92)}</span><strong>Cuenta cómo le fue</strong><span>con unas pocas preguntas sencillas.</span></li>
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
        <li><button class="linklike demo-acc" data-email="familia@demo.aprendersiendo.ar">familia@demo.aprendersiendo.ar</button></li>
        <li><button class="linklike demo-acc" data-email="profesional@demo.aprendersiendo.ar">profesional@demo.aprendersiendo.ar</button></li>
        <li><button class="linklike demo-acc" data-email="admin@demo.aprendersiendo.ar">admin@demo.aprendersiendo.ar</button></li>
      </ul>
      <p class="hint">Para probar el control de sesiones, abrí la demostración en otra pestaña e ingresá con la misma cuenta.</p>
      <div class="promise"><strong>Tecnología para aprender, con criterio profesional.</strong> Cada herramienta pasa por revisión psicopedagógica antes de publicarse.</div>
    </div>
  </section>`;

Binders.landing = () => {
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
    <p>Para acompañar en casa las actividades que indica la profesional.</p>
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
    Store.login(r.user); notice(`¡Listo! Tu prueba gratuita de ${Store.db.config.trialDays} días empezó hoy.`, "ok"); go("home");
  });
};

Views["request-pro"] = () => `
  <section class="narrow card">
    <h1>Solicitar acceso profesional</h1>
    <p>El Espacio Profesional es para psicopedagogas y psicopedagogos con matrícula vigente. Durante la beta verificamos cada matrícula a mano antes de activar la cuenta; la prueba gratuita empieza el día de la activación.</p>
    <form id="rp" class="form">
      <label for="rp-alias">Nombre para mostrar</label><input id="rp-alias" required maxlength="60">
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
    const r = await Store.register({ role: "profesional", email: $("#rp-email").value, alias: $("#rp-alias").value, pass: $("#rp-pass").value,
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

/* ==========================================================================
   FAMILIA
   ========================================================================== */
function weekCount(sessions, activityId) {
  const t = Store.now();
  return sessions.filter((s) => s.activityId === activityId && t - s.startAt <= 7 * DAY).length;
}
function familyHome(user) {
  const pats = Store.patientsFor(user);
  return `
  <section class="greet greet-coral"><div class="greet-text"><p class="eyebrow">Espacio familia</p><h1>Hola, ${esc(user.alias)}</h1>
  <p>Acá están las actividades que indicó la profesional. Tu rol es acompañar: dejá que el niño piense e intente; no hace falta resolver por él.</p></div>
  <div class="greet-art">${Scenes.family(190)}</div></section>
  ${pats.length ? pats.map((p) => {
    const plans = Store.plansFor(p.id).filter((pl) => Store.db.activityState[pl.activityId]?.enabled);
    const ses = Store.sessionsFor(user, p.id);
    return `<section class="card">
      <div class="card-head"><div>${Avatar.svg(p.avatarId, "calma", 64)}</div><div><h2>Paciente ${esc(p.code)}</h2><p class="muted">${p.ageYears} años</p></div></div>
      <h3>Actividades indicadas</h3>
      ${plans.length ? `<ul class="plan-list">${plans.map((pl) => { const a = actById(pl.activityId); const done = weekCount(ses, pl.activityId); return `
        <li class="plan-item">
          <span class="plan-icon">${actIcon(a.id, 72)}</span>
          <div class="plan-main"><strong>${esc(a.name)}</strong><span class="muted">${esc(a.area)} · Nivel ${pl.level}</span>
          <span class="week">Esta semana: ${done} de ${pl.perWeek} ${pl.perWeek === 1 ? "vez" : "veces"}</span>
          ${pl.note ? `<p class="pro-note"><strong>Indicación:</strong> ${esc(pl.note)}</p>` : ""}
          <p class="hint">${esc(a.forFamily)}</p></div>
          <button class="btn btn-primary btn-lg" data-start="${p.id}" data-activity="${a.id}" data-level="${pl.level}">Empezar</button>
        </li>`; }).join("")}</ul>` : `<div class="empty">${Scenes.empty(120)}<p>Todavía no hay actividades indicadas. La profesional las va a cargar desde su cuenta.</p></div>`}
      <details><summary>Últimas actividades realizadas</summary>
        ${ses.length ? `<ul class="hist">${ses.slice(0, 8).map((s) => `<li>${fmtDateTime(s.startAt)} · ${esc(actById(s.activityId)?.name)} · ${s.metrics.abandoned ? "sin terminar" : "terminada"}</li>`).join("")}</ul>` : "<p>Todavía no hay registros.</p>"}
      </details>
    </section>`; }).join("") : ""}
  <section class="card">
    <h2>${pats.length ? "Vincular otro paciente" : "Vinculá a tu hijo o hija"}</h2>
    <p>Pedile a la profesional el código de vinculación. Solo así vas a ver las actividades que indicó.</p>
    <form id="link" class="form inline"><label for="link-code" class="sr">Código</label><input id="link-code" placeholder="XXXX-XXXX" maxlength="9" required><button class="btn btn-soft">Vincular</button></form>
    <p class="err" id="link-err" role="alert"></p>
  </section>`;
}
function bindFamily(user) {
  $$("[data-start]").forEach((b) => b.addEventListener("click", () => startChild(user, b.dataset.start, b.dataset.activity, +b.dataset.level, "hogar")));
  $("#link").addEventListener("submit", (e) => {
    e.preventDefault();
    const r = Store.linkFamily(user, $("#link-code").value);
    if (r.error) { $("#link-err").textContent = r.error; return; }
    notice(`Vinculaste al paciente ${esc(r.patient.code)}.`, "ok"); go("home");
  });
}

/* ==========================================================================
   MODO NIÑO: avatar y ánimo → actividad → devolución → evaluación final
   ========================================================================== */
function startChild(user, patientId, activityId, level, context) {
  if (!Store.db.activityState[activityId]?.enabled) { notice("Esta actividad no está disponible en este momento.", "warn"); return render(); }
  const p = Store.db.patients.find((x) => x.id === patientId);
  State.child = { patientId, activityId, level, context, step: "avatar", avatarId: p.avatarId, rec: {} , backTo: State.view, backParams: State.params };
  State.view = "child"; render();
}

function renderChild(user) {
  const c = State.child;
  if (!user || !c) return go("home");
  const a = actById(c.activityId);
  let inner = "";
  if (c.step === "avatar") inner = `
    <h1 class="child-title">${CHILD_TEXT.pickAvatar}</h1>
    <div class="avatar-grid" role="group" aria-label="Personajes">${AVATARS.map((av) =>
      `<button class="avatar-btn ${c.avatarId === av.id ? "sel" : ""}" data-av="${av.id}" aria-pressed="${c.avatarId === av.id}">${Avatar.svg(av.id, "alegria", 92)}<span>${esc(av.label)}</span></button>`).join("")}</div>
    <div class="child-actions"><button class="btn btn-primary big" id="ch-next" ${c.avatarId ? "" : "disabled"}>Seguir</button></div>`;
  else if (c.step === "mood") inner = `
    <h1 class="child-title">${CHILD_TEXT.pickMood}</h1>
    ${moodPicker("ms", c.rec.moodStart)}
    <div class="child-actions"><button class="btn btn-primary big" id="ch-next" ${c.rec.moodStart ? "" : "disabled"}>${CHILD_TEXT.start}</button></div>`;
  else if (c.step === "activity") inner = `
    <div class="child-act-head">${Avatar.svg(c.avatarId, c.rec.moodStart, 64)}<div><h1 class="child-title sm">${esc(a.name)}</h1><p>${esc(a.instruction)}</p></div>
      <button class="btn btn-ghost" id="ch-voice" aria-label="Escuchar la consigna">🔊 Escuchar</button></div>
    <div id="act-root" class="act-root"></div>
    <div class="child-actions"><button class="btn btn-ghost" id="ch-stop">Quiero terminar acá</button></div>`;
  else if (c.step === "feedback") {
    const m = c.rec.metrics;
    inner = `<div class="feedback">
      <div class="cheer">${Scenes.childCheer(190)}${Avatar.svg(c.avatarId, "alegria", 110)}</div>
      <h1 class="child-title">${esc(c.feedbackText)}</h1>
      <div class="effort" aria-label="Reconocimiento al esfuerzo">${Array.from({ length: Math.max(1, Math.min(5, m.attempts)) }, () => `<span class="leaf" aria-hidden="true"></span>`).join("")}</div>
      <p>${m.abandoned ? "Hiciste una parte. ¡Cada intento cuenta!" : `Intentaste ${m.attempts} ${m.attempts === 1 ? "vez" : "veces"} y llegaste hasta el final.`}</p>
      <div class="child-actions"><button class="btn btn-primary big" id="ch-next">Seguir</button></div></div>`;
  } else if (c.step === "q1") inner = `<h1 class="child-title">${CHILD_TEXT.qDuring}</h1>${moodPicker("md", c.rec.moodDuring)}<div class="child-actions"><button class="btn btn-primary big" id="ch-next" ${c.rec.moodDuring ? "" : "disabled"}>Seguir</button></div>`;
  else if (c.step === "q2") inner = `<h1 class="child-title">${CHILD_TEXT.qAfter}</h1>${moodPicker("ma", c.rec.moodAfter)}<div class="child-actions"><button class="btn btn-primary big" id="ch-next" ${c.rec.moodAfter ? "" : "disabled"}>Seguir</button></div>`;
  else if (c.step === "q3") inner = `<h1 class="child-title">${CHILD_TEXT.qDifficulty}</h1>
    <div class="diff-row" role="group">${CHILD_TEXT.difficulty.map((d) => `<button class="diff-btn ${c.rec.difficulty === d.id ? "sel" : ""}" data-diff="${d.id}" aria-pressed="${c.rec.difficulty === d.id}">${esc(d.label)}</button>`).join("")}</div>
    <div class="child-actions"><button class="btn btn-primary big" id="ch-next" ${c.rec.difficulty ? "" : "disabled"}>Terminar</button></div>`;
  else if (c.step === "done") inner = `<div class="feedback">${Avatar.svg(c.avatarId, c.rec.moodAfter, 120)}<h1 class="child-title">${CHILD_TEXT.thanks}</h1>
    <p>${CHILD_TEXT.adultGate}</p><button class="btn btn-primary big hold" id="ch-exit"><span>Mantener apretado</span><i></i></button></div>`;

  app().innerHTML = shell(user, `<div class="child-wrap">${inner}</div>`, { child: true });
  bindCommon(user);
  bindChild(user);
}

function moodPicker(name, selected) {
  return `<div class="mood-grid" role="group" aria-label="Estados de ánimo">${MOODS.map((m) =>
    `<button class="mood-btn ${selected === m.id ? "sel" : ""}" data-mood="${m.id}" aria-pressed="${selected === m.id}">${Avatar.svg(State.child.avatarId, m.id, 84)}<span>${esc(m.label)}</span></button>`).join("")}</div>`;
}

function bindChild(user) {
  const c = State.child;
  const next = $("#ch-next");
  const advance = (step) => { c.step = step; renderChild(user); };
  if (c.step === "avatar") {
    Voice.say(CHILD_TEXT.pickAvatar);
    $$("[data-av]").forEach((b) => b.addEventListener("click", () => { c.avatarId = b.dataset.av; renderChild(user); }));
    next.addEventListener("click", () => advance("mood"));
  }
  if (["mood", "q1", "q2"].includes(c.step)) {
    const key = { mood: "moodStart", q1: "moodDuring", q2: "moodAfter" }[c.step];
    Voice.say({ mood: CHILD_TEXT.pickMood, q1: CHILD_TEXT.qDuring, q2: CHILD_TEXT.qAfter }[c.step]);
    $$("[data-mood]").forEach((b) => b.addEventListener("click", () => { c.rec[key] = b.dataset.mood; Voice.say(moodLabel(b.dataset.mood)); renderChild(user); }));
    next.addEventListener("click", () => {
      if (c.step === "mood") { c.rec.startAt = Store.now(); advance("activity"); }
      else advance(c.step === "q1" ? "q2" : "q3");
    });
  }
  if (c.step === "activity") {
    const a = actById(c.activityId);
    Voice.say(a.instruction);
    $("#ch-voice").addEventListener("click", () => { const was = Voice.on; Voice.on = true; Voice.say(a.instruction); Voice.on = was; });
    const engine = Engines[c.activityId]($("#act-root"), {
      level: c.level, say: (t) => Voice.say(t),
      onDone: (m) => { if (c.step !== "activity") return; c.rec.metrics = { level: c.level, ...m }; c.rec.endAt = Store.now();
        c.feedbackText = pick(CHILD_TEXT.feedback); advance("feedback"); }
    });
    $("#ch-stop").addEventListener("click", () => engine.abandon());
  }
  if (c.step === "feedback") { Voice.say(c.feedbackText); next.addEventListener("click", () => advance("q1")); }
  if (c.step === "q3") {
    Voice.say(CHILD_TEXT.qDifficulty);
    $$("[data-diff]").forEach((b) => b.addEventListener("click", () => { c.rec.difficulty = b.dataset.diff; renderChild(user); }));
    next.addEventListener("click", () => {
      Store.reload();
      const u = Store.currentUser();
      if (!u || !u.id) return render();
      Store.recordSession(u, { patientId: c.patientId, activityId: c.activityId, context: c.context, avatarId: c.avatarId, ...c.rec });
      advance("done");
    });
  }
  if (c.step === "done") {
    Voice.say(CHILD_TEXT.thanks);
    const b = $("#ch-exit"); let timer = null;
    const startHold = (e) => { e.preventDefault(); b.classList.add("holding"); timer = setTimeout(() => {
      const back = c.backTo, params = c.backParams; State.child = null; notice("Actividad registrada. ¡Gracias por acompañar!", "ok"); go(back || "home", params); }, 1500); };
    const stopHold = () => { b.classList.remove("holding"); clearTimeout(timer); };
    b.addEventListener("pointerdown", startHold); ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, stopHold));
    b.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) startHold(e); });
    b.addEventListener("keyup", stopHold);
  }
}

/* ==========================================================================
   PROFESIONAL
   ========================================================================== */
function proHome(user) {
  const pats = Store.patientsFor(user);
  const now = Store.now();
  return `
  <section class="greet greet-verde"><div class="greet-text"><p class="eyebrow">Espacio profesional</p><h1>Hola, ${esc(user.alias)}</h1>
    <p>Tenés ${pats.length} ${pats.length === 1 ? "paciente" : "pacientes"}. Cada paciente se identifica con un código; no se guardan nombres.</p>
    <button class="btn btn-primary" id="new-pat">Nuevo paciente</button></div><div class="greet-art">${Scenes.professional(190)}</div></section>
  <div id="new-pat-box"></div>
  <div class="table-wrap"><table class="tbl">
    <thead><tr><th>Código</th><th>Edad</th><th>Categoría</th><th>Sesiones (28 días)</th><th>Señales para revisar</th><th></th></tr></thead>
    <tbody>${pats.map((p) => {
      const r = Followup.analyze(Store.sessionsFor(user, p.id), Store.plansFor(p.id), now);
      return `<tr><td class="mono"><span class="cell-av">${Avatar.svg(p.avatarId, "calma", 34)}</span>${esc(p.code)}${p.synthetic ? ' <span class="pill pill-muted">ficticio</span>' : ""}</td><td>${p.ageYears}</td><td>${esc(dxLabel(p.diagnosis))}</td>
        <td class="num">${r.total}</td><td>${r.signals.length ? r.signals.map((s) => `<span class="pill pill-warn">${esc(FOLLOWUP_SUGGESTIONS[s.key].title)}</span>`).join(" ") : '<span class="pill pill-ok">Sin señales</span>'}</td>
        <td><button class="btn btn-soft" data-pat="${p.id}">Abrir</button></td></tr>`; }).join("") || `<tr><td colspan="6">Todavía no cargaste pacientes.</td></tr>`}</tbody>
  </table></div>`;
}
function bindPro(user) {
  $$("[data-pat]").forEach((b) => b.addEventListener("click", () => go("patient", { id: b.dataset.pat })));
  $("#new-pat").addEventListener("click", () => {
    $("#new-pat-box").innerHTML = `<form id="np" class="card form">
      <h2>Nuevo paciente</h2>
      <p class="hint">Solo pedimos lo mínimo: edad y categoría. El sistema asigna un código; no cargues nombres, documento ni escuela.</p>
      <div class="two"><div><label for="np-age">Edad (años)</label><input id="np-age" type="number" min="3" max="18" required></div>
      <div><label for="np-dx">Categoría diagnóstica</label><select id="np-dx" required>${DIAGNOSIS_CATEGORIES.map((d) => `<option value="${d.id}">${esc(d.label)}</option>`).join("")}</select></div></div>
      <p class="hint">Lista provisoria, pendiente de revisión clínica.</p>
      <label class="check"><input type="checkbox" id="np-cons" required> Cuento con el consentimiento del adulto responsable para registrar la actividad del paciente en la app.</label>
      <div class="row"><button class="btn btn-primary">Crear</button><button type="button" class="btn btn-ghost" id="np-cancel">Cancelar</button></div></form>`;
    $("#np-age").focus();
    $("#np-cancel").addEventListener("click", () => ($("#new-pat-box").innerHTML = ""));
    $("#np").addEventListener("submit", (e) => { e.preventDefault();
      const p = Store.createPatient(user, { ageYears: $("#np-age").value, diagnosis: $("#np-dx").value });
      notice(`Creaste el paciente ${p.code}. Compartí el código de vinculación con la familia.`, "ok"); go("patient", { id: p.id }); });
  });
}

/* ---------- Ficha del paciente ---------- */
Views.patient = (user) => {
  const p = Store.db.patients.find((x) => x.id === State.params.id);
  if (!Store.canSeePatient(user, p) || user.role !== "profesional") return `<p>No tenés acceso a este paciente.</p>`;
  const tab = State.params.tab || "seguimiento";
  const ses = Store.sessionsFor(user, p.id);
  const plans = Store.plansFor(p.id);
  return `
  <button class="linklike back" data-go="home">← Pacientes</button>
  <div class="page-head"><div class="card-head">${Avatar.svg(p.avatarId, "calma", 72)}<div><h1 class="mono">${esc(p.code)}</h1>
    <p class="muted">${p.ageYears} años · ${esc(dxLabel(p.diagnosis))} · ${p.familyUserIds.length ? "Familia vinculada" : "Sin familia vinculada"}</p></div></div>
    <div class="invite"><span class="muted small">Código para vincular a la familia</span><span class="mono big">${esc(p.inviteCode)}</span><span class="hint">De un solo uso</span></div></div>
  <div class="tabs" role="tablist">${[["seguimiento", "Seguimiento"], ["pauta", "Pauta de actividades"], ["registros", "Registros"]].map(([k, l]) =>
    `<button role="tab" aria-selected="${tab === k}" class="tab ${tab === k ? "on" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>
  ${tab === "seguimiento" ? followupView(user, p, ses, plans) : tab === "pauta" ? planView(user, p, plans) : recordsView(ses)}`;
};
Binders.patient = (user) => {
  const p = Store.db.patients.find((x) => x.id === State.params.id);
  if (!p) return;
  $$("[data-tab]").forEach((b) => b.addEventListener("click", () => go("patient", { id: p.id, tab: b.dataset.tab })));
  $$("[data-consult]").forEach((b) => b.addEventListener("click", () => {
    const pl = Store.plansFor(p.id).find((x) => x.activityId === b.dataset.consult);
    startChild(user, p.id, b.dataset.consult, pl ? pl.level : 1, "consulta");
  }));
  $$(".plan-form").forEach((f) => f.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = f.dataset.act;
    Store.setPlan(user, p.id, id, { perWeek: $(`#pw-${id}`).value, level: $(`#lv-${id}`).value, note: $(`#nt-${id}`).value, active: $(`#on-${id}`).checked });
    notice("Pauta guardada. La familia ya la ve en su inicio.", "ok"); go("patient", { id: p.id, tab: "pauta" });
  }));
  const rv = $("#review-form");
  if (rv) rv.addEventListener("submit", (e) => {
    e.preventDefault();
    const decision = (new FormData(rv)).get("decision");
    if (!decision) { $("#rv-err").textContent = "Elegí una opción."; return; }
    Store.saveReview(user, p.id, { decision, note: $("#rv-note").value.trim().slice(0, 1000), signals: JSON.parse(rv.dataset.signals) });
    notice("Guardamos tu revisión. Las sugerencias no se comparten con la familia.", "ok"); go("patient", { id: p.id });
  });
};

function bars(values, labels, max) {
  const m = Math.max(max || 0, ...values, 1);
  return `<div class="bars" role="img" aria-label="${labels.map((l, i) => l + ": " + values[i]).join(", ")}">${values.map((v, i) =>
    `<div class="bar-col"><span class="bar-val">${v}</span><div class="bar" style="height:${Math.round((v / m) * 100)}%"></div><span class="bar-lab">${labels[i]}</span></div>`).join("")}</div>`;
}

function followupView(user, p, ses, plans) {
  const r = Followup.analyze(ses, plans, Store.now());
  const sug = Followup.suggestions(r);
  const reviews = Store.reviewsFor(user, p.id);
  const moodRows = MOODS.filter((m) => r.moodStart[m.id] || r.moodEnd[m.id]);
  return `
  <div class="notice notice-info"><strong>Para leer estos datos:</strong> el desempeño dentro de la app no equivale a una mejoría ni a un retroceso clínico. La interpretación terapéutica es tuya.</div>
  <div class="grid-3">
    <div class="card stat"><span class="stat-lab">Adhesión a la pauta (7 días)</span><span class="stat-num">${r.adherencePct === null ? "—" : r.adherencePct + "%"}</span><span class="hint">${r.adherencePct === null ? "Sin pauta para comparar" : "Sesiones hechas sobre las indicadas"}</span></div>
    <div class="card stat"><span class="stat-lab">Sesiones en 28 días</span><span class="stat-num">${r.total}</span><span class="hint">Quincena anterior ${r.prev} · última ${r.last}</span></div>
    <div class="card stat"><span class="stat-lab">Señales para revisar</span><span class="stat-num">${r.signals.length}</span><span class="hint">Con umbrales de demostración</span></div>
  </div>
  <div class="grid-2">
    <section class="card"><h2>Participación por semana</h2>${bars(r.weeks, ["Hace 4 sem.", "Hace 3", "Hace 2", "Última"])}</section>
    <section class="card"><h2>Ánimo declarado</h2>
      ${moodRows.length ? `<div class="table-wrap"><table class="tbl compact"><thead><tr><th>Ánimo</th><th>Al empezar</th><th>Al terminar</th></tr></thead>
      <tbody>${moodRows.map((m) => `<tr><td>${esc(m.label)}</td><td class="num">${r.moodStart[m.id] || 0}</td><td class="num">${r.moodEnd[m.id] || 0}</td></tr>`).join("")}</tbody></table></div>` : "<p>Sin registros.</p>"}
      <p class="hint">Conteo de lo que eligió el niño. La app no calcula puntajes emocionales.</p></section>
  </div>
  <section class="card"><h2>Desempeño por actividad</h2>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Actividad</th><th>Sesiones</th><th>Aciertos al 1.er intento (últimas 3)</th><th>(3 anteriores)</th><th>Nivel actual</th><th>Última vez</th><th></th></tr></thead>
    <tbody>${r.perActivity.map((a) => `<tr><td>${esc(Followup.actName(a.id))}</td><td class="num">${a.count}</td><td class="num">${a.recentPct ?? "—"}%</td><td class="num">${a.prevPct ?? "—"}${a.prevPct === null ? "" : "%"}</td><td class="num">${a.level}</td><td>${fmtDate(a.lastAt)}</td>
      <td><button class="btn btn-soft" data-consult="${a.id}">Usar en consulta</button></td></tr>`).join("") || `<tr><td colspan="7">Todavía no hay sesiones.</td></tr>`}</tbody></table></div>
  </section>
  <section class="card ai-card">
    <div class="ai-head"><span class="pill pill-ai">Sugerencia automática</span><h2>Análisis asistido · requiere tu revisión</h2></div>
    <p class="hint">Indicadores calculados con reglas fijas a partir de los registros. En esta beta no interviene un modelo de lenguaje: el resumen con IA se conectará cuando se defina el proveedor, y recibirá solo indicadores con el código del paciente, nunca datos personales. Preguntas y recursos: borrador pendiente de revisión clínica.</p>
    ${sug.length ? `<div class="sug-list">${sug.map((s) => `<article class="sug">
      <h3>${esc(s.title)}</h3><p>${esc(s.detail)}</p>
      <div class="two"><div><h4>Preguntas para explorar</h4><ul>${s.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></div>
      <div><h4>Recursos alternativos posibles</h4><ul>${s.alternatives.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></div></div></article>`).join("")}</div>
      <form id="review-form" class="form review" data-signals='${esc(JSON.stringify(r.signals.map((s) => s.key)))}'>
        <fieldset><legend>Tu revisión</legend>
          <label class="check"><input type="radio" name="decision" value="considerada"> Lo revisé y lo voy a considerar</label>
          <label class="check"><input type="radio" name="decision" value="no-corresponde"> Lo revisé y no corresponde</label>
        </fieldset>
        <label for="rv-note">Nota para vos (opcional, sin datos identificatorios)</label><textarea id="rv-note" rows="2" maxlength="1000"></textarea>
        <p class="err" id="rv-err" role="alert"></p>
        <button class="btn btn-primary">Guardar revisión</button></form>` : `<p>No aparecen señales con los umbrales actuales.</p>`}
    ${reviews.length ? `<details><summary>Revisiones anteriores (${reviews.length})</summary><ul class="hist">${reviews.map((v) => `<li>${fmtDateTime(v.at)} · ${v.decision === "considerada" ? "La voy a considerar" : "No corresponde"}${v.note ? " · " + esc(v.note) : ""}</li>`).join("")}</ul></details>` : ""}
  </section>`;
}

function planView(user, p, plans) {
  const enabled = ACTIVITIES.filter((a) => Store.db.activityState[a.id]?.enabled);
  const fit = (a) => p.ageYears >= a.ageMin && p.ageYears <= a.ageMax;
  return `<p>Elegí qué actividades hace el paciente en casa y con qué frecuencia. La familia ve solo lo que actives acá.</p>
  <p class="hint">Rangos de edad y sugerencias por categoría: valores de demostración, pendientes de la ficha clínica.</p>
  <div class="plan-grid">${enabled.map((a) => {
    const pl = plans.find((x) => x.activityId === a.id) || Store.db.plans.find((x) => x.patientId === p.id && x.activityId === a.id);
    const suggested = a.suggestedFor.includes(p.diagnosis);
    return `<form class="card plan-form" data-act="${a.id}">
      <div class="plan-card-head">${actIcon(a.id, 52)}<h3>${esc(a.name)}</h3>${pl?.active ? '<span class="pill pill-ok">Indicada</span>' : ""}</div>
      <p class="muted">${esc(a.area)} · ${a.ageMin} a ${a.ageMax} años</p>
      <div class="chips">${fit(a) ? '<span class="pill">Adecuada a la edad</span>' : '<span class="pill pill-warn">Fuera del rango de edad</span>'}${suggested ? '<span class="pill">Sugerida para la categoría</span>' : ""}</div>
      <p>${esc(a.instruction)}</p>
      <div class="two"><div><label for="pw-${a.id}">Veces por semana</label><input id="pw-${a.id}" type="number" min="1" max="7" value="${pl?.perWeek || 2}"></div>
      <div><label for="lv-${a.id}">Nivel</label><select id="lv-${a.id}">${a.levels.map((l, i) => `<option value="${i + 1}" ${(pl?.level || 1) === i + 1 ? "selected" : ""}>${i + 1}. ${esc(l)}</option>`).join("")}</select></div></div>
      <label for="nt-${a.id}">Indicación para la familia (opcional)</label><textarea id="nt-${a.id}" rows="2" maxlength="280" placeholder="Sin datos identificatorios">${esc(pl?.note || "")}</textarea>
      <label class="check"><input type="checkbox" id="on-${a.id}" ${pl?.active ? "checked" : ""}> Indicar esta actividad</label>
      <div class="row"><button class="btn btn-primary">Guardar</button><button type="button" class="btn btn-soft" data-consult="${a.id}">Usar en consulta</button></div>
    </form>`; }).join("")}</div>`;
}

function recordsView(ses) {
  return `<div class="table-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Actividad</th><th>Dónde</th><th>Nivel</th><th>Completó</th><th>1.er intento</th><th>Intentos</th><th>Pistas</th><th>Ánimo inicio</th><th>Durante</th><th>Final</th><th>Le resultó</th></tr></thead>
  <tbody>${ses.map((s) => `<tr><td>${fmtDateTime(s.startAt)}</td><td>${esc(actById(s.activityId)?.name)}</td><td>${s.context}</td><td class="num">${s.metrics.level}</td>
    <td class="num">${s.metrics.completed}/${s.metrics.items}${s.metrics.abandoned ? " (dejó)" : ""}</td><td class="num">${s.metrics.firstTry}</td><td class="num">${s.metrics.attempts}</td><td class="num">${s.metrics.hints}</td>
    <td>${esc(moodLabel(s.moodStart))}</td><td>${esc(moodLabel(s.moodDuring))}</td><td>${esc(moodLabel(s.moodAfter))}</td><td>${esc((CHILD_TEXT.difficulty.find((d) => d.id === s.difficulty) || {}).label || "—")}</td></tr>`).join("") || `<tr><td colspan="12">Sin registros.</td></tr>`}</tbody></table></div>`;
}

/* ---------- Catálogo ---------- */
Views.catalog = () => `
  <h1>Catálogo de actividades</h1>
  <div class="notice notice-warn"><strong>Contenido de demostración.</strong> Las mecánicas funcionan, pero las consignas, edades y criterios deben revisarse y aprobarse antes de usarse con pacientes reales. Versión de contenido: ${esc(CONTENT_VERSION)}.</div>
  <div class="plan-grid">${ACTIVITIES.map((a) => `<article class="card act-card">
    <div class="act-card-head">${actIcon(a.id, 64)}<h2>${esc(a.name)}</h2></div><p class="muted">${esc(a.area)} · ${a.ageMin} a ${a.ageMax} años · ${Store.db.activityState[a.id].enabled ? "Disponible" : "Retirada"}</p>
    <p>${esc(a.instruction)}</p><p class="hint">Niveles: ${a.levels.map(esc).join(" · ")}</p>
    <p class="hint">Para la familia: ${esc(a.forFamily)}</p></article>`).join("")}</div>`;

/* ==========================================================================
   MI CUENTA, DATOS Y BAJA
   ========================================================================== */
Views.account = (user) => {
  const t = Store.trialInfo(user);
  return `<h1>Mi cuenta</h1>
  <div class="grid-2">
    <section class="card"><h2>Datos de la cuenta</h2>
      <dl class="dl"><dt>Nombre para mostrar</dt><dd>${esc(user.alias)}</dd><dt>Correo</dt><dd>${esc(user.email)}</dd><dt>Perfil</dt><dd>${roleLabel[user.role]}</dd>
      ${user.matricula ? `<dt>Matrícula</dt><dd>${esc(user.matricula.numero)} · ${esc(user.matricula.provincia)} · ${user.matricula.verificada ? "verificada el " + fmtDate(user.matricula.verifiedAt) : "sin verificar"}</dd>` : ""}
      <dt>Activación</dt><dd>${user.activatedAt ? fmtDate(user.activatedAt) : "—"}</dd>
      <dt>Prueba gratuita</dt><dd>${t ? (t.expired ? "Terminó el " + fmtDate(t.end) : `Quedan ${t.daysLeft} días (hasta el ${fmtDate(t.end)})`) : "—"}</dd></dl></section>
    <section class="card"><h2>Autorizaciones</h2>
      <p>Términos y privacidad aceptados el ${fmtDate(user.consents.terms.at)} (versión ${esc(user.consents.terms.v)}).</p>
      <label class="check"><input type="checkbox" id="impr" ${user.consents.improvement.granted ? "checked" : ""}> <span>Autorizo usar datos sin identificación, agregados, para mejorar los programas (opcional).</span></label>
      <p class="hint">Este uso es distinto del necesario para prestar el servicio. Podés cambiarlo cuando quieras.</p></section>
  </div>
  <section class="card"><h2>Tus datos</h2>
    <p>Podés pedir acceso a tus datos, corregirlos o suprimirlos (Ley 25.326). Te respondemos con el número de solicitud.</p>
    <form id="dr" class="form"><div class="two"><div><label for="dr-kind">Tipo de solicitud</label><select id="dr-kind"><option value="acceso">Acceso a mis datos</option><option value="rectificacion">Corregir datos</option><option value="supresion">Suprimir datos</option><option value="otra">Otra consulta</option></select></div>
    <div><label for="dr-det">Detalle (opcional)</label><input id="dr-det" maxlength="300"></div></div>
    <button class="btn btn-soft">Enviar solicitud</button></form>
    <p class="ok-msg" id="dr-ok" role="status"></p></section>
  <section class="card danger-zone"><h2>Dar de baja mi cuenta</h2><p>Podés darte de baja en cualquier momento, durante la prueba o después.</p>
    <button class="btn btn-danger" data-act="leave">Dar de baja mi cuenta</button></section>`;
};
Binders.account = (user) => {
  $("#impr").addEventListener("change", (e) => { Store.setImprovementConsent(user, e.target.checked); notice(e.target.checked ? "Guardamos tu autorización." : "Retiraste tu autorización.", "ok"); render(); });
  $("#dr").addEventListener("submit", (e) => { e.preventDefault();
    const n = Store.addDataRequest(user, $("#dr-kind").value, $("#dr-det").value);
    $("#dr-ok").textContent = `Recibimos tu solicitud. Número: ${n}.`; $("#dr").reset(); });
};

Views.leave = (user) => {
  const step = State.params.step || 1;
  const isPro = user.role === "profesional";
  if (step === 1) return `<section class="narrow card">
    <p class="eyebrow">Paso 1 de 3</p><h1>¿Querés dar de baja tu cuenta?</h1>
    <p>Vas a dejar de poder ingresar a Aprender Siendo con este correo.</p>
    <div class="row"><button class="btn btn-danger" data-step="2">Sí, quiero seguir</button><button class="btn btn-ghost" data-go="home">No, volver</button></div></section>`;
  if (step === 2) return `<section class="narrow card">
    <p class="eyebrow">Paso 2 de 3</p><h1>Qué pasa con tu cuenta y tus datos</h1>
    <h2>El servicio</h2><ul><li>Se cierra tu sesión y no vas a poder volver a ingresar.</li>
      <li>Durante la beta no hay suscripción ni cobros, así que no hay nada que cancelar.</li>
      ${isPro ? "<li>Tus pacientes quedan archivados y las familias vinculadas dejan de ver sus pautas.</li>" : "<li>Se quita tu vínculo con los pacientes. La profesional conserva sus registros profesionales.</li>"}</ul>
    <h2>Tus datos</h2><ul><li>Tu correo y tu nombre para mostrar se borran en el momento.</li>
      <li>Los registros de actividad ${isPro ? "de tus pacientes" : "que hiciste acompañando"} se conservan según la política de conservación: ${esc(LEGAL.retention)}</li>
      <li>Podés pedir la supresión de datos con una solicitud desde «Mi cuenta» antes de darte de baja.</li></ul>
    <form id="lv" class="form"><label for="lv-pass">Confirmá con tu contraseña</label><input id="lv-pass" type="password" required autocomplete="current-password">
      <p class="err" id="lv-err" role="alert"></p>
      <div class="row"><button class="btn btn-danger">Dar de baja definitivamente</button><button type="button" class="btn btn-ghost" data-go="home">Cancelar</button></div></form></section>`;
  return "";
};
Binders.leave = (user) => {
  $$("[data-step]").forEach((b) => b.addEventListener("click", () => go("leave", { step: +b.dataset.step })));
  const f = $("#lv");
  if (f) f.addEventListener("submit", async (e) => { e.preventDefault();
    if ((await Store.hash($("#lv-pass").value, user.salt)) !== user.passHash) { $("#lv-err").textContent = "La contraseña no coincide."; return; }
    Store.deleteAccount(user); go("left"); });
};
Views.left = () => `<section class="narrow card"><p class="eyebrow">Paso 3 de 3</p><h1>Tu cuenta fue dada de baja</h1>
  <p>La operación se completó el ${fmtDateTime(Store.now())}. Cerramos tu sesión y borramos tu correo y tu nombre para mostrar.</p>
  <p>Si querés consultar algo sobre tus datos, escribinos a <span class="mono">${esc(LEGAL.contact)}</span>.</p>
  <button class="btn btn-primary" data-go="landing">Ir al inicio</button></section>`;

/* ==========================================================================
   ADMINISTRACIÓN
   ========================================================================== */
const K_MIN = 5; // supresión de grupos chicos en indicadores agregados
const kfmt = (n) => (n > 0 && n < K_MIN ? `<span title="Grupo menor a ${K_MIN}: se oculta para evitar reidentificación">menos de ${K_MIN}</span>` : String(n));

function adminHome(user) {
  const tab = State.params.tab || "indicadores";
  const tabs = [["indicadores", "Indicadores"], ["usuarios", "Usuarios"], ["contenidos", "Contenidos"], ["reportes", "Reportes"], ["sesiones", "Sesiones activas"], ["datos", "Solicitudes de datos"], ["auditoria", "Auditoría"], ["config", "Configuración de la beta"]];
  return `<section class="greet greet-azul"><div class="greet-text"><p class="eyebrow">Administración</p><h1>Panel de la beta</h1><p>La administración ve indicadores agregados y datos de cuentas. No ve registros individuales de pacientes.</p></div><div class="greet-art">${Scenes.admin(180)}</div></section>
  <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${tab === k}" class="tab ${tab === k ? "on" : ""}" data-atab="${k}">${l}</button>`).join("")}</div>
  ${AdminTabs[tab](user)}`;
}
const AdminTabs = {
  indicadores() {
    const db = Store.db, t = Store.now();
    const users = db.users.filter((u) => u.role !== "admin");
    const active = users.filter((u) => u.status === "activa");
    const trials = active.map((u) => Store.trialInfo(u)).filter(Boolean);
    const s7 = db.activitySessions.filter((s) => t - s.startAt <= 7 * DAY);
    const s28 = db.activitySessions.filter((s) => t - s.startAt <= 28 * DAY);
    const completion = s28.length ? Math.round((s28.filter((s) => !s.metrics.abandoned).length / s28.length) * 100) : 0;
    const byAct = ACTIVITIES.map((a) => [a.name, s28.filter((s) => s.activityId === a.id).length]);
    const weeks = [0, 0, 0, 0]; s28.forEach((s) => { const w = Math.floor((t - s.startAt) / (7 * DAY)); if (w < 4) weeks[3 - w]++; });
    const openReports = db.reports.filter((r) => r.status !== "resuelto").length;
    return `<div class="grid-4">
      <div class="card stat"><span class="stat-lab">Cuentas activas</span><span class="stat-num">${active.length}</span><span class="hint">${active.filter((u) => u.role === "profesional").length} profesionales · ${active.filter((u) => u.role === "familia").length} familias</span></div>
      <div class="card stat"><span class="stat-lab">Pruebas por vencer (≤ ${db.config.warnDays} días)</span><span class="stat-num">${trials.filter((x) => x.warn).length}</span><span class="hint">${trials.filter((x) => x.expired).length} vencidas</span></div>
      <div class="card stat"><span class="stat-lab">Sesiones de actividad (7 días)</span><span class="stat-num">${s7.length}</span><span class="hint">Completadas en 28 días: ${completion}%</span></div>
      <div class="card stat"><span class="stat-lab">Reportes abiertos</span><span class="stat-num">${openReports}</span><span class="hint">${db.users.filter((u) => u.status === "pendiente").length} solicitudes profesionales pendientes</span></div>
    </div>
    <div class="grid-2"><section class="card"><h2>Sesiones por semana (todas las cuentas)</h2>${bars(weeks, ["Hace 4 sem.", "Hace 3", "Hace 2", "Última"])}</section>
    <section class="card"><h2>Uso por actividad (28 días)</h2><div class="table-wrap"><table class="tbl compact"><tbody>${byAct.map(([n, v]) => `<tr><td>${esc(n)}</td><td class="num">${kfmt(v)}</td></tr>`).join("")}</tbody></table></div>
      <p class="hint">Los grupos de menos de ${K_MIN} se ocultan para reducir el riesgo de identificar a alguien.</p></section></div>
    <section class="card"><h2>Ánimo declarado (agregado, 28 días)</h2><div class="table-wrap"><table class="tbl compact"><thead><tr><th>Ánimo</th><th>Al empezar</th><th>Al terminar</th></tr></thead><tbody>
      ${MOODS.map((m) => `<tr><td>${esc(m.label)}</td><td class="num">${kfmt(s28.filter((s) => s.moodStart === m.id).length)}</td><td class="num">${kfmt(s28.filter((s) => s.moodAfter === m.id).length)}</td></tr>`).join("")}</tbody></table></div>
      <p class="hint">${db.users.filter((u) => u.consents?.improvement?.granted).length} cuentas autorizaron el uso para mejora de programas.</p></section>`;
  },
  usuarios() {
    const db = Store.db;
    return `<section class="card"><h2>Crear cuenta profesional verificada</h2>
      <form id="cp" class="form"><div class="grid-form">
        <div><label for="cp-alias">Nombre para mostrar</label><input id="cp-alias" required></div>
        <div><label for="cp-email">Correo</label><input id="cp-email" type="email" required></div>
        <div><label for="cp-pass">Contraseña inicial</label><input id="cp-pass" minlength="8" required></div>
        <div><label for="cp-mat">N.º de matrícula</label><input id="cp-mat" required></div>
        <div><label for="cp-prov">Provincia</label><input id="cp-prov" required></div></div>
        <label class="check"><input type="checkbox" required> Verifiqué la matrícula en el registro oficial o con la constancia del colegio.</label>
        <p class="err" id="cp-err" role="alert"></p><button class="btn btn-primary">Crear y activar</button></form></section>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Cuenta</th><th>Perfil</th><th>Estado</th><th>Matrícula</th><th>Prueba</th><th>Mejora</th><th>Acciones</th></tr></thead>
    <tbody>${db.users.map((u) => { const t = Store.trialInfo(u); return `<tr>
      <td>${esc(u.alias)}<br><span class="small mono">${esc(u.email)}</span></td><td>${roleLabel[u.role]}</td>
      <td><span class="pill ${u.status === "activa" ? "pill-ok" : u.status === "pendiente" ? "pill-warn" : "pill-muted"}">${u.status}</span></td>
      <td>${u.matricula ? `${esc(u.matricula.numero)} · ${esc(u.matricula.provincia)} · ${u.matricula.verificada ? "verificada" : "sin verificar"}` : "—"}</td>
      <td>${t ? (t.expired ? "vencida" : t.daysLeft + " días") : "—"}</td><td>${u.consents?.improvement?.granted ? "sí" : "no"}</td>
      <td class="actions">${u.status === "pendiente" ? `<button class="btn btn-soft" data-verify="${u.id}">Verifiqué la matrícula: activar</button>` : ""}
        ${t && u.status === "activa" ? `<button class="btn btn-ghost" data-shift="${u.id}" title="Solo para probar la beta">Simular +5 días</button>` : ""}</td></tr>`; }).join("")}</tbody></table></div>`;
  },
  contenidos() {
    const db = Store.db;
    return `<div class="notice notice-info">Retirar una actividad la oculta de inmediato para familias y profesionales (retiro de emergencia). Volver a habilitarla solo repone la versión que ya estaba aprobada; el contenido nuevo pasa por revisión clínica.</div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Actividad</th><th>Área</th><th>Edades</th><th>Estado</th><th></th></tr></thead><tbody>
    ${ACTIVITIES.map((a) => `<tr><td>${esc(a.name)}</td><td>${esc(a.area)}</td><td>${a.ageMin}–${a.ageMax}</td><td>${db.activityState[a.id].enabled ? '<span class="pill pill-ok">Disponible</span>' : '<span class="pill pill-muted">Retirada</span>'}</td>
      <td><button class="btn ${db.activityState[a.id].enabled ? "btn-danger" : "btn-soft"}" data-toggle="${a.id}">${db.activityState[a.id].enabled ? "Retirar" : "Habilitar"}</button></td></tr>`).join("")}</tbody></table></div>
    <p class="hint">Versión de contenido: ${esc(CONTENT_VERSION)}</p>`;
  },
  reportes() {
    const db = Store.db;
    return `<div class="table-wrap"><table class="tbl"><thead><tr><th>N.º</th><th>Fecha</th><th>Perfil</th><th>Pantalla</th><th>Descripción</th><th>Captura</th><th>Estado</th></tr></thead><tbody>
    ${db.reports.map((r) => `<tr><td class="mono">${r.number}</td><td>${fmtDateTime(r.createdAt)}</td><td>${esc(r.role)}</td><td>${esc(r.screen)}</td><td class="wrap-cell">${esc(r.description)}</td>
      <td>${r.screenshot ? `<img src="${r.screenshot}" alt="Captura del reporte ${r.number}" class="thumb">` : "—"}</td>
      <td><select data-rstatus="${r.id}" aria-label="Estado del reporte ${r.number}">${["nuevo", "en revisión", "resuelto"].map((s) => `<option ${r.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></td></tr>`).join("") || `<tr><td colspan="7">Sin reportes.</td></tr>`}</tbody></table></div>`;
  },
  sesiones() {
    const db = Store.db;
    const rows = Object.entries(db.activeSessions).filter(([, s]) => Store.sessionAlive(s));
    return `<p>Cada cuenta puede tener una sola sesión activa. Las sesiones se cierran solas tras ${db.config.sessionIdleMin} minutos sin actividad.</p>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Cuenta</th><th>Inicio</th><th>Última actividad</th><th>Navegador</th><th></th></tr></thead><tbody>
    ${rows.map(([uid, s]) => { const u = db.users.find((x) => x.id === uid); return `<tr><td>${esc(u?.email)}</td><td>${fmtDateTime(s.startedAt)}</td><td>${fmtDateTime(s.lastSeen)}</td><td class="small">${esc(s.ua)}</td>
      <td><button class="btn btn-soft" data-kill="${uid}">Cerrar sesión</button></td></tr>`; }).join("") || `<tr><td colspan="5">No hay sesiones activas.</td></tr>`}</tbody></table></div>`;
  },
  datos() {
    const db = Store.db;
    return `<div class="table-wrap"><table class="tbl"><thead><tr><th>N.º</th><th>Fecha</th><th>Cuenta</th><th>Tipo</th><th>Detalle</th><th>Estado</th></tr></thead><tbody>
    ${db.dataRequests.map((r) => `<tr><td class="mono">${r.number}</td><td>${fmtDateTime(r.createdAt)}</td><td>${esc(db.users.find((u) => u.id === r.userId)?.email)}</td><td>${esc(r.kind)}</td><td class="wrap-cell">${esc(r.detail)}</td><td>${esc(r.status)}</td></tr>`).join("") || `<tr><td colspan="6">Sin solicitudes.</td></tr>`}</tbody></table></div>`;
  },
  auditoria() {
    const db = Store.db;
    return `<div class="table-wrap"><table class="tbl compact"><thead><tr><th>Fecha</th><th>Cuenta</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>
    ${db.audit.slice(0, 150).map((a) => `<tr><td>${fmtDateTime(a.at)}</td><td class="small">${esc(db.users.find((u) => u.id === a.userId)?.email || "—")}</td><td>${esc(a.action)}</td><td class="wrap-cell small">${esc(a.detail)}</td></tr>`).join("")}</tbody></table></div>`;
  },
  config() {
    const c = Store.db.config;
    return `<section class="card"><h2>Parámetros de la beta</h2>
      <form id="cfg" class="form"><div class="grid-form">
        <div><label for="cfg-trial">Días de prueba gratuita</label><input id="cfg-trial" type="number" min="1" max="60" value="${c.trialDays}"></div>
        <div><label for="cfg-warn">Avisar cuando falten (días)</label><input id="cfg-warn" type="number" min="1" max="14" value="${c.warnDays}"></div>
        <div><label for="cfg-idle">Cerrar sesión tras inactividad (min)</label><input id="cfg-idle" type="number" min="5" max="240" value="${c.sessionIdleMin}"></div></div>
        <button class="btn btn-primary">Guardar</button></form></section>
    <section class="card"><h2>Herramientas de prueba</h2>
      <p>Adelantar el reloj de la demostración permite probar avisos y vencimientos sin esperar. Hoy está adelantado <strong>${c.clockOffsetDays} días</strong>.</p>
      <div class="row wrap-row"><button class="btn btn-soft" data-clock="1">Adelantar 1 día</button><button class="btn btn-soft" data-clock="5">Adelantar 5 días</button><button class="btn btn-ghost" data-clock="0">Volver a hoy</button></div>
      <hr><p>Reiniciar borra todo lo cargado en este navegador y vuelve a los datos ficticios iniciales.</p>
      <button class="btn btn-danger" id="reset">Reiniciar la demostración</button></section>`;
  }
};
function bindAdmin(user) {
  $$("[data-atab]").forEach((b) => b.addEventListener("click", () => go("home", { tab: b.dataset.atab })));
  const cp = $("#cp");
  if (cp) cp.addEventListener("submit", async (e) => { e.preventDefault();
    const r = await Store.adminCreateProfessional(user, { email: $("#cp-email").value, alias: $("#cp-alias").value, pass: $("#cp-pass").value, numero: $("#cp-mat").value, provincia: $("#cp-prov").value });
    if (r.error) { $("#cp-err").textContent = r.error; return; }
    notice("Cuenta profesional creada y activada. Su prueba empieza hoy.", "ok"); go("home", { tab: "usuarios" }); });
  $$("[data-verify]").forEach((b) => b.addEventListener("click", () => { Store.verifyProfessional(user, b.dataset.verify); notice("Matrícula verificada. La cuenta está activa.", "ok"); go("home", { tab: "usuarios" }); }));
  $$("[data-shift]").forEach((b) => b.addEventListener("click", () => { Store.shiftActivation(user, b.dataset.shift, 5); go("home", { tab: "usuarios" }); }));
  $$("[data-toggle]").forEach((b) => b.addEventListener("click", () => { const id = b.dataset.toggle; Store.setActivity(user, id, !Store.db.activityState[id].enabled); go("home", { tab: "contenidos" }); }));
  $$("[data-rstatus]").forEach((s) => s.addEventListener("change", () => Store.setReportStatus(user, s.dataset.rstatus, s.value)));
  $$("[data-kill]").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.kill === user.id) { notice("Esa es tu propia sesión. Usá «Salir».", "warn"); return go("home", { tab: "sesiones" }); }
    Store.adminCloseSession(user, b.dataset.kill); go("home", { tab: "sesiones" }); }));
  const cfg = $("#cfg");
  if (cfg) cfg.addEventListener("submit", (e) => { e.preventDefault();
    Store.setConfig(user, { trialDays: +$("#cfg-trial").value, warnDays: +$("#cfg-warn").value, sessionIdleMin: +$("#cfg-idle").value });
    notice("Configuración guardada.", "ok"); go("home", { tab: "config" }); });
  $$("[data-clock]").forEach((b) => b.addEventListener("click", () => {
    const v = +b.dataset.clock; Store.setConfig(user, { clockOffsetDays: v === 0 ? 0 : Store.db.config.clockOffsetDays + v });
    Store.heartbeat(); go("home", { tab: "config" }); }));
  const rs = $("#reset");
  if (rs) rs.addEventListener("click", () => modal(`<h2 id="modal-title">¿Reiniciar la demostración?</h2><p>Se borra todo lo cargado en este navegador.</p>
    <div class="row"><button class="btn btn-danger" id="do-reset">Sí, reiniciar</button><button class="btn btn-ghost" data-close>Cancelar</button></div>`,
    (root) => $("#do-reset", root).addEventListener("click", async () => { await Store.reset(); notice("Demostración reiniciada.", "ok"); go("landing"); })));
}

/* ==========================================================================
   TEXTOS LEGALES (BORRADOR)
   ========================================================================== */
const draftBanner = `<div class="notice notice-warn"><strong>Borrador ${esc(LEGAL.version)} (${esc(LEGAL.updated)}).</strong> Pendiente de revisión jurídica y de la supervisora clínica. No usar como texto definitivo.</div>`;
const LegalDocs = {
  beta: { title: "Qué significa que sea una versión beta", body: () => `
    <p>Aprender Siendo está en <strong>etapa beta</strong>: una versión de prueba que usamos con un grupo de participantes invitados para validar que todo funcione antes del lanzamiento.</p>
    <ul><li>Puede haber errores. Si encontrás uno, usá «Reportar un inconveniente» (está en todas las pantallas).</li>
    <li>Las actividades y textos todavía están en revisión profesional.</li>
    <li>Esta demostración guarda todo solo en tu navegador, con datos ficticios. No cargues datos reales de pacientes.</li>
    <li>Durante la beta evaluamos: facilidad de uso, funcionamiento de actividades y seguimiento, permisos y privacidad, control de sesiones, prueba gratuita, baja de cuentas y reportes.</li></ul>` },
  terminos: { title: "Términos de uso", body: () => `${draftBanner}
    <h3>1. Qué es Aprender Siendo</h3><p>Una aplicación con recursos psicopedagógicos para usar en consulta y en casa, con participación de las familias y supervisión profesional. No reemplaza la evaluación ni el tratamiento profesional.</p>
    <h3>2. Versión beta</h3><p>El servicio está en etapa beta, con acceso por invitación. Puede tener errores o cambios.</p>
    <h3>3. Cuentas</h3><p>Hay cuentas de familia o responsable, de profesional (con matrícula verificada) y de administración. Cada cuenta puede tener una sola sesión activa a la vez.</p>
    <h3>4. Prueba gratuita</h3><p>Cada cuenta tiene ${Store.db.config.trialDays} días de prueba gratuita desde su activación. La app muestra el tiempo restante y avisa antes del vencimiento. Condiciones posteriores: ${esc(LEGAL.postTrialConditions)}</p>
    <h3>5. Uso responsable</h3><p>Las actividades se hacen siguiendo la indicación de la profesional. Las sugerencias automáticas son orientativas y las revisa la profesional; el desempeño en la app no equivale a mejoría o retroceso clínico.</p>
    <h3>6. Baja</h3><p>Podés dar de baja tu cuenta en cualquier momento desde «Dar de baja mi cuenta».</p>
    <h3>7. Contacto</h3><p>${esc(LEGAL.contact)}</p>` },
  privacidad: { title: "Información de privacidad", body: () => `${draftBanner}
    <h3>Qué datos tratamos</h3>
    <ul><li><strong>De tu cuenta:</strong> correo, nombre para mostrar, contraseña cifrada, fechas de alta y activación, autorizaciones otorgadas y datos técnicos de la sesión (identificador del dispositivo y navegador, inicio y última actividad).</li>
    <li><strong>De profesionales:</strong> número de matrícula, provincia y fecha de verificación.</li>
    <li><strong>Del paciente:</strong> un código asignado por el sistema, edad, categoría diagnóstica, actividades indicadas y, por cada actividad, fecha, lugar (casa o consulta), resultados (pasos completados, intentos, pistas), el personaje elegido y el ánimo que el niño eligió al empezar y al terminar. No pedimos nombre, documento, escuela ni domicilio del niño.</li>
    <li><strong>Reportes y solicitudes:</strong> el texto que escribas y la captura que adjuntes.</li></ul>
    <h3>Para qué los usamos</h3><ul><li>Prestar el servicio: mostrar las actividades indicadas y que la profesional haga el seguimiento.</li>
    <li>Solo si lo autorizás aparte: mejorar los programas con datos agregados y sin identificación.</li></ul>
    <h3>Quién puede verlos</h3><ul><li>La profesional a cargo ve los registros de sus pacientes.</li><li>La familia vinculada ve las actividades indicadas y las realizadas, no el análisis profesional.</li>
    <li>La administración ve datos de cuentas e indicadores agregados, no registros individuales de pacientes.</li></ul>
    <h3>Un aviso importante sobre el anonimato</h3><p>Para seguir la evolución de cada paciente usamos un código persistente. Eso <strong>no es anonimato absoluto</strong>: la profesional sabe a quién corresponde y, combinado con otros datos, podría permitir identificar a una persona. Por eso el seguimiento individual se guarda separado de las estadísticas generales, que son agregadas y ocultan los grupos chicos.</p>
    <h3>Cómo los protegemos y cuánto tiempo</h3><p>Acceso según el perfil, contraseñas cifradas, segundo factor para profesionales y administración, una sesión activa por cuenta y registro de auditoría. Conservación: ${esc(LEGAL.retention)}</p>
    <h3>Tus derechos</h3><p>Podés pedir acceso, corrección o supresión de tus datos desde «Mi cuenta» (Ley 25.326), o escribir a ${esc(LEGAL.contact)}.</p>
    <h3>En esta demostración</h3><p>Todo queda guardado solo en tu navegador; no se envía a ningún servidor.</p>` },
  ia: { title: "Uso de inteligencia artificial", body: () => `${draftBanner}
    <p>Siempre te decimos cuándo interviene una herramienta automática.</p>
    <ul><li>Los indicadores de seguimiento (adhesión, participación, desempeño, ánimo declarado) se calculan con reglas fijas y verificables, no con un modelo de lenguaje.</li>
    <li>Las sugerencias que ve la profesional están marcadas como «Sugerencia automática» y requieren su revisión. Nunca se muestran a familias ni a niños.</li>
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

/* ==========================================================================
   Arranque y control de sesión entre pestañas
   ========================================================================== */
(async function boot() {
  Prefs.apply(); Voice.on = !!Prefs.get().voice;
  await Store.init();
  render();
  setInterval(() => {
    Store.reload();
    const c = Store.currentUser();
    if (c && c.id) Store.heartbeat();
    else if (c && (c.kicked || c.expired) && State.view !== "landing") render();
  }, 15000);
  window.addEventListener("storage", (e) => {
    if (e.key !== DB_KEY) return;
    Store.reload();
    const c = Store.currentUser();
    if (c && c.kicked) { State.child = null; notice("Se cerró esta sesión porque tu cuenta se abrió en otro dispositivo o navegador.", "warn"); go("landing"); }
  });
})();

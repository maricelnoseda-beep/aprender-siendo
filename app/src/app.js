/* ==========================================================================
   app.js — Interfaz de la beta de demostración de Aprender Siendo
   ========================================================================== */

const APP_VERSION = "0.4.0-beta2 (2026-11-08)";
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (t) => new Date(t).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDateTime = (t) => new Date(t).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const dxLabel = (id) => (DIAGNOSIS_CATEGORIES.find((d) => d.id === id) || { label: id }).label;
const moodLabel = (id) => (MOODS.find((m) => m.id === id) || { label: "—" }).label || "—";
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
    r.dataset.line = p.line || ""; r.dataset.letter = p.letter ? "wide" : ""; r.dataset.font = p.font || ""; r.dataset.calm = p.calm ? "on" : "";
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
      <button class="btn btn-ghost" data-act="prefs" aria-expanded="false">Cómo leer</button>
      ${user ? `<span class="who">${esc(user.alias)} · ${roleLabel[user.role]}</span><button class="btn btn-ghost" data-act="logout">Salir</button>` : ""}
    </nav>
  </div>
  <div class="wrap prefs" id="prefs" hidden>
    <strong class="prefs-title">Elegí cómo te resulta más cómodo leer</strong>
    <span>Tamaño de letra</span>
    <button class="btn btn-soft" data-size="1">A</button><button class="btn btn-soft" data-size="2">A+</button><button class="btn btn-soft" data-size="3">A++</button>
    <label>Letra <select id="pref-font"><option value="">Atkinson Hyperlegible Next</option><option value="manrope">Manrope</option><option value="sistema">La del sistema</option></select></label>
    <label>Interlineado <select id="pref-line"><option value="">Normal</option><option value="wide">Amplio</option><option value="wider">Muy amplio</option></select></label>
    <label><input type="checkbox" id="pref-letter"> Más espacio entre letras</label>
    <label><input type="checkbox" id="pref-spacing"> Más espacio entre palabras</label>
    <label><input type="checkbox" id="pref-contrast"> Más contraste</label>
    <label><input type="checkbox" id="pref-calm"> Modo calma (menos movimiento y color)</label>
    <label><input type="checkbox" id="pref-voice"> Leer en voz alta las consignas</label>
  </div></header>
  ${trial ? trialBar(trial) : ""}`}
  ${!child && State.view !== (user ? "home" : "landing") || (!child && user && State.params && State.params.tab && State.params.tab !== "resumen") ? `<div class="wrap home-bar"><button class="back-home" data-act="home">${homeIcon()} Volver al inicio</button></div>` : ""}
  ${State.notice ? `<div class="wrap"><div class="notice notice-${State.notice.kind}" role="status">${State.notice.text}</div></div>` : ""}
  <main id="main" class="${child ? "child-main" : State.view === "landing" && !user ? "bleed" : "wrap main"}">${child ? childBackdrop() : ""}${inner}</main>
  <footer class="foot ${child ? "foot-child" : ""}">${child ? "" : `<div class="wrap foot-brand">${brandMark(48)}<div><strong class="brand-name">Aprender Siendo</strong><p>Cada persona, un modo único de aprender.</p></div></div>`}<div class="wrap foot-in">
    ${child ? `<button class="foot-link strong" id="ch-home">${homeIcon()} Volver al inicio</button>` : ""}
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

function homeIcon() {
  return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9h4.5v-5h3v5H18v-9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
}

/* Sujeción "mantener apretado" para que la salida la haga una persona adulta. */
function holdButton(b, onDone, ms = 1500) {
  let timer = null;
  const startHold = (e) => { e.preventDefault(); b.classList.add("holding"); timer = setTimeout(onDone, ms); };
  const stopHold = () => { b.classList.remove("holding"); clearTimeout(timer); };
  b.addEventListener("pointerdown", startHold); ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, stopHold));
  b.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) startHold(e); });
  b.addEventListener("keyup", stopHold);
}

function navFor(user) {
  const items = {
    familia: [["home", "Inicio"], ["account", "Mi cuenta"]],
    profesional: [["home", "Pacientes"], ["catalog", "Aventuras"], ["account", "Mi cuenta"]],
    admin: [["home", "Panel"]]
  }[user.role];
  return items.map(([v, l]) => `<button class="btn btn-ghost ${State.view === v ? "is-on" : ""}" data-go="${v}">${l}</button>`).join("")
    + (user.role === "admin" ? "" : `<button class="btn btn-soft btn-suggest" data-act="suggest">Sugerencias</button>`);
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
const ACT_COLORS = { memoria: ["#F2B8A2", "#E07B5F"], secuencias: ["#C9D8EE", "#4F7BB0"], distinto: ["#F4E3B8", "#C99528"], contar: ["#DCE9E2", "#55867D"], clasificar: ["#E4DBF2", "#8A72B8"], isla: ["#D9EEF0", "#1B7F86"] };
function actIcon(id, size = 64) {
  const [bg, fg] = ACT_COLORS[id] || ["#DCE9E2", "#315F59"];
  const art = {
    isla: `<path d="M10 66 Q50 54 90 66 L90 90 H10Z" fill="#9FD3D8"/><ellipse cx="50" cy="64" rx="28" ry="9" fill="#F2D59A"/><path d="M50 62 Q48 40 54 26" stroke="#8A5A3B" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M54 26 Q40 20 30 30 M54 26 Q66 16 76 24 M54 26 Q58 36 68 40 M54 26 Q46 34 38 42" stroke="${fg}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="76" cy="16" r="6" fill="#F2B33D"/>`,
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
  const pf = $("#pref-font"), pl = $("#pref-line"), plt = $("#pref-letter"), pc = $("#pref-calm");
  if (pf) { pf.value = pr.font || ""; pf.addEventListener("change", () => Prefs.set({ font: pf.value })); }
  if (pl) { pl.value = pr.line || ""; pl.addEventListener("change", () => Prefs.set({ line: pl.value })); }
  if (plt) { plt.checked = !!pr.letter; plt.addEventListener("change", () => Prefs.set({ letter: plt.checked })); }
  if (pc) { pc.checked = !!pr.calm; pc.addEventListener("change", () => Prefs.set({ calm: pc.checked })); }
  $$("[data-act='suggest']").forEach((b) => b.addEventListener("click", () => openSuggestion(user)));
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

/* ---------- Sugerencias (familia y profesional) ----------
   Se guardan en la beta para que las evalúe el equipo profesional y técnico, y se
   abre el correo ya completo para enviarlas a LEGAL.suggestionsTo. El envío desde
   el servidor queda para cuando haya backend (decisión del responsable técnico). */
const SUG_KINDS = [["mejora", "Una mejora"], ["nueva", "Una aventura o función nueva"], ["texto", "Un texto que no se entiende"], ["accesibilidad", "Accesibilidad"], ["otra", "Otra"]];
const SUG_AREAS = [["aventuras", "Aventuras del chico o la chica"], ["familia", "Espacio familia"], ["profesional", "Espacio profesional"], ["seguimiento", "Seguimiento e informes"], ["general", "General"]];
function mailtoSuggestion(sg) {
  const body = `Sugerencia ${sg.number}\nPerfil: ${roleLabel[sg.role]}\nTipo: ${(SUG_KINDS.find((k) => k[0] === sg.kind) || [, sg.kind])[1]}\nÁrea: ${(SUG_AREAS.find((k) => k[0] === sg.area) || [, sg.area])[1]}\n\n${sg.text}\n\n(Enviada desde la beta de Aprender Siendo, ${APP_VERSION})`;
  return `mailto:${LEGAL.suggestionsTo}?subject=${encodeURIComponent("Sugerencia " + sg.number + " · beta Aprender Siendo")}&body=${encodeURIComponent(body)}`;
}
function openSuggestion(user) {
  if (!user) return;
  modal(`
    <h2 id="modal-title">Sugerencias</h2>
    <p>Contanos qué mejorarías. Cada sugerencia la evalúan el equipo profesional y el equipo técnico. <strong>No incluyas nombres, datos de contacto ni información clínica de ningún chico o chica.</strong></p>
    <form id="sug-form" class="form">
      <div class="two"><div><label for="sug-kind">¿Qué querés sugerir?</label><select id="sug-kind">${SUG_KINDS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>
      <div><label for="sug-area">¿Sobre qué parte?</label><select id="sug-area">${SUG_AREAS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div></div>
      <label for="sug-text">Tu sugerencia</label>
      <textarea id="sug-text" rows="5" required minlength="10" maxlength="2000"></textarea>
      <p class="err" id="sug-err" role="alert"></p>
      <div class="row"><button class="btn btn-primary" type="submit">Enviar sugerencia</button><button class="btn btn-ghost" type="button" data-close>Cancelar</button></div>
    </form>`, (root, close) => {
    $("#sug-form", root).addEventListener("submit", (e) => {
      e.preventDefault();
      const text = $("#sug-text", root).value.trim();
      const pii = Rules.piiCheck(text);
      if (!pii.ok) { $("#sug-err", root).textContent = "Parece que el texto incluye " + pii.found.join(", ") + ". Sacalo antes de enviar."; return; }
      const sg = Store.addSuggestion(user, { kind: $("#sug-kind", root).value, area: $("#sug-area", root).value, text });
      const href = mailtoSuggestion(sg);
      $(".modal", root).innerHTML = `<h2 id="modal-title">¡Gracias por tu sugerencia!</h2>
        <p>Quedó registrada con el número <strong class="mono">${sg.number}</strong> para que la evalúe el equipo.</p>
        <p>Para que llegue también por correo a <span class="mono">${esc(LEGAL.suggestionsTo)}</span>, tocá «Enviar por correo»: se abre tu programa de correo con el texto listo.</p>
        <div class="row wrap-row"><a class="btn btn-primary" id="sug-mail" href="${href}">Enviar por correo</a><button class="btn btn-soft" id="sug-copy">Copiar el texto</button><button class="btn btn-ghost" data-close>Listo</button></div>
        <p class="hint" id="sug-copied" role="status"></p>`;
      $("[data-close]", root).addEventListener("click", close);
      $("#sug-copy", root).addEventListener("click", async () => { try { await navigator.clipboard.writeText(sg.number + "\n\n" + sg.text); $("#sug-copied", root).textContent = "Texto copiado."; } catch (er) { $("#sug-copied", root).textContent = "No se pudo copiar. Seleccioná el texto a mano."; } });
    });
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
      ${[["familia", "Familias y responsables", "Acompañan en casa las aventuras que indica la profesional, o crean un perfil libre para jugar sin profesional.", Scenes.family(150), "familia@demo.aprendersiendo.ar", "role-coral"],
         ["profesional", "Profesionales", "Indican aventuras, arman el plan de intervención y siguen la participación con alertas calculadas por reglas fijas.", Scenes.professional(150), "profesional@demo.aprendersiendo.ar", "role-verde"],
         ["admin", "Administración", "Gestiona cuentas, contenidos, reportes de la beta e indicadores generales.", Scenes.admin(150), "admin@demo.aprendersiendo.ar", "role-azul"]].map(([k, t, d, art, e, cls]) => `
        <article class="role-card ${cls}"><div class="role-art">${art}</div><h3>${t}</h3><p>${d}</p>
          <button class="btn btn-soft demo-acc" data-email="${e}">Probar con la cuenta de demostración</button></article>`).join("")}
    </div>
  </section>

  <section class="journey-band"><div class="wrap">
    <p class="eyebrow center">La aventura del chico o la chica</p>
    <h2 class="section-title">Descubrir, jugar, hacer y contar</h2>
    <ol class="journey">
      <li><span class="j-art">${Avatar.svg("rodetes", "alegria", 92)}</span><strong>Descubrir</strong><span>Mira cómo se hace, después de contar cómo viene (o saltearlo).</span></li>
      <li><span class="j-art">${actIcon("secuencias", 92)}</span><strong>Jugar</strong><span>La dificultad se ajusta sola con reglas fijas para que sea un desafío justo.</span></li>
      <li><span class="j-art">${Avatar.svg("rulos", "alegria", 92)}</span><strong>Hacer</strong><span>Un desafío cortito para casa o el aula, fuera de la pantalla.</span></li>
      <li><span class="j-art">${Avatar.svg("largo", "calma", 92)}</span><strong>Contar</strong><span>Qué le ayudó y cómo le resultó. Su compañero crece con cada aventura.</span></li>
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
   FAMILIA (M08: la familia ve práctica, no interpretación)
   ========================================================================== */
function linkBadge(p) {
  if (p.mode === "libre") return `<span class="pill">Modo libre</span>`;
  const l = Store.link(p);
  return l.status === "activa" ? `<span class="pill pill-ok">Con profesional</span>` : l.status === "pendiente" ? `<span class="pill pill-warn">Vinculación pendiente</span>`
    : l.status === "revocada" ? `<span class="pill pill-muted">Vinculación revocada</span>` : `<span class="pill pill-muted">Vinculación suspendida</span>`;
}
function familyConsentBox(p) {
  if (p.mode !== "vinculado") return "";
  const age = Store.age(p), l = Store.link(p), out = [];
  const pro = Store.db.users.find((u) => u.id === p.professionalId);
  if (age < 16 && l.missing.some((m) => m.includes("representante"))) out.push(`<form class="consent-form" data-consent="${p.id}">
      <h4>${esc(age >= 13 ? CONSENT_FORMS.teen1315.title : CONSENT_FORMS.child.title)}</h4>
      <p class="legal-ph">${esc(CONSENT_FORMS.child.body)} <em>Texto jurídico pendiente.</em></p>
      <label class="check"><input type="checkbox" required> Como representante, doy mi consentimiento para que ${esc(pro?.alias || "la profesional")} vea la práctica en Aprender Siendo.</label>
      ${age < 13 ? `<label class="check"><input type="checkbox" name="mood"> Opcional: autorizo que el ánimo que elija al empezar se guarde y lo vea solo la profesional.</label>` : ""}
      <button class="btn btn-primary">Dar mi consentimiento</button>${age >= 13 ? `<p class="hint">Además, el adolescente tiene que dar su asentimiento desde su espacio.</p>` : `<p class="hint">Al entrar, le vamos a preguntar al niño si está de acuerdo, con palabras simples.</p>`}</form>`);
  if (age >= 13 && age < 16 && l.missing.some((m) => m.includes("asentimiento"))) out.push(`<p class="hint">Falta el asentimiento del adolescente: se le pide cuando entra a su espacio.</p>`);
  if (age >= 16 && age < 18) {
    const sent = p.consents.find((x) => x.type === "aviso-enviado");
    const recd = p.consents.some((x) => x.type === "aviso-recibido");
    if (sent) out.push(`<div class="notice notice-info"><strong>Aviso:</strong> el adolescente dio su consentimiento para trabajar con una profesional en Aprender Siendo. Se respeta su confidencialidad, con las excepciones que fija la ley. ${esc(sent.detail.split(". ").slice(-1)[0])}
      ${recd ? "" : `<button class="btn btn-soft" data-notice="${p.id}">Recibí el aviso</button>`}</div>`);
    else if (l.missing.length) out.push(`<p class="hint">A los 16 y 17 años consiente el propio adolescente; te vamos a avisar cuando lo haga.</p>`);
    if (sent && !p.oppositionPending && l.status === "activa") out.push(`<button class="btn btn-ghost" data-oppose="${p.id}">Me opongo a esta vinculación</button>`);
    if (p.oppositionPending) out.push(`<p class="hint">Registramos tu oposición. La profesional la evalúa considerando el interés superior del adolescente.</p>`);
  }
  if (age < 16 && l.status === "activa") out.push(`<button class="btn btn-ghost" data-revoke="${p.id}">Revocar mi consentimiento</button>`);
  return out.length ? `<div class="consent-box">${out.join("")}</div>` : "";
}
function familyHome(user) {
  const pats = Store.patientsFor(user);
  return `
  <section class="greet greet-coral"><div class="greet-text"><p class="eyebrow">Espacio familia</p><h1>Hola, ${esc(user.alias)}</h1>
  <p>Tu rol es acompañar: dejá que piense e intente; no hace falta resolver por él o por ella.</p></div>
  <div class="greet-art">${Scenes.family(190)}</div></section>
  <div class="notice notice-info">${esc(FAMILY_TEXT.consult)}</div>
  ${pats.map((p) => familyProfileCard(user, p)).join("")}
  <section class="card"><h2>Agregar un perfil en modo libre</h2>
    <p>Sin profesional: práctica y apoyo, sin informes ni interpretación.</p>
    <form id="free" class="form inline"><label for="fr-alias" class="sr">Apodo</label><input id="fr-alias" required maxlength="30" placeholder="Apodo (no el nombre real)">
      <label for="fr-age" class="sr">Edad</label><input id="fr-age" type="number" min="3" max="18" required placeholder="Edad"><button class="btn btn-soft">Crear perfil</button></form>
  </section>
  <section class="card">
    <h2>Vincular con una profesional</h2>
    <p>Pedile a la profesional el código de vinculación.</p>
    <form id="link" class="form inline"><label for="link-code" class="sr">Código</label><input id="link-code" placeholder="XXXX-XXXX" maxlength="9" required><button class="btn btn-soft">Vincular</button></form>
    <p class="err" id="link-err" role="alert"></p>
  </section>`;
}
function familyProfileCard(user, p) {
  const age = Store.age(p);
  if (age >= 18 && p.selfOwner && !p.familyAuthorized) return `<section class="card"><h2>${esc(p.alias || p.code)}</h2><p>Esta persona cumplió 18 años y tomó la titularidad de su cuenta. Ya no ves su actividad.</p></section>`;
  const route = Rules.route(age);
  const l = Store.link(p);
  const ses = Store.db.activitySessions.filter((s) => s.patientId === p.id).sort((a, b) => b.startAt - a.startAt);
  const r = Followup.analyze(ses, [], Store.now());
  const fit = (a) => age >= a.ageMin && age <= a.ageMax && Store.db.activityState[a.id]?.enabled;
  const plans = Store.plansFor(p.id).filter((pl) => Store.db.activityState[pl.activityId]?.enabled);
  const list = p.mode === "libre" ? ACTIVITIES.filter(fit) : plans.map((pl) => actById(pl.activityId));
  const can = (w) => Rules.familyCanSee(p, age, w);
  const canPlay = p.mode === "libre" || l.status === "activa" || l.status === "pendiente";
  return `<section class="card" data-profile="${p.id}">
    <div class="card-head"><div>${Avatar.svg(p.avatarId || "zorro", "calma", 64)}</div><div><h2>${esc(p.alias || p.code)}</h2>
      <p class="muted">${age} años · ruta ${route} ${linkBadge(p)}</p></div></div>
    ${familyConsentBox(p)}
    <h3>Aventuras</h3>
    ${list.length ? `<ul class="plan-list">${list.map((a) => { const pl = plans.find((x) => x.activityId === a.id); return `
      <li class="plan-item"><span class="plan-icon">${actIcon(a.id, 64)}</span>
        <div class="plan-main"><strong>${esc(a.name)}</strong><span class="muted">${esc(a.skill)}${can("nivel") && p.adaptive[a.id] ? " · Nivel " + p.adaptive[a.id].level : ""}</span>
        ${pl && pl.perWeek ? `<span class="week">Sugerido: ${pl.perWeek} ${pl.perWeek === 1 ? "vez" : "veces"} por semana</span>` : ""}
        ${pl && pl.note ? `<p class="pro-note"><strong>Indicación:</strong> ${esc(pl.note)}</p>` : ""}
        ${age < 13 ? `<p class="hint">${esc(a.forFamily)}</p>` : ""}
        <details class="ficha-fam"><summary>Para qué sirve</summary><p>${esc(TRANSFER[a.ficha.variant].fam(a))}</p><p class="prueba-tag">${PRUEBA}</p></details></div>
        <button class="btn btn-primary btn-lg" data-start="${p.id}" data-activity="${a.id}" ${canPlay ? "" : "disabled"}>Empezar</button>
      </li>`; }).join("")}</ul>` : `<div class="empty">${Scenes.empty(110)}<p>${p.mode === "libre" ? "No hay aventuras para esta edad todavía." : "La profesional todavía no indicó aventuras."}</p></div>`}
    <h3>Cómo viene la práctica (últimos 28 días)</h3>
    <div class="grid-3 small-stats">
      <div class="stat"><span class="stat-lab">Tiempo</span><span class="stat-num">${r.minutes} min</span></div>
      <div class="stat"><span class="stat-lab">Aventuras</span><span class="stat-num">${r.total}</span></div>
      ${can("desafios") ? `<div class="stat"><span class="stat-lab">Desafíos en casa</span><span class="stat-num">${p.desafiosHechos || 0}</span></div>` : ""}
    </div>
    ${age < 13 ? `<p class="hint">${esc(FAMILY_TEXT.adjust)}</p>` : `<p class="hint">Por su edad, solo ves el tiempo y las aventuras. Lo demás es privado.</p>`}
    ${can("objetivos") && p.objectives.length ? `<div class="shared"><h4>Lo que compartió la profesional</h4><ul>${p.objectives.map((o) => `<li>Objetivo: ${esc(o.text)}</li>`).join("")}</ul></div>` : ""}
    ${age < 13 ? `<div class="row"><button class="btn btn-soft" data-desafio="${p.id}">Hicimos un desafío en casa</button></div>` : ""}
    <div class="row wrap-row"><button class="btn btn-ghost" data-export="${p.id}">Descargar los datos</button>
      ${p.mode === "libre" ? `<details><summary>Elegir aventuras</summary>${ACTIVITIES.filter(fit).map((a) => `<label class="check"><input type="checkbox" data-freeplan="${p.id}" value="${a.id}" ${plans.some((x) => x.activityId === a.id) || !plans.length ? "checked" : ""}> ${esc(a.name)}</label>`).join("")}</details>` : ""}</div>
  </section>`;
}
function bindFamily(user) {
  $$("[data-start]").forEach((b) => b.addEventListener("click", () => startChild(user, b.dataset.start, b.dataset.activity, "hogar")));
  $("#link").addEventListener("submit", (e) => {
    e.preventDefault();
    const r = Store.linkFamily(user, $("#link-code").value);
    if (r.error) { $("#link-err").textContent = r.error; return; }
    notice(`Vinculaste el perfil ${esc(r.patient.code)}. Falta registrar el consentimiento.`, "ok"); go("home");
  });
  $("#free").addEventListener("submit", (e) => { e.preventDefault(); const p = Store.createFreeProfile(user, { alias: $("#fr-alias").value, ageYears: $("#fr-age").value }); notice(`Creaste el perfil ${esc(p.alias)} en modo libre.`, "ok"); go("home"); });
  $$("[data-consent]").forEach((f) => f.addEventListener("submit", async (e) => {
    e.preventDefault(); const id = f.dataset.consent;
    const r = await Store.consent(user, id, "consentimiento-representante", "formulario " + CONSENT_FORMS.version);
    if (r.error) return notice(r.error, "warn"), render();
    if (f.querySelector("[name=mood]")) Store.setMoodConsent(user, id, f.querySelector("[name=mood]").checked);
    notice("Registramos tu consentimiento.", "ok"); render();
  }));
  $$("[data-notice]").forEach((b) => b.addEventListener("click", async () => { await Store.noticeReceived(user, b.dataset.notice); notice("Registramos que recibiste el aviso.", "ok"); render(); }));
  $$("[data-oppose]").forEach((b) => b.addEventListener("click", async () => { await Store.consent(user, b.dataset.oppose, "oposicion-representante", ""); notice("Registramos tu oposición y le avisamos a la profesional.", "ok"); render(); }));
  $$("[data-revoke]").forEach((b) => b.addEventListener("click", () => modal(`<h2 id="modal-title">¿Revocar el consentimiento?</h2><p>La vinculación con la profesional termina. Se conservan los registros que la ley exige.</p>
    <div class="row"><button class="btn btn-danger" id="rv-ok">Revocar</button><button class="btn btn-ghost" data-close>Cancelar</button></div>`, (root, close) => {
    $("#rv-ok", root).addEventListener("click", async () => { await Store.consent(user, b.dataset.revoke, "revocacion", "por el representante"); close(); notice("Revocaste el consentimiento. La vinculación terminó.", "ok"); render(); });
  })));
  $$("[data-desafio]").forEach((b) => b.addEventListener("click", () => { Store.bumpDesafio(b.dataset.desafio); notice("¡Listo! Sumamos un detalle a su mundo.", "ok"); render(); }));
  $$("[data-freeplan]").forEach((cb) => cb.addEventListener("change", () => {
    const pid = cb.dataset.freeplan;
    $$(`[data-freeplan="${pid}"]`).forEach((x) => Store.setFreePlan(user, pid, x.value, x.checked)); render();
  }));
  $$("[data-export]").forEach((b) => b.addEventListener("click", () => {
    const p = Store.db.patients.find((x) => x.id === b.dataset.export), age = Store.age(p);
    const ses = Store.db.activitySessions.filter((s) => s.patientId === p.id);
    const data = { aviso: FAMILY_TEXT.export, exportado: new Date(Store.now()).toISOString(), perfil: { codigo: p.code, apodo: p.alias, edad: age, modo: p.mode },
      sesiones: ses.map((s) => age >= 13 ? { fecha: new Date(s.startAt).toISOString(), aventura: actById(s.activityId)?.name, minutos: Math.round(((s.endAt || s.startAt) - s.startAt) / 60000) }
        : { fecha: new Date(s.startAt).toISOString(), aventura: actById(s.activityId)?.name, completo: !s.metrics.abandoned, desafio: !!s.desafioHecho }),
      consentimientos: p.consents.map(({ type, at, hash }) => ({ tipo: type, fecha: new Date(at).toISOString(), huella: hash })) };
    download("datos-" + p.code + ".json", JSON.stringify(data, null, 2));
  }));
}

/* ==========================================================================
   PROFESIONAL
   ========================================================================== */
function proAlerts(user, p) {
  if (!Store.proHasData(user, p)) return [];
  const ses = Store.sessionsFor(user, p.id);
  return Rules.alerts({ sessions: ses, plans: Store.plansFor(p.id), objectives: p.objectives, moodsNewestFirst: ses.map((s) => s.moodStart), linked: true, now: Store.now() });
}
function proHome(user) {
  const pats = Store.patientsFor(user);
  return `
  <section class="greet greet-verde"><div class="greet-text"><p class="eyebrow">Espacio profesional</p><h1>Hola, ${esc(user.alias)}</h1>
    <p>Tenés ${pats.length} ${pats.length === 1 ? "paciente" : "pacientes"}. Cada paciente se identifica con un código; no se guardan nombres.</p>
    <button class="btn btn-primary" id="new-pat">Nuevo paciente</button></div><div class="greet-art">${Scenes.professional(190)}</div></section>
  <div id="new-pat-box"></div>
  <div class="table-wrap"><table class="tbl">
    <thead><tr><th>Código</th><th>Edad</th><th>Ruta</th><th>Vinculación</th><th>Alertas</th><th></th></tr></thead>
    <tbody>${pats.map((p) => {
      const al = proAlerts(user, p), l = Store.link(p);
      return `<tr><td class="mono"><span class="cell-av">${Avatar.svg(p.avatarId || "zorro", "calma", 34)}</span>${esc(p.code)}${p.synthetic ? ' <span class="pill pill-muted">ficticio</span>' : ""}</td><td>${Store.age(p)}</td><td>${Store.route(p)}</td>
        <td>${l.status === "activa" ? '<span class="pill pill-ok">Activa</span>' : `<span class="pill pill-warn">${esc(l.status)}</span>`}${p.oppositionPending ? ' <span class="pill pill-warn">Oposición del representante</span>' : ""}</td>
        <td>${al.length ? al.map((s) => `<span class="pill pill-warn">${esc(s.title)}</span>`).join(" ") : '<span class="pill pill-ok">Sin alertas</span>'}</td>
        <td><button class="btn btn-soft" data-pat="${p.id}">Abrir</button></td></tr>`; }).join("") || `<tr><td colspan="6">Todavía no cargaste pacientes.</td></tr>`}</tbody>
  </table></div>`;
}
function bindPro(user) {
  $$("[data-pat]").forEach((b) => b.addEventListener("click", () => go("patient", { id: b.dataset.pat })));
  $("#new-pat").addEventListener("click", () => {
    $("#new-pat-box").innerHTML = `<form id="np" class="card form">
      <h2>Nuevo paciente</h2>
      <p class="hint">Solo lo mínimo: edad y categoría. El sistema asigna un código; no cargues nombres, documento ni escuela.</p>
      <div class="two"><div><label for="np-age">Edad (años)</label><input id="np-age" type="number" min="3" max="18" required></div>
      <div><label for="np-dx">Categoría (solo la ves vos)</label><select id="np-dx" required>${DIAGNOSIS_CATEGORIES.map((d) => `<option value="${d.id}">${esc(d.label)}</option>`).join("")}</select></div></div>
      <label for="np-alias">Apodo para la experiencia (lo elige el adulto titular; no el nombre real)</label><input id="np-alias" maxlength="30">
      <p class="hint">Los consentimientos se registran en la app: la familia (y, según la edad, el niño o el adolescente) los da desde su espacio.</p>
      <div class="row"><button class="btn btn-primary">Crear</button><button type="button" class="btn btn-ghost" id="np-cancel">Cancelar</button></div></form>`;
    $("#np-age").focus();
    $("#np-cancel").addEventListener("click", () => ($("#new-pat-box").innerHTML = ""));
    $("#np").addEventListener("submit", (e) => { e.preventDefault();
      const p = Store.createPatient(user, { ageYears: $("#np-age").value, diagnosis: $("#np-dx").value, alias: $("#np-alias").value });
      notice(`Creaste el paciente ${p.code}. Compartí el código de vinculación con la familia.`, "ok"); go("patient", { id: p.id }); });
  });
}

/* ---------- Ficha del paciente ---------- */
const PRO_TABS = [["seguimiento", "Seguimiento"], ["informe", "Informe"], ["plan", "Plan de intervención"], ["evaluacion", "Evaluación inicial y final"], ["pauta", "Pauta de aventuras"], ["familia", "Qué ve la familia"], ["consentimientos", "Consentimientos"], ["registros", "Registros"]];
Views.patient = (user) => {
  const p = Store.db.patients.find((x) => x.id === State.params.id);
  if (!Store.canSeePatient(user, p) || user.role !== "profesional") return `<p>No tenés acceso a este paciente.</p>`;
  const l = Store.link(p), has = Store.proHasData(user, p);
  const tab = has ? (State.params.tab || "seguimiento") : "consentimientos";
  const ses = Store.sessionsFor(user, p.id);
  const plans = Store.plansFor(p.id);
  const views = { seguimiento: () => followupView(user, p, ses, plans), informe: () => reportView(user, p, ses, plans), plan: () => interventionView(user, p),
    evaluacion: () => measuresView(user, p), pauta: () => planView(user, p, plans), familia: () => shareView(p), consentimientos: () => consentView(user, p), registros: () => recordsView(ses) };
  return `
  <button class="linklike back" data-go="home">← Pacientes</button>
  <div class="page-head"><div class="card-head">${Avatar.svg(p.avatarId || "zorro", "calma", 72)}<div><h1 class="mono">${esc(p.code)}</h1>
    <p class="muted">${Store.age(p)} años · ruta ${Store.route(p)} · ${esc(dxLabel(p.diagnosis))} · ${p.familyUserIds.length ? "Familia vinculada" : "Sin familia vinculada"}</p></div></div>
    <div class="invite"><span class="muted small">Código para vincular a la familia</span><span class="mono big">${esc(p.inviteCode)}</span><span class="hint">De un solo uso</span></div></div>
  ${l.status !== "activa" ? `<div class="notice notice-warn"><strong>Vinculación ${esc(l.status)}.</strong> ${l.missing.map(esc).join(" · ") || ""} Hasta que esté activa no ves registros de este paciente.</div>` : ""}
  ${p.oppositionPending ? `<div class="notice notice-warn"><strong>El representante se opuso a la vinculación.</strong> Evaluá el interés superior del adolescente y registrá tu decisión en «Consentimientos».</div>` : ""}
  <div class="tabs" role="tablist">${PRO_TABS.filter(([k]) => has || k === "consentimientos").map(([k, lbl]) =>
    `<button role="tab" aria-selected="${tab === k}" class="tab ${tab === k ? "on" : ""}" data-tab="${k}">${lbl}</button>`).join("")}</div>
  ${views[tab]()}`;
};
Binders.patient = (user) => {
  const p = Store.db.patients.find((x) => x.id === State.params.id);
  if (!p) return;
  const reload = (tab) => go("patient", { id: p.id, tab });
  $$("[data-tab]").forEach((b) => b.addEventListener("click", () => reload(b.dataset.tab)));
  $$("[data-consult]").forEach((b) => b.addEventListener("click", () => startChild(user, p.id, b.dataset.consult, "consulta")));
  $$(".plan-form").forEach((f) => f.addEventListener("submit", (e) => {
    e.preventDefault(); const id = f.dataset.act;
    Store.setPlan(user, p.id, id, { perWeek: $(`#pw-${id}`).value, level: $(`#lv-${id}`).value, note: $(`#nt-${id}`).value, active: $(`#on-${id}`).checked });
    notice("Pauta guardada.", "ok"); reload("pauta");
  }));
  $$("[data-fix]").forEach((f) => f.addEventListener("submit", (e) => { e.preventDefault(); const act = f.dataset.fix;
    Store.setSkillOverride(user, p.id, act, { fixed: f.querySelector("select").value, locked: f.querySelector("[type=checkbox]").checked }); notice("Ajuste guardado.", "ok"); reload("seguimiento"); }));
  $$("[data-obs]").forEach((b) => b.addEventListener("click", () => { Store.audit(user.id, "observación fuera de la app", p.code + " · " + b.dataset.obs); Store.save(); notice("Registramos tu observación.", "ok"); reload("seguimiento"); }));
  $$("[data-share]").forEach((cb) => cb.addEventListener("change", () => { Store.setShare(user, p.id, cb.dataset.share, cb.checked); notice("Guardado.", "ok"); reload("familia"); }));
  const om = $("#obj-measure"); if (om) om.addEventListener("submit", (e) => { e.preventDefault(); Store.addObjectiveMeasure(user, p.id, $("#om-obj").value, $("#om-val").value); notice("Medida registrada.", "ok"); reload("plan"); });
  const ip = $("#ip-form"); if (ip) bindInterventionForm(user, p, ip, reload);
  const mf = $("#me-form"); if (mf) mf.addEventListener("submit", (e) => { e.preventDefault();
    Store.saveMeasure(user, p.id, { measure: $("#me-m").value, kind: $("#me-k").value, form: $("#me-k").value === "inicial" ? "A" : "B", score: +$("#me-s").value }); notice("Medida guardada.", "ok"); reload("evaluacion"); });
  const mx = $("#me-export"); if (mx) mx.addEventListener("click", () => download("progreso-" + p.code + ".txt", mx.dataset.text, "text/plain"));
  const rp = $("#rep-approve"); if (rp) rp.addEventListener("click", () => {
    const text = $("#rep-text").value; const f = Rules.filterSummary(text);
    if (!f.ok) { $("#rep-err").textContent = "El filtro bloqueó el resumen: contiene categorías diagnósticas o medicación."; return; }
    if (!$("#rep-sign").checked) { $("#rep-err").textContent = "Para aprobar tenés que firmar con tu nombre y matrícula."; return; }
    Store.approveReport(user, p.id, text); notice("Informe aprobado y firmado.", "ok"); reload("informe"); });
  $$("[data-rexport]").forEach((b) => b.addEventListener("click", () => { const r = Store.db.reportApprovals.find((x) => x.id === b.dataset.rexport); download("informe-" + p.code + ".txt", r.text + "\n\nFirmado: " + r.signedBy + " · " + new Date(r.at).toLocaleString("es-AR"), "text/plain"); }));
  $$("[data-decide]").forEach((b) => b.addEventListener("click", async () => { await Store.consent(user, p.id, "decision-profesional", b.dataset.decide); notice("Decisión registrada.", "ok"); reload("consentimientos"); }));
  const vc = $("#verify-chain"); if (vc) vc.addEventListener("click", async () => { const ok = await Store.verifyChain(p); $("#chain-res").textContent = ok ? "La cadena de huellas está íntegra." : "La cadena está alterada."; });
  const dc = $("#dl-consents"); if (dc) dc.addEventListener("click", () => download("comprobante-consentimientos-" + p.code + ".json", JSON.stringify({ paciente: p.code, formularios: CONSENT_FORMS.version, registros: p.consents }, null, 2)));
};

function bars(values, labels, max) {
  const m = Math.max(max || 0, ...values, 1);
  return `<div class="bars" role="img" aria-label="${labels.map((l, i) => l + ": " + values[i]).join(", ")}">${values.map((v, i) =>
    `<div class="bar-col"><span class="bar-val">${v}</span><div class="bar" style="height:${Math.round((v / m) * 100)}%"></div><span class="bar-lab">${labels[i]}</span></div>`).join("")}</div>`;
}

function followupView(user, p, ses, plans) {
  const r = Followup.analyze(ses, plans, Store.now());
  const al = proAlerts(user, p);
  const moodRows = Object.entries(r.moods);
  return `
  <div class="notice notice-info"><strong>Para leer estos datos:</strong> el desempeño dentro de la app no equivale a una mejoría ni a un retroceso clínico. La interpretación es tuya.</div>
  <section class="card"><h2>Alertas</h2>${al.length ? `<div class="sug-list">${al.map((a) => `<article class="sug"><h3>${esc(a.title)}</h3><p>${esc(a.detail)}</p>
    ${FOLLOWUP_SUGGESTIONS[a.key] ? `<div class="two"><div><h4>Preguntas para explorar</h4><ul>${FOLLOWUP_SUGGESTIONS[a.key].questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></div><div><h4>Posibles ajustes</h4><ul>${FOLLOWUP_SUGGESTIONS[a.key].alternatives.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></div></div><p class="prueba-tag">${PRUEBA}</p>` : ""}</article>`).join("")}</div>` : "<p>Sin alertas con los umbrales actuales.</p>"}
    <p class="hint">Alertas calculadas con reglas fijas (umbrales a calibrar con la supervisora). Ninguna es una alerta del protocolo de riesgo.</p></section>
  <div class="grid-3">
    <div class="card stat"><span class="stat-lab">Adherencia (14 días)</span><span class="stat-num">${r.adherencePct === null ? "—" : r.adherencePct + "%"}</span></div>
    <div class="card stat"><span class="stat-lab">Sesiones en 28 días</span><span class="stat-num">${r.total}</span><span class="hint">${r.minutes} minutos</span></div>
    <div class="card stat"><span class="stat-lab">Desafíos en casa</span><span class="stat-num">${p.desafiosHechos || 0}</span><span class="hint">Mide adherencia, no transferencia</span></div>
  </div>
  <div class="grid-2">
    <section class="card"><h2>Participación por semana</h2>${bars(r.weeks, ["Hace 4 sem.", "Hace 3", "Hace 2", "Última"])}</section>
    <section class="card"><h2>Autorreporte de ánimo</h2>
      ${!p.moodConsent ? "<p>Sin consentimiento del representante: no se guarda.</p>" : moodRows.length ? `<table class="tbl compact"><tbody>${moodRows.map(([m, n]) => `<tr><td>${esc(moodLabel(m))}</td><td class="num">${n}</td></tr>`).join("")}</tbody></table>` : "<p>Sin registros.</p>"}
      <p class="hint"><strong>Autorreporte. No es una evaluación emocional.</strong></p></section>
  </div>
  <section class="card"><h2>Desempeño y nivel adaptativo por aventura</h2>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Aventura</th><th>Sesiones</th><th>Aciertos al 1.er intento (últimas 3)</th><th>Tiempo medio por ítem</th><th>Nivel</th><th>Fijar nivel o bloquear ajuste</th><th></th></tr></thead>
    <tbody>${r.perActivity.map((x) => { const a = actById(x.id), st = p.adaptive[x.id] || {}; return `<tr><td>${esc(a?.name)}</td><td class="num">${x.count}</td><td class="num">${x.recentPct ?? "—"}%</td><td class="num">${x.avgMs ? (x.avgMs / 1000).toFixed(1) + " s" : "—"}</td><td class="num">${st.level || x.level}</td>
      <td><form class="inline-form" data-fix="${x.id}"><select aria-label="Nivel fijo"><option value="">Automático</option>${(a?.levels || []).map((lv, i) => `<option value="${i + 1}" ${st.fixed === i + 1 ? "selected" : ""}>${i + 1}. ${esc(lv)}</option>`).join("")}</select>
        <label class="check small"><input type="checkbox" ${st.locked ? "checked" : ""}> Bloquear</label><button class="btn btn-soft">Guardar</button></form></td>
      <td><button class="btn btn-soft" data-consult="${x.id}">Usar en consulta</button></td></tr>`; }).join("") || `<tr><td colspan="7">Todavía no hay sesiones.</td></tr>`}</tbody></table></div>
    <p class="hint">El tiempo se registra pero no cambia el nivel (salvo ítems de fluidez). El niño no ve niveles.</p></section>
  <section class="card"><h2>¿Observó el uso de la estrategia fuera de la app?</h2><div class="row"><button class="btn btn-soft" data-obs="sí">Sí</button><button class="btn btn-soft" data-obs="no">No</button><button class="btn btn-soft" data-obs="no sé">No sé</button></div>
    <p class="hint">Dato de observación del profesional, no una medida de efecto.</p></section>`;
}

/* M09: informe en palabras fijas, calculado en código. En la beta no interviene un modelo de lenguaje. */
function summaryText(p, ses, plans) {
  const r = Followup.analyze(ses, plans, Store.now());
  const parts = [`Paciente ${p.code}, ${Store.age(p)} años.`, `En los últimos 28 días hizo ${r.total} sesiones (${r.minutes} minutos).`];
  if (r.adherencePct !== null) parts.push(`Adherencia a la pauta en 14 días: ${r.adherencePct} %.`);
  r.perActivity.forEach((x) => parts.push(`${Followup.actName(x.id)}: ${x.count} sesiones; aciertos al primer intento en las últimas 3: ${x.recentPct ?? "—"} %; nivel actual ${(p.adaptive[x.id] || {}).level || x.level}.`));
  parts.push(`Desafíos para casa registrados: ${p.desafiosHechos || 0}.`);
  return parts.join(" ");
}
function reportView(user, p, ses, plans) {
  const t = summaryText(p, ses, plans), f = Rules.filterSummary(t);
  const approved = Store.db.reportApprovals.filter((x) => x.patientId === p.id);
  return `<section class="card ai-card"><div class="ai-head"><span class="pill pill-ai">Resumen automático</span><h2>Borrador del informe · requiere tu revisión</h2></div>
    <p class="hint">Plantilla fija calculada con reglas, sin modelo de lenguaje en esta beta. Cuando se conecte un modelo, el texto llevará el rótulo «Resumen generado por IA. Revisar antes de usar.» y recibirá solo datos seudonimizados.</p>
    ${f.ok ? "" : `<div class="notice notice-warn">El filtro de salida bloqueó el borrador automático.</div>`}
    <label for="rep-text">Texto del informe (editalo antes de aprobar)</label><textarea id="rep-text" rows="6">${esc(f.ok ? t : "")}</textarea>
    <label class="check"><input type="checkbox" id="rep-sign"> Reviso y firmo: ${esc(user.alias)} · Mat. ${esc(user.matricula?.numero)} (${esc(user.matricula?.provincia)})</label>
    <p class="err" id="rep-err" role="alert"></p>
    <button class="btn btn-primary" id="rep-approve">Aprobar y firmar</button>
    <p class="hint">No se exporta ni se comparte con la familia hasta que lo aprobás.</p></section>
    ${approved.length ? `<section class="card"><h2>Informes aprobados</h2><ul class="hist">${approved.map((r) => `<li>${fmtDateTime(r.at)} · ${esc(r.signedBy)} <button class="btn btn-soft" data-rexport="${r.id}">Exportar</button></li>`).join("")}</ul></section>` : ""}`;
}

/* M13: plan con los 8 campos de PSP-SR 5; sin objetivos completos y firma, queda en borrador. */
function interventionView(user, p) {
  const prev = Store.plansIntervention(user, p.id);
  return `<form id="ip-form" class="card form"><h2>Plan de intervención</h2><p class="hint">Lo que propone el sistema es un borrador. Las estrategias salen de la Biblioteca; las de nivel X no se pueden elegir.</p>
    <label for="ip-ctx">1. Contexto (sin identificadores)</label><textarea id="ip-ctx" rows="2"></textarea>
    <label for="ip-prof">2. Perfil de fortalezas y necesidades</label><textarea id="ip-prof" rows="2"></textarea>
    <fieldset><legend>3. Objetivo con línea de base, meta y plazo</legend><div class="grid-form">
      <div><label for="ob-t">Objetivo</label><input id="ob-t"></div><div><label for="ob-b">Línea de base</label><input id="ob-b" type="number"></div>
      <div><label for="ob-g">Meta</label><input id="ob-g" type="number"></div><div><label for="ob-w">Plazo (semanas)</label><input id="ob-w" type="number" min="1"></div></div></fieldset>
    <fieldset><legend>4. Estrategias (Biblioteca de evidencia · ${PRUEBA})</legend>${BIBLIOTECA.map((b) => `<label class="check ${b.nivel === "X" ? "disabled" : ""}"><input type="checkbox" name="estr" value="${b.id}" ${b.nivel === "X" ? "disabled" : ""}> ${esc(b.name)} · <strong>Nivel ${b.nivel}</strong>${b.nivel === "X" ? " (práctica excluida)" : ""}</label>`).join("")}</fieldset>
    <label for="ip-dose">5. Dosis y responsables</label><input id="ip-dose">
    <fieldset><legend>6. Aventuras del portal asignadas</legend>${ACTIVITIES.map((a) => `<label class="check"><input type="checkbox" name="tool" value="${a.id}"> ${esc(a.name)}</label>`).join("")}</fieldset>
    <label for="ip-ind">7. Indicadores y fecha de revisión</label><input id="ip-ind">
    <label for="ip-alta">8. Criterios de alta o de cambio de nivel de apoyo</label><input id="ip-alta">
    <label class="check"><input type="checkbox" id="ip-sign"> Firmo el plan: ${esc(user.alias)} · Mat. ${esc(user.matricula?.numero)}</label>
    <div class="row"><button class="btn btn-primary" name="act" value="1">Guardar como activo</button><button class="btn btn-soft" name="act" value="0">Guardar borrador</button></div>
    <p class="err" id="ip-err" role="alert"></p></form>
  ${p.objectives.length ? `<section class="card"><h2>Objetivos activos y medidas de monitoreo</h2><ul>${p.objectives.map((o) => `<li>${esc(o.text)} · base ${o.baseline} → meta ${o.goal} en ${o.weeks} semanas · medidas: ${o.measures.map((m) => m.value).join(", ") || "—"}</li>`).join("")}</ul>
    <form id="obj-measure" class="form inline"><select id="om-obj" aria-label="Objetivo">${p.objectives.map((o) => `<option value="${o.id}">${esc(o.text)}</option>`).join("")}</select><input id="om-val" type="number" required aria-label="Valor" placeholder="Valor"><button class="btn btn-soft">Registrar medida</button></form></section>` : ""}
  ${prev.length ? `<section class="card"><h2>Planes guardados</h2><ul class="hist">${prev.map((x) => `<li>${fmtDateTime(x.at)} · ${x.status === "activo" ? "Activo, firmado por " + esc(x.signedBy) : "Borrador"}</li>`).join("")}</ul></section>` : ""}`;
}
function bindInterventionForm(user, p, f, reload) {
  let want = true;
  f.querySelectorAll("button[name=act]").forEach((b) => b.addEventListener("click", () => { want = b.value === "1"; }));
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const obj = { text: $("#ob-t").value.trim(), baseline: $("#ob-b").value, goal: $("#ob-g").value, weeks: $("#ob-w").value };
    const plan = { context: $("#ip-ctx").value, profile: $("#ip-prof").value, objectives: obj.text ? [obj] : [], strategies: $$("[name=estr]:checked", f).map((x) => x.value),
      dose: $("#ip-dose").value, tools: $$("[name=tool]:checked", f).map((x) => x.value), indicators: $("#ip-ind").value, discharge: $("#ip-alta").value, signed: $("#ip-sign").checked, wantActive: want };
    const r = Store.saveInterventionPlan(user, p.id, plan);
    if (want && r.status !== "activo") { notice("Se guardó como borrador: para activarlo hacen falta objetivo con línea de base, meta y plazo, y tu firma.", "warn"); }
    else notice(r.status === "activo" ? "Plan activo y firmado." : "Borrador guardado.", "ok");
    reload("plan");
  });
}

/* M17: medidas propias, puntaje bruto y cambio; sin baremos ni categorías. */
function measuresView(user, p) {
  const ms = Store.measuresFor(user, p.id);
  const byM = MEDIDAS.map((m) => { const pre = ms.find((x) => x.measure === m.id && x.kind === "inicial"), post = ms.find((x) => x.measure === m.id && x.kind === "final"); return { m, pre, post }; }).filter((x) => x.pre || x.post);
  const legend = "Medida de progreso en las habilidades practicadas. No es un test estandarizado ni una evaluación diagnóstica, y no tiene baremos.";
  const text = byM.map((x) => `${x.m.name}: inicial ${x.pre ? x.pre.score : "—"} / final ${x.post ? x.post.score : "—"} (sobre ${x.m.max})${x.pre && x.post ? `; cambio ${x.post.score - x.pre.score >= 0 ? "+" : ""}${x.post.score - x.pre.score}` : ""}`).join("\n")
    + `\n\n${legend}\nFirmado: ${user.alias} · Mat. ${user.matricula?.numero}`;
  return `<div class="notice notice-info"><strong>${legend}</strong></div>
  <form id="me-form" class="card form inline"><select id="me-m" aria-label="Medida">${MEDIDAS.map((m) => `<option value="${m.id}">${esc(m.name)} (sobre ${m.max})</option>`).join("")}</select>
    <select id="me-k" aria-label="Toma"><option value="inicial">Inicial (forma A)</option><option value="final">Final (forma B)</option></select>
    <input id="me-s" type="number" min="0" required aria-label="Puntaje bruto" placeholder="Puntaje bruto"><button class="btn btn-primary">Guardar</button></form>
  <p class="prueba-tag">Banco de medidas: ${PRUEBA}</p>
  <section class="card"><h2>Resultados</h2>${byM.length ? `<table class="tbl"><thead><tr><th>Medida</th><th>Inicial</th><th>Final</th><th>Cambio</th></tr></thead><tbody>${byM.map((x) => `<tr><td>${esc(x.m.name)}</td><td class="num">${x.pre ? x.pre.score : "—"}</td><td class="num">${x.post ? x.post.score : "—"}</td><td class="num">${x.pre && x.post ? (x.post.score - x.pre.score >= 0 ? "+" : "") + (x.post.score - x.pre.score) : "—"}</td></tr>`).join("")}</tbody></table>
    <button class="btn btn-soft" id="me-export" data-text="${esc(text)}">Exportar con mi firma</button>` : "<p>Sin medidas.</p>"}</section>`;
}

function shareView(p) {
  const age = Store.age(p);
  if (age >= 13) return `<section class="card"><h2>Qué ve la familia</h2><p>Por la edad del paciente, la familia ve solo el tiempo y las aventuras. No ve el check-in, las respuestas de «Contar» ni los errores.</p></section>`;
  return `<section class="card"><h2>Qué ve la familia</h2><p>Siempre ve: qué se practicó, cuántas aventuras, cuánto tiempo y los desafíos hechos. Nunca ve porcentajes, alertas, interpretación ni el autorreporte de ánimo. Además, vos decidís si comparte:</p>
    <label class="check"><input type="checkbox" data-share="objetivos" ${p.share?.objetivos ? "checked" : ""}> Los objetivos del plan, en lectura fácil</label>
    <label class="check"><input type="checkbox" data-share="nivel" ${p.share?.nivel ? "checked" : ""}> El nivel de cada aventura</label></section>`;
}

const CONSENT_LABEL = { "consentimiento-representante": "Consentimiento del representante", "asentimiento-nino": "Asentimiento del niño", "asentimiento-adolescente": "Asentimiento del adolescente",
  "consentimiento-adolescente": "Consentimiento del adolescente", "aviso-enviado": "Aviso al representante enviado", "aviso-recibido": "Aviso recibido por el representante", "oposicion-representante": "Oposición del representante",
  "decision-profesional": "Decisión del profesional", revocacion: "Revocación", titularidad: "Toma de titularidad (18 años)", "no-consiente": "El adolescente no consintió" };
function consentView(user, p) {
  return `<section class="card"><h2>Registro de consentimientos</h2>
    <p class="hint">Registro encadenado por huella digital: cada entrada incluye la huella de la anterior. Formularios: ${esc(CONSENT_FORMS.version)} (texto jurídico pendiente).</p>
    <div class="table-wrap"><table class="tbl compact"><thead><tr><th>Fecha</th><th>Registro</th><th>Detalle</th><th>Huella</th></tr></thead><tbody>
    ${p.consents.map((c) => `<tr><td>${fmtDateTime(c.at)}</td><td>${esc(CONSENT_LABEL[c.type] || c.type)}</td><td class="wrap-cell small">${esc(c.detail)}</td><td class="mono small">${esc(c.hash.slice(0, 12))}…</td></tr>`).join("") || `<tr><td colspan="4">Sin registros todavía.</td></tr>`}</tbody></table></div>
    <div class="row"><button class="btn btn-soft" id="verify-chain">Verificar la cadena</button><button class="btn btn-soft" id="dl-consents">Descargar comprobante</button><span id="chain-res" role="status"></span></div>
    ${p.oppositionPending ? `<h3>Decisión ante la oposición del representante</h3><p>Evaluá el interés superior del adolescente. Si el conflicto es grave, se suspende y se orienta a mediación, al servicio local de protección de derechos o a un abogado del niño.</p>
      <div class="row"><button class="btn btn-soft" data-decide="continuar">Continuar la vinculación</button><button class="btn btn-danger" data-decide="suspender">Suspender y orientar</button></div>` : ""}
  </section>`;
}

function planView(user, p, plans) {
  const enabled = ACTIVITIES.filter((a) => Store.db.activityState[a.id]?.enabled);
  const age = Store.age(p), fit = (a) => age >= a.ageMin && age <= a.ageMax;
  return `<p>Elegí qué aventuras hace el paciente en casa y con qué frecuencia. La familia ve solo lo que actives acá.</p>
  <div class="plan-grid">${enabled.map((a) => {
    const pl = plans.find((x) => x.activityId === a.id) || Store.db.plans.find((x) => x.patientId === p.id && x.activityId === a.id);
    const fv = Rules.validateFicha(FICHAS[a.id], X_PRACTICES);
    return `<form class="card plan-form" data-act="${a.id}">
      <div class="plan-card-head">${actIcon(a.id, 52)}<h3>${esc(a.name)}</h3>${pl?.active ? '<span class="pill pill-ok">Indicada</span>' : ""}</div>
      <p class="muted">${esc(a.skill)} · ${a.ageMin} a ${a.ageMax} años</p>
      <div class="chips">${fit(a) ? '<span class="pill">Adecuada a la edad</span>' : '<span class="pill pill-warn">Fuera del rango de edad</span>'}${fv.ok ? "" : '<span class="pill pill-warn">Ficha incompleta: no publicable</span>'}</div>
      <details><summary>Ficha de la aventura</summary><p>${esc(TRANSFER[a.ficha.variant].pro(a))}</p>${fv.rotuloC ? `<p><strong>${fv.rotuloC}</strong></p>` : ""}<ul class="small">${fv.errors.map((e) => `<li>${esc(e)}</li>`).join("")}</ul><p class="prueba-tag">${PRUEBA}</p></details>
      <div class="two"><div><label for="pw-${a.id}">Veces por semana</label><input id="pw-${a.id}" type="number" min="1" max="7" value="${pl?.perWeek || 2}"></div>
      <div><label for="lv-${a.id}">Nivel inicial</label><select id="lv-${a.id}">${a.levels.map((l, i) => `<option value="${i + 1}" ${(pl?.level || 1) === i + 1 ? "selected" : ""}>${i + 1}. ${esc(l)}</option>`).join("")}</select></div></div>
      <label for="nt-${a.id}">Indicación para la familia (opcional)</label><textarea id="nt-${a.id}" rows="2" maxlength="280" placeholder="Sin datos identificatorios">${esc(pl?.note || "")}</textarea>
      <label class="check"><input type="checkbox" id="on-${a.id}" ${pl?.active ? "checked" : ""}> Indicar esta aventura</label>
      <div class="row"><button class="btn btn-primary">Guardar</button><button type="button" class="btn btn-soft" data-consult="${a.id}">Usar en consulta</button></div>
    </form>`; }).join("")}</div>`;
}

function recordsView(ses) {
  return `<div class="table-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Aventura</th><th>Dónde</th><th>Nivel inicio → fin</th><th>Completó</th><th>1.er intento</th><th>Pistas</th><th>Salida en el piso</th><th>Ánimo (autorreporte)</th><th>Le ayudó</th><th>Le resultó</th><th>Desafío</th></tr></thead>
  <tbody>${ses.map((s) => `<tr><td>${fmtDateTime(s.startAt)}</td><td>${esc(actById(s.activityId)?.name)}</td><td>${s.context}</td><td class="num">${s.metrics.level} → ${s.metrics.endLevel ?? s.metrics.level}</td>
    <td class="num">${s.metrics.completed}/${s.metrics.items}${s.metrics.abandoned ? " (dejó)" : ""}</td><td class="num">${s.metrics.firstTry}</td><td class="num">${s.metrics.hints}</td><td>${s.metrics.floorExit ? "sí" : "—"}</td>
    <td>${esc(s.moodStart ? moodLabel(s.moodStart) : "—")}</td><td>${esc(s.helped || "—")}</td><td>${esc((CHILD_TEXT.how.find((d) => d.id === s.how) || {}).label || "—")}</td><td>${s.desafioHecho ? "sí" : "—"}</td></tr>`).join("") || `<tr><td colspan="12">Sin registros.</td></tr>`}</tbody></table></div>`;
}

/* ---------- Catálogo ---------- */
Views.catalog = () => `
  <h1>Catálogo de aventuras</h1>
  <div class="notice notice-warn"><strong>${PRUEBA}.</strong> Las mecánicas funcionan, pero las consignas, edades, fichas y fuentes deben revisarse y aprobarse antes de usarse con chicos reales. Versión de contenido: ${esc(CONTENT_VERSION)}.</div>
  ${ZONES.map((z) => `<h2 class="zone-title">${esc(z.name)}</h2><div class="plan-grid">${ACTIVITIES.filter((a) => a.zone === z.id).map((a) => { const fv = Rules.validateFicha(FICHAS[a.id], X_PRACTICES); return `<article class="card act-card">
    <div class="act-card-head">${actIcon(a.id, 64)}<h3>${esc(a.name)}</h3></div><p class="muted">${esc(a.skill)} · ${a.ageMin} a ${a.ageMax} años · ${Store.db.activityState[a.id].enabled ? "Disponible" : "Retirada"}</p>
    <p>${esc(a.instruction)}</p><p class="hint">Niveles: ${a.levels.map(esc).join(" · ")}</p>
    <p class="small">${esc(TRANSFER[a.ficha.variant].pro(a))}</p>
    <p>${fv.ok ? '<span class="pill pill-ok">Ficha completa</span>' : `<span class="pill pill-warn">Ficha incompleta: no publicable fuera de la beta</span>`}</p>
    <details><summary>Qué le falta a la ficha</summary><ul class="small">${fv.errors.map((e) => `<li>${esc(e)}</li>`).join("")}</ul></details></article>`; }).join("")}</div>`).join("")}`;

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
  const tabs = [["indicadores", "Indicadores"], ["usuarios", "Usuarios"], ["contenidos", "Contenidos"], ["reportes", "Reportes"], ["sesiones", "Sesiones activas"], ["datos", "Solicitudes de datos"], ["sugerencias", "Sugerencias"], ["auditoria", "Auditoría"], ["config", "Configuración de la beta"]];
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
      <div class="card stat"><span class="stat-lab">Aventuras jugadas (7 días)</span><span class="stat-num">${s7.length}</span><span class="hint">Completadas en 28 días: ${completion}%</span></div>
      <div class="card stat"><span class="stat-lab">Reportes abiertos</span><span class="stat-num">${openReports}</span><span class="hint">${db.users.filter((u) => u.status === "pendiente").length} solicitudes profesionales pendientes</span></div>
    </div>
    <div class="grid-2"><section class="card"><h2>Sesiones por semana (todas las cuentas)</h2>${bars(weeks, ["Hace 4 sem.", "Hace 3", "Hace 2", "Última"])}</section>
    <section class="card"><h2>Uso por aventura (28 días)</h2><div class="table-wrap"><table class="tbl compact"><tbody>${byAct.map(([n, v]) => `<tr><td>${esc(n)}</td><td class="num">${kfmt(v)}</td></tr>`).join("")}</tbody></table></div>
      <p class="hint">Los grupos de menos de ${K_MIN} se ocultan para reducir el riesgo de identificar a alguien.</p></section></div>
    <section class="card"><h2>Check-in de ánimo (conteo agregado, sin identificación)</h2><div class="table-wrap"><table class="tbl compact"><thead><tr><th>Respuesta</th><th>Veces</th></tr></thead><tbody>
      ${(() => { const tot = {}; Object.values(db.moodAgg || {}).forEach((d) => Object.entries(d).forEach(([k, v]) => (tot[k] = (tot[k] || 0) + v))); return Object.entries(tot).map(([k, v]) => `<tr><td>${esc(moodLabel(k))}</td><td class="num">${kfmt(v)}</td></tr>`).join("") || `<tr><td colspan="2">Sin datos.</td></tr>`; })()}</tbody></table></div>
      <p class="hint">Autorreporte. No es una evaluación emocional. Se cuenta por día, sin vincularlo a ninguna cuenta.</p>
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
  sugerencias() {
    const db = Store.db;
    const st = ["nueva", "en evaluación profesional", "en evaluación técnica", "aceptada", "descartada"];
    return `<p>Sugerencias enviadas por familias y profesionales para que las evalúen el equipo profesional y el técnico. Destino del correo: <span class="mono">${esc(LEGAL.suggestionsTo)}</span>.</p>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>N.º</th><th>Fecha</th><th>Perfil</th><th>Tipo</th><th>Área</th><th>Sugerencia</th><th>Estado</th><th></th></tr></thead><tbody>
    ${db.suggestions.map((g) => `<tr><td class="mono">${g.number}</td><td>${fmtDateTime(g.createdAt)}</td><td>${esc(roleLabel[g.role])}</td><td>${esc((SUG_KINDS.find((k) => k[0] === g.kind) || [, g.kind])[1])}</td><td>${esc((SUG_AREAS.find((k) => k[0] === g.area) || [, g.area])[1])}</td><td class="wrap-cell">${esc(g.text)}</td>
      <td><select data-sgstatus="${g.id}" aria-label="Estado de la sugerencia ${g.number}">${st.map((x) => `<option ${g.status === x ? "selected" : ""}>${x}</option>`).join("")}</select></td>
      <td><a class="btn btn-soft" href="${mailtoSuggestion(g)}">Reenviar por correo</a></td></tr>`).join("") || `<tr><td colspan="8">Todavía no hay sugerencias.</td></tr>`}</tbody></table></div>`;
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
  $$("[data-sgstatus]").forEach((s) => s.addEventListener("change", () => Store.setSuggestionStatus(user, s.dataset.sgstatus, s.value)));
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

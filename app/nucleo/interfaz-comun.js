"use strict";
/* ==========================================================================
   Estructura común: banda beta, encabezado, pie con enlaces permanentes
   ========================================================================== */
const LUMA_IMAGE = "@@asset:nucleo/imagenes/luci.webp@@";
function lumaLauncher(child) {
  return `<button type="button" class="luma-launch ${child ? "luma-inline" : "luma-header"}" aria-haspopup="dialog" aria-controls="luma-dialog">
    <span class="luma-drift"><img src="${LUMA_IMAGE}" alt="" width="42" height="42"></span><span class="luma-text">Ayuda con Luci</span></button>`;
}
function lumaDialog() {
  return `<dialog id="luma-dialog" class="luma-dialog" aria-labelledby="luma-title">
    <header class="luma-head"><span class="luma-drift"><img src="${LUMA_IMAGE}" alt="" width="60" height="60"></span>
      <div><h2 id="luma-title">Luci</h2><p>Guía de Aprender Siendo</p></div>
      <button type="button" class="luma-close" aria-label="Cerrar ayuda">×</button></header>
    <div class="luma-body"></div>
    <label class="luma-motion"><input type="checkbox" id="luma-loop"> Flotar en bucle</label></dialog>`;
}

// Cada tema enlaza con un control que ya existe en la pantalla actual.
const LUMA_TOPICS = [
  { selector:"#participar .demo-acc", question:"¿Cómo pruebo el portal?", answer:"Elegí la tarjeta de Familias, Profesionales o Administración. El botón de la tarjeta completa los datos de demostración. Después, tocá «Ingresar».", action:"Ver cuentas de demostración" },
  { selector:"#li-email", question:"Ya tengo cuenta. ¿Cómo entro?", answer:"Escribí tu correo y contraseña en el formulario de ingreso y tocá «Ingresar».", action:"Ir al ingreso" },
  { selector:"#rg-alias", question:"¿Cómo creo la cuenta de familia?", answer:"Elegí un apodo para la demostración y completá los campos del formulario. Si tu profesional te dio un código de vinculación, podés ingresarlo ahí.", action:"Ir al formulario" },
  { selector:"#tf-code", question:"¿Dónde encuentro el código?", answer:"En esta demostración, el código de seis números aparece sobre el formulario. Copialo en el campo y tocá «Continuar».", action:"Ir al campo del código" },
  { selector:"[data-start]:not(:disabled)", question:"¿Cómo empezamos una aventura?", answer:"Buscá el perfil de quien va a jugar. En su lista de aventuras, elegí una y tocá «Empezar».", action:"Ver las aventuras" },
  { selector:"#fr-alias", question:"¿Cómo agrego un perfil?", answer:"En «Agregar un perfil en modo libre», escribí un apodo y la edad. Tocá «Crear perfil» para ver las aventuras disponibles.", action:"Ir a crear un perfil" },
  { selector:"[data-pat]", question:"¿Cómo abro una ficha?", answer:"Buscá el código del paciente en la lista. En esa fila, tocá «Abrir» para consultar su ficha.", action:"Ir a la lista de pacientes" },
  { selector:"#new-pat", question:"¿Cómo agrego un paciente?", answer:"El botón «Nuevo paciente» abre el formulario para cargar un perfil de demostración.", action:"Ir a Nuevo paciente" },
  { selector:"[data-tab]", question:"¿Dónde están las secciones de la ficha?", answer:"Las pestañas debajo del código del paciente te llevan a las secciones disponibles para esa vinculación.", action:"Ver las pestañas" },
  { selector:"[data-atab]", question:"¿Cómo recorro el panel?", answer:"Las pestañas te permiten pasar de los indicadores a Usuarios, Contenidos, Reportes y las demás secciones de Administración.", action:"Ver secciones del panel" },
  { selector:"[data-category]", question:"¿Cómo elijo mi compañero?", answer:"Tocá una categoría, elegí el animal que te guste y después tocá «Seguir».", action:"Ver los animales" },
  { selector:"[data-mood]", question:"¿Cómo elijo cómo me siento?", answer:"Tocá la opción que mejor diga cómo te sentís hoy. También podés elegir la opción de no decirlo.", action:"Ver las opciones" },
  { selector:".child-wrap [data-say]", question:"¿Me leés la consigna?", answer:"Puedo activar el mismo botón «Escuchar» de esta pantalla para que oigas la consigna.", action:"Escuchar la consigna", behavior:"click" },
  { selector:"#ch-home", question:"¿Cómo vuelvo al inicio?", answer:"Tocá «Volver al inicio» al pie de la pantalla. Si aparece un botón que pide mantenerlo apretado, pedile ayuda a la persona que te acompaña.", action:"Ir al botón de inicio" },
  { selector:"[data-act='prefs']", question:"¿Cómo cambio la letra o el movimiento?", answer:"En «Cómo leer» podés agrandar la letra, ajustar el contraste o activar el modo calma para reducir el movimiento.", action:"Abrir ajustes de lectura", behavior:"prefs" },
  { selector:"[data-act='report']", question:"¿Cómo aviso si algo falla?", answer:"Abrí el formulario y contá qué pasó. Usá datos ficticios y evitá incluir nombres o información clínica.", action:"Abrir el formulario", behavior:"click" }
];
// Se reutiliza el observador cuando cambia la pantalla del portal.
const lumaVisibility = new IntersectionObserver((entries) => {
  for (const entry of entries) entry.target.toggleAttribute("data-luma-visible", entry.isIntersecting);
});
function syncLumaVisibility() {
  document.documentElement.toggleAttribute("data-luma-page-hidden", document.hidden);
}
document.addEventListener("visibilitychange", syncLumaVisibility);
syncLumaVisibility();

function bindLuma() {
  const launcher = $(".luma-launch");
  const dialog = $("#luma-dialog");
  const body = $(".luma-body", dialog);
  lumaVisibility.disconnect();
  lumaVisibility.observe(launcher);
  lumaVisibility.observe($(".luma-head", dialog));
  const loop = $("#luma-loop", dialog);
  loop.checked = Prefs.get().lumaLoop !== false;
  loop.addEventListener("change", () => Prefs.set({ lumaLoop:loop.checked }));
  let topics = [];
  let selected = 0;

  function showMenu() {
    body.innerHTML = `<h3 tabindex="-1">¿En qué te ayudo?</h3><div class="luma-topics">${topics.map((topic, index) =>
      `<button type="button" class="luma-topic" data-luma-topic="${index}">${esc(topic.question)}</button>`).join("")}</div>`;
  }

  launcher.addEventListener("click", () => {
    topics = LUMA_TOPICS.filter((topic) => document.querySelector(topic.selector)?.getClientRects().length);
    showMenu();
    dialog.showModal();
    body.querySelector("h3").focus();
  });
  $(".luma-close", dialog).addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  body.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.hasAttribute("data-luma-topic")) {
      selected = Number(button.dataset.lumaTopic);
      const topic = topics[selected];
      body.innerHTML = `<h3 tabindex="-1">${esc(topic.question)}</h3><p>${esc(topic.answer)}</p>
        <div class="luma-actions"><button type="button" class="btn btn-primary" data-luma-action>${esc(topic.action)}</button>
        <button type="button" class="btn btn-ghost" data-luma-back>Otros temas</button></div>`;
      body.querySelector("h3").focus();
      return;
    }
    if (button.hasAttribute("data-luma-back")) {
      showMenu();
      body.querySelector(`[data-luma-topic="${selected}"]`).focus();
      return;
    }
    const topic = topics[selected];
    const target = document.querySelector(topic.selector);
    dialog.close();
    if (!target) return;
    if (topic.behavior === "prefs") {
      if ($("#prefs").hidden) target.click();
      $("#prefs [data-size]").focus();
    } else if (topic.behavior === "click") {
      target.click();
    } else {
      target.scrollIntoView({block:"center", behavior:"instant"});
      target.focus({preventScroll:true});
    }
  });
}

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
    <button class="brand" data-act="home" aria-label="Aprender Siendo, ir al inicio">${brandMark(42)}<span class="brand-words"><span class="brand-name">Aprender Siendo</span><span class="brand-sub">Aprendizaje · Experiencia · Desarrollo</span></span></button>
    <nav class="top-nav" aria-label="Principal">
      ${user ? navFor(user) : State.view === "landing" ? '<a class="home-link" href="#recorrido">El recorrido</a><a class="home-link" href="#participar">Cuentas demo</a>' : ""}
      <button class="btn btn-ghost reader" title="Cómo leer" data-act="prefs" aria-expanded="false"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M2 5q6-2 10 1 5-3 10-1v14q-6-2-10 1-5-3-10-1z M12 6v14"/></svg><span class="reader-label">Cómo leer</span></button>
      ${lumaLauncher(false)}
      ${user ? `<span class="who">${esc(user.alias)} · ${roleLabel[user.role]}</span><button class="btn btn-ghost" data-act="logout">Salir</button>` : ""}
    </nav>
  </div>
  <div class="wrap prefs" id="prefs" hidden>
    <strong class="prefs-title">Elegí cómo te resulta más cómodo leer</strong>
    <span>Tamaño de letra</span>
    <button class="btn btn-soft" data-size="1">A</button><button class="btn btn-soft" data-size="2">A+</button><button class="btn btn-soft" data-size="3">A++</button>
    <label>Letra <select id="pref-font"><option value="">Nunito</option><option value="atkinson">Atkinson Hyperlegible Next</option><option value="manrope">Manrope</option><option value="sistema">La del sistema</option></select></label>
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
  <footer class="foot ${child ? "foot-child" : ""}">${child ? "" : `<div class="wrap foot-brand">${brandMark(48)}<div><strong class="brand-name">Aprender Siendo</strong><p>Aprender es también ser.</p></div></div>`}<div class="wrap foot-in">
    ${child ? `<button class="foot-link strong" id="ch-home">${homeIcon()} Volver al inicio</button>` : ""}
    <button class="foot-link strong" data-act="report">Reportar un inconveniente</button>
    ${canLeave && !child ? `<button class="foot-link strong" data-act="leave">Dar de baja mi cuenta</button>` : ""}
    ${child ? "" : `
    <button class="foot-link" data-act="legal" data-doc="terminos">Términos de uso</button>
    <button class="foot-link" data-act="legal" data-doc="privacidad">Privacidad</button>
    <button class="foot-link" data-act="legal" data-doc="ia">Uso de inteligencia artificial</button>
    <span class="foot-meta">Aprender Siendo · aprendersiendo.ar · ${APP_VERSION}. Las herramientas no reemplazan la evaluación profesional.</span>`}
    ${child ? lumaLauncher(true) : ""}
  </div></footer>
  ${lumaDialog()}
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
const ACT_COLORS = { memoria: ["#F2B8A2", "#E07B5F"], secuencias: ["#C9D8EE", "#4F7BB0"], distinto: ["#F4E3B8", "#C99528"], contar: ["#DCE9E2", "#55867D"], clasificar: ["#E4DBF2", "#8A72B8"], isla: ["#D9EEF0", "#1B7F86"], explorapalabras: ["#FFF1D7", "#196B6A"], luci: ["#E0F2EB", "#102F54"], cerditos: ["#FDE3DA", "#102F54"] };
function actIcon(id, size = 64) {
  const [bg, fg] = ACT_COLORS[id] || ["#DCE9E2", "#315F59"];
  const art = {
    isla: `<path d="M10 66 Q50 54 90 66 L90 90 H10Z" fill="#9FD3D8"/><ellipse cx="50" cy="64" rx="28" ry="9" fill="#F2D59A"/><path d="M50 62 Q48 40 54 26" stroke="#8A5A3B" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M54 26 Q40 20 30 30 M54 26 Q66 16 76 24 M54 26 Q58 36 68 40 M54 26 Q46 34 38 42" stroke="${fg}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="76" cy="16" r="6" fill="#F2B33D"/>`,
    memoria: `<rect x="18" y="26" width="26" height="36" rx="6" fill="${fg}" transform="rotate(-10 31 44)"/><rect x="40" y="24" width="26" height="36" rx="6" fill="#fff" stroke="${fg}" stroke-width="3" transform="rotate(8 53 42)"/><circle cx="53" cy="42" r="7" fill="${fg}"/>`,
    secuencias: `<circle cx="22" cy="42" r="9" fill="${fg}"/><rect x="36" y="33" width="18" height="18" rx="4" fill="#E8B44C"/><rect x="60" y="33" width="18" height="18" rx="5" fill="none" stroke="${fg}" stroke-width="3" stroke-dasharray="4 3"/>`,
    distinto: [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => (r === 1 && c === 2 ? `<path d="M${62} ${26 + r * 18} l8 14 h-16z" fill="#E07B5F"/>` : `<circle cx="${28 + c * 17}" cy="${33 + r * 18}" r="6.5" fill="${fg}"/>`))).join(""),
    contar: `<circle cx="22" cy="30" r="6" fill="${fg}"/><circle cx="36" cy="30" r="6" fill="${fg}"/><circle cx="29" cy="44" r="6" fill="${fg}"/><text x="58" y="56" font-family="Manrope, sans-serif" font-weight="800" font-size="32" fill="#315F59">3</text>`,
    explorapalabras: `<rect x="14" y="14" width="64" height="64" rx="12" fill="#fff"/>${["A","S","O","L","M","A","R","E","P"].map((l, k) => `<text x="${27 + (k % 3) * 19}" y="${35 + Math.floor(k / 3) * 19}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="15" fill="#102F54">${l}</text>`).join("")}<line x1="27" y1="30" x2="65" y2="30" stroke="${fg}" stroke-width="14" stroke-linecap="round" opacity=".35"/>`,
    luci: `<circle cx="40" cy="40" r="20" fill="#fff" stroke="${fg}" stroke-width="5"/><path d="M54 54 L74 74" stroke="${fg}" stroke-width="8" stroke-linecap="round"/><path d="M40 28 C48 38 47 50 40 50 C33 50 32 38 40 28Z" fill="#FFB82E" stroke="${fg}" stroke-width="2.5"/>`,
    cerditos: `<path d="M22 50 L46 28 L70 50Z" fill="#C4573E" stroke="${fg}" stroke-width="2.5"/><rect x="28" y="48" width="36" height="24" fill="#F58060" stroke="${fg}" stroke-width="2.5"/><circle cx="66" cy="62" r="11" fill="#F9C6BA" stroke="${fg}" stroke-width="2.5"/><ellipse cx="66" cy="65" rx="4.5" ry="3" fill="#EE9C8C"/>`,
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

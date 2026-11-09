"use strict";
/* ==========================================================================
   Render principal
   ========================================================================== */
let releaseLandingStory = null;
function render() {
  if (releaseLandingStory) {
    releaseLandingStory();
    releaseLandingStory = null;
  }
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
  bindLuma();
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

/* ==========================================================================
   simulador.js — Simulador de casos y Generador de apoyos (BORRADOR SIM-001)

   Diseño (DEV-IA, 2026-11-01):
   - Flujo determinista. No interviene ningún modelo de lenguaje: los casos,
     escenarios y textos vienen de content_simulador.js, que valida PSP-SR.
   - Solo para cuentas profesionales. Nada llega a niños ni a familias sin
     que el profesional lo revise e imprima.
   - Guardrails en código: protocolo de riesgo (PSP-SR 9.2) y bloqueo de
     datos identificatorios sobre el texto libre; el texto no se guarda.
   - Retiro de emergencia desde Administración > Contenidos.
   ========================================================================== */

const Sim = {
  stage: "list", caseId: null, order: [], chosen: [],
  apoyos: null,   // { title, steps[], checklist[], includeBreak } — solo en memoria
  risk: false
};

function simEnabled() { return Store.db.config.draftToolsEnabled !== false; }
function simNorm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
function simShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ---------- Guardrails sobre texto libre (reglas en código) ---------- */
const SimGuard = {
  risk(text) { const t = simNorm(text); return RISK_TRIGGERS.some((k) => t.includes(simNorm(k))); },
  identifiers(text) {
    const t = String(text || "");
    if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(t)) return "una dirección de correo";
    if (/\d{1,2}\.?\d{3}\.?\d{3}/.test(t)) return "un número de documento o de teléfono";
    if (/(\+?54\s?)?(\(?\d{2,4}\)?[\s-]?)\d{3,4}[\s-]\d{4}/.test(t)) return "un número de teléfono";
    return null;
  }
};

function simBanner(extra = "") {
  return `<div class="notice notice-warn sim-banner"><strong>Borrador sin revisión clínica.</strong> Herramienta en prueba, solo para profesionales, con casos ficticios. No se usa con pacientes reales hasta que PSP-SR y la supervisora la aprueben. ${extra}<br><span class="small">Versión de contenido: ${esc(SIM_CONTENT_VERSION)}. Funciona con plantillas: no usa inteligencia artificial.</span></div>`;
}

Views.sim = (user) => {
  if (user.role !== "profesional") return `<p>Esta herramienta es solo para profesionales.</p>`;
  if (!simEnabled()) return `<h1>Simulador y apoyos</h1><div class="notice notice-info">Esta herramienta está retirada por el momento.</div>`;
  const tab = State.params.tab || "casos";
  return `<h1>Simulador y apoyos</h1>${simBanner()}
  <div class="tabs" role="tablist">${[["casos", "Simulador de casos"], ["apoyos", "Generador de apoyos"]].map(([k, l]) =>
    `<button role="tab" aria-selected="${tab === k}" class="tab ${tab === k ? "on" : ""}" data-stab="${k}">${l}</button>`).join("")}</div>
  ${tab === "casos" ? simCasesView() : simSupportView()}`;
};

/* ---------- Simulador de casos ---------- */
function simCasesView() {
  const c = SIM_CASES.find((x) => x.id === Sim.caseId);
  if (Sim.stage === "list" || !c) {
    return `<p>Practicá la toma de decisiones con casos ficticios. No hay una única respuesta correcta: cada opción muestra escenarios posibles, fortalezas, riesgos y qué medir.</p>
    <div class="plan-grid">${SIM_CASES.map((x) => `<article class="card"><p class="eyebrow">Caso ficticio · ${esc(x.id)}</p><h2>${esc(x.title)}</h2>
      <p class="muted">${esc(x.profile.age)} · ${esc(x.profile.grade)}</p><button class="btn btn-primary" data-scase="${x.id}">Empezar caso</button></article>`).join("")}</div>`;
  }
  const p = c.profile;
  const profile = `<article class="card sim-case"><p class="eyebrow">Caso ficticio · ${esc(c.id)}</p><h2>${esc(c.title)}</h2>
    <dl class="dl"><dt>Edad</dt><dd>${esc(p.age)}</dd><dt>Escolaridad</dt><dd>${esc(p.grade)}</dd>
    <dt>Lo que se observa</dt><dd><ul>${p.observed.map((o) => `<li>${esc(o)}</li>`).join("")}</ul></dd>
    <dt>Fortalezas</dt><dd>${p.strengths.map(esc).join(" · ")}</dd>
    <dt>Familia</dt><dd>${esc(p.family)}</dd><dt>Escuela</dt><dd>${esc(p.school)}</dd>
    <dt>Punto de mayor dificultad</dt><dd>${esc(p.friction)}</dd></dl></article>`;
  const opts = Sim.order.map((id) => c.options.find((o) => o.id === id));
  if (Sim.stage === "case") {
    return `${profile}<form id="sim-choice" class="card form"><h2>${esc(c.question)}</h2>
      ${opts.map((o, i) => `<label class="check sim-opt"><input type="checkbox" name="opt" value="${o.id}"> <span><strong>Opción ${"ABC"[i]}: ${esc(o.label)}.</strong> ${esc(o.summary)}</span></label>`).join("")}
      <p class="error" id="sim-err" role="alert"></p>
      <div class="row"><button class="btn btn-primary">Ver escenarios</button><button type="button" class="btn btn-ghost" id="sim-back">Elegir otro caso</button></div></form>`;
  }
  const chosen = opts.filter((o) => Sim.chosen.includes(o.id));
  const others = opts.filter((o) => !Sim.chosen.includes(o.id));
  const block = (o) => `<article class="card sim-debrief"><h3>${esc(o.label)}</h3>
    <p class="hint">Los escenarios son ilustrativos y fueron escritos de antemano. No son una predicción sobre una persona real.</p>
    <dl class="dl"><dt>A 2 semanas</dt><dd>${esc(o.scenario2w)}</dd><dt>A 6 semanas</dt><dd>${esc(o.scenario6w)}</dd>
    <dt>Por qué puede pasar</dt><dd>${esc(o.mechanism)}</dd>
    <dt>Fortalezas</dt><dd><ul>${o.strengths.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></dd>
    <dt>Riesgos</dt><dd><ul>${o.risks.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></dd>
    <dt>Qué medir</dt><dd>${esc(o.measure)}</dd><dt>Evidencia</dt><dd>${esc(o.evidence)}</dd>
    <dt>Fuentes (sin verificar)</dt><dd><ul>${o.refs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></dd></dl></article>`;
  return `${profile}<h2>Elegiste: ${chosen.map((o) => esc(o.label)).join(" + ")}</h2>
    ${chosen.map(block).join("")}
    <div class="notice notice-info">${esc(c.combined)}</div>
    ${others.length ? `<details class="card"><summary>Ver las otras opciones</summary>${others.map(block).join("")}</details>` : ""}
    <section class="card"><h2>Para pensar</h2><ul>${c.debriefQuestions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></section>
    <div class="row"><button class="btn btn-primary" id="sim-restart">Volver a empezar este caso</button><button class="btn btn-ghost" id="sim-back">Elegir otro caso</button></div>`;
}

/* ---------- Generador de apoyos ---------- */
function simSupportView() {
  if (Sim.risk) {
    const r = RISK_RESOURCES;
    return `<section class="card sim-risk" role="alert"><h2>${esc(r.title)}</h2><p>${esc(r.intro)}</p>
      <ul>${r.lines.map((l) => `<li><strong>${esc(l)}</strong></li>`).join("")}</ul><p>${esc(r.duty)}</p><p class="hint">${esc(r.verify)}</p>
      <button class="btn btn-ghost" id="sim-risk-ok">Entendido, volver</button></section>`;
  }
  const a = Sim.apoyos;
  if (a && a.ready) {
    return `<div class="row no-print"><button class="btn btn-primary" id="sim-print">Imprimir</button><button class="btn btn-ghost" id="sim-edit">Editar</button></div>
    <article class="card sim-sheet" aria-label="Vista para imprimir">
      <p class="eyebrow">Material de apoyo · Aprender Siendo</p>
      ${a.steps.length ? `<h2>${esc(a.title || "Mis pasos")}</h2><ol class="sim-steps">${a.steps.map((s) => `<li><span class="sim-box" aria-hidden="true"></span>${esc(s)}</li>`).join("")}</ol>` : ""}
      ${a.checklist.length ? `<h2>Antes de empezar</h2>${SUPPORT_CHECKLIST.map((g) => {
        const its = g.items.filter((it) => a.checklist.includes(it));
        return its.length ? `<h3>${esc(g.layer)}</h3><ul class="sim-check">${its.map((it) => `<li><span class="sim-yn">Sí · No</span> ${esc(it)}</li>`).join("")}</ul>` : "";
      }).join("")}` : ""}
      ${a.includeBreak ? `<h2>${esc(SUPPORT_BREAK.title)}</h2><ol>${SUPPORT_BREAK.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol><p class="hint">${esc(SUPPORT_BREAK.note)}</p>` : ""}
      <p class="hint sim-foot">Borrador ${esc(SIM_CONTENT_VERSION)}. Hecho con plantilla, sin inteligencia artificial. Lo entrega el profesional después de revisarlo.</p>
    </article>`;
  }
  const prev = a || { title: "", steps: [], checklist: SUPPORT_CHECKLIST.flatMap((g) => g.items), includeBreak: true };
  return `<form id="sim-sup" class="card form"><h2>Armá una hoja de apoyo para imprimir</h2>
    <p class="hint">Escribí sin nombres, documentos, escuelas ni datos de contacto. El texto no se guarda: se borra al salir de esta pantalla.</p>
    <label for="sup-title">Tarea (opcional)</label><input id="sup-title" maxlength="80" value="${esc(prev.title)}" placeholder="Ej.: Escribir un cuento corto">
    <label for="sup-steps">Micro-pasos: una acción concreta por renglón (hasta 8)</label>
    <textarea id="sup-steps" rows="6" maxlength="900" placeholder="Ej.: Sacar el cuaderno y el lápiz&#10;Leer la consigna en voz alta&#10;Dibujar el personaje">${esc(prev.steps.join("\n"))}</textarea>
    <fieldset><legend>Autochequeo de entorno</legend>${SUPPORT_CHECKLIST.map((g) => `<p class="small"><strong>${esc(g.layer)}</strong></p>${g.items.map((it, i) =>
      `<label class="check"><input type="checkbox" name="chk" value="${esc(it)}" ${prev.checklist.includes(it) ? "checked" : ""}> ${esc(it)}</label>`).join("")}`).join("")}</fieldset>
    <label class="check"><input type="checkbox" id="sup-break" ${prev.includeBreak ? "checked" : ""}> Incluir la pausa activa de 2 minutos</label>
    <p class="error" id="sup-err" role="alert"></p>
    <button class="btn btn-primary">Ver hoja para imprimir</button></form>`;
}

Binders.sim = (user) => {
  if (user.role !== "profesional" || !simEnabled()) return;
  $$("[data-stab]").forEach((b) => b.addEventListener("click", () => { Sim.risk = false; if (b.dataset.stab === "casos") Sim.apoyos = null; go("sim", { tab: b.dataset.stab }); }));
  $$("[data-scase]").forEach((b) => b.addEventListener("click", () => {
    const c = SIM_CASES.find((x) => x.id === b.dataset.scase);
    Object.assign(Sim, { stage: "case", caseId: c.id, order: simShuffle(c.options.map((o) => o.id)), chosen: [] });
    Store.audit(user.id, "simulador: caso iniciado", c.id); Store.save(); go("sim", { tab: "casos" });
  }));
  const back = () => { Object.assign(Sim, { stage: "list", caseId: null, chosen: [] }); go("sim", { tab: "casos" }); };
  $$("#sim-back").forEach((b) => b.addEventListener("click", back));
  const ch = $("#sim-choice");
  if (ch) ch.addEventListener("submit", (e) => {
    e.preventDefault();
    const sel = $$("input[name=opt]:checked", ch).map((x) => x.value);
    if (!sel.length) { $("#sim-err").textContent = "Elegí al menos una opción."; return; }
    Sim.chosen = sel; Sim.stage = "debrief";
    Store.audit(user.id, "simulador: opciones elegidas", Sim.caseId + " · " + sel.join(" + ")); Store.save(); go("sim", { tab: "casos" });
  });
  const rs = $("#sim-restart");
  if (rs) rs.addEventListener("click", () => { const c = SIM_CASES.find((x) => x.id === Sim.caseId); Sim.order = simShuffle(c.options.map((o) => o.id)); Sim.chosen = []; Sim.stage = "case"; go("sim", { tab: "casos" }); });

  const f = $("#sim-sup");
  if (f) f.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = $("#sup-title").value.trim().slice(0, 80);
    const steps = $("#sup-steps").value.split("\n").map((s) => s.trim().slice(0, 120)).filter(Boolean);
    const all = title + "\n" + steps.join("\n");
    if (SimGuard.risk(all)) {
      Sim.apoyos = null; Sim.risk = true;
      Store.audit(user.id, "protocolo de riesgo activado", "generador de apoyos (sin texto guardado)"); Store.save();
      return go("sim", { tab: "apoyos" });
    }
    const id = SimGuard.identifiers(all);
    if (id) { $("#sup-err").textContent = `Parece que escribiste ${id}. Sacalo antes de seguir.`; return; }
    if (steps.length > 8) { $("#sup-err").textContent = "Usá hasta 8 pasos. Si hacen falta más, partí la tarea en dos hojas."; return; }
    const checklist = $$("input[name=chk]:checked", f).map((x) => x.value);
    if (!steps.length && !checklist.length && !$("#sup-break").checked) { $("#sup-err").textContent = "Agregá al menos un paso, un ítem o la pausa."; return; }
    Sim.apoyos = { title, steps, checklist, includeBreak: $("#sup-break").checked, ready: true };
    Store.audit(user.id, "generador de apoyos: hoja generada", `${steps.length} pasos · ${checklist.length} ítems`); Store.save();
    go("sim", { tab: "apoyos" });
  });
  const pr = $("#sim-print"); if (pr) pr.addEventListener("click", () => window.print());
  const ed = $("#sim-edit"); if (ed) ed.addEventListener("click", () => { Sim.apoyos.ready = false; go("sim", { tab: "apoyos" }); });
  const ro = $("#sim-risk-ok"); if (ro) ro.addEventListener("click", () => { Sim.risk = false; go("sim", { tab: "apoyos" }); });
};

"use strict";
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
    <button class="btn btn-primary" id="new-pat">Nuevo paciente</button></div><div class="greet-art">${Scenes.professional(190, user.professionalPortrait)}</div></section>
  <div id="new-pat-box"></div>
  <div class="table-wrap"><table class="tbl">
    <thead><tr><th>Código</th><th>Edad</th><th>Ruta</th><th>Vinculación</th><th>Alertas</th><th></th></tr></thead>
    <tbody>${pats.map((p) => {
      const al = proAlerts(user, p), l = Store.link(p);
      return `<tr><td class="mono"><span class="cell-av">${animalImage(p.avatarId || "pulpo", "calma", 34)}</span>${esc(p.code)}${p.synthetic ? ' <span class="pill pill-muted">ficticio</span>' : ""}</td><td>${Store.age(p)}</td><td>${Store.route(p)}</td>
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
  <div class="page-head"><div class="card-head">${animalImage(p.avatarId || "pulpo", "calma", 72)}<div><h1 class="mono">${esc(p.code)}</h1>
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

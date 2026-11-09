"use strict";
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
    <div class="card-head"><div>${animalImage(p.avatarId || "pulpo", "calma", 64)}</div><div><h2>${esc(p.alias || p.code)}</h2>
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

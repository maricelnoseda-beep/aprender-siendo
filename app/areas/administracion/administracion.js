"use strict";
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

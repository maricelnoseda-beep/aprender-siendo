"use strict";
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
      <dt>Prueba gratuita</dt><dd>${t ? (t.expired ? "Terminó el " + fmtDate(t.end) : `Quedan ${t.daysLeft} días (hasta el ${fmtDate(t.end)})`) : "—"}</dd></dl>
      ${user.role === "profesional" ? `<div class="form">${professionalPortraitField(user.professionalPortrait)}<p class="hint" id="portrait-status" role="status"></p></div>` : ""}</section>
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
  $("#professional-portrait")?.addEventListener("change", (event) => {
    if (!Store.setProfessionalPortrait(event.target.value)) return render();
    $("#portrait-status").textContent = "Ilustración guardada. La vas a ver al volver al Espacio Profesional.";
  });
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

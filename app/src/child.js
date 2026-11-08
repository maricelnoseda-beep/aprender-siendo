/* ==========================================================================
   child.js — Experiencia del niño y del adolescente (beta 2)

   Secuencia (REQ-CLI-M07): saludo → check-in (M02) → descubrir → jugar (M10)
   → resultado (M18) → hacer: desafío para casa (M06) → contar → mundo (M01,
   M03, M05). Reglas transversales T01–T11: sin texto libre ni archivos, sin
   rachas ni monedas, cierre suave por edad, audio en todo texto del niño.
   No hay botón de ayuda (decisión de la supervisora, 2026-11-08).
   ========================================================================== */

const FAST = () => !!window.__AS_FAST;          // solo para las pruebas automáticas (acelera la pausa de calma)

function startChild(user, patientId, activityId, context) {
  if (!Store.db.activityState[activityId]?.enabled) { notice("Esta aventura no está disponible en este momento.", "warn"); return render(); }
  const p = Store.db.patients.find((x) => x.id === patientId);
  const age = Store.age(p), route = Rules.route(age);
  State.child = { patientId, activityId, context, route, teen: route === "13-18", age, avatarId: p.avatarId, rec: {},
    adjust: Rules.checkinAdjust(null), rounds: 5, levelChanged: false, step: null, backTo: State.view, backParams: State.params };
  State.child.step = firstStep(p, State.child);
  if (["3-5", "6-8"].includes(route)) Voice.on = true;     // T09: audio activado por defecto
  State.view = "child"; render();
}

/* Pasos previos obligatorios según edad y consentimiento (M08-3, A01, A02, A03, A12). */
function firstStep(p, c) {
  if (c.teen) {
    if (c.age >= 18 && !p.selfOwner) return "majority";
    if (!p.teen.privacySeenAt || !p.teen.termsAt) return "teen-terms";
  }
  const link = Store.link(p);
  if (p.mode === "vinculado" && link.status === "pendiente") {
    const asked = (t) => p.consents.some((x) => x.type === t);
    if (c.age >= 16 && link.missing.some((m) => m.includes("adolescente")) && !asked("no-consiente")) return "teen-consent";
    if (c.age >= 13 && c.age < 16 && link.missing.some((m) => m.includes("asentimiento")) && !asked("asentimiento-adolescente")) return "teen-assent";
  }
  if (p.mode === "vinculado" && c.age < 13 && link.status === "activa" && !p.consents.some((x) => x.type === "asentimiento-nino")) return "child-assent";
  if (!p.avatarId && !(c.teen && p.teen.sober)) return "avatar";
  return "hello";
}

function childText(c, key) { return c.teen && key === "hello" ? CHILD_TEXT.helloTeen : CHILD_TEXT[key]; }
function moodLabelFor(c, id) { return (c.teen && TEEN_MOOD_LABEL[id]) || moodLabel(id); }
const listen = (t) => `<button class="btn btn-ghost listen" data-say="${esc(t)}" aria-label="Escuchar">🔊 Escuchar</button>`;
const pruebaTag = () => `<p class="prueba-tag">${PRUEBA}</p>`;

function companionArt(p, c, mood = "alegria", size = 120) {
  if (c.teen && p.teen.sober) return "";
  const stage = Rules.companionStage(p.companion?.growth);
  const sprouts = Array.from({ length: stage }, (_, i) => `<span class="sprout" style="--i:${i}"></span>`).join("");
  return `<div class="companion" aria-hidden="true">${Avatar.svg(c.avatarId || p.avatarId || "zorro", mood, size)}<div class="sprouts">${sprouts}</div></div>`;
}

/* Mundo (M03): las zonas florecen por participación y nunca se marchitan. */
function worldArt(p, sessions) {
  const done = sessions.filter((s) => !s.metrics.abandoned);
  return `<div class="world" role="img" aria-label="Tu mundo">${ZONES.map((z) => {
    const n = done.filter((s) => (ACTIVITIES.find((a) => a.id === s.activityId) || {}).zone === z.id).length;
    const flowers = Math.min(12, n);
    return `<div class="zone" style="--zc:${z.color}"><div class="zone-flowers">${Array.from({ length: flowers }, (_, i) => `<span class="flower" style="--i:${i}"></span>`).join("") || '<span class="seed"></span>'}</div><span class="zone-name">${esc(z.name)}</span></div>`;
  }).join("")}${p.desafiosHechos ? `<div class="butterflies" aria-hidden="true">${"🦋".repeat(Math.min(6, p.desafiosHechos))}</div>` : ""}</div>
  <p class="prueba-tag">Nombres de zonas: ${PRUEBA}</p>`;
}

/* Constelación (M05): solo lo recorrido; nada de números ni "te falta". Sin constelación en 3–5. */
function constellation(c, sessions) {
  if (c.route === "3-5") return "";
  const visited = new Set(sessions.filter((s) => !s.metrics.abandoned).map((s) => s.activityId));
  const helped = [...new Set(sessions.map((s) => s.helped).filter(Boolean))];
  const title = c.teen ? "Mapa de estrategias" : "Lugares que exploraste";
  const items = ACTIVITIES.filter((a) => c.age >= a.ageMin && c.age <= a.ageMax);
  return `<section class="constel"><h2>${title}</h2><ul>${items.map((a) => visited.has(a.id)
    ? `<li class="seen"><span class="star" aria-hidden="true">✦</span>${esc(a.skill)}</li>`
    : `<li class="todo"><span class="star off" aria-hidden="true">✧</span>${esc(a.skill)} · <em>por descubrir</em></li>`).join("")}</ul>
    ${c.teen && helped.length ? `<p class="small">Estrategias que te sirvieron: ${helped.map(esc).join(" · ")}</p>` : ""}</section>`;
}

function renderChild(user) {
  const c = State.child;
  if (!user || !c) return go("home");
  const p = Store.db.patients.find((x) => x.id === c.patientId);
  const a = actById(c.activityId);
  const sessions = Store.db.activitySessions.filter((s) => s.patientId === p.id);
  let inner = "";
  const S = c.step;
  if (S === "teen-terms") inner = `<section class="child-card">
      <h1 class="child-title sm">Antes de empezar</h1>
      <div class="notice notice-info"><strong>${esc(TEEN_TEXT.privacy)}</strong></div>
      <h2>Tus términos</h2><p class="legal-ph">${esc(CONSENT_FORMS.teenTerms)}</p>
      <div class="child-actions"><button class="btn btn-primary big" id="tt-ok">Entiendo y acepto</button><button class="btn btn-ghost" id="tt-doubt">Tengo dudas: quiero hablarlo con un adulto de confianza</button></div></section>`;
  else if (S === "teen-assent") inner = `<section class="child-card"><h1 class="child-title sm">Tu profesional y vos</h1>
      <p class="legal-ph"><strong>${esc(CONSENT_FORMS.teen1315.title)}.</strong> ${esc(CONSENT_FORMS.teen1315.body)}</p>
      <p>¿Estás de acuerdo con que tu profesional vea cómo te va en las aventuras?</p>
      <div class="child-actions"><button class="btn btn-primary big" id="ta-yes">Sí, estoy de acuerdo</button><button class="btn btn-ghost" id="ta-doubt">Tengo dudas: quiero que esté un adulto de confianza</button><button class="btn btn-ghost" id="ta-no">No, por ahora no</button></div></section>`;
  else if (S === "teen-consent") inner = `<section class="child-card"><h1 class="child-title sm">Tu consentimiento</h1>
      <p class="legal-ph"><strong>${esc(CONSENT_FORMS.teen1617.title)}.</strong> ${esc(CONSENT_FORMS.teen1617.body)}</p>
      <p>Si aceptás, le avisamos a tu representante que diste tu consentimiento. Vos elegís qué más se le cuenta:</p>
      <label class="check"><input type="checkbox" id="tc-name"> Que sepa el nombre y la matrícula de tu profesional</label>
      <label class="check"><input type="checkbox" id="tc-why"> Que sepa el motivo general</label>
      <div class="child-actions"><button class="btn btn-primary big" id="tc-yes">Doy mi consentimiento</button><button class="btn btn-ghost" id="tc-no">No, por ahora no</button></div></section>`;
  else if (S === "majority") inner = `<section class="child-card"><h1 class="child-title sm">Cumpliste 18 años</h1>
      <p>Desde ahora esta cuenta es tuya. Tu familia deja de ver tu actividad, salvo que vos lo autorices.</p>
      <label class="check"><input type="checkbox" id="mj-fam"> Autorizo que mi familia siga viendo el tiempo y las aventuras</label>
      <div class="child-actions"><button class="btn btn-primary big" id="mj-ok">Tomar la titularidad</button></div></section>`;
  else if (S === "child-assent") inner = `<section class="child-card center">${companionArt(p, c, "calma", 120)}
      <h1 class="child-title">${esc(CONSENT_FORMS.childAssent)}</h1>${listen(CONSENT_FORMS.childAssent)}
      <div class="child-actions"><button class="btn btn-primary big" id="as-yes">Sí, está bien</button><button class="btn btn-ghost big" id="as-adult">Quiero hablarlo con una persona grande</button></div>${pruebaTag()}</section>`;
  else if (S === "avatar") inner = `
    <h1 class="child-title">${CHILD_TEXT.pickAvatar}</h1>${listen(CHILD_TEXT.pickAvatar)}
    <div class="avatar-grid" role="group" aria-label="Personajes">${AVATARS.map((av) =>
      `<button class="avatar-btn ${c.avatarId === av.id ? "sel" : ""}" data-av="${av.id}" aria-pressed="${c.avatarId === av.id}">${Avatar.svg(av.id, "alegria", 92)}<span>${esc(av.label)}</span></button>`).join("")}</div>
    ${c.teen ? `<p><button class="btn btn-ghost" id="sober-on">Prefiero sin compañero (modo sobrio)</button></p>` : ""}
    <div class="child-actions"><button class="btn btn-primary big" id="ch-next" ${c.avatarId ? "" : "disabled"}>${CHILD_TEXT.next}</button></div>`;
  else if (S === "hello") {
    const again = (p.companion?.growth || 0) > 0;
    const t = c.teen ? CHILD_TEXT.helloTeen : again ? CHILD_TEXT.helloAgain : CHILD_TEXT.hello;
    inner = `<section class="child-card center">${companionArt(p, c, "alegria", 150)}<h1 class="child-title">${t}</h1>${listen(t)}
      ${c.teen ? `<p class="small">${esc(TEEN_TEXT.privacy)}</p><div class="row center-row"><button class="btn btn-ghost" id="sober-toggle">${p.teen.sober ? "Activar compañero" : "Modo sobrio (sin compañero)"}</button><button class="btn btn-ghost" id="my-data">Mis datos</button></div>` : ""}
      <div class="child-actions"><button class="btn btn-primary big" id="ch-next">${CHILD_TEXT.next}</button></div></section>`;
  } else if (S === "checkin") {
    const q = c.teen ? CHECKIN.question.teen : CHECKIN.question.child;
    const opts = Rules.moodOptions(c.route);
    inner = `<h1 class="child-title">${q}</h1>${listen(q)}
      <div class="mood-grid" role="group" aria-label="Cómo me siento">${opts.map((id) => `<button class="mood-btn ${c.rec.moodStart === id ? "sel" : ""}" data-mood="${id}" aria-pressed="${c.rec.moodStart === id}">${c.teen && p.teen.sober ? "" : Avatar.svg(c.avatarId || "zorro", id, 84)}<span>${esc(moodLabelFor(c, id))}</span></button>`).join("")}</div>
      ${c.rec.moodStart ? `<p class="reply" role="status">${esc(CHECKIN.reply[Rules.moodRow(c.rec.moodStart)])}</p>` : ""}
      ${c.route === "3-5" ? `<p class="hint">Con una persona grande al lado.</p>` : ""}
      <div class="child-actions">${checkinActions(c)}</div>`;
  } else if (S === "calm") inner = `<section class="child-card center"><h1 class="child-title">${CHILD_TEXT.calmTitle}</h1>
      <div class="breath" aria-hidden="true"></div><p class="breath-text" aria-live="polite">${CHILD_TEXT.calmSteps[0]}</p>
      <div class="child-actions" id="calm-after" hidden><button class="btn btn-primary big" data-go-step="discover-short">Seguir con algo corto</button><button class="btn btn-ghost big" data-go-step="end">Terminar por hoy</button></div>${pruebaTag()}</section>`;
  else if (S === "discover") inner = `<section class="child-card"><p class="eyebrow">${CHILD_TEXT.discover}</p>
      <div class="discover">${actIcon(a.id, 96)}<div><h1 class="child-title sm">${esc(a.name)}</h1><p class="lead">${esc(a.discover)}</p>${listen(a.discover)}</div></div>${pruebaTag()}
      <div class="child-actions"><button class="btn btn-primary big" id="ch-next">¡Ahora yo!</button></div></section>`;
  else if (S === "play") inner = `
    <div class="child-act-head">${c.teen && p.teen.sober ? "" : Avatar.svg(c.avatarId || "zorro", "calma", 64)}<div><h1 class="child-title sm">${esc(a.name)}</h1><p>${esc(a.instruction)}</p></div>${listen(a.instruction)}</div>
    <div id="act-root" class="act-root"></div>
    <div class="child-actions"><button class="btn btn-ghost" id="ch-stop">Quiero terminar acá</button></div>`;
  else if (S === "result") {
    const m = c.rec.metrics;
    const t = m.abandoned ? "Está bien terminar acá. Lo que probaste también cuenta." : m.floorExit ? CHILD_TEXT.floorDemo : (a.ok[0] || "Lo hiciste paso a paso.");
    inner = `<section class="child-card center">${companionArt(p, c, "alegria", 140)}
      <h1 class="child-title">${esc(t)}</h1>${listen(t + (c.levelChanged ? " " + CHILD_TEXT.newTry : ""))}
      ${m.floorExit ? `<div class="demo-guide">${actIcon(a.id, 72)}<p>${esc(a.discover)}</p></div>` : ""}
      ${c.levelChanged ? `<p class="lead">${CHILD_TEXT.newTry}</p>` : ""}
      ${c.grew ? `<p class="small">Tu mundo creció un poquito.</p>` : ""}
      <div class="child-actions"><button class="btn btn-primary big" id="ch-next">${CHILD_TEXT.next}</button></div></section>`;
  } else if (S === "hacer") {
    const alts = (DESAFIOS[a.zone] || DESAFIOS.isla).slice(0, 3);
    inner = `<section class="child-card"><h1 class="child-title sm">${CHILD_TEXT.hacerTitle}</h1>${listen(alts.map((d) => d.text).join(". "))}
      <p>Elijan uno, si quieren. Es opcional.</p>
      <ul class="desafios">${alts.map((d) => `<li><span class="picto" aria-hidden="true">${d.icon}</span><span>${esc(d.text)}</span></li>`).join("")}</ul>${pruebaTag()}
      <div class="child-actions"><button class="btn btn-primary big" id="d-done">Lo hicimos</button><button class="btn btn-soft big" id="ch-next">Más tarde</button><button class="btn btn-ghost" id="ch-skip">${CHILD_TEXT.skip}</button></div></section>`;
  } else if (S === "contar") {
    if (c.route === "3-5") inner = `<section class="child-card center">${companionArt(p, c, "calma", 110)}<h1 class="child-title">${CHILD_TEXT.contarKids}</h1>${listen(CHILD_TEXT.contarKids)}
      <div class="child-actions"><button class="btn btn-primary big" id="ch-next">${CHILD_TEXT.next}</button></div></section>`;
    else inner = `<section class="child-card"><h1 class="child-title sm">${CHILD_TEXT.contarHelp}</h1>${listen(CHILD_TEXT.contarHelp + " " + a.strategies.join(", "))}
      <div class="chip-row" role="group">${a.strategies.map((s) => `<button class="chip ${c.rec.helped === s ? "sel" : ""}" data-help="${esc(s)}" aria-pressed="${c.rec.helped === s}">${esc(s)}</button>`).join("")}</div>
      <h2 class="child-title sm">${CHILD_TEXT.contarHow}</h2>
      <div class="diff-row" role="group">${CHILD_TEXT.how.map((d) => `<button class="diff-btn ${c.rec.how === d.id ? "sel" : ""}" data-how="${d.id}" aria-pressed="${c.rec.how === d.id}">${esc(d.label)}</button>`).join("")}</div>
      <div class="child-actions"><button class="btn btn-primary big" id="ch-next">${CHILD_TEXT.next}</button><button class="btn btn-ghost" id="ch-skip">${CHILD_TEXT.skip}</button></div></section>`;
  } else if (S === "softclose") inner = `<section class="child-card center">${companionArt(p, c, "calma", 130)}<h1 class="child-title">${CHILD_TEXT.softClose}</h1>${listen(CHILD_TEXT.softClose)}
      <div class="child-actions">${c.route === "3-5" ? `<p>${CHILD_TEXT.adultGate}</p><button class="btn btn-soft big hold" id="sc-adult"><span>Mantener apretado para seguir</span><i></i></button>` : `<button class="btn btn-soft big" id="sc-more">Seguir un ratito</button>`}
      <button class="btn btn-primary big" data-go-step="end">Terminar por hoy</button></div></section>`;
  else if (S === "end" || S === "done") {
    const t = c.teen ? CHILD_TEXT.byeTeen : CHILD_TEXT.bye;
    inner = `<section class="child-card center">${companionArt(p, c, "alegria", 120)}<h1 class="child-title">${t}</h1>${listen(t + (c.closeExtra ? " " + c.closeExtra : ""))}
      ${c.closeExtra ? `<p>${esc(c.closeExtra)}</p>` : ""}
      ${c.teen && p.teen.sober ? "" : worldArt(p, sessions)}${constellation(c, sessions)}
      <div class="child-actions">${c.teen ? `<button class="btn btn-ghost" id="my-data">Mis datos</button><button class="btn btn-primary big" id="ch-exit-teen">Salir</button>` : `<p>${CHILD_TEXT.adultGate.replace("seguir", "salir")}</p><button class="btn btn-primary big hold" id="ch-exit"><span>Mantener apretado</span><i></i></button>`}</div></section>`;
  }
  app().innerHTML = shell(user, `<div class="child-wrap ${c.teen ? "teen" : "r" + c.route}">${inner}</div>`, { child: true });
  bindCommon(user);
  bindChild(user, p, a);
}

function checkinActions(c) {
  const adj = c.adjust;
  if (!c.rec.moodStart) return `<button class="btn btn-ghost big" id="ck-skip">${CHILD_TEXT.skip}</button>`;
  if (adj.kind === "corta") return `<button class="btn btn-primary big" data-go-step="discover-short">Algo cortito</button><button class="btn btn-soft big" data-go-step="end">Descansar</button>`;
  if (adj.kind === "tranquila") return `<button class="btn btn-primary big" data-go-step="discover-short">Algo tranquilo</button><button class="btn btn-soft big" data-go-step="end-triste">Dejamos por hoy</button>`;
  if (adj.kind === "calma") return `<button class="btn btn-primary big" data-go-step="calm">Respirar juntos</button>`;
  return `<button class="btn btn-primary big" data-go-step="discover">${CHILD_TEXT.next}</button>`;
}

function bindChild(user, p, a) {
  const c = State.child;
  const advance = (step) => { c.step = step; renderChild(user); };
  const say = (t) => Voice.say(t);
  $$("[data-say]").forEach((b) => b.addEventListener("click", () => { const was = Voice.on; Voice.on = true; Voice.say(b.dataset.say); Voice.on = was; }));
  const auto = $("[data-say]"); if (auto) say(auto.dataset.say);
  const nx = $("#ch-next");
  $$("[data-go-step]").forEach((b) => b.addEventListener("click", () => {
    const s = b.dataset.goStep;
    if (s === "discover-short") { c.rounds = 3; return advance("discover"); }
    if (s === "end-triste") { c.closeExtra = c.teen ? CHECKIN.closeTriste.teen : CHECKIN.closeTriste.child; return advance("end"); }
    if (s === "end" && c.adjust.row === "triste") c.closeExtra = c.teen ? CHECKIN.closeTriste.teen : CHECKIN.closeTriste.child;
    advance(s);
  }));
  const S = c.step;
  if (S === "teen-terms") {
    $("#tt-ok").addEventListener("click", () => { Store.setTeen(p.id, { termsAt: Store.now(), privacySeenAt: Store.now() }); c.step = firstStep(Store.db.patients.find((x) => x.id === p.id), c); renderChild(user); });
    $("#tt-doubt").addEventListener("click", () => { c.closeExtra = "Podés volver cuando lo hayas hablado."; advance("end"); });
  }
  if (S === "teen-assent") {
    const rec = async (d) => { await Store.consent(user, p.id, "asentimiento-adolescente", d); };
    $("#ta-yes").addEventListener("click", async () => { await rec("acepta"); c.step = firstStep(p, c); renderChild(user); });
    $("#ta-doubt").addEventListener("click", async () => { await rec("dudas: pide adulto de confianza"); c.closeExtra = "Le avisamos a tu profesional que querés hablarlo con un adulto de confianza."; advance("end"); });
    $("#ta-no").addEventListener("click", async () => { await rec("no acepta"); c.closeExtra = "Está bien. Tu profesional no va a ver tus datos."; c.step = p.avatarId || p.teen.sober ? "hello" : "avatar"; renderChild(user); });
  }
  if (S === "teen-consent") {
    $("#tc-yes").addEventListener("click", async () => {
      const det = [$("#tc-name").checked ? "autoriza informar nombre y matrícula" : "no autoriza informar el nombre", $("#tc-why").checked ? "autoriza informar el motivo general" : "no autoriza informar el motivo"].join("; ");
      await Store.consent(user, p.id, "consentimiento-adolescente", det); c.step = firstStep(p, c); renderChild(user);
    });
    $("#tc-no").addEventListener("click", async () => { await Store.consent(user, p.id, "no-consiente", ""); c.step = p.avatarId || p.teen.sober ? "hello" : "avatar"; renderChild(user); });
  }
  if (S === "majority") $("#mj-ok").addEventListener("click", async () => { await Store.consent(user, p.id, "titularidad", $("#mj-fam").checked ? "autoriza-familia" : ""); c.step = firstStep(p, c); renderChild(user); });
  if (S === "child-assent") {
    $("#as-yes").addEventListener("click", async () => { await Store.consent(user, p.id, "asentimiento-nino", "acepta"); c.step = firstStep(p, c); renderChild(user); });
    $("#as-adult").addEventListener("click", async () => { await Store.consent(user, p.id, "asentimiento-nino", "quiere hablarlo con un adulto"); c.step = firstStep(p, c); renderChild(user); });
  }
  if (S === "avatar") {
    $$("[data-av]").forEach((b) => b.addEventListener("click", () => { c.avatarId = b.dataset.av; renderChild(user); }));
    nx.addEventListener("click", () => advance("hello"));
    const so = $("#sober-on"); if (so) so.addEventListener("click", () => { Store.setTeen(p.id, { sober: true }); advance("hello"); });
  }
  if (S === "hello") {
    nx.addEventListener("click", () => {
      if (Store.playedToday(p) >= Rules.sessionLimitMin(c.route) * 60000) return advance("softclose");
      advance("checkin");
    });
    const st = $("#sober-toggle"); if (st) st.addEventListener("click", () => { Store.setTeen(p.id, { sober: !p.teen.sober }); renderChild(user); });
  }
  if (S === "checkin") {
    $$("[data-mood]").forEach((b) => b.addEventListener("click", () => {
      c.rec.moodStart = b.dataset.mood; c.adjust = Rules.checkinAdjust(c.rec.moodStart);
      c.rounds = c.adjust.kind === "estandar" ? 5 : 3; renderChild(user);
      say(CHECKIN.reply[c.adjust.row]);
    }));
    const sk = $("#ck-skip"); if (sk) sk.addEventListener("click", () => { c.rec.moodStart = null; c.adjust = Rules.checkinAdjust(null); advance("discover"); });
  }
  if (S === "calm") {
    let k = 0; const steps = CHILD_TEXT.calmSteps;
    const iv = setInterval(() => { k++; const el = $(".breath-text"); if (!el) return clearInterval(iv); el.textContent = steps[k % 2]; }, FAST() ? 100 : 4000);
    setTimeout(() => { clearInterval(iv); const af = $("#calm-after"); if (af) af.hidden = false; }, FAST() ? 300 : 60000);
  }
  if (S === "discover") nx.addEventListener("click", () => advance("play"));
  if (S === "play") {
    const pl = Store.plansFor(p.id).find((x) => x.activityId === a.id);
    let st = p.adaptive[a.id] || Rules.newSkillState(pl ? pl.level : 1);
    st = Rules.startSession(st);
    const startLevel = st.level, max = a.levels.length;
    c.playStart = Date.now();
    const ctx = {
      rounds: c.rounds, okText: a.ok, errText: a.err,
      getLevel: () => st.level,
      onItem: (item) => { const r = Rules.adapt(st, item, { min: 1, max, blockUp: c.adjust.blockUp }); st = r.state; return r; }
    };
    const engine = Engines[a.id]($("#act-root"), { avatarId: c.avatarId, say, ctx,
      onDone: (m) => {
        if (c.step !== "play") return;
        const ms = Date.now() - c.playStart;
        const total = Store.addPlayTime(p.id, ms);
        st.blockUpNext = false;
        Store.saveSkill(p.id, a.id, st);
        c.levelChanged = st.level !== startLevel;
        c.rec.metrics = { level: startLevel, endLevel: st.level, ...m };
        c.rec.startAt = Store.now() - ms; c.rec.endAt = Store.now();
        c.grew = false;
        if (!m.abandoned) {                                         // M01-1 y T08
          const g = Rules.growthAfterActivity(p.companion || {}, { playedMsToday: total - ms, limitMin: Rules.sessionLimitMin(c.route), dayKey: new Date(Store.now()).toDateString() });
          Store.setCompanion(p.id, g.companion); c.grew = g.grew;
        }
        c.overTime = total >= Rules.sessionLimitMin(c.route) * 60000;
        advance("result");
      } });
    $("#ch-stop").addEventListener("click", () => engine.abandon());
  }
  if (S === "result") nx.addEventListener("click", () => advance("hacer"));
  if (S === "hacer") {
    $("#d-done").addEventListener("click", () => { c.rec.desafioHecho = true; Store.bumpDesafio(p.id); advance("contar"); });
    nx.addEventListener("click", () => advance("contar"));
    $("#ch-skip").addEventListener("click", () => advance("contar"));
  }
  if (S === "contar") {
    $$("[data-help]").forEach((b) => b.addEventListener("click", () => { c.rec.helped = b.dataset.help; renderChild(user); }));
    $$("[data-how]").forEach((b) => b.addEventListener("click", () => { c.rec.how = b.dataset.how; renderChild(user); }));
    const finish = () => {
      // M07-1: "difícil" es dato complementario: la próxima sesión no sube. Nunca baja solo por eso.
      if (c.rec.how === "dificil") { const st = p.adaptive[a.id]; if (st) { st.blockUpNext = true; Store.saveSkill(p.id, a.id, st); } }
      Store.reload(); const u = Store.currentUser(); if (!u || !u.id) return render();
      Store.recordSession(u, { patientId: c.patientId, activityId: c.activityId, context: c.context, avatarId: c.avatarId, ...c.rec });
      advance(c.overTime ? "softclose" : "end");
    };
    nx.addEventListener("click", finish);
    const sk = $("#ch-skip"); if (sk) sk.addEventListener("click", () => { c.rec.helped = null; c.rec.how = null; finish(); });
  }
  if (S === "softclose") {
    const more = $("#sc-more"); if (more) more.addEventListener("click", () => advance("checkin"));
    const ad = $("#sc-adult"); if (ad) holdButton(ad, () => advance("checkin"));
  }
  if (S === "end") {
    const ex = $("#ch-exit");
    const leave = () => { const back = c.backTo, params = c.backParams; State.child = null; Voice.on = !!Prefs.get().voice; notice("Listo. ¡Gracias por acompañar!", "ok"); go(back || "home", params); };
    if (ex) holdButton(ex, leave);
    const et = $("#ch-exit-teen"); if (et) et.addEventListener("click", leave);
  }
  const md = $("#my-data"); if (md) md.addEventListener("click", () => openTeenData(p));
  /* "Volver al inicio" desde el modo niño: la salida la confirma una persona adulta (el adolescente sale solo). */
  const hb = $("#ch-home");
  if (hb) hb.addEventListener("click", () => {
    if (c.teen) { State.child = null; return go("home"); }
    modal(`<h2 id="modal-title">¿Volver al inicio?</h2><p>La aventura en curso no se va a guardar. Esta salida la hace una persona adulta.</p>
      <div class="row"><button class="btn btn-primary hold" id="ch-home-ok"><span>Mantener apretado para salir</span><i></i></button><button class="btn btn-ghost" data-close>Seguir</button></div>`, () => {
      holdButton($("#ch-home-ok"), () => { State.child = null; Voice.on = !!Prefs.get().voice; go("home"); });
    });
  });
}

/* REQ-CLI-A11: el adolescente ve todos sus datos y puede descargarlos. */
function openTeenData(p) {
  const ses = Store.db.activitySessions.filter((s) => s.patientId === p.id).sort((a, b) => b.startAt - a.startAt);
  const data = { exportado: new Date(Store.now()).toISOString(), aviso: FAMILY_TEXT.export, perfil: { codigo: p.code, apodo: p.alias, modo: p.mode },
    sesiones: ses.map((s) => ({ fecha: new Date(s.startAt).toISOString(), aventura: actById(s.activityId)?.name, completo: !s.metrics.abandoned, aciertosPrimerIntento: s.metrics.firstTry, items: s.metrics.items, nivelInicio: s.metrics.level, nivelFin: s.metrics.endLevel, animo: s.moodStart, meAyudo: s.helped, meResulto: s.how })),
    consentimientos: p.consents.map(({ type, at, detail, hash }) => ({ tipo: type, fecha: new Date(at).toISOString(), detalle: detail, huella: hash })) };
  modal(`<h2 id="modal-title">Mis datos</h2><p>Esto es todo lo que guardamos de tu actividad.</p>
    <div class="table-wrap"><table class="tbl compact"><thead><tr><th>Fecha</th><th>Aventura</th><th>Ánimo</th><th>Me ayudó</th></tr></thead><tbody>
    ${ses.slice(0, 30).map((s) => `<tr><td>${fmtDateTime(s.startAt)}</td><td>${esc(actById(s.activityId)?.name)}</td><td>${esc(s.moodStart ? moodLabel(s.moodStart) : "—")}</td><td>${esc(s.helped || "—")}</td></tr>`).join("") || `<tr><td colspan="4">Todavía no hay registros.</td></tr>`}</tbody></table></div>
    <div class="row"><button class="btn btn-primary" id="dl-me">Descargar mis datos</button><button class="btn btn-ghost" data-close>Cerrar</button></div>`, (root) => {
    $("#dl-me", root).addEventListener("click", () => download("mis-datos-" + p.code + ".json", JSON.stringify(data, null, 2)));
  });
}

function download(name, text, type = "application/json") {
  const b = new Blob([text], { type }); const u = URL.createObjectURL(b);
  const aEl = document.createElement("a"); aEl.href = u; aEl.download = name; document.body.appendChild(aEl); aEl.click(); aEl.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

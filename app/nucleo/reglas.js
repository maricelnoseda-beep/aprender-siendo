"use strict";
/* ==========================================================================
   rules.js — Reglas deterministas de la beta 2 (código, nunca modelo)

   Cada función implementa un requisito de ONB-MEJ-001-R v2.0 (PSP-SR,
   2026-11-08) y lleva su identificador REQ-CLI. Son funciones puras: no tocan
   la pantalla ni los datos guardados, y se prueban solas (tests/rules.test.js).
   Los umbrales clínicos viven en content.js (RULES_CONFIG) para que PSP-SR y
   la supervisora los calibren sin tocar la lógica.
   ========================================================================== */

const Rules = (() => {
  const C = () => RULES_CONFIG;

  /* ---------- Rutas por edad (REQ-CLI M11, sección 6.8) ---------- */
  function route(age) {
    age = +age;
    if (age <= 5) return "3-5";
    if (age <= 8) return "6-8";
    if (age <= 12) return "9-12";
    return "13-18";
  }
  /* Edad actual a partir del año y mes de nacimiento (dato mínimo: sin día). */
  function ageFrom(birthYM, nowMs) {
    if (!birthYM) return null;
    const [y, m] = birthYM.split("-").map(Number);
    const d = new Date(nowMs);
    let a = d.getFullYear() - y;
    if (d.getMonth() + 1 < m) a--;
    return a;
  }
  function sessionLimitMin(r) { return C().sessionMinutes[r]; }   // REQ-CLI-T08

  /* ---------- Check-in emocional (REQ-CLI-M02-1 a M02-3) ---------- */
  function moodOptions(r) { return CHECKIN.options[r === "9-12" || r === "6-8" ? "6-12" : r]; }
  function moodRow(moodId) { return (CHECKIN.rows.find((row) => row.moods.includes(moodId)) || { id: "estandar" }).id; }
  /* Devuelve el ajuste de la sesión. Nunca alarga, endurece ni bloquea (M02-3). */
  function checkinAdjust(moodId) {
    const row = moodId ? moodRow(moodId) : "estandar";          // saltear = estándar (M02-2)
    const a = {
      estandar: { kind: "estandar", blockUp: false, offer: null },
      nodice: { kind: "estandar", blockUp: false, offer: null },
      cansado: { kind: "corta", blockUp: true, offer: ["corta", "descanso"] },
      triste: { kind: "tranquila", blockUp: true, offer: ["tranquila", "terminar"] },
      enojado: { kind: "calma", blockUp: true, offer: ["calma"] }
    }[row];
    return { row, ...a };
  }
  /* REQ-CLI-M02-5: 3 de las últimas 5 sesiones con un estado de la fila Triste o Enojado. */
  function moodPattern(moodsNewestFirst) {
    const last = moodsNewestFirst.filter(Boolean).slice(0, 5);
    const hits = last.filter((m) => ["triste", "enojado"].includes(moodRow(m))).length;
    return hits >= C().moodPatternHits;
  }

  /* ---------- Dificultad adaptativa (REQ-CLI-M10-2 a M10-9) ---------- */
  function newSkillState(level = 1) { return { level, window: [], consecErr: 0, upThisSession: false, floorExit: false, locked: false, fixed: null, blockUpNext: false }; }
  function startSession(st) { return { ...st, upThisSession: false, floorExit: false, consecErr: 0 }; }
  /* item = { ok: acierto al primer intento, hinted: usó ayuda }. El tiempo NO entra (M10-7). */
  function adapt(st, item, { min = 1, max = 3, blockUp = false } = {}) {
    const s = { ...st, window: st.window.slice() };
    const out = { action: "mantener", nextEasy: false, moreHelp: false };
    if (s.floorExit) return { state: s, ...out, action: "fuera" };
    s.window.push({ ok: !!item.ok, hinted: !!item.hinted });
    if (s.window.length > C().adaptWindow) s.window.shift();
    s.consecErr = item.ok ? 0 : s.consecErr + 1;
    if (s.locked || s.fixed) return { state: s, ...out };        // M10-9: el profesional fijó o bloqueó

    if (!item.ok && s.consecErr >= C().consecErrors) {
      if (s.level > min) {                                        // M10-5: baja y corta la racha de errores
        s.level--; s.window = []; s.consecErr = 0;
        return { state: s, action: "bajar", nextEasy: true, moreHelp: true };
      }
      s.floorExit = true;                                         // M10-6: piso → salida, nunca bucle
      return { state: s, action: "piso", nextEasy: false, moreHelp: true };
    }
    if (s.window.length < C().adaptMinItems) return { state: s, ...out };   // M10-2
    const n = s.window.length;
    const pct = s.window.filter((w) => w.ok).length / n;
    const noHelp = s.window.filter((w) => w.ok && !w.hinted).length / n;
    if (pct >= C().upPct && noHelp >= C().upNoHelpPct && !s.upThisSession && !blockUp && !s.blockUpNext && s.level < max) {
      s.level++; s.window = []; s.upThisSession = true;           // M10-3: un paso por sesión
      return { state: s, ...out, action: "subir" };
    }
    if (pct < C().downPct && s.level > min) {                      // M10-5 por porcentaje
      s.level--; s.window = [];
      return { state: s, ...out, action: "bajar", moreHelp: true };
    }
    return { state: s, ...out };                                   // M10-4
  }

  /* ---------- Compañero que crece (REQ-CLI-M01-1, M01-2, T08) ---------- */
  function growthAfterActivity(companion, { playedMsToday, limitMin, dayKey }) {
    const c = { ...companion };
    if (c.day !== dayKey) { c.day = dayKey; c.grownToday = 0; }
    if (playedMsToday >= limitMin * 60000) return { companion: c, grew: false };   // tope diario
    c.growth = (c.growth || 0) + 1; c.grownToday++;
    return { companion: c, grew: true };
  }
  function companionStage(growth) { return Math.min(5, Math.floor((growth || 0) / 3)); }

  /* ---------- Ficha de aventura (REQ-CLI-M04-1 a M04-3) ---------- */
  const FICHA_FIELDS = ["habilidad", "paraQue", "edad", "nivel", "fuente", "biblioteca", "transferencia", "dosis", "version", "verificada", "autor", "revisor"];
  function validateFicha(f, xPractices) {
    const errors = FICHA_FIELDS.filter((k) => !f || f[k] === undefined || f[k] === null || String(f[k]).trim() === "").map((k) => "Falta el campo: " + k);
    if (f && f.nivel && !["A", "B", "C"].includes(f.nivel)) errors.push("Nivel de evidencia inválido (solo A, B o C)");
    if (f && f.fuente && !/(10\.\d{4,}\/\S+|PMID\s*\d+|https:\/\/\S+)/i.test(f.fuente)) errors.push("La fuente necesita DOI, PMID o URL oficial");
    if (f && f.practica && xPractices.includes(f.practica)) errors.push("Práctica de Nivel X: publicación bloqueada sin excepción");
    return { ok: errors.length === 0, errors, rotuloC: f && f.nivel === "C" ? "Basada en práctica clínica, con evidencia limitada" : null };
  }

  /* ---------- Alertas para el profesional (REQ-CLI-M09-3) ---------- */
  function alerts({ sessions, plans, objectives, moodsNewestFirst, linked, now }) {
    const out = [];
    const DAYms = 86400000;
    if (linked && plans.length) {                                 // adherencia: < 50 % en 2 semanas
      const planned = plans.reduce((a, p) => a + p.perWeek * 2, 0);
      const done = sessions.filter((s) => now - s.startAt <= 14 * DAYms).length;
      if (planned > 0 && done / planned < C().lowAdherence) out.push({ key: "adherencia", title: "Adherencia baja", detail: `${done} de ${planned} sesiones planificadas en 2 semanas.` });
    }
    const byAct = {};                                              // piso: 3 sesiones seguidas en el mínimo
    sessions.slice().sort((a, b) => b.startAt - a.startAt).forEach((s) => { (byAct[s.activityId] = byAct[s.activityId] || []).push(s); });
    Object.entries(byAct).forEach(([act, list]) => {
      const last3 = list.slice(0, 3);
      if (last3.length === 3 && last3.every((s) => s.metrics && s.metrics.endLevel === 1 && s.metrics.floorExit)) out.push({ key: "piso", act, title: "Habilidad en el piso", detail: "3 sesiones seguidas en el nivel mínimo." });
    });
    (objectives || []).forEach((o) => {                            // falta de respuesta a las 6–8 semanas
      if (!o.baseline && o.baseline !== 0) return;
      const weeks = (now - o.startAt) / (7 * DAYms);
      if (weeks < C().noResponseWeeks || !o.measures || o.measures.length < 2) return;
      const pts = [{ t: o.startAt, v: +o.baseline }, ...o.measures.map((m) => ({ t: m.at, v: +m.value }))];
      const slope = linSlope(pts);                                 // unidades por semana
      const needed = (+o.goal - +o.baseline) / Math.max(1, o.weeks);
      if (slope < needed) out.push({ key: "respuesta", title: "Revisar intensidad, método o hipótesis", detail: `Objetivo «${o.text}»: la pendiente (${slope.toFixed(2)}/sem.) no alcanza la meta (${needed.toFixed(2)}/sem.).` });
    });
    if (linked && moodPattern(moodsNewestFirst || [])) out.push({ key: "animo", title: "Patrón de autorreporte para conversar", detail: "No es una alerta del protocolo de riesgo. Aviso no urgente." });
    return out;
  }
  function linSlope(pts) {
    const W = 7 * 86400000;
    const xs = pts.map((p) => p.t / W), ys = pts.map((p) => p.v);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
    const num = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0), den = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    return den ? num / den : 0;
  }

  /* ---------- Filtro de salida del resumen (REQ-CLI-M09-1, caso 12) ---------- */
  function filterSummary(text) {
    const hits = OUTPUT_FILTER.filter((re) => re.test(text)).map((re) => re.source);
    return { ok: hits.length === 0, hits };
  }

  /* ---------- Datos identificatorios en texto de adultos (sugerencias, notas) ---------- */
  function piiCheck(text) {
    const found = [];
    if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text)) found.push("un correo electrónico");
    if (/(\+?\d[\d\s-]{7,}\d)/.test(text)) found.push("un número de teléfono o documento");
    if (/\b\d{1,2}\.\d{3}\.\d{3}\b/.test(text)) found.push("un número de documento");
    return { ok: found.length === 0, found };
  }

  /* ---------- Consentimiento y vinculación (REQ-CLI-M08-3, A01 a A08) ---------- */
  /* records: registro de consentimiento del paciente, en orden cronológico. */
  function linkStatus(age, records) {
    const has = (t, pred = () => true) => records.some((r) => r.type === t && pred(r));
    const lastRevoke = Math.max(-1, ...records.map((r, i) => (r.type === "revocacion" ? i : -1)));
    const after = records.slice(lastRevoke + 1);
    const hasA = (t, pred = () => true) => after.some((r) => r.type === t && pred(r));
    if (lastRevoke >= 0 && !hasA("consentimiento-representante") && !hasA("consentimiento-adolescente")) return { status: "revocada", missing: [] };
    if (hasA("decision-profesional", (r) => r.detail === "suspender")) return { status: "suspendida", missing: [] };
    if (age >= 18) {
      if (hasA("titularidad")) return { status: "activa", missing: [], adult: true };
      return { status: "pendiente", missing: ["La persona cumplió 18 años: tiene que tomar la titularidad de la cuenta"] };
    }
    if (age >= 16) {                                               // A02: consentimiento propio + aviso
      return hasA("consentimiento-adolescente") ? { status: "activa", missing: [], needsNotice: !hasA("aviso-enviado") }
        : { status: "pendiente", missing: ["Falta el consentimiento del adolescente"] };
    }
    if (age >= 13) {                                               // A02: representante Y asentimiento
      const missing = [];
      if (!hasA("consentimiento-representante")) missing.push("Falta el consentimiento del representante");
      if (!hasA("asentimiento-adolescente", (r) => r.detail === "acepta")) missing.push("Falta el asentimiento del adolescente");
      return { status: missing.length ? "pendiente" : "activa", missing };
    }
    return hasA("consentimiento-representante") ? { status: "activa", missing: [], assentAsked: hasA("asentimiento-nino") }
      : { status: "pendiente", missing: ["Falta el consentimiento del representante"] };
  }
  /* REQ-CLI-A05: plazo de 72 horas hábiles (3 días hábiles, sin sábados ni domingos). */
  function noticeDeadline(sentAt) {
    const d = new Date(sentAt); let left = 3;
    while (left > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) left--; }
    return d.getTime();
  }

  /* REQ-CLI-A10 y M08: qué ve cada perfil. */
  function familyCanSee(patient, age, what) {
    if (age >= 18 && patient.selfOwner && !patient.familyAuthorized) return false;      // A03
    if (age >= 13) return ["tiempo", "aventuras"].includes(what);                        // A10
    const base = ["tiempo", "aventuras", "desafios"];
    if (base.includes(what)) return true;
    if (patient.mode !== "vinculado") return false;                                      // modo libre: sin interpretación
    return !!(patient.share && patient.share[what]);                                     // lo que el profesional compartió
  }

  return { route, ageFrom, sessionLimitMin, moodOptions, moodRow, checkinAdjust, moodPattern,
    newSkillState, startSession, adapt, growthAfterActivity, companionStage,
    FICHA_FIELDS, validateFicha, alerts, linSlope, filterSummary, piiCheck, linkStatus, noticeDeadline, familyCanSee };
})();
if (typeof module !== "undefined") module.exports = { Rules };

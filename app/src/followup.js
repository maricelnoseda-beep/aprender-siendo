/* ==========================================================================
   followup.js — Seguimiento: indicadores calculados en CÓDIGO

   Regla del proyecto: el modelo de lenguaje nunca calcula indicadores ni
   decide. Todo lo de este archivo es determinista y auditable. Las señales
   usan los umbrales de demostración de content.js (FOLLOWUP_THRESHOLDS), que
   debe definir PSP-SR. Las sugerencias son borradores para el profesional.
   ========================================================================== */

const Followup = (() => {
  const T = () => FOLLOWUP_THRESHOLDS;

  function pct(a, b) { return b ? Math.round((a / b) * 100) : null; }

  function analyze(sessions, plans, nowTs) {
    const win = T().windowDays * DAY;
    const recent = sessions.filter((s) => nowTs - s.startAt <= win);
    // Sesiones por semana (4 semanas, de la más vieja a la más nueva)
    const weeks = [0, 0, 0, 0];
    recent.forEach((s) => { const w = Math.floor((nowTs - s.startAt) / (7 * DAY)); if (w < 4) weeks[3 - w]++; });

    // Adhesión: solo si hay pauta profesional con la cual comparar
    const last7 = sessions.filter((s) => nowTs - s.startAt <= 7 * DAY);
    const adherence = plans.map((pl) => {
      const done = last7.filter((s) => s.activityId === pl.activityId).length;
      return { activityId: pl.activityId, perWeek: pl.perWeek, done, pct: Math.min(100, pct(done, pl.perWeek)) };
    });
    const planned = adherence.reduce((a, x) => a + x.perWeek, 0);
    const doneCapped = adherence.reduce((a, x) => a + Math.min(x.done, x.perWeek), 0);
    const adherencePct = planned ? pct(doneCapped, planned) : null;

    // Participación: quincena anterior vs última quincena
    const prev = weeks[0] + weeks[1], last = weeks[2] + weeks[3];
    const drop = prev >= T().minSessionsForTrend ? Math.round(((prev - last) / prev) * 100) : null;

    // Desempeño por actividad (aciertos al primer intento)
    const byAct = {};
    sessions.slice().sort((a, b) => a.startAt - b.startAt).forEach((s) => { (byAct[s.activityId] ||= []).push(s); });
    const perActivity = Object.entries(byAct).map(([id, list]) => {
      const ft = (s) => pct(s.metrics.firstTry, s.metrics.items);
      const r = list.slice(-3), p = list.slice(-6, -3);
      const avg = (arr) => arr.length ? Math.round(arr.reduce((a, s) => a + ft(s), 0) / arr.length) : null;
      // dificultad reiterada: últimas N sesiones seguidas bajo el umbral o declaradas "difícil" o abandonadas
      let streak = 0;
      for (let i = list.length - 1; i >= 0; i--) {
        const s = list[i];
        const hard = ft(s) < T().difficultyFirstTryPct || s.metrics.abandoned || s.difficulty === "dificil";
        if (hard) streak++; else break;
      }
      return { id, count: list.length, recentPct: avg(r), prevPct: avg(p), level: list[list.length - 1].metrics.level, streak,
        lastAt: list[list.length - 1].startAt };
    });

    // Ánimo declarado (conteos; sin puntaje ni interpretación)
    const moodStart = {}, moodEnd = {};
    recent.forEach((s) => { moodStart[s.moodStart] = (moodStart[s.moodStart] || 0) + 1; if (s.moodAfter) moodEnd[s.moodAfter] = (moodEnd[s.moodAfter] || 0) + 1; });

    // Señales
    const signals = [];
    if (adherencePct !== null && adherencePct < T().lowAdherencePct)
      signals.push({ key: "baja_adhesion", detail: `Esta semana se realizó el ${adherencePct}% de lo indicado en la pauta.` });
    if (drop !== null && drop >= T().participationDropPct)
      signals.push({ key: "baja_participacion", detail: `Las sesiones bajaron un ${drop}% entre la quincena anterior (${prev}) y la última (${last}).` });
    perActivity.filter((a) => a.streak >= T().repeatedDifficultySessions).forEach((a) =>
      signals.push({ key: "dificultad_reiterada", activityId: a.id, detail: `${actName(a.id)}: ${a.streak} sesiones seguidas con dificultad (pocos aciertos al primer intento, abandono o "difícil").` }));
    const endHard = ["nervios", "enojo", "tristeza"].reduce((a, m) => a + (moodEnd[m] || 0), 0);
    const endTotal = Object.values(moodEnd).reduce((a, b) => a + b, 0);
    if (endTotal >= T().minSessionsForTrend && endHard / endTotal >= 0.5)
      signals.push({ key: "animo_final", detail: `En ${endHard} de ${endTotal} sesiones recientes el niño eligió nervios, enojo o tristeza al terminar.` });

    return { weeks, adherence, adherencePct, prev, last, drop, perActivity, moodStart, moodEnd, signals, total: recent.length };
  }

  function actName(id) { return (ACTIVITIES.find((a) => a.id === id) || { name: id }).name; }

  /* Arma las sugerencias (borrador) a partir de las señales. Sin modelo de
     lenguaje: selección determinista de textos de content.js. */
  function suggestions(result) {
    return result.signals.map((s) => {
      const base = FOLLOWUP_SUGGESTIONS[s.key];
      return { key: s.key, title: base.title, detail: s.detail, questions: base.questions, alternatives: base.alternatives };
    });
  }

  return { analyze, suggestions, actName };
})();

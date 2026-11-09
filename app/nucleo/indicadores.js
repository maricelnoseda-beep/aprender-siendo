"use strict";
/* ==========================================================================
   followup.js — Indicadores de seguimiento calculados en CÓDIGO

   El modelo de lenguaje nunca calcula indicadores ni decide (DEV-IA 4).
   Las alertas para el profesional salen de Rules.alerts (REQ-CLI-M09-3).
   ========================================================================== */

const Followup = (() => {
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);

  function analyze(sessions, plans, nowTs) {
    const recent = sessions.filter((s) => nowTs - s.startAt <= 28 * DAY);
    const weeks = [0, 0, 0, 0];
    recent.forEach((s) => { const w = Math.floor((nowTs - s.startAt) / (7 * DAY)); if (w < 4) weeks[3 - w]++; });
    const last14 = sessions.filter((s) => nowTs - s.startAt <= 14 * DAY);
    const planned = plans.reduce((a, p) => a + p.perWeek * 2, 0);
    const adherencePct = planned ? Math.min(100, pct(last14.length, planned)) : null;
    const byAct = {};
    sessions.slice().sort((a, b) => a.startAt - b.startAt).forEach((s) => { (byAct[s.activityId] ||= []).push(s); });
    const perActivity = Object.entries(byAct).map(([id, list]) => {
      const ft = (s) => pct(s.metrics.firstTry, s.metrics.items) || 0;
      const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, s) => a + ft(s), 0) / arr.length) : null);
      const last = list[list.length - 1];
      const ms = list.filter((s) => s.metrics.avgMs).slice(-3);
      return { id, count: list.length, recentPct: avg(list.slice(-3)), prevPct: avg(list.slice(-6, -3)),
        level: last.metrics.endLevel || last.metrics.level, lastAt: last.startAt,
        avgMs: ms.length ? Math.round(ms.reduce((a, s) => a + s.metrics.avgMs, 0) / ms.length) : null };
    });
    const moods = {};
    recent.forEach((s) => { if (s.moodStart) moods[s.moodStart] = (moods[s.moodStart] || 0) + 1; });
    const minutes = Math.round(recent.reduce((a, s) => a + Math.max(0, (s.endAt || s.startAt) - s.startAt), 0) / 60000);
    return { weeks, adherencePct, perActivity, moods, total: recent.length, minutes,
      desafios: recent.filter((s) => s.desafioHecho).length };
  }
  function actName(id) { return (ACTIVITIES.find((a) => a.id === id) || { name: id }).name; }
  return { analyze, actName };
})();

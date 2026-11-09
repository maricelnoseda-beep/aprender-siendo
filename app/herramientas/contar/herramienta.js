"use strict";
Object.assign(Engines, {
  contar(root, { onDone, say, ctx }) {
    return roundEngine(root, {
      rounds: ctx.rounds, onDone, say, ctx,
      render(i, level) {
        const [lo, hi] = [[1, 5], [3, 10], [6, 20]][level - 1];
        const n = lo + Math.floor(Math.random() * (hi - lo + 1));
        const cells = shuffle(Array.from({ length: 25 }, (_, k) => k)).slice(0, n);
        const set = new Set([n]);
        while (set.size < 3) { const d = n + pick([-2, -1, 1, 2]); if (d >= 1) set.add(d); }
        const opts = shuffle([...set]);
        return {
          prompt: "¿Cuántos puntos hay?", speak: "Contá los puntos. ¿Cuántos hay?",
          stage: `<div class="dots" aria-label="grupo de puntos">${Array.from({ length: 25 }, (_, k) => `<span class="${cells.includes(k) ? "dot" : ""}"></span>`).join("")}</div>`,
          options: opts.map((v) => ({ html: `<span class="num">${v}</span>`, aria: String(v) })),
          correct: opts.indexOf(n), hint: "tocá cada punto con el dedo mientras contás."
        };
      }
    });
  },
});

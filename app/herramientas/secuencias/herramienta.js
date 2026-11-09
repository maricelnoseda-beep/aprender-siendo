"use strict";
Object.assign(Engines, {
  secuencias(root, { onDone, say, ctx }) {
    const shapes = ["circulo", "cuadrado", "triangulo", "estrella", "rombo"];
    const cols = Object.keys(Shapes.colors);
    return roundEngine(root, {
      rounds: ctx.rounds, onDone, say, ctx,
      render(i, level) {
        const pool = shuffle(shapes).slice(0, 3).map((s, k) => ({ s, c: cols[k] }));
        const unit = level === 1 ? [pool[0], pool[1]] : level === 2 ? [pool[0], pool[1], pool[2]] : [pool[0], pool[0], pool[1], pool[1]];
        const len = level === 3 ? 7 : 5;
        const seq = Array.from({ length: len + 1 }, (_, k) => unit[k % unit.length]);
        const ans = seq[len];
        const opts = shuffle([ans, ...pool.filter((p) => p !== ans).slice(0, 2)]);
        return {
          prompt: "¿Qué figura sigue?", speak: "Mirá la fila. ¿Qué figura sigue?",
          stage: `<div class="seq">${seq.slice(0, len).map((p) => Shapes.svg(p.s, Shapes.colors[p.c], 52)).join("")}<span class="seq-q" aria-label="lugar vacío">?</span></div>`,
          options: opts.map((p) => ({ html: Shapes.svg(p.s, Shapes.colors[p.c], 64), aria: Shapes.names[p.s] + " " + Shapes.colorNames[p.c] })),
          correct: opts.indexOf(ans), hint: "decí la fila en voz alta desde el principio."
        };
      }
    });
  },
});

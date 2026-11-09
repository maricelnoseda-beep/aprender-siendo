"use strict";
Object.assign(Engines, {
  distinto(root, { onDone, say, ctx }) {
    return roundEngine(root, {
      rounds: ctx.rounds, onDone, say, ctx,
      render(i, level) {
        const n = [3, 4, 5][level - 1];
        let base, odd;
        if (level === 1) { const [a, b] = shuffle(["circulo", "cuadrado", "estrella", "corazon"]); base = { s: a, r: 0 }; odd = { s: b, r: 0 }; }
        else if (level === 2) { const pair = pick([["circulo", "anillo"], ["cuadrado", "rombo"]]); base = { s: pair[0], r: 0 }; odd = { s: pair[1], r: 0 }; }
        else { base = { s: "triangulo", r: 0 }; odd = { s: "triangulo", r: 180 }; }
        const col = Shapes.colors[pick(["verde", "azul", "agua"])];
        const at = Math.floor(Math.random() * n * n);
        const opts = Array.from({ length: n * n }, (_, k) => (k === at ? odd : base));
        return {
          prompt: "Encontrá la figura distinta", speak: "Hay una figura distinta. ¡Encontrala!",
          options: opts.map((o, k) => ({ html: Shapes.svg(o.s, col, n > 4 ? 40 : 52, o.r), aria: "figura " + (k + 1) })),
          correct: at, hint: "mirá fila por fila, despacio.", optClass: "grid-" + n
        };
      }
    });
  },
});

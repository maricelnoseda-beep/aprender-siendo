"use strict";
Object.assign(Engines, {
  clasificar(root, { onDone, say, ctx }) {
    const rounds = ctx.rounds;
    return roundEngine(root, {
      rounds, onDone, say, ctx,
      render(i, level) {
        const rule = level === 1 ? "color" : level === 2 ? "forma" : (i < 3 ? "color" : "forma");
        const shapesPair = ["circulo", "triangulo"], colorsPair = ["verde", "coral"];
        const item = { s: pick(shapesPair), c: pick(colorsPair) };
        const boxes = rule === "color"
          ? colorsPair.map((c) => ({ html: `<span class="swatch" style="background:${Shapes.colors[c]}"></span><span>${Shapes.colorNames[c]}</span>`, aria: "caja " + Shapes.colorNames[c], v: c }))
          : shapesPair.map((s) => ({ html: Shapes.svg(s, "currentColor", 40) + `<span>${Shapes.names[s]}</span>`, aria: "caja " + Shapes.names[s], v: s }));
        const changed = level === 3 && i === 3;
        return {
          prompt: `${changed ? "<strong class='rule-change'>Cambió la regla.</strong> " : ""}Regla: ordená por <strong>${rule}</strong>`,
          speak: (changed ? "Cambió la regla. " : "") + "Ordená por " + rule + ". ¿En qué caja va?",
          stage: `<div class="sort-item">${Shapes.svg(item.s, Shapes.colors[item.c], 88)}</div>`,
          options: boxes, optClass: "boxes", correct: boxes.findIndex((b) => b.v === (rule === "color" ? item.c : item.s)),
          hint: "leé otra vez la regla de arriba."
        };
      }
    });
  },
});

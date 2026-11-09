"use strict";
/* ==========================================================================
   activities.js — Mecánicas de las actividades (demostración)

   Principios aplicados (pedido de NEC-002): consignas claras, desafío gradual
   por nivel, sin castigos ni cuentas regresivas, el error invita a volver a
   intentar, la pista acota opciones pero nunca resuelve por el niño.
   Las mecánicas son genéricas; su uso clínico lo define PSP-SR.
   ========================================================================== */

const Shapes = {
  colors: { verde: "#315F59", agua: "#55867D", coral: "#C8705A", azul: "#476584", ocre: "#B88A2E" },
  svg(shape, color, size = 64, rot = 0) {
    const c = color, s = size;
    const g = {
      circulo: `<circle cx="50" cy="50" r="36" fill="${c}"/>`,
      cuadrado: `<rect x="16" y="16" width="68" height="68" rx="10" fill="${c}"/>`,
      triangulo: `<path d="M50 12 L88 84 L12 84 Z" fill="${c}" stroke="${c}" stroke-width="6" stroke-linejoin="round"/>`,
      estrella: `<path d="M50 8 L61 38 L93 38 L67 57 L77 89 L50 70 L23 89 L33 57 L7 38 L39 38 Z" fill="${c}" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>`,
      rombo: `<path d="M50 8 L90 50 L50 92 L10 50 Z" fill="${c}" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`,
      anillo: `<circle cx="50" cy="50" r="30" fill="none" stroke="${c}" stroke-width="14"/>`,
      corazon: `<path d="M50 86 C20 64 8 46 14 30 C20 14 42 12 50 30 C58 12 80 14 86 30 C92 46 80 64 50 86 Z" fill="${c}"/>`
    }[shape];
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}" aria-hidden="true" style="transform:rotate(${rot}deg)">${g}</svg>`;
  },
  names: { circulo: "círculo", cuadrado: "cuadrado", triangulo: "triángulo", estrella: "estrella", rombo: "rombo", anillo: "anillo", corazon: "corazón" },
  colorNames: { verde: "verde", agua: "verde agua", coral: "coral", azul: "azul", ocre: "ocre" }
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* Motor común de rondas con opciones: maneja intentos, pistas, métricas y el ajuste
   adaptativo por ítem (REQ-CLI-M10). El nivel se pide a ctx.getLevel() antes de cada
   ítem, y cada resultado se informa a ctx.onItem(), que aplica Rules.adapt.
   Devoluciones del banco (M18-2): acierto nombra el proceso; error neutro con pista. */
function roundEngine(root, { rounds, render, onDone, say, ctx }) {
  const m = { items: 0, completed: 0, firstTry: 0, attempts: 0, hints: 0, abandoned: false, floorExit: false, msTotal: 0 };
  let i = 0, forceEasy = false, moreHelp = false;
  const okText = () => pick(ctx.okText.length ? ctx.okText : ["Lo resolviste paso a paso."]);
  const errText = () => pick(ctx.errText.length ? ctx.errText : ["Casi. Mirá otra vez."]);
  function finish() { m.avgMs = m.items ? Math.round(m.msTotal / m.items) : null; onDone(m); }
  function next() {
    if (i >= rounds) return finish();
    let tries = 0, hinted = false;
    const level = forceEasy ? Math.max(1, ctx.getLevel() - 1) : ctx.getLevel();
    const r = render(i, level);
    const t0 = Date.now();
    root.innerHTML = `
      <div class="act-progress" aria-label="Paso ${i + 1} de ${rounds}">${Array.from({ length: rounds }, (_, k) => `<span class="${k < i ? "done" : k === i ? "now" : ""}"></span>`).join("")}</div>
      <div class="act-prompt">${r.prompt}</div>
      <div class="act-stage">${r.stage || ""}</div>
      <div class="act-options ${r.optClass || ""}" role="group" aria-label="Opciones">${r.options.map((o, k) =>
        `<button class="act-opt" data-k="${k}" aria-label="${o.aria}">${o.html}</button>`).join("")}</div>
      <p class="act-msg" role="status" aria-live="polite"></p>
      <div class="act-hint-row"></div>`;
    const msg = root.querySelector(".act-msg");
    const hintRow = root.querySelector(".act-hint-row");
    const giveHint = () => {
      m.hints++; hinted = true;
      // La pista descarta una opción incorrecta; nunca marca la correcta.
      const wrong = [...root.querySelectorAll(".act-opt:not([disabled])")].filter((x) => +x.dataset.k !== r.correct);
      if (wrong.length) { wrong[0].disabled = true; wrong[0].classList.add("faded"); }
      msg.textContent = (r.hint ? "Te doy una pista: " + r.hint : "Una opción ya no está. Mirá las que quedan.");
      say(msg.textContent); hintRow.innerHTML = "";
    };
    if (moreHelp) { moreHelp = false; setTimeout(giveHint, 50); }   // M10-5: la consigna llega con más ayuda
    root.querySelectorAll(".act-opt").forEach((b) => b.addEventListener("click", () => {
      const k = +b.dataset.k; m.attempts++;
      if (k === r.correct) {
        const first = tries === 0;
        if (first) m.firstTry++;
        m.completed++; m.items++; m.msTotal += Date.now() - t0;
        b.classList.add("ok"); const t = okText(); msg.textContent = t; say(t);
        root.querySelectorAll(".act-opt").forEach((x) => (x.disabled = true));
        after({ ok: first, hinted });
      } else {
        tries++; b.classList.add("try"); b.disabled = true; const t = errText(); msg.textContent = t; say(t);
        if (tries === 1) {
          // El primer error ya cuenta para la regla adaptativa: el ítem no fue resuelto al primer intento.
          if (!hintRow.children.length) {
            hintRow.innerHTML = `<button class="btn btn-soft">Quiero una pista</button>`;
            hintRow.firstChild.addEventListener("click", giveHint);
          }
        }
      }
    }));
    say(r.speak || "");
    function after(item) {
      forceEasy = false;
      const res = ctx.onItem(item);
      if (res.action === "bajar" && res.nextEasy) { forceEasy = true; moreHelp = true; }
      else if (res.action === "bajar") moreHelp = true;
      if (res.action === "piso" || res.action === "fuera") { m.floorExit = true; i = rounds; setTimeout(finish, 900); return; }
      i++; setTimeout(next, 900);
    }
    /* Un ítem resuelto tras errores cuenta como no acertado al primer intento (ok:false). */
  }
  next();
  return { abandon() { m.abandoned = true; finish(); } };
}

/* Cada herramienta se registra en su propia carpeta: app/herramientas/<id>/herramienta.js */
const Engines = {};

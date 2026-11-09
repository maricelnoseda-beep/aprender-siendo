"use strict";
Object.assign(Engines, {
  memoria(root, { onDone, say, ctx }) {
    const level = ctx.getLevel();
    const pairs = [3, 4, 6][level - 1];
    const pool = shuffle(["circulo", "cuadrado", "triangulo", "estrella", "rombo", "corazon"]).slice(0, pairs);
    const cols = Object.values(Shapes.colors);
    const cards = shuffle(pool.flatMap((s, k) => [{ s, c: cols[k % cols.length] }, { s, c: cols[k % cols.length] }]));
    const m = { items: pairs, completed: 0, firstTry: 0, attempts: 0, hints: 0, abandoned: false, floorExit: false, msTotal: 0 };
    let open = [], found = new Set(), busy = false, missSince = 0, hintedSince = false, t0 = Date.now();
    root.innerHTML = `
      <div class="act-prompt">Encontrá los pares iguales</div>
      <div class="mem-grid cols-${pairs > 4 ? 4 : 3}">${cards.map((c, k) =>
        `<button class="mem-card" data-k="${k}" aria-label="tarjeta ${k + 1}, boca abajo"><span class="front">${Shapes.svg(c.s, c.c, 56)}</span></button>`).join("")}</div>
      <p class="act-msg" role="status" aria-live="polite"></p>
      <div class="act-hint-row"><button class="btn btn-soft" id="mem-hint">Quiero una pista</button></div>`;
    say("Dá vuelta dos tarjetas. Buscá las que son iguales.");
    const msg = root.querySelector(".act-msg");
    const done = () => { m.avgMs = Math.round(m.msTotal / Math.max(1, m.completed)); onDone(m); };
    root.querySelector("#mem-hint").addEventListener("click", () => {
      if (busy) return; m.hints++; hintedSince = true; busy = true;
      root.querySelectorAll(".mem-card:not(.found)").forEach((b) => b.classList.add("peek"));
      setTimeout(() => { root.querySelectorAll(".mem-card.peek").forEach((b) => b.classList.remove("peek")); busy = false; }, 1200);
    });
    root.querySelectorAll(".mem-card").forEach((b) => b.addEventListener("click", () => {
      const k = +b.dataset.k;
      if (busy || found.has(k) || open.includes(k)) return;
      b.classList.add("open"); b.setAttribute("aria-label", "tarjeta " + (k + 1) + ", " + Shapes.names[cards[k].s]);
      open.push(k);
      if (open.length === 2) {
        m.attempts++;
        const [a, c] = open;
        if (cards[a].s === cards[c].s) {
          found.add(a); found.add(c); m.completed++; m.msTotal += Date.now() - t0; t0 = Date.now();
          const ok = missSince <= 1; if (ok) m.firstTry++;
          ctx.onItem({ ok, hinted: hintedSince });            // el nivel cambia para la próxima sesión (el tablero es fijo)
          missSince = 0; hintedSince = false;
          root.querySelectorAll(`[data-k="${a}"],[data-k="${c}"]`).forEach((x) => x.classList.add("found"));
          const t = pick(ctx.okText); msg.textContent = t; say(t); open = [];
          if (found.size === cards.length) setTimeout(done, 900);
        } else {
          missSince++; busy = true; msg.textContent = pick(ctx.errText);
          setTimeout(() => {
            open.forEach((x) => { const el = root.querySelector(`[data-k="${x}"]`); el.classList.remove("open"); el.setAttribute("aria-label", "tarjeta " + (x + 1) + ", boca abajo"); });
            open = []; busy = false;
          }, 1100);
        }
      }
    }));
    return { abandon() { m.abandoned = true; done(); } };
  }
});

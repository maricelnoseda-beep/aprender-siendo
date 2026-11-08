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

const Engines = {
  /* Isla de Juegos: corre aislada (iframe sin acceso a la app ni a sus datos). Solo recibe
     de vuelta el resultado de cada ronda que el juego avisa por postMessage. */
  isla(root, { onDone, avatarId, ctx }) {
    const m = { items: 0, completed: 0, firstTry: 0, attempts: 0, hints: 0, abandoned: false, floorExit: false, rounds: [] };
    root.innerHTML = `<div class="isla-frame"><iframe title="Isla de Juegos" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe></div>
      <p class="isla-count" aria-live="polite">Todavía no terminaste ninguna ronda.</p>
      <div class="child-actions"><button class="btn btn-primary big" id="isla-done">Terminé de jugar</button></div>`;
    const fr = root.querySelector("iframe");
    /* El amigo del juego es el mismo animalito que eligió en Aprender Siendo. */
    const friend = { pulpo: "🐙", zorro: "🦊", panda: "🐼", rana: "🐸", buho: "🦉", tortuga: "🐢" }[avatarId];
    fr.srcdoc = friend ? ISLA_HTML.replace("avatar:null,", `avatar:${JSON.stringify(friend)},`) : ISLA_HTML;
    const onMsg = (e) => {
      if (e.source !== fr.contentWindow || !e.data || e.data.type !== "isla-ronda") return;
      const d = e.data, total = Math.max(0, Math.min(20, d.total | 0)), first = Math.max(0, Math.min(total, d.first | 0));
      m.items += total; m.completed += total; m.firstTry += first; m.attempts += 1;
      m.rounds.push({ area: String(d.area).slice(0, 8), first, total, level: d.level | 0 });
      root.querySelector(".isla-count").textContent = `Rondas terminadas: ${m.attempts}.`;
    };
    window.addEventListener("message", onMsg);
    const finish = (abandoned) => { window.removeEventListener("message", onMsg); m.abandoned = abandoned || m.attempts === 0; if (!m.items) m.items = 1; onDone(m); };
    root.querySelector("#isla-done").addEventListener("click", () => finish(false));
    return { abandon() { finish(true); } };
  },
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
};

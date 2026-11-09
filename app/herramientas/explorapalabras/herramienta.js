"use strict";
Object.assign(Engines, {
  /* Explorapalabras: corre aislada como la Isla de Juegos (iframe sin acceso a la app ni a sus datos).
     Recibe la Estación y el grado iniciales; devuelve solo el resultado de cada sopa por postMessage.
     No aplica el ajuste automático de dificultad (M10): el grado lo elige la persona adulta y la
     Estación nunca cambia sola (RT-EST-001). */
  explorapalabras(root, { onDone, ctx }) {
    const m = { items: 0, completed: 0, firstTry: 0, attempts: 0, hints: 0, abandoned: false, floorExit: false, rounds: [] };
    const GR = ["facil", "intermedio", "dificil"];
    /* Estación y grado los elige la persona adulta solo en consulta (profesional). En el hogar el juego usa lo último
       que eligió el profesional para esa persona, o Explorar con el grado fijado en su pauta; la familia no ve Estación
       ni grado (tabla 6.12, M08) hasta que PSP-SR resuelva la pregunta P1 de RT-EXP-001. */
    const quien = State.child?.patientId || "-", consulta = State.child?.context === "consulta";
    const memoria = Engines.explorapalabras.ultima || (Engines.explorapalabras.ultima = {});
    const guardada = memoria[quien] || {};
    const inicio = { estacion: guardada.estacion || "explorar", grado: guardada.grado || GR[(ctx.getLevel ? ctx.getLevel() : 1) - 1] || "facil",
      voz: Voice.on !== false, adulto: consulta };
    root.innerHTML = `<div class="isla-frame explora-frame"><iframe title="Explorapalabras" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe></div>
      <p class="isla-count" aria-live="polite">Todavía no terminaste ninguna sopa de letras.</p>
      <div class="child-actions"><button class="btn btn-primary big" id="explora-done">Terminé de jugar</button></div>`;
    const fr = root.querySelector("iframe");
    const json = (t) => t.replace(/</g, "\\u003c");
    const base = "herramientas/explorapalabras/";
    Promise.all([Recursos.texto(base + "explorapalabras.html"), Recursos.texto(base + "banco.json"), Recursos.texto(base + "modulo.json"), Recursos.identidadParaMarco()])
      .then(([html, banco, modulo, marca]) => {
        fr.srcdoc = html.replace("__BRAND_FONT__", () => marca).replace("__BANCO__", () => json(banco))
          .replace("__MODULO__", () => json(modulo)).replace("__INICIO__", () => JSON.stringify(inicio));
      });
    const onMsg = (e) => {
      if (e.source !== fr.contentWindow || !e.data) return;
      const d = e.data;
      if (d.type === "explora-config") { if (consulta) memoria[quien] = { estacion: String(d.estacion).slice(0, 12), grado: String(d.grado).slice(0, 12) }; return; }
      if (d.type !== "explora-sopa") return;
      const total = Math.max(0, Math.min(20, d.palabras | 0)), halladas = Math.max(0, Math.min(total, d.halladas | 0)), pistas = Math.max(0, Math.min(2, d.pistas | 0));
      m.items += total; m.completed += halladas; m.firstTry += Math.max(0, halladas - pistas); m.hints += pistas; m.attempts += 1;
      m.rounds.push({ tematica: String(d.tematica).slice(0, 24), estacion: String(d.estacion).slice(0, 12), grado: String(d.grado).slice(0, 12),
        modo: d.modo === "imagenes" ? "imagenes" : "palabras", letras: d.letras === "minus" ? "minus" : "mayus", total, halladas, pistas, fallidos: Math.max(0, Math.min(999, d.fallidos | 0)), completa: !!d.completa });
      root.querySelector(".isla-count").textContent = `Sopas de letras terminadas: ${m.attempts}.`;
    };
    window.addEventListener("message", onMsg);
    const finish = (abandoned) => { window.removeEventListener("message", onMsg); m.abandoned = abandoned || m.attempts === 0; if (!m.items) m.items = 1; onDone(m); };
    root.querySelector("#explora-done").addEventListener("click", () => finish(false));
    return { abandon() { finish(true); } };
  },
});

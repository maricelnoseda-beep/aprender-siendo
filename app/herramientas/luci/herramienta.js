"use strict";
Object.assign(Engines, {
  /* Aventura de búsqueda con Luci (FEC-013, título de trabajo): corre aislada como la Isla de Juegos (iframe sin acceso a la app
     ni a sus datos). Recibe la ruta de edad (presentación), la variante y el grado iniciales; devuelve por postMessage solo
     el resultado de cada ítem. M10 se aplica adentro, solo entre grados de la variante; la variante nunca cambia sola (EST-05). */
  luci(root, { onDone, ctx }) {
    const m = { items: 0, completed: 0, firstTry: 0, attempts: 0, hints: 0, abandoned: false, floorExit: false, rounds: [] };
    const GR = ["facil", "intermedio", "dificil"];
    /* La variante y el grado los elige el profesional en consulta. En el hogar se usa lo último que eligió para esa persona,
       o Explorar con el grado de su pauta. Quien juega no ve Estación ni grado (EST-09). */
    const c = State.child || {}, quien = c.patientId || "-", consulta = c.context === "consulta";
    const memoria = Engines.luci.ultima || (Engines.luci.ultima = {});
    const guardada = memoria[quien] || {};
    const inicio = { ruta: c.route || "6-8", estacion: guardada.estacion || "explorar", grado: guardada.grado || GR[(ctx.getLevel ? ctx.getLevel() : 1) - 1] || "facil",
      voz: Voice.on !== false, adulto: consulta, profesional: !!c.patientId, luci: new URL(LUMA_IMAGE, document.baseURI).href };
    root.innerHTML = `<div class="isla-frame luci-frame"><iframe title="Aventura de búsqueda con Luci" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe></div>
      <p class="isla-count" aria-live="polite">Todavía no terminaste ninguna búsqueda.</p>
      <div class="child-actions"><button class="btn btn-primary big" id="luci-done">Terminé de jugar</button></div>`;
    const fr = root.querySelector("iframe");
    const json = (t) => t.replace(/</g, "\\u003c");
    const base = "herramientas/luci/";
    Promise.all([Recursos.texto(base + "luci.html"), Recursos.texto(base + "banco.json"), Recursos.texto(base + "modulo.json"), Recursos.identidadParaMarco()])
      .then(([html, banco, modulo, marca]) => {
        fr.srcdoc = html.replace("__BRAND_FONT__", () => marca).replace("__BANCO__", () => json(banco))
          .replace("__MODULO__", () => json(modulo)).replace("__INICIO__", () => json(JSON.stringify(inicio)));
      });
    const corto = (t, n = 16) => String(t || "").slice(0, n);
    const onMsg = (e) => {
      if (e.source !== fr.contentWindow || !e.data) return;
      const d = e.data;
      if (d.type === "luci-config") { if (consulta) memoria[quien] = { estacion: corto(d.estacion, 12), grado: corto(d.grado, 12) }; return; }
      if (d.type === "luci-piso") { m.floorExit = true; return; }
      if (d.type !== "luci-item") return;
      const ayuda = Math.max(0, Math.min(5, d.ayudaMax | 0));
      m.items += 1; m.attempts += 1;
      if (d.acierto) m.completed += 1;
      if (d.acierto && ayuda < 2) m.firstTry += 1;   // REQ-CLI-LUC-08: el paso 1 no cuenta como ayuda
      if (ayuda >= 2) m.hints += 1;
      m.rounds.push({ variante: corto(d.variante, 12), grado: corto(d.grado, 12), lamina: corto(d.lamina, 20), acierto: !!d.acierto,
        senuelos: Math.max(0, Math.min(99, d.senuelos | 0)), ayuda, ms: Math.max(0, Math.min(3600000, +d.ms || 0)), autocorrecciones: Math.max(0, Math.min(20, d.autocorrecciones | 0)) });
      root.querySelector(".isla-count").textContent = `Búsquedas terminadas: ${m.attempts}.`;
    };
    window.addEventListener("message", onMsg);
    const finish = (abandoned) => { window.removeEventListener("message", onMsg); m.abandoned = abandoned || m.attempts === 0; if (!m.items) m.items = 1; onDone(m); };
    root.querySelector("#luci-done").addEventListener("click", () => finish(false));
    return { abandon() { finish(true); } };
  },
});

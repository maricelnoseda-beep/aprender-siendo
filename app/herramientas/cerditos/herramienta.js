"use strict";
Object.assign(Engines, {
  /* «Los tres cerditos» (RT-CER-001): cinco actividades por Estaciones. Corre aislada como la Isla de Juegos (iframe sin acceso
     a la app ni a sus datos) y devuelve por postMessage solo el registro mínimo de cada ejercicio (TC-§3.C). M10 se aplica adentro,
     dentro de cada actividad; la actividad y la Estación nunca cambian solas. Quien juega no ve Estación ni grado. */
  cerditos(root, { onDone, ctx }) {
    const m = { items: 0, completed: 0, firstTry: 0, attempts: 0, hints: 0, abandoned: false, floorExit: false, rounds: [] };
    const GR = ["facil", "intermedio", "dificil"];
    const c = State.child || {}, quien = c.patientId || "-", consulta = c.context === "consulta";
    const memoria = Engines.cerditos.ultima || (Engines.cerditos.ultima = {});
    const guardada = memoria[quien] || {};
    const inicio = { ruta: c.route || "6-8", actividad: guardada.actividad || "detectives", grado: guardada.grado || GR[(ctx.getLevel ? ctx.getLevel() : 1) - 1] || "facil",
      voz: Voice.on !== false, adulto: consulta };
    root.innerHTML = `<div class="isla-frame cerditos-frame"><iframe title="Los tres cerditos" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe></div>
      <p class="isla-count" aria-live="polite">Todavía no terminaste ningún juego.</p>
      <div class="child-actions"><button class="btn btn-primary big" id="cerditos-done">Terminé de jugar</button></div>`;
    const fr = root.querySelector("iframe");
    const json = (t) => t.replace(/</g, "\\u003c");
    const base = "herramientas/cerditos/";
    Promise.all([Recursos.texto(base + "cerditos.html"), Recursos.texto(base + "banco.json"), Recursos.texto(base + "modulo.json"), Recursos.identidadParaMarco()])
      .then(([html, banco, modulo, marca]) => {
        fr.srcdoc = html.replace("__BRAND_FONT__", () => marca).replace("__BANCO__", () => json(banco))
          .replace("__MODULO__", () => json(modulo)).replace("__INICIO__", () => json(JSON.stringify(inicio)));
      });
    const corto = (t, n = 16) => String(t || "").slice(0, n);
    const num = (x, max) => Math.max(0, Math.min(max, Math.round(+x || 0)));
    const onMsg = (e) => {
      if (e.source !== fr.contentWindow || !e.data) return;
      const d = e.data;
      if (d.type === "cerditos-config") { if (consulta) memoria[quien] = { actividad: corto(d.actividad, 14), grado: corto(d.grado, 12) }; return; }
      if (d.type === "cerditos-piso") { m.floorExit = true; return; }
      if (d.type !== "cerditos-item") return;
      const ayuda = num(d.apoyo_max, 3);
      m.items += 1; m.attempts += 1;
      if (d.acierto) m.completed += 1;
      if (d.acierto && ayuda === 0) m.firstTry += 1;
      if (ayuda > 0) m.hints += 1;
      m.rounds.push({ actividad: corto(d.actividad, 14), estacion: corto(d.estacion, 12), grado: corto(d.grado, 12), item: corto(d.item, 20), resultado: corto(d.resultado, 12),
        intentos: num(d.intentos, 999), errores: num(d.errores, 999), apoyo_max: ayuda, autonomia: corto(d.autonomia, 24), lectura: !!d.lectura,
        autocorreccion: !!d.autocorreccion, ms: num(d.ms, 3600000) });
      root.querySelector(".isla-count").textContent = `Juegos terminados: ${m.attempts}.`;
    };
    window.addEventListener("message", onMsg);
    const finish = (abandoned) => { window.removeEventListener("message", onMsg); m.abandoned = abandoned || m.attempts === 0; if (!m.items) m.items = 1; onDone(m); };
    root.querySelector("#cerditos-done").addEventListener("click", () => finish(false));
    return { abandon() { finish(true); } };
  },
});

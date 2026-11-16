"use strict";
Object.assign(Engines, {
  /* «Los cuatro exploradores» (FEC-015 v0.2, RT-CEX-001): ocho retos (diez variantes) de percepción y procesamiento visual. Corre aislada como
     «Los tres cerditos» (iframe sin acceso a la app ni a sus datos) y devuelve por postMessage solo el registro mínimo de cada ejercicio.
     M10 se aplica adentro, por habilidad. Quien juega no ve Estación ni grado. Las piezas del mapa, la historia vista, la letra elegida y los
     grados se recuerdan por persona solo en la memoria de esta sesión del portal. Ningún audio suena solo (pedido de la supervisora). */
  exploradores(root, { onDone, ctx }) {
    const m = { items: 0, completed: 0, firstTry: 0, attempts: 0, hints: 0, abandoned: false, floorExit: false, rounds: [] };
    const c = State.child || {}, quien = c.patientId || "-", consulta = c.context === "consulta";
    const memoria = Engines.exploradores.ultima || (Engines.exploradores.ultima = {});
    const g = memoria[quien] || (memoria[quien] = {});
    const inicio = { ruta: c.route || "6-8", adulto: consulta, letra: g.letra || null, grados: g.grados || {}, piezas: (g.piezas || []).slice(0, 9), historia: !!g.historia, estrategias: (g.estrategias || []).slice(0, 10) };
    root.innerHTML = `<div class="isla-frame cerditos-frame"><iframe title="Los cuatro exploradores" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe></div>
      <p class="isla-count" aria-live="polite">Todavía no terminaste ningún juego.</p>
      <div class="child-actions"><button class="btn btn-primary big" id="exploradores-done">Terminé de jugar</button></div>`;
    const fr = root.querySelector("iframe");
    const json = (t) => t.replace(/</g, "\\u003c");
    const base = "herramientas/exploradores/";
    Promise.all([Recursos.texto(base + "exploradores.html"), Recursos.texto(base + "banco.json"), Recursos.texto(base + "modulo.json"), Recursos.identidadParaMarco()])
      .then(([html, banco, modulo, marca]) => {
        fr.srcdoc = html.replace("__BRAND_FONT__", () => marca).replace("__BANCO__", () => json(banco))
          .replace("__MODULO__", () => json(modulo)).replace("__INICIO__", () => json(JSON.stringify(inicio)));
      });
    const corto = (t, n = 16) => String(t || "").slice(0, n);
    const num = (x, max) => Math.max(0, Math.min(max, Math.round(+x || 0)));
    const VARS = ["objetos", "sombras", "niebla", "jardin", "laberinto", "fabrica", "cofre_cuales", "cofre_orden", "pistas_relampago", "pistas_nuevas"], GR = ["facil", "intermedio", "dificil"];
    const onMsg = (e) => {
      if (e.source !== fr.contentWindow || !e.data) return;
      const d = e.data;
      if (d.type === "exploradores-config") { if (consulta) { g.grados = Object.fromEntries(Object.entries(d.grados || {}).filter(([k, v]) => VARS.includes(k) && GR.includes(v))); } if (d.letra === "mayuscula" || d.letra === "minuscula") g.letra = d.letra; return; }
      if (d.type === "exploradores-letra") { if (d.letra === "mayuscula" || d.letra === "minuscula") g.letra = d.letra; return; }
      if (d.type === "exploradores-historia") { g.historia = true; return; }
      if (d.type === "exploradores-estrategia") { if (VARS.includes(d.variante)) g.estrategias = [...new Set([...(g.estrategias || []), d.variante])]; return; }
      if (d.type === "exploradores-pieza") { const j = num(d.juego, 9); if (j) g.piezas = [...new Set([...(g.piezas || []), j])]; return; }
      if (d.type === "exploradores-piso") { m.floorExit = true; return; }
      if (d.type !== "exploradores-item") return;
      const ayuda = num(d.apoyo_max, 3);
      m.items += 1; m.attempts += 1;
      if (d.acierto) m.completed += 1;
      if (d.acierto && ayuda === 0) m.firstTry += 1;
      if (ayuda > 0) m.hints += 1;
      const x = d.extra || {};
      m.rounds.push({ actividad: corto(d.variante, 18), juego: num(d.juego, 8), estacion: corto(d.estacion, 12), grado: corto(d.grado, 12), item: corto(d.item, 20), resultado: corto(d.resultado, 12),
        habilidad: corto(d.habilidad, 40), intentos: num(d.intentos, 999), errores: num(d.errores, 999), tipos_error: (d.tipos_error || []).slice(0, 12).map((t) => corto(t, 28)),
        apoyo_inicial: num(d.apoyo_inicial, 3), apoyo_max: ayuda, autonomia: corto(d.autonomia, 24), modalidad: corto(d.modalidad, 16), autocorreccion: !!d.autocorreccion, ms: num(d.ms, 3600000),
        extra: { paso_revelado: x.paso_revelado, precision_trazo: x.precision_trazo, salidas: x.salidas, entrada: corto(x.entrada, 8), pantalla: corto(x.pantalla, 8), sin_trazo_fino: !!x.sin_trazo_fino,
          audio_objetivo: !!x.audio_objetivo, exposicion_ms: x.exposicion_ms, sin_exposicion_breve: !!x.sin_exposicion_breve, precision: x.precision, tiempo_respuesta_mediana_ms: x.tiempo_respuesta_mediana_ms, estrategia: corto(x.estrategia, 16) } });
      root.querySelector(".isla-count").textContent = `Juegos terminados: ${m.attempts}.`;
    };
    window.addEventListener("message", onMsg);
    const finish = (abandoned) => { window.removeEventListener("message", onMsg); m.abandoned = abandoned || m.attempts === 0; if (!m.items) m.items = 1; onDone(m); };
    root.querySelector("#exploradores-done").addEventListener("click", () => finish(false));
    return { abandon() { finish(true); } };
  },
});

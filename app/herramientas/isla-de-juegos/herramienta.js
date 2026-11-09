"use strict";
Object.assign(Engines, {
  /* Isla de Juegos: corre aislada (iframe sin acceso a la app ni a sus datos). Solo recibe
     de vuelta el resultado de cada ronda que el juego avisa por postMessage. */
  isla(root, { onDone, avatarId, ctx }) {
    const m = { items: 0, completed: 0, firstTry: 0, attempts: 0, hints: 0, abandoned: false, floorExit: false, rounds: [] };
    root.innerHTML = `<div class="isla-frame"><iframe title="Isla de Juegos" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe></div>
      <p class="isla-count" aria-live="polite">Todavía no terminaste ninguna ronda.</p>
      <div class="child-actions"><button class="btn btn-primary big" id="isla-done">Terminé de jugar</button></div>`;
    const fr = root.querySelector("iframe");
    /* El amigo del juego es el mismo animalito que eligió en Aprender Siendo. */
    const groups = AVATAR_GROUPS.map(({label, animals}) => ({label,
      animals: animals.map((a) => ({ id:a.id, label:a.label, src:new URL(a.faces[0], document.baseURI).href })) }));
    /* El documento del juego y la hoja de identidad se piden recién al abrir la herramienta. */
    Promise.all([Recursos.texto("herramientas/isla-de-juegos/isla.html"), Recursos.identidadParaMarco()]).then(([html, marca]) => {
      fr.srcdoc = html.replace("__BRAND_FONT__", () => marca)
        .replace("__ANIMAL_GROUPS__", () => JSON.stringify(groups))
        .replace("__INITIAL_ANIMAL__", () => JSON.stringify(animalById.has(avatarId) ? avatarId : null));
    });
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
});

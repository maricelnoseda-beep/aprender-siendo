"use strict";
/* ==========================================================================
   Arranque y control de sesión entre pestañas
   ========================================================================== */
(async function boot() {
  Prefs.apply(); Voice.on = !!Prefs.get().voice;
  await Store.init();
  render();
  setInterval(() => {
    Store.reload();
    const c = Store.currentUser();
    if (c && c.id) Store.heartbeat();
    else if (c && (c.kicked || c.expired) && State.view !== "landing") render();
  }, 15000);
  window.addEventListener("storage", (e) => {
    if (e.key !== DB_KEY) return;
    Store.reload();
    const c = Store.currentUser();
    if (c && c.kicked) { State.child = null; notice("Se cerró esta sesión porque tu cuenta se abrió en otro dispositivo o navegador.", "warn"); go("landing"); }
  });
})();

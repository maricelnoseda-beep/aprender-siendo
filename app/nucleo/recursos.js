"use strict";
/* ==========================================================================
   recursos.js — Carga de recursos que no viajan con la página principal.
   En la versión modular se piden al abrir la herramienta que los usa; en la
   versión de un solo archivo (paquete de revisión) vienen incrustados.
   ========================================================================== */
const Recursos = {
  _cache: new Map(),
  /* Texto de un archivo del portal (por ejemplo, el documento de Isla de Juegos). */
  texto(ruta) {
    const inc = window.RECURSOS_INCRUSTADOS;
    if (inc && ruta in inc) return Promise.resolve(inc[ruta]);
    if (!this._cache.has(ruta)) this._cache.set(ruta, fetch(new URL(ruta, document.baseURI)).then((r) => {
      if (!r.ok) throw new Error("No se pudo cargar " + ruta);
      return r.text();
    }));
    return this._cache.get(ruta);
  },
  /* Hoja de identidad (con Nunito y el símbolo) lista para un marco aislado: el marco
     no comparte origen con el portal, así que sus archivos van incrustados. */
  identidadParaMarco() {
    const inline = document.getElementById("brand-font");
    if (inline) return Promise.resolve(inline.textContent);
    if (!this._identidad) {
      const link = document.getElementById("brand-css");
      const base = new URL(link.getAttribute("href"), document.baseURI);
      this._identidad = fetch(base).then((r) => r.text()).then(async (css) => {
        const urls = [...new Set([...css.matchAll(/url\((["']?)([^"')]+)\1\)/g)].map((m) => m[2]).filter((u) => !u.startsWith("data:")))];
        const datos = await Promise.all(urls.map((u) => fetch(new URL(u, base)).then((r) => r.blob()).then((b) => new Promise((ok) => {
          const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b);
        }))));
        urls.forEach((u, i) => { css = css.split(u).join(datos[i]); });
        return css;
      });
    }
    return this._identidad;
  }
};

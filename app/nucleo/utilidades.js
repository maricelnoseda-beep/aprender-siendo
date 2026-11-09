"use strict";
/* ==========================================================================
   app.js — Interfaz de la beta de demostración de Aprender Siendo
   ========================================================================== */

const APP_VERSION = "0.4.0-beta2 (2026-11-08)";
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (t) => new Date(t).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDateTime = (t) => new Date(t).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const dxLabel = (id) => (DIAGNOSIS_CATEGORIES.find((d) => d.id === id) || { label: id }).label;
const moodLabel = (id) => (MOODS.find((m) => m.id === id) || { label: "—" }).label || "—";
const actById = (id) => ACTIVITIES.find((a) => a.id === id);
const roleLabel = { admin: "Administración", profesional: "Profesional", familia: "Familia o responsable" };

const State = { view: "landing", params: {}, pending: null, notice: null, child: null };
const app = () => $("#app");

function go(view, params = {}) { State.view = view; State.params = params; render(); window.scrollTo(0, 0); }
function notice(text, kind = "info") { State.notice = { text, kind }; }

/* ---------- Lectura de voz (opcional, si el navegador la ofrece) ---------- */
const Voice = {
  on: false,
  say(text) {
    if (!this.on || !text || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ""));
      u.lang = "es-AR"; u.rate = 0.92; speechSynthesis.speak(u);
    } catch (e) { /* sin voz disponible */ }
  }
};

/* ---------- Preferencias de lectura (solo comodidad de este navegador) ---------- */
const Prefs = {
  get() { try { return JSON.parse(localStorage.getItem("as_beta_prefs") || "{}"); } catch (e) { return {}; } },
  set(p) { try { localStorage.setItem("as_beta_prefs", JSON.stringify({ ...this.get(), ...p })); } catch (e) {} this.apply(); },
  apply() {
    const p = this.get(), r = document.documentElement;
    if (["atkinson", "manrope"].includes(p.font) && !document.querySelector("#reading-fonts")) {
      const link = document.createElement("link");
      link.id = "reading-fonts"; link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;600;700&family=Manrope:wght@600;700;800&display=swap";
      document.head.append(link);
    }
    r.dataset.size = p.size || "1"; r.dataset.spacing = p.spacing ? "wide" : ""; r.dataset.contrast = p.contrast ? "high" : "";
    r.dataset.line = p.line || ""; r.dataset.letter = p.letter ? "wide" : ""; r.dataset.font = p.font || ""; r.dataset.calm = p.calm ? "on" : "";
    r.dataset.lumaLoop = p.lumaLoop === false ? "off" : "on";
  }
};

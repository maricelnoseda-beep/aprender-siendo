/* avatars.js — Personajes infantiles (busto) con expresión según el ánimo elegido. */
const Avatar = {
  face(kind) {
    const ink = "#24302D", e = (x, y) => `<circle cx="${x}" cy="${y}" r="4.2" fill="${ink}"/>`;
    const st = `stroke="${ink}" stroke-width="3.6" stroke-linecap="round" fill="none"`;
    switch (kind) {
      case "happy": return e(39, 56) + e(61, 56) + `<path d="M38 68 Q50 80 62 68" ${st}/>`;
      case "calm": return `<path d="M34 57 Q39 52 44 57" ${st}/><path d="M56 57 Q61 52 66 57" ${st}/><path d="M42 70 Q50 75 58 70" ${st}/>`;
      case "tired": return `<path d="M34 57 H44" ${st}/><path d="M56 57 H66" ${st}/><path d="M44 72 H56" ${st}/><path d="M72 36 h7 l-7 8 h7" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linejoin="round"/>`;
      case "worried": return `<path d="M33 48 L43 45" ${st}/><path d="M67 48 L57 45" ${st}/>` + e(39, 57) + e(61, 57) + `<path d="M40 72 Q45 68 50 72 Q55 76 60 72" ${st}/>`;
      case "angry": return `<path d="M33 45 L44 50" ${st}/><path d="M67 45 L56 50" ${st}/>` + e(39, 57) + e(61, 57) + `<path d="M41 73 Q50 67 59 73" ${st}/>`;
      case "sad": return e(39, 57) + e(61, 57) + `<path d="M39 75 Q50 65 61 75" ${st}/><path d="M66 62 q3 6 0 9" stroke="#4F7BB0" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      case "unsure": return `<path d="M34 47 Q39 43 44 47" ${st}/>` + e(39, 56) + e(61, 57) + `<path d="M44 72 L58 69" ${st}/>`;
      default: return e(39, 56) + e(61, 56) + `<path d="M42 70 H58" ${st}/>`;
    }
  },
  hair(style, c) {
    const cap = `<path d="M24 52 Q22 18 50 16 Q80 16 77 52 Q70 32 50 30 Q32 31 24 52Z" fill="${c}"/>`;
    return {
      rulos: [24, 36, 50, 64, 76].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 20 : 28}" r="13" fill="${c}"/>`).join(""),
      colita: cap + `<ellipse cx="82" cy="44" rx="9" ry="17" fill="${c}" transform="rotate(-25 82 44)"/>`,
      flequillo: `<path d="M23 54 Q20 16 50 15 Q81 16 77 54 L72 40 Q60 34 48 40 Q36 34 28 42Z" fill="${c}"/>`,
      rodetes: cap + `<circle cx="26" cy="22" r="10" fill="${c}"/><circle cx="74" cy="22" r="10" fill="${c}"/>`,
      largo: cap,
      corto: cap
    }[style] || cap;
  },
  /* El cuerpo se dibuja en 100x100; la cara (pensada para centro 50,60) se reubica sobre la cabeza. */
  svg(avatarId, moodId, size = 96) {
    const a = AVATARS.find((x) => x.id === avatarId) || AVATARS[0];
    const m = MOODS.find((x) => x.id === moodId);
    const back = a.hair === "largo" ? `<path d="M21 46 Q14 80 20 100 H80 Q86 80 79 46Z" fill="${a.hairColor}"/>` : "";
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true" class="av">
      <circle cx="50" cy="50" r="48" fill="${a.bg}"/>
      <clipPath id="avc-${a.id}-${size}"><circle cx="50" cy="50" r="48"/></clipPath>
      <g clip-path="url(#avc-${a.id}-${size})">
        ${back}
        <path d="M10 104 Q12 74 50 72 Q88 74 90 104Z" fill="${a.top}"/>
        <path d="M40 74 Q50 84 60 74" stroke="${a.skin}" stroke-width="8" fill="none" stroke-linecap="round"/>
        <rect x="43" y="58" width="14" height="16" rx="6" fill="${a.skin}"/>
        <circle cx="50" cy="44" r="25" fill="${a.skin}"/>
        ${this.hair(a.hair, a.hairColor)}
        <g transform="translate(50 49) scale(0.7) translate(-50 -60)">${this.face(m ? m.face : "neutral")}</g>
        <circle cx="33" cy="52" r="4" fill="#E07B5F" opacity=".3"/><circle cx="67" cy="52" r="4" fill="#E07B5F" opacity=".3"/>
      </g></svg>`;
  }
};

/* Símbolo de marca: dos figuras adultas que abrazan a una figura infantil sobre una hoja
   (ilustración original, en la línea de la imagen de marca aportada). */
function brandMark(size = 32, mono = false) {
  const c1 = mono ? "currentColor" : "#315F59", c2 = mono ? "currentColor" : "#E07B5F", c3 = mono ? "currentColor" : "#77A9A0", c4 = mono ? "currentColor" : "#8FB8A2";
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true" class="brand-mark">
    <circle cx="24" cy="11" r="6.5" fill="${c1}"/>
    <path d="M9 44 C6 26 16 19 26 20.5 C35 22 40 31 37.5 45 C34.5 35.5 30 30.5 24 30.5 C17 30.5 12 36 9 44Z" fill="${c1}"/>
    <circle cx="46" cy="18" r="5.5" fill="${c3}"/>
    <path d="M38.5 46 C39 34 43 27.5 49 27.5 C55 28 57 36 52 47 C51 40 48.5 36.5 46 36.5 C42.5 36.5 40 41 38.5 46Z" fill="${c3}"/>
    <circle cx="25" cy="36" r="4.6" fill="${c2}"/>
    <path d="M17 52 C17.5 45 21 42.5 25 42.5 C29.5 42.5 33 46 33 52 Z" fill="${c2}"/>
    <path d="M6 50 C20 62 44 62 59 44 C46 53 26 56 6 50Z" fill="${c4}"/>
  </svg>`;
}

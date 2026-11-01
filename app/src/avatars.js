/* avatars.js — Animalitos con expresión según el ánimo elegido. */
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
  /* Animalitos (ilustración original, mismos amigos que "Isla de Juegos"). Cada especie
     tiene detalles propios; la cara cambia según el ánimo elegido. */
  animal(a) {
    const f = a.fur, l = a.light, d = a.dark || f;
    const P = {
      pulpo: {
        body: `<path d="M12 104 C14 86 22 80 26 74 C30 84 34 76 38 72 C42 82 46 74 50 72 C54 82 58 74 62 72 C66 84 70 76 74 74 C78 80 86 86 88 104Z" fill="${f}"/><circle cx="30" cy="88" r="2.4" fill="${l}"/><circle cx="50" cy="90" r="2.4" fill="${l}"/><circle cx="70" cy="88" r="2.4" fill="${l}"/>`,
        back: "", front: `<circle cx="36" cy="28" r="3" fill="${l}"/><circle cx="62" cy="25" r="4" fill="${l}"/><circle cx="68" cy="34" r="2.2" fill="${l}"/>`, nose: "", head: f
      },
      zorro: {
        back: `<path d="M22 36 L24 4 L46 22Z" fill="${f}"/><path d="M78 36 L76 4 L54 22Z" fill="${f}"/><path d="M24 14 L24 4 L32 9Z" fill="${d}"/><path d="M76 14 L76 4 L68 9Z" fill="${d}"/><path d="M28 28 L28 14 L39 23Z" fill="${l}"/><path d="M72 28 L72 14 L61 23Z" fill="${l}"/>`,
        front: `<path d="M23 48 Q36 50 50 64 Q64 50 77 48 Q74 70 50 73 Q26 70 23 48Z" fill="${l}"/>`,
        nose: `<ellipse cx="50" cy="50" rx="2.8" ry="2" fill="${d}"/>`, head: f
      },
      panda: {
        back: `<circle cx="27" cy="23" r="10" fill="${d}"/><circle cx="73" cy="23" r="10" fill="${d}"/>`,
        front: `<ellipse cx="38" cy="47" rx="8" ry="10" fill="${d}" opacity=".28" transform="rotate(20 38 47)"/><ellipse cx="62" cy="47" rx="8" ry="10" fill="${d}" opacity=".28" transform="rotate(-20 62 47)"/>`,
        nose: `<ellipse cx="50" cy="50" rx="2.8" ry="2" fill="${d}"/>`, head: f, stroke: "#C9D6D3", bodyColor: d
      },
      rana: {
        back: `<circle cx="34" cy="24" r="11" fill="${f}"/><circle cx="66" cy="24" r="11" fill="${f}"/><circle cx="34" cy="24" r="6" fill="${l}"/><circle cx="66" cy="24" r="6" fill="${l}"/>`,
        front: "", nose: `<circle cx="46" cy="50" r="1.1" fill="#2E5A2A"/><circle cx="54" cy="50" r="1.1" fill="#2E5A2A"/>`, head: f
      },
      buho: {
        back: `<path d="M26 30 L22 8 L42 22Z" fill="${d}"/><path d="M74 30 L78 8 L58 22Z" fill="${d}"/>`,
        front: `<circle cx="39" cy="46" r="11" fill="${l}"/><circle cx="61" cy="46" r="11" fill="${l}"/>`,
        nose: `<path d="M47 46.5 L53 46.5 L50 51.5Z" fill="#E8A14C"/>`, head: f, bodyExtra: `<path d="M38 82 q4 4 8 0 M54 82 q4 4 8 0 M46 92 q4 4 8 0" stroke="${l}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
      },
      tortuga: {
        body: `<path d="M8 104 Q10 70 50 68 Q90 70 92 104Z" fill="${l}"/><path d="M30 104 L36 84 L50 78 L64 84 L70 104 M36 84 L22 80 M64 84 L78 80" stroke="${d}" stroke-width="2.6" fill="none" stroke-linejoin="round"/>`,
        back: "", front: "", nose: `<circle cx="46" cy="50" r="1.1" fill="${d}"/><circle cx="54" cy="50" r="1.1" fill="${d}"/>`, head: f
      }
    };
    return P[a.species] || P.pulpo;
  },
  svg(avatarId, moodId, size = 96) {
    const a = AVATARS.find((x) => x.id === avatarId) || AVATARS[0];
    const m = MOODS.find((x) => x.id === moodId);
    const p = this.animal(a);
    const uid = `avc-${a.id}-${size}-${Math.random().toString(36).slice(2, 6)}`;
    const body = p.body || `<path d="M14 104 Q16 70 50 68 Q84 70 86 104Z" fill="${p.bodyColor || a.fur}"/><ellipse cx="50" cy="96" rx="18" ry="16" fill="${a.light}" opacity=".9"/>${p.bodyExtra || ""}`;
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true" class="av av-${a.species}">
      <circle cx="50" cy="50" r="48" fill="${a.bg}"/>
      <clipPath id="${uid}"><circle cx="50" cy="50" r="48"/></clipPath>
      <g clip-path="url(#${uid})">
        ${body}
        ${p.back}
        <circle cx="50" cy="46" r="27" fill="${p.head}" ${p.stroke ? `stroke="${p.stroke}" stroke-width="1.5"` : ""}/>
        ${p.front}
        <g transform="translate(50 49) scale(0.7) translate(-50 -60)">${this.face(m ? m.face : "neutral")}</g>
        ${p.nose}
        <circle cx="32" cy="55" r="4" fill="#E07B5F" opacity=".35"/><circle cx="68" cy="55" r="4" fill="#E07B5F" opacity=".35"/>
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

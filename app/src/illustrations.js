/* ==========================================================================
   illustrations.js — Ilustraciones ORIGINALES (SVG propio, sin imágenes de banco)
   Estilo de referencia pedido por la responsable: figuras planas, extremidades
   grandes y expresivas, cabezas chicas, formas decorativas flotantes.
   ========================================================================== */

const Pal = {
  verde: "#315F59", agua: "#77A9A0", aguaInt: "#55867D", salvia: "#DCE9E2", arena: "#E9DFD0",
  coral: "#E07B5F", coralSuave: "#F2B8A2", azul: "#4F7BB0", azulGris: "#A8BCD0", ocre: "#E8B44C",
  rosa: "#F4A7B9", grafito: "#2B3331", crema: "#FBF7F0", lila: "#B9A6D9",
  piel: ["#F3C7A6", "#D99A6C", "#A86B45", "#7A4A2E", "#E8B48F"]
};

/* ---------- Figura humana paramétrica ----------
   Coordenadas locales: 200 x 300, suelo en y=292. */
const POSES = {
  legs: {
    stand: [[88, 168, 84, 230, 80, 284], [112, 168, 116, 230, 120, 284]],
    walk: [[90, 168, 64, 226, 42, 282], [110, 168, 132, 228, 156, 280]],
    stride: [[92, 170, 58, 214, 38, 284], [112, 172, 168, 236, 182, 282]],
    jump: [[90, 168, 66, 210, 58, 252], [110, 168, 140, 200, 150, 246]]
  },
  arms: {
    down: [[74, 100, 52, 142, 58, 182], [126, 100, 148, 142, 142, 182]],
    wave: [[74, 100, 52, 142, 58, 182], [126, 100, 166, 82, 168, 38]],
    up: [[74, 100, 34, 82, 30, 36], [126, 100, 166, 82, 170, 36]],
    open: [[74, 100, 38, 126, 14, 108], [126, 100, 162, 126, 186, 108]],
    hold: [[74, 100, 52, 142, 58, 182], [126, 100, 158, 160, 168, 222]],
    holdL: [[74, 100, 44, 140, 28, 178], [126, 100, 148, 142, 142, 182]],
    belly: [[74, 100, 26, 122, 82, 152], [126, 100, 174, 122, 118, 152]],
    clipboard: [[74, 100, 52, 142, 58, 182], [126, 100, 150, 140, 118, 132]]
  }
};

function figure(o) {
  const {
    x = 0, y = 0, s = 1, flip = false, skin = Pal.piel[0], hair = Pal.grafito, hairStyle = "short",
    top = Pal.azul, bottom = Pal.grafito, shoe = Pal.grafito, legs = "stand", arms = "down",
    child = false, overall = false, stripes = null, face = true, prop = null
  } = o;
  const L = POSES.legs[legs], A = POSES.arms[arms];
  const legW = child ? 30 : 34, armW = child ? 22 : 26;
  const hr = child ? 22 : 16;         // cabeza: más grande en niños
  const hx = 100, hy = child ? 56 : 58;
  const limb = (p, w, c) => `<path d="M${p[0]} ${p[1]} Q${p[2]} ${p[3]} ${p[4]} ${p[5]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  const shoeAt = (p, dir) => `<ellipse cx="${p[4] + dir * 8}" cy="${p[5] + 4}" rx="${child ? 15 : 18}" ry="${child ? 8 : 9}" fill="${shoe}"/>`;
  const hand = (p) => `<circle cx="${p[4]}" cy="${p[5]}" r="${child ? 8 : 9}" fill="${skin}"/>`;
  let stripeDefs = "";
  let topFill = top;
  if (stripes) {
    const id = "st" + Math.random().toString(36).slice(2, 7);
    stripeDefs = `<defs><pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${top}"/><rect width="14" height="5" fill="${stripes}"/></pattern></defs>`;
    topFill = `url(#${id})`;
  }
  const hairBack = {
    long: `<path d="M${hx - hr - 4} ${hy - 4} Q${hx - hr - 10} ${hy + 60} ${hx - hr + 2} ${hy + 92} L${hx + hr - 2} ${hy + 92} Q${hx + hr + 10} ${hy + 60} ${hx + hr + 4} ${hy - 4} Z" fill="${hair}"/>`,
    pony: `<ellipse cx="${hx + hr + 6}" cy="${hy + 6}" rx="9" ry="18" fill="${hair}" transform="rotate(-20 ${hx + hr + 6} ${hy + 6})"/>`
  }[hairStyle] || "";
  const cap = `<path d="M${hx - hr - 1} ${hy + 3} Q${hx - hr - 2} ${hy - hr - 8} ${hx} ${hy - hr - 5} Q${hx + hr + 4} ${hy - hr - 6} ${hx + hr + 1} ${hy - 1} Q${hx + 4} ${hy - hr * 0.55} ${hx - hr - 1} ${hy + 3}Z" fill="${hair}"/>`;
  const hairFront = {
    short: cap,
    long: cap,
    pony: cap,
    bun: cap + `<circle cx="${hx}" cy="${hy - hr - 8}" r="${hr * 0.5}" fill="${hair}"/>`,
    curly: [-1, -0.55, 0, 0.55, 1].map((k, i) => `<circle cx="${hx + k * hr}" cy="${hy - hr * (i % 2 ? 0.85 : 0.55)}" r="${hr * 0.5}" fill="${hair}"/>`).join(""),
    buns: cap + `<circle cx="${hx - hr}" cy="${hy - hr + 2}" r="${hr * 0.42}" fill="${hair}"/><circle cx="${hx + hr}" cy="${hy - hr + 2}" r="${hr * 0.42}" fill="${hair}"/>`,
    bald: ""
  }[hairStyle] || cap;
  const faceSvg = face ? `<circle cx="${hx - hr * 0.36}" cy="${hy + 2}" r="${child ? 2.4 : 2}" fill="${Pal.grafito}"/><circle cx="${hx + hr * 0.36}" cy="${hy + 2}" r="${child ? 2.4 : 2}" fill="${Pal.grafito}"/><path d="M${hx - hr * 0.3} ${hy + hr * 0.42} Q${hx} ${hy + hr * 0.7} ${hx + hr * 0.3} ${hy + hr * 0.42}" stroke="${Pal.grafito}" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="${hx - hr * 0.62}" cy="${hy + hr * 0.38}" r="${hr * 0.16}" fill="${Pal.coral}" opacity=".35"/><circle cx="${hx + hr * 0.62}" cy="${hy + hr * 0.38}" r="${hr * 0.16}" fill="${Pal.coral}" opacity=".35"/>` : "";
  const torso = `<path d="M66 94 Q100 80 134 94 Q144 130 138 168 Q100 186 62 168 Q56 130 66 94Z" fill="${topFill}"/>`;
  const bib = overall ? `<path d="M80 118 H120 V170 H80 Z" fill="${bottom}"/><path d="M80 120 L74 92 M120 120 L126 92" stroke="${bottom}" stroke-width="7" stroke-linecap="round"/><circle cx="86" cy="126" r="3" fill="${Pal.ocre}"/><circle cx="114" cy="126" r="3" fill="${Pal.ocre}"/>` : "";
  const props = {
    clipboard: `<g transform="rotate(-8 118 132)"><rect x="98" y="112" width="34" height="44" rx="5" fill="${Pal.crema}" stroke="${Pal.verde}" stroke-width="3"/><rect x="108" y="108" width="14" height="8" rx="2" fill="${Pal.verde}"/><path d="M104 126 h22 M104 134 h22 M104 142 h14" stroke="${Pal.agua}" stroke-width="3" stroke-linecap="round"/></g>`,
    book: `<g transform="rotate(10 150 140)"><path d="M126 128 L150 134 L174 128 L174 158 L150 164 L126 158Z" fill="${Pal.ocre}"/><path d="M150 134 V164" stroke="${Pal.grafito}" stroke-width="2"/></g>`,
    star: `<path d="M168 22 l5 11 12 2 -9 8 2 12 -10 -6 -10 6 2 -12 -9 -8 12 -2z" fill="${Pal.ocre}"/>`
  };
  const g = `${stripeDefs}${hairBack}
    ${limb(L[0], legW, bottom)}${limb(L[1], legW, bottom)}${shoeAt(L[0], -1)}${shoeAt(L[1], 1)}
    ${torso}${bib}
    ${limb(A[0], armW, topFill)}${limb(A[1], armW, topFill)}${hand(A[0])}${hand(A[1])}
    <rect x="${hx - 6}" y="${hy + hr - 6}" width="12" height="16" rx="5" fill="${skin}"/>
    <circle cx="${hx}" cy="${hy}" r="${hr}" fill="${skin}"/>${hairFront}${faceSvg}${prop ? props[prop] : ""}`;
  const tf = `translate(${x} ${y}) scale(${flip ? -s : s} ${s})${flip ? " translate(-200 0)" : ""}`;
  return `<g transform="${tf}">${g}</g>`;
}

/* ---------- Formas decorativas ---------- */
const Deco = {
  circle: (x, y, r, c, op = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${op}"/>`,
  cloud: (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M10 40 Q0 40 2 30 Q4 20 16 22 Q20 6 38 8 Q54 8 58 22 Q74 20 76 32 Q78 42 66 42 Z" fill="${c}"/>`,
  squiggle: (x, y, s, c, w = 6) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 10 Q10 0 20 10 T40 10 T60 10 T80 10" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`,
  tri: (x, y, s, c, rot = 0) => `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" d="M0 -10 L9 7 L-9 7Z" fill="${c}"/>`,
  dots: (x, y, c) => [0, 1, 2].map((i) => `<circle cx="${x + i * 12}" cy="${y}" r="3.2" fill="${c}"/>`).join(""),
  lines: (x, y, c) => `<path d="M${x} ${y} l18 -10 M${x + 6} ${y + 10} l18 -10" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  leaf: (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 30 C20 -4 70 -6 100 10 C70 26 30 40 0 30Z" fill="${c}"/>`,
  hill: (w, h, c) => `<path d="M0 ${h} C${w * 0.25} ${h - 60} ${w * 0.6} ${h - 10} ${w} ${h - 50} V${h} Z" fill="${c}"/>`
};

/* ---------- Escenas ---------- */
const Scenes = {
  hero() {
    return `<svg viewBox="0 0 620 460" role="img" aria-label="Ilustración: una profesional, una familia y dos chicos aprendiendo juntos" class="scene">
      ${Deco.circle(470, 70, 46, Pal.ocre, .9)}${Deco.cloud(70, 40, 1.4, Pal.salvia)}${Deco.cloud(380, 120, .9, Pal.azulGris)}
      ${Deco.squiggle(40, 190, .9, Pal.verde)}${Deco.tri(560, 200, 1.4, Pal.coral, 15)}${Deco.dots(250, 40, Pal.agua)}${Deco.lines(560, 270, Pal.verde)}
      ${Deco.circle(140, 150, 9, Pal.rosa)}${Deco.circle(590, 120, 7, Pal.agua)}
      ${Deco.hill(620, 460, Pal.salvia)}
      ${figure({ x: 16, y: 108, s: 1.1, skin: Pal.piel[1], hair: Pal.grafito, hairStyle: "bun", top: Pal.verde, bottom: Pal.azulGris, shoe: Pal.grafito, legs: "stand", arms: "clipboard", prop: "clipboard" })}
      ${figure({ x: 210, y: 92, s: 1.18, skin: Pal.piel[0], hair: "#7A4A2E", hairStyle: "long", top: Pal.coral, bottom: Pal.verde, shoe: Pal.grafito, legs: "walk", arms: "hold" })}
      ${figure({ x: 386, y: 217, s: .78, child: true, skin: Pal.piel[0], hair: Pal.ocre, hairStyle: "buns", top: Pal.ocre, stripes: Pal.crema, bottom: Pal.azul, shoe: Pal.coral, legs: "walk", arms: "holdL", overall: true })}
      ${figure({ x: 478, y: 236, s: .7, child: true, skin: Pal.piel[3], hair: Pal.grafito, hairStyle: "curly", top: Pal.azul, bottom: Pal.grafito, shoe: Pal.ocre, legs: "jump", arms: "up", prop: "star" })}
    </svg>`;
  },
  family(size = 160) {
    return `<svg viewBox="0 0 260 260" width="${size}" height="${size}" aria-hidden="true">
      ${Deco.circle(196, 60, 34, Pal.coralSuave)}${Deco.squiggle(14, 30, .6, Pal.agua, 7)}
      ${figure({ x: 0, y: -24, s: .9, skin: Pal.piel[4], hair: Pal.grafito, hairStyle: "short", top: Pal.aguaInt, bottom: Pal.grafito, legs: "walk", arms: "hold" })}
      ${figure({ x: 134, y: 64, s: .6, child: true, skin: Pal.piel[4], hair: "#7A4A2E", hairStyle: "pony", top: Pal.rosa, bottom: Pal.azul, shoe: Pal.coral, legs: "walk", arms: "holdL" })}
    </svg>`;
  },
  professional(size = 160) {
    return `<svg viewBox="0 0 260 260" width="${size}" height="${size}" aria-hidden="true">
      ${Deco.circle(60, 70, 36, Pal.salvia)}${Deco.tri(220, 50, 1.4, Pal.ocre, -12)}${Deco.dots(186, 220, Pal.coral)}
      ${figure({ x: 30, y: -36, s: .96, skin: Pal.piel[2], hair: Pal.grafito, hairStyle: "bun", top: Pal.verde, bottom: Pal.azulGris, legs: "stand", arms: "clipboard", prop: "clipboard" })}
    </svg>`;
  },
  admin(size = 160) {
    return `<svg viewBox="0 0 260 260" width="${size}" height="${size}" aria-hidden="true">
      ${Deco.cloud(150, 30, 1.1, Pal.azulGris)}${Deco.squiggle(10, 220, .7, Pal.verde, 7)}
      ${figure({ x: 30, y: -36, s: .96, skin: Pal.piel[1], hair: "#3B2A20", hairStyle: "short", top: Pal.azul, bottom: Pal.grafito, legs: "stride", arms: "belly" })}
    </svg>`;
  },
  childCheer(size = 170) {
    return `<svg viewBox="0 0 240 260" width="${size}" height="${size * 260 / 240}" aria-hidden="true">
      ${Deco.circle(40, 50, 14, Pal.ocre)}${Deco.circle(206, 40, 10, Pal.rosa)}${Deco.tri(200, 120, 1.3, Pal.coral, 20)}${Deco.lines(20, 140, Pal.agua)}
      ${figure({ x: 34, y: 34, s: .78, child: true, skin: Pal.piel[1], hair: Pal.grafito, hairStyle: "curly", top: Pal.ocre, stripes: Pal.crema, bottom: Pal.azul, shoe: Pal.coral, legs: "jump", arms: "up", prop: "star" })}
    </svg>`;
  },
  empty(size = 140) {
    return `<svg viewBox="0 0 220 200" width="${size}" height="${size * 200 / 220}" aria-hidden="true">
      ${Deco.circle(110, 110, 80, Pal.salvia)}${Deco.cloud(130, 20, .8, Pal.azulGris)}
      ${figure({ x: 46, y: 6, s: .64, child: true, skin: Pal.piel[0], hair: Pal.coral, hairStyle: "long", top: Pal.agua, bottom: Pal.verde, legs: "stand", arms: "wave" })}
    </svg>`;
  }
};

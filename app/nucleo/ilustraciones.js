"use strict";
/* ==========================================================================
   illustrations.js — Ilustraciones ORIGINALES (SVG propio, sin imágenes de banco)
   Estilo de referencia pedido por la responsable: figuras planas, extremidades
   grandes y expresivas, cabezas chicas, formas decorativas flotantes.
   ========================================================================== */

const Pal = {
  verde: "#183D55", agua: "#64C8B8", aguaInt: "#178C95", salvia: "#D9EFE7", arena: "#F6E7CE",
  coral: "#F58060", coralSuave: "#FFD6C2", azul: "#437DA7", azulGris: "#B3CCDA", ocre: "#FFB52D",
  rosa: "#BE91C7", grafito: "#162E4E", crema: "#FCFAF7", lila: "#B788C6",
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
    return `<svg class="scene garden-story" viewBox="0 0 620 445" role="img" aria-label="Un libro se abre, de sus páginas crecen flores y una mariposa levanta vuelo.">
  <defs>
    <pattern id="paper-grain" width="17" height="15" patternUnits="userSpaceOnUse"><circle cx="2" cy="4" r=".75" fill="#17475b" opacity=".18"/><circle cx="12" cy="10" r=".8" fill="#fff" opacity=".58"/></pattern>
    <g id="daisy"><g fill="#fff5da" stroke="#e9ab3d" stroke-width="1.15"><ellipse cy="-9" rx="5.4" ry="9"/><ellipse cy="-9" rx="5.4" ry="9" transform="rotate(60)"/><ellipse cy="-9" rx="5.4" ry="9" transform="rotate(120)"/><ellipse cy="-9" rx="5.4" ry="9" transform="rotate(180)"/><ellipse cy="-9" rx="5.4" ry="9" transform="rotate(240)"/><ellipse cy="-9" rx="5.4" ry="9" transform="rotate(300)"/></g><circle r="6.5" fill="#ffb72f"/><circle cx="-1.8" cy="-1.8" r="1.4" fill="#a36522"/></g>
    <g id="book-spark" fill="#f5ac24"><path d="M0 -10 Q1 -2 8 0 Q1 1 0 10 Q-2 2 -8 0 Q-2 -2 0 -10Z"/></g>
    <g id="wing"><path d="M0 0 C-8 -21 -39 -48 -52 -37 C-68 -20 -50 1 -19 7 C-45 4 -46 22 -33 28 C-18 35 -3 17 0 4Z" fill="#ff9859" stroke="#16364c" stroke-width="2.8"/><path d="M-52 -37 C-67 -18 -51 1 -30 4 Q-39 -4 -35 -10 Q-40 -14 -39 -19 Q-48 -25 -46 -39Z" fill="#15334b"/><path d="M-39 18 Q-44 26 -31 29 Q-21 31 -12 20 Q-24 25 -23 19 Q-31 24 -32 16Z" fill="#193a53"/><path d="M-3 1 Q-19 -9 -39 -19 M-2 2 Q-20 -15 -28 -30 M-3 5 Q-24 8 -34 17" fill="none" stroke="#9b523b" stroke-width="1.8" stroke-linecap="round"/><g fill="#fff4cb"><ellipse cx="-48" cy="-24" rx="2.7" ry="4" transform="rotate(-24 -48 -24)"/><circle cx="-45" cy="-13" r="2.2"/><circle cx="-38" cy="-6" r="1.6"/></g></g>
  </defs>
  <!-- A paper landscape behind the pop-up book. -->
  <path d="M43 302 C-1 231 65 157 128 130 C195 100 173 48 265 40 C349 30 380 74 441 63 C539 44 591 94 582 174 C579 218 619 248 593 313 C564 379 471 386 356 385 C228 388 94 385 43 302Z" fill="#d9efeb"/>
  <path d="M43 302 C-1 231 65 157 128 130 C195 100 173 48 265 40 C349 30 380 74 441 63 C539 44 591 94 582 174 C579 218 619 248 593 313 C564 379 471 386 356 385 C228 388 94 385 43 302Z" fill="url(#paper-grain)"/>
  <g fill="#fffaf0"><path d="M80 183 Q82 175 92 176 Q94 162 107 161 Q121 160 126 173 Q138 169 145 181 Q148 185 141 185 H83Z"/><path d="M459 126 Q462 119 470 120 Q474 109 484 110 Q494 109 498 120 Q506 119 511 125 Q514 128 510 129 H461Z"/></g>
  <g class="story-sun" transform="translate(211 121)"><circle r="41" fill="#ffbd3c"/><circle r="41" fill="url(#paper-grain)"/><g stroke="#f8b23b" stroke-width="4" stroke-linecap="round"><path d="M0 -53l-1 -9 M-28 -45l-5 -8 M-46 -28l-7 -5 M-54 -2l-8 -1 M28 -45l6 -9 M47 -27l9 -5"/></g></g>
  <path d="M60 303 Q133 211 207 260 Q249 286 306 244 Q411 159 493 232 Q525 263 579 248 Q633 337 492 363 Q237 408 60 303Z" fill="#b4dfd1"/>
  <g fill="none" stroke="#82c5b7" stroke-width="2.5" stroke-linecap="round"><path d="M77 282q7 -7 13 -9 M92 284q6 -7 11 -8 M506 249q6 -9 12 -12 M520 250q3 -7 9 -10 M529 261q5 -5 9 -6"/></g>
  <ellipse cx="318" cy="362" rx="205" ry="18" fill="#10455c" opacity=".1"/>
  <g class="story-book">
    <path d="M78 320 L142 250 Q228 234 291 282 Q361 235 493 246 L554 323 Q557 328 550 331 L337 390 Q321 395 311 386 L81 332 Q72 330 78 320Z" fill="#11465c" stroke="#162f4e" stroke-width="3" stroke-linejoin="round"/>
    <path d="M83 324 L310 379 Q322 389 338 383 L549 324" fill="none" stroke="#57b8b2" stroke-width="4" stroke-linecap="round"/>
    <path d="M86 314 L143 245 Q223 232 291 278 Q375 236 491 237 L545 316 L539 324 Q429 328 332 378 Q318 384 309 374 Q215 324 88 324Z" fill="#efcca3" stroke="#264659" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M87 316 Q207 303 314 369 Q324 376 335 370 Q423 325 538 315 M96 319 Q211 311 306 368 M355 367 Q447 326 532 322" fill="none" stroke="#bb977b" stroke-width="1.5"/>
    <path d="M88 313 L143 242 Q228 230 291 276 L323 369 Q226 302 88 313Z" fill="#fff5da" stroke="#294857" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M291 276 Q360 223 485 233 L540 311 Q419 308 323 369Z" fill="#fffbeb" stroke="#294857" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M143 242 Q232 238 292 278 L318 351 Q229 280 102 301Z" fill="#f8e7be"/>
    <path d="M295 276 Q372 231 479 236 L524 298 Q414 293 322 353Z" fill="#f7e9c8"/>
    <path d="M377 346 Q390 341 401 337 L416 360 L404 358 L397 367Z" fill="#ed745b" stroke="#ae564d" stroke-width="1.2"/>
    <g fill="none" stroke="#c9b28a" stroke-width="2" stroke-linecap="round"><path d="M122 293q39 -2 66 5 M117 300q28 -2 47 2 M458 286q26 -3 43 -1 M469 292q22 -2 33 -1 M358 326q28 -13 44 -18"/></g>
  </g>
  <g class="story-garden">
    <path d="M139 283 Q161 258 186 269 Q196 248 226 256 Q261 224 292 249 Q323 200 356 224 Q392 196 420 231 Q452 219 470 245 L487 273 Q406 278 326 329 Q241 285 139 283Z" fill="#79c6af"/>
    <path d="M139 283 Q160 265 184 276 Q203 259 225 268 Q242 254 266 270 L326 329 Q248 292 139 283Z" fill="#46a99d"/>
    <path d="M328 328 Q339 281 381 265 Q406 253 411 239 Q436 231 456 245 Q464 255 478 254 L487 273 Q406 278 328 328Z" fill="#4ba99e"/>
    <path d="M354 239 C342 258 301 257 295 272 C292 281 320 287 315 299 Q312 306 300 315 L326 329 Q351 307 345 295 C338 282 308 279 319 269 Q325 263 340 257 Q357 249 357 237Z" fill="#ffe0a0"/>
    <g fill="none" stroke="#247f7b" stroke-width="2" stroke-linecap="round"><path d="M195 278l3 -6 M200 280l5 -6 M262 271l3 -8 M268 270l4 -6 M376 286l3 -8 M381 285l5 -7 M456 265l3 -6"/></g>
    <g transform="translate(226 278)"><g class="story-stem stem-small"><path d="M0 0 Q-12 -51 -43 -86" fill="none" stroke="#296e70" stroke-width="4" stroke-linecap="round"/><path d="M-9 -28 Q-43 -25 -54 -52 Q-25 -55 -9 -28Z" fill="#5db8a5"/><path d="M-18 -47 Q-21 -80 -1 -91 Q4 -59 -18 -47Z" fill="#197e82"/><path d="M-30 -67 Q-62 -63 -72 -90 Q-45 -94 -30 -67Z" fill="#15888d"/><path d="M-44 -85 Q-61 -104 -56 -122 Q-33 -109 -44 -85Z" fill="#6bc7ba"/></g></g>
    <g transform="translate(375 268)"><g class="story-stem stem-tall"><path d="M0 0 Q4 -67 47 -129" fill="none" stroke="#205667" stroke-width="5" stroke-linecap="round"/><path d="M6 -35 Q-32 -45 -42 -85 Q-7 -81 6 -35Z" fill="#378e87"/><path d="M17 -67 Q43 -98 77 -91 Q60 -59 17 -67Z" fill="#4da99b"/><path d="M29 -96 Q7 -109 9 -139 Q35 -128 29 -96Z" fill="#77c4aa"/><path d="M43 -119 Q47 -147 76 -158 Q81 -129 43 -119Z" fill="#1e827d"/><path d="M4 -38 Q-15 -60 -32 -75 M22 -71 Q48 -82 62 -84 M46 -123l23 -23" fill="none" stroke="#205667" stroke-width="1.6" stroke-linecap="round"/></g></g>
    <g transform="translate(272 267)"><g class="story-stem stem-flower"><path d="M0 0 Q-3 -28 -19 -46 M-3 -16 Q5 -34 14 -39 M-7 -25 Q-22 -27 -28 -37" fill="none" stroke="#487f70" stroke-width="3.5" stroke-linecap="round"/><use href="#daisy" transform="translate(-20 -49)"/><use href="#daisy" transform="translate(16 -41) scale(.65)"/></g></g>
    <g transform="translate(411 264)"><path d="M0 0 q9 -18 15 -25" fill="none" stroke="#32796f" stroke-width="3"/><use href="#daisy" transform="translate(17 -27) scale(.55)"/></g>
    <g fill="#e2a3cf"><circle cx="201" cy="262" r="3.2"/><circle cx="208" cy="258" r="3"/><circle cx="213" cy="263" r="3.5"/></g>
  </g>
  <path class="story-trail" d="M268 203 C224 168 280 148 299 182 C315 206 269 215 280 178 Q291 144 332 126" fill="none" stroke="#518e90" stroke-width="2.7" stroke-linecap="round" stroke-dasharray="2 7"/>
  <g transform="translate(349 109) rotate(-16)"><g class="story-flight"><g class="story-wings"><use href="#wing"/><use href="#wing" transform="scale(-1 1)"/></g><path d="M0 -4 C-3 -18 -7 -18 -8 -19 M1 -4 Q4 -18 10 -18" fill="none" stroke="#17364a" stroke-width="2" stroke-linecap="round"/><ellipse cy="6" rx="3.6" ry="15" fill="#17364a"/><circle cy="-6" r="4.4" fill="#17364a"/></g></g>
  <g class="story-sparks"><use href="#book-spark" transform="translate(280 99) scale(.75)"/><use href="#book-spark" transform="translate(383 61) scale(.7)"/><use href="#book-spark" transform="translate(154 175) scale(.65)"/></g>
</svg>`;
  },
  family(size = 160) {
    return `<img class="role-illustration" alt="" width="${size}" height="${Math.round(size * 471 / 760)}" src="@@asset:nucleo/imagenes/escenas/familia.webp@@">`;
  },
  professional(size = 160, portrait = "") {
    if (portrait === "masculino") return `<img class="role-illustration" alt="" width="${size}" height="${Math.round(size * 516 / 760)}" src="@@asset:nucleo/imagenes/escenas/profesional-masculino.webp@@">`;
    return `<img class="role-illustration" alt="" width="${size}" height="${Math.round(size * 517 / 760)}" src="@@asset:nucleo/imagenes/escenas/profesional-femenino.webp@@">`;
  },
  admin(size = 160) {
    return `<img class="role-illustration" alt="" width="${size}" height="${Math.round(size * 520 / 708)}" src="@@asset:nucleo/imagenes/escenas/administracion.webp@@">`;
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

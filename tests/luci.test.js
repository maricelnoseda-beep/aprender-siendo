// Aventura de Luci (FEC-013): prueba del motor, de la ficha y de las reglas, sin navegador.
// Cubre REQ-CLI-LUC-00a, 01 (control previo automático), 02, 03, 04, 05, 07, 08, 09, 10, 11 y los casos 1, 4, 5 (forma), 6, 7 (con scripts/originalidad.py), 10 y 12.
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.join(__dirname, '..', 'app', 'herramientas', 'luci');
const html = fs.readFileSync(path.join(dir, 'luci.html'), 'utf8');
const banco = JSON.parse(fs.readFileSync(path.join(dir, 'banco.json'), 'utf8'));
const modulo = JSON.parse(fs.readFileSync(path.join(dir, 'modulo.json'), 'utf8'));
const motorJs = html.match(/<script id="motor">([\s\S]*?)<\/script>/)[1];
const dibujoJs = html.match(/<script id="dibujo">([\s\S]*?)<\/script>/)[1];
const interfazJs = html.match(/<script id="interfaz">([\s\S]*?)<\/script>/)[1];
const ctx = { module: { exports: {} } }; vm.runInNewContext(motorJs, ctx);
const M = ctx.module.exports;
const ctx2 = { module: { exports: {} } }; vm.runInNewContext(dibujoJs, ctx2);
const D = ctx2.module.exports.Dibujo;
let fallas = 0, casos = 0;
const must = (c, m) => { casos++; if (!c) { fallas++; if (fallas < 40) console.error('FALLA:', m); } };

const EST = ['explorar', 'reconocer', 'integrar', 'transferir'], GR = ['facil', 'intermedio', 'dificil'];
const CERRADA = ['cantidad-estimulos', 'complejidad-consignas', 'extension-palabras', 'cantidad-pasos', 'grado-abstraccion', 'complejidad-relaciones', 'necesidad-planificacion', 'disponibilidad-apoyos'];
const PROPUESTAS = Object.keys(modulo.vocabulario_dimensiones_propuesto).filter((k) => !k.startsWith('_'));
const V = modulo.estaciones.variantes;

// ---- REQ-CLI-LUC-02: cada paso de grado declara al menos una dimensión distinta de cantidad-estimulos ----
must(JSON.stringify(V.map((v) => v.estacion)) === JSON.stringify(EST), 'las cuatro variantes en orden');
for (const v of V) {
  must(JSON.stringify(Object.keys(v.grados)) === JSON.stringify(GR), `${v.estacion}: los tres grados`);
  for (const g of ['intermedio', 'dificil']) {
    const d = v.grados[g].cambia_respecto_al_anterior || [];
    must(d.some((x) => x !== 'cantidad-estimulos'), `${v.estacion}/${g}: el paso de grado solo cambia la cantidad (REQ-CLI-LUC-02)`);
    must(d.every((x) => CERRADA.includes(x) || PROPUESTAS.includes(x)), `${v.estacion}/${g}: dimensión fuera del vocabulario`);
  }
  must(PROPUESTAS.every((p) => p !== 'cantidad-estimulos'), 'el vocabulario propuesto no redefine la cantidad');
  // REQ-CLI-LUC-11: campos de la ficha por variante (EST-08)
  for (const c of ['estacion', 'habilidades', 'grados', 'apoyos', 'modalidad_respuesta', 'adaptaciones', 'progresion', 'transferencia', 'dimensiones_que_cambian'])
    must(v[c] && (typeof v[c] === 'string' || v[c].length || Object.keys(v[c]).length), `${v.estacion}: falta ${c} (REQ-CLI-LUC-11)`);
  must(v.modalidad_respuesta.length === 1 && v.modalidad_respuesta[0] === 'tocar', `${v.estacion}: respuesta solo por toque (T01)`);
}
// REQ-CLI-LUC-11: campos de M04-1
const F = modulo.ficha;
for (const c of ['habilidad', 'para_que_sirve', 'edad', 'nivel_evidencia', 'fuentes', 'ficha_biblioteca', 'declaracion_transferencia', 'dosis_sugerida', 'fecha_verificacion', 'autor'])
  must(F[c] && (typeof F[c] === 'string' ? F[c].length : Object.keys(F[c]).length), `ficha: falta ${c} (M04-1)`);
must('revisor_clinico' in F, 'ficha: existe el campo revisor clínico');
must(F.nivel_evidencia === 'C' && F.rotulo_evidencia === 'Basada en práctica clínica, con evidencia limitada', 'nivel C rotulado (M04-3)');
must(F.fuentes.every((f) => /^(DOI 10\.|PMID \d|https:\/\/)/.test(f)), 'fuentes con DOI, PMID o URL oficial');
// Puerta de publicación: sin revisor clínico ni revisión de láminas, nada se publica (lo verifica el pipeline).
const publicable = F.revisor_clinico && banco.laminas.every((l) => l.estado === 'aprobada');
must(!publicable && modulo.estado.startsWith('borrador'), 'el prototipo no es publicable');

// ---- REQ-CLI-LUC-09: catálogo por ruta ----
const r35 = M.variantesDeRuta(modulo, '3-5').map((c) => c.estacion);
must(r35.includes('explorar') && r35.includes('reconocer') && !r35.includes('transferir') && !r35.includes('integrar'), 'ruta 3–5: solo E1 y E2 hasta la decisión P3');
must(M.conversarEnRuta(modulo, '3-5') && !M.conversarEnRuta(modulo, '6-8'), 'Lámina para conversar solo en 3–5');
for (const r of ['6-8', '9-12', '13-18']) must(M.variantesDeRuta(modulo, r).length === 4, `ruta ${r}: cuatro variantes`);
must(M.estiloDeRuta(modulo, '13-18') === 'editorial' && modulo.rutas['13-18'].luci === 'marca', '13–18: estética editorial y marca de Luci (REQ-CLI-LUC-06)');
must(modulo.rutas['3-5'].toque_min_px >= 44 && Object.values(modulo.rutas).every((r) => r.toque_min_px >= 24), 'zona de toque mínima 24 px (44 en 3–5)');

// ---- Banco: rotulado, láminas por variante, grado y estilo ----
must(banco.estado === 'Contenido de prueba no validado', 'el banco está rotulado como contenido de prueba');
for (const v of EST) for (const g of GR) for (const e of ['infantil', 'editorial'])
  must(M.laminasDe(banco, v, g, e).length >= 6, `${v}/${g}/${e}: al menos 6 láminas (P5)`);
for (const l of banco.laminas) {
  must(l.revision && 'parecido_obras_protegidas' in l.revision && 'escala_de_grises' in l.revision && 'contenido_M03_4_A14' in l.revision && 'revisor' in l.revision, `${l.id}: registro de revisión humana`);
  must(l.origen && l.version, `${l.id}: origen (herramienta usada) y versión (REQ-CLI-LUC-00c)`);
  if (l.estado === 'aprobada') must(l.revision.revisor && l.revision.fecha && l.revision.parecido_obras_protegidas === 'sin-hallazgos' && l.revision.escala_de_grises === 'ok' && l.revision.contenido_M03_4_A14 === 'ok' && l.revision.revisor !== l.autor, `${l.id}: aprobada sin revisión completa o revisada por quien la dibujó (criterio de aceptación de la sección 0)`);
}
// E4: escenas de un tipo que no aparece en otras variantes (situaciones nuevas)
const fondosE4 = new Set(banco.laminas.filter((l) => l.variante === 'transferir').map((l) => l.fondo));
const fondosOtros = new Set(banco.laminas.filter((l) => l.variante !== 'transferir').map((l) => l.fondo));
must([...fondosE4].every((f) => !fondosOtros.has(f)), 'Transferir usa escenas que no aparecen en las otras variantes');

// ---- Sección 0 (REQ-CLI-LUC-00a): rasgos y roles prohibidos, sin tramas ni rayas ----
const prohibidos = modulo.originalidad.rasgos_prohibidos.concat(modulo.originalidad.roles_prohibidos);
for (const [id, o] of Object.entries(banco.objetos)) {
  for (const campo of ['rasgos', 'apoyos']) for (const r of (o[campo] || [])) must(!prohibidos.includes(r), `${id}: rasgo prohibido ${r}`);
  must(!prohibidos.includes(o.forma) && !prohibidos.includes(o.categoria) && !prohibidos.includes(id), `${id}: forma o rol prohibido`);
  must(!/perro|mago|gemel|pomp[oó]n|raya/i.test(id + o.nombre + o.forma), `${id}: nombre o forma que evoca rasgos prohibidos`);
}
must(!/<pattern|repeating-(linear|radial)-gradient/i.test(html), 'sin tramas repetidas (rayas) en las láminas');
// Paleta: ningún rojo puro en el dibujo (las rayas rojas y blancas no pueden armarse con la paleta)
const hex = [...new Set((dibujoJs.match(/#[0-9A-Fa-f]{6}\b/g) || []).map((h) => h.toUpperCase()))];
const tono = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return { h: 0, s: 0 };
  const d = mx - mn; let hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; if (hh < 0) hh += 360; return { h: hh, s: d / mx }; };
for (const h of hex) { const t = tono(h); must(!(t.s > 0.55 && (t.h < 8 || t.h > 345)), `color rojo puro en el dibujo: ${h}`); }

// ---- REQ-CLI-LUC-04, 05 y 10: textos del banco ----
const textos = JSON.stringify(banco.textos) + JSON.stringify(modulo.ficha);
must(!/misi[oó]n/i.test(textos + html), 'nunca "misión" (beta 2, 1)');
must(!/\b(dislexia|tdah|tea\b|autismo|discalculia|déficit|trastorno)/i.test(JSON.stringify(banco.textos)), 'sin categorías diagnósticas en textos para personas (T06)');
must(!/inteligente|genio|¡mal!|fallaste|incorrecto/i.test(JSON.stringify(banco.textos)), 'sin elogios a la persona ni "mal" (M18-2, REQ-CLI-LUC-05)');
must(!/mejora(r|rá)? (la|tu) (atenci|lectura|rendimiento)|entren(a|á) (la|tu) atenci|gimnasia/i.test(textos.replace(F.declaracion_transferencia.B, '').replace(F.no_es, '').replace(F.texto_profesional, '')), 'ningún texto promete mejoras (REQ-CLI-LUC-04)');
must(F.declaracion_transferencia.B && F.declaracion_transferencia.transferir, 'declaración de transferencia por variante');
must(!/\bnivel\b/i.test(JSON.stringify(banco.textos)), 'la palabra "nivel" no aparece en textos para el chico (REQ-CLI-LUC-10)');
must(!/racha|moneda|estrella acumul|ranking|puntaje|puntos/i.test(JSON.stringify(banco.textos)), 'sin rachas, monedas ni puntajes (T04)');
// T01 / caso 10: sin campos de texto libre, audio, cámara ni archivos para quien juega (las casillas son solo de la pantalla adulta)
must(!/<textarea|contenteditable|type="(text|file|search)"|getUserMedia|MediaRecorder|FileReader/i.test(interfazJs), 'sin forma de ingresar texto, audio o imagen (T01, A13)');
// REQ-CLI-LUC-03: sin reloj ni cuenta regresiva
must(!/cuenta regresiva|setInterval|reloj/i.test(interfazJs), 'sin reloj ni cuenta regresiva');
// REQ-CLI-LUC-07: sin animaciones ni sonidos de fondo en la escena
must(!/<animate|@keyframes|new Audio|<audio/i.test(html), 'escena estática, sin sonidos de fondo');
// Caso 12: la Lámina para conversar no registra nada
const conv = interfazJs.match(/function pConversar\(\) \{([\s\S]*?)\n\}/)[1];
must(!/avisar|postMessage|localStorage/.test(conv), 'Lámina para conversar: no se registra ningún dato');
must(!/localStorage|sessionStorage|indexedDB|document\.cookie/.test(interfazJs), 'el juego no guarda datos en el dispositivo');

// ---- Composición de cada lámina (REQ-CLI-LUC-01 control previo, semejanza y pistas) ----
const choca = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
for (const l of banco.laminas) for (let vuelta = 0; vuelta < 4; vuelta++) {
  const id = `${l.id}#${vuelta}`;
  const e = M.componer(l, banco, modulo, { vuelta });
  for (const el of e.elementos) must(el.x >= 0 && el.y >= 0 && el.x + el.w <= 1200 && el.y + el.h <= 800, `${id}: ${el.obj} fuera de la escena`);
  const luci = e.elementos.find((x) => x.forma === 'luciernaga' || x.forma === 'gota-en-cuadro');
  // Ningún elemento comparte a la vez la forma y el color de Luci; su forma es única (se distingue en grises).
  must(e.elementos.filter((x) => x.forma === 'luciernaga' || x.forma === 'gota-en-cuadro').length <= 1, `${id}: la forma de Luci no es única`);
  if (l.variante === 'conversar') { must(!e.objetivos.length, `${id}: la lámina para conversar no tiene objetivos`); continue; }
  if (l.variante === 'explorar') {
    must(luci && e.objetivos[0] === luci.uid, `${id}: Luci es el objetivo`);
    const mismoColor = e.elementos.filter((x) => x !== luci && x.color === 'sol' && x.rol !== 'objetivo2');
    if (l.grado === 'facil') must(mismoColor.length === 0, `${id}: en Fácil ningún elemento comparte el color de Luci`);
    else must(mismoColor.length >= 3, `${id}: en ${l.grado} hay señuelos del color de Luci (${mismoColor.length})`);
    if (l.grado === 'dificil') must(e.objetivos.length === 2 && e.elementos.find((x) => x.uid === e.objetivos[1]).forma === 'farolito', `${id}: dos pasos, Luci y el farolito`);
    must(e.elementos.length >= modulo.estaciones.variantes[0].grados[l.grado].parametros.elementos * 0.85, `${id}: muy pocos elementos (${e.elementos.length})`);
  }
  for (const uid of e.objetivos) {
    const t = e.elementos.find((x) => x.uid === uid);
    for (const o of e.elementos) if (o !== t) must(!choca(t, o), `${id}: el objetivo ${t.obj} se superpone con ${o.obj}`);
  }
  if (l.variante === 'reconocer') {
    const t = e.elementos.find((x) => x.uid === e.objetivos[0]);
    must(e.objetivos.length === 1, `${id}: un objetivo`);
    const misma = e.elementos.filter((x) => x !== t && x.forma === t.forma);
    if (l.grado === 'facil') must(misma.length === 0 && t.marca, `${id}: en Fácil no hay otro de la misma categoría`);
    if (l.grado === 'intermedio') must(misma.length >= 3 && t.marca && misma.every((x) => !x.marca), `${id}: señuelos de la misma categoría sin la gota (${misma.length})`);
    if (l.grado === 'dificil') {
      must(misma.length >= 3, `${id}: señuelos con otro atributo (${misma.length})`);
      if (e.atributo === 'mochila-abierta') must(t.attrs.abierta && misma.every((x) => !x.attrs.abierta), `${id}: una sola mochila abierta`);
      if (e.atributo === 'taza-chica') must(misma.every((x) => x.w * x.h > t.w * t.h), `${id}: la taza objetivo es la más chica`);
      if (e.atributo === 'farolito-arriba') { const b = e.elementos.find((x) => x.uid === t.attrs.arribaDe); must(b && t.y + t.h <= b.y + 2 && t.x >= b.x && t.x + t.w <= b.x + b.w, `${id}: el farolito está arriba del banco`);
        must(misma.every((x) => !x.attrs.arribaDe), `${id}: los otros farolitos no están arriba`); }
    }
  }
  if (l.variante === 'integrar') {
    if (e.lista) {
      must(e.lista.length === 3 && e.objetivos.length === 3, `${id}: lista de 3`);
      for (const k of e.lista) must(e.elementos.filter((x) => x.forma === banco.objetos[k].forma).length === 1, `${id}: ${k} aparece una sola vez`);
      must(!!e.zonas4 === (l.grado === 'facil'), `${id}: zonas dibujadas solo en Fácil`);
    } else {
      const R = e.regla, cats = e.elementos.filter((x) => banco.objetos[x.obj].usos.includes(R.uso));
      must(cats.length === e.objetivos.length && cats.length >= 4, `${id}: cosas de la categoría (${cats.length})`);
      const conM = cats.filter((x) => banco.objetos[x.obj].material === R.material);
      must(conM.length >= 3 && cats.length > conM.length, `${id}: el cambio de regla se puede resolver`);
    }
  }
  if (l.variante === 'transferir') {
    must(e.pistas, `${id}: no se pudieron armar pistas`); if (!e.pistas) continue;
    const p = e.p, P = e.pistas.lista;
    must(P.length === p.pistas, `${id}: cantidad de pistas`);
    must(P.filter((c) => c.negar).length === p.negativas, `${id}: pistas negativas`);
    must(P.filter((c) => c.inferencia).length === p.inferencias, `${id}: pistas de inferencia`);
    must(M.lugaresPosibles(e, P.length).length === 1 && M.lugaresPosibles(e, P.length)[0] === e.objetivo, `${id}: las pistas dejan un solo lugar`);
    for (let k = 0; k < P.length; k++) must(e.lugares.filter((x) => M.cumple(x, P[k])).length > 1, `${id}: una pista sola alcanza`);
    for (const x of e.lugares) must(x.w > 0 && x.h > 0, `${id}: lugar sin zona`);
    if (l.grado === 'facil') must(M.lugaresPosibles(e, 1).length > 1, `${id}: con una sola pista no alcanza`);
  }
  // Dibujo sin errores
  const svg = D.escena(e, { banco });
  must(typeof svg === 'string' && svg.length > 200 && !/undefined|NaN/.test(svg), `${id}: el dibujo tiene valores inválidos`);
}

// ---- Zonas de toque (WCAG 2.5.8) ----
const el = { x: 500, y: 300, w: 10, h: 10 };
for (const px of [0.25, 0.5, 1, 2]) for (const min of [24, 44]) {
  const z = M.zonaDeToque(el, px, min);
  must(z.w * px >= min && z.h * px >= min, `zona de toque menor que ${min} px con escala ${px}`);
}
const e0 = M.componer(banco.laminas.find((l) => l.variante === 'explorar' && l.grado === 'facil'), banco, modulo);
const t0 = e0.elementos.find((x) => x.uid === e0.objetivos[0]);
must(M.queSeToco(e0, { x: t0.x + t0.w / 2, y: t0.y + t0.h / 2 }, 0.5, 24).uid === t0.uid, 'tocar el centro de Luci la encuentra');
must(M.queSeToco(e0, { x: t0.x - 8, y: t0.y + t0.h / 2 }, 0.5, 24).uid === t0.uid, 'tocar al lado de Luci (tolerancia) la encuentra');

// ---- REQ-CLI-LUC-08: escalera de ayudas ----
must(!M.cuentaComoAyuda(1, modulo) && [2, 3, 4, 5].every((p) => M.cuentaComoAyuda(p, modulo)), 'el paso 1 no cuenta como ayuda; 2 a 5 sí');
must(!M.cuentaComoAyuda(0, modulo), 'sin ayuda no cuenta');

// ---- M10 (casos 1 y 6) ----
const it = (acierto, conAyuda, ms = 3000) => ({ acierto, conAyuda, ms });
must(M.ajusteM10([it(1, 0), it(1, 0), it(1, 0), it(1, 0)], 'facil', { m10: modulo.m10 }).grado === 'facil', 'M10-2: sin ajuste con menos de 5 ítems');
must(M.ajusteM10(Array(6).fill(it(1, 0)), 'facil', { m10: modulo.m10 }).grado === 'intermedio', 'M10-3: sube con 85 % y sin ayuda');
must(M.ajusteM10(Array(6).fill(it(1, 1)), 'facil', { m10: modulo.m10 }).grado === 'facil', 'M10-3: no sube si casi todo fue con ayuda');
must(M.ajusteM10(Array(6).fill(it(1, 0)), 'facil', { m10: modulo.m10, yaSubio: true }).grado === 'facil', 'M10-3: un paso por sesión');
must(M.ajusteM10(Array(6).fill(it(1, 0)), 'facil', { m10: modulo.m10, fijo: true }).grado === 'facil', 'M10-9: el profesional fija el grado');
must(M.ajusteM10(Array(6).fill(it(1, 0)), 'facil', { m10: modulo.m10, checkinEstandar: false }).grado === 'facil', 'M10-8: no sube si el check-in no fue estándar');
must(M.ajusteM10([it(1, 0), it(0, 0), it(0, 0), it(0, 1), it(1, 0)], 'intermedio', { m10: modulo.m10 }).grado === 'facil', 'M10-5: baja con menos de 60 %');
must(M.ajusteM10([], 'dificil', { m10: modulo.m10, erroresSeguidos: 3 }).grado === 'intermedio', 'M10-5: 3 errores seguidos bajan un paso');
const piso = M.ajusteM10([], 'facil', { m10: modulo.m10, erroresSeguidos: 3 });
must(piso.grado === 'facil' && piso.masAyuda, 'caso 1: en Fácil, 3 errores dan un ítem con más ayuda');
must(M.ajusteM10(Array(8).fill(it(1, 0, 120000)), 'intermedio', { m10: modulo.m10 }).grado === 'dificil', 'caso 6: respuestas lentas y correctas no bajan el grado (M10-7)');
must(!/\bms\b/.test(M.ajusteM10.toString()), 'M10 no usa el tiempo de respuesta');

// ---- Caso 4: cambio de variante nunca automático ----
const ses = (dia) => ({ variante: 'reconocer', grado: 'dificil', sostenido: true, dia });
must(M.sugerenciaDeEstacion([ses('2026-11-01'), ses('2026-11-01'), ses('2026-11-02')], 'reconocer', modulo, false) === null, 'caso 4: 3 sesiones el mismo día no alcanzan');
const sug = M.sugerenciaDeEstacion([ses('2026-11-01'), ses('2026-11-02'), ses('2026-11-03')], 'reconocer', modulo, false);
must(sug && sug.texto === 'Hay aventuras nuevas para probar' && sug.cambiaSola === false, 'caso 4: modo libre sugiere, no cambia');
must(M.sugerenciaDeEstacion([ses('2026-11-01'), ses('2026-11-02'), ses('2026-11-03')], 'reconocer', modulo, true).texto === 'Revisar cambio de Estación', 'con profesional: Revisar cambio de Estación');
must(!/S\.estacion\s*=(?!=)(?!\s*(b\.dataset|catalogo))/.test(interfazJs), 'el juego nunca cambia la variante por su cuenta');

console.log(`luci: ${casos} comprobaciones, ${fallas} fallas, ${banco.laminas.length} láminas × 4 vueltas`);
process.exit(fallas ? 1 : 0);

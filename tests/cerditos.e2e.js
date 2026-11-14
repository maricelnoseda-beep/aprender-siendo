// «Los tres cerditos» (FEC-014 v0.2, RT-CER-001 v1.3): prueba de punta a punta sobre el archivo suelto (python3 app/build.py --cerditos).
// Juega cada actividad y grado publicados en cada ruta y recorre los casos de prueba de la FEC (§10) que se pueden probar en pantalla.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const archivo = 'file://' + path.resolve(__dirname, '..', 'app', 'dist-cerditos', 'Los_tres_cerditos.html');
const S_DIR = process.env.CAPTURAS || path.resolve(__dirname, '..', 'app', 'dist-cerditos', 'capturas');
fs.mkdirSync(S_DIR, { recursive: true });
let fallas = 0; const must = (c, m) => { if (!c) { fallas++; console.error('FALLA:', m); } };
const PROHIBIDO_NINO = /Estación|Fácil|Intermedio|Difícil|\bnivel\b|misión|salvemos|vag[oa]\b|tont[oa]\b|¡Muy bien!|genial|inteligente|puntaje|puntos|fallaste|¡mal!/i;
const PROHIBIDO_35 = /\bolla|\bcola\b|fuego|herid|lastim|se quem[oó]/i;
const modulo = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'app', 'herramientas', 'cerditos', 'modulo.json'), 'utf8'));
const GR = ['facil', 'intermedio', 'dificil'];
const ultimo = (p) => p.evaluate(() => S.registros[S.registros.length - 1]);
const item = (p) => p.evaluate(() => S.item);

/* Persona adulta: edad, actividad, grado y apoyo. La primera vez se narra el cuento, lámina por lámina (REQ-CLI-CER-03). */
async function configurar(p, ruta, act, gr, o = {}) {
  await p.goto(archivo); await p.waitForSelector('#a-seguir');
  await p.click(`[data-ruta="${ruta}"]`); await p.click(`[data-act="${act}"]`); await p.click(`[data-gr="${gr}"]`);
  if (o.apoyo !== undefined) await p.click(`[data-apoyo="${o.apoyo}"]`);
  if (o.fijo !== false) await p.check('#a-fijo');
  await p.click('#a-seguir');
  const laminas = await escucharCuento(p);
  await p.waitForSelector('#d-empezar'); await p.click('#d-empezar');
  await p.waitForSelector('#ayuda, [data-plan]');
  return laminas;
}
async function escucharCuento(p) {
  await p.waitForSelector('[data-lamina]');
  const vistas = [];
  for (;;) {
    vistas.push({ escena: await p.getAttribute('[data-lamina]', 'data-lamina'), texto: await p.textContent('#cu-texto'), guia: !!(await p.$('#cu-guia')), html: await p.innerHTML('[data-lamina]') });
    if (!(await p.$('#cu-siguiente'))) break;
    await p.click('#cu-siguiente');
  }
  await p.click('#cu-fin');
  return vistas;
}
async function ubicarTodo(p) {
  const n = await p.evaluate(() => document.querySelectorAll('[data-ran]').length);
  for (let k = 0; k < n; k++) if (await p.$(`[data-ficha="${k}"]`)) { await p.click(`[data-ficha="${k}"]`); await p.click(`[data-ran="${k}"]`); }
}
async function resolver(p, act) {
  const it = await item(p);
  if (act === 'detectives') { if (await p.$('#ya-mire')) await p.click('#ya-mire'); for (const o of it.objetivos) { await p.focus(`#escena [data-el="${o}"]`); await p.keyboard.press('Enter'); } }
  if (act === 'memotest') { await p.click('#ya-mire'); for (let i = 0; i < it.parejas.length; i++) { await p.click(`[data-carta="${i}a"]`); await p.click(`[data-carta="${i}b"]`); } }
  if (act === 'escena_frase') {
    for (const e of it.escenas) { await p.click(`[data-frase="${e}"]`); await p.click(`[data-dest="${e}"]`); }
    await p.waitForSelector('[data-ran]'); await ubicarTodo(p);
    if (it.justificacion) { await p.waitForSelector('[data-just]'); await p.click(`[data-just="${it.justificacion.opciones.findIndex((o) => o.ok)}"]`); }
  }
  if (act === 'rompecabezas') {
    if (await p.$('[data-plan]')) await p.click('[data-plan="bordes"]');
    if (await p.$('#r-ya')) await p.click('#r-ya');
    await ubicarTodo(p);
  }
  if (act === 'ayudemos') {
    const adecuada = (ops) => ops.find((o) => o.clase === 'adecuada').id;
    if (it.plan) {
      await p.click(`[data-op="${adecuada(it.plan.opciones)}"]`); await p.click('#s-seguir');
      const el = adecuada(it.imprevisto.opciones); await p.click(`[data-op="${el}"]`); await p.click('#s-seguir');
      await p.click(`[data-just="${it.justificacion.opciones.findIndex((o) => (o.clase || {})[el] === 'adecuada')}"]`);
    } else {
      await p.click(`[data-op="${adecuada(it.opciones)}"]`); await p.click('#s-seguir');
      for (const s of it.pasos.orden) await p.click(`[data-paso="${s.id}"]`);
    }
  }
  await p.waitForSelector('#j-seguir');
}
async function arrastrar(p, desde, hasta) {
  const a = await p.$eval(desde, (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const b = await p.$eval(hasta, (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(a.x + 20, a.y + 20, { steps: 3 }); await p.mouse.move(b.x, b.y, { steps: 6 }); await p.mouse.up();
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errores = []; p.on('pageerror', (e) => errores.push(String(e))); p.on('console', (m) => m.type() === 'error' && errores.push(m.text()));

  // ---------- Pantalla de la persona adulta y catálogo por ruta (REQ-CLI-CER-04, casos 2 y 2b) ----------
  await p.goto(archivo); await p.waitForSelector('#a-seguir');
  must(/Contenido de prueba no validado/.test(await p.textContent('body')), 'rótulo de contenido de prueba');
  must(!(await p.$eval('[data-ruta="3-5"]', (x) => x.disabled)), 'la ruta 3–5 está disponible (D5)');
  must(await p.$eval('[data-ruta="13-18"]', (x) => x.disabled), 'caso 2b: la ruta 13–18 no se puede elegir (D7)');
  await p.click('[data-ruta="3-5"]');
  must(await p.$eval('[data-act="ayudemos"]', (x) => x.disabled), 'caso 2: en 3–5 la Act. 5 no se puede elegir');
  await p.click('[data-act="escena_frase"]');
  must(await p.$eval('[data-gr="intermedio"]', (x) => x.disabled) && await p.$eval('[data-gr="dificil"]', (x) => x.disabled), 'caso 2: Act. 3 solo en Fácil en 3–5');
  await p.screenshot({ path: S_DIR + '/01-adulto-3-5.png', fullPage: true });

  // ---------- Cada actividad y grado publicados en cada ruta, sin errores ni ayudas → autónomo ----------
  for (const ruta of ['3-5', '6-8', '9-12']) for (const act of Object.keys(modulo.rutas[ruta].actividades)) for (const gr of modulo.rutas[ruta].actividades[act]) {
    const laminas = await configurar(p, ruta, act, gr);
    if (act === 'detectives' && gr === 'facil') {
      // Caso 1 y REQ-03/04: el cuento antes del primer ítem, con el final de la ruta
      const fin = laminas[laminas.length - 2];
      if (ruta === '3-5') {
        must(fin.escena === 'lobo-lejos' && !PROHIBIDO_35.test(laminas.map((l) => l.texto).join(' ')), `caso 1: final 3–5 sin olla ni lesión (${fin.escena})`);
        must(!/data-fig="casa|data-fig="cerdito/.test(fin.html) && laminas[laminas.length - 1].guia, 'D5: lámina final 3–5 sin casa ni cerditos; guía para la persona adulta');
      } else must(fin.escena === 'chimenea' && /se quemó la cola/.test(fin.texto), `${ruta}: final 6–12 (D2)`);
      for (const l of laminas.filter((x) => /sopla|lobo/.test(x.escena))) must(!/data-fig="cerdito|data-fig="tres/.test(l.html), `D2: ningún cerdito en ${l.escena}`);
    }
    must(!PROHIBIDO_NINO.test(await p.textContent('#app')), `${ruta}/${act}/${gr}: quien juega no ve Estación, grado ni palabras prohibidas (REQ-15)`);
    if (ruta !== '9-12') await p.screenshot({ path: `${S_DIR}/${ruta}-${act}-${gr}.png`, fullPage: true });
    await resolver(p, act);
    must(!PROHIBIDO_NINO.test(await p.textContent('#app')), `${ruta}/${act}/${gr}: devolución sin elogios a la persona`);
    const r = await ultimo(p);
    must(r && r.actividad === act && r.grado === gr && r.errores === 0 && r.apoyo_max === 0 && r.autonomia === 'autonomo', `${ruta}/${act}/${gr}: registro autónomo ${JSON.stringify(r)}`);
    must(['correcto', 'adecuada'].includes(r.resultado) && r.habilidad, `${ruta}/${act}/${gr}: resultado ${r.resultado} y habilidad ${r.habilidad}`);
    if (act === 'escena_frase') must(r.etapas.asociar.resultado === 'correcto' && r.etapas.ordenar.resultado === 'correcto' && r.etapas.asociar.habilidad && r.etapas.ordenar.habilidad === 'secuenciacion-narrativa', 'REQ-06: dos etapas con su habilidad');
    if (act === 'escena_frase' && gr === 'dificil') must(r.etapas.justificacion.primera === 'adecuada', 'REQ-07: justificación por dibujos');
    // El cuento no se repite en el ítem siguiente de la misma actividad
    await p.click('#j-seguir'); must(!(await p.$('[data-lamina]')), `${ruta}/${act}: el cuento no se repite en el ítem siguiente`);
  }

  // ---------- Caso 5: pista temporal visible en la Act. 3 Fácil ----------
  await configurar(p, '6-8', 'escena_frase', 'facil');
  must((await p.$$('.esc-card [data-momento]')).length === 4, 'caso 5: cada escena tiene una pista temporal visible');
  // 3–5: frases en audio, sin texto para leer
  await configurar(p, '3-5', 'escena_frase', 'facil');
  { const it = await item(p), txt = await p.textContent('#app'); must(!Object.values(it.frases).some((f) => txt.includes(f)) && /Frase 1/.test(txt), '3–5: las frases van en audio'); }

  // ---------- Caso 4 y REQ-06: asociación con errores → se muestran las correctas y se ordena con ellas ----------
  await configurar(p, '6-8', 'escena_frase', 'intermedio');
  { const it = await item(p), [e0, e1] = it.escenas;
    await p.click(`[data-frase="${e0}"]`); await p.click(`[data-dest="${e1}"]`); await p.click(`[data-dest="${it.escenas[2]}"]`); await p.click(`[data-dest="${e0}"]`);
    for (const e of it.escenas) { if (!(await p.$(`[data-frase="${e}"]`))) continue; await p.click(`[data-frase="${e}"]`); await p.click(`[data-dest="${e}"]`); }
    await p.waitForSelector('#f-asi'); must(/Así van juntas\. Ahora las ordenamos\./.test(await p.textContent('#f-asi')), 'caso 4: frase neutra y parejas correctas');
    await p.screenshot({ path: S_DIR + '/20-asi-van-juntas.png', fullPage: true });
    await p.click('#f-ordenar'); await ubicarTodo(p); await p.waitForSelector('#j-seguir');
    const r = await ultimo(p);
    must(r.etapas.asociar.errores === 2 && r.etapas.asociar.resultado === 'incorrecto' && r.etapas.ordenar.errores === 0 && r.etapas.ordenar.resultado === 'correcto', `caso 4: dos resultados separados ${JSON.stringify(r.etapas)}`); }

  // ---------- Apoyos 0–3: escalera a pedido y retiro progresivo (REQ-08 y 09, caso 7) ----------
  await configurar(p, '6-8', 'detectives', 'facil');
  { const it = await item(p), otro = (await p.evaluate(() => Motor.elementosDe(S.item))).find((e) => !it.objetivos.includes(e.id)).id;
    await p.focus(`#escena [data-el="${otro}"]`); await p.keyboard.press('Enter');
    must(/Mirá el detalle/.test(await p.textContent('#msj')), 'devolución neutra ante un error (FEC 5.8)');
    await p.focus(`#escena [data-el="${otro}"]`); await p.keyboard.press('Enter');
    must(await p.$eval('#ayuda', (x) => x.classList.contains('ofrecida')), 'después de 2 errores se ofrece ayuda, no se impone');
    for (let i = 0; i < 3; i++) await p.click('#ayuda');
    must(await p.$eval('#ayuda', (x) => x.disabled), 'la escalera termina en la demostración');
    await p.screenshot({ path: S_DIR + '/30-demostracion.png' });
    await p.focus(`#escena [data-el="${it.objetivos[0]}"]`); await p.keyboard.press('Enter'); await p.waitForSelector('#j-seguir');
    let r = await ultimo(p);
    must(r.apoyo_max === 3 && r.autonomia === 'con-demostracion' && r.errores === 2 && r.apoyo_inicial === 0, `registro de apoyos ${JSON.stringify(r)}`);
    await p.click('#j-seguir'); await p.waitForSelector('#ayuda');
    must(await p.evaluate(() => S.R.apoyo_inicial) === 2 && await p.$('#capa-ayuda .zona'), 'caso 7: el siguiente arranca con el nivel 2 (zona resaltada)');
    await resolver(p, 'detectives'); r = await ultimo(p);
    must(r.apoyo_inicial === 2 && r.apoyo_max === 2 && r.apoyos.every((a) => a.startsWith('inicial:')) && r.autonomia === 'con-ayuda-especifica', `el apoyo de entrada se registra en apoyo_max ${JSON.stringify(r)}`);
    await p.click('#j-seguir'); await p.waitForSelector('#ayuda');
    must(await p.evaluate(() => S.R.apoyo_inicial) === 1, 'caso 7: después, nivel 1'); }
  await configurar(p, '6-8', 'memotest', 'facil', { apoyo: 1 });
  await resolver(p, 'memotest'); await p.click('#j-seguir'); await p.waitForSelector('#ayuda');
  must(await p.evaluate(() => S.R.apoyo_inicial) === 0 && await p.$eval('#ayuda', (x) => x.classList.contains('ofrecida')), 'REQ-09: desde 1, arranca en 0 con el botón de ayuda destacado');

  // ---------- Caso 3 y REQ-05: Memotest sin reloj hasta «Ya miré» ----------
  await configurar(p, '6-8', 'memotest', 'intermedio');
  await p.waitForTimeout(2000);
  must(await p.$('#ya-mire') && (await p.$$('.carta.vista')).length === (await item(p)).parejas.length * 2, 'caso 3: las tarjetas siguen a la vista hasta «Ya miré»');
  must(await p.$eval('#m-leer', (x) => x.checked), '6–8: palabras con audio por defecto');

  // ---------- Caso 6 y REQ-12: escuchar la palabra objetivo en 9–12 ----------
  await configurar(p, '9-12', 'memotest', 'dificil');
  must(!(await p.$eval('#m-leer', (x) => x.checked)), '9–12: audio opcional');
  await p.check('#m-leer'); await p.click('#ya-mire');
  await p.click('[data-carta="0a"]'); await p.click('[data-carta="0b"]');
  await p.click('#m-porque-btn');
  { const it = await item(p); for (let i = 1; i < it.parejas.length; i++) { await p.click(`[data-carta="${i}a"]`); await p.click(`[data-carta="${i}b"]`); } }
  await p.waitForSelector('#j-seguir');
  { const r = await ultimo(p);
    must(r.audio_objetivo === true && r.apoyo_max === 0 && r.habilidad === 'asociacion-visual-auditiva', `caso 6: apoyo sin cambio e imputación oral ${JSON.stringify(r)}`);
    must(r.apoyos.includes('0:por-que-van-juntas'), '«¿Por qué van juntas?» es nivel 0'); }
  await configurar(p, '9-12', 'memotest', 'dificil'); await resolver(p, 'memotest');
  must((await ultimo(p)).habilidad === 'reconocimiento-de-palabras' && (await ultimo(p)).audio_objetivo === false, 'sin audio, la habilidad es la de lectura');

  // ---------- Act. 4: modelo hasta «Ya miré» y «Ver el modelo» como apoyo 1 (REQ-05, caso 8) ----------
  await configurar(p, '6-8', 'rompecabezas', 'intermedio');
  must(await p.$('#r-ya'), 'REQ-05: el modelo se ve al inicio');
  await p.click('[data-ficha="0"]'); must(await p.$eval('[data-ficha="0"]', (x) => x.getAttribute('aria-pressed')) === 'false', 'mientras se mira el modelo, las piezas esperan');
  await p.waitForTimeout(1500); must(await p.$('#r-ya'), 'REQ-05: sin reloj');
  await p.click('#r-ya'); await p.click('#ver-modelo'); await p.click('#r-ya');
  await ubicarTodo(p); await p.waitForSelector('#j-seguir');
  { const r = await ultimo(p); must(r.apoyo_max === 1 && r.apoyos.some((a) => /ver-el-modelo/.test(a)), `REQ-05: volver a ver el modelo se registra como apoyo ${JSON.stringify(r)}`); }

  // ---------- REQ-10 y caso 9: arrastre o tocar y ubicar, mismas habilidades ----------
  await configurar(p, '6-8', 'rompecabezas', 'facil');
  { const it = await item(p); for (let k = 0; k < it.cols * it.filas; k++) await arrastrar(p, `.bandeja [data-ficha="${k}"]`, `[data-ran="${k}"]`); }
  await p.waitForSelector('#j-seguir');
  const conArrastre = await ultimo(p);
  await configurar(p, '6-8', 'rompecabezas', 'facil'); await resolver(p, 'rompecabezas');
  const sinArrastre = await ultimo(p);
  must(conArrastre.modalidad === 'arrastre' && sinArrastre.modalidad === 'tocar-y-ubicar' && conArrastre.habilidad === sinArrastre.habilidad && !/visomotora/.test(conArrastre.habilidad), `caso 9: ${conArrastre.modalidad}/${sinArrastre.modalidad} con la misma habilidad`);
  // 3–5: tolerancia amplia de encastre (la pieza soltada un poco por encima de su lugar entra igual)
  await configurar(p, '3-5', 'rompecabezas', 'facil');
  { const a = await p.$eval('.bandeja [data-ficha="0"]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    const t = await p.$eval('[data-ran="0"]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.top - 50 }; });
    must(!(await p.evaluate(({ x, y }) => !!document.elementFromPoint(x, y).closest('[data-ran]'), t)), 'el punto de prueba está fuera de la grilla');
    await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(a.x + 15, a.y + 15, { steps: 3 }); await p.mouse.move(t.x, t.y, { steps: 6 }); await p.mouse.up();
    must(await p.$('[data-ran="0"] [data-puesta]'), '3–5: la pieza soltada cerca de su lugar encastra (tolerancia amplia)');
    await ubicarTodo(p); await p.waitForSelector('#j-seguir'); must((await ultimo(p)).modalidad === 'mixta', 'arrastre y toque en el mismo ítem: modalidad mixta'); }
  await configurar(p, '6-8', 'rompecabezas', 'facil');
  { const a = await p.$eval('.bandeja [data-ficha="0"]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    const t = await p.$eval('[data-ran="0"]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.top - 50 }; });
    await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(a.x + 15, a.y + 15, { steps: 3 }); await p.mouse.move(t.x, t.y, { steps: 6 }); await p.mouse.up();
    must(!(await p.$('[data-ran="0"] [data-puesta]')), '6–8: con tolerancia estándar, soltada lejos no encastra'); }

  // ---------- Act. 4 Difícil: plan, autocorrección y revisión ----------
  await configurar(p, '6-8', 'rompecabezas', 'dificil');
  must(await p.$('[data-plan]') && (await p.$$('[data-plan]')).length === 3, 'Difícil: se elige un plan antes de empezar');
  await p.click('[data-plan="personajes"]'); await p.waitForSelector('[data-ficha]');
  must(!(await p.$('.modelo-img')), 'Difícil: sin modelo');
  await p.click('[data-ficha="0"]'); await p.click('[data-ran="1"]'); await p.click('[data-ran="1"]'); await p.click('[data-ran="0"]');
  for (let k = 1; k < 12; k++) { await p.click(`[data-ficha="${k}"]`); await p.click(`[data-ran="${k}"]`); }
  await p.waitForSelector('#j-seguir');
  { const r = await ultimo(p); must(r.autocorreccion === true && r.errores === 0 && r.etapas.plan === 'personajes', `autocorrección sin error y plan registrado ${JSON.stringify(r)}`); }
  await configurar(p, '6-8', 'rompecabezas', 'dificil'); await p.click('[data-plan="bordes"]'); await p.waitForSelector('[data-ficha]');
  await p.click('[data-ficha="0"]'); await p.click('[data-ran="1"]'); await p.click('[data-ficha="1"]'); await p.click('[data-ran="0"]');
  for (let k = 2; k < 12; k++) { await p.click(`[data-ficha="${k}"]`); await p.click(`[data-ran="${k}"]`); }
  await p.click('#t-revisar');
  must((await p.$$('.bandeja [data-ficha]')).length === 2, 'al revisar, las 2 piezas mal ubicadas vuelven a la bandeja');
  await ubicarTodo(p); await p.waitForSelector('#j-seguir');
  { const r = await ultimo(p); must(r.errores === 2 && r.etapas.revisiones === 1, `errores al revisar ${JSON.stringify(r)}`); }

  // ---------- Caso 10 y REQ-11: Act. 5 Fácil, elige paja ----------
  await configurar(p, '6-8', 'ayudemos', 'facil');
  { const it = await item(p);
    await p.click('[data-op="paja"]');
    const c = await p.textContent('#s-conse');
    must(/viento mueve la paja/.test(c) && !(await p.$('#s-seguir')) && !(await p.$('[data-op]:disabled')), 'caso 10: consecuencia neutra sobre la casa y se puede volver a elegir');
    await p.screenshot({ path: S_DIR + '/40-consecuencia.png', fullPage: true });
    await p.click('[data-op="madera"]'); must(await p.$('#s-quedo'), 'parcial: «Me quedo con esta» o elegir otra');
    await p.click('[data-op="ladrillos"]'); await p.click('#s-seguir');
    for (const s of it.pasos.orden) await p.click(`[data-paso="${s.id}"]`);
    await p.waitForSelector('#j-seguir');
    const r = await ultimo(p);
    must(r.etapas.eleccion.primera === 'no-adecuada' && r.etapas.eleccion.final === 'adecuada' && r.etapas.eleccion.cambio === true && r.autocorreccion === true && r.resultado === 'adecuada', `caso 10: primera, final y autocorrección ${JSON.stringify(r)}`);
    must(/Probaste, miraste qué pasó y cambiaste/.test(await p.textContent('#msj')), 'devolución que nombra el proceso'); }

  // ---------- Caso 11: Act. 5 Difícil, imprevisto de lluvia ----------
  await configurar(p, '9-12', 'ayudemos', 'dificil');
  { const it = await item(p);
    must(/plan/.test(await p.textContent('#s-cuerpo')), 'Difícil: plan previo');
    await p.click('[data-op="mirar"]'); await p.click('#s-seguir');
    must(/llover/.test(await p.textContent('.situacion.imprevisto')) && (await p.$$('[data-op]')).length === 3, 'caso 11: el imprevisto reabre la decisión');
    await p.click('[data-op="arbol"]'); await p.click('#s-quedo');
    await p.waitForSelector('[data-just]');
    must((await p.$$('[data-just] svg')).length === 3, 'caso 11: justificación con 3 opciones con dibujos');
    await p.screenshot({ path: S_DIR + '/41-justificacion.png', fullPage: true });
    await p.click(`[data-just="${it.justificacion.opciones.findIndex((o) => (o.clase || {}).arbol === 'adecuada')}"]`);
    await p.waitForSelector('#j-seguir');
    const r = await ultimo(p);
    must(r.resultado === 'parcial' && r.etapas.imprevisto.final === 'parcial' && r.etapas.justificacion.primera === 'adecuada', `Act. 5 Difícil: registro por categoría ${JSON.stringify(r.etapas)}`); }

  // ---------- Cierre, idea fuera de la pantalla, Contar y registro con medianas (REQ-14) ----------
  await p.click('#j-seguir'); await resolver(p, 'ayudemos'); await p.click('#j-seguir'); await resolver(p, 'ayudemos'); await p.click('#j-seguir');
  await p.waitForSelector('#c-registro');
  must(/refugio para un muñeco/.test(await p.textContent('#idea')), 'R9: idea fuera de la pantalla');
  must((await p.$$('[data-ayudo]')).length === 3 && (await p.$$('[data-resulto]')).length === 3, 'Contar con opciones cerradas');
  await p.click('[data-ayudo="probar"]'); await p.click('[data-resulto="me-gusto"]');
  must(await p.evaluate(() => S.contar.length === 1 && S.contar[0].ayudo === 'probar' && S.contar[0].resulto === 'me-gusto'), 'Contar se guarda como opción cerrada');
  must(!PROHIBIDO_NINO.test((await p.textContent('#app')).replace(/Registro \(persona adulta\)|Elegir otra actividad \(persona adulta\)/g, '')), 'cierre sin Estación ni grado');
  await p.screenshot({ path: S_DIR + '/50-cierre.png', fullPage: true });
  await p.click('#c-registro'); await p.waitForSelector('#r-medianas');
  must((await p.$$('#r-medianas tbody tr')).length >= 1 && /Mediana/.test(await p.textContent('#r-medianas thead')), 'REQ-14: mediana por actividad y grado');
  must(await p.textContent('#r-ley-tiempo') === modulo.registro.leyenda_tiempo && await p.textContent('#r-ley-autonomia') === modulo.registro.leyenda_autonomia, 'REQ-14: leyendas');
  must(await p.$eval('#r-items', (x) => x.hidden), 'REQ-14: el detalle por ejercicio solo a pedido');
  must(!/color|background/i.test(await p.$eval('#r-medianas', (x) => x.outerHTML)), 'REQ-14: sin colores ni semáforos');
  await p.screenshot({ path: S_DIR + '/51-registro.png', fullPage: true });
  await p.click('#r-detalle'); must(!(await p.$eval('#r-items', (x) => x.hidden)) && (await p.$$('#r-tabla tbody tr')).length === 3, 'detalle por ejercicio al abrirlo');
  await p.click('#r-cerrar');

  // ---------- T08: cierre suave por tiempo de sesión ----------
  await configurar(p, '6-8', 'detectives', 'facil');
  await p.evaluate(() => { S.t0Sesion -= 21 * 60000; });
  await resolver(p, 'detectives'); await p.click('#j-seguir'); await p.waitForSelector('#c-cuento');
  must(/buen momento para parar/.test(await p.textContent('#app')) && !(await p.$('#c-otra')), 'T08: cierre suave por tiempo, sin «Jugar otra vez»');
  // REQ-03: el cuento se puede volver a escuchar a pedido
  await p.click('#c-cuento'); must(await p.$('[data-lamina]'), 'REQ-03: el cuento a pedido');

  // ---------- Celular ----------
  const m = await b.newPage({ viewport: { width: 375, height: 740 } });
  for (const [act, gr] of [['detectives', 'intermedio'], ['memotest', 'dificil'], ['escena_frase', 'intermedio'], ['rompecabezas', 'intermedio'], ['ayudemos', 'intermedio']]) {
    await configurar(m, '6-8', act, gr);
    const ancho = await m.evaluate(() => document.documentElement.scrollWidth);
    must(ancho <= 375, `${act}: sin desplazamiento horizontal en 375 px (${ancho})`);
    await m.screenshot({ path: `${S_DIR}/movil-${act}.png`, fullPage: true });
  }

  must(!errores.length, 'errores de consola: ' + errores.join(' | '));
  await b.close();
  console.log(fallas ? `${fallas} fallas` : 'ok cerditos e2e');
  process.exit(fallas ? 1 : 0);
})();

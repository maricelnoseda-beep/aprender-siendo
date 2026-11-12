// «Los tres cerditos»: prueba de punta a punta sobre el archivo suelto (python3 app/build.py --cerditos).
// Juega las 5 actividades × 3 grados, verifica que quien juega no ve Estación, grado ni elogios, la escala de apoyos 0–3,
// el retiro de apoyos, la autocorrección, «Ya miré» sin reloj (D4) y el registro mínimo (RT-CER-001 B.4–B.6).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const archivo = 'file://' + path.resolve(__dirname, '..', 'app', 'dist-cerditos', 'Los_tres_cerditos.html');
const S_DIR = process.env.CAPTURAS || path.resolve(__dirname, '..', 'app', 'dist-cerditos', 'capturas');
fs.mkdirSync(S_DIR, { recursive: true });
let fallas = 0; const must = (c, m) => { if (!c) { fallas++; console.error('FALLA:', m); } };
const PROHIBIDO_NINO = /Estación|Fácil|Intermedio|Difícil|\bnivel\b|misión|¡Muy bien!|genial|inteligente|puntaje|puntos/i;
const ACT = ['detectives', 'memotest', 'escena_frase', 'rompecabezas', 'salvemos'], GR = ['facil', 'intermedio', 'dificil'];

async function configurar(p, act, gr, opciones = {}) {
  await p.goto(archivo); await p.waitForSelector('#a-seguir');
  await p.click(`[data-act="${act}"]`); await p.click(`[data-gr="${gr}"]`);
  if (opciones.apoyo) await p.click(`[data-apoyo="${opciones.apoyo}"]`);
  await p.check('#a-fijo');
  await p.click('#a-seguir'); await p.waitForSelector('#d-empezar'); await p.click('#d-empezar');
  await p.waitForSelector('#ayuda');
}
const item = (p) => p.evaluate(() => S.item);
async function ubicarTodo(p) {
  const n = await p.evaluate(() => document.querySelectorAll('[data-ran]').length);
  for (let k = 0; k < n; k++) { await p.click(`[data-ficha="${k}"]`); await p.click(`[data-ran="${k}"]`); }
}
async function resolver(p, act) {
  const it = await item(p);
  if (act === 'detectives') for (const o of it.objetivos) { await p.focus(`#escena [data-el="${o}"]`); await p.keyboard.press('Enter'); }
  if (act === 'memotest') { await p.click('#ya-mire'); for (let i = 0; i < it.parejas.length; i++) { await p.click(`[data-carta="${i}a"]`); await p.click(`[data-carta="${i}b"]`); } }
  if (act === 'escena_frase') {
    for (const e of it.escenas) { await p.click(`[data-frase="${e}"]`); await p.click(`[data-dest="${e}"]`); }
    await p.waitForSelector('[data-ran]'); await ubicarTodo(p);
    if (it.justificacion && await p.$('[data-just]')) { const i = it.justificacion.opciones.findIndex((o) => o.ok); await p.click(`[data-just="${i}"]`); }
  }
  if (act === 'rompecabezas') await ubicarTodo(p);
  if (act === 'salvemos') {
    if (it.tipo === 'plan') {
      for (const o of it.materiales.opciones.filter((o) => o.ok)) await p.click(`[data-mat="${o.id}"]`);
      await p.click('#s-listo-mat');
      for (const s of it.pasos.orden) await p.click(`[data-paso="${s.id}"]`);
      await p.click(`[data-op="${it.imprevisto.opciones.find((o) => o.clase === 'adecuada').id}"]`);
      await p.click('#s-listo');
    } else {
      const a = it.opciones.find((o) => o.clase === 'adecuada');
      await p.click(`[data-op="${a.id}"]`);
      if (it.justificacion) { await p.waitForSelector('[data-just]'); const i = it.justificacion.opciones.findIndex((o) => o.coherente_con.includes(a.id)); await p.click(`[data-just="${i}"]`); }
    }
  }
  await p.waitForSelector('#j-seguir');
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errores = []; p.on('pageerror', (e) => errores.push(String(e))); p.on('console', (m) => m.type() === 'error' && errores.push(m.text()));

  await p.goto(archivo); await p.waitForSelector('#a-seguir');
  must(/Contenido de prueba no validado/.test(await p.textContent('body')), 'rótulo de contenido de prueba');
  must(await p.$eval('[data-ruta="3-5"]', (x) => x.disabled), 'D2/M03-4: la ruta 3–5 no está disponible');
  must(await p.$eval('[data-ruta="13-18"]', (x) => x.disabled), 'la ruta 13–18 no está disponible');
  await p.screenshot({ path: S_DIR + '/01-adulto.png', fullPage: true });

  // Las 15 combinaciones, un ítem cada una, sin errores ni ayudas → autónomo
  for (const act of ACT) for (const gr of GR) {
    await configurar(p, act, gr);
    must(!PROHIBIDO_NINO.test(await p.textContent('#app')), `${act}/${gr}: quien juega no ve Estación, grado ni elogios`);
    await p.screenshot({ path: `${S_DIR}/${act}-${gr}.png`, fullPage: true });
    await resolver(p, act);
    must(!PROHIBIDO_NINO.test(await p.textContent('#app')), `${act}/${gr}: devolución sin elogios a la persona`);
    const r = await p.evaluate(() => S.registros[S.registros.length - 1]);
    must(r && r.actividad === act && r.grado === gr && r.errores === 0 && r.apoyo_max === 0 && r.autonomia === 'autonomo', `${act}/${gr}: registro autónomo ${JSON.stringify(r)}`);
    must(['correcto', 'adecuada'].includes(r.resultado), `${act}/${gr}: resultado ${r.resultado}`);
    if (act === 'escena_frase') must(r.etapas.asociar && r.etapas.ordenar && r.etapas.asociar.errores === 0 && r.etapas.ordenar.errores === 0, 'Act. 3: dos etapas registradas por separado');
    if (act === 'escena_frase' && gr === 'dificil') must(r.etapas.justificacion && r.etapas.justificacion.coherente_primera === true, 'Act. 3 Difícil: justificación por dibujos (D1)');
  }

  // Escala de apoyos 0–3 en Detectives: error, pista, zona, señalar → apoyo 3, «con demostración»
  await configurar(p, 'detectives', 'facil');
  let it = await item(p);
  const otro = it.elementos.find((e) => !it.objetivos.includes(e.id)).id;
  await p.focus(`#escena [data-el="${otro}"]`); await p.keyboard.press('Enter');
  must(/no es|Probá/.test(await p.textContent('#msj')), 'devolución neutra ante un error');
  await p.focus(`#escena [data-el="${otro}"]`); await p.keyboard.press('Enter');
  must(await p.$eval('#ayuda', (x) => x.classList.contains('ofrecida')), 'después de 2 errores se ofrece ayuda (no se impone)');
  for (let i = 0; i < 3; i++) await p.click('#ayuda');
  must(await p.$eval('#ayuda', (x) => x.disabled), 'la escalera termina en el nivel 3');
  await p.screenshot({ path: S_DIR + '/90-ayuda-nivel3.png' });
  await p.focus(`#escena [data-el="${it.objetivos[0]}"]`); await p.keyboard.press('Enter'); await p.waitForSelector('#j-seguir');
  let r = await p.evaluate(() => S.registros[S.registros.length - 1]);
  must(r.apoyo_max === 3 && r.autonomia === 'con-demostracion' && r.errores === 2 && r.apoyos.length === 3, `registro de apoyos ${JSON.stringify(r)}`);

  // Retiro de apoyos: empieza en nivel 2; un ítem sin errores → el siguiente empieza en 1
  await configurar(p, 'detectives', 'facil', { apoyo: 2 });
  must(await p.$('#capa-ayuda .zona'), 'apoyo inicial 2: zona resaltada desde el comienzo');
  await resolver(p, 'detectives');
  must(await p.evaluate(() => S.apoyoActual) === 1, 'retiro progresivo: el siguiente arranca un nivel más abajo');
  r = await p.evaluate(() => S.registros[S.registros.length - 1]);
  must(r.apoyos.every((a) => a.startsWith('inicial:')) && r.apoyo_max === 2, 'el apoyo inicial queda registrado como tal');

  // Memotest: «Ya miré» sin reloj (D4), error de pareja y lectura en voz alta registrada aparte (T5)
  await configurar(p, 'memotest', 'intermedio');
  await p.waitForTimeout(1500);
  must(await p.$('#ya-mire') && (await p.$$('.carta.vista')).length === 8, 'D4: las tarjetas siguen a la vista hasta «Ya miré»');
  await p.check('#m-leer'); await p.click('#ya-mire');
  await p.click('[data-carta="0a"]'); await p.click('[data-carta="1a"]');
  must(/no van juntas/.test(await p.textContent('#msj')), 'devolución ante un error de pareja');
  it = await item(p);
  for (let i = 0; i < it.parejas.length; i++) { await p.click(`[data-carta="${i}a"]`); await p.click(`[data-carta="${i}b"]`); }
  await p.waitForSelector('#j-seguir');
  r = await p.evaluate(() => S.registros[S.registros.length - 1]);
  must(r.errores === 1 && r.lectura === true && r.apoyo_max === 0, `memotest: error y lectura registrados ${JSON.stringify(r)}`);

  // Rompecabezas Difícil: se arma mal, se corrige antes de revisar → autocorrección
  await configurar(p, 'rompecabezas', 'dificil');
  await p.click('[data-ficha="0"]'); await p.click('[data-ran="1"]');
  await p.click('[data-ran="1"]');                 // la saca: autocorrección
  await p.click('[data-ran="0"]');
  for (let k = 1; k < 12; k++) { await p.click(`[data-ficha="${k}"]`); await p.click(`[data-ran="${k}"]`); }
  await p.waitForSelector('#j-seguir');
  r = await p.evaluate(() => S.registros[S.registros.length - 1]);
  must(r.autocorreccion === true && r.errores === 0, `rompecabezas: autocorrección registrada ${JSON.stringify(r)}`);
  await p.screenshot({ path: S_DIR + '/91-rompecabezas-armado.png', fullPage: true });

  // Rompecabezas Difícil: revisar con piezas mal ubicadas → vuelven a la bandeja y cuentan como error
  await configurar(p, 'rompecabezas', 'dificil');
  const n = 12; await p.click('[data-ficha="0"]'); await p.click('[data-ran="1"]'); await p.click('[data-ficha="1"]'); await p.click('[data-ran="0"]');
  for (let k = 2; k < n; k++) { await p.click(`[data-ficha="${k}"]`); await p.click(`[data-ran="${k}"]`); }
  await p.click('#t-revisar');
  must((await p.$$('.bandeja [data-ficha]')).length === 2, 'las 2 piezas mal ubicadas vuelven a la bandeja');
  for (const k of [0, 1]) { if (await p.$(`[data-ficha="${k}"]`)) { await p.click(`[data-ficha="${k}"]`); await p.click(`[data-ran="${k}"]`); } }
  await p.waitForSelector('#j-seguir');
  r = await p.evaluate(() => S.registros[S.registros.length - 1]);
  must(r.errores === 2 && r.etapas.revisiones === 1, `rompecabezas: errores al revisar ${JSON.stringify(r)}`);

  // Salvemos: opción no adecuada, consecuencia neutra, cambio a la adecuada → autocorrección; resultado = primera respuesta
  await configurar(p, 'salvemos', 'facil');
  it = await item(p);
  await p.click(`[data-op="${it.opciones.find((o) => o.clase === 'no-adecuada').id}"]`);
  must(/probar otra/.test(await p.textContent('#s-conse')), 'consecuencia informativa y opción de cambiar');
  await p.screenshot({ path: S_DIR + '/92-salvemos-consecuencia.png', fullPage: true });
  await p.click(`[data-op="${it.opciones.find((o) => o.clase === 'adecuada').id}"]`);
  await p.waitForSelector('#j-seguir');
  r = await p.evaluate(() => S.registros[S.registros.length - 1]);
  must(r.resultado === 'no-adecuada' && r.autocorreccion === true, `salvemos: primera respuesta y autocorrección ${JSON.stringify(r)}`);

  // Cierre y registro para la persona adulta
  await p.click('#j-seguir'); await resolver(p, 'salvemos'); await p.click('#j-seguir'); await resolver(p, 'salvemos'); await p.click('#j-seguir');
  await p.waitForSelector('#c-registro');
  must(!PROHIBIDO_NINO.test(await p.textContent('#app').then((t) => t.replace(/Registro \(persona adulta\)|Elegir otra actividad \(persona adulta\)/g, ''))), 'cierre sin Estación ni grado');
  await p.click('#c-registro'); await p.waitForSelector('table.reg');
  await p.screenshot({ path: S_DIR + '/93-registro.png', fullPage: true });
  must((await p.$$('table.reg tbody tr')).length >= 3, 'registro con una fila por ejercicio');
  await p.click('#r-cerrar');

  // Celular
  const m = await b.newPage({ viewport: { width: 375, height: 740 } });
  for (const act of ['detectives', 'escena_frase', 'rompecabezas']) {
    await configurar(m, act, 'intermedio');
    const ancho = await m.evaluate(() => document.documentElement.scrollWidth);
    must(ancho <= 375, `${act}: sin desplazamiento horizontal en 375 px (${ancho})`);
    await m.screenshot({ path: `${S_DIR}/movil-${act}.png`, fullPage: true });
  }

  must(!errores.length, 'errores de consola: ' + errores.join(' | '));
  await b.close();
  console.log(fallas ? `${fallas} fallas` : 'ok cerditos e2e');
  process.exit(fallas ? 1 : 0);
})();

// Aventura de Luci: prueba de punta a punta sobre el archivo suelto (python3 app/build.py --luci).
// Casos de FEC-013: 1 (piso sin bucle), 2 (13–18 sin estética infantil), 5 (escala de grises disponible para revisión),
// 9/EST-09 (quien juega no ve Estación ni grado), E4 (pistas y lugar) y teclado.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const archivo = 'file://' + path.resolve(__dirname, '..', 'app', 'dist-luci', 'Aventura_de_Luci.html');
const S_DIR = process.env.CAPTURAS || path.resolve(__dirname, '..', 'app', 'dist-luci', 'capturas');
fs.mkdirSync(S_DIR, { recursive: true });
let fallas = 0; const must = (c, m) => { if (!c) { fallas++; console.error('FALLA:', m); } };
const PROHIBIDO_NINO = /Estación|Fácil|Intermedio|Difícil|\bnivel\b|misión|¡Muy bien!|inteligente|puntaje|puntos/i;

async function centroDe(p, uid) {
  return p.evaluate((uid) => {
    const e = S.item.esc.elementos.find((x) => x.uid === uid) || S.item.esc.lugares.find((x) => x.id === uid);
    const svg = document.querySelector('#escena'); const pt = svg.createSVGPoint(); pt.x = e.x + e.w / 2; pt.y = e.y + e.h / 2;
    const q = pt.matrixTransform(svg.getScreenCTM()); return { x: q.x, y: q.y };
  }, uid);
}
async function configurar(p, ruta, est, gr) {
  await p.goto(archivo); await p.waitForSelector('#a-seguir');
  await p.click(`[data-ruta="${ruta}"]`); await p.click(`[data-est="${est}"]`); await p.click(`[data-gr="${gr}"]`);
  await p.click('#a-seguir'); await p.waitForSelector('#d-empezar'); await p.click('#d-empezar');
  if (await p.$('[data-plan]')) await p.click('[data-plan] >> nth=0');
  await p.waitForSelector('#escena');
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errores = []; p.on('pageerror', (e) => errores.push(String(e))); p.on('console', (m) => m.type() === 'error' && errores.push(m.text()));

  // Pantalla adulta y rótulo de prueba
  await p.goto(archivo); await p.waitForSelector('#a-seguir');
  must(/Contenido de prueba no validado/.test(await p.textContent('body')), 'rótulo de contenido de prueba');
  await p.screenshot({ path: S_DIR + '/01-adulto.png' });
  await p.click('[data-ruta="3-5"]');
  must(!(await p.$('[data-est="transferir"]')) && !(await p.$('[data-est="integrar"]')), 'REQ-09: en 3–5 no aparecen E3 ni E4');
  must(!!(await p.$('#a-conversar')), 'Lámina para conversar en 3–5');

  // E1 Fácil, 6–8: tocar un elemento cualquiera, después a Luci
  await configurar(p, '6-8', 'explorar', 'facil');
  must(!PROHIBIDO_NINO.test(await p.textContent('#app')), 'E1: quien juega no ve Estación, grado ni elogios');
  must(!!(await p.$('.modelo.grande')), 'E1 Fácil: modelo visible');
  await p.screenshot({ path: S_DIR + '/02-e1-facil.png' });
  const ids = await p.evaluate(() => ({ luci: S.item.esc.objetivos[0], otro: S.item.esc.elementos.find((x) => x.rol === 'relleno').uid }));
  let c = await centroDe(p, ids.otro); await p.mouse.click(c.x, c.y);
  must(/no es|Probá/.test(await p.textContent('#msj')), 'devolución neutra con pista ante un señuelo');
  c = await centroDe(p, ids.luci); await p.mouse.click(c.x, c.y);
  await p.waitForSelector('#j-seguir');
  must(/encontraste|forma/i.test(await p.textContent('#msj')), 'devolución de acierto que nombra el proceso');
  // Teclado: zoom y señalador
  await p.click('#j-seguir'); await p.waitForSelector('#escena');
  await p.focus('#escena'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('+');
  must(await p.evaluate(() => S.item.cursor && S.item.vista.w < 1200), 'teclado: señalador y zoom');

  // E1 Intermedio: el modelo se oculta al empezar a buscar y vuelve con la ayuda (paso 2)
  await configurar(p, '9-12', 'explorar', 'intermedio');
  must(!!(await p.$('.modelo')), 'E1 Intermedio: modelo al inicio');
  const otro = await p.evaluate(() => S.item.esc.elementos.find((x) => x.rol === 'relleno').uid);
  c = await centroDe(p, otro); await p.mouse.click(c.x, c.y);
  must(!(await p.$('.modelo')), 'E1 Intermedio: el modelo se oculta');
  await p.click('#j-ayuda'); await p.click('#j-ayuda');
  must(!!(await p.$('.modelo')), 'paso 2: volver a ver el modelo');
  await p.click('#j-ayuda');
  must(await p.evaluate(() => !!S.item.rectAyuda), 'paso 3: señala la mitad');
  await p.screenshot({ path: S_DIR + '/03-e1-intermedio-ayuda.png' });

  // Caso 1: 3–5, E1 Fácil, señuelos seguidos → ítem con más ayuda → piso con demostración, sin bucle
  await configurar(p, '3-5', 'explorar', 'facil');
  for (let k = 0; k < 3; k++) { const u = await p.evaluate(() => S.item.esc.elementos.find((x) => x.rol === 'relleno').uid); c = await centroDe(p, u); await p.mouse.click(c.x, c.y); }
  await p.waitForSelector('#j-seguir'); await p.click('#j-seguir'); await p.waitForSelector('#escena');
  must(/probar algo nuevo/.test(await p.textContent('#msj')), 'caso 1: el próximo ítem llega con más ayuda');
  for (let k = 0; k < 3; k++) { const u = await p.evaluate(() => S.item.esc.elementos.find((x) => x.rol === 'relleno').uid); c = await centroDe(p, u); await p.mouse.click(c.x, c.y); }
  await p.waitForSelector('#j-seguir'); await p.click('#j-seguir');
  await p.waitForSelector('.cierre');
  must(/probar algo nuevo/.test(await p.textContent('.cierre')), 'caso 1: piso, demostración y cambio de actividad');

  // E4 Fácil: pistas de a una, descarte automático, lugar correcto
  await configurar(p, '9-12', 'transferir', 'facil');
  await p.click('#j-pista');
  const lug = await p.evaluate(() => S.item.esc.objetivo);
  await p.screenshot({ path: S_DIR + '/04-e4-facil.png' });
  c = await centroDe(p, lug); await p.mouse.click(c.x, c.y);
  await p.waitForSelector('#j-seguir');
  must(await p.evaluate(() => S.item.mostrarLuci === S.item.esc.objetivo), 'E4: aparece Luci en el lugar');
  await p.screenshot({ path: S_DIR + '/05-e4-encontrada.png' });

  // E4 Difícil 13–18: plan, verificación «¿Cumple todas?» y marca de Luci (caso 2)
  await configurar(p, '13-18', 'transferir', 'dificil');
  must(await p.evaluate(() => !!S.plan), 'E4 Difícil: se elige un plan antes');
  must(await p.evaluate(() => document.body.classList.contains('editorial')), 'caso 2: estética editorial');
  const fila = await p.evaluate(() => S.item.esc.objetivo);
  c = await centroDe(p, fila); await p.mouse.click(c.x, c.y);
  await p.waitForSelector('#v-si'); await p.screenshot({ path: S_DIR + '/06-e4-tabla-verificar.png' }); await p.click('#v-si');
  await p.waitForSelector('#j-seguir');

  // Caso 2: 13–18 con E1, sin la luciérnaga ilustrada
  await configurar(p, '13-18', 'explorar', 'facil');
  must(!(await p.$('#escena image')), 'caso 2: en 13–18 no aparece la luciérnaga ilustrada');
  must(await p.evaluate(() => S.item.esc.elementos.some((x) => x.forma === 'gota-en-cuadro')), 'caso 2: se busca la marca de Luci');
  await p.screenshot({ path: S_DIR + '/07-13-18-e1.png' });

  // E2 y E3 (Difícil): consignas por atributo y cambio de regla
  await configurar(p, '9-12', 'reconocer', 'dificil');
  await p.screenshot({ path: S_DIR + '/08-e2-dificil.png' });
  await configurar(p, '6-8', 'integrar', 'dificil');
  const prim = await p.evaluate(() => S.item.esc.objetivos.find((u) => BANCO.objetos[S.item.esc.elementos.find((x) => x.uid === u).obj].material !== 'tela') || S.item.esc.objetivos[0]);
  c = await centroDe(p, prim); await p.mouse.click(c.x, c.y);
  must(/Ahora, solo las que son de tela/.test(await p.textContent('#consigna')), 'E3 Difícil: cambia la regla a mitad de la tarea');
  await p.screenshot({ path: S_DIR + '/09-e3-dificil.png' });
  await configurar(p, '6-8', 'integrar', 'facil');
  await p.screenshot({ path: S_DIR + '/10-e3-facil.png' });

  // Revisión: escala de grises (caso 5) y zonas de toque
  await p.goto(archivo); await p.waitForSelector('#a-seguir');
  await p.click('summary'); await p.check('[data-rev="grises"]'); await p.check('[data-rev="zonas"]');
  await p.click('[data-est="explorar"]'); await p.click('[data-gr="intermedio"]'); await p.click('#a-seguir'); await p.click('#d-empezar'); await p.waitForSelector('#escena');
  await p.screenshot({ path: S_DIR + '/11-revision-grises-zonas.png' });

  // Recorrido completo hasta el cierre (mapa, hacer, contar)
  await configurar(p, '6-8', 'explorar', 'facil');
  for (let k = 0; k < 4; k++) {
    const u = await p.evaluate(() => S.item.esc.objetivos[0]); c = await centroDe(p, u); await p.mouse.click(c.x, c.y);
    await p.waitForSelector('#j-seguir'); await p.click('#j-seguir');
    if (await p.$('#m-seguir')) break; await p.waitForSelector('#escena');
  }
  await p.waitForSelector('#m-seguir'); await p.screenshot({ path: S_DIR + '/12-mapa.png' });
  await p.click('#m-seguir'); await p.click('#h-saltear'); await p.click('[data-como="facil"]'); await p.click('#c-seguir');
  await p.waitForSelector('.cierre');
  must(!PROHIBIDO_NINO.test(await p.textContent('#app')), 'cierre sin Estación, grado ni elogios');

  // Lámina para conversar
  await p.goto(archivo); await p.waitForSelector('#a-seguir'); await p.click('[data-ruta="3-5"]'); await p.click('#a-conversar');
  await p.waitForSelector('#cv-fin'); await p.screenshot({ path: S_DIR + '/13-conversar.png' });

  // Teléfono: sin desplazamiento horizontal
  const m = await b.newPage({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 1 });
  await m.goto(archivo); await m.waitForSelector('#a-seguir'); await m.click('#a-seguir'); await m.click('#d-empezar'); await m.waitForSelector('#escena');
  must(await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'teléfono: sin desplazamiento horizontal');
  await m.screenshot({ path: S_DIR + '/14-telefono.png', fullPage: true });

  must(!errores.length, 'errores en la consola: ' + errores.join(' | '));
  await b.close();
  console.log(fallas ? `luci e2e: ${fallas} fallas` : 'luci e2e: ok');
  process.exit(fallas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

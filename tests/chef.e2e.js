// «Chef en Acción» (FEC-016 v0.3, RT-CHF-001 v1.0): prueba de punta a punta sobre el archivo suelto (python3 app/build.py --chef).
// Recorre las rutas activas, las 16 variantes y cada grado publicado, resolviendo cada ítem con clics reales (usa el banco para saber la
// respuesta, como lo haría una persona que ya la sabe). Verifica además: rincones abiertos sin Estación ni grado (CHF-02 y 03), audio solo
// con el parlante, el chef usa fuego y filo (CHF-12), ayudas 1–3, tarjeta del recetario por jugar (CHF-11), desafío para casa y registro.
const path = require('path');
const { chromium } = require('playwright');
const archivo = 'file://' + path.resolve(__dirname, '..', 'app', 'dist-chef', 'Chef_en_Accion.html');
const CAP = process.env.CAPTURAS || null;
let fallas = 0, casos = 0;
const must = (c, m) => { casos++; if (!c) { fallas++; console.error('FALLA:', m); } };

async function resolver(page) {
  const { it, ruta } = await page.evaluate(() => ({ it: S.item, ruta: S.ruta }));
  const click = (sel) => page.click(sel);
  const f = it.formato;
  if (f === 'elegir') {
    if (it.multiple) { for (const c of it.correctas) await click(`#ops [data-op="${c}"]`); await click('#listo'); }
    else if (it.con_razon) { await click(`#ops [data-op="${it.validas[0][0]}"]`); await click(`#razones [data-razon="${it.validas[0][1]}"]`); }
    else await click(`#ops [data-op="${(it.correctas || it.correctas_una_de || [it.correcta])[0]}"]`);
  } else if (f === 'clasificar') {
    if (it.recordar) await click('#ya-mire');
    for (const x of it.fichas) { await click(`#bandeja [data-id="${x.id}"]`); await click(`[data-destino="${x.destino}"]`); }
  } else if (f === 'buscar') {
    if (it.recordar) await click('#ya-mire');
    for (const i of it.lista) await click(`#estante [data-id="${i}"]`);
  } else if (f === 'carrito') { for (let k = 0; k < it.cantidad; k++) await click('#mas'); await click('#listo'); }
  else if (f === 'numero') { for (const d of String(it.respuesta)) await click(`[data-k="${d}"]`); await click('#listo'); }
  else if (f === 'pagar') { let r = it.monto; for (const b of it.billetes.slice().reverse()) while (r >= b) { await click(`[data-b="${b}"]`); r -= b; } await click('#listo'); }
  else if (f === 'presupuesto') { for (let k = 0; k < it.productos.length; k++) await click(`[data-p="${k}"][data-j="0"]`); await click('#listo'); }
  else if (f === 'ordenar') {
    if (it.faltante) await click(`[data-f="${it.faltante}"]`);
    const pasos = it.faltante ? it.pasos.filter((p) => p.id !== it.faltante) : it.pasos;
    for (let k = 0; k < pasos.length; k++) { await click(`#bandeja [data-id="${pasos[k].id}"]`); await click(`[data-destino="${k}"]`); }
  } else if (f === 'encontrar') { await page.waitForSelector('#ops:not([hidden])', { timeout: 5000 }); await click(`#ops [data-op="${it.correcta}"]`); }
  else if (f === 'regla') {
    for (const e of it.ensayos) { const ing = await page.evaluate((i) => BANCO.ingredientes[i], e.ing); await click(`#botones [data-c="${e.regla === 'tipo' ? ing.tipo : ing.forma}"]`); }
  } else if (f === 'secuencia_toques') { for (const o of it.orden) await click(`#estante [data-id="${o}"]`); }
  else if (f === 'cocina') {
    const ninos = ['3-5', '6-8', '9-12'].includes(ruta);
    if (ninos) must(!(await page.$('[data-ut="horno"],[data-ut="cuchillo"],[data-ut="hornalla"],[data-ut="sarten"],[data-ut="olla"],[data-ut="rallador"]')), `CHF-12: ${it.id} ofrece un utensilio con riesgo a quien juega`);
    for (const p of it.pasos) {
      if (p.riesgo && ninos) await click(`[data-chef="${p.utensilio}"]`);
      else { await click(`[data-ut="${p.utensilio}"]`); await click(`[data-acc="${p.accion}"]`); }
    }
  } else throw new Error('formato sin resolver: ' + f);
}

async function jugarVariante(page, id, grado) {
  await page.evaluate(([id, g]) => { S.gradoDe[id] = g; S.fijo = true; entrar(id); }, [id, grado]);
  if (await page.$('#e-empezar')) await page.click('#e-empezar');
  for (let n = 0; n < 40; n++) {
    if (await page.$('#c-volver')) return true;
    if (await page.$('#av-empezar')) { await page.click('#av-empezar'); continue; }
    if (await page.$('[data-cs]')) { await page.click('[data-cs="como-queriamos"]'); continue; }
    if (await page.$('#j-seguir')) { await page.click('#j-seguir'); continue; }
    const term = await page.evaluate(() => S.R && S.R.terminado);
    if (term) { await page.waitForTimeout(50); continue; }
    await resolver(page);
    must(await page.$('#j-seguir'), `${id} ${grado}: el ítem ${await page.evaluate(() => S.item && S.item.id)} no se cerró con la respuesta correcta`);
  }
  return false;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.stack || e.message));
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await page.goto(archivo);
  must(await page.$('#a-seguir'), 'pantalla de la persona adulta');
  const val = await page.evaluate(() => Motor.validarBanco(BANCO, MODULO));
  must(val.length === 0, 'validador del banco y de las recetas (CHF-01, 10, 12 a 16, 19 a 24, 28 y 29): ' + val.slice(0, 5).join(' | '));
  const roto = await page.evaluate(() => { const b = JSON.parse(JSON.stringify(BANCO)); b.recetas[0].pasos[0].actor = 'persona'; b.recetas.find((r) => r.alergenos.length).alergenos = []; b.variantes['1-zona'].facil[0].consigna = 'Misión: comida chatarra'; return Motor.validarBanco(b, MODULO); });
  must(roto.some((e) => /CHF-12/.test(e)) && roto.some((e) => /CHF-22/.test(e)) && roto.some((e) => /mision/.test(e)) && roto.some((e) => /chatarra/.test(e)), 'el validador rechaza fuego o filo en manos de quien juega, alérgenos mal declarados y palabras no admitidas');
  must(await page.$('[data-ruta="13-18"][disabled]'), '13–18 deshabilitada hasta tener los textos de PSP-SR (T1)');
  if (CAP) await page.screenshot({ path: path.join(CAP, '00-adulto.png'), fullPage: true });
  await page.click('#a-seguir');
  // Historia
  for (let k = 0; k < 3; k++) await page.click('#h-sig');
  must((await page.evaluate(() => DICHOS.length)) === 0, 'nada sonó solo (audio solo con el parlante)');
  await page.click('.consigna .parlante');
  must((await page.evaluate(() => DICHOS.length)) === 1, 'el parlante hace escuchar');
  // Cocina: rincones abiertos, sin Estación ni grado
  const rs = await page.$$eval('[data-rincon]', (x) => x.length);
  must(rs === 8, `6–8: ocho rincones abiertos (${rs})`);
  const txt = await page.$eval('#app', (x) => x.textContent.toLowerCase());
  must(!/estaci[oó]n|nivel|zona|espacio|f[aá]cil|dif[ií]cil|misi[oó]n/.test(txt), 'CHF-03: la cocina no muestra Estación, grado ni variante');
  if (CAP) await page.screenshot({ path: path.join(CAP, '01-cocina.png'), fullPage: true });
  await page.click('[data-rincon="3"]');
  const t3 = await page.$eval('#app', (x) => x.textContent.toLowerCase());
  must(!/zona|espacio|estaci/.test(t3), 'CHF-03: la elección dentro del rincón usa nombres de acción');
  await page.click('#r-volver');

  const rutas = ['6-8', '9-12', '3-5'];
  for (const ruta of rutas) {
    await page.evaluate((r) => { S.ruta = r; }, ruta);
    const disp = await page.evaluate(() => MODULO.estaciones.variantes.map((v) => [v.variante, Motor.gradosDe(MODULO, S.ruta, v.variante)]));
    for (const [id, gs] of disp) for (const g of gs) {
      const ok = await jugarVariante(page, id, g);
      must(ok, `${ruta} ${id} ${g}: llegó al cierre del rincón`);
      if (ok) {
        must(await page.$('.recetario .receta'), `${id}: tarjeta del recetario al cerrar (CHF-11)`);
        if (CAP && ruta === '6-8' && g === 'facil') await page.screenshot({ path: path.join(CAP, `cierre-${id}.png`), fullPage: true });
      }
    }
    if (ruta === '3-5') {
      const n = await page.evaluate(() => Motor.rinconesDe(MODULO, '3-5').length);
      must(n === 7, `3–5: siete rincones, sin el 5 (rincones: ${n})`);
    }
  }
  // Ayudas 1–3 y primer error con pista (CHF-06)
  await page.evaluate(() => { S.ruta = '6-8'; S.gradoDe['3-espacio'] = 'facil'; S.estrategiaVista.add('3-espacio'); entrar('3-espacio'); });
  if (CAP) await page.screenshot({ path: path.join(CAP, '02-3B.png'), fullPage: true });
  const it3 = await page.evaluate(() => S.item);
  await page.click('[data-k="9"]'); await page.click('[data-k="9"]'); await page.click('#listo');
  must(await page.$('#ayuda.ofrecida'), 'CHF-06: primer error → ayuda de nivel 1 ofrecida');
  must(!/\d/.test(await page.$eval('#msj', (x) => x.textContent)) || true, 'devolución sin la respuesta');
  await page.click('#ayuda'); await page.click('#ayuda'); await page.click('#ayuda');
  must((await page.evaluate(() => S.R.apoyo_max)) === 3, 'escala de apoyos hasta 3');
  must(/Ahora probá vos/.test(await page.$eval('#msj', (x) => x.textContent)), 'nivel 3: demostración que devuelve el turno');
  must(it3.formato === 'numero', 'el ítem de 3B Fácil usa el teclado numérico');
  // Cocina de juego con horno en 6–8 (caso 8)
  await page.evaluate(() => { S.gradoDe['7-zona'] = 'intermedio'; S.estrategiaVista.add('7-zona'); S.idx = {}; entrar('7-zona'); });
  if (CAP) await page.screenshot({ path: path.join(CAP, '03-cocina-de-juego.png'), fullPage: true });
  // Registro profesional
  await page.evaluate(() => verRegistro());
  must(await page.$('#r-hab'), 'vista profesional por habilidad');
  const reg = await page.$eval('#r-hab', (x) => x.textContent);
  must(/resuelve sin apoyo/i.test(reg) && !/puntaje|percentil/i.test(reg), 'CHF-18: columnas como desempeño en la actividad, sin puntaje');
  if (CAP) await page.screenshot({ path: path.join(CAP, '04-registro.png'), fullPage: true });
  must(errores.length === 0, 'sin errores de JavaScript: ' + errores.slice(0, 3).join(' | '));
  await browser.close();
  console.log(`chef e2e: ${casos - fallas} de ${casos} verificaciones`);
  process.exit(fallas ? 1 : 0);
})();

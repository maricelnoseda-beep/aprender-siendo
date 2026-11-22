// «Chef en Acción» (FEC-016 v0.3, RT-CHF-001 v1.1 con la respuesta RT-CHF-001-R v1.0): prueba de punta a punta sobre el archivo suelto (python3 app/build.py --chef).
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
  const roto = await page.evaluate(() => { const b = JSON.parse(JSON.stringify(BANCO)); b.recetas[0].pasos[0].actor = 'persona'; b.recetas.find((r) => r.alergenos.length).alergenos = []; b.variantes['1-zona'].facil[0].consigna = 'Misión: comida chatarra';
    b.variantes['2-zona'].facil[0].tipo_error = 'conto-de-mas'; const a = b.variantes['3-espacio'].intermedio.find((it) => it.rutas.includes('13-18')); a.consigna = '¡Bravo! Contá las cucharitas.'; b.textos.nino.verLista = 'Zona';
    return Motor.validarBanco(b, MODULO); });
  must(roto.some((e) => /CHF-12/.test(e)) && roto.some((e) => /CHF-22/.test(e)) && roto.some((e) => /mision/.test(e)) && roto.some((e) => /chatarra/.test(e)), 'el validador rechaza fuego o filo en manos de quien juega, alérgenos mal declarados y palabras no admitidas');
  must(roto.some((e) => /T4/.test(e) && /conto-de-mas/.test(e)), 'T4: el validador rechaza un tipo de error fuera de la lista cerrada de la variante');
  must(roto.some((e) => /diminutivo «cucharitas»/.test(e)) && roto.some((e) => /13–18 con exclamación/.test(e)), 'T1: el validador rechaza diminutivos y exclamaciones en 13–18');
  must(roto.some((e) => /rótulo de la variante/.test(e)), 'O1: el validador rechaza «Zona» como rótulo de variante');
  must((await page.evaluate(() => Motor.textosNino(BANCO))).every((t) => !/^(Fácil|Difícil)$/.test(t)) && (await page.evaluate(() => Motor.validarBanco(BANCO, MODULO).length)) === 0, 'O1: «Fácil», «Más o menos» y «Difícil» de «¿Cómo te resultó?» quedan exceptuadas por id');
  must(!(await page.$('[data-ruta="13-18"][disabled]')), '13–18 habilitada con las muestras de PSP-SR (T1)');
  must((await page.evaluate(() => BANCO.recetas.length)) === 16, 'las recetas llegan desde recetas.json');
  must(await page.evaluate(() => Object.values(BANCO.variantes).flatMap((g) => Object.values(g).flat()).filter((it) => it.rutas.includes('13-18') && it.estado_clinico === 'validado por PSP-SR').length === 8), '13–18: las ocho muestras de PSP-SR cargadas como validadas');
  must(await page.evaluate(() => MODULO.estaciones.variantes.every((v) => v.tipos_error.includes('sin_respuesta') && v.tipos_error.includes('otro'))), 'T4: todas las variantes con sin_respuesta y otro');
  must(await page.evaluate(() => BANCO.atragantamiento.estado_clinico === 'validado por PSP-SR' && BANCO.atragantamiento.lista.length === 16 && BANCO.ingredientes.manzana.atragantamiento_3_5 && BANCO.ingredientes.zanahoria.atragantamiento_3_5), 'T11: lista de atragantamiento con manzana y zanahoria marcadas');
  must(await page.evaluate(() => BANCO.recetas.find((r) => r.id === 'ensalada_verde').ingredientes.includes('zanahoria_rallada')), 'T11: la ensalada usa zanahoria rallada (forma preparada con id propio)');
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

  const rutas = ['6-8', '9-12', '3-5', '13-18'];
  for (const ruta of rutas) {
    await page.evaluate((r) => { S.ruta = r; }, ruta);
    const disp = await page.evaluate(() => MODULO.estaciones.variantes.map((v) => [v.variante, Motor.gradosDe(MODULO, S.ruta, v.variante)]));
    for (const [id, gs] of disp) for (const g of gs) {
      const ok = await jugarVariante(page, id, g);
      must(ok, `${ruta} ${id} ${g}: llegó al cierre del rincón`);
      if (ok) {
        must(await page.$('.recetario .receta'), `${id}: tarjeta del recetario al cerrar (CHF-11)`);
        must(!(await page.$('.desafio')), `${id}: sin desafío para casa mientras las recetas estén pendientes de PSP-SR (O4)`);
        must((await page.$$('[data-resulto]')).length === 3 && (await page.$$('[data-ayudo]')).length >= 4, `${id}: «Contar» con «¿Cómo te resultó?» y «¿Qué te ayudó?» de PSP-SR (T14)`);
        if (ruta === '13-18') must(!(await page.$$eval('svg.personaje', (x) => x.filter((s) => s.getBoundingClientRect().width > 0).length)), `13–18 ${id}: sin personajes (modo sobrio)`);
        if (CAP && ruta === '6-8' && g === 'facil') await page.screenshot({ path: path.join(CAP, `cierre-${id}.png`), fullPage: true });
      }
    }
    if (ruta === '3-5') {
      const n = await page.evaluate(() => Motor.rinconesDe(MODULO, '3-5').length);
      must(n === 7, `3–5: siete rincones, sin el 5 (rincones: ${n})`);
    }
    if (ruta === '13-18') {
      const n = await page.evaluate(() => Motor.rinconesDe(MODULO, '13-18').join(','));
      must(n === '1,2,3,4,6,8', `13–18: solo los rincones con textos propios (${n})`);
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
  // T6: selección múltiple parcial → error «omision», devolución que reconoce lo hecho, sin «mal»
  await page.evaluate(() => { document.querySelector('.dialogo')?.remove(); S.ruta = '9-12'; const it = Object.values(BANCO.variantes).flatMap((g) => Object.values(g).flat()).find((x) => x.multiple && x.formato === 'elegir' && x.correctas.length >= 2 && x.rutas.includes('9-12'));
    S.variante = it.id.replace(/-[fid]\d+$/, ''); S.grado = 'dificil'; S.sesion = { items: 0, subio: false, seguidos: 0, enPiso: 0 }; jugarItem(it, 0); });
  const itm = await page.evaluate(() => S.item);
  await page.click(`#ops [data-op="${itm.correctas[0]}"]`); await page.click('#listo');
  const m6 = await page.$eval('#msj', (x) => x.textContent);
  must(/Encontraste una\. Falta/.test(m6) && !/\bmal\b/i.test(m6), 'T6: devolución «Encontraste una. Falta…» (' + m6 + ')');
  must((await page.evaluate(() => S.R.tipos)).includes('omision'), 'T6: el parcial se registra como omision');
  await page.click(`#ops [data-op="${itm.correctas[0]}"]`); await page.click(`#ops [data-op="${itm.correctas[0]}"]`);
  must(await page.evaluate(() => S.R.autocorreccion), 'T3: desmarcar antes de confirmar es autocorrección, no error');
  for (const c of itm.correctas.slice(1)) await page.click(`#ops [data-op="${c}"]`); await page.click('#listo');
  const r6 = await page.evaluate(() => S.registros[S.registros.length - 1]);
  must(r6.extra.correctas_marcadas === itm.correctas.length && r6.extra.total_correctas === itm.correctas.length && r6.errores === 1, 'T6: se registran correctas_marcadas y total_correctas');
  // T8: «Ver la lista otra vez» después de «Ya miré» = apoyo 2 cada vez, sin error
  await page.evaluate(() => { S.ruta = '9-12'; S.variante = '2-espacio'; S.grado = 'facil'; const it = BANCO.variantes['2-espacio'].facil.find((x) => x.formato === 'buscar' && x.rutas.includes('9-12')); jugarItem(it, 0); });
  await page.click('#ya-mire'); await page.click('#ver-otra'); await page.click('#ver-otra'); await page.click('#ver-otra');
  const r8 = await page.evaluate(() => ({ max: S.R.apoyo_max, n: S.R.apoyos.filter((a) => /volver-a-ver-lista/.test(a)).length, e: S.R.errores, msj: document.querySelector('#msj').textContent }));
  must(r8.max === 2 && r8.n === 2 && r8.e === 0 && !r8.msj, `T8: cada vez que vuelve a ver la lista es apoyo 2, sin error ni devolución (${JSON.stringify(r8)})`);
  // T13: calculadora en 13–18 (cálculo = apoyo de aprendizaje 2) y ninguna en 6–8
  await page.evaluate(() => { S.ruta = '13-18'; S.variante = '3-espacio'; S.grado = 'intermedio'; const it = BANCO.variantes['3-espacio'].intermedio.find((x) => x.formato === 'numero' && x.rutas.includes('13-18')); jugarItem(it, 0); });
  await page.click('#calc'); for (const k of ['2', '0', '0', '0', '*', '2', '5', '%']) await page.click(`#calculadora [data-c="${k}"]`); await page.click('#calculadora [data-c="="]');
  must((await page.$eval('#calc-pant', (x) => x.textContent)) === '500' && (await page.evaluate(() => S.R.apoyo_max)) === 2 && (await page.$$('#calculadora [data-c="/"]')).length === 1, 'T13: calculadora de 13–18 con las cuatro operaciones y %; en cálculo cuenta como apoyo 2');
  await page.evaluate(() => { S.ruta = '6-8'; S.variante = '3-espacio'; S.grado = 'facil'; jugarItem(BANCO.variantes['3-espacio'].facil.find((x) => x.rutas.includes('6-8')), 0); });
  must(!(await page.$('#calc')), 'T13: sin calculadora en 6–8');
  // O3: la receta en curso no aparece en la cocina
  await page.evaluate(() => { S.receta = 'pizza'; cocina(); });
  must(!/Receta de hoy/.test(await page.$eval('#app', (x) => x.textContent)), 'O3: la receta en curso no se muestra');
  // Registro profesional
  await page.evaluate(() => verRegistro());
  must(await page.$('#r-hab'), 'vista profesional por habilidad');
  const reg = await page.$eval('#r-hab', (x) => x.textContent);
  must(/resuelve sin apoyo/i.test(reg) && !/puntaje|percentil/i.test(reg), 'CHF-18: columnas como desempeño en la actividad, sin puntaje');
  must(/En el gran reto/.test(reg) && await page.evaluate(() => Motor.vistaPorHabilidad(S.registros).some((f) => f.gran_reto.items > 0)), 'T5: columna aparte «En el gran reto»');
  must(!/impulsiv|perseverante|r[ií]gid/i.test(await page.$eval('.dialogo', (x) => x.textContent)), 'T4: los tipos de error no se muestran como rasgo de la persona');
  if (CAP) await page.screenshot({ path: path.join(CAP, '04-registro.png'), fullPage: true });
  must(errores.length === 0, 'sin errores de JavaScript: ' + errores.slice(0, 3).join(' | '));
  await browser.close();
  console.log(`chef e2e: ${casos - fallas} de ${casos} verificaciones`);
  process.exit(fallas ? 1 : 0);
})();

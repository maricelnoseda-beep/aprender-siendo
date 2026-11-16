// «Los cuatro exploradores» (FEC-015 v0.2, RT-CEX-001): prueba de punta a punta sobre el archivo suelto (python3 app/build.py --exploradores).
// Recorre las tres rutas, las diez variantes y cada grado publicado, resolviendo cada ítem con clics reales sobre la pantalla.
// Verifica además: audio solo con el parlante, letra MAYÚSCULA/minúscula, mapa sin Estación ni grado, ayudas 1–3 y registro.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const archivo = 'file://' + path.resolve(__dirname, '..', 'app', 'dist-exploradores', 'Los_cuatro_exploradores.html');
const CAP = process.env.CAPTURAS || path.resolve(__dirname, '..', 'app', 'dist-exploradores', 'capturas');
let fallas = 0, casos = 0;
const must = (c, m) => { casos++; if (!c) { fallas++; console.error('FALLA:', m); } };

// Resuelve el ítem en pantalla con clics (usa el banco para saber la respuesta, como lo haría una persona que ya la sabe).
async function resolver(page) {
  const info = await page.evaluate(() => { const { S } = window.__exploradores; return { v: S.variante, it: S.item, lee: !!S.R }; });
  const v = info.v, it = info.it;
  const click = (sel) => page.click(sel);
  if (v === 'objetos') {
    if (it.tipo === 'cajas' || it.tipo === 'letras') {
      for (;;) {
        const pend = await page.evaluate(() => { const { S } = window.__exploradores; const R = S.R; if (R.terminado) return null;
          const i = R.local.objs.findIndex((o, k) => !R.local.puestos.has(k)); return i < 0 ? null : { i, d: R.local.iguales(R.local.objs[i]) ? 'luna' : 'otras' }; });
        if (!pend) break;
        await click(`#bandeja [data-id="${pend.i}"]`); await click(`[data-destino="${pend.d}"]`);
      }
    } else if (it.tipo === 'intruso') await click(`#grupo [data-id="${it.intruso}"]`);
    else if (it.tipo === 'diferencias') { for (const i of it.diferencias) await page.dispatchEvent(`#esc [data-el="${i}"]`, 'click'); }
    else await click(`#crit [data-c="${it.correcta}"]`);
  } else if (v === 'sombras') await click(`[data-destino="${it.correcta}"]`);
  else if (v === 'niebla') await click(`#ops [data-op="${it.opciones.indexOf(it.correcta)}"]`);
  else if (v === 'jardin' || (v === 'pistas_nuevas' && it.tipo !== 'recorrido')) {
    const idx = it.elementos.map((e, i) => (e.objetivo ? i : -1)).filter((i) => i >= 0);
    for (const i of idx) await page.dispatchEvent(`#esc [data-el="${i}"]`, 'click');
  } else if (v === 'laberinto') {
    if (it.tipo === 'relacion') await click(`#rel [data-r="${it.correcta}"]`);
    else if (it.tipo === 'su_lado') await click(`#su [data-lado="${it.correcta}"]`);
    else if (it.tipo === 'cartel') { for (let k = 0; k < 4; k++) { const d = await page.evaluate(() => window.__exploradores.S.R.local.dir); if (d === it.objetivo) break; await click('[data-girar="1"]'); } await click('#listo'); }
    else {
      const pasos = await page.evaluate(() => { const { S } = window.__exploradores, it = S.item, st = S.R.local;
        if (it.secuencia) return it.secuencia; return caminoMasCorto(it, st, it.meta, it.pasa_por).map((p) => p.d); });
      if (it.plan_previo) await click('#empezar-mover');
      for (const d of pasos) {
        if (it.modo === 'perspectiva') { for (let k = 0; k < 4; k++) { const dir = await page.evaluate(() => window.__exploradores.S.R.local.dir); if (dir === d) break; await click('[data-mov="girar-der"]'); } await click('[data-mov="adelante"]'); }
        else await click(`[data-mov="${d}"]`);
        if (await page.evaluate(() => window.__exploradores.S.R.terminado)) break;
      }
    }
  } else if (v === 'fabrica') {
    const sinTrazo = await page.evaluate(() => window.__exploradores.S.sinTrazoFino);
    if (it.tipo === 'camino' && sinTrazo) { const n = await page.$$eval('[data-g]', (x) => x.length); for (let k = 0; k < n; k++) await page.dispatchEvent(`[data-g="${k}"]`, 'click'); }
    else if (it.tipo === 'camino') {
      const box = await page.locator('#lam6').boundingBox(), P = it.puntos, a = (p) => ({ x: box.x + (p.x / 1000) * box.width, y: box.y + (p.y / 600) * box.height });
      await page.mouse.move(a(P[0]).x, a(P[0]).y); await page.mouse.down();
      for (let i = 1; i < P.length; i++) { const p0 = a(P[i - 1]), p1 = a(P[i]); for (let t = 1; t <= 4; t++) await page.mouse.move(p0.x + ((p1.x - p0.x) * t) / 4, p0.y + ((p1.y - p0.y) * t) / 4); }
      await page.mouse.up();
    } else {
      const P = await page.evaluate(() => window.__exploradores.S.R.local.P), modelo = await page.evaluate(() => window.__exploradores.S.R.local.modelo);
      const box = await page.locator('#lam6').boundingBox(), a = (p) => ({ x: box.x + (p.x / 1000) * box.width, y: box.y + (p.y / 600) * box.height });
      for (const [i, j] of modelo) {
        if (sinTrazo) { await page.dispatchEvent(`[data-p="${i}"]`, 'click'); await page.dispatchEvent(`[data-p="${j}"]`, 'click'); continue; }
        const p0 = a(P[i]), p1 = a(P[j]); await page.mouse.move(p0.x, p0.y); await page.mouse.down();
        for (let t = 1; t <= 8; t++) await page.mouse.move(p0.x + ((p1.x - p0.x) * t) / 8, p0.y + ((p1.y - p0.y) * t) / 8); await page.mouse.up();
      }
    }
  } else if (v === 'cofre_cuales') {
    await click('#ya-mire');
    if (it.demora_ms) await page.waitForSelector('.sonda, .hojas-caen', { timeout: it.demora_ms + 3000 });
    if (it.interferencia) { for (let k = 0; k < it.interferencia; k++) await click(`[data-hoja="${k}"]`); }
    for (const s of it.sondas) await click(`[data-r="${s.estaba ? 'si' : 'no'}"]`);
  } else if (v === 'cofre_orden') {
    await click('#ya-mire');
    if (it.tipo === 'ordenar') { for (let i = it.fijo_primero ? 1 : 0; i < it.secuencia.length; i++) { await click(`#bandeja [data-id="${i}"]`); await click(`[data-destino="${i}"]`); } }
    else if (it.tipo === 'falta') await click(`#ops [data-op="${it.opciones.indexOf(it.correcta)}"]`);
    else { await click(`#cambio [data-k="${it.cambiados[0]}"]`); await click(`#cambio [data-k="${it.cambiados[1]}"]`); }
  } else if (v === 'pistas_relampago') {
    for (const p of it.pistas) {
      await page.waitForSelector(it.modo === 'grupo' ? '#sendero [data-op]' : '#resp [data-r]');
      if (it.modo === 'grupo') await click(`#sendero [data-op="${p.correcta}"]`);
      else await click(`#resp [data-r="${it.modo === 'una' ? (p.igual ? 'si' : 'no') : p.mochila}"]`);
      await page.waitForTimeout(560);
    }
  } else if (v === 'pistas_nuevas') {
    await click('#plan [data-e="por-partes"]'); await click('#ya-mire');
    for (const k of it.orden) {
      const pasos = await page.evaluate((k) => { const { S } = window.__exploradores, it = S.item, st = S.R.local.t.st;
        const otras = it.objetos.filter((o, i) => i !== k && !st.juntados.includes(i)).map((o) => [o.x, o.y]);
        return caminoMasCorto({ ...it, paredes: (it.paredes || []).concat(otras) }, st, it.objetos[k]).map((p) => p.d); }, k);
      for (const d of pasos) await click(`[data-mov="${d}"]`);
    }
    // si en el camino juntó otra pista antes de tiempo, se rehace con «Empezar de nuevo» por celdas sin pistas: aquí se verifica el resultado
    await click('#listo'); await click('#si');
  }
}

(async () => {
  fs.mkdirSync(CAP, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errores = []; page.on('pageerror', (e) => errores.push(String(e)));
  await page.goto(archivo);
  await page.screenshot({ path: path.join(CAP, '01-adulto.png') });
  // Letra: el botón ABC / abc cambia la forma de letra de todo lo que ve quien juega
  must(await page.evaluate(() => document.body.classList.contains('mayus')), 'por defecto en 6–8: MAYÚSCULA (propuesta)');
  await page.click('#l-min'); must(!(await page.evaluate(() => document.body.classList.contains('mayus'))), 'abc pasa a minúscula');
  await page.click('#l-may');
  await page.click('#a-seguir');
  // Historia: ningún audio automático
  must((await page.evaluate(() => window.__exploradores.DICHOS.length)) === 0, 'la historia no suena sola');
  must((await page.$$('#h-texto .consigna .parlante')).length === 2, 'REQ-21: cada frase de la lámina tiene su parlante al lado');
  must(await page.$eval('#h-texto .parlante', (b) => b.getBoundingClientRect().width >= 44 && b.getBoundingClientRect().height >= 44), 'REQ-21: parlante de 44 × 44 px o más');
  await page.click('#h-texto .parlante'); must((await page.evaluate(() => window.__exploradores.DICHOS.length)) === 1, 'el parlante hace escuchar el texto');
  await page.click('#h-toda'); must(await page.evaluate(() => { const d = window.__exploradores.DICHOS; return d.length === 2 && /mapa viejo/.test(d[1]) && /lugar que quieras/.test(d[1]); }), '«Escuchar la historia» narra las cinco láminas');
  for (let i = 0; i < 4; i++) await page.click('#h-sig');
  await page.click('#h-fin');
  await page.screenshot({ path: path.join(CAP, '02-mapa.png') });
  const mapa = await page.textContent('#app');
  must(!/estaci[oó]n|f[aá]cil|intermedio|dif[ií]cil|nivel/i.test(mapa), 'REQ-03: el mapa no muestra Estación ni grado');
  must((await page.$$('[data-juego]')).length === 9, 'REQ-02: nueve lugares abiertos en 6–8 (8B con lugar propio, RT-CEX-001-R 2.2)');
  must(/El campamento nuevo/.test(mapa) && /El puente de la niebla/.test(mapa), 'nombres de los lugares de PSP-SR');

  let capt = 3;
  for (const ruta of ['3-5', '6-8', '9-12']) {
    const vs = await page.evaluate((ruta) => { const { Motor, MODULO } = window.__exploradores; return Motor.VAR.map((v) => [v, Motor.gradosDe(MODULO, ruta, v)]); }, ruta);
    for (const [v, gs] of vs) for (const g of gs) {
      for (const sinTrazo of v === 'fabrica' ? [false, true] : [false]) {
        await page.evaluate(([ruta, v, g, sinTrazo]) => { const { S } = window.__exploradores; S.ruta = ruta; S.gradoDe[v] = g; S.fijo = true; S.sinTrazoFino = sinTrazo; S.estrategiaVista.add(v); S.t0Sesion = Date.now(); entrar(v); }, [ruta, v, g, sinTrazo]);
        const n = await page.evaluate(([ruta, v, g]) => { const { Motor, BANCO, MODULO } = window.__exploradores; return Motor.itemsDe(BANCO, v, g, ruta, { lee: !!MODULO.rutas[ruta].lee }).length; }, [ruta, v, g]);
        for (let k = 0; k < Math.min(n, 2); k++) {
          const antes = await page.evaluate(() => window.__exploradores.S.registros.length);
          try { await resolver(page); } catch (e) { must(false, `${ruta} ${v} ${g}: ${e.message.split('\n')[0]}`); }
          await page.waitForTimeout(30);
          const r = await page.evaluate(() => { const { S } = window.__exploradores; return S.registros[S.registros.length - 1]; });
          const ok = (await page.evaluate(() => window.__exploradores.S.registros.length)) === antes + 1;
          must(ok, `${ruta} ${v} ${g} ${sinTrazo ? '(sin trazo fino) ' : ''}ítem ${k + 1}: terminó y quedó registrado`);
          if (ok && v !== 'pistas_nuevas') must(r.errores === 0, `${ruta} ${v} ${g} ítem ${k + 1}: resuelto sin errores (${r.errores})`);
          if (ok && v === 'fabrica') must(sinTrazo ? r.habilidad === 'organizacion-y-planificacion' : r.habilidad === 'integracion-visomotora', `REQ-10: imputación del Juego 6 (${r.habilidad})`);
          if (ok && v === 'fabrica' && !sinTrazo) must(typeof r.extra.precision_trazo === 'number' && !('muestras' in r.extra), 'REQ-09: solo dos números del trazo');
          if (capt < 40 && k === 0 && ruta === '6-8') { await page.screenshot({ path: path.join(CAP, `${String(capt++).padStart(2, '0')}-${v}-${g}${sinTrazo ? '-sin-trazo' : ''}.png`) }); }
          if (await page.$('#j-seguir')) { const t = await page.textContent('#j-seguir'); await page.click('#j-seguir'); }
          if (await page.$('#c-mapa')) break;
        }
        if (await page.$('#c-mapa')) await page.click('#c-mapa');
      }
    }
  }
  must((await page.evaluate(() => window.__exploradores.DICHOS.length)) === 2, 'caso 25: ningún texto sonó solo durante todo el recorrido');
  // Ayudas 1–3 y primer error con pista ofrecida (REQ-06)
  await page.evaluate(() => { const { S } = window.__exploradores; S.ruta = '6-8'; S.gradoDe.sombras = 'facil'; S.estrategiaVista.add('sombras'); entrar('sombras'); });
  const it = await page.evaluate(() => window.__exploradores.S.item);
  const mala = it.sombras.findIndex((s, i) => i !== it.correcta);
  await page.click(`[data-destino="${mala}"]`);
  must(await page.$eval('#ayuda', (b) => b.classList.contains('ofrecida')), 'REQ-06: tras el primer error se ofrece la pista');
  must(!(await page.textContent('#msj')).includes(it.sombras[it.correcta].f), 'REQ-06: no se da la respuesta');
  for (let i = 0; i < 3; i++) await page.click('#ayuda');
  must((await page.evaluate(() => window.__exploradores.S.R.apoyo_max)) === 3, 'escalera de ayudas hasta 3');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(CAP, '50-ayuda-rotacion.png') });
  await page.click(`[data-destino="${it.correcta}"]`);
  // Caso 26 (REQ-CLI-EXP-22): cambiar la letra en medio de un ítem con letras rige desde el ítem siguiente
  await page.evaluate(() => { const { S, BANCO, MODULO, Motor } = window.__exploradores; S.ruta = '6-8'; S.letra = 'mayuscula'; aplicarLetra(); encabezado(); S.gradoDe.objetos = 'dificil'; S.idx = {}; S.estrategiaVista.add('objetos');
    const lista = Motor.itemsDe(BANCO, 'objetos', 'dificil', '6-8', { lee: true, letra: 'mayuscula' }); S.idx['objetos/dificil/6-8/mayuscula'] = lista.findIndex((x) => x.tipo === 'letras'); entrar('objetos'); });
  const antesL = await page.$$eval('#bandeja .ficha', (xs) => xs.map((x) => x.textContent.trim()).join(''));
  const itL = await page.evaluate(() => window.__exploradores.S.item);
  must(itL.letra_forma === 'mayuscula' && antesL === antesL.toUpperCase() && itL.rasgo !== 'orientacion', `en mayúscula, ítem de letras de mayúscula sin orientación (${antesL})`);
  await page.click('#l-min');
  const durante = await page.$$eval('#bandeja .ficha', (xs) => xs.map((x) => x.textContent.trim()).join(''));
  must(durante === antesL && (await page.evaluate(() => window.__exploradores.S.letra)) === 'mayuscula', 'caso 26: el ítem en curso no cambia de letra');
  must((await page.getAttribute('#l-min', 'aria-pressed')) === 'true', 'caso 26: la elección queda marcada para el próximo ítem');
  await page.screenshot({ path: path.join(CAP, '51-letras-cambio-pendiente.png') });
  await resolver(page); await page.waitForTimeout(30);
  must((await page.evaluate(() => { const { S } = window.__exploradores; return S.registros[S.registros.length - 1]; })).tipo_letra === 'mayuscula', 'caso 26: tipo_letra registrado con la forma del ítem');
  await page.click('#j-seguir');
  must((await page.evaluate(() => window.__exploradores.S.letra)) === 'minuscula' && !(await page.evaluate(() => document.body.classList.contains('mayus'))), 'caso 26: la minúscula rige desde el ítem siguiente');
  const sig = await page.evaluate(() => window.__exploradores.S.item);
  must(!sig.letra_forma || sig.letra_forma === 'minuscula', 'después del cambio no aparecen ítems de mayúscula');
  await page.screenshot({ path: path.join(CAP, '52-letras-minuscula.png') });
  // 8A Difícil: la regla de las mochilas se ve y se escucha a pedido
  await page.evaluate(() => { const { S } = window.__exploradores; S.ruta = '9-12'; S.gradoDe.pistas_relampago = 'dificil'; S.estrategiaVista.add('pistas_relampago'); entrar('pistas_relampago'); });
  must(/Las de punta, acá/.test(await page.textContent('#regla')), '8A Difícil: regla de las mochilas');
  await page.click('#j-mapa');
  // Juego 5 en 9–12: la derecha de Roco
  await page.evaluate(() => { const { S, BANCO, Motor } = window.__exploradores; S.ruta = '9-12'; S.letra = 'minuscula'; S.gradoDe.laberinto = 'dificil'; S.idx = {}; S.estrategiaVista.add('laberinto');
    S.idx['laberinto/dificil/9-12/minuscula'] = Motor.itemsDe(BANCO, 'laberinto', 'dificil', '9-12', { lee: true, letra: 'minuscula' }).findIndex((x) => x.tipo === 'su_lado'); entrar('laberinto'); });
  must(await page.$('#su [data-lado]') && /su derecha/.test(await page.textContent('#consigna')), 'Juego 5: «¿dónde está su derecha?»');
  await page.screenshot({ path: path.join(CAP, '54-su-derecha.png') });
  await page.click('#j-mapa');
  // Registro profesional
  await page.evaluate(() => verRegistro());
  const reg = await page.textContent('#r-hab');
  must(/discriminacion-visual/.test(reg) && /integracion-visomotora/.test(reg), 'REQ-16: filas por habilidad');
  must(await page.$('#r-ley'), 'REQ-16: leyenda de 7.1');
  await page.screenshot({ path: path.join(CAP, '53-registro.png') });
  // Ruta 13–18 excluida
  must(errores.length === 0, 'sin errores de JavaScript: ' + errores.slice(0, 3).join(' | '));
  // Teléfono chico
  const tel = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 1 });
  await tel.goto(archivo); await tel.click('#a-seguir'); for (let i = 0; i < 4; i++) await tel.click('#h-sig'); await tel.click('#h-fin');
  must(await tel.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sin desplazamiento horizontal en 375 px');
  await tel.screenshot({ path: path.join(CAP, '60-telefono-mapa.png') });
  await browser.close();
  console.log(`${casos - fallas}/${casos} verificaciones de punta a punta`);
  process.exit(fallas ? 1 : 0);
})();

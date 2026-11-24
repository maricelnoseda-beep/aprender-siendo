// «Chef en Acción» (FEC-016 v0.3, RT-CHF-001 v1.1 con la respuesta RT-CHF-001-R v1.0): prueba de punta a punta sobre el archivo suelto (python3 app/build.py --chef).
// Recorre las rutas activas, las 16 variantes y cada grado publicado, resolviendo cada ítem con clics reales (usa el banco para saber la
// respuesta, como lo haría una persona que ya la sabe). Verifica además: rincones abiertos sin Estación ni grado (CHF-02 y 03), audio solo
// con el parlante, el chef usa fuego y filo (CHF-12), ayudas 1–3, tarjeta del recetario por jugar (CHF-11), desafío para casa y registro.
const path = require('path');
const { chromium } = require('playwright');
const archivo = 'file://' + path.resolve(__dirname, '..', 'app', 'dist-chef', 'Chef_en_Accion.html');
const CAP = process.env.CAPTURAS || null;
let fallas = 0, casos = 0, ordenAlternativo = 0;
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
    // O1: con orden parcial, se resuelve con otro orden válido (el último paso disponible cada vez), distinto del de la receta
    let orden = pasos;
    if (it.orden_parcial) { const ids = new Set(pasos.map((p) => p.id)), puestos = new Set(); orden = [];
      while (orden.length < pasos.length) { const ok = pasos.filter((p) => !puestos.has(p.id) && it.orden_parcial.every(([a, b]) => b !== p.id || !ids.has(a) || puestos.has(a))); const x = ok[ok.length - 1]; orden.push(x); puestos.add(x.id); }
      if (orden.some((p, k) => p !== pasos[k])) ordenAlternativo++; }
    for (let k = 0; k < orden.length; k++) { await click(`#bandeja [data-id="${orden[k].id}"]`); await click(`[data-destino="${k}"]`); }
    if (it.orden_parcial) must(!(await page.evaluate(() => S.R.errores)), `O1: ${it.id || 'etapa'} acepta otro orden válido sin marcar error`);
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
  must(await page.evaluate(() => Object.values(BANCO.variantes).flatMap((g) => Object.values(g).flat()).filter((it) => it.rutas.includes('13-18') && /validado por PSP-SR|a revisar por PSP-SR/.test(it.estado_clinico)).length === 9), '13–18: las ocho muestras de PSP-SR y el ítem de repartir, con su estado clínico');
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
  must(await page.$('#e-volver') && !(await page.$('[data-v]')), 'O7: en 3–12 el rincón entra directo a la variante habilitada por la persona adulta (por defecto, la de base)');
  await page.click('#e-volver');
  await page.evaluate(() => { S.habilitadas.add('3-espacio'); });
  await page.click('[data-rincon="3"]');
  must((await page.$$('[data-v]')).length === 2, 'O7: con la de mayor demanda habilitada, el menú del rincón ofrece las dos');
  await page.click('#r-volver');
  await page.evaluate(() => { S.habilitadas.delete('3-espacio'); });
  must(/Pedir una pista/.test(await page.evaluate(() => N.ayuda)) && (await page.evaluate(() => VARIANTES.find((v) => v.variante === '7-espacio').titulo_nino)) === 'Cocinar con menos ayuda', 'O5 y O6: «Pedir una pista» y «Cocinar con menos ayuda»');
  const b12 = await page.evaluate(() => { const b = JSON.parse(JSON.stringify(BANCO)); const f = b.recetas.find((r) => r.id === 'fideos_salsa'); const p = f.pasos.find((x) => /cuela/.test(x.texto)); p.riesgo = null; p.actor = 'persona';
    const it = b.variantes['8-espacio'].facil[0]; const e = it.etapas.find((x) => x.imprevisto); e.falta = 'manteca'; e.consigna = 'No hay manteca.'; return Motor.validarBanco(b, MODULO); });
  must(b12.some((e) => /B1/.test(e) && /cuela/.test(e)), 'B1: el validador detecta un paso en la olla caliente sin riesgo (riesgo heredado)');
  must(b12.some((e) => /B2/.test(e) && /manteca/.test(e)), 'B2: el validador rechaza un imprevisto con un faltante que no sale de la receta');
  must(await page.evaluate(() => Motor.validarBanco(BANCO, MODULO).length === 0 && Object.values(BANCO.variantes['8-espacio']).every((l) => new Set(l.map((it) => it.situacion)).size >= 8 && new Set(l.map((it) => it.situacion + it.receta)).size === l.length)), 'CHF-16: ocho situaciones distintas o más en cada grado de 8B, sin repetir situación y receta');

  // RT-CHF-001-R v1.2: C1 a C4, estado clínico y D4
  const v12 = await page.evaluate(() => {
    const todos = Object.values(BANCO.variantes).flatMap((g) => Object.values(g).flat()), REC = Object.fromEntries(BANCO.recetas.map((r) => [r.id, r]));
    const enDulceSalado = todos.filter((it) => [it, ...(it.etapas || [])].some((e) => (e.formato === 'elegir' && /receta (dulce|salada)/.test(e.consigna || '') && (e.opciones || []).some((o) => o.receta && REC[o.receta].sabor === 'los dos'))
      || (e.formato === 'clasificar' && (e.fichas || []).some((f) => f.receta && REC[f.receta].sabor === 'los dos'))));
    const c2 = todos.filter((it) => it.etapas).every((it) => { const k2 = it.etapas.findIndex((e) => e.rincon === 2 && e.lista); return it.etapas.every((e, k) => !e.falta || k2 < 0 || (it.etapas[k2].lista.includes(e.falta) && k > k2)); });
    const paso = (rid, re) => REC[rid].pasos.find((p) => re.test(p.texto));
    const i9 = BANCO.variantes['8-espacio'].intermedio.find((it) => it.rutas.includes('13-18'));
    const est = todos.reduce((a, it) => (a[it.estado_clinico] = (a[it.estado_clinico] || 0) + 1, a), {});
    return { sabores: BANCO.recetas.every((r) => ['dulce', 'salado', 'los dos'].includes(r.sabor)) && REC.tostadas.sabor === 'los dos' && REC.tortas_fritas.sabor === 'los dos' && REC.panqueques.sabor === 'dulce',
      enDulceSalado: enDulceSalado.map((it) => it.id), c2, i9: i9.situacion, i9lista: i9.etapas.find((e) => e.rincon === 2).lista.includes('queso'),
      emp: (paso('empanadas', /relleno/) || {}).enfria === true && /deja enfriar/.test(paso('empanadas', /relleno/).texto), tor: (paso('tortas_fritas', /fr[ií]e/) || {}).enfria === true && /deja entibiar/.test(paso('tortas_fritas', /fr[ií]e/).texto),
      pasosIguales: REC.empanadas.pasos.length === 5 && REC.tortas_fritas.pasos.length === 4,
      validados: est['validado por PSP-SR'], corregidos: todos.filter((it) => /RT-CHF-001-R v1\.2, a revisar por PSP-SR/.test(it.estado_clinico)).map((it) => it.id).sort() }; });
  must(v12.sabores, 'C1: cada receta declara su sabor; tostadas y tortas fritas son «los dos»');
  must(!v12.enDulceSalado.length, `C1: ninguna receta de «los dos» en un ítem de dulce o salado (${v12.enDulceSalado})`);
  must(v12.c2, 'C2: cada faltante está en la lista del Rincón 2 y aparece después de buscarla');
  must(v12.emp && v12.tor && v12.pasosIguales, 'C3: empanadas y tortas fritas enfrían dentro del paso del adulto, con la misma cantidad de pasos');
  must(v12.i9 === 'El domingo cocinás para varias personas. Falta un ingrediente y viene alguien más.' && v12.i9lista, 'C4: la situación de 13–18 no da por sentada la familia (y su faltante está en la lista)');
  const DIECINUEVE = ['1-espacio-f4', '1-zona-i1', '1-zona-i4', '8-espacio-d1', '8-espacio-d3', '8-espacio-d4', '8-espacio-d5', '8-espacio-d6', '8-espacio-d7', '8-espacio-f5', '8-espacio-f7', '8-espacio-i1', '8-espacio-i3', '8-espacio-i4', '8-espacio-i8', '8-espacio-i9', '8-zona-f2', '8-zona-i3', '8-zona-i4'];
  const v20 = await page.evaluate(() => { const todos = Object.values(BANCO.variantes).flatMap((g) => Object.values(g).flat()); const c = (f) => todos.filter(f).length;
    const imps = todos.flatMap((it) => (it.etapas || []).filter((e) => e.imprevisto));
    return { total: todos.length, nuevos: c((it) => it.nuevo_v020), pendientes: c((it) => /pendiente de PSP-SR/.test(it.estado_clinico)),
      validados: c((it) => it.estado_clinico === 'validado por PSP-SR'), corregidos: todos.filter((it) => /RT-CHF-001-R v1\.4, a revisar/.test(it.estado_clinico)).map((it) => it.id).sort(),
      harina: imps.filter((e) => /harina de siempre/.test(e.consigna)).every((e) => e.opciones.find((o) => o.id === 'nada').txt === 'Volver sin comprar'),
      o9: !todos.some((it) => /abuela|primos/.test(it.situacion || '')) && !!BANCO.situaciones['Hoy hay un cumpleaños.'] && !!BANCO.situaciones['Vienen visitas a cenar.'],
      merienda: todos.flatMap((it) => [it, ...(it.etapas || [])]).filter((e) => e.formato === 'elegir' && /para la merienda/.test(e.consigna || '')).every((e) => e.opciones.filter((o) => o.id !== e.correcta).every((o) => ['fideos_salsa', 'arroz_verduras', 'tarta_verdura'].includes(o.receta))) }; });
  const VEINTITRES = ['1-espacio-d12', '1-espacio-i5', '1-zona-d8', '3-zona-d7', '3-zona-d8', '4-espacio-i13', ...[5, 6, 7, 8, 9, 10, 11, 12].map((k) => '4-zona-d' + k), ...[5, 6, 7, 8, 9, 10, 11, 12].map((k) => '6-espacio-f' + k), '8-espacio-d11'].sort();
  must(v20.total === 585 && v20.nuevos === 372 && v20.pendientes === 0, `v0.2.1: 213 ítems de la v0.1.3 y 372 nuevos, ninguno pendiente de PSP-SR (${JSON.stringify(v20)})`);
  must(v20.validados === 562 && JSON.stringify(v20.corregidos) === JSON.stringify(VEINTITRES), `v0.2.1: 562 validados por PSP-SR; a revisar, solo los 22 de RT-CHF-001-R v1.4 y 1-espacio-i5 (${v20.validados}, ${v20.corregidos})`);
  const v14 = await page.evaluate(() => { const todos = Object.values(BANCO.variantes).flatMap((g) => Object.values(g).flat()); const it = (i) => todos.find((x) => x.id === i);
    const B = JSON.parse(JSON.stringify(BANCO)), b = (i) => Object.values(B.variantes).flatMap((g) => Object.values(g).flat()).find((x) => x.id === i);
    b('6-espacio-f5').pista1 = '¿Qué usás para eso en tu casa?'; b('1-zona-d8').consigna = '¿Cuáles llevan sal?'; b('4-espacio-i13').opciones.find((o) => o.id === 'ok').txt = 'Lavar los utensilios';
    b('3-zona-d7').consigna = 'La receta pide 14 huevos.'; b('1-espacio-d12').opciones[1] = { id: 'fideos_salsa', receta: 'fideos_salsa' };
    const e = b('8-espacio-d11').etapas.find((x) => x.consigna === 'Se terminó el presupuesto.'); Object.assign(e, { consigna: 'No hay queso untable.', falta: 'queso_untable', opciones: [{ id: 'reemplazar', txt: 'Hacerlas solo con mermelada' }, { id: 'cambiar', txt: 'Cambiar de receta' }, { id: 'nada', txt: 'Seguir como si estuviera' }] });
    const d5 = b('4-zona-d5'); d5.correctas_una_de = ['p0', 'p1'];   // bizcochuelo: «Prender el horno» y «Batir» se pueden intercambiar
    for (const k of [6, 8, 9, 11]) { const x = b('4-zona-d' + k); x.opciones = x.opciones.map((o, i) => ({ id: 'p' + [0, 1, 3, 2][i], txt: o.txt })); x.correctas_una_de = ['p3', 'p2']; }
    const v = Motor.validarBanco(B, MODULO).join('\n');
    return { reglas: [/6-espacio-f5: texto con «en tu casa»/, /1-zona-d8: pregunta por un ingrediente que casi todo lleva/, /4-espacio-i13: lavado/, /3-zona-d7: pide 14/, /1-espacio-d12: las dos recetas tienen el mismo/, /8-espacio-d11: el reemplazo/, /4-zona-d5: los pasos cambiados de lugar se pueden hacer/, /4-zona dificil: el paso cambiado de lugar está en el último par/].map((r) => r.test(v)),
      textos: it('6-espacio-f9').pista1 === '¿Qué se usa para eso en la cocina?' && it('1-zona-d8').consigna === '¿Cuáles llevan huevo?' && it('4-espacio-i13').opciones.some((o) => o.txt === 'Lavar el bol y las cucharas')
        && it('3-zona-d7').consigna === 'Para dos tortas necesitamos 14 huevos.' && it('3-zona-d8').consigna === 'Para tres tortas necesitamos 18 huevos.' && it('8-espacio-d11').etapas.some((x) => x.consigna === 'Se terminó el presupuesto.')
        && JSON.stringify(it('1-espacio-d12').opciones.map((o) => o.id)) === '["ensalada_verde","empanadas"]' && !/en tu casa|tu familia/.test(JSON.stringify(BANCO)) }; });
  must(v14.textos, 'RT-CHF-001-R v1.4: los 22 ítems quedan con las correcciones pedidas');
  must(v14.reglas.every(Boolean), `RT-CHF-001-R v1.4: el validador rechaza cada uno de los problemas de la sección 3 (${v14.reglas})`);
  must(v20.harina, 'RT-CHF-001-R v1.3: la opción incorrecta del imprevisto de la harina es siempre «Volver sin comprar»');
  must(v20.o9, 'O9: «Hoy hay un cumpleaños.» y «Vienen visitas a cenar.», en los ítems y en la tabla de situaciones');
  must(v20.merienda, 'T21: con la consigna de la merienda, la otra opción es siempre un plato de cena');
  const t12 = await page.evaluate(() => { const b = JSON.parse(JSON.stringify(BANCO)); b.variantes['6-zona'].facil = b.variantes['6-zona'].facil.slice(0, 7); return Motor.validarBanco(b, MODULO); });
  must(t12.some((e) => /6-zona facil en 3-5: 7 ítems, el mínimo es 8 \(T12\)/.test(e)) && t12.some((e) => /6-zona facil en 6-8: 7 ítems, el mínimo es 12/.test(e)), 'T12: el validador rechaza una combinación por debajo del mínimo');
  const r12 = await page.evaluate(() => { const b = JSON.parse(JSON.stringify(BANCO));
    b.variantes['1-zona'].intermedio[0].fichas[0].receta = 'tostadas';
    const it = b.variantes['8-espacio'].facil.find((x) => x.receta === 'tortas_fritas'); const e = it.etapas.find((x) => x.imprevisto && x.falta); e.falta = 'manteca'; e.consigna = 'No hay manteca.';
    const emp = b.recetas.find((r) => r.id === 'empanadas').pasos.find((p) => p.produce); delete emp.enfria;
    delete b.recetas.find((r) => r.id === 'pizza').sabor; return Motor.validarBanco(b, MODULO); });
  must(r12.some((e) => /C1/.test(e) && /tostadas/.test(e)) && r12.some((e) => /pizza: sin sabor/.test(e)), 'C1: el validador rechaza una receta de «los dos» en dulce y salado, y una receta sin sabor');
  must(r12.some((e) => /C2/.test(e) && /manteca/.test(e)), 'C2: el validador rechaza un faltante que no está en la lista del Rincón 2');
  must(r12.some((e) => /C3/.test(e) && /Rellenar/.test(e)), 'C3: el validador rechaza rellenar con el relleno recién cocinado sin enfriar');
  // D4, condición 2: contorno de 3:1 o más contra todos los fondos, medido en los dibujos tal como se ven
  const d4 = await page.evaluate(() => { const box = document.createElement('div'); document.body.appendChild(box);
    box.innerHTML = Object.keys(BANCO.ingredientes).map((i) => Dibujo.ing(BANCO, i)).join('') + Object.keys(BANCO.utensilios).map((u) => Dibujo.ut(BANCO, u)).join('') + BANCO.recetas.map((r) => Dibujo.receta(BANCO, r.id)).join('');
    const malos = []; let n = 0;
    for (const el of box.querySelectorAll('[fill^="url(#v3-"][stroke]')) { n++; for (const f of Dibujo.FONDOS) { const c = Dibujo.contraste(el.getAttribute('stroke'), f); if (c < 3) malos.push(`${el.getAttribute('stroke')} sobre ${f}: ${c.toFixed(2)}`); } }
    box.remove(); return { n, malos: [...new Set(malos)] }; });
  must(d4.n > 100 && !d4.malos.length, `D4: el contorno de los dibujos con volumen tiene contraste de 3:1 o más contra los fondos (${d4.n} formas; ${d4.malos.slice(0, 3)})`);
  await page.evaluate(() => { window.__caras1318 = []; new MutationObserver(() => { if (S.ruta === '13-18') for (const x of document.querySelectorAll('[data-cara]')) window.__caras1318.push(S.variante || 'cocina'); }).observe(document.body, { subtree: true, childList: true, attributes: true }); });

  let desafios = 0;
  const rutas = ['6-8', '9-12', '3-5', '13-18'];
  for (const ruta of rutas) {
    await page.evaluate((r) => { S.ruta = r; }, ruta);
    const disp = await page.evaluate(() => MODULO.estaciones.variantes.map((v) => [v.variante, Motor.gradosDe(MODULO, S.ruta, v.variante)]));
    for (const [id, gs] of disp) for (const g of gs) {
      const ok = await jugarVariante(page, id, g);
      must(ok, `${ruta} ${id} ${g}: llegó al cierre del rincón`);
      if (ok) {
        must(await page.$('.recetario .receta'), `${id}: tarjeta del recetario al cerrar (CHF-11)`);
        const des = await page.evaluate(() => { const d = document.querySelector('.desafio'); if (!d) return null; const r = BANCO.recetas.find((x) => d.textContent.includes(x.nombre)); return { ok: !!r && r.estado_clinico === 'validado por PSP-SR' && !r.coccion && BANCO.desafio_recetas.includes(r.id), aviso: /alergia/.test(d.textContent) }; });
        if (des) { desafios++; must(des.ok && des.aviso, `${id}: el desafío para casa usa solo recetas validadas por PSP-SR, sin cocción y con el aviso de alergias (O4)`); }
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
      await page.evaluate(() => { cocina(); historia(cocina); });
      const caras = await page.evaluate(() => [...new Set(window.__caras1318)]);
      must(!caras.length, `D4, condición 1: en 13–18 los personajes con cara no se dibujan en ninguna pantalla (${caras})`);
      must(await page.evaluate(async () => { const r = S.ruta; S.ruta = '6-8'; const con = /data-cara/.test(Dibujo.personaje('chef')); S.ruta = '13-18'; const sin = Dibujo.personaje('chef') === '';
        document.body.insertAdjacentHTML('beforeend', '<i data-cara="1" id="control-cara"></i>'); await new Promise((ok) => setTimeout(ok, 50)); const visto = window.__caras1318.length > 0;
        document.getElementById('control-cara').remove(); window.__caras1318 = []; S.ruta = r; return con && sin && visto; }), 'D4: control de la prueba (en 6–8 el chef tiene cara; en 13–18 no se dibuja; el observador detecta una cara)');
      const n = await page.evaluate(() => Motor.rinconesDe(MODULO, '13-18').join(','));
      must(n === '1,2,3,4,6,8', `13–18: solo los rincones con textos propios (${n})`);
    }
  }
  must(desafios > 0, `el desafío para casa aparece con las cuatro recetas validadas por PSP-SR (${desafios} veces)`);
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
  // O8: en 7A Fácil el chef muestra el paso (dibujo y texto) antes de resaltar los botones
  await page.evaluate(() => { S.ruta = '6-8'; S.gradoDe['7-zona'] = 'facil'; S.estrategiaVista.add('7-zona'); S.idx = {}; entrar('7-zona'); });
  const m8 = await page.evaluate(() => ({ txt: document.querySelector('#modelo-txt').textContent, ut: !!document.querySelector('#modelo-ut svg'), visible: !document.querySelector('#modelo').hidden, ofrecida: document.querySelectorAll('.ofrecida').length }));
  must(m8.visible && m8.ut && /^El chef/.test(m8.txt) && m8.ofrecida === 0, `O8: el chef hace el paso primero (${JSON.stringify(m8)})`);
  await page.waitForTimeout(1400);
  must((await page.$$('.ofrecida')).length > 0, 'O8: después se resalta el botón');
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
  must(ordenAlternativo > 0, `O1: se jugaron ítems de ordenar con un orden distinto del de la receta (${ordenAlternativo})`);
  const o1 = await page.evaluate(() => { const b = JSON.parse(JSON.stringify(BANCO)); const it = b.variantes['6-espacio'].dificil.find((x) => x.receta === 'yogur_cereales'); const ok = !!it.orden_parcial; delete it.orden_parcial;
    const v = Motor.validarBanco(b, MODULO); const b2 = JSON.parse(JSON.stringify(BANCO)); b2.variantes['6-espacio'].dificil.find((x) => x.receta === 'yogur_cereales').orden_parcial.pop();
    const ids = Object.values(BANCO.variantes).flatMap((g) => Object.values(g).flat()).filter((x) => x.orden_parcial || (x.etapas || []).some((e) => e.orden_parcial)).map((x) => x.id).sort();
    return { ok, quitado: v.some((e) => /O1/.test(e) && /se pueden intercambiar/.test(e)), incompleto: Motor.validarBanco(b2, MODULO).some((e) => /orden parcial no coincide/.test(e)), ids }; });
  must(o1.ok && o1.quitado && o1.incompleto, 'O1: el validador rechaza un ítem de ordenar sin orden parcial cuando hay pasos intercambiables, y un orden parcial incompleto');
  const O1_V013 = ['4-zona-i1', '4-zona-i4', '6-espacio-d3', '8-espacio-f1', '8-espacio-f5', '8-espacio-i1', '8-espacio-i2', '8-espacio-i4', '8-zona-d3', '8-zona-i3', '8-zona-i4'];
  const O1_NUEVOS = ['4-zona-i5', '4-zona-i7', '6-espacio-d11', '6-espacio-d6', '6-espacio-d7', '8-espacio-d10', '8-espacio-d11', '8-espacio-i10', '8-espacio-i11', '8-zona-d6', '8-zona-f10', '8-zona-f12', '8-zona-f7'];
  must(JSON.stringify(o1.ids) === JSON.stringify([...O1_V013, ...O1_NUEVOS].sort()), `O1: cambian de corrección los 11 ítems de la v0.1.3 y 13 nuevos (${o1.ids})`);
  must(errores.length === 0, 'sin errores de JavaScript: ' + errores.slice(0, 3).join(' | '));
  await browser.close();
  console.log(`chef e2e: ${casos - fallas} de ${casos} verificaciones`);
  process.exit(fallas ? 1 : 0);
})();

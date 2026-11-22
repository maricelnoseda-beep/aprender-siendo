// «Los cuatro exploradores» (FEC-015 v0.3, RT-CEX-001-R v1.0 y RT-CEX-001 v1.1): prueba del motor, de la ficha y del banco, sin navegador.
// Cada bloque cita el requisito de la FEC que cubre (REQ-CLI-EXP-00a a 20) o el pedido de la supervisora del 2026-11-15.
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.join(__dirname, '..', 'app', 'herramientas', 'exploradores');
const html = fs.readFileSync(path.join(dir, 'exploradores.html'), 'utf8');
const banco = JSON.parse(fs.readFileSync(path.join(dir, 'banco.json'), 'utf8'));
const modulo = JSON.parse(fs.readFileSync(path.join(dir, 'modulo.json'), 'utf8'));
const run = (id) => { const ctx = { module: { exports: {} } }; vm.runInNewContext(html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)<\\/script>`))[1], ctx); return ctx.module.exports; };
const M = run('motor'), D = run('dibujo').Dibujo;
let fallas = 0, casos = 0;
const must = (c, m) => { casos++; if (!c) { fallas++; console.error('FALLA:', m); } };
const copia = () => JSON.parse(JSON.stringify(banco));
const errores = (b, m = modulo) => M.validarBanco(b, m);

// ---------- Banco válido ----------
const e0 = errores(banco);
must(e0.length === 0, 'el banco generado pasa la validación: ' + e0.slice(0, 5).join(' | '));
must(M.VAR.length === 10 && new Set(Object.values(M.JUEGO)).size === 8, 'diez variantes en ocho juegos');

// ---------- REQ-CLI-EXP-00: originalidad ----------
must(!/https?:\/\/(?!www\.w3\.org)/.test(html.replace(/<!--[\s\S]*?-->/g, '')), 'REQ-00a: ningún recurso externo');
must(!/<image|<img/.test(html), 'REQ-00a: sin imágenes incrustadas, todo es dibujo propio');
must(!M.ESTILO.test(JSON.stringify(banco)), 'REQ-00b: ningún texto compara con otra obra');

// ---------- Pedido de la supervisora: consignas breves y audio solo con el parlante ----------
must(modulo.audio && modulo.audio.automatico === false, 'audio.automatico es false');
must(!/autoplay/i.test(html), 'sin autoplay');
const llamadas = html.match(/\bdecir\(/g) || [];
must(llamadas.length === 2 && /decir\(b\.dataset\.decir\)/.test(html), 'decir() solo se llama desde el botón con parlante');
for (const t of M.consignas(banco)) must(t.length <= modulo.consigna_breve_max, `consigna larga: ${t}`);
let largo = copia(); const it0 = Object.values(largo.variantes.objetos)[0][0];
it0.consigna = 'x'.repeat(61);
must(errores(largo).some((x) => /consigna más larga/.test(x)), 'el validador rechaza una consigna de más de 60 caracteres');

// ---------- Pedido de la supervisora: mayúscula o minúscula de imprenta ----------
must(JSON.stringify(modulo.letra.opciones) === '["mayuscula","minuscula"]', 'dos formas de letra');
for (const r of Object.keys(modulo.rutas)) must(modulo.letra.por_defecto[r], `letra por defecto para ${r}`);
must(/body\.classList\.toggle\("mayus"/.test(html) && /\.mayus \.nino/.test(html), 'la letra cambia en todo lo que ve quien juega');
const recorrer = (x, f) => { if (Array.isArray(x)) x.forEach((y) => recorrer(y, f)); else if (x && typeof x === 'object') { f(x); Object.values(x).forEach((y) => recorrer(y, f)); } };
// REQ-CLI-EXP-22 y RT-CEX-001-R 3: un ítem por forma de letra, con rasgo; en mayúscula no hay orientación con letras.
const conLetras = [];
for (const [id, gs] of Object.entries(banco.variantes)) for (const [g, its] of Object.entries(gs)) for (const it of its) if (it.lee) conLetras.push({ id, g, it });
must(conLetras.some((x) => x.it.letra_forma === 'mayuscula') && conLetras.some((x) => x.it.letra_forma === 'minuscula'), 'hay ítems con letras en cada forma');
must(!conLetras.some((x) => x.it.letra_forma === 'mayuscula' && x.it.rasgo === 'orientacion'), 'en mayúscula no hay ítems de orientación con letras');
must(conLetras.every((x) => x.g === 'dificil'), 'los ítems con letras van solo en Difícil');
const Lsol = M.itemsDe(banco, 'objetos', 'dificil', '9-12', { lee: true, letra: 'mayuscula' });
must(Lsol.every((it) => !it.letra_forma || it.letra_forma === 'mayuscula') && Lsol.some((it) => it.letra_forma), 'con mayúscula solo se ofrecen los ítems de mayúscula');
let malaLetra = copia(); malaLetra.variantes.objetos.dificil.find((it) => it.letra_forma === 'mayuscula').rasgo = 'orientacion';
must(errores(malaLetra).some((x) => /orientación con letras/.test(x)), 'el validador rechaza orientación con letras en mayúscula');
let espejo = copia(); espejo.variantes.objetos.dificil.find((it) => it.letra_forma === 'mayuscula').letras[1] = 'Ǝ';
must(errores(espejo).some((x) => /no está en el conjunto validado/.test(x)), 'el validador rechaza letras fuera del conjunto validado (letras espejadas)');
must(/aplicarLetraPendiente/.test(html) && /S\.letraPendiente = /.test(html), 'con un ítem en curso, la letra rige desde el siguiente');
const reg0 = M.registro({ variante: 'objetos', juego: 1, tipo_letra: 'minuscula', con_letras: true, habilidad: 'discriminacion-visual', apoyos: [], tipos_error: [] });
const reg1 = M.registro({ variante: 'objetos', juego: 1, tipo_letra: 'mayuscula', con_letras: true, habilidad: 'discriminacion-visual', apoyos: [], tipos_error: [] });
must(reg0.tipo_letra === 'minuscula' && M.vistaPorHabilidad([reg0, reg1]).length === 2, 'tipo_letra registrado y resultado aparte por tipo de letra');

// ---------- RT-CEX-001-R: textos validados, historia y lugares ----------
for (const t of M.textosBreves(banco)) must(t.length <= 60, `texto de más de 60 caracteres: ${t}`);
must(banco.historia.laminas.length === 5 && banco.historia.laminas.every((l) => l.frases.length === 2), 'historia de cinco láminas con dos frases');
must(banco.historia.laminas[0].frases[0] === 'Luna, Tomás, Roco y Michi encuentran un mapa viejo.', 'texto de la historia de PSP-SR');
must(/escucharHistoria/.test(html) && banco.textos.nino.escucharHistoria === 'Escuchar la historia', '«Escuchar la historia»');
const lugares = Object.fromEntries(modulo.estaciones.variantes.map((v) => [v.variante, v.lugar]));
must(lugares.niebla === 'El puente de la niebla' && lugares.laberinto === 'El laberinto de Roco' && lugares.pistas_nuevas === 'El campamento nuevo' && lugares.sombras === 'El bosque de las sombras', 'nombres de los lugares (2.2)');
must(M.lugaresDe(modulo, '6-8').length === 9 && M.lugaresDe(modulo, '3-5').length === 7, '8B tiene lugar propio: 9 lugares en 6–8 y 7 en 3–5');
must(banco.estrategias.objetos.asi_se_juega === 'Guardá en la caja las cosas iguales al modelo.', '«Así se juega» de PSP-SR');
must(banco.ayudas.cofre_cuales['1'] === '¿Le pusiste nombre?' && banco.textos.nino.demostracion === 'Así se resuelve este paso. Ahora probá vos.', 'ayudas de nivel 1 y frase de la demostración');
// RT-CEX-001-R v1.1 B.2.1: «validado por PSP-SR» solo en lo que PSP-SR validó; lo nuevo o cambiado dice qué cambió y queda para revisar.
const todos = []; for (const [id, gs] of Object.entries(banco.variantes)) for (const [g, its] of Object.entries(gs)) for (const it of its) todos.push({ id, g, it });
must(todos.every(({ it }) => it.estado_clinico === 'validado por PSP-SR' || (/pendiente de revisión de PSP-SR/.test(it.estado_clinico) && it.cambio_v030)), 'cada ítem está validado o dice qué cambió y queda pendiente de revisión');
must(todos.filter(({ it }) => it.estado_clinico === 'validado por PSP-SR' && !it.cambio_v030).length + todos.filter(({ it }) => it.cambio_v030 && it.cambio_v030 !== 'nuevo (D.1)').length === 186, 'los 186 ítems revisados por PSP-SR siguen en el banco (sin cambios o con el cambio declarado)');
must(todos.filter(({ it }) => it.cambio_v030 === 'nuevo (D.1)').every(({ it }) => /pendiente de revisión/.test(it.estado_clinico)), 'los ítems nuevos no llevan la marca de validado');
must(!/pendiente de PSP-SR \(RT-CEX-001\)"/.test(JSON.stringify(banco.variantes)), 'ningún ítem queda con la marca «propuesta de DEV-IA»');

// ---------- RT-CEX-001-R v1.1: correcciones de PSP-SR ----------
const item = (id) => todos.find((x) => x.it.id === id).it;
must(banco.historia.laminas[1].frases[1] === 'En el camino al tesoro hay muchos retos.' && banco.historia.laminas[3].frases[0] === '¡Vos también sos parte del equipo!', 'B.2.5: láminas 2 y 4');
must(/^Acompañá .*Podés tocar/.test(banco.historia.guia_adulto_3_5), 'B.2.2: texto para la persona adulta con voseo');
must(Object.values(banco.textos.adulto).every((t) => typeof t !== 'string' || !/\(D\d|Juego \d/.test(t)), 'B.2.3: sin códigos internos ni números de juego en los textos para la persona adulta');
let codigo = copia(); codigo.textos.adulto.audio += ' (D7)';
must(errores(codigo).some((x) => /código interno/.test(x)), 'el validador rechaza un código interno a la vista');
must(banco.textos.adulto.sinTrazoFino === 'Sin trazo fino (La fábrica de caminos): se arma tocando los puntos en orden. Así se practica el orden, no el trazo.', 'B.2.4: «sin trazo fino» en lenguaje llano');
must(banco.ideas_fuera_por_ruta['3-5']['5'] === 'Uno esconde un juguete y da pistas: está arriba, abajo o al lado de algo.' && /ideas_fuera_por_ruta/.test(html), 'B.2.6: idea fuera de la pantalla del Juego 5 sin derecha ni izquierda en 3–5');
must(banco.devoluciones.error.objetos['*'] === 'Se parece. Mirá otra vez los detalles.' && banco.devoluciones.error.objetos.forma && banco.devoluciones.error.objetos.color, 'B.2.7: devoluciones del Juego 1');
must(banco.devoluciones.error.sombras['*'] === 'Mirá bien la forma de la sombra.' && !/color/.test(JSON.stringify(banco.devoluciones.error.sombras)), 'B.2.7 y E.5: el Juego 2 no habla del color de la sombra');
must(banco.devoluciones.error.laberinto.relacion === 'Mirá otra vez dónde está cada cosa.' && banco.devoluciones.error.laberinto['confusion-vertical'] === 'Mirá otra vez dónde está cada cosa.', 'B.2.7: devoluciones del Juego 5');
// B.2.8: Difícil de los Juegos 1, 2, 3 y 7A y todo 8B declaran rutas sin 3–5, y el filtro de rutas no los ofrece en 3–5.
for (const { id, g, it } of todos) if ((g === 'dificil' && ['objetos', 'sombras', 'niebla', 'cofre_cuales'].includes(id)) || id === 'pistas_nuevas')
  must(Array.isArray(it.rutas) && !it.rutas.includes('3-5'), `B.2.8: ${it.id} declara rutas sin 3–5`);
for (const id of ['objetos', 'sombras', 'niebla', 'cofre_cuales']) must(!M.gradosDe(modulo, '3-5', id).includes('dificil'), `B.2.8: ${id} no publica Difícil en 3–5`);
let sinRuta = copia(); delete sinRuta.variantes.objetos.dificil[0].rutas;
must(M.itemsDe(sinRuta, 'objetos', 'dificil', '3-5', { lee: false }).length > 0 && !M.gradosDe(modulo, '3-5', 'objetos').includes('dificil'), 'B.2.8: aunque un ítem no declarara rutas, la ficha no ofrece Difícil en 3–5');
// B.1
must(['obj-d2', 'obj-d3'].every((k) => { const it = item(k); return it.objetos.some((o) => o.f !== it.modelo.f && o.m === it.modelo.m); }), 'B.1: obj-d2 y obj-d3 tienen otra forma con la misma marca');
must(item('obj-d4').consigna === '¿En qué se parecen estas dos? Elegí una.' && banco.textos.nino.criterios.forma === 'La forma', 'B.1 y E.2: consigna y botones de «¿En qué se parecen?»');
must(!item('obj-d8').letras.includes('u'), 'B.1: obj-d8 sin la u');
let nu = copia(); nu.variantes.objetos.dificil.find((it) => it.id === 'obj-d8').letras[1] = 'u';
must(errores(nu).some((x) => /orientación/.test(x)), 'E.1: el validador rechaza n y u en un ítem de detalle');
for (const { id, g, it } of todos) if (id === 'jardin' && (g === 'intermedio' || (it.rutas || []).includes('3-5'))) {
  must(/iguales a est[ae]\.$/.test(it.consigna), `E.3: ${it.id} usa la plantilla «iguales a esta»`);
  const n = +((it.consigna.match(/ (\d) /) || [])[1]); must(n === it.cantidad && it.elementos.filter((e) => e.objetivo).length === n, `E.3: ${it.id} tiene exactamente ${n} objetivos`);
}
for (const k of ['jar-d5', 'jar-d6', 'jar-d7', 'jar-d8']) { const it = item(k);
  must(it.elementos.length >= 28 && it.elementos.length <= 30 && it.elementos.some((e) => !e.objetivo && e.f === it.modelo.f), `B.1: ${k} con 28 a 30 elementos y distractores de la misma categoría`); }
for (const { id, it } of todos) if (id === 'laberinto' && it.tipo === 'mover' && !it.plan_previo) {
  must(!/adelante|atrás/.test(it.consigna), `E.4: ${it.id} no dice «adelante» ni «atrás»`);
  for (const w of ['arriba', 'abajo', 'derecha', 'izquierda']) if (it.consigna.includes(w)) must(it.secuencia.includes(w), `E.4: ${it.id}: «${w}» en la consigna y en el botón`);
}
for (const { id, it } of todos) if (id === 'laberinto' && it.tipo === 'relacion') must(/^Mirá dónde está (el|la) /.test(it.ayuda2 || ''), `C.3: ${it.id} nombra su objeto de referencia en la ayuda`);
const rumbo = (P, a, b) => [Math.sign(P[b].x - P[a].x), Math.sign(P[b].y - P[a].y)].join();
const pts = (it) => { const o = []; for (let y = 0; y < it.filas; y++) for (let x = 0; x < it.cols; x++) o.push({ x, y }); return o; };
must(new Set(item('fab-i5').modelo.map(([a, b]) => rumbo(pts(item('fab-i5')), a, b))).size >= 2 && item('fab-i5').modelo.length >= 2, 'B.1: fab-i5 cambia de dirección');
for (const { id, it } of todos) if (it.tipo === 'tablero') { const P = pts(it);   // ningún segmento pasa por encima de otro punto (sería una trampa al tocar)
  must(it.modelo.every(([a, b]) => { const dx = P[b].x - P[a].x, dy = P[b].y - P[a].y, g = (u, v) => (v ? g(v, u % v) : Math.abs(u)); return g(dx, dy) === 1; }), `${it.id}: ningún segmento pasa por encima de otro punto`); }
const estimulos = (it) => JSON.stringify([it.mostrar, it.sondas, it.secuencia, it.opciones]);
must(todos.filter(({ id }) => id === 'cofre_cuales' || id === 'cofre_orden').every(({ it }) => !/"cofre"/.test(estimulos(it))), 'B.1 y B.3: el cofre no es estímulo en el Juego 7');
// D.1: al menos 12 por variante, grado y forma de letra en 6–8
for (const id of M.VAR) for (const g of M.gradosDe(modulo, '6-8', id)) for (const letra of ['mayuscula', 'minuscula'])
  must(M.itemsDe(banco, id, g, '6-8', { lee: true, letra }).length >= modulo.items_minimos_paquete['6-8'], `D.1: ${id}/${g}/6-8/${letra} tiene al menos 12 ítems`);
// Recorridos con solución (Juego 5 Difícil y 8B Difícil)
const bfs = (it, a, b) => { const pared = new Set((it.paredes || []).map(([x, y]) => x + ',' + y)), vis = new Set([a.x + ',' + a.y]), q = [a];
  while (q.length) { const c = q.shift(); if (c.x === b.x && c.y === b.y) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = { x: c.x + dx, y: c.y + dy }, k = n.x + ',' + n.y; if (n.x >= 0 && n.y >= 0 && n.x < it.cols && n.y < it.filas && !pared.has(k) && !vis.has(k)) { vis.add(k); q.push(n); } } }
  return false; };
for (const { id, g, it } of todos) {
  if (id === 'laberinto' && it.plan_previo) must(bfs(it, it.roco, it.pasa_por) && bfs(it, it.pasa_por, it.meta), `${it.id}: el recorrido tiene solución`);
  if (id === 'pistas_nuevas' && it.tipo === 'recorrido') { let a = it.roco; must(it.orden.every((i) => { const ok = bfs(it, a, it.objetos[i]); a = it.objetos[i]; return ok; }), `${it.id}: el recorrido tiene solución`); }
}
const escenas = todos.filter(({ id, it }) => (id === 'objetos' && it.tipo === 'diferencias') || (id === 'pistas_nuevas' && it.tipo === 'campamento')).map(({ it }) => JSON.stringify(it.a || it.elementos));
must(new Set(escenas).size === escenas.length, 'D.1: ninguna escena del claro ni del campamento se repite');
must(Array.isArray(banco.lugares.lista) && banco.lugares.lista.length === 9 && banco.lugares.lista.some((l) => l.nombre === 'El campamento nuevo'), 'D.2: los lugares del mapa también están en el banco');
must(banco.textos.nino.contar.opciones_resulto.every((o) => o.pictograma && !o.cara) && /function pictograma/.test(html), 'C.3: pictogramas propios en vez de emojis');
must(banco.nombres.pina === 'piña de pino' && banco.textos.nino.anterior === 'Volver', 'C.3: «piña de pino» y «Volver»');

// ---------- REQ-CLI-EXP-17 y D6: rutas ----------
must(!modulo.rutas['13-18'] && modulo.rutas_excluidas['13-18'], 'ruta 13–18 excluida');
must(!M.gradosDe(modulo, '3-5', 'pistas_relampago').length && !M.gradosDe(modulo, '3-5', 'pistas_nuevas').length, '8A y 8B no van en 3–5');
let r1318 = copia(); Object.values(r1318.variantes.objetos)[0][0].rutas = ['13-18'];
must(errores(r1318).some((x) => /13–18/.test(x)), 'el validador rechaza un ítem en 13–18');

// ---------- REQ-CLI-EXP-12: color nunca es el único rasgo; pares validados ----------
let col = copia(); let puesto = false;
recorrer(col.variantes, (o) => { if (!puesto && o.rasgo === 'color' && o.colores) { o.colores = ['rojo', 'verde']; puesto = true; } });
if (puesto) must(errores(col).some((x) => /par validado/.test(x)), 'el validador rechaza un par de colores no validado');

// ---------- M10 por variante (5.17) ----------
const h = (ac, ay = false) => ({ acierto: ac, conAyuda: ay });
must(M.ajusteM10([h(1), h(1), h(1), h(1)], 'facil').grado === 'facil', 'M10-2: menos de 5 ítems no cambia');
must(M.ajusteM10(Array(6).fill(h(1)), 'facil').grado === 'intermedio', 'M10-3: sube con 85 % y 70 % sin ayuda');
must(M.ajusteM10(Array(6).fill(h(1, true)), 'facil').grado === 'facil', 'M10-3: no sube si fue con ayuda');
must(M.ajusteM10(Array(6).fill(h(1)), 'facil', { yaSubio: true }).grado === 'facil', 'un paso por sesión');
must(M.ajusteM10([h(0), h(0), h(0), h(1), h(1)], 'intermedio').grado === 'facil', 'M10-5: baja con menos de 60 %');
must(M.ajusteM10([], 'dificil', { erroresSeguidos: 3 }).grado === 'intermedio', 'M10-5: tres errores seguidos bajan un grado');
must(M.ajusteM10(Array(6).fill(h(0)), 'dificil', { fijo: true }).grado === 'dificil', 'M10-9: grado fijado');
must(M.ajusteM10(Array(6).fill(h(1)), 'intermedio', { grados: ['facil', 'intermedio'] }).grado === 'intermedio', 'no sube más allá de lo que la ruta publica');

// ---------- Apoyos 0–3 y retiro progresivo ----------
must(M.siguienteApoyo(3).nivel === 2 && M.siguienteApoyo(2).nivel === 1 && M.siguienteApoyo(1).nivel === 0 && M.siguienteApoyo(1).destacar, 'retiro progresivo');
must(M.autonomia(0) !== M.autonomia(3), 'autonomía según el apoyo máximo');

// ---------- REQ-CLI-EXP-18: error repetido ----------
const cuenta = {};
must(M.tipoRepetido(cuenta, ['forma']) === null && M.tipoRepetido(cuenta, ['forma']) === null && M.tipoRepetido(cuenta, ['forma']) === 'forma', 'tres veces el mismo tipo de error');
must(M.itemPorRasgo([{ rasgo: 'tamano' }, { rasgo: 'forma' }], 'forma') === 1 && M.itemPorRasgo([{ rasgo: 'tamano' }], 'se-guio-por-tamano') === 0, 'ítem por rasgo');

// ---------- REQ-CLI-EXP-09/10: trazo ----------
must(M.habilidadDe(modulo, 'fabrica', {}, { sinTrazoFino: true }) === 'organizacion-y-planificacion', 'sin trazo fino se imputa a planificación');
const cam = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
const p = M.precisionTrazo([{ x: 10, y: 1 }, { x: 50, y: 40 }, { x: 90, y: 2 }], cam, 10);
must(p.precision_trazo === 0.67 && p.salidas === 1 && Object.keys(p).length === 2, 'solo salen precisión y salidas');
must(M.tolerancia(10, 'touch', 1000) > M.tolerancia(10, 'mouse', 1000) && M.tolerancia(10, 'mouse', 400) > M.tolerancia(10, 'mouse', 1000), 'tolerancia por entrada y pantalla');
must(M.faltanSegmentos([[1, 2], [2, 3]], new Set([M.claveSeg(2, 1)])).join() === '2-3', 'segmentos sin dirección');

// ---------- REQ-CLI-EXP-08: 8A ----------
const x = modulo.exposicion_8a;
let est = { ms: x.min_ms };
must(M.exposicionSiguiente(est, 1, x).ms === x.min_ms, 'nunca baja del mínimo');
must(M.exposicionSiguiente({ ms: 2000 }, 0.9, x).ms < 2000 && M.exposicionSiguiente({ ms: 1700, anterior: 2000 }, 0.5, x).ms === 2000, 'se acorta solo con 85 % y vuelve si baja');
must(M.cambiosPorSegundo(x.min_ms, x.pausa_ms) < 3, 'menos de 3 cambios por segundo');
must(M.exposicionSiguiente({ ms: 1050 }, 1, x, { ruta: '6-8' }).ms === 1000, 'en 6–8 la exposición no baja de 1000 ms');
must(M.exposicionSiguiente({ ms: 2000 }, 1, x, { ruta: '9-12', yaAcorto: true }).ms === 2000, 'nunca más de un acortamiento por sesión');
must(M.acierto('fabrica', { errores: 0, extra: { precision_trazo: 0.65 } }, modulo, '3-5') && !M.acierto('fabrica', { errores: 0, extra: { precision_trazo: 0.65 } }, modulo, '6-8'), 'Juego 6: 0,6 en 3–5 y 0,7 en las demás');

// ---------- Acierto y registro mínimo (§8) ----------
must(M.acierto('fabrica', { errores: 0, extra: { precision_trazo: 0.5 } }, modulo) === false && M.acierto('objetos', { errores: 0, extra: {} }, modulo), 'criterio de acierto');
const reg = M.registro({ variante: 'objetos', juego: 1, errores: 2, apoyo_max: 2, extra: { trazo: [[1, 2]], precision: 1.7, nombre: 'Ana' } });
must(!('trazo' in reg.extra) && !('nombre' in reg.extra) && reg.extra.precision === 1, 'el registro descarta lo que no está en la lista y acota valores');
const vista = M.vistaPorHabilidad([reg]);
must(vista.length === 1 && !('puntaje' in vista[0]), 'vista por habilidad sin puntaje global');

// ---------- IDV-CEX-001 v0.1 (propuesta de PSP-SR, pendiente de aprobación) ----------
const IV = modulo.identidad_visual;
must(IV && /pendiente de aprobación/.test(IV._estado) && !/aprobad[oa] por la supervisora/.test(IV._estado), 'IDV: queda como propuesta pendiente, no como aprobada');
must(IV.estaciones.map((e) => e.estacion).join() === 'explorar,reconocer,integrar,transferir', 'IDV: cuatro Estaciones en orden');
for (const e of IV.estaciones) {
  must(IV.paleta[e.color] && D.F[e.personaje], `IDV: color y personaje de ${e.estacion}`);
  const vs = modulo.estaciones.variantes.filter((v) => v.estacion === e.estacion);
  must(vs.length > 0, `IDV: ${e.estacion} tiene juegos en el reparto D5`);
}
must(/\.celda\.salida\{/.test(html) && /class="salida-txt"/.test(html) && banco.textos.nino.salida, 'IDV: la salida del laberinto lleva su nombre escrito');
must(/border:3px dashed #8CC9A8/.test(html) && /\.ficha:where\(/.test(html) && /class="redonda"/.test(html), 'IDV: ficha redonda');
must(/data-variante="\$\{S\.variante\}"/.test(html), 'IDV: el marco del reto declara la variante');
must(/function mapaEstaciones/.test(html) && /\$\{mapaEstaciones\(\)\}/.test(html), 'IDV: mapa de la aventura en la pantalla adulta');
must(!/circle cx="110" cy="260"/.test(html), 'IDV: el claro del reto queda liso');

// ---------- Dibujos ----------
recorrer(banco.variantes, (o) => { if (typeof o.f === 'string') must(D.F[o.f], `figura ${o.f} sin dibujo`); });

console.log(`${casos - fallas}/${casos} verificaciones de Los cuatro exploradores`);
process.exit(fallas ? 1 : 0);

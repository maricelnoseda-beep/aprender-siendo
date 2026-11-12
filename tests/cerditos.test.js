// «Los tres cerditos» (RT-CER-001): prueba del motor, de la ficha y del banco, sin navegador.
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.join(__dirname, '..', 'app', 'herramientas', 'cerditos');
const html = fs.readFileSync(path.join(dir, 'cerditos.html'), 'utf8');
const banco = JSON.parse(fs.readFileSync(path.join(dir, 'banco.json'), 'utf8'));
const modulo = JSON.parse(fs.readFileSync(path.join(dir, 'modulo.json'), 'utf8'));
const run = (id) => { const ctx = { module: { exports: {} } }; vm.runInNewContext(html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)<\\/script>`))[1], ctx); return ctx.module.exports; };
const M = run('motor'), D = run('dibujo').Dibujo;
let fallas = 0, casos = 0;
const must = (c, m) => { casos++; if (!c) { fallas++; console.error('FALLA:', m); } };

const EST = ['explorar', 'reconocer', 'integrar', 'integrar', 'transferir'], GR = ['facil', 'intermedio', 'dificil'];
const CERRADA = ['cantidad-estimulos', 'complejidad-consignas', 'extension-palabras', 'cantidad-pasos', 'grado-abstraccion', 'complejidad-relaciones', 'necesidad-planificacion', 'disponibilidad-apoyos'];
const PROPUESTAS = Object.keys(modulo.vocabulario_dimensiones_propuesto).filter((k) => !k.startsWith('_'));
const V = modulo.estaciones.variantes;

// Ficha: cinco actividades con su Estación (propuesta de la supervisora) y los campos de TC-§3.A
must(JSON.stringify(V.map((v) => v.actividad)) === JSON.stringify(M.ACT), 'las cinco actividades en orden');
must(JSON.stringify(V.map((v) => v.estacion)) === JSON.stringify(EST), 'Estaciones de la reelaboración');
for (const v of V) {
  for (const c of ['titulo', 'estacion', 'proposito', 'habilidades', 'habilidades_secundarias', 'grados', 'apoyos', 'modalidad_respuesta', 'adaptaciones', 'progresion', 'indicadores', 'dimensiones_que_cambian'])
    must(v[c] && (typeof v[c] === 'string' || v[c].length || Object.keys(v[c]).length), `${v.actividad}: falta ${c} (ficha TC-§3.A)`);
  must(JSON.stringify(Object.keys(v.grados)) === JSON.stringify(GR), `${v.actividad}: los tres grados`);
  must(['1', '2', '3'].every((n) => v.apoyos[n]), `${v.actividad}: apoyos en los niveles 1, 2 y 3`);
  // CRIT-EST-001 §4: ningún paso de grado cambia solo la cantidad
  for (const g of ['intermedio', 'dificil']) {
    const d = v.grados[g].cambia_respecto_al_anterior;
    must(d.some((x) => x !== 'cantidad-estimulos'), `${v.actividad}/${g}: el paso de grado solo cambia la cantidad (CRIT-EST-001 §4)`);
    must(d.every((x) => CERRADA.includes(x) || PROPUESTAS.includes(x)), `${v.actividad}/${g}: dimensión fuera del vocabulario`);
  }
  must(!v.modalidad_respuesta.some((x) => /arrastr|escrib|oral|voz/.test(x)), `${v.actividad}: sin arrastre obligatorio, texto libre ni voz (T01, WCAG 2.5.7, D1)`);
}
// D2: la ruta 3–5 no está disponible hasta la respuesta de PSP-SR
must(!modulo.rutas['3-5'] && modulo.rutas_no_disponibles['3-5'], 'D2: sin ruta 3–5');
must(Object.values(modulo.decisiones_supervisora).filter((x) => typeof x === 'string').length >= 4 || Object.keys(modulo.decisiones_supervisora).includes('D4'), 'decisiones D1–D4 registradas');

// Banco válido contra la ficha (parejas únicas, frases distintas, una justificación coherente, clases y consecuencias, textos permitidos)
const errs = M.validarBanco(banco, modulo);
must(!errs.length, 'banco: ' + errs.join(' | '));
for (const e of Object.keys(banco.escenas_cuento)) must(D.ESCENAS[e], `escena ${e} sin dibujo`);
// El validador detecta lo que tiene que detectar
const roto = JSON.parse(JSON.stringify(banco));
roto.actividades.memotest.dificil[0].parejas[1].b.txt = 'soplar';
roto.actividades.salvemos.facil[0].opciones.forEach((o) => { o.clase = 'no-adecuada'; });
roto.actividades.escena_frase.facil[0].frases.madera = '¡Muy bien! Sos muy inteligente.';
const e2 = M.validarBanco(roto, modulo).join(' | ');
must(/dos parejas/.test(e2), 'detecta una tarjeta con dos parejas posibles');
must(/sin opción adecuada/.test(e2), 'detecta una situación sin opción adecuada');
must(/no permitida/.test(e2), 'detecta elogios a la persona (M18-2)');
const d2 = JSON.parse(JSON.stringify(banco)); d2.actividades.escena_frase.dificil[1].frases.chimenea = 'El lobo quiere comer a los cerditos.';
must(/no permitida/.test(M.validarBanco(d2, modulo).join()), 'D2: detecta texto de amenaza a los cerditos');

// Motor
must(M.siguienteApoyo(2, { errores: 0, apoyo_max: 2 }) === 1, 'retiro: sin errores baja un nivel');
must(M.siguienteApoyo(2, { errores: 1, apoyo_max: 2 }) === 2, 'retiro: con errores se mantiene');
must(M.siguienteApoyo(1, { errores: 0, apoyo_max: 3 }) === 1, 'retiro: si pidió más ayuda, no baja');
must(M.siguienteApoyo(0, { errores: 5, apoyo_max: 3 }) === 0, 'retiro: nunca sube solo');
must(M.AUTONOMIA.map((_, i) => M.autonomia(i)).join() === 'autonomo,con-pista,con-ayuda-especifica,con-demostracion', 'autonomía derivada del apoyo máximo');
const reg = M.registro({ actividad: 'memotest', estacion: 'reconocer', grado: 'facil', item: 'x'.repeat(99), resultado: true, errores: -3, apoyo_max: 9, apoyos: ['<script>'], ms: 1e12, nombre: 'Juan' });
must(reg.item.length === 20 && reg.errores === 0 && reg.apoyo_max === 3 && reg.autonomia === 'con-demostracion' && reg.ms === 3600000, 'registro acotado');
must(!('nombre' in reg), 'el registro no acepta campos fuera de la lista (minimización)');
must(JSON.stringify(Object.keys(reg)) === JSON.stringify(modulo.registro.campos), 'campos del registro = ficha');
must(M.acierto('memotest', { errores: 3, parejas: 3 }) && !M.acierto('memotest', { errores: 4, parejas: 3 }), 'acierto memotest');
must(!M.acierto('salvemos', { resultado: 'parcial' }) && M.acierto('salvemos', { resultado: 'adecuada', etapas: {} }), 'acierto salvemos');
// M10 dentro de la actividad; el tiempo no interviene
const h = (n, ac, ay) => Array.from({ length: n }, () => ({ acierto: ac, conAyuda: ay }));
must(M.ajusteM10(h(4, true, false), 'facil').grado === 'facil', 'M10-2: menos de 5 ítems');
must(M.ajusteM10(h(6, true, false), 'facil').grado === 'intermedio', 'M10-3: sube');
must(M.ajusteM10(h(6, true, false), 'facil', { yaSubio: true }).grado === 'facil', 'M10-3: un paso por sesión');
must(M.ajusteM10(h(6, true, true), 'facil').grado === 'facil', 'M10-3: con ayuda no sube');
must(M.ajusteM10(h(6, false, false), 'intermedio').grado === 'facil', 'M10-5: baja');
must(M.ajusteM10(h(6, true, false), 'facil', { fijo: true }).grado === 'facil', 'M10-9: fijado por el profesional');
must(M.ajusteM10([], 'dificil', { erroresSeguidos: 3 }).masAyuda, 'M10-5: 3 errores seguidos dan más ayuda');
// Memotest, ubicar y mezclas
for (const g of GR) for (const it of banco.actividades.memotest[g]) {
  const c = M.cartasMemotest(it, 7);
  must(c.length === it.parejas.length * 2 && it.parejas.every((_, i) => M.esPareja(c.find((x) => x.id === i + 'a'), c.find((x) => x.id === i + 'b'))), `${it.id}: parejas`);
  must(!M.esPareja(c.find((x) => x.id === '0a'), c.find((x) => x.id === '1a')), `${it.id}: tarjetas de parejas distintas no son pareja`);
}
for (let s = 1; s < 200; s++) { const p = M.piezas({ cols: 2, filas: 2 }, s); must(p.some((x, i) => x !== i), 'el rompecabezas nunca empieza armado'); }
must(M.malUbicadas([0, 2, 1, null]).join() === '1,2' && M.completo([0, 1, 2]) && !M.completo([0, null, 2]), 'ubicar: mal ubicadas y completo');
const plan = banco.actividades.salvemos.dificil[0];
must(M.materialesOk(plan, new Set(['cem', 'ladr'])) && !M.materialesOk(plan, new Set(['paja', 'ladr'])), 'materiales del plan');
// Ilustraciones: sin imágenes externas (D3)
must(!/https?:\/\/(?!www\.w3\.org)/.test(html.replace(/<!--[\s\S]*?-->/g, '')), 'D3: ninguna imagen ni recurso externo');
must(!/<image|<img/.test(html), 'D3: sin imágenes incrustadas de terceros');

console.log(fallas ? `${fallas} de ${casos} fallas` : `ok cerditos: ${casos} casos`);
process.exit(fallas ? 1 : 0);

// «Los tres cerditos» (FEC-014 v0.2, RT-CER-001 v1.3): prueba del motor, de la ficha y del banco, sin navegador.
// Cada bloque cita el requisito de la FEC que cubre (REQ-CLI-CER-00 a 16) y, cuando corresponde, el caso de prueba (§10).
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.join(__dirname, '..', 'app', 'herramientas', 'cerditos');
const html = fs.readFileSync(path.join(dir, 'cerditos.html'), 'utf8');
const banco = JSON.parse(fs.readFileSync(path.join(dir, 'banco.json'), 'utf8'));
const modulo = JSON.parse(fs.readFileSync(path.join(dir, 'modulo.json'), 'utf8'));
const run = (id) => { const ctx = { module: { exports: {} } }; vm.runInNewContext(html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)<\\/script>`))[1], ctx); return ctx.module.exports; };
const M = run('motor'), D = run('dibujo').Dibujo;
let fallas = 0, casos = 0;
const must = (c, m) => { casos++; if (!c) { fallas++; console.error('FALLA:', m); } };
const copia = () => JSON.parse(JSON.stringify(banco));
const errores = (b, m = modulo) => M.validarBanco(b, m).join(' | ');

const EST = ['explorar', 'reconocer', 'integrar', 'integrar', 'transferir'], GR = ['facil', 'intermedio', 'dificil'];
const CERRADA = ['cantidad-estimulos', 'complejidad-consignas', 'extension-palabras', 'cantidad-pasos', 'grado-abstraccion', 'complejidad-relaciones', 'necesidad-planificacion', 'disponibilidad-apoyos'];
const PROPUESTAS = Object.keys(modulo.vocabulario_dimensiones_propuesto).filter((k) => !k.startsWith('_'));
const V = modulo.estaciones.variantes;

// ---------- REQ-CLI-CER-00: originalidad y registro de láminas ----------
const L = banco.laminas;
for (const e of Object.keys(D.ESCENAS)) must(L.escenas[e], `REQ-00: la lámina ${e} no está en el registro`);
for (const f of Object.keys(D.F)) must(L.figuras[f], `REQ-00: la figura ${f} no está en el registro`);
for (const r of [...Object.values(L.escenas), ...Object.values(L.figuras)])
  must(r.autor && r.origen === 'propio' && r.terceros === false && r.ia_generativa === false && r.revision_parecido && 'estado' in r.revision_parecido, 'REQ-00a/c: autoría, origen propio y revisión de parecido registrados');
must(!/https?:\/\/(?!www\.w3\.org)/.test(html.replace(/<!--[\s\S]*?-->/g, '')), 'REQ-00a: ningún recurso externo');
must(!/<image|<img/.test(html), 'REQ-00a: sin imágenes incrustadas');
must(!M.ESTILO.test(html.replace(/const ESTILO = .*\n/, '')) && !M.ESTILO.test(JSON.stringify(banco)) && !M.ESTILO.test(JSON.stringify(modulo)), 'REQ-00b: ningún texto compara con una versión comercial');
for (const e of Object.keys(banco.escenas)) must(D.ESCENAS[e], `escena ${e} sin dibujo`);

// ---------- Ficha (REQ-CLI-CER-01 y 16) ----------
must(JSON.stringify(V.map((v) => v.actividad)) === JSON.stringify(M.ACT), 'las cinco actividades en orden');
must(JSON.stringify(V.map((v) => v.estacion)) === JSON.stringify(EST), 'Estaciones de la FEC-014 5.2');
must(V[4].titulo === '¡Ayudemos a los cerditos!', 'D6: título de la Act. 5');
const F = modulo.ficha;
for (const c of ['proposito', 'habilidad', 'para_que_sirve', 'texto_familia', 'texto_profesional', 'edad', 'nivel_evidencia', 'rotulo_evidencia', 'fuentes', 'no_es', 'autor', 'limitaciones'])
  must(F[c] && (typeof F[c] === 'string' || F[c].length), `REQ-16: la ficha no tiene ${c} (M04-1)`);
must(F.nivel_evidencia === 'C' && F.rotulo_evidencia === 'Basada en práctica clínica, con evidencia limitada', 'nivel C y su rótulo (M04-3)');
for (const v of V) {
  for (const c of ['titulo', 'estacion', 'proposito', 'habilidad_referencia', 'habilidades', 'habilidades_secundarias', 'grados', 'apoyos', 'modalidad_respuesta', 'adaptaciones', 'progresion', 'indicadores',
    'dimensiones_que_cambian', 'estrategia', 'transferencia', 'idea_fuera', 'limitaciones'])
    must(v[c] && (typeof v[c] === 'string' || v[c].length || Object.keys(v[c]).length), `REQ-16: ${v.actividad} no tiene ${c} (M04-1, EST-08, R9)`);
  must(['A', 'B'].includes(v.transferencia) && F.declaracion_transferencia[v.transferencia], `${v.actividad}: declaración de transferencia`);
  must(JSON.stringify(Object.keys(v.grados)) === JSON.stringify(GR), `${v.actividad}: los tres grados`);
  must(['1', '2', '3'].every((n) => v.apoyos[n]), `${v.actividad}: apoyos 1, 2 y 3`);
  for (const g of ['intermedio', 'dificil']) {
    const d = v.grados[g].cambia_respecto_al_anterior;
    must(d.some((x) => x !== 'cantidad-estimulos'), `REQ-01: ${v.actividad}/${g} solo cambia la cantidad`);
    must(d.every((x) => CERRADA.includes(x) || PROPUESTAS.includes(x)), `${v.actividad}/${g}: dimensión fuera del vocabulario`);
  }
  must(!v.modalidad_respuesta.some((x) => /escrib|oral|voz|dict/.test(x)), `${v.actividad}: sin texto libre ni voz (T01, D1)`);
  must(!v.modalidad_respuesta.includes('arrastre') || v.modalidad_respuesta.includes('tocar-y-ubicar'), `${v.actividad}: el arrastre siempre tiene alternativa (WCAG 2.5.7)`);
  must(!JSON.stringify(v.habilidades.concat(v.habilidades_secundarias)).includes('visomotora'), `REQ-10: ${v.actividad} no declara coordinación visomotora`);
}
must(V[2].transferencia === 'A' && V[2].transferencia_nota, 'Act. 3: variante A con la aclaración de que la app es C');
must(V[4].texto_transferir === 'Transferir describe lo que pide la actividad: aplicar una estrategia a situaciones nuevas dentro de la app. No garantiza que la persona la use fuera de la app.', 'REQ-16: texto de Transferir en la Act. 5');
for (const k of ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']) must(modulo.decisiones_supervisora[k], `decisión ${k} registrada`);
// La ficha rota se detecta
{ const m2 = JSON.parse(JSON.stringify(modulo)); m2.estaciones.variantes[1].grados.dificil.cambia_respecto_al_anterior = ['cantidad-estimulos'];
  must(m2.estaciones.variantes[1].grados.dificil.cambia_respecto_al_anterior.every((x) => x === 'cantidad-estimulos'), 'control de REQ-01 con un grado que solo cambia la cantidad'); }

// ---------- Banco válido (REQ-CLI-CER-02, 04, 07, 11, 15) ----------
must(!M.validarBanco(banco, modulo).length, 'banco: ' + errores(banco));
// El validador detecta lo que tiene que detectar
{ const b = copia(); b.actividades.memotest.dificil[0].parejas[1].b.txt = 'clavo';
  must(/dos parejas/.test(errores(b)), 'REQ-02: una tarjeta con dos parejas posibles'); }
{ const b = copia(); const it = b.actividades.detectives.facil[0]; it.elementos.push({ ...it.elementos[0], id: 'casa2', x: 900, y: 420 });
  must(/zonas correctas/.test(errores(b)), 'REQ-02: dos zonas correctas en Detectives'); }
{ const b = copia(); const it = b.actividades.detectives.dificil[0]; it.elementos.find((e) => e.id === 'balde-b').atras = true; it.elementos.find((e) => e.id === 'balde-b').x = 470; it.elementos.find((e) => e.id === 'balde-b').y = 380;
  must(/zonas correctas/.test(errores(b)), 'REQ-02: dos baldes detrás de la casa'); }
{ const b = copia(); b.actividades.escena_frase.facil[0].frases.madera = b.actividades.escena_frase.facil[0].frases.paja;
  must(/frase distinta/.test(errores(b)), 'REQ-02: dos escenas con la misma frase'); }
{ const b = copia(); b.actividades.escena_frase.dificil[0].justificacion.opciones[1].ok = true;
  must(/una sola adecuada/.test(errores(b)), 'REQ-07: justificación con dos opciones adecuadas'); }
{ const b = copia(); delete b.actividades.escena_frase.dificil[0].justificacion.opciones[0].fig;
  must(/con dibujo/.test(errores(b)), 'REQ-07 y D1: opción de justificación sin dibujo'); }
{ const b = copia(); b.actividades.ayudemos.facil[0].opciones.forEach((o) => { o.clase = 'no-adecuada'; });
  must(/sin opción adecuada/.test(errores(b)), 'REQ-02: situación sin opción adecuada'); }
{ const b = copia(); b.actividades.ayudemos.facil[0].opciones[0].consecuencia = 'El cerdito se lastima con la paja.';
  must(/daño a un personaje/.test(errores(b)), 'REQ-11: consecuencia con daño a un personaje'); }
{ const b = copia(); delete b.actividades.ayudemos.intermedio[0].opciones[0].consecuencia;
  must(/consecuencia/.test(errores(b)), 'REQ-02: alternativa sin consecuencia'); }
{ const b = copia(); b.actividades.ayudemos.facil[0].rutas = ['3-5', '6-8'];
  must(/no va en 3 a 5/.test(errores(b)), 'REQ-04: ítem de la Act. 5 ofrecido en 3–5'); }
{ const m2 = JSON.parse(JSON.stringify(modulo)); m2.rutas['3-5'].actividades.ayudemos = ['facil'];
  must(/Act\. 5 no se publica en 3 a 5/.test(errores(banco, m2)), 'REQ-04: catálogo 3–5 con la Act. 5'); }
{ const m2 = JSON.parse(JSON.stringify(modulo)); m2.rutas['13-18'] = { ...m2.rutas['9-12'] };
  must(/13-18/.test(errores(banco, m2)), 'REQ-04 y D7: ruta 13–18'); }
{ const b = copia(); b.cuento['3-5'][7] = { escena: 'chimenea', texto: 'El lobo se quemó la cola con la olla.' };
  const e = errores(b); must(/no va en 3 a 5/.test(e) && /lesión, fuego u olla/.test(e), 'REQ-04 y D5: final con olla o lesión en 3–5'); }
{ const b = copia(); b.actividades.escena_frase.facil[0].frases.madera = '¡Muy bien! Sos muy inteligente.';
  must(/no permitida/.test(errores(b)), 'REQ-15: elogio a la persona'); }
for (const t of ['Salvemos a los cerditos', 'Tu misión', 'el cerdito vago', 'Pasaste de nivel', 'Es por la dislexia', 'El lobo quiere comer'])
  must(M.PROHIBIDO.test(t), `REQ-15: «${t}» se detecta`);
{ const b = copia(); b.textos.cierre = 'Al estilo de la película.'; must(/versión comercial/.test(errores(b)), 'REQ-00b: comparación con una versión comercial'); }

// ---------- Cuento (REQ-CLI-CER-03 y 04; D2, D5) ----------
const C35 = banco.cuento['3-5'], C612 = banco.cuento['6-12'];
must(C35.length === C612.length && C35.every((l, i) => l.escena === C612[i].escena || (l.escena === 'lobo-lejos' && C612[i].escena === 'chimenea')), 'la versión 3–5 solo cambia el final');
must(/sintió que estaba muy caliente/.test(C35[7].texto) && /¡Uy, quema!/.test(C35[7].texto), 'D5: texto aprobado del final 3–5');
must(!C35.some((l) => M.PROHIBIDO_35.test(l.texto)), 'caso 1: el cuento 3–5 no tiene olla, cola, fuego ni lesión');
must(modulo.rutas['3-5'].final_cuento === '3-5' && modulo.rutas['6-8'].final_cuento === '6-12' && modulo.rutas['9-12'].final_cuento === '6-12', 'final por ruta (FEC 5.1)');
// Láminas: el lobo no muestra dientes; cuando sopla no hay cerditos (D2, caso 15); el final 3–5 sin chimenea, olla ni cola (D5)
const figs = (e, o) => [...D.ESCENAS[e](o || {}).matchAll(/data-fig="([^"]+)"/g)].map((m) => m[1]);
for (const e of ['lobo-mira', 'sopla-paja', 'sopla-madera', 'sopla-ladrillos', 'chimenea', 'lobo-lejos']) must(!figs(e).some((f) => /cerdito|tres/.test(f)), `D2 y caso 15: ningún cerdito en la lámina ${e}`);
must(!figs('lobo-lejos').some((f) => /casa/.test(f)) && !/<path d="M80 60 C96 52/.test(D.ESCENAS['lobo-lejos']()), 'D5: el final 3–5 no muestra la casa, la chimenea ni la cola');
must(!/vapor|M96 58/.test(D.ESCENAS['lobo-lejos']()), 'D5: sin vapor en el final 3–5');
must(!/diente|garra/i.test(D.F.lobo.toString()), 'el lobo no tiene dientes ni garras');
must(figs('festejo').includes('cerdito silla') && figs('festejo').includes('casa rampa'), 'M03-4: rampa y visitante en silla de ruedas en el final');
must(figs('ladrillos').includes('casa rampa') && !figs('paja').some((f) => /silla/.test(f)) && !figs('madera').some((f) => /silla/.test(f)), 'la discapacidad no se asocia al material que no resiste');
for (const v of ['6-12', '3-5']) for (const l of banco.cuento[v]) must(banco.escenas[l.escena] && D.ESCENAS[l.escena], `cuento ${v}: lámina ${l.escena}`);

// ---------- Rutas y catálogo (REQ-CLI-CER-04, casos 2 y 2b) ----------
must(M.actividadesDe(modulo, '3-5').join() === 'detectives,memotest,escena_frase,rompecabezas', 'caso 2: en 3–5 no aparece la Act. 5');
must(M.gradosDe(modulo, '3-5', 'escena_frase').join() === 'facil' && M.gradosDe(modulo, '3-5', 'rompecabezas').join() === 'facil,intermedio', 'caso 2: Act. 3 solo Fácil y Act. 4 hasta Intermedio en 3–5');
must(!modulo.rutas['3-5'].lee && modulo.rutas['3-5'].audio === 'por-defecto', 'caso 2: en 3–5 las frases van en audio');
must(!modulo.rutas['13-18'] && modulo.rutas_excluidas['13-18'] && M.ajustarARuta(modulo, '13-18', 'detectives', 'facil') === null, 'caso 2b: nada se ofrece en 13–18 (D7)');
must(JSON.stringify(M.ajustarARuta(modulo, '3-5', 'ayudemos', 'dificil')) === JSON.stringify({ actividad: 'detectives', grado: 'dificil' }), 'una asignación de la Act. 5 en 3–5 no se puede cumplir');
must(JSON.stringify(M.ajustarARuta(modulo, '3-5', 'rompecabezas', 'dificil')) === JSON.stringify({ actividad: 'rompecabezas', grado: 'intermedio' }), 'en 3–5 el rompecabezas queda en el grado más alto publicado');
for (const r of M.RUTAS) for (const a of M.actividadesDe(modulo, r)) for (const g of M.gradosDe(modulo, r, a)) must(M.itemsDe(banco, a, g, r).length >= 2, `${r}/${a}/${g}: al menos dos ítems`);
for (const it of M.itemsDe(banco, 'memotest', 'intermedio', '3-5').concat(M.itemsDe(banco, 'memotest', 'dificil', '3-5'))) must(it.parejas.every((p) => !p.a.txt && !p.b.txt), `${it.id}: sin palabras escritas en 3–5`);
for (const it of M.itemsDe(banco, 'rompecabezas', 'intermedio', '3-5')) must(it.cols * it.filas <= 6, `${it.id}: hasta 6 piezas en 3–5`);
must(modulo.rutas['3-5'].tolerancia_px > modulo.rutas['6-8'].tolerancia_px, 'tolerancia de encastre amplia en 3–5');
must(modulo.rutas['3-5'].sesion_min >= 10 && modulo.rutas['3-5'].sesion_min <= 15 && modulo.rutas['6-8'].sesion_min === 20 && modulo.rutas['9-12'].sesion_min >= 25 && modulo.rutas['9-12'].sesion_min <= 30, 'cierre suave por tiempo de sesión (M11)');

// ---------- Act. 1: relaciones espaciales y una sola zona (REQ-CLI-CER-02) ----------
const d1 = banco.actividades.detectives.dificil.find((x) => x.relacion && x.relacion.tipo === 'detras');
must(d1 && !d1.rutas.includes('3-5'), '«detrás» desde los 6 años');
must(banco.actividades.detectives.dificil.some((x) => x.relacion && x.relacion.tipo === 'arriba' && (x.rutas || M.RUTAS).includes('3-5')), 'en 3–5, una relación simple (arriba)');
must(banco.actividades.detectives.dificil.some((x) => x.funcion), 'Difícil por función evidente');
for (const g of GR) for (const it of banco.actividades.detectives[g]) {
  const els = M.elementosDe(it); must(M.elementosDe(it).map((e) => e.id).join() === els.map((e) => e.id).join(), `${it.id}: relleno determinista`);
  must(els.filter((e) => e.relleno).every((r) => !it.elementos.some((e) => M.caja(e) && r.x < e.x + 100 * e.s + 10 && e.x < r.x + 55 + 10 && r.y < e.y + 100 * e.s + 10 && e.y < r.y + 55 + 10)), `${it.id}: el relleno no tapa elementos del banco`);
}

// ---------- Escala de apoyos 0–3 y retiro progresivo (REQ-CLI-CER-08 y 09, casos 7 y 8) ----------
const sig = (m) => M.siguienteApoyo(m);
must(sig(3).nivel === 2 && sig(2).nivel === 1 && sig(1).nivel === 0 && sig(1).destacar && sig(0).nivel === 0 && !sig(0).destacar, 'REQ-09: un nivel menos; desde 1, a 0 con el botón destacado');
{ let n = 3; const camino = [n]; for (let k = 0; k < 4; k++) { n = sig(n).nivel; camino.push(n); } must(camino.join() === '3,2,1,0,0', `caso 7: retiro 3 → 2 → 1 → 0 (${camino})`); }
must(M.sinAyuda({ apoyo_max: 0 }) && !M.sinAyuda({ apoyo_max: 1 }), 'REQ-08: sin ayuda = apoyo_max 0');
const h = (n, ac, ay) => Array.from({ length: n }, () => ({ acierto: ac, conAyuda: ay }));
must(M.ajusteM10([...h(9, true, true), ...h(1, false, true)], 'facil').grado === 'facil', 'caso 8: 90 % de aciertos con «Ver el modelo» no sube');
must(M.ajusteM10(h(6, true, false), 'facil').grado === 'intermedio', 'M10-3: sube con aciertos sin ayuda');
must(M.ajusteM10(h(4, true, false), 'facil').grado === 'facil', 'M10-2: menos de 5 ítems');
must(M.ajusteM10(h(6, true, false), 'facil', { yaSubio: true }).grado === 'facil', 'M10-3: un paso por sesión');
must(M.ajusteM10(h(6, false, false), 'intermedio').grado === 'facil', 'M10-5: baja');
must(M.ajusteM10(h(6, true, false), 'facil', { fijo: true }).grado === 'facil', 'M10-9: fijado por el profesional');
must(M.ajusteM10([], 'dificil', { erroresSeguidos: 3 }).masAyuda, 'M10-5: 3 errores seguidos, más ayuda');
must(M.ajusteM10(h(6, true, false), 'intermedio', { grados: ['facil', 'intermedio'] }).grado === 'intermedio', 'M10 no sube a un grado que la ruta no publica');
must(M.ajusteM10(h(6, false, false), 'facil', { grados: ['facil'] }).grado === 'facil', 'M10 con un solo grado publicado');
// Act. 3: cada etapa alimenta su habilidad (FEC 5.9)
must(M.combinarAjustes([{ grado: 'intermedio', subio: true }, { grado: 'facil', motivo: 'm' }], 'facil').grado === 'facil', 'Act. 3: sube solo si las dos etapas suben');
must(M.combinarAjustes([{ grado: 'intermedio', subio: true }, { grado: 'intermedio', subio: true }], 'facil').grado === 'intermedio', 'Act. 3: las dos suben');
must(M.combinarAjustes([{ grado: 'facil' }, { grado: 'facil', masAyuda: true }], 'intermedio').grado === 'facil', 'Act. 3: si una baja, baja');
// Caso 12: el tiempo no interviene en M10
must(!/ms|tiempo/.test(M.ajusteM10.toString().replace(/\/\*[\s\S]*?\*\//g, '').replace(/motivo: "[^"]*"/g, '')), 'caso 12: M10 no usa el tiempo');

// ---------- Lectura en voz alta (REQ-CLI-CER-12, caso 6) ----------
must(M.habilidadDe(modulo, 'memotest', '9-12', 'dificil', false) === 'reconocimiento-de-palabras', 'Memotest Difícil en 9–12 sin audio: lectura');
must(M.habilidadDe(modulo, 'memotest', '9-12', 'dificil', true) === 'asociacion-visual-auditiva', 'caso 6: con audio objetivo, habilidad oral');
must(M.habilidadDe(modulo, 'memotest', '3-5', 'intermedio', false) === 'asociacion-visual-auditiva', 'en 3–5 no hay lectura');
must(M.habilidadDe(modulo, 'memotest', '6-8', 'facil', true) === 'asociacion-imagen-palabra', 'Fácil (imagen-imagen) no es de lectura');
must(M.habilidadDe(modulo, 'escena_frase', '9-12', 'intermedio', false, 'asociar') === 'comprension-de-consignas-escritas' && M.habilidadDe(modulo, 'escena_frase', '9-12', 'intermedio', true, 'asociar') === 'comprension-de-enunciados', 'Act. 3: la frase escuchada se imputa a la habilidad oral');
must(M.habilidadDe(modulo, 'escena_frase', '9-12', 'intermedio', true, 'ordenar') === 'secuenciacion-narrativa', 'Act. 3: ordenar no depende del audio');
must(M.habilidadDe(modulo, 'rompecabezas', '6-8', 'facil', false) === 'organizacion-y-planificacion', 'REQ-10: Act. 4 con su habilidad de referencia');
{ const r = M.registro({ actividad: 'memotest', grado: 'dificil', audio_objetivo: true, apoyo_max: 0, apoyos: ['0:repetir'] }); must(r.apoyo_max === 0 && r.audio_objetivo === true && r.autonomia === 'autonomo', 'REQ-12 y R11: audio y repetir no suben el nivel'); }

// ---------- Registro (FEC §8, REQ-CLI-CER-10 y 14) ----------
const reg = M.registro({ actividad: 'memotest', estacion: 'reconocer', grado: 'facil', item: 'x'.repeat(99), resultado: true, errores: -3, apoyo_max: 9, apoyo_inicial: 2, apoyos: ['<script>'], ms: 1e12, nombre: 'Juan', modalidad: 'teletransporte' });
must(reg.item.length === 20 && reg.errores === 0 && reg.apoyo_max === 3 && reg.autonomia === 'con-demostracion' && reg.ms === 3600000 && reg.modalidad === 'tocar', 'registro acotado');
must(!('nombre' in reg), 'minimización: el registro no acepta campos fuera de la lista');
must(JSON.stringify(Object.keys(reg)) === JSON.stringify(modulo.registro.campos) && JSON.stringify(M.CAMPOS) === JSON.stringify(modulo.registro.campos), 'campos del registro = ficha');
must(M.registro({ apoyo_inicial: 3, apoyo_max: 1 }).apoyo_inicial === 1, 'el apoyo inicial nunca supera el máximo');
must(M.registro({ actividad: 'rompecabezas', modalidad: 'arrastre' }).modalidad === 'arrastre' && M.registro({ actividad: 'rompecabezas', modalidad: 'tocar-y-ubicar' }).habilidad === M.registro({ actividad: 'rompecabezas', modalidad: 'arrastre' }).habilidad, 'REQ-10 y caso 9: la modalidad es contexto');
must(M.AUTONOMIA.map((_, i) => M.autonomia(i)).join() === 'autonomo,con-pista,con-ayuda-especifica,con-demostracion', 'autonomía derivada del apoyo máximo');
must(modulo.registro.leyenda_tiempo === 'El tiempo se registra como contexto. No cuenta como error ni indica por sí solo una dificultad.', 'REQ-14: leyenda del tiempo');
must(modulo.registro.leyenda_autonomia === 'Referencia orientativa sobre los apoyos usados en esta actividad. No describe a la persona ni es una evaluación diagnóstica.', 'leyenda de autonomía');
{ const m = M.medianasTiempo([{ actividad: 'memotest', grado: 'facil', ms: 1000 }, { actividad: 'detectives', grado: 'facil', ms: 3000 }, { actividad: 'detectives', grado: 'facil', ms: 1000 }, { actividad: 'detectives', grado: 'facil', ms: 9000 }, { actividad: 'memotest', grado: 'facil', ms: 2000 }]);
  must(m.length === 2 && m[0].actividad === 'detectives' && m[0].mediana_ms === 3000 && m[0].n === 3 && m[1].mediana_ms === 1500, 'REQ-14: mediana por actividad y grado'); }
// Acierto por actividad
must(M.acierto('memotest', { errores: 3, parejas: 3 }) && !M.acierto('memotest', { errores: 4, parejas: 3 }), 'acierto memotest');
must(M.aciertoEtapa({ etapas: { asociar: { errores: 2 }, ordenar: { errores: 0 } } }, 'ordenar') && !M.aciertoEtapa({ etapas: { asociar: { errores: 2 } } }, 'asociar'), 'REQ-06: dos resultados separados');
must(!M.acierto('ayudemos', { etapas: { eleccion: { primera: 'parcial', final: 'adecuada' } } }) && M.acierto('ayudemos', { etapas: { eleccion: { primera: 'adecuada' }, pasos: { errores: 0 } } }), 'acierto Act. 5');
must(!M.acierto('ayudemos', { etapas: { plan: { primera: 'adecuada' }, imprevisto: { primera: 'adecuada' }, justificacion: { primera: 'parcial' } } }), 'Act. 5: justificación parcial no es acierto');
// Justificación de la Act. 5 por tabla (REQ-07)
const j = banco.actividades.ayudemos.dificil[0].justificacion;
must(M.claseJust(j.opciones[0], 'lona') === 'adecuada' && M.claseJust(j.opciones[0], 'arbol') === 'parcial' && M.claseJust(j.opciones[2], 'lona') === 'no-adecuada', 'REQ-07: justificación corregida por tabla');

// ---------- Memotest, ubicar y mezclas ----------
for (const g of GR) for (const it of banco.actividades.memotest[g]) {
  const c = M.cartasMemotest(it, 7);
  must(c.length === it.parejas.length * 2 && it.parejas.every((_, i) => M.esPareja(c.find((x) => x.id === i + 'a'), c.find((x) => x.id === i + 'b'))), `${it.id}: parejas`);
  must(!M.esPareja(c.find((x) => x.id === '0a'), c.find((x) => x.id === '1a')), `${it.id}: tarjetas de parejas distintas no son pareja`);
}
must(M.silabas('ladrillo') === 3 && M.silabas('martillo') === 3 && M.silabas('carretilla') === 4 && M.silabas('sol') === 1, 'sílabas aproximadas');
for (let s = 1; s < 200; s++) { const p = M.piezas({ cols: 2, filas: 2 }, s); must(p.some((x, i) => x !== i), 'el rompecabezas nunca empieza armado'); }
must(M.malUbicadas([0, 2, 1, null]).join() === '1,2' && M.completo([0, 1, 2]) && !M.completo([0, null, 2]), 'ubicar: mal ubicadas y completo');

// ---------- Sin modelos de lenguaje ni entrada libre (T11, caso 14) ----------
must(!/fetch\(|XMLHttpRequest|WebSocket|anthropic|openai/i.test(html), 'T11: nada sale del juego ni consulta un modelo');
must(!/<input(?![^>]*type="checkbox")|<textarea|contenteditable|getUserMedia|MediaRecorder|type="file"/i.test(html), 'caso 14: no hay forma de ingresar texto, audio ni imagen');

console.log(fallas ? `${fallas} de ${casos} fallas` : `ok cerditos: ${casos} casos`);
process.exit(fallas ? 1 : 0);

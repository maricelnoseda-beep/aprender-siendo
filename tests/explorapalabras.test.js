// Explorapalabras: prueba del generador de sopas y de la ficha de Estaciones (sin navegador).
// Recorre las 15 temáticas × 4 Estaciones × 3 grados × 2 modos (palabras e imágenes) con varias semillas.
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.join(__dirname, '..', 'app', 'herramientas', 'explorapalabras');
const html = fs.readFileSync(path.join(dir, 'explorapalabras.html'), 'utf8');
const banco = JSON.parse(fs.readFileSync(path.join(dir, 'banco.json'), 'utf8'));
const modulo = JSON.parse(fs.readFileSync(path.join(dir, 'modulo.json'), 'utf8'));
const codigo = html.match(/<script id="generador">([\s\S]*?)<\/script>/)[1];
const ctx = { module: {} }; vm.runInNewContext(codigo, ctx);
const G = ctx.module.exports;
let fallas = 0, casos = 0; const avisos = [];
const must = (c, m) => { casos++; if (!c) { fallas++; if (fallas < 30) console.error('FALLA:', m); } };

// 1. Ficha de Estaciones (CRIT-EST-001 §5 y RT-EST-001 B.2): 4 Estaciones, 3 grados, los 7 campos, y no solo cantidad.
const EST = ['explorar', 'reconocer', 'integrar', 'transferir'], GR = ['facil', 'intermedio', 'dificil'];
const DIMS = ['cantidad-estimulos', 'complejidad-consignas', 'extension-palabras', 'cantidad-pasos', 'grado-abstraccion', 'complejidad-relaciones', 'necesidad-planificacion', 'disponibilidad-apoyos'];
const E = modulo.estaciones;
must(E && E.criterio === 'CRIT-EST-001 v1.0', 'la ficha declara el criterio');
must(JSON.stringify(E.variantes.map((v) => v.estacion)) === JSON.stringify(EST), 'las cuatro Estaciones en orden');
for (const v of E.variantes) {
  for (const campo of ['habilidades', 'apoyos', 'modalidad_respuesta', 'adaptaciones', 'progresion', 'dimensiones_que_cambian', 'grados'])
    must(v[campo] && (v[campo].length || Object.keys(v[campo]).length), `${v.estacion}: falta ${campo}`);
  must(v.dimensiones_que_cambian.every((d) => DIMS.includes(d)), `${v.estacion}: dimensión fuera de la lista cerrada`);
  must(v.dimensiones_que_cambian.some((d) => d !== 'cantidad-estimulos'), `${v.estacion}: la dificultad no puede depender solo de la cantidad (CRIT-EST-001 §4)`);
  must(JSON.stringify(Object.keys(v.grados)) === JSON.stringify(GR), `${v.estacion}: los tres grados`);
  // Dentro de cada Estación cada grado cambia algo más que la cantidad de palabras.
  const ps = GR.map((g) => v.grados[g].parametros);
  for (let k = 1; k < 3; k++) {
    const a = ps[k - 1], b = ps[k];
    const otra = a.relleno !== b.relleno || a.direcciones.length !== b.direcciones.length || a.largo[1] !== b.largo[1] || a.senuelos !== b.senuelos || a.cruces !== b.cruces;
    must(otra, `${v.estacion}: ${GR[k]} solo cambia la cantidad`);
    must(b.palabras >= a.palabras && b.columnas * b.filas >= a.columnas * a.filas, `${v.estacion}: ${GR[k]} no es más exigente`);
  }
}
// Progresión entre Estaciones: direcciones crecientes y palabras al revés solo en Transferir.
const dirs = (e, g) => E.variantes.find((v) => v.estacion === e).grados[g].parametros.direcciones;
must(dirs('explorar', 'dificil').join() === 'E', 'Explorar: solo horizontal');
must(dirs('reconocer', 'dificil').every((d) => ['E', 'S'].includes(d)), 'Reconocer: horizontal y vertical');
must(dirs('integrar', 'facil').includes('SE') && !dirs('integrar', 'dificil').some((d) => ['O', 'N', 'NO', 'SO'].includes(d)), 'Integrar: diagonales, sin palabras al revés');
must(dirs('transferir', 'dificil').length === 8, 'Transferir: ocho direcciones');

// 2. Banco: 15 temáticas, rotulado como prueba.
must(banco.estado === 'Contenido de prueba no validado', 'el banco está rotulado como contenido de prueba');
must(banco.tematicas.length === 15, '15 temáticas');

// 3. Generador: todas las combinaciones.
const SEMILLAS = +process.env.SEMILLAS || 12;
const LETRA = /^[A-ZÑ]$/;
for (const t of banco.tematicas) for (const v of E.variantes) for (const g of GR) for (const conImagen of [false, true]) {
  const p = v.grados[g].parametros;
  let menos = Infinity;
  for (let s = 1; s <= SEMILLAS; s++) {
    const sp = G.crear(t, p, { conImagen, semilla: s * 7919 });
    const id = `${t.id}/${v.estacion}/${g}/${conImagen ? 'imagenes' : 'palabras'}/semilla ${s}`;
    must(sp, `${id}: no se pudo armar`); if (!sp) continue;
    menos = Math.min(menos, sp.palabras.length);
    must(sp.grilla.length === p.filas && sp.grilla.every((f) => f.length === p.columnas), `${id}: tamaño`);
    must(sp.grilla.every((f) => f.every((c) => LETRA.test(c))), `${id}: letras válidas`);
    must(sp.palabras.length >= Math.min(3, p.palabras), `${id}: muy pocas palabras (${sp.palabras.length})`);
    const filas = new Set();
    for (const w of sp.palabras) {
      must(p.direcciones.includes(w.dir), `${id}: ${w.texto} en dirección no permitida ${w.dir}`);
      must(w.celdas.map(([x, y]) => sp.grilla[y][x]).join('') === w.norm, `${id}: ${w.texto} no está donde dice`);
      must(G.apariciones(sp.grilla, w.norm) === 1, `${id}: ${w.texto} aparece más de una vez`);
      must(w.norm.length >= p.largo[0] && w.norm.length <= p.largo[1], `${id}: ${w.texto} fuera del largo`);
      if (conImagen) must(!!w.imagen, `${id}: ${w.texto} sin imagen en modo imágenes`);
      filas.add(w.celdas[0][1]);
    }
    if (v.estacion === 'explorar') must(filas.size === sp.palabras.length, `${id}: en Explorar va una palabra por fila`);
    if (p.relleno === 'distinto') {
      const enPal = new Set(sp.palabras.flatMap((w) => w.celdas.map(([x, y]) => x + ',' + y)));
      const letras = new Set(sp.palabras.map((w) => w.norm).join(''));
      const intrusas = sp.grilla.flatMap((f, y) => f.filter((c, x) => !enPal.has(x + ',' + y) && letras.has(c)));
      must(intrusas.length === 0, `${id}: el relleno "distinto" repite letras de las palabras`);
    }
    // Validación de la selección: la palabra se acepta en los dos sentidos; una línea cualquiera no.
    const w = sp.palabras[0], a = w.celdas[0], b = w.celdas[w.celdas.length - 1];
    must(G.clave(G.linea(a, b)) === w.clave && G.clave(G.linea(b, a)) === w.clave, `${id}: selección en los dos sentidos`);
  }
  if (menos < p.palabras) avisos.push(`${t.nombre} · ${v.nombre} · ${g} · ${conImagen ? 'con dibujos' : 'con palabras'}: ${menos} de ${p.palabras} palabras`);
}
// 4. Geometría de la selección.
must(G.linea([0, 0], [2, 1]) === null, 'una selección torcida no es una línea');
must(JSON.stringify(G.ajustar([0, 0], [3, 1], 10, 10)) === '[3,0]', 'el arrastre se ajusta a la recta más cercana');
must(G.normalizar('Pingüino') === 'PINGUINO' && G.normalizar('Ñandú') === 'ÑANDU', 'normalización conserva la Ñ y quita tildes');

console.log(`explorapalabras: ${casos - fallas}/${casos} comprobaciones correctas, ${banco.tematicas.length * 12 * 2} combinaciones × ${SEMILLAS} semillas`);
if (avisos.length) console.log('Combinaciones con menos palabras que las pedidas (falta banco de prueba):\n  ' + avisos.join('\n  '));
if (fallas) { console.error(`${fallas} fallas`); process.exit(1); }

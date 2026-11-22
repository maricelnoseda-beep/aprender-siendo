// «Los cuatro exploradores»: capturas para PSP-SR (RT-CEX-001-R v1.1 D.2) y porcentaje tapado de la niebla (B.3, nie-i3 y nie-i5).
// Uso: python3 app/build.py --exploradores && node scripts/exploradores_capturas.js
// Escribe app/dist-exploradores/capturas-psp-sr/*.png y app/dist-exploradores/niebla_tapado.json. Solo datos sintéticos del banco de prueba.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const raiz = path.resolve(__dirname, '..');
const archivo = 'file://' + path.join(raiz, 'app', 'dist-exploradores', 'Los_cuatro_exploradores.html');
const SAL = path.join(raiz, 'app', 'dist-exploradores', 'capturas-psp-sr');
const banco = JSON.parse(fs.readFileSync(path.join(raiz, 'app', 'herramientas', 'exploradores', 'banco.json'), 'utf8'));

// Un ítem por juego y grado: el primero nuevo o cambiado en v0.3.0, si hay; si no, el primero. Más los corregidos de B.1 que dependen del dibujo.
const CORREGIDOS = ['obj-d2', 'obj-d4', 'jar-i2', 'jar-d5', 'lab-f5', 'lab-i4', 'fab-i5', 'fab-i7', 'c7a-f2', 'lab-d5', '8a-d2', '8b-i1'];
const RUTA_DE = (v, g, it) => (it.rutas && !it.rutas.includes('6-8') ? it.rutas[0] : '6-8');

(async () => {
  fs.rmSync(SAL, { recursive: true, force: true }); fs.mkdirSync(SAL, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  const errores = []; page.on('pageerror', (e) => errores.push(String(e)));
  await page.goto(archivo);
  await page.click('#a-seguir');
  for (let i = 0; i < 3; i++) await page.click('#h-sig');
  await page.screenshot({ path: path.join(SAL, '00-historia-lamina-4.png') });
  for (let i = 0; i < 1; i++) await page.click('#h-sig');
  await page.click('#h-fin');

  const lista = [];
  for (const [v, gs] of Object.entries(banco.variantes)) for (const [g, its] of Object.entries(gs)) {
    const rutasG = g === 'dificil' && v === 'jardin' ? ['6-8', '3-5'] : [null];
    for (const r of rutasG) {
      const cand = its.filter((it) => !r || (it.rutas || ['3-5', '6-8', '9-12']).includes(r));
      const it = cand.find((x) => x.cambio_v030 && !x.lee) || cand.find((x) => !x.lee) || cand[0];
      lista.push({ v, g, it, ruta: r || RUTA_DE(v, g, it) });
    }
  }
  for (const id of CORREGIDOS) for (const [v, gs] of Object.entries(banco.variantes)) for (const [g, its] of Object.entries(gs)) {
    const it = its.find((x) => x.id === id); if (it && !lista.some((x) => x.it.id === id)) lista.push({ v, g, it, ruta: RUTA_DE(v, g, it) });
  }
  let n = 1;
  for (const { v, g, it, ruta } of lista) {
    const letra = it.letra_forma || (ruta === '9-12' ? 'minuscula' : 'mayuscula');
    const ok = await page.evaluate(({ v, g, id, ruta, letra }) => {
      const { S, BANCO, Motor } = window.__exploradores;
      S.ruta = ruta; S.letra = letra; aplicarLetra(); encabezado(); S.gradoDe[v] = g; S.idx = {}; S.estrategiaVista.add(v);
      const l = Motor.itemsDe(BANCO, v, g, ruta, { lee: ruta !== '3-5', letra });
      const k = l.findIndex((x) => x.id === id); if (k < 0) return false;
      S.idx[`${v}/${g}/${ruta}/${letra}`] = k; entrar(v); return S.item && S.item.id === id;
    }, { v, g, id: it.id, ruta, letra });
    if (!ok) { console.error('no se pudo abrir', it.id); continue; }
    await page.waitForTimeout(120);
    const nombre = `${String(n++).padStart(2, '0')}-${it.id}-${ruta}.png`;
    await page.screenshot({ path: path.join(SAL, nombre), fullPage: true });
    await page.click('#j-mapa');
  }
  // Pictogramas de «¿Cómo te resultó?» (C.3)
  await page.evaluate(() => { const { S } = window.__exploradores; S.ruta = '6-8'; S.variante = 'objetos'; cierre('ronda'); });
  await page.locator('#contar').screenshot({ path: path.join(SAL, `${String(n++).padStart(2, '0')}-contar-pictogramas.png`) });

  // Niebla: porcentaje del dibujo del objeto que tapa cada ítem (se mide sobre los píxeles del objeto, no sobre el cuadro).
  const tapado = await page.evaluate(async (variantes) => {
    const medir = async (svg) => { const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode();
      const c = document.createElement('canvas'); c.width = c.height = 300; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 300, 300); return x.getImageData(0, 0, 300, 300).data; };
    const out = {};
    for (const [g, its] of Object.entries(variantes.niebla)) for (const it of its) {
      if (it.tipo === 'palabra') { out[it.id] = { grado: g, tapado_pct: it.tapa_pct, como: `franja de la mitad de ${it.tapa}` }; continue; }
      const marco = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 112 112" width="300" height="300">${inner}</svg>`;
      const manchas = it.manchas.map((m) => m.hoja ? `<g transform="translate(${m.x} ${m.y}) rotate(${m.r || 0}) scale(${m.s || 0.5}) translate(-50 -50)">${D.F.hoja({ c: '#5FA77F' })}</g>` : `<circle cx="${m.x}" cy="${m.y}" r="${m.radio}" fill="#DDE6EA"/>`).join('');
      const a = await medir(marco(D.transformado(it.objeto.f, it.objeto))), b = await medir(marco(manchas));
      let obj = 0, tap = 0; for (let i = 3; i < a.length; i += 4) if (a[i] > 128) { obj++; if (b[i] > 128) tap++; }
      const pasos = Math.ceil(it.manchas.length / (it.por_paso || 1));
      out[it.id] = { grado: g, tapado_pct: Math.round((100 * tap) / obj), manchas: it.manchas.length, pasos_para_despejar: pasos };
    }
    return out;
  }, banco.variantes);
  fs.writeFileSync(path.join(raiz, 'app', 'dist-exploradores', 'niebla_tapado.json'), JSON.stringify(tapado, null, 1) + '\n');
  await browser.close();
  if (errores.length) { console.error(errores.join('\n')); process.exit(1); }
  console.log(`${n - 1} capturas en ${path.relative(raiz, SAL)} · tapado de ${Object.keys(tapado).length} ítems de la niebla`);
})();

// «Los cuatro exploradores»: capturas de la identidad visual IDV-CEX-001 v0.1 (propuesta de PSP-SR, pendiente de aprobación).
// Uso: python3 app/build.py --exploradores && node scripts/exploradores_capturas_idv.js
// Escribe app/dist-exploradores/capturas-idv/*.png. Solo datos sintéticos del banco de prueba.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const raiz = path.resolve(__dirname, '..');
const archivo = 'file://' + path.join(raiz, 'app', 'dist-exploradores', 'Los_cuatro_exploradores.html');
const SAL = path.join(raiz, 'app', 'dist-exploradores', 'capturas-idv');
const banco = JSON.parse(fs.readFileSync(path.join(raiz, 'app', 'herramientas', 'exploradores', 'banco.json'), 'utf8'));
const JUEGOS = [['laberinto', 'facil'], ['laberinto', 'intermedio'], ['niebla', 'facil'], ['pistas_relampago', 'facil'], ['cofre_cuales', 'facil'], ['cofre_orden', 'facil'], ['jardin', 'facil'], ['pistas_nuevas', 'facil'], ['objetos', 'facil']];

(async () => {
  fs.rmSync(SAL, { recursive: true, force: true }); fs.mkdirSync(SAL, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  const errores = []; page.on('pageerror', (e) => errores.push(String(e)));
  await page.goto(archivo);
  await page.locator('#a-estaciones').screenshot({ path: path.join(SAL, '01-mapa-de-la-aventura-adulto.png') });
  await page.click('#a-seguir');
  await page.screenshot({ path: path.join(SAL, '02-historia-lamina-1.png') });
  for (let i = 0; i < 4; i++) await page.click('#h-sig');
  await page.click('#h-fin');
  await page.screenshot({ path: path.join(SAL, '03-mapa-de-lugares.png') });
  let n = 4;
  for (const [v, g] of JUEGOS) {
    const ok = await page.evaluate(({ v, g }) => {
      const { S, BANCO, Motor } = window.__exploradores;
      S.ruta = '6-8'; S.letra = 'mayuscula'; aplicarLetra(); encabezado(); S.gradoDe[v] = g; S.idx = {}; S.estrategiaVista.add(v);
      const l = Motor.itemsDe(BANCO, v, g, '6-8', { lee: true, letra: 'mayuscula' });
      const k = v === 'laberinto' ? l.findIndex((x) => x.filas) : 0; if (k < 0) return false;
      S.idx[`${v}/${g}/6-8/mayuscula`] = k; entrar(v); return !!S.item;
    }, { v, g });
    if (!ok) { console.error('no se pudo abrir', v); continue; }
    await page.waitForTimeout(150);
    // 8A: la pista se muestra y después aparecen las fichas para elegir
    if (v === 'pistas_relampago' || v === 'cofre_cuales' || v === 'cofre_orden') await page.waitForTimeout(3500);
    await page.screenshot({ path: path.join(SAL, `${String(n++).padStart(2, '0')}-${v}-${g}.png`), fullPage: true });
    await page.click('#j-mapa');
  }
  await browser.close();
  if (errores.length) { console.error(errores.join('\n')); process.exit(1); }
  console.log(`${n - 1} capturas en ${path.relative(raiz, SAL)}`);
})();

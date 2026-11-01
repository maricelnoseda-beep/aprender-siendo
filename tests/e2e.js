// Prueba de punta a punta: recorre familia, modo niño, control de sesión, profesional, administración, vencimiento y baja.
const { chromium } = require('playwright');
const S = process.env.SHOTS || require('os').tmpdir(); const BASE = process.env.BASE_URL || 'http://localhost:8765/index.html';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const log = (...a) => console.log(...a);
  await p.goto(BASE);
  await p.screenshot({ path: S + '/01-landing.png', fullPage: true });
  // familia
  await p.click('.demo-acc[data-email^=familia] >> nth=0');
  await p.click('#login button[type=submit]');
  await p.waitForSelector('text=Actividades indicadas');
  await p.screenshot({ path: S + '/02-familia.png', fullPage: true });
  log('trial bar:', await p.textContent('.trial'));
  await p.click('[data-start] >> nth=0');
  await p.click('[data-av="colita"]'); await p.click('#ch-next');
  await p.click('[data-mood="alegria"]');
  await p.screenshot({ path: S + '/03-mood.png', fullPage: true });
  await p.click('#ch-next');
  await p.waitForSelector('#act-root');
  await p.screenshot({ path: S + '/04-activity.png', fullPage: true });
  const actName = await p.textContent('.child-title');
  log('activity:', actName);
  await p.click('#ch-stop');
  await p.waitForSelector('.feedback');
  await p.screenshot({ path: S + '/05-feedback.png', fullPage: true });
  await p.click('#ch-next');
  await p.click('[data-mood="calma"]'); await p.click('#ch-next');
  await p.click('[data-mood="alegria"]'); await p.click('#ch-next');
  await p.click('[data-diff="justa"]'); await p.click('#ch-next');
  await p.waitForSelector('#ch-exit');
  const ex = await p.$('#ch-exit'); const bb = await ex.boundingBox();
  await p.mouse.move(bb.x + 10, bb.y + 10); await p.mouse.down(); await p.waitForTimeout(1700); await p.mouse.up();
  await p.waitForSelector('text=Actividad registrada');
  log('family recorded ok');
  // segunda pestaña: conflicto de sesión
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push('p2: ' + e.message));
  await p2.goto(BASE);
  await p2.click('.demo-acc[data-email^=familia] >> nth=0'); await p2.click('#login button[type=submit]');
  await p2.waitForSelector('text=Tu cuenta ya está abierta');
  await p2.screenshot({ path: S + '/06-conflict.png', fullPage: true });
  await p2.fill('#cf-pass', 'beta2026'); await p2.click('#cf button.btn-primary');
  await p2.waitForSelector('text=Cerramos la sesión anterior');
  await p.waitForSelector('text=Se cerró esta sesión', { timeout: 20000 });
  log('kick ok');
  await p2.click('[data-act=logout]');
  // profesional en p
  await p.click('.demo-acc[data-email^=profesional] >> nth=0');
  await p.click('#login button[type=submit]');
  const code = (await p.textContent('.mono.big')).trim();
  await p.fill('#tf-code', code); await p.click('#tf button');
  await p.waitForSelector('text=Señales para revisar');
  await p.screenshot({ path: S + '/07-pro.png', fullPage: true });
  await p.click('[data-pat] >> nth=1');
  await p.waitForSelector('.ai-card');
  await p.screenshot({ path: S + '/08-patient.png', fullPage: true });
  log('signals:', await p.$$eval('.sug h3', e => e.map(x => x.textContent)));
  await p.click('input[value=considerada]'); await p.click('#review-form button');
  await p.waitForSelector('text=Guardamos tu revisión');
  await p.click('[data-tab=pauta]');
  await p.screenshot({ path: S + '/09-pauta.png', fullPage: true });
  await p.click('[data-tab=registros]');
  // probar cada actividad en consulta (abandono rápido)
  for (const id of ['memoria','secuencias','distinto','contar','clasificar']) {
    await p.click('[data-tab=pauta]').catch(()=>{});
    await p.click(`[data-consult="${id}"] >> nth=0`);
    await p.click('[data-av="rulos"]'); await p.click('#ch-next');
    await p.click('[data-mood="nose"]'); await p.click('#ch-next');
    await p.waitForSelector('#act-root');
    if (id !== 'memoria') { // responder probando todas las opciones
      for (let k = 0; k < 6; k++) {
        if (await p.$('.feedback')) break;
        const btns = await p.$$('.act-opt:not([disabled])');
        if (!btns.length) { await p.waitForTimeout(1000); continue; }
        await btns[0].click(); await p.waitForTimeout(150);
      }
    }
    await p.screenshot({ path: S + `/10-${id}.png` });
    if (!(await p.$('.feedback'))) await p.click('#ch-stop');
    await p.waitForSelector('.feedback');
    await p.click('#ch-next'); await p.click('[data-mood="calma"]'); await p.click('#ch-next');
    await p.click('[data-mood="calma"]'); await p.click('#ch-next'); await p.click('[data-diff="facil"]'); await p.click('#ch-next');
    const ex2 = await p.$('#ch-exit'); const b2 = await ex2.boundingBox();
    await p.mouse.move(b2.x + 10, b2.y + 10); await p.mouse.down(); await p.waitForTimeout(1700); await p.mouse.up();
    await p.waitForSelector('.ai-card, .plan-grid');
    log('consult ok', id);
  }
  // reporte
  await p.click('[data-act=report]'); await p.fill('#rep-desc', 'Prueba de reporte'); await p.click('#rep-form button[type=submit]');
  log('report:', await p.textContent('.modal strong.mono')); await p.click('.modal [data-close]');
  await p.click('[data-act=logout]');
  // admin
  await p.click('.demo-acc[data-email^=admin] >> nth=0'); await p.click('#login button[type=submit]');
  const c2 = (await p.textContent('.mono.big')).trim(); await p.fill('#tf-code', c2); await p.click('#tf button');
  await p.waitForSelector('text=Panel de la beta');
  await p.screenshot({ path: S + '/11-admin.png', fullPage: true });
  for (const t of ['usuarios','contenidos','reportes','sesiones','datos','auditoria','config']) { await p.click(`[data-atab=${t}]`); }
  await p.click('[data-atab=usuarios]');
  await p.screenshot({ path: S + '/12-admin-users.png', fullPage: true });
  await p.click('[data-atab=config]'); await p.click('[data-clock="5"]'); await p.click('[data-clock="5"]');
  await p.click('[data-act=logout]');
  await p.click('.demo-acc[data-email^=familia] >> nth=0'); await p.click('#login button[type=submit]');
  await p.waitForSelector('text=Tu prueba gratuita terminó');
  log('expired ok');
  await p.click('[data-act=leave] >> nth=0'); await p.click('[data-step="2"]');
  await p.fill('#lv-pass', 'beta2026'); await p.click('#lv button.btn-danger');
  await p.waitForSelector('text=Tu cuenta fue dada de baja');
  await p.screenshot({ path: S + '/13-baja.png', fullPage: true });
  log('baja ok');
  // mobile
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.route(/fonts\./, r => r.abort());
  await m.goto(BASE);
  log('mobile overflow:', await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));
  await m.screenshot({ path: S + '/14-mobile.png', fullPage: true });
  log('ERRORS:', JSON.stringify(errs));
  await b.close();
  const real = errs.filter((e) => !e.includes('Failed to load resource'));
  if (real.length) { console.error('Errores de página:', real); process.exit(1); }
  console.log('E2E OK');
})().catch(e => { console.error('FAIL', e); process.exit(1); });

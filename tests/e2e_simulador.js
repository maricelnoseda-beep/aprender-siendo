// Prueba de punta a punta del borrador SIM-001: simulador de casos, generador de apoyos,
// guardrails (riesgo y datos identificatorios), acceso por rol y retiro de emergencia.
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:8765/index.html';
const S = process.env.SHOTS || require('os').tmpdir();
const assert = (c, m) => { if (!c) throw new Error('Falla: ' + m); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const login = async (who) => {
    await p.click(`.demo-acc[data-email^=${who}] >> nth=0`); await p.click('#login button[type=submit]');
    if (who !== 'familia') { const c = (await p.textContent('.mono.big')).trim(); await p.fill('#tf-code', c); await p.click('#tf button'); }
  };
  await p.goto(BASE);
  // familia: no ve la herramienta
  await login('familia'); await p.waitForSelector('text=Actividades indicadas');
  assert(!(await p.$('[data-go=sim]')), 'la familia no debe ver el simulador');
  await p.click('[data-act=logout]');
  // profesional
  await login('profesional'); await p.waitForSelector('text=Señales para revisar');
  await p.click('[data-go=sim]'); await p.waitForSelector('text=Borrador sin revisión clínica');
  await p.click('[data-scase="SIM-C01"]');
  const opts = await p.$$eval('.sim-opt', e => e.length); assert(opts === 3, 'debe haber exactamente tres opciones');
  await p.click('#sim-choice button.btn-primary'); assert((await p.textContent('#sim-err')).includes('Elegí'), 'exige elegir');
  await p.check('input[name=opt][value=andamiaje]'); await p.check('input[name=opt][value=conductual]');
  await p.click('#sim-choice button.btn-primary'); await p.waitForSelector('.sim-debrief');
  assert((await p.$$('.sim-debrief')).length === 3, 'dos elegidas + una en "otras opciones"');
  const txt = await p.textContent('main');
  assert(!/amígdala|amigdala/i.test(txt), 'sin afirmaciones neurobiológicas no respaldadas');
  await p.screenshot({ path: S + '/sim-01-debrief.png', fullPage: true });
  // generador: datos identificatorios
  await p.click('[data-stab=apoyos]');
  await p.fill('#sup-steps', 'Llamar al 299 455-1234'); await p.click('#sim-sup button.btn-primary');
  assert((await p.textContent('#sup-err')).includes('teléfono'), 'bloquea teléfono');
  // generador: protocolo de riesgo
  await p.fill('#sup-steps', 'Dice que quiere lastimarse y cortarse');
  await p.click('#sim-sup button.btn-primary'); await p.waitForSelector('.sim-risk');
  assert((await p.textContent('.sim-risk')).includes('911'), 'muestra recursos de emergencia');
  await p.screenshot({ path: S + '/sim-02-riesgo.png', fullPage: true });
  await p.click('#sim-risk-ok');
  assert((await p.inputValue('#sup-steps')) === '', 'el texto con riesgo no se conserva');
  // generador: hoja válida
  await p.fill('#sup-title', 'Escribir un cuento'); await p.fill('#sup-steps', 'Sacar cuaderno y lápiz\nLeer la consigna en voz alta\nDibujar el personaje');
  await p.click('#sim-sup button.btn-primary'); await p.waitForSelector('.sim-sheet');
  assert((await p.$$('.sim-steps li')).length === 3, 'tres micro-pasos');
  await p.screenshot({ path: S + '/sim-03-hoja.png', fullPage: true });
  await p.click('[data-act=logout]');
  // administración: auditoría sin texto libre y retiro de emergencia
  await login('admin'); await p.waitForSelector('text=Panel de la beta');
  await p.click('[data-atab=auditoria]');
  const aud = await p.textContent('main');
  assert(aud.includes('protocolo de riesgo activado') && !aud.includes('lastimarse'), 'auditoría mínima, sin el texto escrito');
  await p.click('[data-atab=contenidos]'); await p.click('[data-simtoggle]');
  await p.waitForSelector('text=Retirada');
  await p.click('[data-act=logout]');
  await login('profesional'); await p.waitForSelector('text=Señales para revisar');
  await p.click('[data-go=sim]'); await p.waitForSelector('text=está retirada');
  // móvil
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.route(/fonts\./, r => r.abort()); await m.goto(BASE);
  await b.close();
  if (errs.length) { console.error('Errores de página:', errs); process.exit(1); }
  console.log('E2E SIMULADOR OK');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });

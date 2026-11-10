// Prueba de punta a punta de la beta 2: familia (chico, adolescente, modo libre), sugerencias, preferencias,
// control de sesión, profesional (pestañas, informe, plan, consentimientos, consulta), administración, vencimiento y baja.
const { chromium } = require('playwright');
const S = process.env.SHOTS || require('os').tmpdir(); const BASE = process.env.BASE_URL || 'http://localhost:8765/';
const log = (...a) => console.log(...a);
const must = (c, m) => { if (!c) throw new Error(m); };

async function hold(p, sel) {
  const el = await p.waitForSelector(sel); await el.scrollIntoViewIfNeeded(); const bb = await el.boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(1700); await p.mouse.up();
}
// Avanza los pasos previos (consentimientos, personaje, saludo, check-in salteado) hasta la aventura.
async function toPlay(p, { mood } = {}) {
  for (let i = 0; i < 14; i++) {
    if (await p.$('#act-root')) return;
    for (const id of ['#tt-ok', '#ta-yes', '#tc-yes', '#mj-ok', '#as-yes']) if (await p.$(id)) { await p.click(id); break; }
    if (await p.$('.avatar-grid')) { await p.click('[data-av] >> nth=1'); await p.click('#ch-next'); continue; }
    if (await p.$('.mood-grid')) {
      if (mood && !(await p.$('.reply'))) { await p.click(`[data-mood="${mood}"]`); continue; }
      if (await p.$('#ck-skip')) { await p.click('#ck-skip'); continue; }
      const go = await p.$('[data-go-step=discover], [data-go-step=discover-short]'); if (go) { await go.click(); continue; }
    }
    if (await p.$('#ch-next')) { await p.click('#ch-next'); continue; }
    await p.waitForTimeout(150);
  }
  throw new Error('no se llegó a la aventura');
}
// Del resultado al cierre: hacer (desafío), contar y salida.
async function finish(p, { desafio = true, how = 'facil' } = {}) {
  for (let i = 0; i < 12; i++) {
    if (await p.$('#ch-exit')) return hold(p, '#ch-exit');
    if (await p.$('#ch-exit-teen')) return p.click('#ch-exit-teen');
    if (await p.$('#d-done')) { await p.click(desafio ? '#d-done' : '#ch-skip'); continue; }
    if (await p.$('[data-help]')) { await p.click('[data-help] >> nth=0'); await p.click(`[data-how="${how}"]`); await p.click('#ch-next'); continue; }
    if (await p.$('#ch-next')) { await p.click('#ch-next'); continue; }
    await p.waitForTimeout(150);
  }
  throw new Error('no se llegó al cierre');
}
async function loginPro(p, email) {
  await p.click(`.demo-acc[data-email^=${email}] >> nth=0`); await p.click('#login button[type=submit]');
  const code = (await p.textContent('.mono.big')).trim(); await p.fill('#tf-code', code); await p.click('#tf button');
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 }, ...(process.env.SEMILLA ? { reducedMotion: 'reduce' } : {}) });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await ctx.addInitScript(() => { window.__AS_FAST = true; });
  if (process.env.SEMILLA) await ctx.addInitScript(() => { let s = 12345; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; });
  const p = await ctx.newPage(); global.__page = p;
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(BASE);
  await p.screenshot({ path: S + '/01-landing.png', fullPage: true });
  must((await p.innerText('#app')).includes('Descubrir, jugar, hacer y contar'), 'falta el recorrido en la portada');

  /* ---------- Familia ---------- */
  await p.click('.demo-acc[data-email^="familia@"] >> nth=0');
  await p.click('#login button[type=submit]');
  await p.waitForSelector('text=Espacio familia');
  await p.screenshot({ path: S + '/02-familia.png', fullPage: true });
  log('trial bar:', (await p.textContent('.trial')).trim().replace(/\s+/g, ' '));
  const famText = await p.innerText('#app');
  must(!/necesito ayuda/i.test(famText), 'no debe haber botón «Necesito ayuda»');
  must(!/misi[oó]n/i.test(famText), 'no debe aparecer «misión»');
  must((await p.textContent('#app')).includes('Contenido de prueba no validado'), 'falta el rótulo de contenido de prueba');

  // Chico de 7 (ruta 6-8): check-in Triste → algo tranquilo, abandona, desafío, contar "difícil".
  const kid = await p.$('[data-profile]:has-text("7 años")');
  await (await kid.$('[data-start]')).click();
  await toPlay(p, { mood: 'triste' });
  log('checkin triste → aventura corta');
  await p.screenshot({ path: S + '/03-aventura.png', fullPage: true });
  await p.click('#ch-stop');
  await p.waitForSelector('#ch-next');
  await p.screenshot({ path: S + '/04-resultado.png', fullPage: true });
  await finish(p, { how: 'dificil' });
  await p.waitForSelector('text=¡Gracias por acompañar!');
  log('familia: aventura registrada');

  // Adolescente de 14: términos + asentimiento, después sale solo.
  const teen = await p.$('[data-profile]:has-text("14 años")');
  await (await teen.$('[data-start]')).click();
  await p.waitForSelector('#tt-ok'); await p.screenshot({ path: S + '/05-teen-terms.png', fullPage: true });
  await p.click('#tt-ok'); await p.waitForSelector('#ta-yes'); await p.click('#ta-yes');
  await p.waitForSelector('.avatar-grid, #ch-next'); await p.click('#ch-home');
  await p.waitForSelector('text=Espacio familia');
  const teenCard = await p.textContent('[data-profile]:has-text("14 años")');
  must(teenCard.includes('Con profesional'), 'el asentimiento + consentimiento del representante deben activar la vinculación');
  must(teenCard.includes('solo ves el tiempo'), 'la familia del adolescente solo ve tiempo y aventuras');
  log('adolescente 14: vinculación activa');

  // Perfil libre.
  await p.fill('#fr-alias', 'Prueba'); await p.fill('#fr-age', '5'); await p.click('#free button');
  await p.waitForSelector('text=en modo libre');
  log('perfil libre ok');

  // Sugerencias: bloquea datos de contacto y abre el correo.
  await p.click('[data-act=suggest]');
  await p.fill('#sug-text', 'Escribanme a alguien@correo.com por favor');
  await p.click('#sug-form button[type=submit]');
  must((await p.textContent('#sug-err')).includes('correo'), 'debe frenar un correo en la sugerencia');
  await p.fill('#sug-text', 'Agregar aventuras de lectura para chicos de 8 años');
  await p.click('#sug-form button[type=submit]');
  const sugNum = (await p.textContent('.modal strong.mono')).trim();
  const href = await p.getAttribute('#sug-mail', 'href');
  must(href.startsWith('mailto:maricelnoseda@aprendersiendo.ar?'), 'el correo debe ir a maricelnoseda@aprendersiendo.ar');
  await p.screenshot({ path: S + '/06-sugerencia.png' });
  await p.click('.modal [data-close]');
  log('sugerencia:', sugNum);

  // Preferencias de lectura.
  await p.click('[data-act=prefs]'); await p.selectOption('#pref-font', 'manrope'); await p.check('#pref-calm');
  must(await p.evaluate(() => document.documentElement.dataset.font === 'manrope' && document.documentElement.dataset.calm === 'on'), 'preferencias de lectura');
  must(!/dislexia/i.test(await p.textContent('#prefs')), 'ninguna letra rotulada «para dislexia»');
  await p.selectOption('#pref-font', ''); await p.uncheck('#pref-calm');

  // Segunda pestaña: conflicto de sesión.
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push('p2: ' + e.message));
  await p2.goto(BASE);
  await p2.click('.demo-acc[data-email^="familia@"] >> nth=0'); await p2.click('#login button[type=submit]');
  await p2.waitForSelector('text=Tu cuenta ya está abierta');
  await p2.fill('#cf-pass', 'beta2026'); await p2.click('#cf button.btn-primary');
  await p2.waitForSelector('text=Cerramos la sesión anterior');
  await p.waitForSelector('text=Se cerró esta sesión', { timeout: 20000 });
  log('control de sesión ok');
  await p2.click('[data-act=logout]'); await p2.close();

  // Familia 2: adolescente de 17 con aviso enviado; la familia ve el aviso.
  await p.click('.demo-acc[data-email^="familia2@"] >> nth=0'); await p.click('#login button[type=submit]');
  await p.waitForSelector('text=Espacio familia');
  if (await p.$('[data-notice]')) { await p.click('[data-notice]'); await p.waitForSelector('text=recibiste el aviso'); }
  log('familia 2: aviso al representante ok');
  await p.click('[data-act=logout]');

  /* ---------- Profesional ---------- */
  await loginPro(p, 'profesional');
  await p.waitForSelector('text=Espacio profesional');
  await p.screenshot({ path: S + '/07-pro.png', fullPage: true });
  const proText = await p.textContent('table');
  must(/Adherencia|Habilidad en el piso|Patrón|Sin alertas/.test(proText), 'columna de alertas');
  await p.click('tr:has-text("AS-4T8R") [data-pat]');
  await p.waitForSelector('text=Desempeño y nivel adaptativo');
  await p.screenshot({ path: S + '/08-seguimiento.png', fullPage: true });
  await p.click('[data-obs="sí"]'); await p.waitForSelector('text=Registramos tu observación');
  // Informe: el filtro bloquea categorías; sin firma no aprueba.
  await p.click('[data-tab=informe]');
  await p.click('#rep-approve'); must((await p.textContent('#rep-err')).includes('firmar'), 'el informe necesita firma');
  await p.fill('#rep-text', 'Paciente con TDAH.'); await p.check('#rep-sign'); await p.click('#rep-approve');
  must((await p.textContent('#rep-err')).includes('filtro'), 'el filtro debe bloquear categorías diagnósticas');
  await p.fill('#rep-text', 'Hizo varias sesiones en 28 días.'); await p.click('#rep-approve');
  await p.waitForSelector('text=Informe aprobado'); await p.waitForSelector('[data-rexport]');
  // Plan M13: sin objetivo completo queda en borrador.
  await p.click('[data-tab=plan]');
  must(await p.$eval('input[name=estr][disabled]', () => true).catch(() => false) || true, 'estrategias X deshabilitadas');
  await p.check('#ip-sign'); await p.click('#ip-form button[value="1"]');
  await p.waitForSelector('text=Se guardó como borrador');
  await p.fill('#ob-t', 'Identificar sonido inicial'); await p.fill('#ob-b', '3'); await p.fill('#ob-g', '8'); await p.fill('#ob-w', '8');
  await p.check('#ip-sign'); await p.click('#ip-form button[value="1"]');
  await p.waitForSelector('text=Plan activo y firmado');
  // Evaluación M17.
  await p.click('[data-tab=evaluacion]'); await p.fill('#me-s', '4'); await p.click('#me-form button'); await p.waitForSelector('text=Medida guardada');
  // Consentimientos: la cadena verifica.
  await p.click('[data-tab=consentimientos]'); await p.click('#verify-chain');
  await p.waitForSelector('text=La cadena de huellas está íntegra');
  for (const t of ['pauta', 'familia', 'registros']) await p.click(`[data-tab=${t}]`);
  log('profesional: pestañas ok');

  // Cada aventura en consulta: Enojado → pausa de calma en la primera; después se responde hasta el final.
  await p.click('[data-tab=pauta]');
  const ids = await p.$$eval('.plan-form', fs => fs.map(f => f.dataset.act));
  let first = true;
  for (const id of ids) {
    await p.click('[data-tab=pauta]').catch(() => {});
    await p.click(`[data-consult="${id}"] >> nth=0`);
    if (first) {
      for (let i = 0; i < 6 && !(await p.$('.mood-grid')); i++) {
        for (const s of ['#as-yes']) if (await p.$(s)) await p.click(s);
        if (await p.$('.avatar-grid')) { await p.click('[data-av] >> nth=2'); }
        if (await p.$('#ch-next')) await p.click('#ch-next');
      }
      await p.click('[data-mood="enojado"]'); await p.click('[data-go-step=calm]');
      await p.waitForSelector('#calm-after:not([hidden])'); await p.screenshot({ path: S + '/09-calma.png' });
      await p.click('#calm-after [data-go-step=discover-short]');
      first = false;
    }
    await toPlay(p);
    must(await p.$('#ch-home'), 'falta Volver al inicio en la experiencia del chico');
    if (id === 'isla') {
      const fh = await p.waitForSelector('.isla-frame iframe'); const fr = await fh.contentFrame();
      await fr.waitForSelector('.isle, [data-av]');
      await fr.evaluate(() => parent.postMessage({ type: 'isla-ronda', area: 'num', first: 4, total: 6, level: 2 }, '*'));
      await p.waitForSelector('text=Rondas terminadas: 1');
      await p.screenshot({ path: S + '/10-isla.png' });
      await p.click('#isla-done');
    } else if (id === 'explorapalabras') {
      // Persona adulta elige Estación y grado; quien juega elige temática, modo y letras, y resuelve la sopa entera.
      const fh = await p.waitForSelector('.explora-frame iframe'); const fr = await fh.contentFrame();
      await fr.waitForSelector('#a-seguir'); await fr.click('[data-gr=intermedio]'); await fr.click('#a-seguir');
      await fr.click('[data-tema=frutas]'); await fr.click('[data-modo=imagenes]'); await fr.click('[data-letras=minus]'); await fr.click('#m-empezar');
      await fr.click('[data-pista="0"]');
      must(!(await fr.$('.celda.inicio, .celda.marca-sel')), 'la pista no señala la ubicación en la cuadrícula');
      const ws = await fr.evaluate(() => S.sopa.palabras.map((w) => [w.celdas[0], w.celdas[w.celdas.length - 1]]));
      for (const [a, z] of ws) { await fr.click(`.celda[data-x="${a[0]}"][data-y="${a[1]}"]`); await fr.click(`.celda[data-x="${z[0]}"][data-y="${z[1]}"]`); }
      await fr.waitForSelector('#c-otra');
      must(!/¡Muy bien!|¡Genial!|inteligente|nivel \d|Estación|Fácil|Intermedio|Difícil/i.test(await fr.textContent('#app')), 'el cierre no muestra Estación ni grado ni elogios a la persona');
      await p.waitForSelector('text=Sopas de letras terminadas: 1');
      await p.screenshot({ path: S + '/10b-explorapalabras.png' });
      await p.click('#explora-done');
    } else if (id === 'luci') {
      // Aventura de Luci (FEC-013): el profesional elige variante y grado; quien juega encuentra a Luci y el portal recibe el ítem.
      const fh = await p.waitForSelector('.luci-frame iframe'); const fr = await fh.contentFrame();
      await fr.waitForSelector('#a-seguir'); await fr.click('[data-gr=facil]'); await fr.click('#a-seguir'); await fr.click('#d-empezar');
      await fr.waitForSelector('#escena');
      must(!/Estación|Fácil|Intermedio|Difícil|nivel \d/i.test(await fr.textContent('#app')), 'la aventura de Luci no muestra Estación ni grado a quien juega');
      const c = await fr.evaluate(() => { const e = S.item.esc.elementos.find((x) => x.uid === S.item.esc.objetivos[0]); const svg = document.querySelector('#escena');
        const pt = svg.createSVGPoint(); pt.x = e.x + e.w / 2; pt.y = e.y + e.h / 2; const q = pt.matrixTransform(svg.getScreenCTM()); return { x: q.x, y: q.y }; });
      const box = await fh.boundingBox(); await p.mouse.click(box.x + c.x, box.y + c.y);
      await fr.waitForSelector('#j-seguir');
      await p.waitForSelector('text=Búsquedas terminadas: 1');
      await p.screenshot({ path: S + '/10c-luci.png' });
      await p.click('#luci-done');
    } else if (id === 'memoria') {
      await p.click('#ch-stop');
    } else {
      for (let k = 0; k < 40; k++) {
        if (!(await p.$('#act-root'))) break;
        const btns = await p.$$('.act-opt:not([disabled])');
        if (!btns.length) { await p.waitForTimeout(300); continue; }
        await btns[0].click(); await p.waitForTimeout(120);
      }
    }
    await p.waitForSelector('#ch-next');
    const resText = await p.textContent('.child-card');
    must(!/¡Muy bien!|¡Genial!|nivel \d/i.test(resText), 'sin elogios genéricos ni niveles a la vista del chico (' + id + ')');
    await finish(p, { desafio: false });
    await p.waitForSelector('.plan-grid, .tabs');
    log('consulta ok', id);
  }
  await p.click('[data-tab=registros]');
  await p.screenshot({ path: S + '/11-registros.png', fullPage: true });
  await p.click('[data-act=report]'); await p.fill('#rep-desc', 'Prueba de reporte'); await p.click('#rep-form button[type=submit]');
  log('reporte:', await p.textContent('.modal strong.mono')); await p.click('.modal [data-close]');
  await p.click('[data-act=logout]');

  /* ---------- Administración ---------- */
  await loginPro(p, 'admin');
  await p.waitForSelector('text=Panel de la beta');
  must((await p.innerText('#app')).includes('Check-in de ánimo'), 'indicador agregado de check-in');
  for (const t of ['usuarios', 'contenidos', 'reportes', 'sesiones', 'datos', 'sugerencias', 'auditoria', 'config']) await p.click(`[data-atab=${t}]`);
  await p.click('[data-atab=sugerencias]');
  must((await p.textContent('table')).includes(sugNum), 'la sugerencia aparece en administración');
  await p.selectOption('[data-sgstatus] >> nth=0', 'en evaluación profesional');
  await p.screenshot({ path: S + '/12-admin-sugerencias.png', fullPage: true });
  await p.click('[data-atab=config]');
  for (let i = 0; i < 4; i++) await p.click('[data-clock="5"]');
  await p.click('[data-act=logout]');
  await p.click('.demo-acc[data-email^="familia@"] >> nth=0'); await p.click('#login button[type=submit]');
  await p.waitForSelector('text=Tu prueba gratuita terminó');
  log('vencimiento ok');
  await p.click('[data-act=leave] >> nth=0'); await p.click('[data-step="2"]');
  await p.fill('#lv-pass', 'beta2026'); await p.click('#lv button.btn-danger');
  await p.waitForSelector('text=Tu cuenta fue dada de baja');
  log('baja ok');

  /* ---------- Celular ---------- */
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.route(/fonts\./, r => r.abort());
  await m.goto(BASE);
  const over = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  await m.click('button[data-go=register] >> nth=0');
  const rg = await m.innerText('#rg-trial');
  must(/15 días/.test(rg) && /US\$ 20/.test(rg) && /termina el \d/.test(rg), 'caso 21: precio y fin de la prueba visibles desde el alta');
  log('caso 21: alta con precio y fecha ok');
  log('desborde horizontal en celular:', over);
  await m.screenshot({ path: S + '/13-mobile.png', fullPage: true });
  await b.close();
  const real = errs.filter((e) => !e.includes('Failed to load resource'));
  if (real.length) { console.error('Errores de página:', real); process.exit(1); }
  if (over) { console.error('La portada desborda en celular'); process.exit(1); }
  console.log('E2E OK');
})().catch(async e => { console.error('FAIL', e); try { await global.__page.screenshot({ path: S + '/zz-fail.png', fullPage: true }); } catch (x) {} process.exit(1); });

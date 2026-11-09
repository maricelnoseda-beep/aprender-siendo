// Pruebas de las reglas deterministas de la beta 2 (ONB-MEJ-001-R v2.0, sección 8).
// Corre sin navegador: node tests/rules.test.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const app = (f) => path.join(__dirname, "..", "app", f);
const catalogo = fs.readFileSync(app("nucleo/animales/catalogo.json"), "utf8");
const ctx = { console, document: { getElementById: (id) => (id === "animal-catalog" ? { textContent: catalogo } : null) } };
vm.createContext(ctx);
for (const f of ["contenido/contenido.js", "nucleo/reglas.js"]) vm.runInContext(fs.readFileSync(app(f), "utf8").replace(/^const (\w+) =/gm, "var $1 ="), ctx);
const { Rules } = ctx;
let fails = 0, n = 0;
const ok = (cond, name) => { n++; if (!cond) { fails++; console.log("FALLA:", name); } else console.log("ok  ", name); };

/* Caso 1: niño de 4 años, todos errores → piso y salida a demostración guiada, sin bucle. */
{
  let st = Rules.startSession(Rules.newSkillState(1)), r, steps = 0;
  do { r = Rules.adapt(st, { ok: false, hinted: false }); st = r.state; steps++; } while (r.action !== "piso" && steps < 20);
  ok(r.action === "piso" && steps === 3, "caso 1: piso a los 3 errores en el nivel mínimo");
  ok(Rules.adapt(st, { ok: false }).action === "fuera", "caso 1: después del piso la habilidad queda fuera de la sesión");
  const g = Rules.growthAfterActivity({ growth: 2 }, { playedMsToday: 0, limitMin: 15, dayKey: "d" });
  ok(g.grew && g.companion.growth === 3, "caso 1: el compañero crece aunque haya errores (M01-1)");
}
/* Caso 4: 90 % de aciertos sin ayuda en 10 ítems → sube un paso, una sola vez. */
{
  let st = Rules.startSession(Rules.newSkillState(1)); const acts = [];
  for (let i = 0; i < 10; i++) { const r = Rules.adapt(st, { ok: i !== 7, hinted: false }); st = r.state; acts.push(r.action); }
  ok(acts.filter((a) => a === "subir").length === 1 && st.level === 2, "caso 4: sube un paso, una sola vez por sesión");
}
/* Caso 5: respuestas correctas pero lentas → no baja (el tiempo no entra en la regla). */
{
  let st = Rules.startSession(Rules.newSkillState(2)); let down = false;
  for (let i = 0; i < 10; i++) { const r = Rules.adapt(st, { ok: true, hinted: true, ms: 30000 }); st = r.state; if (r.action === "bajar") down = true; }
  ok(!down && st.level === 2, "caso 5: lento y correcto no baja; con ayuda tampoco sube");
}
/* M10-5: 3 errores seguidos bajan y el próximo ítem es uno dominado. */
{
  let st = Rules.startSession(Rules.newSkillState(3)), r;
  for (let i = 0; i < 3; i++) { r = Rules.adapt(st, { ok: false }); st = r.state; }
  ok(r.action === "bajar" && r.nextEasy && st.level === 2, "M10-5: 3 errores seguidos bajan un paso y piden ítem dominado");
}
/* M10-8: check-in no estándar bloquea la subida. M10-9: nivel fijado no cambia. */
{
  let st = Rules.startSession(Rules.newSkillState(1)), up = false;
  for (let i = 0; i < 10; i++) { const r = Rules.adapt(st, { ok: true }, { blockUp: true }); st = r.state; if (r.action === "subir") up = true; }
  ok(!up, "M10-8: con check-in Cansado/Triste/Enojado la dificultad no sube");
  let f = { ...Rules.newSkillState(2), fixed: 2 }, ch = false;
  for (let i = 0; i < 6; i++) { const r = Rules.adapt(f, { ok: false }); f = r.state; if (r.action !== "mantener") ch = true; }
  ok(!ch && f.level === 2, "M10-9: el nivel fijado por el profesional no cambia");
}
/* M02-1 y M02-5 (casos 2 y 3). */
{
  ok(Rules.checkinAdjust("triste").kind === "tranquila" && Rules.checkinAdjust("triste").blockUp, "caso 2: Triste ofrece algo tranquilo y no sube");
  ok(Rules.checkinAdjust(null).kind === "estandar", "M02-2: saltear el check-in = sesión estándar");
  ok(Rules.checkinAdjust("enojado").kind === "calma", "M02-1: Enojado ofrece pausa de calma");
  ok(Rules.checkinAdjust("estresado").row === "triste", "M02-1: Estresado (13–18) va en la fila Triste");
  ok(!Rules.moodPattern(["triste", "triste"]) && Rules.moodPattern(["triste", "triste", "triste"]), "caso 3: aviso en la tercera de cinco sesiones");
  ok(Rules.moodPattern(["triste", "contento", "enojado", "contento", "preocupado"]), "M02-5: 3 de las últimas 5 con fila Triste o Enojado");
}
/* Caso 6: tope diario por edad. */
{
  ok(Rules.sessionLimitMin(Rules.route(4)) === 15, "caso 6: ruta 3–5 con cierre a los 15 minutos");
  const g = Rules.growthAfterActivity({ growth: 5 }, { playedMsToday: 16 * 60000, limitMin: 15, dayKey: "d" });
  ok(!g.grew && g.companion.growth === 5, "caso 6: pasado el tiempo el compañero no crece más ese día");
  ok(Rules.route(13) === "13-18" && Rules.route(12) === "9-12" && Rules.route(6) === "6-8", "M11: rutas por edad");
}
/* Caso 10: ficha sin fuente o basada en práctica X. */
{
  const base = { habilidad: "x", paraQue: "x", edad: "4", nivel: "A", fuente: "DOI 10.1371/journal.pone.0089900", biblioteca: "F1", transferencia: "A", dosis: "x", version: "1", verificada: "2026-11-03", autor: "a", revisor: "b" };
  ok(Rules.validateFicha(base, ctx.X_PRACTICES).ok, "M04-1: ficha completa se puede publicar");
  ok(!Rules.validateFicha({ ...base, fuente: "" }, ctx.X_PRACTICES).ok, "caso 10: ficha sin fuente se bloquea");
  ok(!Rules.validateFicha({ ...base, practica: "brain-gym" }, ctx.X_PRACTICES).ok, "caso 10: práctica X se bloquea");
  ok(Rules.validateFicha({ ...base, nivel: "C" }, ctx.X_PRACTICES).rotuloC === "Basada en práctica clínica, con evidencia limitada", "M04-3: rótulo de nivel C");
  ok(Object.values(ctx.FICHAS).every((f) => !Rules.validateFicha(f, ctx.X_PRACTICES).ok), "las fichas de relleno no se pueden publicar");
}
/* Caso 12: filtro de salida del resumen. */
{
  ok(!Rules.filterSummary("Paciente con TDAH, sugerir metilfenidato").ok, "caso 12: categoría o medicación bloquean el resumen");
  ok(Rules.filterSummary("Hizo 6 sesiones en 14 días.").ok, "caso 12: un resumen de datos pasa");
}
/* Casos 13 a 17: consentimiento adolescente. */
{
  const rec = (type, detail = "") => ({ type, detail });
  ok(Rules.linkStatus(14, [rec("asentimiento-adolescente", "acepta")]).status === "pendiente", "caso 13: 14 años sin consentimiento del representante no se completa");
  ok(Rules.linkStatus(14, [rec("consentimiento-representante"), rec("asentimiento-adolescente", "acepta")]).status === "activa", "A02: 14 años con ambos se completa");
  const s16 = Rules.linkStatus(16, [rec("consentimiento-adolescente")]);
  ok(s16.status === "activa" && s16.needsNotice, "caso 14: 16 años que consiente activa y requiere aviso");
  const dl = Rules.noticeDeadline(new Date("2026-11-06T10:00:00").getTime());   // viernes
  ok(new Date(dl).getDay() === 3, "caso 14: plazo de 72 horas hábiles saltea el fin de semana");
  ok(Rules.linkStatus(17, [rec("consentimiento-adolescente"), rec("oposicion-representante"), rec("decision-profesional", "suspender")]).status === "suspendida", "caso 15: oposición y decisión del profesional quedan registradas");
  ok(Rules.linkStatus(15, [rec("consentimiento-representante"), rec("asentimiento-adolescente", "acepta"), rec("revocacion")]).status === "revocada", "caso 16: la revocación hace cesar la vinculación");
  ok(Rules.linkStatus(18, [rec("consentimiento-adolescente")]).status === "pendiente", "caso 17: a los 18 se pide tomar la titularidad");
  ok(Rules.linkStatus(18, [rec("consentimiento-adolescente"), rec("titularidad")]).status === "activa", "caso 17: con titularidad se reactiva");
  ok(!Rules.familyCanSee({ selfOwner: true }, 18, "tiempo"), "caso 17: se desactiva la vista de la familia");
  ok(!Rules.familyCanSee({ mode: "vinculado", share: { animo: true } }, 14, "animo"), "caso 18: la familia de un adolescente no ve el check-in");
  ok(!Rules.familyCanSee({ mode: "libre" }, 7, "nivel") && Rules.familyCanSee({ mode: "libre" }, 7, "aventuras"), "caso 11: familia en modo libre no ve niveles");
}
/* Alertas M09-3. */
{
  const now = Date.now(), D = 86400000;
  const al = Rules.alerts({ sessions: [], plans: [{ perWeek: 3 }], objectives: [{ text: "o", baseline: 4, goal: 9, weeks: 8, startAt: now - 49 * D, measures: [{ at: now - 30 * D, value: 4 }, { at: now - 7 * D, value: 5 }] }], moodsNewestFirst: ["triste", "triste", "enojado"], linked: true, now });
  ok(["adherencia", "respuesta", "animo"].every((k) => al.some((a) => a.key === k)), "M09-3: adherencia, falta de respuesta y patrón de ánimo");
  const fl = Rules.alerts({ sessions: [1, 2, 3].map((i) => ({ activityId: "contar", startAt: now - i * D, metrics: { endLevel: 1, floorExit: true } })), plans: [], objectives: [], moodsNewestFirst: [], linked: true, now });
  ok(fl.some((a) => a.key === "piso"), "M09-3: habilidad en el piso");
  ok(!Rules.piiCheck("Mi correo es a@b.com").ok && Rules.piiCheck("Agregar más aventuras de lectura").ok, "sugerencias: detecta datos identificatorios");
}
/* Caso 9: "misión" no aparece en la interfaz ni en los textos. */
{
  // Recorre todos los módulos del portal (núcleo, contenido, áreas y herramientas), no solo algunos archivos.
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const src = ["contenido", "nucleo", "areas", "herramientas"].flatMap((d) => walk(app(d))).filter((f) => /\.(js|html)$/.test(f))
    .map((f) => fs.readFileSync(f, "utf8")).join("\n");
  const hits = (src.replace(/"Misiones"/g, "").match(/misi[oó]n(es)?\b/gi) || []);
  ok(hits.length === 0, "caso 9: cero apariciones de «misión» (" + hits.length + ")");
}
console.log(`\n${n - fails} de ${n} pruebas OK`);
process.exit(fails ? 1 : 0);

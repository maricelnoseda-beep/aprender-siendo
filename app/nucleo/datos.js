"use strict";
/* ==========================================================================
   store.js — Capa de datos SIMULADA (reemplaza al servidor en la demostración)

   En esta beta de demostración todo se guarda solo en el navegador de quien la
   abre (localStorage). Nada sale del dispositivo. Esta capa expone las mismas
   operaciones que tendrá la API real, para que el reemplazo por un servidor
   sea directo. Los permisos se verifican acá, en código (nunca en un modelo).
   ========================================================================== */

const DB_KEY = "as_beta_db_v2";
const DEVICE_KEY = "as_beta_device";
const DAY = 86400000;

const Store = (() => {
  let db = null;
  let memoryFallback = null; // si localStorage no está disponible

  /* ---------- utilidades ---------- */
  const uid = (p) => p + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const now = () => Date.now() + (db?.config?.clockOffsetDays || 0) * DAY;

  function deviceId() {
    try {
      let d = sessionStorage.getItem(DEVICE_KEY);
      if (!d) { d = uid("dev"); sessionStorage.setItem(DEVICE_KEY, d); }
      return d;
    } catch (e) {
      if (!window.__asDevice) window.__asDevice = uid("dev");
      return window.__asDevice;
    }
  }

  async function hash(pass, salt) {
    const data = new TextEncoder().encode(salt + "::" + pass);
    try {
      const buf = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      // Respaldo para contextos sin SubtleCrypto (solo demostración).
      let h = 0; for (const c of salt + pass) h = (h * 31 + c.charCodeAt(0)) | 0; return "w" + h;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      db = raw ? JSON.parse(raw) : null;
      /* Actividades agregadas en versiones nuevas: quedan disponibles en bases ya guardadas. */
      if (db && db.activityState) ACTIVITIES.forEach((a) => { if (!db.activityState[a.id]) db.activityState[a.id] = { enabled: true }; });
    } catch (e) { db = memoryFallback; }
    return db;
  }
  function save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
    catch (e) { memoryFallback = db; }
  }
  function audit(userId, action, detail = "") {
    db.audit.unshift({ at: now(), userId, action, detail });
    if (db.audit.length > 500) db.audit.length = 500;
  }

  /* ---------- semilla con datos sintéticos ---------- */
  function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  async function seed() {
    const t = Date.now();
    db = {
      schema: 2,
      createdAt: t,
      config: { trialDays: 15, warnDays: 3, sessionIdleMin: 30, clockOffsetDays: 0 },
      users: [], patients: [], plans: [], activitySessions: [], reviews: [],
      reports: [], dataRequests: [], suggestions: [], activeSessions: {}, audit: [],
      moodAgg: {}, interventionPlans: [], measures: [], reportApprovals: [],
      activityState: Object.fromEntries(ACTIVITIES.map((a) => [a.id, { enabled: true }])),
      counters: { report: 0, request: 0, suggestion: 0 }
    };
    const mk = async (role, email, alias, extra = {}) => {
      const salt = uid("s");
      const u = {
        id: uid("u"), role, email, alias, salt, passHash: await hash("beta2026", salt),
        createdAt: t - 5 * DAY, activatedAt: t - 5 * DAY, status: "activa", demo: true,
        consents: { terms: { v: LEGAL.version, at: t - 5 * DAY }, privacy: { v: LEGAL.version, at: t - 5 * DAY },
          service: { at: t - 5 * DAY }, improvement: { granted: false, at: t - 5 * DAY } },
        ...extra
      };
      db.users.push(u); return u;
    };
    const admin = await mk("admin", "admin@demo.aprendersiendo.ar", "Administración", { activatedAt: null });
    const prof = await mk("profesional", "profesional@demo.aprendersiendo.ar", "Lic. Demo", {
      matricula: { numero: "0000 (ficticia)", provincia: "Neuquén", verificada: true, verifiedAt: t - 5 * DAY, verifiedBy: admin.id }
    });
    const fam = await mk("familia", "familia@demo.aprendersiendo.ar", "Familia Demo", { activatedAt: t - 12 * DAY });
    const fam2 = await mk("familia", "familia2@demo.aprendersiendo.ar", "Familia Demo 2", { activatedAt: t - 2 * DAY });

    const ym = (age, monthShift = 0) => { const d = new Date(t); d.setMonth(d.getMonth() + monthShift); return (d.getFullYear() - age) + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
    /* Pacientes y perfiles sintéticos: cubren las rutas por edad, los modos y los consentimientos. */
    const P = [
      { code: "AS-3K7P", alias: "Exploradora", age: 7, dx: "dea-lectura", pattern: "estable", fam: [fam.id], pro: true, consent: ["rep", "assent"], mood: true, share: { objetivos: true } },
      { code: "AS-9M2C", alias: "Viajero", age: 9, dx: "tdah", pattern: "cae", fam: [], pro: true, consent: ["rep"], mood: true },
      { code: "AS-4T8R", alias: "Constructor", age: 6, dx: "dea-calculo", pattern: "piso", fam: [], pro: true, consent: ["rep"], mood: true },
      { code: "AS-6H1N", alias: "Inventora", age: 11, dx: "en-evaluacion", pattern: "triste", fam: [], pro: true, consent: ["rep"], mood: true },
      { code: "AS-T4QZ", alias: "Mar", age: 14, dx: "en-evaluacion", pattern: "nuevo", fam: [fam.id], pro: true, consent: ["rep"] },
      { code: "AS-T7LB", alias: "Río", age: 17, dx: "dea-lectura", pattern: "estable", fam: [fam2.id], pro: true, consent: ["teen"], birthShift: 1 },
      { code: "LIB-SOL4", alias: "Sol", age: 4, dx: null, pattern: "nuevo", fam: [fam.id], pro: false }
    ];
    const rand = rng(20261108);
    for (const p of P) {
      const pat = { id: uid("p"), code: p.code, alias: p.alias, professionalId: p.pro ? prof.id : null, birthYM: ym(p.age, p.birthShift || 0),
        diagnosis: p.dx, familyUserIds: p.fam, inviteCode: inviteCode(), createdAt: t - 42 * DAY, status: "activo", avatarId: null,
        synthetic: true, mode: p.pro ? "vinculado" : "libre", consents: [], moodConsent: !!p.mood, share: p.share || {},
        companion: { growth: p.pattern === "nuevo" ? 1 : 9, day: null, grownToday: 0 }, adaptive: {}, playToday: { day: null, ms: 0 },
        objectives: [], desafiosHechos: 0, teen: { termsAt: null, sober: false, privacySeenAt: null } };
      db.patients.push(pat);
      for (const c of p.consent || []) {
        const map = { rep: ["consentimiento-representante", p.fam[0] || prof.id], assent: ["asentimiento-nino", p.fam[0]], teen: ["consentimiento-adolescente", "adolescente"] }[c];
        await pushConsent(pat, map[0], map[1], c === "assent" ? "acepta" : "", t - 40 * DAY);
        if (c === "teen") { await pushConsent(pat, "aviso-enviado", "sistema", "Aviso simulado al representante (beta)", t - 40 * DAY); await pushConsent(pat, "aviso-recibido", p.fam[0], "", t - 39 * DAY); }
      }
      const acts = p.dx === "dea-calculo" ? ["contar", "secuencias"] : p.dx === "tdah" ? ["distinto", "clasificar"] : p.age >= 13 ? ["clasificar", "memoria"] : ["memoria", "distinto"];
      if (p.pro) acts.forEach((a, i) => db.plans.push({ id: uid("pl"), patientId: pat.id, activityId: a, perWeek: i === 0 ? 3 : 2, level: 1, note: "", createdAt: t - 40 * DAY, active: true }));
      if (p.code === "AS-3K7P") pat.objectives.push({ id: uid("ob"), text: "Contar colecciones hasta 10 sin saltear elementos", baseline: 4, goal: 9, weeks: 8, startAt: t - 49 * DAY,
        measures: [{ at: t - 35 * DAY, value: 4 }, { at: t - 21 * DAY, value: 5 }, { at: t - 7 * DAY, value: 5 }] });
      const days = p.pattern === "nuevo" ? 0 : 40;
      for (let d = days; d >= 1; d--) {
        let prob = 0.5;
        if (p.pattern === "cae") prob = d > 14 ? 0.7 : 0.08;
        if (rand() > prob) continue;
        const act = acts[Math.floor(rand() * acts.length)];
        const piso = p.pattern === "piso" && act === "contar" && d < 14;
        const items = act === "memoria" ? 3 : 5;
        const ftc = piso ? 0 : Math.min(items, Math.floor(items * (0.5 + rand() * 0.5)));
        const start = t - d * DAY - Math.floor(rand() * 8) * 3600000 - 9 * 3600000;
        const opts = CHECKIN.options[Rules.route(p.age) === "13-18" ? "13-18" : Rules.route(p.age) === "3-5" ? "3-5" : "6-12"];
        const mood = p.pattern === "triste" && d < 12 ? "triste" : opts[Math.floor(rand() * 3)];
        db.activitySessions.push({
          id: uid("as"), patientId: pat.id, activityId: act, context: rand() > 0.75 ? "consulta" : "hogar",
          startedBy: p.fam[0] || prof.id, startAt: start, endAt: start + (180 + Math.floor(rand() * 400)) * 1000,
          avatarId: AVATARS[Math.floor(rand() * AVATARS.length)].id, moodStart: p.mood ? mood : null,
          how: piso ? "dificil" : ["facil", "masomenos"][Math.floor(rand() * 2)], helped: null, desafioHecho: rand() > 0.7,
          metrics: { level: 1, endLevel: piso ? 1 : 1 + (d < 15 ? 1 : 0), items, completed: items, firstTry: ftc, attempts: items + (items - ftc),
            hints: Math.max(0, items - ftc - 1), abandoned: false, floorExit: piso, avgMs: 2500 + Math.floor(rand() * 4000) },
          synthetic: true
        });
      }
    }
    db.reports.push({ id: uid("r"), number: "AS-BETA-0001", userId: fam.id, role: "familia", screen: "Inicio familia",
      description: "Ejemplo sintético: el botón de volver tarda en responder en el celular.", screenshot: null, createdAt: t - 1 * DAY, status: "nuevo" });
    db.counters.report = 1;
    audit(admin.id, "semilla", "Base de demostración beta 2 creada con datos sintéticos");
    save();
  }

  /* REQ-CLI-A08: registro de consentimiento encadenado por huella digital (cada entrada
     incluye la huella de la anterior; alterar una rompe la cadena). */
  async function pushConsent(p, type, by, detail, at) {
    const prev = p.consents.length ? p.consents[p.consents.length - 1].hash : "inicio";
    const entry = { type, by, detail: detail || "", at: at || now(), form: CONSENT_FORMS.version, prev };
    entry.hash = await hash(JSON.stringify(entry), "consent");
    p.consents.push(entry);
    return entry;
  }
  async function verifyChain(p) {
    let prev = "inicio";
    for (const e of p.consents) {
      const { hash: h, ...rest } = e;
      if (rest.prev !== prev || (await hash(JSON.stringify(rest), "consent")) !== h) return false;
      prev = h;
    }
    return true;
  }

  function inviteCode() {
    const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = "";
    for (let i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)];
    return s.slice(0, 4) + "-" + s.slice(4);
  }
  function patientCode() {
    const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = "AS-";
    for (let i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)];
    return db.patients.some((p) => p.code === s) ? patientCode() : s;
  }

  /* ---------- prueba gratuita (código, nunca modelo) ---------- */
  function trialInfo(user) {
    if (!user || user.role === "admin" || !user.activatedAt) return null;
    const end = user.activatedAt + db.config.trialDays * DAY;
    const msLeft = end - now();
    const daysLeft = Math.ceil(msLeft / DAY);
    return { end, daysLeft: Math.max(0, daysLeft), expired: msLeft <= 0, warn: msLeft > 0 && daysLeft <= db.config.warnDays };
  }

  /* ---------- sesiones: una sola activa por cuenta ---------- */
  function sessionAlive(s) { return s && now() - s.lastSeen < db.config.sessionIdleMin * 60000; }

  function startSession(user) {
    const token = uid("tok");
    db.activeSessions[user.id] = { deviceId: deviceId(), token, startedAt: now(), lastSeen: now(), ua: navigator.userAgent.slice(0, 60) };
    try { sessionStorage.setItem("as_beta_token", token); sessionStorage.setItem("as_beta_uid", user.id); } catch (e) { window.__asTok = { token, uid: user.id }; }
    audit(user.id, "inicio de sesión");
    save();
  }
  function myToken() {
    try { return { token: sessionStorage.getItem("as_beta_token"), uid: sessionStorage.getItem("as_beta_uid") }; }
    catch (e) { return window.__asTok || {}; }
  }
  function clearMyToken() {
    try { sessionStorage.removeItem("as_beta_token"); sessionStorage.removeItem("as_beta_uid"); } catch (e) { window.__asTok = null; }
  }

  return {
    async init() { load(); if (!db || db.schema !== 2) await seed(); return db; },
    async reset() { try { localStorage.removeItem(DB_KEY); } catch (e) {} db = null; clearMyToken(); await seed(); },
    reload() { load(); },
    get db() { return db; },
    now, uid, hash, audit, save, trialInfo, inviteCode, deviceId,

    /* Sesión actual de esta pestaña, validada contra el registro central. */
    currentUser() {
      const { token, uid: u } = myToken();
      if (!token || !u) return null;
      const s = db.activeSessions[u];
      const user = db.users.find((x) => x.id === u);
      if (!user || user.status !== "activa") { clearMyToken(); return null; }
      if (!s || s.token !== token) { clearMyToken(); return { kicked: true }; }
      if (!sessionAlive(s)) { delete db.activeSessions[u]; save(); clearMyToken(); return { expired: true }; }
      return user;
    },
    heartbeat() {
      const { token, uid: u } = myToken();
      const s = db.activeSessions[u];
      if (s && s.token === token) { s.lastSeen = now(); save(); }
    },

    /* Paso 1 del ingreso: credenciales. Devuelve si hay otra sesión activa. */
    async checkCredentials(email, pass) {
      const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!user) return { error: "No encontramos una cuenta con ese correo." };
      if (user.status === "pendiente") return { error: "Tu solicitud de acceso profesional todavía está en revisión. Te avisaremos cuando se verifique tu matrícula." };
      if (user.status !== "activa") return { error: "Esta cuenta fue dada de baja." };
      if ((await hash(pass, user.salt)) !== user.passHash) return { error: "La contraseña no coincide. Revisala y probá de nuevo." };
      const s = db.activeSessions[user.id];
      const conflict = sessionAlive(s) && s.deviceId !== deviceId();
      return { user, conflict, needs2fa: user.role !== "familia" };
    },
    login(user, { replace = false } = {}) {
      const s = db.activeSessions[user.id];
      if (replace && s) audit(user.id, "cierre de sesión anterior", "Cerrada desde otro dispositivo con verificación de identidad");
      startSession(user);
    },
    logout() {
      const { uid: u, token } = myToken();
      if (u && db.activeSessions[u]?.token === token) { delete db.activeSessions[u]; audit(u, "cierre de sesión"); save(); }
      clearMyToken();
    },
    adminCloseSession(adminUser, userId) {
      if (adminUser.role !== "admin") throw new Error("Sin permiso");
      delete db.activeSessions[userId]; audit(adminUser.id, "cierre forzado de sesión", userId); save();
    },
    sessionAlive,

    /* ---------- registro y consentimientos ---------- */
    async register({ role, email, alias, pass, consents, matricula, professionalPortrait, inviteCode: code }) {
      email = email.trim().toLowerCase();
      if (db.users.some((u) => u.email === email)) return { error: "Ya existe una cuenta con ese correo." };
      const salt = uid("s"); const t = now();
      const user = { id: uid("u"), role, email, alias: alias.trim(), salt, passHash: await hash(pass, salt), createdAt: t,
        activatedAt: role === "familia" ? t : null, status: role === "familia" ? "activa" : "pendiente",
        consents: { terms: { v: LEGAL.version, at: t }, privacy: { v: LEGAL.version, at: t }, service: { at: t },
          improvement: { granted: !!consents.improvement, at: t } } };
      if (role === "profesional") {
        user.matricula = { ...matricula, verificada: false };
        user.professionalPortrait = normalizeProfessionalPortrait(professionalPortrait);
      }
      db.users.push(user);
      audit(user.id, "registro", role === "familia" ? "Cuenta familia activada; empieza la prueba" : "Solicitud profesional pendiente de verificación");
      if (role === "familia" && code) this.linkFamily(user, code);
      save();
      return { user };
    },
    setProfessionalPortrait(value) {
      this.reload();
      const user = this.currentUser();
      if (user?.role !== "profesional") return false;
      user.professionalPortrait = normalizeProfessionalPortrait(value);
      save();
      return true;
    },
    setImprovementConsent(user, granted) {
      user.consents.improvement = { granted, at: now() };
      audit(user.id, "consentimiento de mejora", granted ? "otorgado" : "retirado"); save();
    },

    /* ---------- edad, ruta y vinculación (código) ---------- */
    age(p) { return Rules.ageFrom(p.birthYM, now()); },
    route(p) { return Rules.route(this.age(p)); },
    link(p) { return p.mode === "vinculado" ? Rules.linkStatus(this.age(p), p.consents) : { status: "libre", missing: [] }; },
    verifyChain,

    /* ---------- permisos de acceso a pacientes (código) ---------- */
    canSeePatient(user, p) {
      if (!user || !p) return false;
      if (user.role === "profesional") return p.professionalId === user.id;
      if (user.role === "familia") return p.familyUserIds.includes(user.id);
      return false; // el administrador no ve datos individuales
    },
    /* El profesional ve registros solo con la vinculación activa (consentimientos completos). */
    proHasData(user, p) { return user.role === "profesional" && p.professionalId === user.id && this.link(p).status === "activa"; },
    patientsFor(user) { return db.patients.filter((p) => p.status === "activo" && this.canSeePatient(user, p)); },

    linkFamily(user, code) {
      const p = db.patients.find((x) => x.inviteCode === code.trim().toUpperCase() && x.status === "activo");
      if (!p) return { error: "El código no corresponde a ningún paciente. Revisalo con tu profesional." };
      if (!p.familyUserIds.includes(user.id)) p.familyUserIds.push(user.id);
      p.inviteCode = inviteCode(); // código de un solo uso
      audit(user.id, "vinculación familia–paciente", p.code); save();
      return { patient: p };
    },
    /* Perfil en modo libre: lo crea la familia, sin profesional. Sin interpretación ni historial emocional. */
    createFreeProfile(fam, { alias, ageYears }) {
      if (fam.role !== "familia") throw new Error("Sin permiso");
      const d = new Date(now());
      const p = { id: uid("p"), code: "LIB-" + patientCode().slice(3), alias: alias.trim().slice(0, 30), professionalId: null,
        birthYM: (d.getFullYear() - +ageYears) + "-" + String(d.getMonth() + 1).padStart(2, "0"), diagnosis: null,
        familyUserIds: [fam.id], inviteCode: inviteCode(), createdAt: now(), status: "activo", avatarId: null, mode: "libre",
        consents: [], moodConsent: false, share: {}, companion: { growth: 0 }, adaptive: {}, playToday: { day: null, ms: 0 },
        objectives: [], desafiosHechos: 0, teen: { termsAt: null, sober: false, privacySeenAt: null } };
      db.patients.push(p); audit(fam.id, "perfil en modo libre", p.code); save(); return p;
    },
    createPatient(prof, { ageYears, diagnosis, alias }) {
      if (prof.role !== "profesional") throw new Error("Sin permiso");
      const d = new Date(now());
      const p = { id: uid("p"), code: patientCode(), alias: (alias || "").trim().slice(0, 30), professionalId: prof.id,
        birthYM: (d.getFullYear() - +ageYears) + "-" + String(d.getMonth() + 1).padStart(2, "0"), diagnosis,
        familyUserIds: [], inviteCode: inviteCode(), createdAt: now(), status: "activo", avatarId: null, mode: "vinculado",
        consents: [], moodConsent: false, share: {}, companion: { growth: 0 }, adaptive: {}, playToday: { day: null, ms: 0 },
        objectives: [], desafiosHechos: 0, teen: { termsAt: null, sober: false, privacySeenAt: null } };
      db.patients.push(p); audit(prof.id, "alta de paciente", p.code); save(); return p;
    },

    /* ---------- consentimientos (REQ-CLI-M08-3, A01 a A08) ---------- */
    async consent(user, patientId, type, detail = "") {
      const p = db.patients.find((x) => x.id === patientId);
      const allowed = user.role === "familia" ? p.familyUserIds.includes(user.id) : user.role === "profesional" ? p.professionalId === user.id : false;
      if (!allowed) throw new Error("Sin permiso");
      const age = this.age(p);
      // A02: a los 16 y 17 el representante no consiente por el adolescente; a los 13–15 consiente y el adolescente asiente.
      if (type === "consentimiento-representante" && age >= 16) return { error: "A los 16 y 17 años consiente el propio adolescente. Al representante se le avisa." };
      const by = ["asentimiento-nino", "asentimiento-adolescente", "consentimiento-adolescente", "titularidad"].includes(type) ? "persona (desde su experiencia)" : user.id;
      const e = await pushConsent(p, type, by, detail);
      if (type === "consentimiento-adolescente") {                         // A05: aviso al representante
        await pushConsent(p, "aviso-enviado", "sistema", "Aviso al representante (simulado en la beta). Plazo: " + new Date(Rules.noticeDeadline(e.at)).toLocaleDateString("es-AR") + ". " + detail);
      }
      if (type === "oposicion-representante") p.oppositionPending = true;
      if (type === "decision-profesional") p.oppositionPending = false;
      if (type === "titularidad") { p.selfOwner = true; p.familyAuthorized = detail === "autoriza-familia"; }
      audit(user.id, "registro de consentimiento", p.code + " · " + type); save();
      return { entry: e };
    },
    async noticeReceived(user, patientId) {
      const p = db.patients.find((x) => x.id === patientId);
      if (!p.familyUserIds.includes(user.id)) throw new Error("Sin permiso");
      if (p.consents.some((c) => c.type === "aviso-recibido")) return;
      await pushConsent(p, "aviso-recibido", user.id, ""); save();
    },
    setMoodConsent(user, patientId, granted) {
      const p = db.patients.find((x) => x.id === patientId);
      if (!p.familyUserIds.includes(user.id)) throw new Error("Sin permiso");
      p.moodConsent = !!granted; audit(user.id, "consentimiento autorreporte de ánimo", p.code + " · " + granted); save();
    },
    setShare(prof, patientId, key, val) {
      const p = db.patients.find((x) => x.id === patientId);
      if (!this.proHasData(prof, p)) throw new Error("Sin permiso");
      p.share = { ...p.share, [key]: !!val }; audit(prof.id, "compartir con la familia", p.code + " · " + key + "=" + val); save();
    },
    setSkillOverride(prof, patientId, act, { fixed, locked }) {          // REQ-CLI-M10-9
      const p = db.patients.find((x) => x.id === patientId);
      if (!this.proHasData(prof, p)) throw new Error("Sin permiso");
      const st = p.adaptive[act] || Rules.newSkillState(1);
      st.fixed = fixed ? +fixed : null; if (st.fixed) st.level = st.fixed; st.locked = !!locked;
      p.adaptive[act] = st; audit(prof.id, "nivel fijado o ajuste bloqueado", p.code + " · " + act); save();
    },
    saveSkill(patientId, act, st) { const p = db.patients.find((x) => x.id === patientId); p.adaptive[act] = st; save(); },
    setTeen(patientId, patch) { const p = db.patients.find((x) => x.id === patientId); p.teen = { ...p.teen, ...patch }; save(); },
    addPlayTime(patientId, ms) {
      const p = db.patients.find((x) => x.id === patientId);
      const day = new Date(now()).toDateString();
      if (!p.playToday || p.playToday.day !== day) p.playToday = { day, ms: 0 };
      p.playToday.ms += ms; save(); return p.playToday.ms;
    },
    playedToday(p) { const day = new Date(now()).toDateString(); return p.playToday && p.playToday.day === day ? p.playToday.ms : 0; },
    markDesafio(user, patientId) {                                     // REQ-CLI-M06-3: un toque, sin texto
      const p = db.patients.find((x) => x.id === patientId);
      if (!this.canSeePatient(user, p)) throw new Error("Sin permiso");
      p.desafiosHechos = (p.desafiosHechos || 0) + 1;
      const last = db.activitySessions.filter((s) => s.patientId === patientId).sort((a, b) => b.startAt - a.startAt)[0];
      if (last) last.desafioHecho = true;
      save();
    },
    plansFor(patientId) { return db.plans.filter((x) => x.patientId === patientId && x.active); },
    setPlan(prof, patientId, activityId, { perWeek, level, note, active }) {
      const p = db.patients.find((x) => x.id === patientId);
      if (!this.canSeePatient(prof, p) || prof.role !== "profesional") throw new Error("Sin permiso");
      let pl = db.plans.find((x) => x.patientId === patientId && x.activityId === activityId);
      if (!pl) { pl = { id: uid("pl"), patientId, activityId, createdAt: now() }; db.plans.push(pl); }
      Object.assign(pl, { perWeek: +perWeek, level: +level, note: (note || "").slice(0, 280), active });
      audit(prof.id, "pauta actualizada", p.code + " · " + activityId); save(); return pl;
    },
    /* En modo libre la familia elige aventuras: cada una cuenta como "pauta" propia, sin frecuencia exigida. */
    setFreePlan(fam, patientId, activityId, active) {
      const p = db.patients.find((x) => x.id === patientId);
      if (!p.familyUserIds.includes(fam.id) || p.mode !== "libre") throw new Error("Sin permiso");
      let pl = db.plans.find((x) => x.patientId === patientId && x.activityId === activityId);
      if (!pl) { pl = { id: uid("pl"), patientId, activityId, perWeek: 0, level: 1, note: "", createdAt: now() }; db.plans.push(pl); }
      pl.active = active; save();
    },
    sessionsFor(user, patientId) {
      const p = db.patients.find((x) => x.id === patientId);
      if (!this.canSeePatient(user, p)) return [];
      if (user.role === "profesional" && !this.proHasData(user, p)) return [];
      return db.activitySessions.filter((s) => s.patientId === patientId).sort((a, b) => b.startAt - a.startAt);
    },
    recordSession(user, rec) {
      const p = db.patients.find((x) => x.id === rec.patientId);
      if (!this.canSeePatient(user, p)) throw new Error("Sin permiso");
      /* REQ-CLI-M02-4: el ánimo se guarda solo con profesional vinculado, vinculación activa y consentimiento.
         Si no, solo un conteo agregado y sin identificador. */
      const keepMood = p.mode === "vinculado" && p.moodConsent && this.link(p).status === "activa";
      if (rec.moodStart) { const k = new Date(now()).toISOString().slice(0, 10); db.moodAgg[k] = db.moodAgg[k] || {}; db.moodAgg[k][rec.moodStart] = (db.moodAgg[k][rec.moodStart] || 0) + 1; }
      const s = { id: uid("as"), startedBy: user.id, ...rec, moodStart: keepMood ? rec.moodStart : null };
      db.activitySessions.push(s);
      if (rec.avatarId) p.avatarId = rec.avatarId;
      save(); return s;
    },
    bumpDesafio(patientId) { const p = db.patients.find((x) => x.id === patientId); p.desafiosHechos = (p.desafiosHechos || 0) + 1; save(); },
    setCompanion(patientId, c) { const p = db.patients.find((x) => x.id === patientId); p.companion = c; save(); },

    /* ---------- herramientas del profesional (M13, M17, M09) ---------- */
    saveInterventionPlan(prof, patientId, plan) {
      const p = db.patients.find((x) => x.id === patientId);
      if (!this.proHasData(prof, p)) throw new Error("Sin permiso");
      const okObj = plan.objectives.length && plan.objectives.every((o) => o.text && o.baseline !== "" && o.goal !== "" && +o.weeks > 0);
      const status = plan.wantActive && okObj && plan.signed ? "activo" : "borrador";
      const rec = { id: uid("ip"), patientId, at: now(), by: prof.id, signedBy: plan.signed ? `${prof.alias} · Mat. ${prof.matricula?.numero}` : null, ...plan, status };
      db.interventionPlans.unshift(rec);
      if (status === "activo") p.objectives = plan.objectives.map((o) => ({ id: uid("ob"), text: o.text, baseline: +o.baseline, goal: +o.goal, weeks: +o.weeks, startAt: now(), measures: [] }));
      audit(prof.id, "plan de intervención", p.code + " · " + status); save(); return rec;
    },
    plansIntervention(prof, patientId) { return db.interventionPlans.filter((x) => x.patientId === patientId && x.by === prof.id); },
    addObjectiveMeasure(prof, patientId, objId, value) {
      const p = db.patients.find((x) => x.id === patientId);
      if (!this.proHasData(prof, p)) throw new Error("Sin permiso");
      const o = p.objectives.find((x) => x.id === objId); o.measures.push({ at: now(), value: +value }); save();
    },
    saveMeasure(prof, patientId, m) {                                   // REQ-CLI-M17-1: solo con profesional vinculado
      const p = db.patients.find((x) => x.id === patientId);
      if (!this.proHasData(prof, p)) throw new Error("Sin permiso");
      db.measures.unshift({ id: uid("me"), patientId, by: prof.id, at: now(), ...m }); audit(prof.id, "medida de progreso", p.code + " · " + m.kind); save();
    },
    measuresFor(prof, patientId) { return db.measures.filter((x) => x.patientId === patientId && x.by === prof.id); },
    approveReport(prof, patientId, text) {                              // REQ-CLI-M09-2
      const p = db.patients.find((x) => x.id === patientId);
      if (!this.proHasData(prof, p)) throw new Error("Sin permiso");
      const r = { id: uid("ra"), patientId, at: now(), text, signedBy: `${prof.alias} · Mat. ${prof.matricula?.numero} (${prof.matricula?.provincia})` };
      db.reportApprovals.unshift(r); audit(prof.id, "informe aprobado", p.code); save(); return r;
    },

    /* ---------- sugerencias (profesionales y familias) ---------- */
    addSuggestion(user, { kind, area, text }) {
      db.counters.suggestion = (db.counters.suggestion || 0) + 1;
      const number = "AS-SUG-" + String(db.counters.suggestion).padStart(4, "0");
      const sg = { id: uid("sg"), number, userId: user.id, role: user.role, kind, area, text: text.slice(0, 2000), createdAt: now(), status: "nueva" };
      db.suggestions.unshift(sg); audit(user.id, "sugerencia", number); save(); return sg;
    },
    setSuggestionStatus(adminUser, id, status) {
      if (adminUser.role !== "admin") throw new Error("Sin permiso");
      const s = db.suggestions.find((x) => x.id === id); s.status = status; audit(adminUser.id, "estado de sugerencia", s.number + " · " + status); save();
    },
    saveReview(prof, patientId, review) {
      const p = db.patients.find((x) => x.id === patientId);
      if (!this.canSeePatient(prof, p) || prof.role !== "profesional") throw new Error("Sin permiso");
      db.reviews.unshift({ id: uid("rv"), patientId, reviewerId: prof.id, at: now(), ...review });
      audit(prof.id, "revisión de sugerencias", p.code + " · " + review.decision); save();
    },
    reviewsFor(prof, patientId) {
      const p = db.patients.find((x) => x.id === patientId);
      if (!this.canSeePatient(prof, p)) return [];
      return db.reviews.filter((r) => r.patientId === patientId);
    },

    /* ---------- reportes y solicitudes ---------- */
    addReport(user, { description, screenshot, screen }) {
      db.counters.report++;
      const number = "AS-BETA-" + String(db.counters.report).padStart(4, "0");
      db.reports.unshift({ id: uid("r"), number, userId: user?.id || null, role: user?.role || "sin sesión", screen,
        description: description.slice(0, 2000), screenshot, createdAt: now(), status: "nuevo" });
      audit(user?.id || null, "reporte de inconveniente", number); save();
      return number;
    },
    addDataRequest(user, kind, detail) {
      db.counters.request++;
      const number = "AS-DATOS-" + String(db.counters.request).padStart(4, "0");
      db.dataRequests.unshift({ id: uid("dr"), number, userId: user.id, kind, detail: detail.slice(0, 1000), createdAt: now(), status: "recibida" });
      audit(user.id, "solicitud sobre datos", number + " · " + kind); save();
      return number;
    },

    /* ---------- baja de cuenta ---------- */
    deleteAccount(user) {
      const t = now();
      user.status = "baja"; user.deletedAt = t;
      user.email = "baja+" + user.id + "@anonimizado"; user.alias = "Cuenta dada de baja"; delete user.professionalPortrait;
      user.passHash = ""; delete user.matricula;
      delete db.activeSessions[user.id];
      if (user.role === "familia") db.patients.forEach((p) => { p.familyUserIds = p.familyUserIds.filter((x) => x !== user.id); });
      if (user.role === "profesional") db.patients.filter((p) => p.professionalId === user.id).forEach((p) => { p.status = "archivado"; p.familyUserIds = []; });
      audit(user.id, "baja de cuenta", user.role);
      clearMyToken(); save();
    },

    /* ---------- administración ---------- */
    async adminCreateProfessional(adminUser, { email, alias, pass, numero, provincia }) {
      if (adminUser.role !== "admin") throw new Error("Sin permiso");
      const r = await this.register({ role: "profesional", email, alias, pass, consents: { improvement: false }, matricula: { numero, provincia } });
      if (r.error) return r;
      this.verifyProfessional(adminUser, r.user.id);
      return r;
    },
    verifyProfessional(adminUser, userId) {
      if (adminUser.role !== "admin") throw new Error("Sin permiso");
      const u = db.users.find((x) => x.id === userId);
      u.matricula.verificada = true; u.matricula.verifiedAt = now(); u.matricula.verifiedBy = adminUser.id;
      u.status = "activa"; u.activatedAt = now();
      audit(adminUser.id, "matrícula verificada y cuenta activada", u.email); save();
    },
    setActivity(adminUser, id, enabled) {
      if (adminUser.role !== "admin") throw new Error("Sin permiso");
      db.activityState[id].enabled = enabled;
      audit(adminUser.id, enabled ? "actividad habilitada" : "actividad retirada", id); save();
    },
    setConfig(adminUser, patch) {
      if (adminUser.role !== "admin") throw new Error("Sin permiso");
      Object.assign(db.config, patch); audit(adminUser.id, "configuración", JSON.stringify(patch)); save();
    },
    shiftActivation(adminUser, userId, days) {
      if (adminUser.role !== "admin") throw new Error("Sin permiso");
      const u = db.users.find((x) => x.id === userId);
      if (u.activatedAt) u.activatedAt -= days * DAY;
      audit(adminUser.id, "prueba: activación desplazada", u.email + " · " + days + " días"); save();
    },
    setReportStatus(adminUser, id, status) {
      if (adminUser.role !== "admin") throw new Error("Sin permiso");
      const r = db.reports.find((x) => x.id === id); r.status = status; save();
    }
  };
})();

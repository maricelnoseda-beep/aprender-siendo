/* ==========================================================================
   store.js — Capa de datos SIMULADA (reemplaza al servidor en la demostración)

   En esta beta de demostración todo se guarda solo en el navegador de quien la
   abre (localStorage). Nada sale del dispositivo. Esta capa expone las mismas
   operaciones que tendrá la API real, para que el reemplazo por un servidor
   sea directo. Los permisos se verifican acá, en código (nunca en un modelo).
   ========================================================================== */

const DB_KEY = "as_beta_db_v1";
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
      schema: 1,
      createdAt: t,
      config: { trialDays: 15, warnDays: 3, sessionIdleMin: 30, clockOffsetDays: 0 },
      users: [], patients: [], plans: [], activitySessions: [], reviews: [],
      reports: [], dataRequests: [], activeSessions: {}, audit: [],
      activityState: Object.fromEntries(ACTIVITIES.map((a) => [a.id, { enabled: true }])),
      counters: { report: 0, request: 0 }
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
    await mk("familia", "familia2@demo.aprendersiendo.ar", "Familia Demo 2", { activatedAt: t - 2 * DAY });

    // Pacientes sintéticos con patrones distintos para mostrar las señales.
    const P = [
      { code: "AS-3K7P", age: 7, dx: "dea-lectura", pattern: "estable", fam: [fam.id] },
      { code: "AS-9M2C", age: 9, dx: "tdah", pattern: "cae", fam: [] },
      { code: "AS-4T8R", age: 6, dx: "dea-calculo", pattern: "dificultad", fam: [] },
      { code: "AS-6H1N", age: 11, dx: "en-evaluacion", pattern: "nuevo", fam: [] }
    ];
    const rand = rng(20261101);
    const moodIds = MOODS.map((m) => m.id);
    for (const p of P) {
      const pat = { id: uid("p"), code: p.code, professionalId: prof.id, ageYears: p.age, diagnosis: p.dx,
        familyUserIds: p.fam, inviteCode: inviteCode(), createdAt: t - 42 * DAY, status: "activo", avatarId: null, synthetic: true };
      db.patients.push(pat);
      const acts = p.dx === "dea-calculo" ? ["contar", "secuencias"] : p.dx === "tdah" ? ["distinto", "clasificar"] : ["memoria", "distinto"];
      acts.forEach((a, i) => db.plans.push({ id: uid("pl"), patientId: pat.id, activityId: a, perWeek: i === 0 ? 3 : 2,
        level: 1, note: "", createdAt: t - 40 * DAY, active: true }));
      const days = p.pattern === "nuevo" ? 5 : 40;
      for (let d = days; d >= 0; d--) {
        let prob = 0.5;
        if (p.pattern === "cae") prob = d > 14 ? 0.7 : 0.12;
        if (p.pattern === "nuevo") prob = 0.6;
        if (rand() > prob) continue;
        const act = acts[Math.floor(rand() * acts.length)];
        const level = p.pattern === "dificultad" && act === "contar" ? 2 : d < 15 ? 2 : 1;
        const items = act === "memoria" ? ({ 1: 3, 2: 4, 3: 6 })[level] : ADAPTIVE_DEMO.roundsPerSession;
        let ftc = p.pattern === "dificultad" && act === "contar" && d < 14 ? Math.floor(rand() * 2) : Math.floor(items * (0.5 + rand() * 0.5));
        ftc = Math.min(items, ftc);
        const attempts = items + (items - ftc) * (1 + Math.floor(rand() * 2));
        const start = t - d * DAY - Math.floor(rand() * 8) * 3600000 - 9 * 3600000;
        const moodS = moodIds[Math.floor(rand() * 4)];
        const moodE = p.pattern === "dificultad" && act === "contar" && d < 14 ? (rand() > 0.4 ? "nervios" : "cansancio") : moodIds[Math.floor(rand() * 3)];
        db.activitySessions.push({
          id: uid("as"), patientId: pat.id, activityId: act, context: rand() > 0.75 ? "consulta" : "hogar",
          startedBy: rand() > 0.75 ? prof.id : (p.fam[0] || prof.id), startAt: start,
          endAt: start + (180 + Math.floor(rand() * 400)) * 1000, avatarId: AVATARS[Math.floor(rand() * AVATARS.length)].id,
          moodStart: moodS, moodDuring: moodE, moodAfter: moodE,
          difficulty: p.pattern === "dificultad" && act === "contar" && d < 14 ? "dificil" : ["facil", "justa"][Math.floor(rand() * 2)],
          metrics: { level, items, completed: items, firstTry: ftc, attempts, hints: Math.max(0, items - ftc - 1), abandoned: false },
          synthetic: true
        });
      }
    }
    db.reports.push({ id: uid("r"), number: "AS-BETA-0001", userId: fam.id, role: "familia", screen: "Inicio familia",
      description: "Ejemplo sintético: el botón de volver tarda en responder en el celular.", screenshot: null,
      createdAt: t - 1 * DAY, status: "nuevo" });
    db.counters.report = 1;
    audit(admin.id, "semilla", "Base de demostración creada con datos sintéticos");
    save();
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
    async init() { load(); if (!db || db.schema !== 1) await seed(); return db; },
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
    async register({ role, email, alias, pass, consents, matricula, inviteCode: code }) {
      email = email.trim().toLowerCase();
      if (db.users.some((u) => u.email === email)) return { error: "Ya existe una cuenta con ese correo." };
      const salt = uid("s"); const t = now();
      const user = { id: uid("u"), role, email, alias: alias.trim(), salt, passHash: await hash(pass, salt), createdAt: t,
        activatedAt: role === "familia" ? t : null, status: role === "familia" ? "activa" : "pendiente",
        consents: { terms: { v: LEGAL.version, at: t }, privacy: { v: LEGAL.version, at: t }, service: { at: t },
          improvement: { granted: !!consents.improvement, at: t } } };
      if (role === "profesional") user.matricula = { ...matricula, verificada: false };
      db.users.push(user);
      audit(user.id, "registro", role === "familia" ? "Cuenta familia activada; empieza la prueba" : "Solicitud profesional pendiente de verificación");
      if (role === "familia" && code) this.linkFamily(user, code);
      save();
      return { user };
    },
    setImprovementConsent(user, granted) {
      user.consents.improvement = { granted, at: now() };
      audit(user.id, "consentimiento de mejora", granted ? "otorgado" : "retirado"); save();
    },

    /* ---------- permisos de acceso a pacientes (código) ---------- */
    canSeePatient(user, p) {
      if (!user || !p) return false;
      if (user.role === "profesional") return p.professionalId === user.id;
      if (user.role === "familia") return p.familyUserIds.includes(user.id);
      return false; // el administrador no ve datos individuales
    },
    patientsFor(user) { return db.patients.filter((p) => p.status === "activo" && this.canSeePatient(user, p)); },

    linkFamily(user, code) {
      const p = db.patients.find((x) => x.inviteCode === code.trim().toUpperCase() && x.status === "activo");
      if (!p) return { error: "El código no corresponde a ningún paciente. Revisalo con tu profesional." };
      if (!p.familyUserIds.includes(user.id)) p.familyUserIds.push(user.id);
      p.inviteCode = inviteCode(); // código de un solo uso
      audit(user.id, "vinculación familia–paciente", p.code); save();
      return { patient: p };
    },
    createPatient(prof, { ageYears, diagnosis }) {
      if (prof.role !== "profesional") throw new Error("Sin permiso");
      const p = { id: uid("p"), code: patientCode(), professionalId: prof.id, ageYears: +ageYears, diagnosis,
        familyUserIds: [], inviteCode: inviteCode(), createdAt: now(), status: "activo", avatarId: null };
      db.patients.push(p); audit(prof.id, "alta de paciente", p.code); save(); return p;
    },
    setPlan(prof, patientId, activityId, { perWeek, level, note, active }) {
      const p = db.patients.find((x) => x.id === patientId);
      if (!this.canSeePatient(prof, p) || prof.role !== "profesional") throw new Error("Sin permiso");
      let pl = db.plans.find((x) => x.patientId === patientId && x.activityId === activityId);
      if (!pl) { pl = { id: uid("pl"), patientId, activityId, createdAt: now() }; db.plans.push(pl); }
      Object.assign(pl, { perWeek: +perWeek, level: +level, note: (note || "").slice(0, 280), active });
      audit(prof.id, "pauta actualizada", p.code + " · " + activityId); save(); return pl;
    },
    plansFor(patientId) { return db.plans.filter((x) => x.patientId === patientId && x.active); },
    sessionsFor(user, patientId) {
      const p = db.patients.find((x) => x.id === patientId);
      if (!this.canSeePatient(user, p)) return [];
      return db.activitySessions.filter((s) => s.patientId === patientId).sort((a, b) => b.startAt - a.startAt);
    },
    recordSession(user, rec) {
      const p = db.patients.find((x) => x.id === rec.patientId);
      if (!this.canSeePatient(user, p)) throw new Error("Sin permiso");
      const s = { id: uid("as"), startedBy: user.id, ...rec };
      db.activitySessions.push(s);
      if (rec.avatarId) p.avatarId = rec.avatarId;
      save(); return s;
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
      user.email = "baja+" + user.id + "@anonimizado"; user.alias = "Cuenta dada de baja";
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

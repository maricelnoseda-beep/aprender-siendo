"use strict";
/* ==========================================================================
   Aprender Siendo — Beta 2 (entorno de prueba, datos sintéticos)
   content.js — CONTENIDO DIRIGIDO A PERSONAS Y UMBRALES CLÍNICOS

   Este archivo NO lo decide DEV-IA. Fuente: ONB-MEJ-001-R v2.0 (PSP-SR,
   2026-11-08), anexo A (textos base v0.1, usables en la beta). Lo que no
   viene de ese documento es RELLENO y se muestra en pantalla con el rótulo
   "Contenido de prueba no validado" (marcado PRUEBA en este archivo).
   ========================================================================== */

const CONTENT_VERSION = "beta2-0.1 (2026-11-08) · textos base PSP-SR v0.1 + relleno de prueba";
const PRUEBA = "Contenido de prueba no validado";

/* PRUEBA (PSP-SR): categorías que el profesional registra. Nunca se muestran al niño ni a la familia (T06). */
const DIAGNOSIS_CATEGORIES = [
  { id: "en-evaluacion", label: "En evaluación / sin diagnóstico" },
  { id: "dea-lectura", label: "Dificultad específica del aprendizaje: lectura" },
  { id: "dea-escritura", label: "Dificultad específica del aprendizaje: escritura" },
  { id: "dea-calculo", label: "Dificultad específica del aprendizaje: cálculo" },
  { id: "tdah", label: "TDAH" },
  { id: "tea", label: "Condición del espectro autista" },
  { id: "lenguaje", label: "Trastorno del lenguaje" },
  { id: "di", label: "Discapacidad intelectual" },
  { id: "otro", label: "Otra categoría" }
];

/* Umbrales de las reglas (ONB-MEJ-001-R v2.0). Los marcados "calibrar" los ajusta la supervisora. */
const RULES_CONFIG = {
  sessionMinutes: { "3-5": 15, "6-8": 20, "9-12": 25, "13-18": 30 },   // 6.8 (6–18: nivel C, calibrar)
  adaptWindow: 10, adaptMinItems: 5,                                   // M10-2
  upPct: 0.85, upNoHelpPct: 0.70, downPct: 0.60, consecErrors: 3,      // M10-3 a M10-5
  moodPatternHits: 3,                                                  // M02-5 (calibrar)
  lowAdherence: 0.5, noResponseWeeks: 6                                // M09-3 (calibrar)
};

/* ---------- Check-in emocional (6.9, anexo A.2) ---------- */
const CHECKIN = {
  question: { child: "¿Cómo te sentís hoy?", teen: "¿Cómo venís hoy?" },
  options: {
    "3-5": ["contento", "cansado", "triste", "enojado", "nodice"],
    "6-12": ["conganas", "tranquilo", "cansado", "triste", "enojado", "preocupado", "nodice"],
    "13-18": ["bien", "energia", "cansado", "estresado", "triste", "enojado", "nervioso", "prefieronodecir"]
  },
  rows: [
    { id: "estandar", moods: ["conganas", "contento", "tranquilo", "bien", "energia"] },
    { id: "cansado", moods: ["cansado"] },
    { id: "triste", moods: ["triste", "preocupado", "estresado", "nervioso"] },
    { id: "enojado", moods: ["enojado"] },
    { id: "nodice", moods: ["nodice", "prefieronodecir"] }
  ],
  reply: {
    estandar: "¡Qué bueno! Vamos.",
    cansado: "Gracias por contarme. Podemos hacer algo cortito.",
    triste: "Gracias por contarme. A veces nos sentimos así. ¿Querés hacer algo tranquilo o dejamos por hoy?",
    enojado: "Gracias por contarme. ¿Probamos respirar juntos un ratito?",
    nodice: "Está bien."
  },
  closeTriste: { child: "Si querés, contale a una persona grande cómo te sentís.", teen: "Si querés, hablalo con alguien de confianza." }
};
/* Todos los estados posibles (cara del animalito y palabra). "alegria" y "calma" son solo decorativos. */
const MOODS = [
  { id: "contento", label: "Contento", face: "happy" }, { id: "conganas", label: "Con ganas", face: "happy" },
  { id: "tranquilo", label: "Tranquilo", face: "calm" }, { id: "bien", label: "Bien", face: "calm" },
  { id: "energia", label: "Con energía", face: "happy" }, { id: "cansado", label: "Cansado", face: "tired" },
  { id: "triste", label: "Triste", face: "sad" }, { id: "enojado", label: "Enojado", face: "angry" },
  { id: "preocupado", label: "Preocupado", face: "worried" }, { id: "estresado", label: "Estresado/a", face: "worried" },
  { id: "nervioso", label: "Nervioso/a o preocupado/a", face: "worried" },
  { id: "nodice", label: "No quiero decir", face: "neutral" }, { id: "prefieronodecir", label: "Prefiero no decir", face: "neutral" },
  { id: "alegria", label: "", face: "happy" }, { id: "calma", label: "", face: "calm" }
];
const TEEN_MOOD_LABEL = { cansado: "Cansado/a", enojado: "Enojado/a" };

const AVATAR_GROUPS = JSON.parse(document.getElementById("animal-catalog").textContent);
const AVATARS = AVATAR_GROUPS.flatMap((group) => group.animals);
const animalById = new Map(AVATARS.map((animal) => [animal.id, animal]));
// Las expresiones conservan el orden de lectura de cada lámina.
const FACE_INDEX = { alegria:0, contento:0, triste:1, enojado:2, preocupado:3, estresado:3,
  aburrido:4, conganas:5, energia:5, nervioso:6, calma:7, tranquilo:7, bien:7, cansado:8,
  nodice:9, prefieronodecir:9 };
function animalImage(id, mood, size) {
  const animal = animalById.get(id) || animalById.get("pulpo");
  return `<img class="av avatar-photo" alt="" width="${size}" height="${size}" src="${animal.faces[FACE_INDEX[mood] ?? 0]}">`;
}
function avatarPicker(c) {
  const groupIndex = c.avatarCategory ?? Math.max(0, AVATAR_GROUPS.findIndex((g) => g.animals.some((a) => a.id === c.avatarId)));
  const group = AVATAR_GROUPS[groupIndex];
  return `<section class="avatar-picker" aria-label="Compañeros animales">
    <div class="category-list" role="group" aria-label="Categorías">${AVATAR_GROUPS.map((g, i) =>
      `<button type="button" data-category="${i}" aria-controls="avatar-options" aria-pressed="${i === groupIndex}">${esc(g.label)}</button>`).join("")}</div>
    <div class="avatar-grid" id="avatar-options" role="group" aria-label="${esc(group.label)}">${group.animals.map((a) =>
      `<button type="button" class="avatar-btn ${c.avatarId === a.id ? "sel" : ""}" data-av="${a.id}" aria-pressed="${c.avatarId === a.id}">${animalImage(a.id, "alegria", 96)}<span>${esc(a.label)}</span></button>`).join("")}</div>
    <p class="avatar-selection" role="status">${c.avatarId ? "Tu compañero: " + esc(animalById.get(c.avatarId).label) : "Elegí un animal para seguir."}</p>
  </section>`;
}

/* ---------- Banco de textos para el niño (anexo A.1 y A.3; lo demás, PRUEBA) ---------- */
const CHILD_TEXT = {
  hello: "¡Hola! ¿Vamos a jugar?", helloAgain: "¡Hola de nuevo!",
  helloTeen: "Hola. ¿Arrancamos?", byeTeen: "Por hoy está bien. Buen trabajo.",
  softClose: "Hoy hicimos un montón. Ahora es buen momento para descansar.",
  bye: "¡Hasta la próxima aventura!",
  pickAvatar: "Elegí quién te acompaña",                                         // PRUEBA
  skip: "Saltear", next: "Seguir", newTry: "Vamos a probar algo nuevo.",        // A.4 / M10-1
  calmTitle: "Respiramos juntos", calmSteps: ["Tomá aire despacio…", "…y soltalo despacio."], // PRUEBA
  floorDemo: "Mirá cómo lo hago yo, y después seguimos con otra cosa.",         // PRUEBA (M10-6)
  hacerTitle: "Para hacer en casa", contarHelp: "¿Qué te ayudó?", contarHow: "¿Cómo te resultó?",
  contarKids: "Contale a la persona grande que te acompaña qué hiciste hoy.",   // M07-3 (PRUEBA)
  how: [{ id: "facil", label: "Fácil" }, { id: "masomenos", label: "Más o menos" }, { id: "dificil", label: "Difícil" }],
  adultGate: "Para seguir, una persona grande mantiene apretado este botón",    // PRUEBA
  discover: "Mirá cómo se hace"                                                 // PRUEBA
};

/* ---------- Zonas del mundo (M03). Nombres por acciones; los valida PSP-SR ---------- */
const ZONES = [
  { id: "numeros", name: "El jardín de contar", pillar: "Hacer", color: "#E8B44C" },
  { id: "mirar", name: "El sendero de mirar y encontrar", pillar: "Pensar", color: "#55867D" },
  { id: "ordenar", name: "El taller de ordenar", pillar: "Pensar", color: "#8A72B8" },
  { id: "isla", name: "La isla de juegos", pillar: "Pensar", color: "#1B7F86" }
];

/* ---------- Aventuras (antes "actividades"). Contenido de relleno salvo indicación ---------- */
const ACTIVITIES = [
  {
    id: "isla", name: "Isla de Juegos", zone: "isla", skill: "jugar a pensar de muchas formas", pillar: "Pensar",
    area: "Números, atención, memoria, funciones ejecutivas y palabras", ageMin: 4, ageMax: 9,
    suggestedFor: ["en-evaluacion", "tdah", "dea"],
    instruction: "Elegí una isla y jugá. Cuando termines, tocá «Terminé de jugar».",
    forFamily: "El juego ajusta solo la dificultad. Acompañá leyendo con calma y dejá que elija y responda por su cuenta.",
    levels: ["El juego ajusta la dificultad solo"], strategies: ["Mirar con calma", "Escuchar otra vez", "Probar de nuevo"],
    discover: "En cada isla hay un juego distinto. Escuchá la consigna, mirá con calma y elegí.",
    ok: [], err: [], ficha: { variant: "B" }
  },
  {
    id: "memoria", name: "Memoria de pares", zone: "mirar", skill: "recordar dónde están las cosas", pillar: "Pensar",
    area: "Memoria visual", ageMin: 4, ageMax: 18, suggestedFor: ["tdah", "en-evaluacion", "di"],
    instruction: "Dá vuelta dos tarjetas. Si son iguales, quedan a la vista.",
    forFamily: "Acompañá sin dar vuelta tarjetas por el niño. Si se traba, podés preguntarle: ¿dónde estaba la otra?",
    levels: ["3 pares", "4 pares", "6 pares"], strategies: ["Decir en voz alta qué vi", "Recordar el lugar", "Ir de a poco"],
    discover: "Doy vuelta una tarjeta, digo qué es y me acuerdo del lugar. Después busco la otra igual.",
    ok: ["Te acordaste del lugar de la otra tarjeta."], err: ["Casi. Pensá dónde viste la otra."], ficha: { variant: "B" }
  },
  {
    id: "secuencias", name: "¿Qué sigue?", zone: "ordenar", skill: "descubrir cómo se repite una fila", pillar: "Pensar",
    area: "Razonamiento", ageMin: 4, ageMax: 10, suggestedFor: ["dea-calculo", "en-evaluacion", "tea"],
    instruction: "Mirá la fila y elegí la figura que sigue.",
    forFamily: "Si no sabe cuál sigue, invitalo a decir en voz alta la fila.",
    levels: ["Patrón de dos", "Patrón de tres", "Patrón doble"], strategies: ["Decir la fila en voz alta", "Buscar qué se repite", "Señalar con el dedo"],
    discover: "Digo la fila en voz alta: círculo, cuadrado, círculo, cuadrado… Así descubro qué viene.",
    ok: ["Dijiste la fila y encontraste qué se repetía."], err: ["Casi. Decí la fila otra vez desde el principio."], ficha: { variant: "B" }
  },
  {
    id: "distinto", name: "Encontrá el distinto", zone: "mirar", skill: "mirar con atención", pillar: "Pensar",
    area: "Atención visual", ageMin: 4, ageMax: 14, suggestedFor: ["tdah", "dea-lectura", "en-evaluacion"],
    instruction: "Hay una figura diferente a las demás. ¡Encontrala!",
    forFamily: "Evitá señalar la respuesta. Podés sugerir mirar fila por fila.",
    levels: ["9 figuras", "16 figuras", "25 figuras"], strategies: ["Mirar fila por fila", "Ir despacio", "Comparar de a dos"],
    discover: "Miro la primera fila, después la segunda, despacito. Así encuentro la que es distinta.",
    ok: ["Miraste fila por fila y la encontraste."], err: ["Casi. Probá mirar fila por fila."], ficha: { variant: "B" }
  },
  {
    /* Explorapalabras (especificación de la supervisora, 2026-11-09). Todo PRUEBA: textos, edades y fichas los valida PSP-SR (RT-EXP-001).
       Sin sugerencia por diagnóstico (RT-EST-001, P6). Banco de palabras y parámetros: app/herramientas/explorapalabras/. */
    id: "explorapalabras", name: "Explorapalabras", zone: "mirar", skill: "buscar palabras letra por letra", pillar: "Comunicar",
    area: "Reconocimiento de letras y palabras, atención y discriminación visual", ageMin: 5, ageMax: 18, suggestedFor: [],
    instruction: "Elegí qué palabras querés buscar y encontralas en la sopa de letras. Cuando termines, tocá «Terminé de jugar».",
    forFamily: "Antes de empezar, una persona adulta elige la Estación y el grado. Acompañá sin señalar dónde está la palabra: podés sugerir buscar primero la primera letra.",
    levels: ["Fácil", "Intermedio", "Difícil"], strategies: ["Buscar la primera letra", "Seguir el camino de las letras", "Usar una pista"],
    discover: "Busco la primera letra de la palabra. Cuando la encuentro, miro las letras de al lado para seguir el camino.",
    ok: ["Buscaste la primera letra y seguiste el camino."], err: [], ficha: { variant: "B" }
  },
  {
    /* Aventura de búsqueda con Luci (FEC-013 v0.1 de PSP-SR, título de trabajo). Todo PRUEBA: textos y láminas los valida PSP-SR (RT-LUC-001).
       Sin sugerencia por diagnóstico (RT-EST-001, P6). Láminas, consignas y ficha: app/herramientas/luci/. */
    id: "luci", name: "¿Dónde está Luci? (título de trabajo)", zone: "mirar", skill: "mirar con atención, comparar y seguir pistas", pillar: "Pensar",
    area: "Búsqueda visual en escenas ilustradas", ageMin: 3, ageMax: 18, suggestedFor: [],
    instruction: "Buscá a Luci y a sus cosas en la escena. Cuando termines, tocá «Terminé de jugar».",
    forFamily: "En esta aventura se busca a Luci y a sus cosas en dibujos llenos de detalles. Se practica mirar con atención, comparar y seguir pistas. Acompañá sin señalar dónde está.",
    levels: ["Fácil", "Intermedio", "Difícil"], strategies: ["Mirar cómo es lo que busco", "Buscar por partes", "Juntar las pistas"],
    discover: "Miro de arriba hacia abajo, de a una parte por vez.",
    ok: ["La encontraste mirando por partes."], err: [], ficha: { variant: "B" }
  },
  {
    id: "contar", name: "Contar y elegir", zone: "numeros", skill: "contar y comparar", pillar: "Hacer",
    area: "Cálculo inicial", ageMin: 4, ageMax: 8, suggestedFor: ["dea-calculo", "en-evaluacion", "di"],
    instruction: "Contá los puntos y tocá el número correcto.",
    forFamily: "Si se pierde contando, sugerí tocar cada punto con el dedo.",
    levels: ["Hasta 5", "Hasta 10", "Hasta 20"], strategies: ["Tocar cada punto", "Contar de a uno", "Agrupar de a dos"],
    discover: "Toco cada punto con el dedo y cuento de a uno: uno, dos, tres. El último número es cuántos hay.",
    ok: ["Contaste de a uno sin saltearte ninguno."], err: ["Probemos de nuevo, mirá bien los números."], ficha: { variant: "A" }   // A.3
  },
  {
    id: "clasificar", name: "Ordená por color o forma", zone: "ordenar", skill: "seguir una regla y cambiarla", pillar: "Pensar",
    area: "Flexibilidad", ageMin: 6, ageMax: 18, suggestedFor: ["tdah", "tea", "en-evaluacion"],
    instruction: "Mirá la regla y llevá cada figura a la caja que corresponde.",
    forFamily: "Si se equivoca cuando cambia la regla, recordale leer la regla de arriba.",
    levels: ["Por color", "Por forma", "La regla cambia"], strategies: ["Leer la regla primero", "Mirar si cambió la regla", "Ir despacio"],
    discover: "Primero leo la regla. Si dice color, miro el color. Si cambia, vuelvo a leerla.",
    ok: ["Leíste la regla y ordenaste con ella."], err: ["Casi. Leé otra vez la regla de arriba."], ficha: { variant: "B" }
  }
];

/* Ficha de cada aventura (M04). Todo PRUEBA hasta que PSP-SR entregue la versión validada.
   Se arma en código para mostrar el validador: con estos datos ninguna se puede "publicar". */
const FICHAS = Object.fromEntries(ACTIVITIES.map((a) => [a.id, {
  habilidad: a.skill, paraQue: PRUEBA, edad: `${a.ageMin} a ${a.ageMax} años`, nivel: a.ficha.variant === "A" ? "A" : "C",
  fuente: a.ficha.variant === "A" ? "" : "", biblioteca: "", transferencia: a.ficha.variant, dosis: PRUEBA,
  version: "0.1", verificada: "", autor: "DEV-IA (relleno)", revisor: "", practica: a.id
}]));
/* Prácticas de Nivel X (PSP-SR 3.4): una aventura basada en cualquiera de estas no se publica. */
const X_PRACTICES = ["estilos-de-aprendizaje", "brain-gym", "lentes-de-colores", "entrenamiento-auditivo-dislexia", "comunicacion-facilitada", "tipografia-dislexia-como-mejora"];

/* Declaración de transferencia (anexo A.5). */
const TRANSFER = {
  A: {
    pro: (a) => `Esta aventura practica ${a.skill}. La enseñanza explícita de ${a.skill} mejora [aprendizaje] (nivel [X], [fuente]). No hay evidencia de que la práctica en esta app, por sí sola, produzca la misma mejora que la intervención estudiada. El uso fuera de la pantalla se estimula con el desafío para casa o aula.`,
    fam: (a) => `En esta aventura su hija o hijo practica ${a.skill}. Practicar esto ayuda a aprender a contar. Lo que se practica en la pantalla se aprovecha más si también se juega en casa. Por eso, al final, les proponemos un juego cortito.`
  },
  B: {
    pro: () => "Esta aventura entrena el desempeño en esta tarea. El entrenamiento cognitivo mejora la tarea entrenada, pero no hay evidencia sólida de que mejore por sí solo la atención, la memoria o el rendimiento escolar en la vida diaria (Melby-Lervåg y Hulme, 2013; Sala y Gobet, 2017).",
    fam: (a) => `Este juego sirve para practicar ${a.skill}. Mejorar en el juego no quiere decir que mejore sola la atención en la escuela o en casa. Lo que más ayuda es practicar en situaciones reales, como el juego que les proponemos al final.`
  }
};

/* ---------- Desafíos para casa (M06). PRUEBA, respetando REQ-CLI-M06-1 y M06-2 ---------- */
const DESAFIOS = {
  numeros: [
    { icon: "🍽️", text: "Mientras ponen la mesa, cuenten juntos los platos y las cucharas." },
    { icon: "🚶", text: "Camino a la escuela, cuenten los árboles de una cuadra." },
    { icon: "🧦", text: "Al guardar la ropa, armen pares de medias y cuenten cuántos pares hay." }
  ],
  mirar: [
    { icon: "🔎", text: "Busquen en la cocina tres cosas del mismo color." },
    { icon: "🛁", text: "En el baño, jueguen a encontrar algo que cambió de lugar." }
  ],
  ordenar: [
    { icon: "🧺", text: "Ordenen juntos los cubiertos: primero por tipo, después por tamaño." },
    { icon: "🥣", text: "Pongan en orden los pasos para preparar una merienda sin fuego." }
  ],
  isla: [
    { icon: "🎵", text: "Inventen juntos una rima con el nombre de una fruta." },
    { icon: "👀", text: "Jueguen a «veo, veo» con cosas de la casa." }
  ]
};

/* ---------- Biblioteca de estrategias para planes (M13). PRUEBA: la valida FEC-001 ---------- */
const BIBLIOTECA = [
  { id: "cf", name: "Enseñanza explícita de conciencia fonológica", nivel: "A" },
  { id: "cgf", name: "Correspondencia grafema-fonema sistemática", nivel: "A" },
  { id: "lr", name: "Lectura repetida para fluidez", nivel: "A" },
  { id: "cpa", name: "Secuencia concreto-pictórico-abstracto en matemática", nivel: "B" },
  { id: "pr", name: "Práctica de recuperación y espaciada", nivel: "A" },
  { id: "ac", name: "Ajustes conductuales y ambientales en el aula", nivel: "A" },
  { id: "xa", name: "Enseñar según «estilos de aprendizaje»", nivel: "X" },
  { id: "xb", name: "Brain Gym o «gimnasia cerebral»", nivel: "X" }
];
/* ---------- Banco de medidas para evaluación inicial y final (M17). PRUEBA ---------- */
const MEDIDAS = [
  { id: "m1", name: "Sonidos iniciales identificados", max: 10 },
  { id: "m2", name: "Comparaciones de cantidades correctas en 1 minuto", max: 30 },
  { id: "m3", name: "Figuras distintas encontradas en 2 minutos", max: 20 }
];

/* Filtro de salida para cualquier resumen automático (M09-1, PSP-SR 9). */
const OUTPUT_FILTER = [/\bTDAH\b/i, /\bTEA\b/, /dislexia/i, /discalculia/i, /autis/i, /trastorno/i, /discapacidad intelectual/i,
  /medicaci[oó]n|metilfenidato|risperidona|atomoxetina|f[aá]rmaco|suplemento/i, /diagn[oó]stico de/i];

/* Textos fijos de la familia (anexo A.4) y del adolescente (A.6). */
const FAMILY_TEXT = {
  adjust: "Las actividades se ajustan solas para que sean un desafío justo.",
  consult: "Si algo del aprendizaje te preocupa, podés consultar con una o un profesional.",
  export: "Datos de práctica. No son una evaluación."
};
const TEEN_TEXT = {
  privacy: "Lo que hacés acá es privado. Solo se avisa a alguien si hay un riesgo grave para tu vida o la de otra persona.",
  readPrefs: "Elegí cómo te resulta más cómodo leer."
};

/* REQ-CLI-A04: formularios de consentimiento. Texto jurídico pendiente (equipo legal + PSP-SR). */
const CONSENT_FORMS = {
  version: "formularios-beta2-0.1",
  child: { title: "Consentimiento del representante", body: "Texto jurídico pendiente. Explicará la naturaleza de la intervención, objetivos, modalidad, límites de la confidencialidad, posibilidad de revocar y tratamiento de datos." },
  childAssent: "¿Está bien que tu profesional vea cómo te va en los juegos?",
  teen1315: { title: "13 a 15 años: consentimiento del representante y asentimiento del adolescente", body: "Texto jurídico pendiente." },
  teen1617: { title: "16 y 17 años: consentimiento del adolescente y aviso al representante", body: "Texto jurídico pendiente." },
  teenTerms: "Texto jurídico pendiente. En lenguaje claro: qué se guarda, quién lo ve y cuándo se rompe la confidencialidad."
};

/* REVISAR (PSP-SR): preguntas y recursos que el profesional ve junto a cada alerta. PRUEBA. */
const FOLLOWUP_SUGGESTIONS = {
  adherencia: { questions: ["¿Hubo cambios en la rutina familiar o escolar?", "¿La frecuencia indicada es posible para la familia?"], alternatives: ["Revisar la frecuencia de la pauta", "Proponer una aventura más breve"] },
  piso: { questions: ["¿La consigna se comprende? Puede valer verla juntos en consulta.", "¿La dificultad aparece también fuera de la app?"], alternatives: ["Fijar un nivel", "Trabajar la habilidad con otra aventura"] },
  respuesta: { questions: ["¿La intensidad es la planificada?", "¿Hace falta revisar la hipótesis?"], alternatives: ["Ajustar intensidad, método o hipótesis"] },
  animo: { questions: ["¿Cómo describe el niño la actividad cuando se le pregunta en consulta?"], alternatives: ["Conversarlo en la próxima sesión"] }
};

/* REVISAR (supervisora + revisión jurídica): textos legales. */
const LEGAL = {
  version: "borrador-0.2",
  updated: "2026-11-08",
  price: "US$ 20 por mes, o US$ 216 por año (10 % de descuento), cobrados en pesos a la cotización oficial del Banco Nación",
  postTrialConditions: "Al terminar los 15 días gratis, la suscripción cuesta US$ 20 por mes, o US$ 216 por año (10 % de descuento), cobrados en pesos a la cotización oficial del Banco Nación. Te avisamos antes del primer cobro y no cobramos nada sin tu consentimiento expreso. Darte de baja es tan simple como el alta. Durante la beta no hay cobros.",
  retention: "A definir con asesoramiento jurídico (plazo de conservación tras la baja y tras el fin de la prueba).",
  contact: "[correo de contacto a definir]@aprendersiendo.ar",
  suggestionsTo: "maricelnoseda@aprendersiendo.ar"
};

/* ==========================================================================
   Aprender Siendo — Beta de demostración
   content.js — CONTENIDO DIRIGIDO A PERSONAS (BORRADOR)

   Todo lo que está en este archivo es contenido clínico o texto dirigido a
   personas. Según las reglas del proyecto, NO lo decide DEV-IA: lo deciden
   PSP-SR y la supervisora clínica. Acá hay valores de demostración para que
   el prototipo funcione. Cada bloque está marcado con REVISAR.
   Cambiar este archivo no requiere tocar la lógica de la app.
   ========================================================================== */

const CONTENT_VERSION = "borrador-0.1 (2026-11-01) — sin revisión clínica";

/* REVISAR (PSP-SR / supervisora): categorías de diagnóstico.
   Se guarda solo la categoría, nunca texto libre (minimización de datos). */
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

/* REVISAR: estados de ánimo que el niño puede elegir. "valence" se usa solo
   para ordenar visualmente las opciones; la app NO calcula ningún puntaje
   emocional ni saca conclusiones con esto. */
const MOODS = [
  { id: "alegria", label: "Alegría", face: "happy" },
  { id: "calma", label: "Calma", face: "calm" },
  { id: "cansancio", label: "Cansancio", face: "tired" },
  { id: "nervios", label: "Nervios", face: "worried" },
  { id: "enojo", label: "Enojo", face: "angry" },
  { id: "tristeza", label: "Tristeza", face: "sad" },
  { id: "nose", label: "No sé", face: "unsure" }
];

/* REVISAR: personajes para elegir avatar (figuras infantiles diversas, ilustración original). */
const AVATARS = [
  { id: "rulos", label: "Rulos", hair: "rulos", hairColor: "#2B3331", skin: "#7A4A2E", top: "#E8B44C", bg: "#DCE9E2" },
  { id: "colita", label: "Colita", hair: "colita", hairColor: "#7A4A2E", skin: "#F3C7A6", top: "#E07B5F", bg: "#E9DFD0" },
  { id: "flequillo", label: "Flequillo", hair: "flequillo", hairColor: "#2B3331", skin: "#E8B48F", top: "#4F7BB0", bg: "#F2D9CF" },
  { id: "rodetes", label: "Rodetes", hair: "rodetes", hairColor: "#C8663F", skin: "#F3C7A6", top: "#77A9A0", bg: "#F4E3B8" },
  { id: "largo", label: "Pelo largo", hair: "largo", hairColor: "#3B2A20", skin: "#D99A6C", top: "#B9A6D9", bg: "#DCE9E2" },
  { id: "corto", label: "Pelo corto", hair: "corto", hairColor: "#E8B44C", skin: "#A86B45", top: "#315F59", bg: "#D6E2EE" }
];

/* REVISAR: textos que ve el niño durante el recorrido. */
const CHILD_TEXT = {
  pickAvatar: "Elegí quién te acompaña hoy",
  pickMood: "¿Cómo te sentís ahora?",
  start: "¡Empezamos!",
  tryAgain: "Casi. Mirá otra vez y probá de nuevo.",
  hint: "Te doy una pista:",
  good: "¡Bien pensado!",
  qDuring: "¿Cómo te sentiste mientras jugabas?",
  qAfter: "¿Y cómo te sentís ahora?",
  qDifficulty: "Esta actividad te resultó…",
  difficulty: [
    { id: "facil", label: "Fácil" },
    { id: "justa", label: "Ni fácil ni difícil" },
    { id: "dificil", label: "Difícil" }
  ],
  thanks: "¡Gracias por contarnos!",
  adultGate: "Pedile a una persona grande que mantenga apretado este botón",
  /* Devolución positiva: reconoce esfuerzo y participación, no el resultado. */
  feedback: [
    "Te esforzaste un montón. ¡Eso es lo que más vale!",
    "Seguiste intentando aunque algunas eran difíciles. ¡Muy bien!",
    "Pensaste cada paso con paciencia. ¡Qué buen trabajo!",
    "Probaste distintas formas hasta encontrar la tuya. ¡Genial!"
  ]
};

/* REVISAR: catálogo de actividades.
   Las mecánicas son de demostración. Edades, diagnósticos sugeridos, consignas
   y criterios de dificultad deben venir en una FEC de PSP-SR. */
const ACTIVITIES = [
  {
    id: "memoria",
    name: "Memoria de pares",
    area: "Memoria visual",
    ageMin: 4, ageMax: 12,
    suggestedFor: ["tdah", "en-evaluacion", "di"],
    instruction: "Dá vuelta dos tarjetas. Si son iguales, quedan a la vista.",
    forFamily: "Acompañá sin dar vuelta tarjetas por el niño. Si se traba, podés preguntarle: ¿dónde estaba la otra?",
    levels: ["3 pares", "4 pares", "6 pares"]
  },
  {
    id: "secuencias",
    name: "¿Qué sigue?",
    area: "Razonamiento",
    ageMin: 4, ageMax: 10,
    suggestedFor: ["dea-calculo", "en-evaluacion", "tea"],
    instruction: "Mirá la fila y elegí la figura que sigue.",
    forFamily: "Si no sabe cuál sigue, invitalo a decir en voz alta la fila.",
    levels: ["Patrón de dos", "Patrón de tres", "Patrón doble"]
  },
  {
    id: "distinto",
    name: "Encontrá el distinto",
    area: "Atención visual",
    ageMin: 4, ageMax: 14,
    suggestedFor: ["tdah", "dea-lectura", "en-evaluacion"],
    instruction: "Hay una figura diferente a las demás. ¡Encontrala!",
    forFamily: "Evitá señalar la respuesta. Podés sugerir mirar fila por fila.",
    levels: ["9 figuras", "16 figuras", "25 figuras"]
  },
  {
    id: "contar",
    name: "Contar y elegir",
    area: "Cálculo inicial",
    ageMin: 4, ageMax: 8,
    suggestedFor: ["dea-calculo", "en-evaluacion", "di"],
    instruction: "Contá los puntos y tocá el número correcto.",
    forFamily: "Si se pierde contando, sugerí tocar cada punto con el dedo.",
    levels: ["Hasta 5", "Hasta 10", "Hasta 20"]
  },
  {
    id: "clasificar",
    name: "Ordená por color o forma",
    area: "Flexibilidad",
    ageMin: 6, ageMax: 18,
    suggestedFor: ["tdah", "tea", "en-evaluacion"],
    instruction: "Mirá la regla y llevá cada figura a la caja que corresponde.",
    forFamily: "Si se equivoca cuando cambia la regla, recordale leer la regla de arriba.",
    levels: ["Por color", "Por forma", "La regla cambia"]
  }
];

/* REVISAR: reglas de dificultad de demostración (no son umbrales clínicos). */
const ADAPTIVE_DEMO = {
  roundsPerSession: 5,          // ítems por sesión (memoria = 1 tablero)
  hintAfterAttempts: 2          // a partir del 2.º intento fallido se ofrece pista
};

/* REVISAR (PSP-SR): umbrales del seguimiento. Son valores de demostración para
   que el prototipo muestre señales. No tienen respaldo clínico. */
const FOLLOWUP_THRESHOLDS = {
  windowDays: 28,
  lowAdherencePct: 50,          // adhesión semanal por debajo de este % = señal
  participationDropPct: 40,     // caída de sesiones entre quincenas = señal
  repeatedDifficultySessions: 3,// sesiones seguidas con dificultad = señal
  difficultyFirstTryPct: 40,    // aciertos al primer intento por debajo = dificultad
  minSessionsForTrend: 4
};

/* REVISAR (PSP-SR): preguntas exploratorias y recursos alternativos que la app
   ofrece al profesional como SUGERENCIA cuando aparece una señal.
   Nunca se muestran a familias ni a niños. */
const FOLLOWUP_SUGGESTIONS = {
  baja_adhesion: {
    title: "Menor realización de lo indicado",
    questions: [
      "¿Hubo cambios en la rutina familiar o escolar en estas semanas?",
      "¿La frecuencia indicada es posible para la familia?",
      "¿El niño muestra ganas de hacer la actividad o la evita?"
    ],
    alternatives: ["Revisar la frecuencia de la pauta", "Proponer una actividad más breve del mismo área"]
  },
  baja_participacion: {
    title: "Menor participación en el tiempo",
    questions: [
      "¿Qué cambió entre las primeras semanas y las últimas?",
      "¿Hay acceso a un dispositivo en el horario acordado?"
    ],
    alternatives: ["Acordar con la familia un momento fijo", "Alternar actividades para sostener el interés"]
  },
  dificultad_reiterada: {
    title: "Dificultades reiteradas en una actividad",
    questions: [
      "¿La consigna se comprende? Puede valer verla juntos en consulta.",
      "¿El nivel asignado es el adecuado para este momento?",
      "¿La dificultad aparece también fuera de la app?"
    ],
    alternatives: ["Bajar un nivel la actividad", "Trabajar el mismo área con otra actividad del catálogo"]
  },
  animo_final: {
    title: "Ánimo declarado al terminar",
    questions: [
      "¿Cómo describe el niño la actividad cuando se le pregunta en consulta?",
      "¿El momento del día o la duración influyen en cómo termina?"
    ],
    alternatives: ["Acortar la sesión", "Empezar por una actividad que le resulte más cómoda"]
  }
};

/* REVISAR (supervisora + revisión jurídica): textos legales.
   Deben reflejar exactamente los datos que la app trata. */
const LEGAL = {
  version: "borrador-0.1",
  updated: "2026-11-01",
  postTrialConditions: "Al terminar la prueba podés suscribirte: plan mensual de US$ 20 o plan anual de US$ 216 (10 % de descuento sobre el mensual). Se paga en pesos, por Mercado Pago, según la cotización oficial del dólar del Banco Nación, con el monto en pesos informado antes de confirmar. No se cobra nada sin tu confirmación expresa y podés cancelar cuando quieras desde «Mi cuenta». Si no te suscribís, las actividades quedan en pausa y podés consultar tus datos o dar de baja la cuenta.",
  retention: "A definir con asesoramiento jurídico (plazo de conservación tras la baja y tras el fin de la prueba).",
  contact: "[correo de contacto a definir]@aprendersiendo.ar"
};

/* REVISAR (supervisora + revisión jurídica): textos del cobro.
   Montos y reglas NO se escriben acá: salen de billing-rules.mjs (código).
   Marco a verificar: Ley 24.240 (arts. 10 ter, 34), Res. SCI 424/2020
   (botón de arrepentimiento), Res. 316/2018 (botón de baja). */
const BILLING_TEXT = {
  version: "cobro-borrador-0.1",
  consent: "Confirmo que quiero suscribirme al plan elegido y autorizo a Aprender Siendo a cobrar el monto indicado en pesos, por Mercado Pago, en cada renovación, hasta que cancele. Leí las condiciones.",
  renewal: "La suscripción se renueva sola al final de cada período. Podés cancelarla cuando quieras desde «Mi cuenta», en un solo paso; seguís usando la app hasta el final del período que ya pagaste.",
  noCard: "Aprender Siendo no ve ni guarda los datos de tu tarjeta: el pago se hace en la página de Mercado Pago.",
  exchange: "El precio está fijado en dólares y se cobra en pesos, según la cotización oficial del dólar (vendedor) del Banco de la Nación Argentina del día en que te suscribís. Antes de cualquier cambio del monto en pesos te avisamos por correo.",
  withdrawal: "Tenés 10 días corridos desde que te suscribiste para arrepentirte: cancelamos la suscripción y te devolvemos lo cobrado (Ley 24.240, art. 34).",
  demo: "Demostración: en esta beta no se cobra nada. En la versión real, este botón te lleva a Mercado Pago."
};

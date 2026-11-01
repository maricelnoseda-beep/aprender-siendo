/* ==========================================================================
   content_simulador.js — CONTENIDO DEL SIMULADOR DE CASOS Y DEL GENERADOR
   DE APOYOS (BORRADOR, SIN REVISIÓN CLÍNICA)

   Origen: propuesta "Clinical-Educational Simulator" enviada por la
   supervisora el 2026-11-01, corregida por DEV-IA (ver
   docs/propuestas/SIM-001_simulador_y_apoyos.md).

   Todo lo que hay acá es contenido clínico o texto dirigido a personas.
   NO lo decide DEV-IA: lo deciden PSP-SR y la supervisora clínica.
   Los textos son de demostración para que el prototipo funcione y para que
   PSP-SR tenga una base concreta que corregir. Cada bloque dice REVISAR.
   Las referencias NO están verificadas: PSP-SR confirma existencia,
   identificador (DOI o PMID) y nivel antes de cualquier publicación.
   ========================================================================== */

const SIM_CONTENT_VERSION = "SIM-001 borrador-0.1 (2026-11-01) — sin revisión clínica";

/* REVISAR (PSP-SR): banco de casos ficticios.
   Reglas de diseño que aplica el código (no el contenido):
   - Exactamente tres opciones; el orden se mezcla en cada ejecución.
   - Ninguna opción es "la correcta": cada una tiene fortalezas y riesgos.
   - Se puede elegir una o combinar varias, como en la práctica real.
   - Los escenarios se escriben de antemano y los valida PSP-SR: ningún
     modelo de lenguaje inventa resultados ni mecanismos. */
const SIM_CASES = [
  {
    id: "SIM-C01",
    title: "Escritura que se traba en 4.º grado",
    profile: {
      age: "9 años",
      grade: "4.º grado, escuela pública urbana",
      observed: [
        "Copia bien del pizarrón, pero frente a una consigna de producción escrita tarda en empezar y suele dejar la hoja en blanco.",
        "Cuando se le insiste, a veces rompe la hoja o apoya la cabeza en el banco.",
        "En tareas orales participa, cuenta historias con detalle y buen vocabulario."
      ],
      strengths: ["Narración oral rica", "Interés por los animales y el dibujo", "Buen vínculo con la maestra de plástica"],
      family: "Vive con su madre y una hermana mayor. La familia cuenta que en casa la tarea escrita termina en discusiones.",
      school: "La maestra informa que el rendimiento escrito bajó desde mitad de año y pregunta si \"hay algo más\".",
      friction: "Dificultad para iniciar y sostener tareas de escritura, con desborde emocional cuando se le exige."
    },
    question: "¿Qué estrategia priorizarías en las próximas seis semanas? Podés elegir una o combinar varias.",
    options: [
      {
        id: "conductual",
        label: "Apoyo conductual positivo en el aula",
        summary: "Acordar con la docente metas pequeñas y alcanzables (por ejemplo, escribir la primera oración) con reconocimiento inmediato y un sistema de puntos canjeables, sin quitar recreos ni sancionar.",
        scenario2w: "Escenario posible: aumenta la cantidad de veces que empieza la tarea, sobre todo si las metas son cortas. Si la exigencia sigue siendo alta, el sistema de puntos puede vivirse como otra evaluación más.",
        scenario6w: "Escenario posible: si se combina con ajustes de la tarea, la conducta de inicio se sostiene. Si se usa sola y la dificultad de base es de escritura, el avance se estanca.",
        mechanism: "El refuerzo inmediato y contingente de conductas concretas aumenta su frecuencia. No modifica por sí solo la dificultad de fondo en la escritura.",
        strengths: ["Tiene respaldo para mejorar conductas de inicio y permanencia en la tarea", "Es aplicable por la docente sin recursos extra"],
        risks: ["Confundirlo con un enfoque punitivo: el castigo no forma parte de esta opción", "Metas mal calibradas generan más frustración"],
        measure: "Cantidad de consignas iniciadas en los primeros 5 minutos, registrada por la docente 3 veces por semana.",
        evidence: "Nivel a confirmar por PSP-SR (manejo conductual en el aula).",
        refs: ["Evans, Owens, Wymbs y Ray (2018), actualización de evidencia sobre tratamientos psicosociales en TDAH. Verificar DOI y pertinencia para este caso."]
      },
      {
        id: "andamiaje",
        label: "Ajustes de la tarea y andamiaje",
        summary: "Partir la consigna en pasos visibles, ofrecer un organizador gráfico, permitir planificar primero en forma oral o con dibujo y dar tiempo adicional.",
        scenario2w: "Escenario posible: baja la cantidad de hojas en blanco, porque el primer paso es más chico y concreto. Puede depender mucho de que la docente sostenga los apoyos.",
        scenario6w: "Escenario posible: mejora la producción escrita si los apoyos se retiran de a poco. Si nunca se retiran, puede quedar dependencia del organizador.",
        mechanism: "Bajar la carga de la memoria de trabajo durante la planificación deja más recursos para transcribir. Se apoya en la teoría de la carga cognitiva y en el andamiaje (zona de desarrollo próximo).",
        strengths: ["Aprovecha su fortaleza oral", "Es un ajuste razonable que la escuela puede incluir en un PPI si hiciera falta"],
        risks: ["No explorar si hay una dificultad específica de escritura que requiere evaluación", "Que el ajuste se viva como un trato diferente frente al grupo"],
        measure: "Cantidad de palabras escritas con sentido en 10 minutos, cada 2 semanas.",
        evidence: "Nivel a confirmar por PSP-SR (enseñanza explícita de estrategias de escritura; ajustes razonables).",
        refs: ["Sweller: teoría de la carga cognitiva. Verificar la revisión más reciente.", "Diamond (2013), funciones ejecutivas (ya citada en el documento de PSP-SR)."]
      },
      {
        id: "derivacion",
        label: "Evaluación interdisciplinaria",
        summary: "Proponer a la familia una evaluación con otras disciplinas para descartar o precisar factores (por ejemplo, visión, lenguaje o aspectos emocionales), sin suspender lo que se hace en la escuela.",
        scenario2w: "Escenario posible: la familia pide turnos; en el aula todavía no cambia nada. Si se vive como \"el problema es del chico\", la escuela puede esperar el resultado sin hacer ajustes.",
        scenario6w: "Escenario posible: se obtiene información que ayuda a precisar la hipótesis. Si los turnos demoran, pasan semanas sin intervención en el aula.",
        mechanism: "Una evaluación más amplia reduce el riesgo de atribuir a una sola causa algo que puede tener varias. No es una intervención en sí misma.",
        strengths: ["Corresponde cuando hay señales de derivación obligatoria (documento de PSP-SR, sección 2)", "Puede detectar algo que el aula no ve"],
        risks: ["Usarla como reemplazo de los ajustes en lugar de hacerla en paralelo", "Sobrecargar a la familia con turnos sin explicar para qué"],
        measure: "Fecha de turnos obtenidos y si la escuela sostuvo ajustes mientras tanto.",
        evidence: "Criterio de derivación: tabla de derivaciones obligatorias de PSP-SR, sección 2.",
        refs: ["Documento de PSP-SR, sección 2 (derivaciones obligatorias)."]
      }
    ],
    combined: "En la práctica, estas opciones no se excluyen. Un plan suele combinar ajustes de la tarea con apoyo conductual positivo y, si aparecen señales, una evaluación interdisciplinaria en paralelo.",
    debriefQuestions: [
      "¿Qué dato del caso te llevó a elegir esta opción?",
      "¿Qué información te faltó y cómo la conseguirías?",
      "¿Qué medirías para saber, en seis semanas, si hay que cambiar de estrategia?"
    ]
  }
];

/* REVISAR (PSP-SR): ítems del autochequeo de entorno. Preguntas de sí o no,
   en tres capas. El profesional elige cuáles imprimir para cada familia. */
const SUPPORT_CHECKLIST = [
  { layer: "Entorno visual", items: [
    "¿En la mesa está solo lo que hace falta para esta tarea?",
    "¿La pantalla o la ventana quedan fuera del campo de visión mientras trabaja?",
    "¿Hay buena luz sobre la hoja o el cuaderno?"
  ]},
  { layer: "Interrupciones digitales", items: [
    "¿El celular está en otro ambiente o en silencio y boca abajo?",
    "¿Se cerraron las pestañas y aplicaciones que no se usan para la tarea?",
    "¿Se acordó de antemano cuándo se va a mirar el celular?"
  ]},
  { layer: "Memoria de trabajo", items: [
    "¿La consigna está escrita a la vista, no solo dicha en voz alta?",
    "¿La tarea está partida en pasos que se pueden tachar?",
    "¿Hay un lugar donde anotar dudas para no tener que recordarlas?"
  ]}
];

/* REVISAR (PSP-SR): pausa activa breve. Se quitó el nombre "neurocinética"
   y toda afirmación sobre efectos cerebrales: se presenta como una pausa
   para moverse y respirar, no como tratamiento. */
const SUPPORT_BREAK = {
  title: "Pausa activa de 2 minutos",
  steps: [
    "Pararse y estirar los brazos hacia arriba, despacio, 3 veces.",
    "Mirar por la ventana o a algo lejano durante 20 segundos.",
    "Respirar lento: inflar la panza al tomar aire y desinflarla al soltarlo, 4 veces.",
    "Mover los hombros hacia atrás en círculos, 5 veces.",
    "Volver a la mesa y leer el próximo paso del mapa."
  ],
  note: "Si algún movimiento molesta o duele, se saltea. No reemplaza indicaciones de otros profesionales."
};

/* REVISAR (PSP-SR): disparadores del protocolo de riesgo (sección 9.2) para el
   texto libre del mapa de micro-pasos. Lista de demostración, deliberadamente
   amplia: se prefiere una falsa alarma a una señal perdida. Se compara sin
   tildes y en minúsculas. */
const RISK_TRIGGERS = [
  "suicid", "matarme", "me quiero morir", "quiero morir", "no quiero vivir",
  "lastimarme", "lastimarse", "lastimarte", "me lastimo", "se lastima", "autolesi",
  "cortarme", "cortarse", "me corto", "se corta", "hacerme dano", "hacerse dano",
  "me pega", "le pega", "nos pega", "abus", "maltrat", "violencia", "golpe",
  "me toca", "lo toca", "la toca", "me amenaza"
];

/* REVISAR (PSP-SR): recursos de emergencia. Copiados del documento de PSP-SR,
   sección 9.2, que pide verificar vigencia y cobertura provincial. */
const RISK_RESOURCES = {
  title: "Detuvimos el generador",
  intro: "El texto que escribiste puede contener una señal de riesgo. Esta herramienta no es adecuada para esta situación.",
  lines: [
    "Emergencias: 911.",
    "Centro de Asistencia al Suicida: 135 (CABA y GBA) o 0800 345 1435 (todo el país).",
    "Línea 102: niñas, niños y adolescentes."
  ],
  duty: "Si integrás un establecimiento educativo o de salud y tomás conocimiento de una vulneración de derechos de una niña, niño o adolescente, tenés el deber de comunicarlo a la autoridad local (Ley 26.061, art. 30).",
  verify: "Recursos pendientes de verificación de vigencia y cobertura provincial."
};

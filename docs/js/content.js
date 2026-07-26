/* ═══════════ Reto 7D Coach — Contenido de los 7 días ═══════════
   Los audios son las grabaciones reales de la coach y viven en
   docs/audio/. El campo audioScript guarda el texto que se grabó,
   como referencia para subtítulos o para regrabar más adelante. */

const DAYS = [
  {
    num: 1,
    audioFile: "audio/dia-1.mp3",
    title: "El observador que sos",
    consigna:
      "No vemos las cosas como son: las vemos como somos. Hoy vas a empezar a distinguir la mirada con la que interpretás tu mundo.",
    audioScript:
      "Hola, te doy la bienvenida al día uno de este reto. Hoy quiero invitarte a una idea simple y poderosa: no describimos el mundo, lo interpretamos. Cada persona es un observador diferente, y ese observador define lo que ve posible. Durante el día de hoy, simplemente observate: ¿desde dónde estás mirando lo que te pasa? Nos encontramos mañana.",
    activity:
      "Escribí tres palabras que describan cómo estás mirando tu presente hoy.",
    quote: "«Cambiá el observador y cambiará lo observado.»",
  },
  {
    num: 2,
    audioFile: "audio/dia-2.mp3",
    title: "El poder de tu lenguaje",
    consigna:
      "El lenguaje no solo describe la realidad: la genera. Las palabras que elegís abren o cierran posibilidades.",
    audioScript:
      "Día dos. Hoy hablamos del lenguaje. Cuando decís «no puedo», «siempre me pasa lo mismo» o «esto es imposible», no estás describiendo tu realidad: la estás creando. Te propongo que hoy escuches tus propias palabras como si fueran semillas. ¿Qué estás sembrando cuando hablás de vos?",
    activity:
      "Anotá una frase negativa que repetís seguido y reescribila como una posibilidad. Por ejemplo: «No puedo con todo» → «Hoy elijo qué es prioridad».",
    quote: "«Las palabras no se las lleva el viento: construyen mundos.»",
  },
  {
    num: 3,
    audioFile: "audio/dia-3.mp3",
    title: "Juicios: son interpretaciones, no verdades absolutas",
    consigna:
      "Gran parte de lo que creés sobre vos no son hechos: son juicios. Y los juicios se pueden revisar.",
    audioScript:
      "Día tres. «Soy desorganizada», «soy malo para esto», «ya estoy grande para cambiar». ¿Hechos o juicios? Los juicios son opiniones que alguna vez armamos, muchas veces con poca evidencia, y que hoy gobiernan nuestras decisiones. La buena noticia es que, si los armamos nosotros, también podemos desarmarlos.",
    activity:
      "Identificá un juicio sobre vos que te esté frenando. ¿Qué evidencia real tenés a favor? ¿Y en contra?",
    quote: "«Tus juicios hablan más de vos que de aquello que juzgás.»",
  },
  {
    num: 4,
    audioFile: "audio/dia-4.mp3",
    title: "Tus emociones te informan",
    consigna:
      "Las emociones no son buenas ni malas: son información sobre lo que te importa.",
    audioScript:
      "Día cuatro. Solemos tratar a las emociones como estorbos, algo que hay que controlar o esconder. Hoy te invito a otra mirada: cada emoción trae un mensaje. El enojo habla de un límite, el miedo de algo que valorás y sentís en riesgo, la tristeza de una pérdida. ¿Qué emoción te visitó más esta semana? ¿Qué vino a decirte?",
    activity:
      "Nombrá la emoción que más sentiste hoy y escribí qué te está queriendo decir.",
    quote: "«Toda emoción es una puerta, si te animás a escucharla.»",
  },
  {
    num: 5,
    audioFile: "audio/dia-5.mp3",
    title: "Pedir abre posibilidades",
    consigna:
      "Detrás de muchos malestares hay un pedido que nunca hicimos. Pedir no es debilidad: es coordinar tu vida con otros.",
    audioScript:
      "Día cinco. ¿Cuántas veces esperaste que el otro adivinara lo que necesitabas? En coaching ontológico decimos que los pedidos crean futuro: cuando pedís, abrís una conversación que antes no existía. Hoy animate a hacer un pedido concreto, a una persona concreta.",
    activity:
      "Escribí un pedido que venís postergando: ¿a quién se lo vas a hacer y cuándo?",
    quote: "«Quien no pide, decide de antemano la respuesta.»",
  },
  {
    num: 6,
    audioFile: "audio/dia-6.mp3",
    title: "Tu cuerpo también habla",
    consigna:
      "Cuerpo, emoción y lenguaje van juntos. Cambiar tu postura y tu respiración también cambia tu manera de estar en el mundo.",
    audioScript:
      "Día seis. Hacé esto conmigo: soltá los hombros, aflojá la mandíbula y tomá tres respiraciones profundas. El cuerpo no es solo un vehículo: es parte del observador que sos. Cuando habitás tu cuerpo de otra manera, aparecen conversaciones, decisiones y descansos que antes no estaban disponibles.",
    activity:
      "Después de un minuto de respiración consciente, anotá qué notaste en tu cuerpo y en tu ánimo.",
    quote: "«El cuerpo dice lo que las palabras todavía no saben nombrar.»",
  },
  {
    num: 7,
    audioFile: "audio/dia-7.mp3",
    title: "Tu declaración de cambio",
    consigna:
      "Las declaraciones inauguran mundos: «basta», «sí», «no sé», «gracias». Hoy vas a declarar tu próxima etapa.",
    audioScript:
      "Llegaste al día siete. Quiero felicitarte: sostener un compromiso con vos durante una semana no es poco. Hoy cerramos con la distinción más transformadora: la declaración. Una declaración no describe lo que hay, inaugura lo que viene. Te invito a escribir la tuya. Y si querés seguir profundizando este camino, me encantaría acompañarte en una sesión.",
    activity:
      "Escribí tu declaración personal para esta nueva etapa. Empezá con: «Yo declaro…».",
    quote: "«Una declaración no describe el mundo: lo inaugura.»",
  },
];

/* Contenido extra desbloqueable con anuncio voluntario */
const EXTRA_AFFIRMATIONS = [
  "Hoy elijo las palabras con las que me hablo.",
  "Mis juicios son opiniones, no sentencias.",
  "Puedo pedir ayuda sin dejar de ser capaz.",
  "Mis emociones me informan, no me definen.",
  "Habito mi cuerpo con presencia y calma.",
  "Cada conversación es una oportunidad de crear futuro.",
  "Yo declaro que mi próxima etapa empieza hoy.",
];

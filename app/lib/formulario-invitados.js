// El formulario que llena un invitado antes de la entrevista.
//
// Reemplaza al que estaba hecho con un formulario de Airtable. Las diez
// preguntas son las mismas, palabra por palabra: lo que cambia es que ahora
// vive en el sitio, con el diseño del sitio, y que además pide los datos de
// contacto y las redes, que el de Airtable no pedía.
//
// Está acá y no dentro de la página porque lo usan tres lugares: el formulario
// que ve el invitado, la ruta que guarda la respuesta y el panel donde se lee.
// Si cada uno tuviera su lista, tarde o temprano el panel mostraría una
// pregunta que la ruta no guarda.
//
// ---------------------------------------------------------------------------
// PÚBLICO Y PRIVADO
// ---------------------------------------------------------------------------
// Cada campo dice si puede salir a la ficha pública o no, y eso NO es una
// etiqueta decorativa: la ruta que guarda y el panel la miran.
//
//   privado: true  → mail y teléfono. No salen nunca a la web. Viven en
//                    Airtable, que no es público, y se ven solo desde /admin.
//   privado: false → nombre, cómo quiere que lo nombremos, empresa, web y
//                    redes. Son los que alimentan la ficha.
//
// Las diez respuestas largas tampoco se publican: son notas de preparación
// para la charla, no contenido. Sirven para escribir la ficha y para preparar
// el episodio.

export const CONTACTO = [
  {
    id: "nombre",
    campo: "Nombre y apellido",
    rotulo: "Nombre y apellido",
    tipo: "texto",
    requerido: true,
  },
  {
    id: "comoNombrar",
    campo: "Cómo quiere que lo nombremos",
    rotulo: "¿Cómo querés que te nombremos?",
    tipo: "texto",
    ayuda:
      "Si usás un nombre artístico o te conocen de otra forma, poné ese. Es el que va a salir en tu ficha.",
  },
  {
    id: "empresa",
    campo: "Empresa / Cargo",
    rotulo: "Empresa y cargo",
    tipo: "texto",
    ayuda: "Dónde trabajás y qué hacés ahí.",
  },
  {
    id: "email",
    campo: "Email",
    rotulo: "Tu mail",
    tipo: "email",
    requerido: true,
    privado: true,
    ayuda:
      "Para escribirte y para que revises tu ficha antes de que salga publicada. No se publica en ningún lado.",
  },
  {
    id: "telefono",
    campo: "Teléfono",
    rotulo: "Tu teléfono",
    tipo: "tel",
    privado: true,
    ayuda: "Opcional, para coordinar la grabación. Tampoco se publica.",
  },
  {
    id: "web",
    campo: "Web",
    rotulo: "Tu web",
    tipo: "url",
    ayuda: "Opcional. Si tenés sitio, va con link desde tu ficha.",
  },
  {
    id: "redes",
    campo: "Redes",
    rotulo: "Tus redes",
    tipo: "area",
    ayuda:
      "Un link por línea: Instagram, LinkedIn, tu canal. Estas sí salen en tu ficha, así que quien te escuche te puede encontrar.",
  },
];

// Las diez de siempre, con el mismo texto que tenían en Airtable.
export const PREGUNTAS = [
  {
    id: "p1",
    campo:
      "1.\t¿Cuál es tu experiencia principal en el mundo de los eventos y qué tipo de eventos te apasiona más?",
    rotulo:
      "¿Cuál es tu experiencia principal en el mundo de los eventos y qué tipo de eventos te apasiona más?",
  },
  {
    id: "p2",
    campo:
      "2.\t¿Qué aprendizaje o consejo concreto creés que podrías compartir que le sume valor a nuestra audiencia?",
    rotulo:
      "¿Qué aprendizaje o consejo concreto creés que podrías compartir que le sume valor a nuestra audiencia?",
  },
  {
    id: "p3",
    campo:
      "3.\t¿Tenés alguna anécdota o historia que ilustre un aprendizaje clave o un error que te enseñó algo importante?",
    rotulo:
      "¿Tenés alguna anécdota o historia que ilustre un aprendizaje clave o un error que te enseñó algo importante?",
  },
  {
    id: "p4",
    campo:
      "4.\t¿Qué tendencias o cambios recientes en la industria de los eventos te parecen relevantes?",
    rotulo:
      "¿Qué tendencias o cambios recientes en la industria de los eventos te parecen relevantes?",
  },
  {
    id: "p5",
    campo:
      "5.\t¿Cómo ves el futuro de los eventos en Argentina y qué oportunidades creés que se vienen?",
    rotulo:
      "¿Cómo ves el futuro de los eventos en Argentina y qué oportunidades creés que se vienen?",
  },
  {
    id: "p6",
    campo:
      "6.\tSi tuvieras que darle un consejo a alguien que recién empieza en este rubro, ¿cuál sería?",
    rotulo:
      "Si tuvieras que darle un consejo a alguien que recién empieza en este rubro, ¿cuál sería?",
  },
  {
    id: "p7",
    campo:
      "7.\t¿Qué error común ves que se repite en la industria y cómo sugerís evitarlo?",
    rotulo: "¿Qué error común ves que se repite en la industria y cómo sugerís evitarlo?",
  },
  {
    id: "p8",
    campo:
      "8.\t¿Qué herramientas, tecnologías o recursos recomendás para trabajar mejor en producción, creatividad o estrategia?",
    rotulo:
      "¿Qué herramientas, tecnologías o recursos recomendás para trabajar mejor en producción, creatividad o estrategia?",
  },
  {
    id: "p9",
    campo:
      "9.\t¿Qué dinámica te copa o se te ocurre que podríamos usar en el episodio para hacerlo más entretenido?",
    rotulo:
      "¿Qué dinámica te copa o se te ocurre que podríamos usar en el episodio para hacerlo más entretenido?",
  },
  {
    id: "p10",
    campo:
      "10.\t¿Hay algún tema que te gustaría sumar sí o sí a esta charla? Algo que creas que no deberíamos dejar afuera.",
    rotulo:
      "¿Hay algún tema que te gustaría sumar sí o sí a esta charla? Algo que creas que no deberíamos dejar afuera.",
  },
];

export const TODOS = [...CONTACTO, ...PREGUNTAS];

// LA FOTO.
//
// No va en CONTACTO ni en PREGUNTAS porque no es texto: es un archivo y una
// autorización, y las dos cosas viajan aparte.
//
// El punto no es juntar una foto —esa se puede bajar de cualquier red— sino
// que la persona diga que sí. La ficha lleva su nombre, su cara y lo que hace,
// y se publica en un sitio que ella no controla. Por eso la casilla es
// obligatoria para que la foto se guarde, y la fecha en que la marcó queda
// escrita al lado de la imagen: si algún día alguien pregunta, la respuesta no
// es "me parece que sí".
//
// Sigue habiendo un segundo paso: antes de publicar la ficha se le manda para
// que la revise entera, foto incluida. Esto no lo reemplaza, lo adelanta.
export const FOTO = {
  id: "foto",
  campo: "Foto",
  campoFecha: "Autorizó la foto el",
  rotulo: "Tu foto",
  ayuda:
    "Opcional. Una donde se te vea la cara, de frente. Se recorta sola a vertical y no hace falta que sea liviana: la achica tu navegador antes de mandarla.",
  // El texto de la casilla. Dice QUÉ se hace con la foto y DÓNDE, que es lo
  // único que convierte un clic en un permiso.
  autorizacion:
    "Autorizo a Mate y Eventos a publicar esta foto en mi ficha de mateyeventos.com.",
};

// El tamaño al que la recorta el navegador: el mismo de las fotos de Pablo y
// Alexis, para que una ficha no desentone al lado de otra.
export const FOTO_ANCHO = 800;
export const FOTO_ALTO = 1000;

// Tope de lo que acepta el servidor, ya recortada. Una foto de 800×1000 en
// JPEG pesa entre 60 y 150 KB: medio mega es holgado y corta cualquier cosa
// rara antes de que llegue a Airtable.
export const FOTO_MAX_BYTES = 512 * 1024;

// Los campos que NO pueden salir a la web, por id. Lo usa el panel para
// marcarlos y la ruta que arma la ficha para no copiarlos nunca.
export const PRIVADOS = CONTACTO.filter((c) => c.privado).map((c) => c.id);

// Un mail o un teléfono escritos donde van las redes. Pasa, y no por maldad:
// alguien pega su contacto en el campo equivocado y ese campo sí se publica.
//
// El mail se busca en cualquier parte del renglón. El teléfono ANTES se pedía
// que ocupara el renglón entero, así que "11 5555 5555" se frenaba pero
// "WhatsApp 11 5555 5555" pasaba y se publicaba. Era el mismo daño con una
// palabra adelante.
//
// Lo difícil de buscarlo en cualquier parte son los falsos positivos: un link
// legítimo puede traer un número largo —"linkedin.com/in/juan-perez-123456789",
// "youtube.com/watch?v=12345678"— y frenar la red de alguien es peor que dejar
// pasar un teléfono, porque le rompe el trámite sin que entienda por qué.
//
// Por eso el número tiene que arrancar renglón o venir después de un espacio o
// un paréntesis: pegado a "/", "=", "-" o a una letra es parte de una
// dirección, no un teléfono. Y se cuentan los dígitos de verdad: ocho o más.
// "Av. Corrientes 1234" tiene cuatro y no molesta a nadie.
const TELEFONO = /(?:^|[\s(])(\+?\d[\d\s().-]{5,}\d)/;

export function pareceContacto(texto) {
  const t = String(texto || "").trim();
  if (/^mailto:|[^\s/]@[^\s/]*\.[a-z]{2,}|^tel:/i.test(t)) return true;

  const m = t.match(TELEFONO);
  if (!m) return false;
  return (m[1].match(/\d/g) || []).length >= 8;
}

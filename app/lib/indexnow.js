// Avisarle a los buscadores que una dirección cambió, sin esperar a que pasen.
//
// IndexNow es un ping: le mandás una lista de direcciones y los motores que lo
// soportan —Bing, Yandex, Naver, Seznam— vienen a mirarlas. Google no lo usa.
// Igual vale para este sitio por dos motivos: la agenda cambia todos los días,
// y Bing es el que alimenta a ChatGPT y a Copilot, que ya nos mandan visitas
// (12 de ChatGPT y 6 de Gemini en cinco días, viniendo de cero).
//
// LA CLAVE NO ES UN SECRETO. Al revés: el protocolo exige que esté publicada
// en texto plano en la raíz del dominio, y el motor la va a buscar ahí para
// comprobar que quien avisa es el dueño del sitio. Por eso vive en public/ y
// no en una variable de entorno. No la muevas.
const CLAVE = "ec759133cdb336d755a69888de99339a";
const ARCHIVO = "https://www.mateyeventos.com/ec759133cdb336d755a69888de99339a.txt";
const HOST = "www.mateyeventos.com";

// Se avisa SOLO de lo que cambió.
//
// Mandar las 338 fichas todos los días es lo que el protocolo pide no hacer, y
// lo que hace que un sitio deje de ser tenido en cuenta. Cada llamada de acá
// sale de un lugar del código que sabe qué evento se tocó.
const TOPE = 100;

export async function avisarIndexNow(urls) {
  const lista = [...new Set((urls || []).filter(Boolean))].slice(0, TOPE);
  if (lista.length === 0) return { ok: false, motivo: "nada que avisar" };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: CLAVE,
        keyLocation: ARCHIVO,
        urlList: lista,
      }),
      signal: AbortSignal.timeout(10000),
    });

    // 200 y 202 son los dos que valen: aceptado, y aceptado-pero-lo-miro-luego.
    if (!res.ok) {
      console.warn(`[indexnow] respondió ${res.status} para ${lista.length} direcciones`);
      return { ok: false, estado: res.status };
    }
    console.log(`[indexnow] avisadas ${lista.length} direcciones`);
    return { ok: true, avisadas: lista.length };
  } catch (e) {
    // Un aviso que no sale nunca puede voltear la operación que lo disparó.
    // Es la misma regla que el correo: el sello se enciende igual, el evento
    // se guarda igual, y esto se reintenta solo en el próximo cambio.
    console.warn(`[indexnow] no se pudo avisar: ${e.message}`);
    return { ok: false, motivo: e.message };
  }
}

// La dirección pública de una ficha, que es lo que se avisa.
export function urlDeFicha(slug) {
  return `https://${HOST}/agenda/${slug}`;
}

import Link from "next/link";
import EpisodePlayer from "./EpisodePlayer";
import SalidaLink from "./SalidaLink";
import { partirTitulo } from "../lib/youtube";
import { LINKS } from "../lib/site";

// El bloque que pone el podcast adelante en las páginas que traen tráfico.
//
// POR QUÉ EXISTE. Search Console dice tráfico de marca 0% y genérico 100%:
// nadie busca "Mate y Eventos", todos buscan el nombre de un evento ajeno o
// "qué es el timing de un evento", se llevan el dato y se van. El pie de
// página ya tiene 24 links a YouTube, Spotify, Instagram y los episodios, y
// los vieron 62.400 impresiones en un mes: la exposición pasiva no convierte.
// Hace falta una invitación, no un link más.
//
// POR QUÉ ES YOUTUBE Y NO INSTAGRAM. El pedido original era embeber un reel.
// El frame-src de la CSP (next.config.js) permite iframes de youtube-nocookie
// y youtube.com y nada más, y abrir esa política —que está razonada línea por
// línea— por un canal de 40 seguidores no se paga con nada. YouTube tiene
// 65.216 vistas, el mismo contenido en vertical y ya está permitido.
//
// EL VIDEO NO CARGA AL ENTRAR: EpisodePlayer dibuja la miniatura y monta el
// iframe recién al hacer clic. El motivo largo está en ese archivo.
//
// Es presentacional y no decide nada: quién llama le pasa el episodio y el
// texto. Eso es a propósito, porque de dónde sale el episodio es distinto en
// cada plantilla y ahí está toda la diferencia:
//
//   · glosario y artículos → el episodio DECLARADO en la cabecera del .md
//     (campos `episodio` y `episodioTitulo`). La relación existe en el dato,
//     no se infiere nada, y el público es exactamente el oyente del podcast.
//   · ficha de evento → el ÚLTIMO episodio, presentado como quiénes somos. En
//     la ficha no hay ningún campo que ate un evento a un episodio, y decir
//     que un episodio es "sobre" ese evento sería inventar la relación. Es la
//     misma regla que ya dice app/lib/enlaces.js.
export default function InvitacionAlPodcast({
  id, // el videoId de YouTube
  titulo = "", // el título tal como está en YouTube: "T01E08 - El Minuto Cero…"
  minuto = "", // "12:40", si el término lo tiene cargado
  encabezado,
  invitacion,
}) {
  // Sin episodio no hay bloque. Pasa si la lectura de YouTube vino vacía en la
  // ficha, o si un .md quedó sin el campo: antes de dibujar una caja con un
  // link roto, no se dibuja nada.
  if (!id) return null;

  // Se parte el título con la misma función que usan /episodios y el
  // newsletter: el "T01E08" adelante no le dice nada a quien cae de Google y
  // se come el espacio del tema, que es lo que de verdad invita a escuchar.
  const { codigo, tema, invitado } = partirTitulo(titulo);
  const nombre = tema || "Episodio de Mate y Eventos";
  const arranque = segundosDe(minuto);
  const linea = [codigo, invitado].filter(Boolean).join(" · ");

  return (
    // Sección propia, con su marca arriba y su borde.
    //
    // EN LA FICHA DE EVENTO ESTO NO ES COSMÉTICA. Arriba, en la cabecera, vive
    // el sello "Datos verificados por el organizador", que certifica que el
    // organizador repasó LOS DATOS DEL EVENTO. Esto es una oferta nuestra: si
    // se leyera como parte de la ficha, estaríamos haciendo pasar por avalado
    // por el organizador algo que él nunca vio, y eso rompe lo único que hace
    // que el sello valga algo. Por eso va separado, abajo, con el nombre del
    // podcast escrito arriba de todo y diciendo de quién es.
    <section className="pod reveal">
      <div className="pod__marca">Mate y Eventos · el podcast</div>
      <h2 className="ev-h2" style={{ marginTop: "10px" }}>
        {encabezado}
      </h2>
      <p className="pod__texto">{invitacion}</p>

      <div className="pod__grid">
        <EpisodePlayer
          id={id}
          title={nombre}
          // hqdefault y no maxresdefault: es la que existe para todos los
          // videos. Cuando maxres falta, YouTube devuelve una imagen de 120px
          // que se ve como una mancha, y acá no hay a quién preguntarle.
          thumb={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
          inicio={arranque}
          medir
        />

        <div className="pod__info">
          {linea ? <div className="pod__meta">{linea}</div> : null}
          <h3 className="pod__tit">{nombre}</h3>
          {arranque > 0 ? (
            <p className="pod__minuto">
              El play arranca en el minuto {minuto}, que es donde se habla de
              esto.
            </p>
          ) : null}
          <div className="pod__botones">
            <Link className="btn" href={`/episodios/${id}`}>
              Ver el episodio completo
            </Link>
            {/* El segundo botón va a Spotify y no a /escuchar: /escuchar es
                noindex y existe para repartir tráfico que llega de los shorts,
                así que mandar ahí 589 links internos es un rebote de más entre
                el que quiere escuchar y la app donde escucha. Y SalidaLink lo
                mide, que es lo que cierra la pregunta "¿alguno llegó al
                audio?". */}
            <SalidaLink
              destino="spotify"
              href={LINKS.spotify}
              className="btn btn--ghost"
            >
              Escuchar en Spotify
            </SalidaLink>
          </div>
        </div>
      </div>
    </section>
  );
}

// "12:40" → 760 segundos, para que el play arranque donde se habla del tema.
//
// OJO: el campo `minuto` está vacío en 92 de los 93 archivos del glosario, así
// que esto es la excepción y no la regla: el bloque tiene que verse bien sin
// él, y por eso el minuto es un renglón que aparece y no una parte del armado.
//
// Si el valor no se entiende, devuelve 0 y el video arranca del principio. No
// se adivina: un video que abre en el minuto equivocado es peor que uno que
// abre donde siempre, porque el que lo mira cree que ahí está el tema.
function segundosDe(minuto) {
  const t = String(minuto || "").trim();
  if (!t) return 0;

  const partes = t.split(":").map((p) => p.trim());
  if (partes.length === 2 || partes.length === 3) {
    if (!partes.every((p) => /^\d{1,2}$/.test(p))) return 0;
    const n = partes.map(Number);
    // Los tramos de la derecha son sexagesimales: "99:99" no es una marca de
    // tiempo, es un campo mal cargado. Sin este corte se interpretaba como
    // 1h40m39s y el video abría en cualquier parte, que es peor que abrir en
    // el principio porque el que mira cree que ahí está el tema.
    if (n.slice(1).some((x) => x > 59)) return 0;
    const total =
      partes.length === 3 ? n[0] * 3600 + n[1] * 60 + n[2] : n[0] * 60 + n[1];
    // Más de seis horas no es un minuto de un episodio.
    return total > 0 && total < 6 * 3600 ? total : 0;
  }

  // Un número suelto son minutos: "12" es el minuto 12.
  if (!/^\d{1,3}$/.test(t)) return 0;
  const m = Number(t);
  return m > 0 && m < 360 ? m * 60 : 0;
}

import Link from "next/link";
import { partirTitulo, formatDate } from "../lib/youtube";

// El cuerpo visible de una ficha de invitado.
//
// Vive acá y no adentro de la página porque lo dibujan DOS lugares: la página
// pública /invitados/{slug} y la vista previa del panel, que es la que deja ver
// un borrador antes de publicarlo. Si cada una tuviera su copia, el día que se
// toque una la vista previa empezaría a mostrar algo distinto de lo que se
// publica — y una vista previa que miente es peor que no tenerla.
//
// Lo que NO entra acá: el schema, los metadatos y la barra de navegación. Eso
// es de cada página, porque un borrador no se declara en schema.org ni se
// indexa.
export default function CuerpoFicha({ invitado: i, episodios = [], nombradoEn = [] }) {
  return (
    <>
      <section className="page-top" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>
            <Link href="/invitados">Invitados</Link> / {i.nombre}
          </div>
          <h1>{i.nombre}</h1>
          {i.rol ? <p className="inv-rol reveal">{i.rol}</p> : null}
          {i.bio ? (
            <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
              {i.bio}
            </p>
          ) : null}

          {i.webUrl || i.redes.length ? (
            <div
              style={{
                marginTop: "26px",
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {/* Solo si la dirección se puede linkear: la escribe el propio
                  invitado, y un "javascript:" acá ejecuta código en nuestro
                  dominio. Si no sirve, no se dibuja el botón en vez de dibujar
                  un link roto. */}
              {i.webUrl ? (
                <a
                  className="btn btn--ghost"
                  href={i.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Su sitio
                </a>
              ) : null}
              {i.redes.map((r) => (
                <a
                  key={r}
                  className="btn btn--ghost"
                  href={r}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {nombreDeRed(r)}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          {/* La foto al lado del texto, como en las páginas de Pablo y Alexis.
              Si no hay, el texto ocupa todo el ancho y no queda un hueco. */}
          <div className={i.foto ? "persona" : ""}>
            {i.foto ? (
              <div className="persona__foto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/invitados/${i.slug}.jpg`}
                  alt={i.nombre}
                  width={800}
                  height={1000}
                />
              </div>
            ) : null}
            <div className={i.foto ? "persona__texto" : ""}>
              {i.cuerpo ? (
                <section className="sem-bloque reveal">
                  {i.cuerpo.split(/\n{2,}/).map((p, n) => (
                    <p className="sem-nota" key={n}>
                      {p.trim()}
                    </p>
                  ))}
                </section>
              ) : null}
            </div>
          </div>

          {episodios.length ? (
            <section className="sem-bloque reveal">
              <h2 className="ag-mes">
                {episodios.length === 1
                  ? "El episodio donde habló"
                  : `Los ${episodios.length} episodios donde habló`}
              </h2>
              <div className="ag-tabla">
                {episodios.map((e) => {
                  const partes = partirTitulo(e.title);
                  return (
                    <Link
                      href={`/episodios/${e.id}`}
                      key={e.id}
                      className="ag-fila"
                    >
                      <span className="ag-fila__fecha">
                        {formatDate(e.published)}
                      </span>
                      <span className="ag-fila__nombre">{partes.tema}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}

          {nombradoEn.length ? (
            <section className="sem-bloque reveal">
              <h2 className="ag-mes">
                {/* Neutro a propósito: "donde se lo nombra" le pone género a
                    una persona de la que no sabemos ninguno, y la ficha la
                    escribe un robot. "Donde aparece su nombre" además dice
                    exactamente cuál es el criterio: el nombre está escrito en
                    ese artículo y se puede comprobar con Ctrl+F. */}
                {nombradoEn.length === 1
                  ? "El artículo donde aparece su nombre"
                  : `Los ${nombradoEn.length} artículos donde aparece su nombre`}
              </h2>
              <div className="ag-tabla">
                {nombradoEn.map((a) => (
                  <Link
                    href={`/articulos/${a.id}`}
                    key={a.id}
                    className="ag-fila"
                  >
                    <span className="ag-fila__fecha">{a.eje}</span>
                    <span className="ag-fila__nombre">{a.titulo}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <p className="sem-nota" style={{ marginTop: "30px" }}>
            <Link href="/invitados">← Todos los invitados</Link>
          </p>
        </div>
      </section>
    </>
  );
}


// El nombre de la red que sale de su dirección, para no poner "https://..."
// adentro de un botón. Si no se reconoce, se muestra el dominio pelado.
function nombreDeRed(url) {
  const u = String(url || "").toLowerCase();
  if (u.includes("instagram.")) return "Instagram";
  if (u.includes("linkedin.")) return "LinkedIn";
  if (u.includes("tiktok.")) return "TikTok";
  if (u.includes("youtube.") || u.includes("youtu.be")) return "YouTube";
  if (u.includes("x.com") || u.includes("twitter.")) return "X";
  if (u.includes("facebook.")) return "Facebook";
  if (u.includes("spotify.")) return "Spotify";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Su perfil";
  }
}

import { Inter, Space_Grotesk, Rajdhani } from "next/font/google";
import "./globals.css";
import Atmosphere from "./components/Atmosphere";
import Motion from "./components/Motion";
import Contador from "./components/Contador";
import { SITE, LINKS, AUTORES, EJES } from "./lib/site";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Mate y Eventos · Podcast y agenda de la industria de eventos",
    template: `%s · ${SITE.name}`,
  },
  description: SITE.descripcionSeo,
  keywords: [
    "eventos",
    "podcast de eventos",
    "industria de eventos",
    "producción de eventos",
    "Latinoamérica",
    "Argentina",
    "Mate y Eventos",
  ],
  authors: SITE.autores.map((name) => ({ name })),
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE.url,
    siteName: SITE.name,
    title: "Mate y Eventos — Podcast de la industria de eventos",
    description: SITE.descripcionSeo,
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.descripcionSeo,
    images: ["/og-default.jpg"],
  },
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    // Las dos personas, con identidad propia y estable.
    //
    // Se declaran una sola vez acá, en el layout, y el resto del sitio las
    // referencia por @id. Así el artículo que firma Pablo y el "founder" de la
    // organización son la MISMA entidad para una máquina, en vez de dos
    // nombres iguales que casualmente se escriben igual.
    ...AUTORES.map((a) => ({
      "@type": "Person",
      "@id": `${SITE.url}/#${a.id}`,
      name: a.nombre,
      jobTitle: a.cargo,
      description: a.bio,
      worksFor: { "@id": `${SITE.url}/#organization` },
      // La productora que dirigen: es lo que respalda el oficio que cuenta la
      // biografía, y es una empresa distinta del medio.
      affiliation: { "@id": `${SITE.url}/#av-eventos` },
      url: `${SITE.url}/sobre`,
      ...(a.perfil ? { sameAs: [a.perfil] } : {}),
    })),
    // AV Eventos entra como nodo propio, no como texto suelto dentro de la
    // biografía: así "los que hacen Mate y Eventos dirigen una productora de
    // eventos" es un dato que una máquina puede seguir, y no una frase.
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#av-eventos`,
      name: "AV Eventos",
      description:
        "Productora de eventos dirigida por Pablo Quiroga y Alexis Vidal.",
      sameAs: [LINKS.linkedinAvEventos],
    },
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      alternateName: "MyE",
      url: SITE.url,
      description: SITE.descripcion,
      slogan: SITE.tagline,
      email: SITE.email,
      logo: `${SITE.url}/icon.png`,
      foundingDate: "2026",
      // De qué es experta esta marca y dónde opera: son los cuatro ejes
      // editoriales, escritos una sola vez en site.js.
      knowsAbout: [
        "Industria de eventos",
        "Producción de eventos",
        ...EJES.map((e) => e.titulo),
      ],
      areaServed: [
        { "@type": "Country", name: "Argentina" },
        { "@type": "Place", name: "Latinoamérica" },
      ],
      founder: AUTORES.map((a) => ({ "@id": `${SITE.url}/#${a.id}` })),
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Consultas y prensa",
        email: SITE.email,
        availableLanguage: ["es"],
      },
      sameAs: [
        LINKS.youtube,
        LINKS.spotify,
        LINKS.apple,
        LINKS.instagram,
        LINKS.tiktok,
        LINKS.linkedin,
      ],
    },
    // El nodo que faltaba: el sitio como tal, distinto de la organización que
    // lo publica.
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      name: SITE.name,
      alternateName: "MyE",
      url: SITE.url,
      description: SITE.descripcionSeo,
      inLanguage: "es-AR",
      publisher: { "@id": `${SITE.url}/#organization` },
    },
    {
      "@type": "PodcastSeries",
      "@id": `${SITE.url}/#podcast`,
      name: SITE.name,
      url: `${SITE.url}/episodios`,
      description: SITE.descripcion,
      inLanguage: "es",
      webFeed: LINKS.rss,
      author: AUTORES.map((a) => ({ "@id": `${SITE.url}/#${a.id}` })),
      publisher: { "@id": `${SITE.url}/#organization` },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${spaceGrotesk.variable} ${rajdhani.variable}`}
    >
      <body data-accent="blue">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Atmosphere />
        <Contador />
        {children}
        <Motion />
      </body>
    </html>
  );
}

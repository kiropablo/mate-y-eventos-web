import { Inter, Space_Grotesk, Rajdhani } from "next/font/google";
import "./globals.css";
import Atmosphere from "./components/Atmosphere";
import Motion from "./components/Motion";
import { SITE, LINKS } from "./lib/site";

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
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.descripcion,
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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.descripcion,
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.descripcion,
    images: ["/og-default.jpg"],
  },
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      description: SITE.descripcion,
      email: SITE.email,
      logo: `${SITE.url}/icon.png`,
      founder: SITE.autores.map((name) => ({ "@type": "Person", name })),
      sameAs: [
        LINKS.youtube,
        LINKS.spotify,
        LINKS.apple,
        LINKS.instagram,
        LINKS.tiktok,
        LINKS.linkedin,
      ],
    },
    {
      "@type": "PodcastSeries",
      "@id": `${SITE.url}/#podcast`,
      name: SITE.name,
      url: `${SITE.url}/episodios`,
      description: SITE.descripcion,
      inLanguage: "es",
      webFeed: LINKS.rss,
      author: SITE.autores.map((name) => ({ "@type": "Person", name })),
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
        {children}
        <Motion />
      </body>
    </html>
  );
}

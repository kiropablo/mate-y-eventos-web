// Registra el paso de los bots de IA por el sitio.
//
// ¿Por que aca y no en el contador de visitas? Porque estos bots no ejecutan
// JavaScript: un contador en el navegador no los ve jamas. La unica forma de
// saber que GPTBot leyo el glosario es mirar cada pedido del lado del
// servidor, que es exactamente lo que hace un middleware.
//
// El registro viaja al panel (datos.mateyeventos.com), que es quien tiene la
// base. Esta web no conoce la base ni tiene sus claves: los dos proyectos
// siguen separados. Y se manda con waitUntil, o sea DESPUES de responder:
// al bot (ni a ninguna visita) no lo demora ni un milisegundo.
import { NextResponse } from "next/server";
import { detectarBot } from "./app/lib/bots.js";

const REGISTRADOR = "https://datos.mateyeventos.com/api/registrar";

// Lo que no vale la pena mirar: los archivos internos de Next y los recursos
// (imagenes, tipografias). Ojo: /llms.txt, /robots.txt y /sitemap.xml SI se
// miran — que un bot de IA lea justo esos es la señal mas linda del AI SEO.
const RECURSOS = /\.(png|jpe?g|webp|avif|gif|svg|ico|css|js|map|woff2?)$/i;

export const config = {
  matcher: ["/((?!_next/|api/).*)"],
};

export function middleware(pedido, evento) {
  const ruta = pedido.nextUrl.pathname;
  if (!RECURSOS.test(ruta)) {
    const ua = pedido.headers.get("user-agent") || "";
    const bot = detectarBot(ua);
    if (bot) {
      evento.waitUntil(
        fetch(REGISTRADOR, {
          method: "POST",
          headers: { "content-type": "text/plain" },
          body: JSON.stringify({
            tipo: "bot",
            bot: bot.nombre,
            ruta,
            ua: ua.slice(0, 200),
            pais: pedido.headers.get("x-vercel-ip-country") || null,
          }),
        }).catch(() => {}),
      );
    }
  }
  return NextResponse.next();
}

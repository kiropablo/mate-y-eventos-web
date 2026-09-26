import crypto from "node:crypto";

// El token que abre las dos rutas internas de la agenda: el refresco
// (/api/agenda/revalidar) y los avisos de fecha (/api/agenda/avisos). Lo manda
// la Action de la agenda y no lo usa nadie de afuera.
//
// Se manda en la cabecera x-token y NO en la dirección, porque Vercel guarda en
// sus registros de pedidos la URL completa CON su querystring: un token en
// ?token= queda escrito ahí, en texto, para cualquiera que mire los registros.
// Y si además alguien "visita" esa dirección desde el navegador para refrescar a
// mano, la clave le queda en el historial y en la barra de direcciones.
//
// La querystring se sigue aceptando SOLO por compatibilidad. Si se sacara de
// golpe, cualquier llamador viejo que todavía use ?token= —un workflow que no se
// actualizó, un link guardado— empezaría a comer 401 en silencio, y lo que se
// deja de hacer es refrescar la agenda y mandar los avisos de fecha: nadie se
// entera hasta que alguien queda esperando para siempre un correo. Una vez que
// no quede ningún llamador con ?token=, se puede borrar esa mitad y con ella el
// rastro en los registros.

export function tokenDeRefrescoValido(req) {
  const esperado = process.env.REVALIDATE_TOKEN;
  if (!esperado) return false;

  const recibido =
    req.headers.get("x-token") || new URL(req.url).searchParams.get("token");

  // Comparación de tiempo constante, igual que en firma.js: comparar con ===
  // corta en el primer carácter distinto y filtra por el tiempo que tarda en
  // fallar cuántos caracteres acertó quien prueba.
  if (typeof recibido !== "string" || recibido.length !== esperado.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(recibido), Buffer.from(esperado));
  } catch {
    return false;
  }
}

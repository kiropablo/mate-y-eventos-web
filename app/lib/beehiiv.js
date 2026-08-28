// Lo que se puede leer de beehiiv con el plan que tenemos.
//
// Importante, para no volver a investigarlo: con este plan se pueden dar de
// alta suscriptores (lo hace /api/subscribe) y LEERLOS, pero no enviar. El
// endpoint que manda una campaña —"Create post" / Send API— pide plan Max, y
// la Send API está en beta y se pide por separado, solo para Enterprise.
// Verificado el 28/8/2026 en developers.beehiiv.com. Ver el pendiente 3 del
// CLAUDE.md antes de volver sobre esto.
//
// Lo que sí se puede: contar. El listado de suscripciones devuelve
// "total_results" en la misma respuesta, así que con pedir UNA fila alcanza
// para saber cuántos hay. No hace falta traerse la lista entera.

const API = "https://api.beehiiv.com/v2";

async function contar(estado) {
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  const apiKey = process.env.BEEHIIV_API_KEY;
  if (!pubId || !apiKey) return { error: "Faltan las claves de beehiiv." };

  // limit=1 porque solo interesa el total del encabezado, no las filas.
  // "page" está marcado como obsoleto en la documentación, pero es lo que
  // trae total_results; la paginación nueva (cursor) solo dice si hay más,
  // y contar así obligaría a recorrer toda la lista.
  const url =
    `${API}/publications/${pubId}/subscriptions` +
    `?limit=1&page=1&status=${encodeURIComponent(estado)}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      // Un minuto de cache: la pantalla se recarga varias veces por sesión y
      // el número no se mueve tanto.
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const detalle = (await res.text()).slice(0, 160);
      console.warn(`[beehiiv] ${res.status} al contar "${estado}": ${detalle}`);
      return { error: `beehiiv respondió ${res.status}.`, detalle };
    }

    const datos = await res.json();
    // Si algún día dejan de mandar total_results, esto tiene que quedar
    // escrito y no devolver cero: un cero inventado en el panel es peor que
    // un "no se pudo".
    if (typeof datos?.total_results !== "number") {
      console.warn(`[beehiiv] la respuesta no trajo total_results (${estado})`);
      return { error: "beehiiv no devolvió el total." };
    }
    return { total: datos.total_results };
  } catch (e) {
    console.warn(`[beehiiv] no se pudo contar "${estado}": ${e.message}`);
    return { error: `No se pudo consultar beehiiv: ${e.message}` };
  }
}

// Cuántos suscriptores hay: los que reciben y los que están en el padrón.
//
// La diferencia importa. "Activos" son a los que les llega el mail; el total
// incluye los que se dieron de baja, los que rebotan y los que nunca
// confirmaron. Mostrar el total solo sería inflar el número contra uno mismo.
export async function contarSuscriptores() {
  const [activos, todos] = await Promise.all([contar("active"), contar("all")]);
  return {
    activos: activos.total ?? null,
    todos: todos.total ?? null,
    error: activos.error || todos.error || null,
  };
}

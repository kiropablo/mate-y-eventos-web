import { getEventosConEstado } from "../../../lib/agenda";
import { radiografia, radiografiaCSV } from "../../../lib/radiografia";

// La tabla con los números de la radiografía.
//
// Un dato que no se puede bajar y revisar es una afirmación, no una fuente.
// Por eso la página publica el CSV: sin esto, "el 52% del calendario cae en
// dos meses" es algo que hay que creernos.

export const revalidate = 3600;

export async function GET() {
  const { eventos, completa } = await getEventosConEstado();

  // Igual que la página: sin lectura entera no se sirven números. Y se
  // devuelve un error de verdad, no una tabla corta: un CSV al que le faltan
  // filas se abre igual en la planilla y nadie se entera.
  if (!completa || eventos.length === 0) {
    return new Response(
      "No se pudo leer la agenda completa, así que no se publican los números.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const r = radiografia(eventos);
  return new Response(radiografiaCSV(r), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mate-y-eventos-agenda-${r.hoy}.csv"`,
      "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
    },
  });
}

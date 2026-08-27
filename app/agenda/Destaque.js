// La marca de un evento destacado, con su declaración cuando el lugar se pagó.
//
// Está en un solo lugar porque el destaque aparece en cuatro listados —la tira
// de /agenda, la lista cronológica, «Esta semana» y los cortes por país, tipo,
// provincia y mes— y en tres de ellos salía una estrella sin decir nada. La
// página que vende el espacio promete, textual, que «el espacio se declara
// siempre», y describe lo contrario como «publicidad disfrazada de
// recomendación». Con una copia por listado, alcanza con olvidarse de una para
// que la promesa deje de ser cierta.
//
// La distinción importa: un destacado editorial lo elegimos nosotros y no se
// paga; uno contratado sí. Los dos llevan estrella, pero solo el segundo lleva
// el cartel.
export default function Destaque({ destacado, pago }) {
  if (!destacado) return null;
  return (
    <>
      <span
        className="ev-star"
        title={pago ? "Espacio contratado" : "Elegido por Mate y Eventos"}
      >
        ★{" "}
      </span>
      {pago ? <span className="ev-pago">Espacio contratado</span> : null}
    </>
  );
}

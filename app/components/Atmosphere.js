// Capas visuales globales fijas (un solo ambiente para todo el sitio).
// Puramente decorativas; el movimiento lo activa <Motion/>.
export default function Atmosphere() {
  return (
    <>
      <div className="pbar" id="pbar" aria-hidden="true" />
      <div className="ambient" aria-hidden="true" />
      <div className="cols" aria-hidden="true" />
      <div className="gnoise" aria-hidden="true" />
      <div className="cursor" id="cursor" aria-hidden="true" />
    </>
  );
}

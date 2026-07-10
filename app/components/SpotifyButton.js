// Botón de Spotify (verde + logo) para identificarlo al toque.
export default function SpotifyButton({
  href,
  children = "Escuchar en Spotify",
  className = "",
  style,
}) {
  return (
    <a
      className={`btn btn--spotify ${className}`.trim()}
      style={style}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.6-.12-.42.18-.78.6-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.54.66.24 1.08zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.38-1.32 9.78-.66 13.5 1.62.42.24.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.1 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.32-1.26 11.4-1.02 15.84 1.62.54.3.72 1.02.42 1.56-.3.48-1.02.66-1.62.36z" />
      </svg>
      {children}
    </a>
  );
}

Los subtítulos de cada transcripción, uno por episodio: {videoId}.json

Cada archivo es una lista de cortes:

  [
   { "titulo": "Qué lleva un rider técnico", "desde": 1840 },
   { "titulo": "El contra-rider y el mercado local", "desde": 7215 }
  ]

"desde" es la posición, en caracteres, dentro de content/transcripts/{videoId}.txt
donde arranca esa sección.

Están en un archivo aparte a propósito. La transcripción es la fuente citable
del episodio: es lo que se dijo, textual. Acá no se guarda texto, se guardan
posiciones. Así, una pasada automática no tiene dónde escribir una palabra
distinta a las que se dijeron, aunque quisiera.

Los escribe scripts/segmentar-transcripciones.mjs, que antes de guardar rearma
la transcripción completa a partir de los cortes y la compara con la original.
Si no coincide, descarta el episodio.

Un archivo con [] adentro significa "ya se revisó y no hace falta cortarlo".

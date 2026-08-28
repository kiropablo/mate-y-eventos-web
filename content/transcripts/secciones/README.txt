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

Un archivo con [] adentro significa "ya se revisó y no hace falta cortarlo":
la transcripción es demasiado corta para llevar subtítulos.

Los que se intentaron y no salieron NO llevan []. Van en sin-cortes.json, con
el motivo y cuántas veces se probó, y vuelven a la cola al día siguiente. La
diferencia importa: durante un tiempo las dos cosas se escribían igual, y
como la cola saltea todo id que ya tenga archivo, cinco episodios quedaron
sin subtítulos para siempre sin que nadie se enterara. Después de tres
intentos se deja de gastar llamadas y quedan anotados para mirarlos a mano.

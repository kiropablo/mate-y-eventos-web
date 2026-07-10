import fs from "fs";
import path from "path";

// Lee la transcripción de un episodio desde content/transcripts/{videoId}.txt
// Si no existe, devuelve null (la página simplemente no muestra la sección).
export function getTranscript(id) {
  try {
    const file = path.join(
      process.cwd(),
      "content",
      "transcripts",
      `${id}.txt`
    );
    const text = fs.readFileSync(file, "utf8").trim();
    return text || null;
  } catch {
    return null;
  }
}

// Los bots de IA que vale la pena registrar cuando pasan por el sitio.
//
// La lista sale de la documentacion oficial de cada empresa (agosto 2026).
// Cada entrada es [que buscar en el user-agent, nombre prolijo, familia].
// La familia dice PARA QUE vino: "entrenamiento" alimenta modelos futuros,
// "busqueda" indexa para citarnos en respuestas, "usuario" es una persona
// pidiendo esta pagina EN VIVO desde un asistente. Las tres son AI SEO
// funcionando, pero la de "usuario" es la mas valiosa: es trafico real.
//
// Google-Extended y Applebot-Extended no estan porque no existen como
// visitantes: son solo etiquetas de robots.txt, nunca aparecen en un request.
export const BOTS_IA = [
  // OpenAI — plataform.openai.com/docs/bots
  ["gptbot", "GPTBot", "entrenamiento"],
  ["oai-searchbot", "OAI-SearchBot", "busqueda"],
  ["chatgpt-user", "ChatGPT-User", "usuario"],
  // Anthropic — docs de Claude
  ["claudebot", "ClaudeBot", "entrenamiento"],
  ["claude-searchbot", "Claude-SearchBot", "busqueda"],
  ["claude-user", "Claude-User", "usuario"],
  // Perplexity — docs.perplexity.ai
  ["perplexitybot", "PerplexityBot", "busqueda"],
  ["perplexity-user", "Perplexity-User", "usuario"],
  // Meta — developers.facebook.com/docs/sharing/webmasters/web-crawlers
  ["meta-externalagent", "Meta-ExternalAgent", "entrenamiento"],
  ["meta-externalfetcher", "Meta-ExternalFetcher", "usuario"],
  ["meta-webindexer", "Meta-WebIndexer", "busqueda"],
  // Mistral — docs.mistral.ai/robots
  ["mistralai-training", "MistralAI-Training", "entrenamiento"],
  ["mistralai-index", "MistralAI-Index", "busqueda"],
  ["mistralai-user", "MistralAI-User", "usuario"],
  // Otros con presencia real
  ["amazonbot", "Amazonbot", "busqueda"],
  ["bytespider", "Bytespider", "entrenamiento"],
  ["duckassistbot", "DuckAssistBot", "busqueda"],
];

// Los buscadores clasicos tambien se anotan: sirven para comparar cuanto nos
// rastrea la IA contra cuanto nos rastrea Google.
export const BOTS_BUSCADORES = [
  ["googlebot", "Googlebot", "buscador"],
  ["bingbot", "Bingbot", "buscador"],
];

// El orden importa: "claude-searchbot" contiene "claude-user"? No, pero
// "chatgpt-user" y "gptbot" se pisan ("chatgpt-user" contiene "gptbot"?
// no: g-p-t-b-o-t no aparece en chatgpt-user). Igual, los mas especificos
// van primero para que un user-agent raro caiga en el nombre correcto.
const TODOS = [...BOTS_IA, ...BOTS_BUSCADORES].sort((a, b) => b[0].length - a[0].length);

export function detectarBot(userAgent) {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  for (const [aguja, nombre, familia] of TODOS) {
    if (ua.includes(aguja)) return { nombre, familia };
  }
  return null;
}

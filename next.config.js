/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Logos de eventos servidos desde los adjuntos de Airtable.
    // Next los optimiza y los cachea, así que dejan de depender de la
    // URL temporal de Airtable (que vence a las 2 horas).
    remotePatterns: [
      { protocol: "https", hostname: "v5.airtableusercontent.com" },
      { protocol: "https", hostname: "dl.airtable.com" },
    ],
  },
};
export default nextConfig;

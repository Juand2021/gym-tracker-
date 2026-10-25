/** Manifiesto de NutriVerse: al "Agregar a inicio" se abre como app aparte de Fuerza, en /comidas. */
export function GET() {
  return Response.json(
    {
      name: "NutriVerse",
      short_name: "NutriVerse",
      description: "Registra lo que comes hablando y mantén tu objetivo.",
      id: "/comidas",
      start_url: "/comidas",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#eef1f3",
      theme_color: "#eef1f3",
      icons: [
        { src: "/nutriverse/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/nutriverse/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/nutriverse/icon-180.png", sizes: "180x180", type: "image/png" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}

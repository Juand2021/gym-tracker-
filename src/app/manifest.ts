import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fuerza — Gym AI Tracker",
    short_name: "Fuerza",
    description:
      "Registra entrenos, peso corporal y obtén recomendaciones con IA.",
    start_url: "/",
    display: "standalone",
    background_color: "#070707",
    theme_color: "#070707",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

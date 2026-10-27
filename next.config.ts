import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // scripts/dev-local.mjs compila en otra carpeta para convivir con otro `next dev`.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  // Para abrir el servidor de desarrollo desde el iPhone en la misma red Wi-Fi (npm run dev:iphone).
  // Sin esto, Next bloquea los archivos de desarrollo pedidos desde otra IP y la página no se vuelve interactiva.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  // Sin el botón flotante de Next en desarrollo: tapaba la pestaña Inicio y la app se ve como la real.
  devIndicators: false,
};

export default nextConfig;

import { Outfit } from "next/font/google";

/** Fuente de NutriVerse (§3.3). Se exporta para usarla también en las hojas que van a document.body. */
export const nvFont = Outfit({ variable: "--font-nv", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

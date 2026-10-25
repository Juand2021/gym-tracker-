/** Normalización de texto en español (y nombres USDA en inglés) para buscar alimentos. */

/** Minúsculas, sin tildes, sin signos; "ñ" se conserva como "n". */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%½¼¾/.,\s-]/g, " ")
    .replace(/-|(?<!\d)\/|\/(?!\d)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set([
  // español
  "de", "del", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "e", "o", "u", "con", "en", "al", "a",
  "por", "para", "me", "mi", "mis", "lo", "le", "que", "se", "su", "sus", "tipo", "estilo", "como", "mas", "muy",
  // inglés (nombres USDA)
  "and", "or", "with", "from", "the", "of", "in", "nfs", "ns", "as", "to", "made", "type", "includes", "all",
]);

/** Plural → singular, simple y predecible (frijoles→frijol, papas→papa, huevos→huevo). */
export function stem(token: string): string {
  if (token.length <= 3 || /^\d/.test(token)) return token;
  if (token.endsWith("ces")) return token.slice(0, -3) + "z"; // maices → maiz
  if (/(ones|anes|ines|enes)$/.test(token)) return token.slice(0, -2); // patacones → patacon
  if (/[^aeiou]es$/.test(token) && !/(ses|tes|des|ves)$/.test(token)) return token.slice(0, -2); // frijoles → frijol
  if (token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

/** Tokens normalizados, sin palabras vacías, con plurales reducidos. */
export function tokenize(text: string): string[] {
  return normalize(text)
    .replace(/[.,%½¼¾]/g, " ")
    .split(" ")
    .filter((t) => t && !STOPWORDS.has(t))
    .map(stem);
}

/** Números escritos en español que la gente usa para cantidades. */
const NUMBER_WORDS: Record<string, number> = {
  un: 1, uno: 1, una: 1, medio: 0.5, media: 0.5, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7,
  ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, quince: 15, veinte: 20, par: 2, cuarto: 0.25,
};

/** Convierte "2", "1,5", "½", "media", "dos" en número; null si no es cantidad. */
export function parseQuantity(token: string): number | null {
  const frac = token.trim().match(/^(\d+)\/(\d+)$/);
  if (frac && Number(frac[2]) > 0) return Number(frac[1]) / Number(frac[2]);
  const t = normalize(token);
  if (t in NUMBER_WORDS) return NUMBER_WORDS[t];
  if (t === "½") return 0.5;
  if (t === "¼") return 0.25;
  if (t === "¾") return 0.75;
  const m = t.match(/^(\d+)(?:[.,](\d+))?$/);
  if (m) return Number(`${m[1]}.${m[2] ?? 0}`);
  return null;
}

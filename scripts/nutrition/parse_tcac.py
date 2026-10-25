"""Extrae la tabla de análisis proximal de la TCAC 2015 (ICBF) a JSON.

Uso: python -I scripts/nutrition/parse_tcac.py <tcac_2015.pdf> <salida.json> [tcac_2015.txt]
La tabla ocupa pares de páginas: la izquierda trae nombre, energía, humedad y
proteína; la derecha (misma altura de fila) trae lípidos, carbohidratos
disponibles, cenizas y fibra dietaria. Valores por 100 g de parte comestible.
"""
import json
import sys

import pymupdf


def num(s):
    try:
        return float(s.replace(",", "."))
    except ValueError:
        return None


def rows_of(page):
    rows = {}
    for x0, y0, x1, y1, text, *_ in page.get_text("words"):
        rows.setdefault(round(y0), []).append((x0, text))
    return rows


def pick(words, lo, hi):
    vals = [num(t) for x, t in words if lo <= x <= hi]
    vals = [v for v in vals if v is not None]
    return vals[0] if vals else None


def near(rows, y, tol=4):
    out = []
    for ry, ws in rows.items():
        if abs(ry - y) <= tol:
            out.extend(ws)
    return out


def parse(pdf_path):
    doc = pymupdf.open(pdf_path)
    foods = {}
    for pn in range(len(doc) - 1):
        left = doc[pn]
        if "proximal" not in left.get_text()[:400] or "Energ" not in left.get_text():
            continue
        right = doc[pn + 1]
        rt = right.get_text()
        if "Carbohidratos" not in rt or "pidos" not in rt:
            continue
        lrows = rows_of(left)
        rrows = rows_of(right)
        # filas de alimento = líneas con número de identificación y algún valor
        food_rows = []
        for y, ws in sorted(lrows.items()):
            ident = [t for x, t in ws if 85 <= x <= 100 and t.isdigit()]
            if ident and any(pick(ws, lo, hi) is not None for lo, hi in ((380, 395), (410, 425), (558, 575))):
                food_rows.append(y)
        # cada línea de la columna "Nombre" se asigna a la fila de alimento más cercana
        name_lines = {}
        for ry, ws in lrows.items():
            seg = [t for x, t in sorted(ws) if 215 <= x <= 355]
            if not seg or not food_rows:
                continue
            nearest = min(food_rows, key=lambda fy: abs(fy - ry))
            if abs(nearest - ry) <= 14:
                name_lines.setdefault(nearest, []).append((ry, " ".join(seg)))
        for y in food_rows:
            ws = lrows[y]
            ident = [t for x, t in ws if 85 <= x <= 100 and t.isdigit()]
            kcal = pick(ws, 380, 395)
            kj = pick(ws, 410, 425)
            protein = pick(ws, 558, 575)
            fid = int(ident[0])
            parts = [t for _, t in sorted(name_lines.get(y, []))]
            name = " ".join(parts).replace("- ", "").strip()
            group = " ".join(t for x, t in sorted(ws) if 110 <= x < 215).strip()
            r = near(rrows, y)
            food = {
                "id": f"TCAC-{fid}",
                "name": name,
                "group": group,
                "kcal": kcal,
                "kcal_source": "table" if kcal is not None else None,
                "water_g": pick(ws, 448, 460),
                "protein_g": protein,
                "fat_g": pick(r, 110, 130),
                "carb_g": pick(r, 222, 240),
                "ash_g": pick(r, 372, 390),
                "fiber_g": pick(r, 474, 495),
                "page": pn + 1,
            }
            if food["kcal"] is None:
                if kj is not None:
                    food["kcal"], food["kcal_source"] = round(kj / 4.184), "kj"
                elif None not in (food["protein_g"], food["fat_g"], food["carb_g"]):
                    food["kcal"] = round(4 * food["protein_g"] + 9 * food["fat_g"] + 4 * food["carb_g"])
                    food["kcal_source"] = "atwater"
            foods[fid] = food
    return [foods[k] for k in sorted(foods)]


def fix_accents(data, txt_path):
    """Algunas fuentes del PDF pierden tildes en PyMuPDF; se recuperan del
    texto UTF-8 de `pdftotext -enc UTF-8` usando el carácter dañado como comodín."""
    import re

    text = open(txt_path, encoding="utf-8").read()
    for food in data:
        for key in ("name", "group"):
            val = food[key]
            if "�" not in val:
                continue
            pattern = re.escape(val).replace("�", r"\w")
            m = re.search(pattern, text)
            if m:
                food[key] = m.group(0)


if __name__ == "__main__":
    data = parse(sys.argv[1])
    if len(sys.argv) > 3:
        fix_accents(data, sys.argv[3])
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print(len(data), "alimentos")

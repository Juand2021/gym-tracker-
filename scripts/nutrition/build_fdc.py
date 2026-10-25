"""Convierte los JSON de USDA FoodData Central a un formato compacto por 100 g.

Uso: python -I scripts/nutrition/build_fdc.py <carpeta_fdc> <salida.json>
Fuentes: Foundation Foods, SR Legacy y Survey (FNDDS). Licencia CC0.
"""
import json
import os
import sys

# Números de nutriente de FDC
N = {
    "kcal": ("208",),
    "kj": ("268",),
    "atwater_specific": ("958",),
    "atwater_general": ("957",),
    "protein_g": ("203",),
    "fat_g": ("204",),
    "carb_total_g": ("205",),
    "fiber_g": ("291",),
    "water_g": ("255",),
    "alcohol_g": ("221",),
}

# Categorías de SR Legacy que no aportan para este usuario
SKIP_CATEGORIES = {"Baby Foods", "American Indian/Alaska Native Foods"}


def nutrient_map(food):
    out = {}
    for fn in food.get("foodNutrients", []):
        num = str(fn.get("nutrient", {}).get("number", ""))
        amount = fn.get("amount")
        if amount is None:
            continue
        for key, nums in N.items():
            if num in nums and key not in out:
                out[key] = float(amount)
    return out


def energy(n):
    for key in ("kcal", "atwater_specific", "atwater_general"):
        if key in n:
            return n[key], key
    if "kj" in n:
        return n["kj"] / 4.184, "kj"
    if all(k in n for k in ("protein_g", "fat_g", "carb_total_g")):
        return 4 * n["protein_g"] + 9 * n["fat_g"] + 4 * n["carb_total_g"], "atwater_calc"
    return None, None


def portions(food):
    out = []
    for p in food.get("foodPortions", []):
        grams = p.get("gramWeight") or 0
        if grams <= 0:
            continue
        label = (p.get("portionDescription") or "").strip()
        if not label or label.lower() == "quantity not specified":
            amount = p.get("amount") or 1
            unit = (p.get("measureUnit") or {}).get("name") or ""
            modifier = p.get("modifier") or ""
            label = " ".join(str(x) for x in (amount, unit if unit != "undetermined" else "", modifier) if x).strip()
        out.append({"label_en": label, "grams": round(grams, 1)})
    return out[:8]


def convert(path, source, key):
    data = json.load(open(path, encoding="utf-8"))[key]
    out = []
    for food in data:
        if not isinstance(food, dict):
            continue
        category = (food.get("foodCategory") or {}).get("description") or (
            food.get("wweiaFoodCategory") or {}
        ).get("wweiaFoodCategoryDescription")
        if category in SKIP_CATEGORIES:
            continue
        n = nutrient_map(food)
        kcal, kcal_source = energy(n)
        if kcal is None or "protein_g" not in n or "fat_g" not in n:
            continue
        fiber = n.get("fiber_g", 0.0)
        carb_total = n.get("carb_total_g", 0.0)
        out.append(
            {
                "id": f"FDC-{food['fdcId']}",
                "source": source,
                "name_en": food["description"],
                "category_en": category,
                "kcal": round(kcal, 1),
                "kcal_source": kcal_source,
                "protein_g": round(n["protein_g"], 2),
                "fat_g": round(n["fat_g"], 2),
                # FDC reporta carbohidratos por diferencia (incluyen fibra);
                # se normaliza a carbohidratos disponibles como la TCAC.
                "carb_g": round(max(0.0, carb_total - fiber), 2),
                "fiber_g": round(fiber, 2),
                "water_g": round(n["water_g"], 2) if "water_g" in n else None,
                "alcohol_g": round(n.get("alcohol_g", 0.0), 2),
                "portions": portions(food),
            }
        )
    return out


if __name__ == "__main__":
    folder, dest = sys.argv[1], sys.argv[2]
    foods = []
    for fname, source, key in (
        ("FoodData_Central_foundation_food_json_2026-04-30.json", "FDC-Foundation", "FoundationFoods"),
        ("FoodData_Central_sr_legacy_food_json_2018-04.json", "FDC-SR", "SRLegacyFoods"),
        ("surveyDownload.json", "FDC-FNDDS", "SurveyFoods"),
    ):
        part = convert(os.path.join(folder, fname), source, key)
        print(source, len(part))
        foods.extend(part)
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(foods, f, ensure_ascii=False)
    print("total", len(foods))

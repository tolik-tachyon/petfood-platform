"""
Helpers for /optimize/recipe: nutrient name aliases (frontend ↔ dataset) and
fallback optimizers when HiGHS LP fails or brute-force grid is empty.
"""
from __future__ import annotations

import math
from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np
import pandas as pd
from scipy.optimize import minimize

# Frontend mockData shortcuts and merge_tab Standart names without nutrient rows.
INGREDIENT_ALIASES: Dict[str, str] = {
    "курица-мясо": "Курица — Мясо",
    "курица — мясо": "Курица — Мясо",
    "говядина": "Говядина — Грудинка",
    "индейка": "Индейка — Мясо",
    "морковь": "Морковь — Обыкновенный",
    "кабачок": "Кабачок — Обыкновенный",
    "тыква": "Тыква — Обыкновенный",
    "кукуруза": "Кукуруза — Обыкновенная",
    "рис": "Рис — Белый, Длиннозерный",
    "овсянка": "Овес — Обыкновенный",
    "яйцо": "Яйцо — Куринное",
    "вода": "Вода — Обыкновенный",
    "соль": "Соль — Поваренная, йодированная",
    "сахар": "Сахар — Белый, Гранулированный",
}


def build_standart_to_food_key_map(
    merge_tab_df,
    food_ingredients_df,
) -> Dict[str, str]:
    """Map Standart display names to food matrix keys."""
    mapping: Dict[str, str] = {}

    for _, row in merge_tab_df.iterrows():
        standart = row.get("Standart")
        translate = row.get("Translate")
        if pd.isna(standart) or pd.isna(translate):
            continue

        standart = str(standart).strip()
        candidates = food_ingredients_df[
            food_ingredients_df["Ингредиенты"] == str(translate).strip()
        ]["ингредиент и описание"].tolist()

        if candidates and standart not in mapping:
            mapping[standart] = candidates[0]

    return mapping


def resolve_ingredient_name(
    name: str,
    food_keys: set,
    standart_map: Dict[str, str],
) -> Optional[str]:
    s = name.strip()
    if not s:
        return None

    if s in food_keys:
        return s

    if s in standart_map and standart_map[s] in food_keys:
        return standart_map[s]

    alias_key = s.lower().replace("-", "—")
    alias_target = INGREDIENT_ALIASES.get(alias_key)
    if alias_target:
        if alias_target in food_keys:
            return alias_target
        if alias_target in standart_map and standart_map[alias_target] in food_keys:
            return standart_map[alias_target]

    prefix = f"{s} — "
    matches = sorted(k for k in food_keys if k.startswith(prefix))
    if matches:
        return matches[0]

    if s in standart_map:
        return standart_map[s]

    return None


def resolve_recipe_ingredients(
    names: List[str],
    food_keys: set,
    merge_tab_df,
    food_ingredients_df,
) -> Tuple[List[str], Dict[str, str], List[str]]:
    """
    Resolve ingredient display names to food matrix keys.
    Returns (resolved_names, original_to_resolved, missing_original_names).
    """
    standart_map = build_standart_to_food_key_map(merge_tab_df, food_ingredients_df)
    resolved: List[str] = []
    name_map: Dict[str, str] = {}
    missing: List[str] = []
    seen = set()

    for name in names:
        key = resolve_ingredient_name(name, food_keys, standart_map)
        if key and key in food_keys:
            name_map[name] = key
            if key not in seen:
                resolved.append(key)
                seen.add(key)
        else:
            missing.append(name)

    return resolved, name_map, missing


def remap_ingredient_ranges(
    ingredient_ranges: Iterable,
    name_map: Dict[str, str],
) -> Dict[str, Tuple[float, float]]:
    result: Dict[str, Tuple[float, float]] = {}
    for item in ingredient_ranges:
        resolved = name_map.get(item.ingredient, item.ingredient)
        result[resolved] = (item.min_percent, item.max_percent)
    return result


# Frontend (MaximizationOptions) uses English slugs; food matrix uses Russian keys.
NUTRIENT_SLUG_TO_RU: Dict[str, str] = {
    "moisture": "Влага",
    "protein": "Белки",
    "carbs": "Углеводы",
    "fats": "Жиры",
}


def resolve_maximize_nutrients(names: List[str], allowed: Iterable[str]) -> List[str]:
    allowed_set = set(allowed)
    out: List[str] = []
    seen = set()
    for raw in names or []:
        if raw is None:
            continue
        s = str(raw).strip()
        if not s:
            continue
        low = s.lower()
        ru = NUTRIENT_SLUG_TO_RU.get(low)
        if ru is None and s in allowed_set:
            ru = s
        if ru is None:
            for a in allowed_set:
                if a.lower() == low:
                    ru = a
                    break
        if ru is None or ru not in allowed_set:
            continue
        if ru not in seen:
            out.append(ru)
            seen.add(ru)
    return out or ["Влага", "Белки"]


def objective_vector(
    ingredient_names: List[str],
    food: Dict[str, Dict[str, float]],
    maximize_ru: List[str],
) -> List[float]:
    f: List[float] = []
    for ing in ingredient_names:
        f.append(
            -sum(food[ing].get(nutr, 0.0) for nutr in maximize_ru if nutr in food[ing])
        )
    if all(abs(v) < 1e-12 for v in f):
        return [-1e-9] * len(ingredient_names)
    return f


def _totals_major_four(
    x: np.ndarray,
    ingredient_names: List[str],
    food: Dict[str, Dict[str, float]],
    cols: List[str],
) -> Dict[str, float]:
    return {
        nutr: float(sum(x[i] * food[ingredient_names[i]][nutr] for i in range(len(x)))) * 100.0
        for nutr in cols
    }


def _nutrient_penalty(
    totals: Dict[str, float],
    cols: List[str],
    nutr_ranges: Dict[str, Tuple[float, float]],
) -> float:
    p = 0.0
    for nutr in cols:
        v = totals[nutr]
        mn, mx = nutr_ranges.get(nutr, (0.0, 100.0))
        if v < mn:
            p += (mn - v) ** 2
        elif v > mx:
            p += (v - mx) ** 2
    return p


def iter_bounded_percent_mixtures(
    lo_pct: List[float],
    hi_pct: List[float],
    target: int = 100,
    limit: int = 250_000,
) -> Iterable[Tuple[int, ...]]:
    lo_i = [max(0, math.ceil(float(l))) for l in lo_pct]
    hi_i = [min(100, math.floor(float(h))) for h in hi_pct]
    n = len(lo_i)
    if n == 0 or any(lo_i[i] > hi_i[i] for i in range(n)):
        return
    total_lo = sum(lo_i)
    total_hi = sum(hi_i)
    if target < total_lo or target > total_hi:
        return

    count = 0

    def dfs(i: int, rem: int, cur: List[int]) -> Iterable[Tuple[int, ...]]:
        nonlocal count
        if count >= limit:
            return
        if i == n:
            if rem == 0:
                count += 1
                yield tuple(cur)
            return
        sum_hi_rest = sum(hi_i[j] for j in range(i + 1, n))
        sum_lo_rest = sum(lo_i[j] for j in range(i + 1, n))
        vmin = max(lo_i[i], rem - sum_hi_rest)
        vmax = min(hi_i[i], rem - sum_lo_rest)
        if vmin > vmax:
            return
        for v in range(vmin, vmax + 1):
            if count >= limit:
                return
            yield from dfs(i + 1, rem - v, cur + [v])

    yield from dfs(0, target, [])


def brute_force_integer_percents(
    ingredient_names: List[str],
    ingr_ranges: List[Tuple[float, float]],
    food: Dict[str, Dict[str, float]],
    cols_to_divide: List[str],
    nutr_ranges: Dict[str, Tuple[float, float]],
    limit: int = 250_000,
) -> Optional[Tuple[Dict[str, float], Dict[str, float]]]:
    lo_pct = [a[0] for a in ingr_ranges]
    hi_pct = [a[1] for a in ingr_ranges]
    best: Optional[Tuple[Dict[str, float], Dict[str, float]]] = None
    min_penalty = float("inf")

    for combo in iter_bounded_percent_mixtures(lo_pct, hi_pct, 100, limit):
        values = {ingredient_names[i]: float(combo[i]) for i in range(len(combo))}
        totals = {nutr: 0.0 for nutr in cols_to_divide}
        for ingr in ingredient_names:
            for nutr in cols_to_divide:
                totals[nutr] += values[ingr] * food[ingr][nutr]

        penalty = _nutrient_penalty(totals, cols_to_divide, nutr_ranges)
        if penalty < min_penalty:
            min_penalty = penalty
            best = (values, totals)

    if best is None:
        return None
    return best


def soft_constraint_minimize(
    ingredient_names: List[str],
    ingr_range_dict: Dict[str, Tuple[float, float]],
    food: Dict[str, Dict[str, float]],
    cols_to_divide: List[str],
    nutr_ranges: Dict[str, Tuple[float, float]],
) -> Optional[Tuple[Dict[str, float], Dict[str, float]]]:
    n = len(ingredient_names)
    if n == 0:
        return None

    lo = np.array([ingr_range_dict.get(ing, (0.0, 100.0))[0] / 100.0 for ing in ingredient_names], dtype=float)
    hi = np.array([ingr_range_dict.get(ing, (0.0, 100.0))[1] / 100.0 for ing in ingredient_names], dtype=float)
    if np.any(lo > hi + 1e-9):
        return None

    x0 = np.clip((lo + hi) / 2.0, lo, hi)
    for _ in range(40):
        s = float(x0.sum())
        if s < 1e-12:
            x0 = np.clip(lo + (hi - lo) * 0.5, lo, hi)
            continue
        x0 = x0 / s
        x0 = np.clip(x0, lo, hi)
        if abs(float(x0.sum()) - 1.0) < 1e-7:
            break

    def objective(x: np.ndarray) -> float:
        x = np.asarray(x, dtype=float)
        tot = _totals_major_four(x, ingredient_names, food, cols_to_divide)
        return _nutrient_penalty(tot, cols_to_divide, nutr_ranges)

    cons = {"type": "eq", "fun": lambda x: float(np.sum(x)) - 1.0}
    bounds = [(float(lo[i]), float(hi[i])) for i in range(n)]

    r = minimize(
        objective,
        x0,
        method="SLSQP",
        bounds=bounds,
        constraints=cons,
        options={"maxiter": 1200, "ftol": 1e-10},
    )
    if not r.success:
        return None

    x = np.asarray(r.x, dtype=float)
    s = float(x.sum())
    if s < 1e-12:
        return None

    values = {ingredient_names[i]: round(float(x[i] * 100.0), 2) for i in range(n)}
    totals = {
        nutr: float(sum(x[i] * food[ingredient_names[i]][nutr] for i in range(n))) * 100.0
        for nutr in cols_to_divide
    }
    return values, totals

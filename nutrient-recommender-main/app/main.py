from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import asyncio
import pandas as pd
from scipy.optimize import linprog
from scipy.sparse import hstack, csr_matrix
import numpy as np
import itertools

from app.models import *
from app.utils import (
    load_data, build_ml_models, get_disorder_keywords,
    get_ingredient_categories
)
from app.recipe_optimize import (
    remap_ingredient_ranges,
    resolve_maximize_nutrients,
    resolve_recipe_ingredients,
    brute_force_integer_percents,
    soft_constraint_minimize,
)
from app.kcal_calculate import (
    kcal_calculate, protein_need_calc, get_other_nutrient_norms,
    size_category, age_type_category,
    age_category_types, size_types
)

app = FastAPI(
    title="Dog Food Calculator API",
    description="REST API for dog nutritional recommendations and recipe optimization",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load data on startup
@app.on_event("startup")
async def startup_event():
    """Load data and build models on startup"""
    load_data()
    build_ml_models()


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Dog Food Calculator API is running",
        "version": "1.0.0"
    }


@app.get("/breeds", response_model=BreedsListResponse, tags=["Breeds"])
async def get_breeds():
    """Get list of all available dog breeds"""
    try:
        _, disease_df, _, _ = load_data()
        breeds = sorted(disease_df["Breed"].unique().tolist())
        return BreedsListResponse(breeds=breeds, count=breeds.__len__())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/breeds/{breed}", response_model=BreedDetailsResponse, tags=["Breeds"])
async def get_breed_details(breed: str):
    """Get details about a specific breed"""
    try:
        _, disease_df, _, _ = load_data()
        breed_data = disease_df[disease_df["Breed"] == breed]

        if breed_data.empty:
            raise HTTPException(status_code=404, detail=f"Breed '{breed}' not found")

        min_weight = breed_data["min_weight"].values[0]
        max_weight = breed_data["max_weight"].values[0]
        avg_weight = (min_weight + max_weight) / 2
        diseases = breed_data["Disease"].unique().tolist()

        return BreedDetailsResponse(
            breed_info=BreedInfo(
                breed=breed,
                min_weight=float(min_weight),
                max_weight=float(max_weight),
                avg_weight=float(avg_weight),
                diseases=diseases
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate/calories", response_model=CalorieCalculationResponse, tags=["Calculations"])
async def calculate_calories(request: DogInfoRequest):
    """Calculate daily caloric requirements for a dog"""
    try:
        _, disease_df, _, _ = load_data()

        # Get breed info
        breed_data = disease_df[disease_df["Breed"] == request.breed]
        if breed_data.empty:
            raise HTTPException(status_code=404, detail=f"Breed '{request.breed}' not found")

        min_weight = breed_data["min_weight"].values[0]
        max_weight = breed_data["max_weight"].values[0]
        avg_weight = (min_weight + max_weight) / 2

        # Determine size and age categories
        size_categ = size_category(avg_weight)
        age_type_categ = age_type_category(size_categ, request.age, request.age_metric.value)

        # Get activity level based on age category
        activity_level = request.activity_level.value if request.activity_level else None
   
        # Calculate calories
        reproductive_status = request.reproductive_status.value if request.reproductive_status else None
        pregnancy_period = request.pregnancy_period.value if request.pregnancy_period else None
        lactation_week = request.lactation_week.value if request.lactation_week else None

        kcal, formula, page = kcal_calculate(
            reproductive_status=reproductive_status,
            berem_time=pregnancy_period,
            num_pup=request.num_puppies,
            L_time=lactation_week,
            age_type=age_type_categ,
            weight=request.weight,
            expected=avg_weight,
            activity_level=activity_level,
            user_breed=request.breed,
            age=request.age
        )

        return CalorieCalculationResponse(
            daily_kcal=max(0, kcal),
            formula=formula,
            reference_page=page,
            size_category=size_categ,
            age_category=age_type_categ
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate/protein", response_model=ProteinRequirementResponse, tags=["Calculations"])
async def calculate_protein(request: DogInfoRequest, target_kcal: float):
    """Calculate daily protein requirements"""
    try:
        _, disease_df, _, _ = load_data()

        breed_data = disease_df[disease_df["Breed"] == request.breed]
        if breed_data.empty:
            raise HTTPException(status_code=404, detail=f"Breed '{request.breed}' not found")

        min_weight = breed_data["min_weight"].values[0]
        max_weight = breed_data["max_weight"].values[0]
        avg_weight = (min_weight + max_weight) / 2

        size_categ = size_category(avg_weight)
        age_type_categ = age_type_category(size_categ, request.age, request.age_metric.value)

        reproductive_status = request.reproductive_status.value if request.reproductive_status else None

        protein_grams = protein_need_calc(
            kkal=target_kcal,
            age_type_categ=age_type_categ,
            w=request.weight,
            reproductive_status=reproductive_status,
            age=request.age,
            age_mesuare_type=request.age_metric.value
        )

        return ProteinRequirementResponse(daily_protein_grams=protein_grams)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate/nutrients", response_model=NutrientNormsResponse, tags=["Calculations"])
async def calculate_nutrient_norms(request: DogInfoRequest, target_kcal: float):
    """Calculate nutrient norms for a dog"""
    try:
        _, disease_df, _, _ = load_data()

        breed_data = disease_df[disease_df["Breed"] == request.breed]
        if breed_data.empty:
            raise HTTPException(status_code=404, detail=f"Breed '{request.breed}' not found")

        min_weight = breed_data["min_weight"].values[0]
        max_weight = breed_data["max_weight"].values[0]
        avg_weight = (min_weight + max_weight) / 2

        size_categ = size_category(avg_weight)
        age_type_categ = age_type_category(size_categ, request.age, request.age_metric.value)

        reproductive_status = request.reproductive_status.value if request.reproductive_status else None

        norms = get_other_nutrient_norms(
            kkal=target_kcal,
            age_type_categ=age_type_categ,
            w=request.weight,
            reproductive_status=reproductive_status
        )

        return NutrientNormsResponse(norms=norms)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommendations/disorder", response_model=DisorderRecommendationsResponse, tags=["Recommendations"])
async def get_disorder_recommendations(request: DisorderRequest):
    """Get ingredient and nutrient recommendations based on breed disorder"""
    try:
        _, disease_df, merge_tab_df, food_ingredients_df = load_data()
        models = build_ml_models()
        disorder_keywords = get_disorder_keywords()

        # Get breed and disorder info
        breed_data = disease_df[disease_df["Breed"] == request.breed]
        if breed_data.empty:
            raise HTTPException(status_code=404, detail=f"Breed '{request.breed}' not found")

        disorder_data = breed_data[breed_data["Disease"] == request.disorder]
        if disorder_data.empty:
            raise HTTPException(status_code=404, detail=f"Disorder '{request.disorder}' not found for breed")

        breed_size = disorder_data["breed_size_category"].values[0]
        disorder_type = disorder_data["Disorder"].values[0]

        # Build query vector
        keywords = disorder_keywords.get(disorder_type, request.disorder).lower()
        kw_tfidf = models['vectorizer'].transform([keywords])
        kw_reduced = models['svd'].transform(kw_tfidf)

        cat_vec = models['encoder'].transform([[breed_size, "Adult"]])
        kw_combined = hstack([csr_matrix(kw_reduced), cat_vec])

        # Predict nutrients
        nutrient_preds = {}
        for nut, model in models['nutrient_models'].items():
            pred = model.predict(kw_combined)[0]
            sc = models['scalers'].get(nut)
            if sc:
                pred = sc.inverse_transform([[pred]])[0][0]
            nutrient_preds[nut] = round(pred, 2)

        # Rank ingredients
        ing_scores = {
            ing: clf.decision_function(kw_combined)[0]
            for ing, clf in models['ingredient_models'].items()
        }
        top_ings = sorted(ing_scores.items(), key=lambda x: x[1], reverse=True)[:20]

        # Get ingredient categories
        categories = get_ingredient_categories(merge_tab_df, food_ingredients_df)
        dele = merge_tab_df[merge_tab_df["Standart"].isna()]["Ingredient"].tolist()

        # Select best ingredients by category
        prot = sorted([i for i in top_ings if i[0].title() in categories['proteins'] and i[0].title() not in dele],
                      key=lambda x: x[1], reverse=True)[:1]
        prot = [i.title() for i, _ in prot]
        prot = merge_tab_df[merge_tab_df["Ingredient"].isin(prot)]["Standart"].tolist()

        carb_cer = sorted(
            [i for i in top_ings if i[0].title() in categories['carbonates_cer'] and i[0].title() not in dele],
            key=lambda x: x[1], reverse=True)[:1]
        carb_cer = [i.title() for i, _ in carb_cer]
        carb_cer = merge_tab_df[merge_tab_df["Ingredient"].isin(carb_cer)]["Standart"].tolist()

        carb_veg = sorted(
            [i for i in top_ings if i[0].title() in categories['carbonates_veg'] and i[0].title() not in dele],
            key=lambda x: x[1], reverse=True)[:1]
        carb_veg = [i.title() for i, _ in carb_veg]
        carb_veg = merge_tab_df[merge_tab_df["Ingredient"].isin(carb_veg)]["Standart"].tolist()

        fat = sorted([i for i in top_ings if i[0].title() in categories['oils'] and i[0].title() not in dele],
                     key=lambda x: x[1], reverse=True)[:1]
        fat = [i.title() for i, _ in fat]
        fat = merge_tab_df[merge_tab_df["Ingredient"].isin(fat)]["Standart"].tolist()

        oth = sorted([i for i in top_ings[:20] if i[0].title() in categories['other'] and i[0].title() not in dele],
                     key=lambda x: x[1], reverse=True)[:1]
        if len(oth) > 0:
            oth = [i.title() for i, _ in oth]
            oth = merge_tab_df[merge_tab_df["Ingredient"].isin(oth)]["Standart"].tolist()
        else:
            oth = []

        ingredients_finish = list(
            set(prot) | set(carb_cer) | set(carb_veg) | set(fat) | set(oth) | set(categories['water']))
        ingredients_finish = [i for i in ingredients_finish if i]

        # Format top ingredients with scores
        top_ingredients_formatted = []
        for ing, score in top_ings[:10]:
            category = "Unknown"
            if ing.title() in categories['proteins']:
                category = "Protein"
            elif ing.title() in categories['oils']:
                category = "Fat"
            elif ing.title() in categories['carbonates_cer']:
                category = "Carbohydrate (Cereal)"
            elif ing.title() in categories['carbonates_veg']:
                category = "Carbohydrate (Vegetable)"
            elif ing.title() in categories['other']:
                category = "Other"

            top_ingredients_formatted.append(
                IngredientRecommendation(
                    ingredient=ing.title(),
                    score=float(score),
                    category=category
                )
            )

        return DisorderRecommendationsResponse(
            disorder=request.disorder,
            disorder_type=disorder_type,
            breed_size=breed_size,
            recommended_ingredients=ingredients_finish,
            top_ingredients_with_scores=top_ingredients_formatted,
            predicted_nutrients=nutrient_preds
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _optimize_recipe_impl(request: OptimizeRecipeRequest) -> OptimizedRecipeResponse:
    """Optimize food recipe composition based on constraints (CPU-bound)."""
    try:
        _, disease_df, merge_tab_df, food_ingredients_df = load_data()

        breed_data = disease_df[disease_df["Breed"] == request.breed]
        if breed_data.empty:
            raise HTTPException(status_code=404, detail=f"Breed '{request.breed}' not found")

        min_weight = breed_data["min_weight"].values[0]
        max_weight = breed_data["max_weight"].values[0]
        avg_weight = (min_weight + max_weight) / 2

        size_categ = size_category(avg_weight)
        age_type_categ = age_type_category(size_categ, request.age, "years")

        reproductive_status = request.reproductive_status.value if request.reproductive_status else None

        norms = get_other_nutrient_norms(
            kkal=request.target_kcal,
            age_type_categ=age_type_categ,
            w=request.weight,
            reproductive_status=reproductive_status
        )

        # Prepare nutrient columns
        cols_to_divide = ['Влага', 'Белки', 'Углеводы', 'Жиры']
        other_nutrients_1 = ["Зола, г", "Клетчатка, г", "Холестерин, мг", "Сахар общее, г"]
        other_nutrients_2 = ["Холин, мг", "Селен, мкг", "Йод, мкг", "Пантотеновая кислота, мг",
                             "Линолевая кислота, г", "Фолиевая кислота, мкг",
                             "Альфа-линоленовая кислота, г", "Арахидоновая кислота, г",
                             "ЭПК (50-60%) + ДГК (40-50%), г"]
        major_minerals = ["Кальций, мг", "Медь, мг", "Железо, мг", "Магний, мг", "Фосфор, мг",
                          "Калий, мг", "Натрий, мг", "Цинк, мг", "Марганец, мг"]
        vitamins = ["Витамин A, мкг", "Витамин E, мг", "Витамин Д, мкг",
                    "Витамин В1 (тиамин), мг", "Витамин В2 (Рибофлавин), мг",
                    "Витамин В3 (Ниацин), мг", "Витамин В6, мг", "Витамин В12, мкг"]

        # Create food dict
        food = food_ingredients_df.set_index("ингредиент и описание")[
            cols_to_divide + other_nutrients_1 + other_nutrients_2 + major_minerals + vitamins
            ].to_dict(orient='index')

        food_keys = set(food.keys())
        ingredient_names, ingredient_name_map, missing_ingredients = resolve_recipe_ingredients(
            request.ingredients,
            food_keys,
            merge_tab_df,
            food_ingredients_df,
        )

        if missing_ingredients:
            missing_list = ", ".join(f"«{name}»" for name in missing_ingredients)
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Для этих ингредиентов нет данных о составе: {missing_list}. "
                    "Уберите их из списка или замените на другие из рекомендаций."
                ),
            )

        if not ingredient_names:
            raise HTTPException(
                status_code=400,
                detail="Выберите хотя бы один ингредиент с известным составом.",
            )

        ingr_range_dict = remap_ingredient_ranges(request.ingredient_ranges, ingredient_name_map)
        nutr_range_dict = {nr.nutrient: (nr.min_value, nr.max_value) for nr in request.nutrient_ranges}
        maximize_nutrients = resolve_maximize_nutrients(request.maximize_nutrients, cols_to_divide)

        # Build LP problem
        ingr_ranges = [ingr_range_dict.get(ing, (0, 100)) for ing in ingredient_names]
        nutr_ranges = nutr_range_dict

        A = [
            [food[ing][nutr] if val > 0 else -food[ing][nutr]
             for ing in ingredient_names]
            for nutr in nutr_ranges
            for val in (-nutr_ranges[nutr][0] / 100, nutr_ranges[nutr][1] / 100)
        ]
        b = [
            val / 100 for nutr in nutr_ranges
            for val in (-nutr_ranges[nutr][0], nutr_ranges[nutr][1])
        ]

        A_eq = [[1 for _ in ingredient_names]]
        b_eq = [1.0]
        bounds = [(low / 100, high / 100) for (low, high) in ingr_ranges]

        # Objective function
        f = [-sum(food[i][nutr] for nutr in maximize_nutrients if nutr in food[i])
             for i in ingredient_names]

        # Try linear programming
        res = linprog(f, A_ub=A, b_ub=b, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method="highs")

        if res.success:
            # Success - format response
            result = {name: round(val * 100, 2) for name, val in zip(ingredient_names, res.x)}

            nutrients_100g = {
                nutr: round(sum(res.x[i] * food[name][nutr] for i, name in enumerate(ingredient_names)) * 100, 2)
                for nutr in cols_to_divide
            }

            energy_100g = (3.5 * nutrients_100g["Белки"] +
                           8.5 * nutrients_100g["Жиры"] +
                           3.5 * nutrients_100g["Углеводы"])

            needed_feed_g = (request.target_kcal * 100) / energy_100g

            ingredients_required = {
                name: round((weight * needed_feed_g / 100), 2)
                for name, weight in result.items()
            }

            all_nutrients = cols_to_divide + other_nutrients_1 + other_nutrients_2 + major_minerals + vitamins
            count_nutr_cont_all = {
                nutr: round(sum(amount * food[ingredient][nutr] for ingredient, amount in ingredients_required.items()),
                            2)
                for nutr in all_nutrients
            }

            nutrient_deficiencies = {}
            for nutrient_name, required_amount in count_nutr_cont_all.items():
                fixed_nutrient_name = nutrient_name.split(",")[0]
                measure = nutrient_name.split(",")[1] if nutrient_name.split(",").__len__() > 1 else ""
                actual_amount = norms.get(fixed_nutrient_name, 0)
                deficit = required_amount - actual_amount
                nutrient_deficiencies[fixed_nutrient_name] = f"{round(abs(deficit), 2)}{measure}"
            composition = [RecipeComposition(ingredient=k, grams_per_100g=v) for k, v in result.items()]

            nutritional_100g = [
                NutritionalValue(nutrient=k, value_per_100g=v, unit="г")
                for k, v in nutrients_100g.items()
            ]

            nutritional_total = [
                NutritionalValue(
                    nutrient=k.split(",")[0],
                    value_per_100g=v,
                    unit=k.split(",")[-1].strip() if "," in k else "г"
                )
                for k, v in count_nutr_cont_all.items()
            ]

            return OptimizedRecipeResponse(
                success=True,
                composition=composition,
                nutritional_value_per_100g=nutritional_100g,
                energy_per_100g=round(energy_100g, 2),
                total_feed_grams=round(needed_feed_g, 2),
                ingredients_required=ingredients_required,
                nutritional_value_total=nutritional_total,
                nutrient_deficiencies=nutrient_deficiencies,
                method="optimization"
            )
        else:
            fallback_method = "soft_constraint"
            best_recipe = soft_constraint_minimize(
                ingredient_names,
                ingr_range_dict,
                food,
                cols_to_divide,
                nutr_range_dict,
            )

            if best_recipe is None:
                fallback_method = "brute_force"
                best_recipe = brute_force_integer_percents(
                    ingredient_names,
                    ingr_ranges,
                    food,
                    cols_to_divide,
                    nutr_range_dict,
                )

            if best_recipe is None:
                raise HTTPException(status_code=400, detail="Could not find valid recipe composition")

            values, totals = best_recipe

            energy_100g = (3.5 * totals["Белки"] +
                           8.5 * totals["Жиры"] +
                           3.5 * totals["Углеводы"])

            needed_feed_g = (request.target_kcal * 100) / energy_100g

            ingredients_required = {
                name: round((weight * needed_feed_g / 100), 2)
                for name, weight in values.items()
            }

            all_nutrients = cols_to_divide + other_nutrients_1 + other_nutrients_2 + major_minerals + vitamins
            count_nutr_cont_all = {
                nutr: round(sum(amount * food[ingredient][nutr] for ingredient, amount in ingredients_required.items()),
                            2)
                for nutr in all_nutrients
            }

            nutrient_deficiencies = {}
            if hasattr(request, 'nutrient_norms') and request.nutrient_norms:
                for nutrient_name, required_amount in request.nutrient_norms.items():
                    actual_amount = count_nutr_cont_all.get(nutrient_name, 0)
                    deficit = required_amount - actual_amount
                    if deficit > 0:
                        nutrient_deficiencies[nutrient_name] = round(deficit, 2)

            composition = [RecipeComposition(ingredient=k, grams_per_100g=v) for k, v in values.items()]

            nutritional_100g = [
                NutritionalValue(nutrient=k, value_per_100g=round(v, 2), unit="г")
                for k, v in totals.items()
            ]

            nutritional_total = [
                NutritionalValue(
                    nutrient=k.split(",")[0],
                    value_per_100g=v,
                    unit=k.split(",")[-1].strip() if "," in k else "г"
                )
                for k, v in count_nutr_cont_all.items()
            ]

            return OptimizedRecipeResponse(
                success=True,
                composition=composition,
                nutritional_value_per_100g=nutritional_100g,
                energy_per_100g=round(energy_100g, 2),
                total_feed_grams=round(needed_feed_g, 2),
                ingredients_required=ingredients_required,
                nutritional_value_total=nutritional_total,
                nutrient_deficiencies=nutrient_deficiencies,
                method=fallback_method
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/optimize/recipe", response_model=OptimizedRecipeResponse, tags=["Recipe Optimization"])
async def optimize_recipe(request: OptimizeRecipeRequest):
    """Run recipe optimization without blocking other API requests."""
    try:
        return await asyncio.to_thread(_optimize_recipe_impl, request)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
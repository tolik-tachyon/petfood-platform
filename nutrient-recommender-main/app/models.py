from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict
from enum import Enum


# Enums for categorical data
class GenderType(str, Enum):
    MALE = "male"
    FEMALE = "female"


class AgeMetricType(str, Enum):
    YEARS = "years"
    MONTHS = "months"


class ReproductiveStatus(str, Enum):
    NONE = "none"
    PREGNANCY = "pregnancy"
    LACTATION = "lactation"


class PregnancyPeriod(str, Enum):
    FIRST_4_WEEKS = "first_4_weeks"
    LAST_5_WEEKS = "last_5_weeks"


class LactationWeek(str, Enum):
    WEEK_1 = "week_1"
    WEEK_2 = "week_2"
    WEEK_3 = "week_3"
    WEEK_4 = "week_4"


class ActivityLevel(str, Enum):
    PASSIVE = "passive"  # < 1 hour/day
    LOW = "low"  # 1-3 hours/day, low intensity
    MODERATE = "moderate"  # 1-3 hours/day, high intensity
    ACTIVE = "active"  # 3-6 hours/day, working dogs
    EXTREME = "extreme"  # Racing, extreme conditions
    OBESITY_PRONE = "obesity_prone"  # Prone to obesity


class SizeCategory(str, Enum):
    SMALL = "small"  # <= 10 kg
    MEDIUM = "medium"  # 10-25 kg
    LARGE = "large"  # 25-40 kg
    EXTRA_LARGE = "extra_large"  # > 40 kg


class AgeCategory(str, Enum):
    PUPPY = "puppy"
    ADULT = "adult"
    SENIOR = "senior"


# Request Models
class DogInfoRequest(BaseModel):
    weight: float = Field(..., gt=0, description="Dog weight in kg")
    age: int = Field(..., ge=0, description="Dog age")
    age_metric: AgeMetricType = Field(..., description="Age measurement unit")
    gender: GenderType = Field(..., description="Dog gender")
    breed: str = Field(..., description="Dog breed name")
    reproductive_status: Optional[ReproductiveStatus] = Field(None, description="Reproductive status (female only)")
    pregnancy_period: Optional[PregnancyPeriod] = Field(None, description="Pregnancy period (if pregnant)")
    lactation_week: Optional[LactationWeek] = Field(None, description="Lactation week (if lactating)")
    num_puppies: Optional[int] = Field(None, ge=0, description="Number of puppies (if lactating)")
    activity_level: Optional[ActivityLevel] = Field(None, description="Activity level")


    @validator('reproductive_status', 'pregnancy_period', 'lactation_week', 'num_puppies')
    def check_female_only(cls, v, values):
        if v is not None and values.get('gender') != GenderType.FEMALE:
            raise ValueError("Reproductive parameters are only valid for female dogs")
        return v

    @validator('pregnancy_period')
    def check_pregnancy(cls, v, values):
        if v is not None and values.get('reproductive_status') != ReproductiveStatus.PREGNANCY:
            raise ValueError("Pregnancy period is only valid when reproductive_status is 'pregnancy'")
        return v

    @validator('lactation_week', 'num_puppies')
    def check_lactation(cls, v, values):
        if v is not None and values.get('reproductive_status') != ReproductiveStatus.LACTATION:
            raise ValueError("Lactation parameters are only valid when reproductive_status is 'lactation'")
        return v


class DisorderRequest(BaseModel):
    breed: str = Field(..., description="Dog breed name")
    disorder: str = Field(..., description="Disorder/disease name")


class IngredientRange(BaseModel):
    ingredient: str = Field(..., description="Ingredient name")
    min_percent: float = Field(..., ge=0, le=100, description="Minimum percentage in recipe")
    max_percent: float = Field(..., ge=0, le=100, description="Maximum percentage in recipe")


class NutrientRange(BaseModel):
    nutrient: str = Field(..., description="Nutrient name")
    min_value: float = Field(..., ge=0, le=100, description="Minimum value per 100g")
    max_value: float = Field(..., ge=0, le=100, description="Maximum value per 100g")


class OptimizeRecipeRequest(BaseModel):
    weight: float = Field(..., gt=0, description="Dog weight in kg")
    age: int = Field(..., ge=0, description="Dog age")
    breed: str = Field(..., description="Dog breed name")
    reproductive_status: Optional[ReproductiveStatus] = Field(None, description="Reproductive status (female only)")
    ingredients: List[str] = Field(..., min_items=1, description="List of ingredient names")
    ingredient_ranges: List[IngredientRange] = Field(..., description="Constraints for each ingredient")
    nutrient_ranges: List[NutrientRange] = Field(..., description="Nutritional constraints")
    maximize_nutrients: List[str] = Field(default=['moisture', 'protein'], description="Nutrients to maximize")
    target_kcal: float = Field(..., gt=0, description="Target daily caloric intake")


# Response Models
class CalorieCalculationResponse(BaseModel):
    daily_kcal: float = Field(..., description="Daily caloric requirement (kcal)")
    formula: str = Field(..., description="Calculation formula (LaTeX format)")
    reference_page: str = Field(..., description="Reference page from FEDIAF guidelines")
    size_category: SizeCategory = Field(..., description="Size category based on breed")
    age_category: AgeCategory = Field(..., description="Age category")


class ProteinRequirementResponse(BaseModel):
    daily_protein_grams: float = Field(..., description="Daily protein requirement (grams)")


class NutrientNorm(BaseModel):
    nutrient: str = Field(..., description="Nutrient name")
    value: float = Field(..., description="Required amount")
    unit: str = Field(..., description="Unit of measurement")


class NutrientNormsResponse(BaseModel):
    norms: Dict[str, float] = Field(..., description="List of nutrient requirements")


class IngredientRecommendation(BaseModel):
    ingredient: str = Field(..., description="Ingredient name")
    score: float = Field(..., description="Recommendation score (0-1)")
    category: str = Field(..., description="Ingredient category")


class DisorderRecommendationsResponse(BaseModel):
    disorder: str = Field(..., description="Disorder name")
    disorder_type: str = Field(..., description="Disorder category")
    breed_size: str = Field(..., description="Breed size category")
    recommended_ingredients: List[str] = Field(..., description="Top recommended ingredients")
    top_ingredients_with_scores: List[IngredientRecommendation] = Field(..., description="Detailed ingredient scores")
    predicted_nutrients: Dict[str, float] = Field(..., description="Predicted optimal nutrient levels")


class RecipeIngredient(BaseModel):
    ingredient: str = Field(..., description="Ingredient name")
    grams_per_100g: float = Field(..., description="Grams per 100g of recipe")


class NutritionalValue(BaseModel):
    nutrient: str = Field(..., description="Nutrient name")
    value_per_100g: float = Field(..., description="Amount per 100g")
    unit: str = Field(..., description="Unit of measurement")


class RecipeComposition(BaseModel):
    ingredient: str = Field(..., description="Ingredient name")
    grams_per_100g: float = Field(..., description="Grams per 100g of recipe")


class OptimizedRecipeResponse(BaseModel):
    success: bool = Field(..., description="Whether optimization succeeded")
    composition: List[RecipeComposition] = Field(..., description="Recipe composition per 100g")
    nutritional_value_per_100g: List[NutritionalValue] = Field(..., description="Nutrients per 100g")
    energy_per_100g: float = Field(..., description="Energy content (kcal/100g)")
    total_feed_grams: float = Field(..., description="Total feed needed for target calories")
    ingredients_required: Dict[str, float] = Field(..., description="Actual ingredient amounts in grams")
    nutritional_value_total: List[NutritionalValue] = Field(..., description="Total nutrients in daily portion")
    nutrient_deficiencies: Dict[str, str] = Field(..., description="Nutrients below requirements")
    method: str = Field(..., description="Optimization method used (linear_programming or brute_force)")


class BreedInfo(BaseModel):
    breed: str = Field(..., description="Breed name")
    min_weight: float = Field(..., description="Minimum breed weight (kg)")
    max_weight: float = Field(..., description="Maximum breed weight (kg)")
    avg_weight: float = Field(..., description="Average breed weight (kg)")
    diseases: List[str] = Field(..., description="Common breed-specific diseases")


class BreedsListResponse(BaseModel):
    count: int = Field(..., description="Total number of breeds")
    breeds: List[str] = Field(..., description="List of all available breeds")


class BreedDetailsResponse(BaseModel):
    breed_info: BreedInfo = Field(..., description="Detailed breed information")


class HealthResponse(BaseModel):
    status: str = Field(..., description="API health status")
    message: str = Field(..., description="Status message")
    version: str = Field(..., description="API version")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    code: Optional[str] = Field(None, description="Error code for client handling")
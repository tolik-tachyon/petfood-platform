import type { OptimizationResult } from '../../context/RequestContext';

export const CHART_COLORS = ['#4A90E2', '#7FDB6A', '#FF9F5A', '#E74C3C', '#9B59B6'];

export type BalanceBarItem = {
  mineral?: string;
  vitamin?: string;
  acid?: string;
  currentPercent: number;
  normalPercent: number;
  currentValue: number;
  normalValue: number;
  percentage: string;
  unit: string;
};

export type RecommendationChartData = {
  compositionData: Array<{ name: string; value: number }>;
  compositionTableData: Array<{ ingredient: string; percentage: number; grams: number }>;
  nutritionData: Array<{ name: string; value: number }>;
  macroMineralsData: BalanceBarItem[];
  traceMineralsData: BalanceBarItem[];
  vitaminsData: BalanceBarItem[];
  fattyAcidsData: BalanceBarItem[];
};

const categorizeNutrient = (nutrientName: string): string => {
  const name = nutrientName.toLowerCase();

  if (['кальций', 'фосфор', 'магний', 'калий', 'натрий'].some((m) => name.includes(m))) {
    return 'macrominerals';
  }
  if (['железо', 'цинк', 'медь', 'марганец', 'селен', 'йод'].some((m) => name.includes(m))) {
    return 'traceMinerals';
  }
  if (
    name.includes('витамин') ||
    name.includes('холин') ||
    name === 'пантотеновая кислота' ||
    name === 'фолиевая кислота'
  ) {
    return 'vitamins';
  }
  if (name.includes('кислота') && !name.includes('пантотеновая') && !name.includes('фолиевая')) {
    return 'fattyAcids';
  }
  return 'other';
};

const createNutrientData = (
  optimizationResult: OptimizationResult,
  nutrientList: string[],
  nameKey: 'mineral' | 'vitamin' | 'acid'
): BalanceBarItem[] =>
  nutrientList.map((nutrient) => {
    const nutritionItem = optimizationResult.nutritional_value_total.find(
      (item) => item.nutrient === nutrient
    );
    const current = nutritionItem ? parseFloat(nutritionItem.value_per_100g.toFixed(2)) : 0;
    const deficiencyStr = optimizationResult.nutrient_deficiencies[nutrient];
    const normalValue = deficiencyStr ? parseFloat(deficiencyStr) : 0;
    const percentage = normalValue > 0 ? Math.round((current / normalValue) * 100) : 0;
    const unit = nutritionItem?.unit || 'мг';
    const cleanName = nutrient.replace(/\s*\([^)]*\)/g, '');

    return {
      [nameKey]: cleanName,
      currentPercent: percentage,
      normalPercent: 100,
      currentValue: current,
      normalValue,
      percentage: `${percentage}%`,
      unit,
    } as BalanceBarItem;
  });

export const buildRecommendationChartData = (
  optimizationResult: OptimizationResult
): RecommendationChartData => {
  const compositionData = optimizationResult.composition
    .filter((item) => item.grams_per_100g > 0)
    .map((item) => ({
      name: item.ingredient,
      value: parseFloat(item.grams_per_100g.toFixed(2)),
    }));

  const compositionTableData = optimizationResult.composition
    .filter((item) => item.grams_per_100g > 0)
    .map((item) => ({
      ingredient: item.ingredient,
      percentage: item.grams_per_100g,
      grams: parseFloat(((item.grams_per_100g / 100) * optimizationResult.total_feed_grams).toFixed(2)),
    }));

  const nutritionData = optimizationResult.nutritional_value_per_100g.map((item) => ({
    name: item.nutrient,
    value: parseFloat(item.value_per_100g.toFixed(2)),
  }));

  const categorized = {
    macrominerals: [] as string[],
    traceMinerals: [] as string[],
    vitamins: [] as string[],
    fattyAcids: [] as string[],
    other: [] as string[],
  };

  Object.keys(optimizationResult.nutrient_deficiencies).forEach((nutrient) => {
    const category = categorizeNutrient(nutrient) as keyof typeof categorized;
    categorized[category].push(nutrient);
  });

  return {
    compositionData,
    compositionTableData,
    nutritionData,
    macroMineralsData: createNutrientData(optimizationResult, categorized.macrominerals, 'mineral'),
    traceMineralsData: createNutrientData(optimizationResult, categorized.traceMinerals, 'mineral'),
    vitaminsData: createNutrientData(optimizationResult, categorized.vitamins, 'vitamin'),
    fattyAcidsData: createNutrientData(optimizationResult, categorized.fattyAcids, 'acid'),
  };
};

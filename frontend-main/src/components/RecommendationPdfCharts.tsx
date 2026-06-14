import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { OptimizationResult } from '../../context/RequestContext';
import { buildRecommendationChartData, CHART_COLORS, type BalanceBarItem } from '../utils/recommendationChartData';
import styles from '../styles/VetRecommendationView.module.css';

type Props = {
  optimizationResult: OptimizationResult;
};

const CustomBarLabel = (props: { x?: number; y?: number; width?: number; value?: string }) => {
  const { x = 0, y = 0, width = 0, value } = props;
  return (
    <text x={x + width / 2} y={y - 8} fill="#666" textAnchor="middle" fontSize="13" fontWeight="600">
      {value}
    </text>
  );
};

type BalanceChartProps = {
  title: string;
  chartKey: string;
  data: BalanceBarItem[];
  dataKey: 'mineral' | 'vitamin' | 'acid';
  currentColor: string;
  height: number;
  xHeight?: number;
  tickFontSize?: number;
};

const BalanceChart = ({
  title,
  chartKey,
  data,
  dataKey,
  currentColor,
  height,
  xHeight = 80,
  tickFontSize = 12,
}: BalanceChartProps) => {
  if (data.length === 0) return null;

  return (
    <div className={styles.balanceChart} data-pdf-chart={chartKey}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 50, right: 30, bottom: xHeight, left: 20 }} isAnimationActive={false}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={dataKey}
            angle={-45}
            textAnchor="end"
            height={xHeight}
            interval={0}
            tick={{ fontSize: tickFontSize }}
          />
          <YAxis label={{ angle: -90, position: 'insideLeft', style: { fontSize: 13 } }} tick={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ paddingTop: '0px' }} />
          <Bar dataKey="normalPercent" fill="#9E9E9E" name="Норма" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="currentPercent" fill={currentColor} name="Текущее" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            <LabelList dataKey="percentage" content={<CustomBarLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RecommendationPdfCharts = ({ optimizationResult }: Props) => {
  const {
    compositionData,
    compositionTableData,
    nutritionData,
    macroMineralsData,
    traceMineralsData,
    vitaminsData,
    fattyAcidsData,
  } = buildRecommendationChartData(optimizationResult);

  return (
    <div className={styles.pdfChartsHost}>
      {compositionData.length > 0 && (
        <div className={styles.chartSection}>
          <div className={styles.chartWithTable} data-pdf-chart="composition">
            <div className={styles.pieChartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    isAnimationActive={false}
                    label={(entry) => `${entry.value}%`}
                  >
                    {compositionData.map((entry, index) => (
                      <Cell key={`composition-${entry.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.compositionTable}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ингредиенты</th>
                    <th>%</th>
                    <th>грамм</th>
                  </tr>
                </thead>
                <tbody>
                  {compositionTableData.map((item, index) => (
                    <tr key={`row-${item.ingredient}`}>
                      <td>
                        <span
                          className={styles.colorIndicator}
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        {item.ingredient}
                      </td>
                      <td>{item.percentage}%</td>
                      <td>{item.grams} г.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {nutritionData.length > 0 && (
        <div className={styles.chartSection}>
          <div className={styles.nutritionContent} data-pdf-chart="nutrition">
            <div className={styles.pieChartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={nutritionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    isAnimationActive={false}
                    label={(entry) => `${entry.value} г`}
                  >
                    {nutritionData.map((entry, index) => (
                      <Cell key={`nutrition-${entry.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.nutritionDetails}>
              <h3 className={styles.nutritionTitle}>Питательная ценность на 100 г:</h3>
              <ul className={styles.nutritionList}>
                {optimizationResult.nutritional_value_per_100g.map((item, index) => (
                  <li key={`nutrient-${item.nutrient}`} className={styles.nutritionItem}>
                    <span
                      className={styles.colorIndicator}
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className={styles.nutrientName}>{item.nutrient}</span>
                    <span className={styles.nutrientValue}>
                      {item.value_per_100g.toFixed(2)} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
              <p className={styles.energyValue}>
                Энергетическая ценность: {optimizationResult.energy_per_100g.toFixed(2)} ккал
              </p>
            </div>
          </div>
        </div>
      )}

      <BalanceChart
        title="Баланс макроминералов"
        chartKey="macro-minerals"
        data={macroMineralsData}
        dataKey="mineral"
        currentColor="#4A90E2"
        height={500}
      />
      <BalanceChart
        title="Баланс микроэлементов"
        chartKey="trace-minerals"
        data={traceMineralsData}
        dataKey="mineral"
        currentColor="#7FDB6A"
        height={500}
      />
      <BalanceChart
        title="Баланс витаминов"
        chartKey="vitamins"
        data={vitaminsData}
        dataKey="vitamin"
        currentColor="#9B59B6"
        height={600}
      />
      <BalanceChart
        title="Баланс жирных кислот"
        chartKey="fatty-acids"
        data={fattyAcidsData}
        dataKey="acid"
        currentColor="#FF9F5A"
        height={600}
        xHeight={100}
        tickFontSize={11}
      />
    </div>
  );
};

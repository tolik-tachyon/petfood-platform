 import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiClient } from '../utils/apiClient';
import styles from '../styles/DigestionAnalysis.module.css';

type ProteinPoint = {
  t: number;
  s: number;
  d: number;
};

type FatPoint = {
  t: number;
  l: number;
  e: number;
  d: number;
};

type CarbPoint = {
  t: number;
  s: number;
  m: number;
  g: number;
};

type ProteinData = {
  s0: number;
  vmax: number;
  km: number;
  tmax: number;
  dt: number;
  points: ProteinPoint[];
};

type FatData = {
  s0: number;
  vmax: number;
  km: number;
  tmax: number;
  dt: number;
  points: FatPoint[];
};

type CarbData = {
  s0: number;
  vmax: number;
  km: number;
  tmax: number;
  dt: number;
  points: CarbPoint[];
};

type DigestionAnalysisProps = {
  healthRecordId: string;
  onDataLoaded?: () => void;
};

export default function DigestionAnalysis({ healthRecordId, onDataLoaded }: DigestionAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'protein' | 'fat' | 'carbs'>('protein');
  const [selectedTime, setSelectedTime] = useState(2);

  const [proteinData, setProteinData] = useState<ProteinData | null>(null);
  const [fatData, setFatData] = useState<FatData | null>(null);
  const [carbsData, setCarbsData] = useState<CarbData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDigestionData = async () => {
      setLoading(true);
      setError(null);

      try {
        const basePath = `/api/v1/pets/health-records/${healthRecordId}`;

        const [protein, fat, carbs] = await Promise.all([
          apiClient.get<ProteinData>(`${basePath}/protein`),
          apiClient.get<FatData>(`${basePath}/fat`),
          apiClient.get<CarbData>(`${basePath}/carbs`),
        ]);

        setProteinData(protein);
        setFatData(fat);
        setCarbsData(carbs);

        onDataLoaded?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchDigestionData();
  }, [healthRecordId, onDataLoaded]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #F2704C',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span style={{ marginLeft: '1rem', color: '#666' }}>Загрузка анализа переваривания...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <p style={{ color: '#E74C3C', textAlign: 'center' }}>Ошибка: {error}</p>
        </div>
      </div>
    );
  }

  const getCurrentData = () => {
    switch (activeTab) {
      case 'protein':
        return proteinData;
      case 'fat':
        return fatData;
      case 'carbs':
        return carbsData;
      default:
        return null;
    }
  };

  const data = getCurrentData();
  if (!data) return null;

  const currentPoint = data.points.find(p => p.t === selectedTime) || data.points[0];
  const maxTime = Math.max(...data.points.map(p => p.t));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Анализ переваривания</h2>
        <p className={styles.subtitle}>Модель Михаэлиса–Ментен</p>
      </div>

      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('protein')}
          className={`${styles.tab} ${activeTab === 'protein' ? styles.tabActive : ''}`}
        >
          Белки
        </button>
        <button
          onClick={() => setActiveTab('fat')}
          className={`${styles.tab} ${activeTab === 'fat' ? styles.tabActive : ''}`}
        >
          Жиры
        </button>
        <button
          onClick={() => setActiveTab('carbs')}
          className={`${styles.tab} ${activeTab === 'carbs' ? styles.tabActive : ''}`}
        >
          Углеводы
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.chartSection}>
          {activeTab === 'protein' && proteinData && (
            <ProteinGraph
              data={proteinData}
              selectedTime={selectedTime}
              currentPoint={currentPoint as ProteinPoint}
            />
          )}
          {activeTab === 'fat' && fatData && (
            <FatGraph
              data={fatData}
              selectedTime={selectedTime}
              currentPoint={currentPoint as FatPoint}
            />
          )}
          {activeTab === 'carbs' && carbsData && (
            <CarbsGraph
              data={carbsData}
              selectedTime={selectedTime}
              currentPoint={currentPoint as CarbPoint}
            />
          )}
        </div>

        <div className={styles.forecastSection}>
          {activeTab !== 'protein' && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#666',
                  marginBottom: '0.75rem'
                }}
              >
                Время: {selectedTime} ч.
              </label>

              <input
                type="range"
                min="0"
                max={maxTime}
                step={data.dt}
                value={selectedTime}
                onChange={(e) => setSelectedTime(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '8px',
                  background: '#e0e0e0',
                  borderRadius: '4px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          )}

          {activeTab === 'protein' && proteinData && (
            <ProteinDigestibility
              data={proteinData}
              currentPoint={currentPoint as ProteinPoint}
            />
          )}
          {activeTab === 'fat' && fatData && (
            <FatStats
              data={fatData}
              currentPoint={currentPoint as FatPoint}
            />
          )}
          {activeTab === 'carbs' && carbsData && (
            <CarbsStats
              data={carbsData}
              currentPoint={currentPoint as CarbPoint}
            />
          )}

          {activeTab === 'protein' && proteinData && (
            <ProteinForecast data={proteinData} />
          )}
          {activeTab === 'fat' }
          {activeTab === 'carbs'}
        </div>
      </div>
    </div>
  );
}

function ProteinGraph({ data, selectedTime, currentPoint }: {
  data: ProteinData;
  selectedTime: number;
  currentPoint: ProteinPoint;
}) {
  const chartData = data.points.map(p => ({
    time: p.t,
    remaining: p.s
  }));

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.time === selectedTime) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill="#FF6B6B"
          stroke="white"
          strokeWidth={2}
        />
      );
    }
    return null;
  };

  return (
    <div>
      <h3 className={styles.sectionTitle}>
        Кривая переваривания S(t) - остаток белка во времени
      </h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="time"
              label={{ value: 'Время (часы)', position: 'insideBottom', offset: -5 }}
              stroke="#666"
            />
            <YAxis
              label={{ value: 'Белок (г)', angle: -90, position: 'insideLeft' }}
              stroke="#666"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="remaining"
              stroke="#FF6B6B"
              strokeWidth={3}
              name="Остаток белка"
              dot={<CustomDot />}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>
  );
}

function ProteinDigestibility({ data, currentPoint }: {
  data: ProteinData;
  currentPoint: ProteinPoint;
}) {
  const digestibility = ((data.s0 - currentPoint.s) / data.s0) * 100;

  return (
    <div className={styles.digestibilityHeader}>
      <h3 className={styles.sectionTitle}>Усвояемость D(t)</h3>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${Math.min(digestibility, 100)}%` }}
        >
          {digestibility.toFixed(1)}%
        </div>
      </div>
      {/* <p className={styles.digestibilityLabel}>Высокая усвояемость</p> */}
    </div>
  );
}

function ProteinForecast({ data }: { data: ProteinData }) {
  return (
    <div className={styles.forecastTable}>
      <h3 className={styles.forecastTitle}>Прогноз переваривания</h3>
      {data.points.map((point, idx) => {
        const digestedPercent = ((data.s0 - point.s) / data.s0) * 100;
        const color = digestedPercent < 50 ? '#E74C3C' : digestedPercent < 80 ? '#FF9F5A' : '#7FDB6A';

        return (
          <div key={idx} className={styles.forecastRow}>
            <span className={styles.forecastHour}>{point.t} час:</span>
            <span className={styles.forecastPercentage} style={{ color }}>
              {digestedPercent.toFixed(1)}%
            </span>
            <span className={styles.forecastGrams}>{point.s.toFixed(2)} г</span>
          </div>
        );
      })}
    </div>
  );
}

function FatGraph({ data, selectedTime }: {
  data: FatData;
  selectedTime: number;
  currentPoint: FatPoint;
}) {
  const chartData = data.points.map(p => ({
    time: p.t,
    undigested: p.l,
    emulsified: p.e,
    digested: p.d * 100
  }));

  const CustomDot = (color: string) => (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.time === selectedTime) {
      return <circle cx={cx} cy={cy} r={8} fill={color} stroke="white" strokeWidth={2} />;
    }
    return null;
  };

  return (
    <div>
      <h3 className={styles.sectionTitle}>
        L(t) - Непереваренный, E(t) - Эмульгированный, D(t) - Переваренный
      </h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="time"
              label={{ value: 'Время (часы)', position: 'insideBottom', offset: -5 }}
              stroke="#666"
            />
            <YAxis
              label={{ value: 'Жиры (грамм)', angle: -90, position: 'insideLeft' }}
              stroke="#666"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{paddingTop: '14px'}} />
            <Line
              type="monotone"
              dataKey="undigested"
              stroke="#4A90E2"
              strokeWidth={2}
              name="L(t) - Непереваренный"
              dot={CustomDot('#4A90E2')}
            />
            <Line
              type="monotone"
              dataKey="emulsified"
              stroke="#FF9F5A"
              strokeWidth={2}
              name="E(t) - Эмульгированный"
              dot={CustomDot('#FF9F5A')}
            />
            <Line
              type="monotone"
              dataKey="digested"
              stroke="#7FDB6A"
              strokeWidth={2}
              name="D(t) - Переваренный"
              dot={CustomDot('#7FDB6A')}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FatStats({ data, currentPoint }: {
  data: FatData;
  currentPoint: FatPoint;
}) {
  const digestedPercent = currentPoint.d * 100;
  const availability = currentPoint.e / currentPoint.l;

  return (
    <div className={styles.digestibilityHeader}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ background: '#FFF5F2', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem 0' }}>Непереваренный L(t)</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4A90E2', margin: 0 }}>{currentPoint.l.toFixed(2)}</p>
          <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>грамм</p>
        </div>
        <div style={{ background: '#FFF5F2', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem 0' }}>Эмульгированный E(t)</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FF9F5A', margin: 0 }}>{currentPoint.e.toFixed(2)}</p>
          <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>грамм</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: '#FFF5F2', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem 0' }}>Переварено D(t)</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7FDB6A', margin: 0 }}>{digestedPercent.toFixed(1)}%</p>
        </div>
        <div style={{ background: '#FFF5F2', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem 0' }}>Доступность E/L</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9B59B6', margin: 0 }}>{availability.toFixed(2)}</p>
          <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>коэффициент</p>
        </div>
      </div>
    </div>
  );
}

function CarbsGraph({ data, selectedTime }: {
  data: CarbData;
  selectedTime: number;
  currentPoint: CarbPoint;
}) {
  const chartData = data.points.map(p => ({
    time: p.t,
    starch: p.s,
    maltose: p.m,
    glucose: p.g
  }));

  const CustomDot = (color: string) => (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.time === selectedTime) {
      return <circle cx={cx} cy={cy} r={8} fill={color} stroke="white" strokeWidth={2} />;
    }
    return null;
  };

  return (
    <div>
      <h3 className={styles.sectionTitle}>
        Процентное соотношение компонентов: Крахмал, Мальтоза, Глюкоза
      </h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="time"
              label={{ value: 'Время (часы)', position: 'insideBottom', offset: -5 }}
              stroke="#666"
            />
            <YAxis
              label={{ value: 'Масса (грамм)', angle: -90, position: 'insideLeft' }}
              stroke="#666"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{paddingTop: '16px'}} />
            <Line
              type="monotone"
              dataKey="starch"
              stroke="#4A90E2"
              strokeWidth={2}
              name="Крахмал"
              dot={CustomDot('#4A90E2')}
            />
            <Line
              type="monotone"
              dataKey="maltose"
              stroke="#FF9F5A"
              strokeWidth={2}
              name="Мальтоза"
              dot={CustomDot('#FF9F5A')}
            />
            <Line
              type="monotone"
              dataKey="glucose"
              stroke="#7FDB6A"
              strokeWidth={2}
              name="Глюкоза"
              dot={CustomDot('#7FDB6A')}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CarbsStats({ data, currentPoint }: {
  data: CarbData;
  currentPoint: CarbPoint;
}) {
  const totalMass = currentPoint.s + currentPoint.m + currentPoint.g;
  const starchPercent = (currentPoint.s / totalMass) * 100;
  const maltosePercent = (currentPoint.m / totalMass) * 100;
  const glucosePercent = (currentPoint.g / totalMass) * 100;

  return (
    <div className={styles.digestibilityHeader}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem'}}>
        <div style={{ background: '#E8F4FD', padding: '1rem', borderRadius: '8px', border: '2px solid #4A90E2' }}>
          <h4 style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem 0' }}>Крахмал</h4>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4A90E2', margin: 0 }}>{currentPoint.s.toFixed(2)}</p>
          <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>{starchPercent.toFixed(1)}% от массы</p>
        </div>
        <div style={{ background: '#FFF5F2', padding: '1rem', borderRadius: '8px', border: '2px solid #FF9F5A' }}>
          <h4 style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem 0' }}>Мальтоза</h4>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FF9F5A', margin: 0 }}>{currentPoint.m.toFixed(2)}</p>
          <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>{maltosePercent.toFixed(1)}% от массы</p>
        </div>
        <div style={{ background: '#F0FDF4', padding: '1rem', borderRadius: '8px', border: '2px solid #7FDB6A' }}>
          <h4 style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem 0' }}>Глюкоза</h4>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#7FDB6A', margin: 0 }}>{currentPoint.g.toFixed(2)}</p>
          <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>{glucosePercent.toFixed(1)}% от массы</p>
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltipBox}>
        <p className={styles.tooltipTime}>Время: {payload[0].payload.time} ч.</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className={styles.tooltipValue} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}
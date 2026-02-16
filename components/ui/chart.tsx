'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface ChartProps {
  data: ChartData[];
  type: 'bar' | 'line' | 'pie';
  title?: string;
  height?: number;
  description?: string;
  accessibilityLabel?: string;
  color?: string;
  colors?: string[];
  showLegend?: boolean;
  xTickAngle?: number;
  xTickFontSize?: number;
}

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00ff00',
  '#ff00ff',
  '#00ffff',
  '#ff0000',
];

function normalizeChartData(rawData: ChartData[] | string | undefined) {
  if (!rawData) return [];

  if (typeof rawData === 'string') {
    try {
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed)) {
        return parsed as ChartData[];
      }
    } catch {
      return [];
    }
  }

  if (Array.isArray(rawData)) {
    return rawData.map(item => ({
      ...item,
      value: typeof item.value === 'string' ? Number(item.value) : item.value,
    }));
  }

  return [];
}

export function Chart({
  data = [],
  type,
  title,
  height = 300,
  description,
  accessibilityLabel,
  color,
  colors,
  showLegend = true,
  xTickAngle = 0,
  xTickFontSize = 12,
}: ChartProps) {
  const normalizedData = normalizeChartData(data as unknown as ChartData[] | string | undefined);
  const hasItemColors = normalizedData.some(item => typeof item.color === 'string');
  const renderChart = () => {
    const fallbackColor = color || '#8884d8';
    const palette = colors && colors.length > 0 ? colors : COLORS;
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={normalizedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={xTickAngle}
                textAnchor={xTickAngle ? 'end' : 'middle'}
                height={xTickAngle ? 60 : undefined}
                tick={{ fontSize: xTickFontSize }}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              {showLegend && <Legend />}
              <Bar dataKey="value" fill={fallbackColor}>
                {hasItemColors &&
                  normalizedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={normalizedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={xTickAngle}
                textAnchor={xTickAngle ? 'end' : 'middle'}
                height={xTickAngle ? 60 : undefined}
                tick={{ fontSize: xTickFontSize }}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              {showLegend && <Legend />}
              <Line type="monotone" dataKey="value" stroke={fallbackColor} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={normalizedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  // Generate accessibility description for screen readers
  const generateAccessibilityDescription = () => {
    if (accessibilityLabel) return accessibilityLabel;

    if (description) return description;

    // Auto-generate description based on data
    if (!normalizedData || normalizedData.length === 0) {
      return `Chart with no data available`;
    }

    const dataSummary = normalizedData.map(d => `${d.name}: ${d.value}`).join(', ');
    switch (type) {
      case 'bar':
        return `Bar chart showing ${dataSummary}`;
      case 'line':
        return `Line chart showing ${dataSummary}`;
      case 'pie':
        return `Pie chart showing ${dataSummary}`;
      default:
        return `Chart showing ${dataSummary}`;
    }
  };

  // Generate data table for accessibility
  const generateDataTable = () => {
    return (
      <table className="sr-only" aria-label={`${title || 'Chart'} data table`}>
        <caption>{generateAccessibilityDescription()}</caption>
        <thead>
          <tr>
            <th>Category</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {normalizedData.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div
        role="img"
        aria-label={generateAccessibilityDescription()}
        aria-describedby={description ? 'chart-description' : undefined}
      >
        {renderChart()}
      </div>
      {description && (
        <p id="chart-description" className="sr-only">
          {description}
        </p>
      )}
      {generateDataTable()}
    </div>
  );
}

// Sample data for demonstration
export const sampleBarData = [
  { name: 'Q1', value: 400 },
  { name: 'Q2', value: 300 },
  { name: 'Q3', value: 600 },
  { name: 'Q4', value: 800 },
];

export const sampleLineData = [
  { name: 'Jan', value: 100 },
  { name: 'Feb', value: 200 },
  { name: 'Mar', value: 150 },
  { name: 'Apr', value: 300 },
  { name: 'May', value: 250 },
];

export const samplePieData = [
  { name: 'Segment A', value: 400 },
  { name: 'Segment B', value: 300 },
  { name: 'Segment C', value: 300 },
  { name: 'Segment D', value: 200 },
];

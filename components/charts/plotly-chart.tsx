import dynamic from 'next/dynamic';
import type { ComponentType, CSSProperties } from 'react';
import type { Layout, Config, PlotData } from 'plotly.js';

type PlotComponentProps = {
  data: PlotData[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  style?: CSSProperties;
  className?: string;
  useResizeHandler?: boolean;
};

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
}) as ComponentType<PlotComponentProps>;

export type PlotlyChartProps = {
  data: Array<Partial<PlotData>>;
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  className?: string;
};

export function PlotlyChart({ data, layout, config, className }: PlotlyChartProps) {
  return (
    <div className={className}>
      <Plot
        data={data as PlotData[]}
        layout={{ margin: { l: 32, r: 24, t: 32, b: 32 }, ...layout }}
        config={{
          responsive: true,
          displayModeBar: false,
          topojsonURL: '/plotly/',
          ...config,
        }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
      />
    </div>
  );
}

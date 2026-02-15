import dynamic from 'next/dynamic';
import type { Layout, Config, PlotData } from 'plotly.js';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export type PlotlyChartProps = {
  data: PlotData[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  className?: string;
};

export function PlotlyChart({ data, layout, config, className }: PlotlyChartProps) {
  return (
    <div className={className}>
      <Plot
        data={data}
        layout={{ margin: { l: 32, r: 24, t: 32, b: 32 }, ...layout }}
        config={{ responsive: true, displayModeBar: false, ...config }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
      />
    </div>
  );
}

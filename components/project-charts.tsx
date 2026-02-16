'use client';

import { Chart } from '@/components/ui/chart';
import { PlotlyChart } from '@/components/charts/plotly-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ProjectChartsProps = {
  slug: string;
};

export function ProjectCharts({ slug }: ProjectChartsProps) {
  if (slug === 'customer-segmentation-dashboard') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interactive Segment Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Chart
            type="pie"
            title="Customer Segment Distribution (%)"
            data={[
              { name: 'High-Value Loyalists', value: 8 },
              { name: 'Occasional Bargain Hunters', value: 22 },
              { name: 'New Explorers', value: 15 },
              { name: 'Brand Devotees', value: 12 },
              { name: 'Multi-Channel Shoppers', value: 18 },
              { name: 'At-Risk Customers', value: 8 },
            ]}
            height={320}
          />
          <Chart
            type="bar"
            title="Campaign Conversion Rate (%)"
            data={[
              { name: 'Before Segmentation', value: 3.2 },
              { name: 'After Segmentation', value: 4.5 },
            ]}
            height={280}
          />
        </CardContent>
      </Card>
    );
  }

  if (slug === 'ecommerce-recommendation-engine') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommendation Impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Chart
            type="bar"
            title="Click-Through Rate Improvement (%)"
            data={[
              { name: 'Before System', value: 4.2 },
              { name: 'After System', value: 5.8 },
            ]}
            height={260}
          />
          <div className="h-[320px]">
            <PlotlyChart
              data={[
                {
                  type: 'scatter',
                  mode: 'lines+markers',
                  x: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
                  y: [100, 250, 450, 680, 920, 1200],
                  line: { color: '#2563eb', width: 3 },
                },
              ]}
              layout={{
                title: 'Monthly Revenue Impact ($K)',
                xaxis: { title: 'Month' },
                yaxis: { title: 'Revenue ($K)' },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
              }}
              className="h-full w-full"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

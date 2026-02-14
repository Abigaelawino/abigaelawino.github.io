'use client';

import { MDXRemote } from 'next-mdx-remote/rsc';
import { Chart, sampleBarData, sampleLineData, samplePieData } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const components = {
  Chart,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  // Add any other custom components here
};

interface MDXContentProps {
  content: string;
}

export function MDXContent({ content }: MDXContentProps) {
  return (
    <div className="mdx-content">
      <MDXRemote source={content} components={components} />
    </div>
  );
}

// Helper function to add demo charts to content
export function enhanceContentWithCharts(content: string, projectSlug: string): string {
  // Add interactive charts based on project type
  if (projectSlug === 'ecommerce-recommendation-engine') {
    const performanceChart = `
## Interactive Performance Metrics

<Chart type="bar" data={[
  {name: 'Before System', value: 4.2},
  {name: 'After System', value: 5.8}
]} title="Click-Through Rate Improvement (%)" height={300} />

<Chart type="line" data={[
  {name: 'Month 1', value: 100},
  {name: 'Month 2', value: 250},
  {name: 'Month 3', value: 450},
  {name: 'Month 4', value: 680},
  {name: 'Month 5', value: 920},
  {name: 'Month 6', value: 1200}
]} title="Monthly Revenue Impact ($K)" height={300} />

<Chart type="pie" data={[
  {name: 'Collaborative Filtering', value: 45},
  {name: 'Content-Based', value: 30},
  {name: 'Hybrid Approach', value: 25}
]} title="Algorithm Contribution to Recommendations" height={300} />
`;
    return content + performanceChart;
  }

  if (projectSlug === 'customer-segmentation-dashboard') {
    const segmentationChart = `
## Interactive Segment Analysis

<Chart type="pie" data={[
  {name: 'High-Value Loyalists', value: 8},
  {name: 'Occasional Bargain Hunters', value: 22},
  {name: 'New Explorers', value: 15},
  {name: 'Brand Devotees', value: 12},
  {name: 'Multi-Channel Shoppers', value: 18},
  {name: 'At-Risk Customers', value: 8}
]} title="Customer Segment Distribution (%)" height={300} />

<Chart type="bar" data={[
  {name: 'Before Segmentation', value: 3.2},
  {name: 'After Segmentation', value: 4.5}
]} title="Campaign Conversion Rate (%)" height={300} />

<Chart type="line" data={[
  {name: 'Q1', value: 100},
  {name: 'Q2', value: 180},
  {name: 'Q3', value: 290},
  {name: 'Q4', value: 420}
]} title="Cumulative Marketing ROI (index)" height={300} />
`;
    return content + segmentationChart;
  }

  return content;
}

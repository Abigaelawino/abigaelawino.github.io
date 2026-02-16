'use client';

import { Chart } from '@/components/ui/chart';
import { DataTableMini } from '@/components/data-table-mini';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type NotebookDashboardProps = {
  slug: string;
};

const babyNamesKpis = [
  { label: 'Rows', value: '2.15M' },
  { label: 'Years', value: '1880–2024' },
  { label: 'Top Cohorts', value: '8' },
  { label: 'Nulls', value: '0' },
];

const f5Kpis = [
  { label: 'Event Window', value: 'Oct 16–23' },
  { label: 'DiD Effect', value: '-9.5%' },
  { label: 'Placebo', value: '0.4%' },
  { label: 'Peers', value: '4' },
];

const ssaKpis = [
  { label: 'Records', value: '1,092' },
  { label: 'Years', value: '2001–2021' },
  { label: 'Top State', value: 'KS 60.6%' },
  { label: 'Lowest', value: 'DC 26.9%' },
];

export function NotebookDashboard({ slug }: NotebookDashboardProps) {
  if (slug === 'babynames-ssa-visual-story') {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-4">
          {babyNamesKpis.map(item => (
            <Card key={item.label} className="bg-muted/20">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
                <div className="text-2xl font-semibold">{item.value}</div>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>SSA Births Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <Chart
                type="line"
                data={[
                  { name: '2019', value: 3470933 },
                  { name: '2020', value: 3340577 },
                  { name: '2021', value: 3387949 },
                  { name: '2022', value: 3383135 },
                  { name: '2023', value: 3311196 },
                  { name: '2024', value: 3328501 },
                ]}
                height={220}
                color="#0ea5e9"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Gender Balance Sample</CardTitle>
            </CardHeader>
            <CardContent>
              <Chart
                type="bar"
                data={[
                  { name: 'Jessie', value: 169704 },
                  { name: 'Riley', value: 137477 },
                  { name: 'Casey', value: 77869 },
                  { name: 'Jackie', value: 91167 },
                ]}
                height={220}
                color="#e14f7a"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (slug === 'f5-breach-threat-intelligence') {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-4">
          {f5Kpis.map(item => (
            <Card key={item.label} className="bg-muted/20">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
                <div className="text-2xl font-semibold">{item.value}</div>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>DiD vs Placebo</CardTitle>
            </CardHeader>
            <CardContent>
              <Chart
                type="bar"
                data={[
                  { name: 'DiD', value: -0.0951 },
                  { name: 'Placebo', value: 0.0042 },
                ]}
                height={220}
                color="#ef4444"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Coefficient Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTableMini
                columns={[
                  { key: 'term', label: 'Term' },
                  { key: 'value', label: 'Coeff' },
                ]}
                data={[
                  { term: 'Intercept', value: 0.0027 },
                  { term: 'Treated', value: -0.0003 },
                  { term: 'Post', value: -0.0143 },
                  { term: 'Treated × Post', value: -0.0951 },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (slug === 'ssa-disability-outcomes') {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-4">
          {ssaKpis.map(item => (
            <Card key={item.label} className="bg-muted/20">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
                <div className="text-2xl font-semibold">{item.value}</div>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Approval Trend (Sample)</CardTitle>
            </CardHeader>
            <CardContent>
              <Chart
                type="line"
                data={[
                  { name: '2017', value: 36.17 },
                  { name: '2018', value: 37.07 },
                  { name: '2019', value: 39.51 },
                  { name: '2020', value: 41.77 },
                  { name: '2021', value: 38.83 },
                ]}
                height={220}
                color="#1d4ed8"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>FY2021 Top / Bottom</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTableMini
                columns={[
                  { key: 'state', label: 'State' },
                  { key: 'rate', label: 'Rate (%)' },
                ]}
                data={[
                  { state: 'KS', rate: 60.57 },
                  { state: 'AK', rate: 56.53 },
                  { state: 'NH', rate: 50.57 },
                  { state: 'DC', rate: 26.88 },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}

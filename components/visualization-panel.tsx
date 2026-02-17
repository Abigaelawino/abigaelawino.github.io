import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type VisualizationPanelProps = {
  interactive: React.ReactNode;
  notebook?: React.ReactNode;
  generation?: React.ReactNode;
};

export function VisualizationPanel({ interactive, notebook, generation }: VisualizationPanelProps) {
  const hasNotebook = Boolean(notebook);
  const hasGeneration = Boolean(generation);

  return (
    <Tabs
      defaultValue="interactive"
      orientation="vertical"
      className="viz-shell grid gap-6 lg:grid-cols-[260px_1fr]"
    >
      <aside className="rounded-lg border bg-muted/30 p-4 text-sm space-y-3">
        <div className="font-semibold text-foreground">Views</div>
        <TabsList className="viz-tabs-list flex w-full flex-col gap-2 bg-transparent p-0">
          <TabsTrigger value="interactive" className="viz-tab">
            <span>Interactive charts live</span>
            <span className="viz-pill">Live</span>
          </TabsTrigger>
          {hasGeneration && (
            <TabsTrigger value="generation" className="viz-tab">
              <span>Trends by Generation</span>
              <span className="viz-pill">Cohorts</span>
            </TabsTrigger>
          )}
          {hasNotebook && (
            <TabsTrigger value="notebook" className="viz-tab">
              <span>Notebook figures</span>
              <span className="viz-pill">Figures</span>
            </TabsTrigger>
          )}
        </TabsList>
        <div className="pt-2 text-xs text-muted-foreground">
          Select a view to keep the story focused.
        </div>
      </aside>
      <div className="viz-panels space-y-8">
        <TabsContent value="interactive" className="mt-0 space-y-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Dashboards </h3>
            <p className="text-sm text-muted-foreground">
              Live interactive dashboards from the SSA baby names analysis.
            </p>
          </div>
          {interactive}
        </TabsContent>
        {hasGeneration && (
          <TabsContent value="generation" className="mt-0 space-y-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">Trends by Generation</h3>
              <p className="text-sm text-muted-foreground">
                Top 10 names by cohort for each gender.
              </p>
            </div>
            {generation}
          </TabsContent>
        )}
        {hasNotebook && (
          <TabsContent value="notebook" className="mt-0 space-y-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">Notebook Excerpts </h3>
              <p className="text-sm text-muted-foreground">
                Notebook exports and Tableau snapshots for deep-dive context.
              </p>
            </div>
            {notebook}
          </TabsContent>
        )}
      </div>
    </Tabs>
  );
}

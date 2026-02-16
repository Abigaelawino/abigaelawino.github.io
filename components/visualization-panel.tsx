'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type VisualizationPanelProps = {
  interactive: React.ReactNode;
  notebook?: React.ReactNode;
};

export function VisualizationPanel({ interactive, notebook }: VisualizationPanelProps) {
  const [activeView, setActiveView] = useState<'interactive' | 'notebook'>('interactive');
  const hasNotebook = Boolean(notebook);

  return (
    <div className="viz-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-lg border bg-muted/30 p-4 text-sm space-y-3">
        <div className="font-semibold text-foreground">Views</div>
        <button
          type="button"
          className={cn('viz-tab', activeView === 'interactive' && 'viz-tab-active')}
          onClick={() => setActiveView('interactive')}
        >
          <span>Interactive charts</span>
          <span className="viz-pill">Live</span>
        </button>
        {hasNotebook && (
          <button
            type="button"
            className={cn('viz-tab', activeView === 'notebook' && 'viz-tab-active')}
            onClick={() => setActiveView('notebook')}
          >
            <span>Notebook figures</span>
            <span className="viz-pill">Figures</span>
          </button>
        )}
        <div className="pt-2 text-xs text-muted-foreground">
          Select a view to keep the story focused.
        </div>
      </aside>
      <div className="viz-panels space-y-8">
        {activeView === 'interactive' && (
          <section className="space-y-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">Interactive charts</h3>
              <p className="text-sm text-muted-foreground">
                Live charts and maps that anchor the story.
              </p>
            </div>
            {interactive}
          </section>
        )}
        {hasNotebook && activeView === 'notebook' && (
          <section className="space-y-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">Notebook figures</h3>
              <p className="text-sm text-muted-foreground">
                Notebook exports and Tableau snapshots for deep-dive context.
              </p>
            </div>
            {notebook}
          </section>
        )}
      </div>
    </div>
  );
}

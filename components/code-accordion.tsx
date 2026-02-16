import React from 'react';
import { CodeBlock } from '@/components/code-block';

export type CodeAccordionItem = {
  title: string;
  description?: string;
  code: string;
  language?: string;
};

type CodeAccordionProps = {
  items: CodeAccordionItem[];
};

export function CodeAccordion({ items }: CodeAccordionProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map(item => (
        <details
          key={item.title}
          className="rounded-lg border bg-muted/20 p-4 overflow-hidden"
        >
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            {item.title}
          </summary>
          {item.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
          ) : null}
          <div className="mt-3">
            <CodeBlock code={item.code} language={item.language ?? 'text'} />
          </div>
        </details>
      ))}
    </div>
  );
}

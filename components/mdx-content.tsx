import React from 'react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Chart } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type InlineCodeProps = React.ComponentProps<'code'>;

function InlineCode({ className, ...props }: InlineCodeProps) {
  if (className?.includes('language-')) {
    return <code className={className} {...props} />;
  }

  return (
    <code
      className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
      {...props}
    />
  );
}

function PreWithLines({ children, className, ...props }: React.ComponentProps<'pre'>) {
  const codeElement = React.Children.toArray(children).find(
    child => React.isValidElement(child) && child.type === 'code'
  ) as React.ReactElement | undefined;

  const rawCode = (() => {
    const content = codeElement?.props?.children;
    if (Array.isArray(content)) return content.join('');
    if (typeof content === 'string') return content;
    return '';
  })();

  const lines = rawCode.replace(/\n$/, '').split('\n');

  return (
    <pre
      className={cn(
        'code-block no-scrollbar min-w-0 overflow-x-auto overflow-y-auto overscroll-x-contain overscroll-y-auto px-4 py-3.5 outline-none',
        className
      )}
      tabIndex={0}
      {...props}
    >
      <code data-line-numbers="">
        {lines.map((line, index) => (
          <span className="line" data-line={index + 1} key={`line-${index}`}>
            <span className="line-number">{index + 1}</span>
            <span className="line-content">{line || ' '}</span>
          </span>
        ))}
      </code>
    </pre>
  );
}

const components = {
  Chart,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
  code: InlineCode,
  pre: PreWithLines,
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

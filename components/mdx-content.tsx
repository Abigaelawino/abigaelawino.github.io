import React from 'react';
import { getHighlighter, type Highlighter, type ThemedToken } from 'shiki';
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

const shikiLanguages = [
  'bash',
  'css',
  'html',
  'javascript',
  'js',
  'jsx',
  'json',
  'markdown',
  'md',
  'mdx',
  'python',
  'shell',
  'sql',
  'ts',
  'tsx',
  'yaml',
  'yml',
  'text',
];

const highlighterPromise: Promise<Highlighter> = getHighlighter({
  themes: ['github-light'],
  langs: shikiLanguages,
});

function getLanguage(className: string | undefined) {
  if (!className) return 'text';
  const match = className.match(/language-([\w-]+)/);
  return match?.[1] ?? 'text';
}

async function highlightWithShiki(code: string, language: string) {
  try {
    const highlighter = await highlighterPromise;
    return highlighter.codeToThemedTokens(code, {
      lang: language,
      theme: 'github-light',
    });
  } catch {
    return null;
  }
}

async function PreWithLines({ children, className, ...props }: React.ComponentProps<'pre'>) {
  const codeElement = React.Children.toArray(children).find(
    child => React.isValidElement(child) && child.type === 'code'
  ) as React.ReactElement | undefined;

  const rawCode = (() => {
    const content = codeElement?.props?.children;
    if (Array.isArray(content)) return content.join('');
    if (typeof content === 'string') return content;
    return '';
  })();

  const language = getLanguage(codeElement?.props?.className ?? className);
  const highlighted = await highlightWithShiki(rawCode, language);
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
        {lines.map((line, index) => {
          const tokens = highlighted ? highlighted[index] : null;
          return (
            <span className="line" data-line={index + 1} key={`line-${index}`}>
              <span className="line-number">{index + 1}</span>
              <span className="line-content">
                {tokens && tokens.length > 0
                  ? tokens.map((token: ThemedToken, tokenIndex) => (
                      <span
                        key={`token-${index}-${tokenIndex}`}
                        style={token.color ? { color: token.color } : undefined}
                      >
                        {token.content}
                      </span>
                    ))
                  : line || ' '}
              </span>
            </span>
          );
        })}
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

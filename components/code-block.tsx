import React from 'react';
import { getHighlighter, type Highlighter, type ThemedToken } from 'shiki';
import { cn } from '@/lib/utils';

type CodeBlockProps = {
  code: string;
  language?: string;
  className?: string;
};

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

const highlighterPromise: Promise<Highlighter> = (() => {
  const globalAny = globalThis as { __shikiHighlighter?: Promise<Highlighter> };
  if (!globalAny.__shikiHighlighter) {
    globalAny.__shikiHighlighter = getHighlighter({
      themes: ['github-light'],
      langs: shikiLanguages,
    });
  }
  return globalAny.__shikiHighlighter;
})();

async function highlightWithShiki(code: string, language: string) {
  try {
    const highlighter = await highlighterPromise;
    return highlighter.codeToTokens(code, {
      lang: language as never,
      theme: 'github-light',
    }) as unknown as ThemedToken[][];
  } catch {
    return null;
  }
}

export async function CodeBlock({ code, language = 'text', className }: CodeBlockProps) {
  const normalized = code.replace(/\n$/, '');
  const lines = normalized.split('\n');
  const highlighted = await highlightWithShiki(normalized, language);

  return (
    <pre
      className={cn(
        'code-block no-scrollbar min-w-0 overflow-x-auto overflow-y-auto overscroll-x-contain overscroll-y-auto px-4 py-3.5 outline-none',
        className
      )}
      tabIndex={0}
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

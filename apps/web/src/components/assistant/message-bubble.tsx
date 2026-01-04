'use client';

import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/store/chat-store';
import { InlineChart } from './inline-chart';

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-white/10 px-1 py-0.5 text-[12px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function renderMarkdown(text: string) {
  const segments = text.split(/```/g);
  return segments.map((segment, index) => {
    if (index % 2 === 1) {
      const [firstLine, ...rest] = segment.split('\n');
      const language = firstLine.trim();
      const code = rest.join('\n').trim();
      const escapeHtml = (value: string) =>
        value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      const highlightJson = (value: string) => {
        const escaped = escapeHtml(value);
        return escaped
          .replace(/\"([^\"]+)\"(?=\\s*:)/g, '<span class="text-cyan-300">"$1"</span>')
          .replace(/\"([^\"]+)\"/g, '<span class="text-amber-200">"$1"</span>')
          .replace(/\b(-?\d+(?:\.\d+)?)\b/g, '<span class="text-emerald-200">$1</span>')
          .replace(/\b(true|false|null)\b/g, '<span class="text-purple-200">$1</span>');
      };
      const highlighted =
        language === 'json' || language === 'vegalite'
          ? highlightJson(code)
          : escapeHtml(code);
      return (
        <pre
          key={index}
          className="mt-3 overflow-auto rounded-lg bg-black/60 p-3 text-xs text-white/80"
        >
          <code
            className={language ? `language-${language}` : undefined}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      );
    }

    const blocks = segment.split('\n\n').filter(Boolean);
    return blocks.map((block, blockIndex) => {
      const lines = block.split('\n');
      const isList = lines.every((line) => line.trim().startsWith('- '));
      if (isList) {
        return (
          <ul key={`${index}-${blockIndex}`} className="ml-4 list-disc space-y-1 text-sm">
            {lines.map((line, lineIndex) => (
              <li key={lineIndex}>{renderInline(line.replace(/^- /, ''))}</li>
            ))}
          </ul>
        );
      }
      return (
        <p key={`${index}-${blockIndex}`} className="whitespace-pre-wrap text-sm">
          {renderInline(block)}
        </p>
      );
    });
  });
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : '')}>
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
          isUser ? 'bg-cyan-400/20 text-cyan-100' : 'bg-white/10 text-white'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          'flex-1 rounded-lg p-3 text-sm',
          isUser ? 'bg-cyan-400/10 text-cyan-50' : 'bg-white/5 text-white/80'
        )}
      >
        {message.content ? renderMarkdown(message.content) : null}
        {!isUser && message.status === 'streaming' && (
          <div className="mt-3 h-24 rounded-lg border border-white/10 bg-white/5 animate-pulse" />
        )}
        {message.chartSpec && (
          <div className="mt-3">
            <InlineChart spec={message.chartSpec} title="Generated chart" />
          </div>
        )}
      </div>
    </div>
  );
}

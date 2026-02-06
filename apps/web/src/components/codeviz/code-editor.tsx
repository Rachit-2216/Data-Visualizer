'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type CodeEditorProps = {
  value: string;
  language?: string;
  onChange: (value: string) => void;
  height?: string | number;
};

export function CodeEditor({
  value,
  language = 'python',
  onChange,
  height = '100%',
}: CodeEditorProps) {
  const options = useMemo(
    () => ({
      fontSize: 12,
      minimap: { enabled: false },
      wordWrap: 'off' as const,
      lineNumbers: 'on' as const,
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all' as const,
      automaticLayout: true,
      scrollbar: {
        vertical: 'visible' as const,
        horizontal: 'visible' as const,
        alwaysConsumeMouseWheel: true,
      },
    }),
    []
  );

  return (
    <MonacoEditor
      height={height}
      language={language}
      value={value}
      onChange={(next) => onChange(next ?? '')}
      theme="vs-dark"
      options={options}
    />
  );
}

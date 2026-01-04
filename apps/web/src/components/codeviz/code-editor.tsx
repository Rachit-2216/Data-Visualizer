'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type CodeEditorProps = {
  value: string;
  language?: string;
  onChange: (value: string) => void;
};

export function CodeEditor({ value, language = 'python', onChange }: CodeEditorProps) {
  const options = useMemo(
    () => ({
      fontSize: 12,
      minimap: { enabled: false },
      wordWrap: 'on' as const,
      lineNumbers: 'on' as const,
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all' as const,
    }),
    []
  );

  return (
    <MonacoEditor
      height="240px"
      language={language}
      value={value}
      onChange={(next) => onChange(next ?? '')}
      theme="vs-dark"
      options={options}
    />
  );
}


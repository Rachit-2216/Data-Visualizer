'use client';

import { useEffect, useState } from 'react';
import { Play, Square, Trash2, RotateCw, Sparkles, Cpu } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const defaultCode = `# DataCanvas Python Sandbox
# Your dataset is available as 'df'

import pandas as pd
import numpy as np

# Example: Basic analysis
print("Dataset shape:", df.shape)
print("\\nColumn types:")
print(df.dtypes)

# Example: Simple statistics
print("\\nNumeric summary:")
print(df.describe())

# Example: Training a simple model
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Prepare data (example for Titanic)
X = df[['Pclass', 'Age', 'SibSp', 'Parch', 'Fare']].fillna(0)
y = df['Survived']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train model
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\\nModel Accuracy: {accuracy:.2%}")
`;

const mockOutput = `Dataset shape: (891, 12)

Column types:
PassengerId      int64
Survived         int64
Pclass           int64
Name            object
Sex             object
Age            float64
SibSp            int64
Parch            int64
Ticket          object
Fare           float64
Cabin           object
Embarked        object
dtype: object

Numeric summary:
       PassengerId    Survived      Pclass         Age       SibSp  ...
count   891.000000  891.000000  891.000000  714.000000  891.000000  ...
mean    446.000000    0.383838    2.308642   29.699118    0.523008  ...
std     257.353842    0.486592    0.836071   14.526497    1.102743  ...
min       1.000000    0.000000    1.000000    0.420000    0.000000  ...
25%     223.500000    0.000000    2.000000   20.125000    0.000000  ...
50%     446.000000    0.000000    3.000000   28.000000    0.000000  ...
75%     668.500000    1.000000    3.000000   38.000000    1.000000  ...
max     891.000000    1.000000    3.000000   80.000000    8.000000  ...

Model Accuracy: 78.77%`;

export function SandboxTab() {
  const [code, setCode] = useState(defaultCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [status, setStatus] = useState('Idle');

  useEffect(() => {
    const id = setTimeout(() => setPyodideReady(true), 1200);
    return () => clearTimeout(id);
  }, []);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Running...\n');
    setStatus('Executing');

    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setOutput(mockOutput);
    setIsRunning(false);
    setStatus('Complete');
  };

  const handleClear = () => {
    setOutput('');
    setStatus('Idle');
  };

  return (
    <div className="h-full flex flex-col bg-[#080c16]">
      {/* Toolbar */}
      <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-white/5">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1 h-8"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Square className="h-3.5 w-3.5" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Run
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 h-8"
            onClick={handleClear}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
          <Button variant="outline" size="sm" className="gap-1 h-8" onClick={() => setCode(defaultCode)}>
            <RotateCw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
        <div className="flex items-center gap-4 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-cyan-300" />
            <span>{pyodideReady ? 'Pyodide Ready' : 'Loading Pyodide...'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>{status}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Code editor */}
        <div className="flex-1 flex flex-col border-r border-white/10">
          <div className="h-9 border-b border-white/10 flex items-center px-3 bg-white/5">
            <span className="text-xs font-medium text-white/70">sandbox.py</span>
            <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-white/40">
              Python
            </span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="python"
              value={code}
              onChange={(value) => setCode(value ?? '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
              }}
            />
          </div>
        </div>

        {/* Output panel */}
        <div className="w-[420px] flex flex-col">
          <div className="h-9 border-b border-white/10 flex items-center px-3 bg-white/5">
            <span className="text-xs font-medium text-white/70">Output</span>
            <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-white/40">
              Console
            </span>
          </div>
          <ScrollArea className="flex-1">
            <pre className="p-4 font-mono text-xs whitespace-pre-wrap text-white/80">
              {output || 'Run your code to see output here...'}
            </pre>
          </ScrollArea>

          {/* Detected metrics */}
          {output && (
            <div className="border-t border-white/10 p-3">
              <p className="text-xs font-medium text-white/60 mb-2">
                Detected Metrics
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-200 text-xs">
                  Accuracy: 78.77%
                </div>
                <div className="px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-200 text-xs">
                  F1: 0.74
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

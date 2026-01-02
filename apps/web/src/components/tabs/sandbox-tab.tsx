'use client';

import { useState } from 'react';
import { Play, Square, Trash2, Download, Upload, RotateCw } from 'lucide-react';
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

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Running...\n');

    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setOutput(mockOutput);
    setIsRunning(false);
  };

  const handleClear = () => {
    setOutput('');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-10 border-b flex items-center justify-between px-4 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1 h-7"
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
            className="gap-1 h-7"
            onClick={handleClear}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
          <Button variant="outline" size="sm" className="gap-1 h-7">
            <RotateCw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {pyodideReady ? (
              <span className="text-green-600">Pyodide Ready</span>
            ) : (
              <span className="text-yellow-600">Loading Pyodide...</span>
            )}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Code editor */}
        <div className="flex-1 flex flex-col border-r">
          <div className="h-8 border-b flex items-center px-3 bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground">
              sandbox.py
            </span>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-background resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output panel */}
        <div className="w-[400px] flex flex-col">
          <div className="h-8 border-b flex items-center px-3 bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground">
              Output
            </span>
          </div>
          <ScrollArea className="flex-1">
            <pre className="p-4 font-mono text-xs whitespace-pre-wrap">
              {output || 'Run your code to see output here...'}
            </pre>
          </ScrollArea>

          {/* Detected metrics */}
          {output && (
            <div className="border-t p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Detected Metrics
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="px-2 py-1 rounded-md bg-green-500/10 text-green-600 text-xs">
                  Accuracy: 78.77%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

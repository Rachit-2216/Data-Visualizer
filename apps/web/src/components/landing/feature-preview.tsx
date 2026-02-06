'use client';

import { motion, AnimatePresence } from 'framer-motion';

type FeaturePreviewProps = {
  activeFeature: number;
  features: Array<{
    id: string;
    title: string;
    preview: React.ReactNode;
    mockupType: 'chart' | 'code' | 'dashboard' | 'ai';
  }>;
};

export function FeaturePreview({ activeFeature, features }: FeaturePreviewProps) {
  const feature = features[activeFeature] || features[0];

  return (
    <div className="w-full max-w-xl px-8">
      <div className="relative rounded-2xl border border-white/10 bg-[#0a0f1a] overflow-hidden shadow-2xl shadow-cyan-500/10">
        <div className="h-10 bg-[#0f172a] border-b border-white/10 flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 mx-4">
            <div className="h-6 rounded-md bg-white/5 flex items-center px-3">
              <span className="text-xs text-white/40">datacanvas.app/workspace</span>
            </div>
          </div>
        </div>

        <div className="aspect-[4/3] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              {feature.preview}
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(14, 165, 233, 0.15) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {features.map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === activeFeature ? 'bg-cyan-400 scale-125' : 'bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function ChartPreview() {
  return (
    <div className="h-full bg-[#060b16] p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex items-end justify-between h-48 gap-3">
          {[65, 85, 45, 92, 78, 55, 88].map((height, idx) => (
            <motion.div
              key={idx}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: idx * 0.1, duration: 0.8, ease: 'easeOut' }}
              className="flex-1 rounded-t-md bg-gradient-to-t from-cyan-600 to-cyan-400"
            />
          ))}
        </div>
        <div className="flex justify-between mt-4 text-xs text-white/40">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CodePreview() {
  return (
    <div className="h-full bg-[#060b16] p-4 font-mono text-sm">
      <div className="space-y-2">
        <div className="text-purple-400">
          <span className="text-pink-400">from</span> sklearn.model_selection{' '}
          <span className="text-pink-400">import</span> train_test_split
        </div>
        <div className="text-purple-400">
          <span className="text-pink-400">from</span> sklearn.ensemble{' '}
          <span className="text-pink-400">import</span> RandomForestClassifier
        </div>
        <div className="mt-4 text-white/40"># Split data</div>
        <div className="text-white">
          X_train, X_test, y_train, y_test ={' '}
          <span className="text-yellow-400">train_test_split</span>(X, y)
        </div>
        <div className="mt-4 text-white/40"># Train model</div>
        <div className="text-white">
          model = <span className="text-cyan-400">RandomForestClassifier</span>()
        </div>
        <div className="text-white">
          model.<span className="text-yellow-400">fit</span>(X_train, y_train)
        </div>
        <div className="mt-4 text-green-400"># Accuracy: 94.7% ?</div>
      </div>
    </div>
  );
}

export function AIPreview() {
  return (
    <div className="h-full bg-[#060b16] p-4 flex flex-col">
      <div className="flex-1 space-y-4">
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-sm text-white">
            What are the key factors affecting customer churn?
          </div>
        </div>

        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/80">
            <p className="mb-2">Based on your dataset, the top factors are:</p>
            <ol className="list-decimal list-inside space-y-1 text-white/60">
              <li>
                <span className="text-cyan-400">Contract Type</span> - 42% importance
              </li>
              <li>
                <span className="text-cyan-400">Monthly Charges</span> - 28% importance
              </li>
              <li>
                <span className="text-cyan-400">Tenure</span> - 18% importance
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardPreview() {
  return (
    <div className="h-full bg-[#060b16] p-4 grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
        <div className="text-xs text-white/40 mb-1">Total Rows</div>
        <div className="text-2xl font-bold text-white">12,847</div>
        <div className="text-xs text-green-400">+12.5%</div>
      </div>
      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
        <div className="text-xs text-white/40 mb-1">Columns</div>
        <div className="text-2xl font-bold text-white">24</div>
        <div className="text-xs text-white/40">8 numeric</div>
      </div>
      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
        <div className="text-xs text-white/40 mb-1">Missing</div>
        <div className="text-2xl font-bold text-white">2.4%</div>
        <div className="text-xs text-yellow-400">3 columns</div>
      </div>
      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
        <div className="text-xs text-white/40 mb-1">Models</div>
        <div className="text-2xl font-bold text-white">5</div>
        <div className="text-xs text-cyan-400">2 trained</div>
      </div>
    </div>
  );
}

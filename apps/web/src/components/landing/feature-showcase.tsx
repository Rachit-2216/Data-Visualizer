'use client';

import { useState, useRef, useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BarChart3, Code2, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';
import { FeaturePreview, ChartPreview, CodePreview, AIPreview, DashboardPreview } from './feature-preview';

const FEATURES = [
  {
    id: 'visualize',
    icon: BarChart3,
    title: 'Instant Visualizations',
    description:
      'Upload any dataset and get beautiful, interactive charts automatically generated based on your data structure. No configuration needed.',
    preview: <ChartPreview />,
    mockupType: 'chart' as const,
    color: '#0ea5e9',
  },
  {
    id: 'train',
    icon: Code2,
    title: 'One-Click ML Training',
    description:
      'Train classification, regression, and clustering models with a single click. See real-time training metrics and export your models.',
    preview: <CodePreview />,
    mockupType: 'code' as const,
    color: '#8b5cf6',
  },
  {
    id: 'ai',
    icon: MessageSquare,
    title: 'AI-Powered Analysis',
    description:
      'Ask questions about your data in natural language. Get insights, explanations, and even generated visualizations from our AI assistant.',
    preview: <AIPreview />,
    mockupType: 'ai' as const,
    color: '#10b981',
  },
  {
    id: 'profile',
    icon: Sparkles,
    title: 'Automatic Profiling',
    description:
      'Get comprehensive statistics, correlation matrices, missing value analysis, and data quality warnings instantly.',
    preview: <DashboardPreview />,
    mockupType: 'dashboard' as const,
    color: '#f59e0b',
  },
];

export function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !pinnedRef.current || !featuresRef.current) return;

    const featureCards = featuresRef.current.querySelectorAll('.feature-card');

    const pinTrigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: 'bottom bottom',
      pin: pinnedRef.current,
      pinSpacing: false,
    });

    featureCards.forEach((card, index) => {
      ScrollTrigger.create({
        trigger: card,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setActiveFeature(index),
        onEnterBack: () => setActiveFeature(index),
      });
    });

    return () => {
      pinTrigger.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative bg-[#030712]"
      style={{ height: `${(FEATURES.length + 1) * 100}vh` }}
    >
      <div className="sticky top-0 h-screen flex">
        <div
          ref={pinnedRef}
          className="w-1/2 h-screen flex items-center justify-center p-8 border-r border-white/5"
        >
          <FeaturePreview activeFeature={activeFeature} features={FEATURES} />
        </div>

        <div ref={featuresRef} className="w-1/2">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = index === activeFeature;

            return (
              <div
                key={feature.id}
                className={`feature-card h-screen flex items-center justify-center p-12 transition-opacity duration-500 ${
                  isActive ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div className="max-w-lg">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{
                      background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}10)`,
                      border: `1px solid ${feature.color}30`,
                    }}
                  >
                    <Icon className="w-7 h-7" style={{ color: feature.color }} />
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-lg text-white/60 mb-8 leading-relaxed">{feature.description}</p>

                  <button
                    className="inline-flex items-center gap-2 text-sm font-medium transition-all duration-300 hover:gap-3"
                    style={{ color: feature.color }}
                  >
                    Learn more
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

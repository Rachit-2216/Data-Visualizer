'use client';

import { useRef, useState, useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Upload, Sparkles, BarChart3, Rocket, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'Upload Your Data',
    description:
      'Drag and drop CSV, JSON, or Excel files. We support datasets up to 100MB with automatic type detection.',
    color: '#0ea5e9',
  },
  {
    icon: Sparkles,
    title: 'Instant Profiling',
    description:
      'Get comprehensive statistics, correlations, and data quality insights in seconds. No configuration needed.',
    color: '#8b5cf6',
  },
  {
    icon: BarChart3,
    title: 'Explore & Visualize',
    description:
      'Interact with auto-generated charts or create custom visualizations. Ask the AI for specific insights.',
    color: '#10b981',
  },
  {
    icon: Rocket,
    title: 'Train & Deploy',
    description:
      'Train ML models with one click. Export predictions, download models, or share your findings.',
    color: '#f59e0b',
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!sectionRef.current || !stepsRef.current) return;

    const steps = stepsRef.current.querySelectorAll('.step-card');

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: 'bottom bottom',
      pin: '.steps-content',
      pinSpacing: false,
    });

    steps.forEach((step, index) => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setActiveStep(index),
        onEnterBack: () => setActiveStep(index),
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="relative bg-[#030712]" style={{ height: `${(STEPS.length + 1) * 100}vh` }}>
      <div className="sticky top-0 h-screen flex items-center">
        <div className="steps-content w-full max-w-6xl mx-auto px-6 flex items-center gap-16">
          <div className="w-1/2 flex flex-col items-center">
            <div className="text-[120px] font-bold leading-none mb-8">
              <span
                className="bg-gradient-to-br bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${STEPS[activeStep].color}, ${STEPS[activeStep].color}80)`,
                }}
              >
                {String(activeStep + 1).padStart(2, '0')}
              </span>
            </div>

            <div className="w-full max-w-xs h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((activeStep + 1) / STEPS.length) * 100}%`,
                  background: `linear-gradient(90deg, ${STEPS[activeStep].color}, ${STEPS[activeStep].color}80)`,
                }}
              />
            </div>

            <div className="flex items-center gap-3 mt-6">
              {STEPS.map((step, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    idx === activeStep ? 'scale-125' : 'bg-white/20 hover:bg-white/40'
                  }`}
                  style={{
                    backgroundColor: idx === activeStep ? step.color : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          <div ref={stepsRef} className="w-1/2">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === activeStep;

              return (
                <div
                  key={step.title}
                  className={`step-card h-screen flex items-center justify-center transition-opacity duration-700 ${
                    isActive ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  <div className="max-w-md">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                        isActive ? 'scale-110' : 'scale-100'
                      }`}
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg, ${step.color}30, ${step.color}10)`
                          : `linear-gradient(135deg, ${step.color}15, transparent)`,
                        border: `2px solid ${isActive ? step.color + '60' : step.color + '20'}`,
                        boxShadow: isActive ? `0 0 40px ${step.color}40` : 'none',
                      }}
                    >
                      <Icon
                        className="w-8 h-8 transition-all duration-500"
                        style={{
                          color: step.color,
                          filter: isActive ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                        }}
                      />
                    </div>

                    <h3 className="text-3xl font-bold text-white mb-4">{step.title}</h3>
                    <p className="text-lg text-white/60 leading-relaxed mb-6">{step.description}</p>

                    {isActive && (
                      <button
                        className="inline-flex items-center gap-2 text-sm font-medium transition-all duration-300 hover:gap-3"
                        style={{ color: step.color }}
                      >
                        Learn more
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { ArrowRight, Check, Sparkles, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FEATURES = [
  { icon: Zap, text: 'Get started in 30 seconds' },
  { icon: Shield, text: 'Enterprise-grade security' },
  { icon: Check, text: 'No credit card required' },
];

export function CTASection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      setEmail('');
    }, 3000);
  };

  return (
    <section
      ref={ref}
      className="relative py-32 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #030712 0%, #0a0f1a 100%)' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 animate-pulse"
          style={{
            background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)',
            top: '20%',
            right: '10%',
            animationDuration: '4s',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-25 animate-pulse"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
            bottom: '10%',
            left: '10%',
            animationDuration: '5s',
            animationDelay: '1s',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div
          className={`
            inline-flex items-center gap-2 px-4 py-2 mb-6
            rounded-full border border-cyan-500/30 bg-cyan-500/10
            backdrop-blur-sm text-sm text-cyan-400
            transition-all duration-1000
            ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: '200ms' }}
        >
          <Sparkles className="w-4 h-4" />
          <span>Join 50,000+ data professionals</span>
        </div>

        <h2
          className={`
            text-4xl md:text-6xl font-bold text-white mb-6
            transition-all duration-1000
            ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
          style={{ transitionDelay: '400ms' }}
        >
          Ready to Transform Your Data?
        </h2>

        <p
          className={`
            text-lg md:text-xl text-white/60 mb-12 max-w-2xl mx-auto
            transition-all duration-1000
            ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
          style={{ transitionDelay: '600ms' }}
        >
          Start visualizing, analyzing, and training models on your data in seconds. No setup, no credit
          card, no hassle.
        </p>

        <div
          className={`
            max-w-md mx-auto mb-8
            transition-all duration-1000
            ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
          style={{ transitionDelay: '800ms' }}
        >
          {isSuccess ? (
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
              <Check className="w-5 h-5" />
              <span className="font-medium">Check your email to get started!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 h-14 px-6 text-base bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        <div
          className={`
            flex flex-wrap items-center justify-center gap-6 text-sm text-white/60
            transition-all duration-1000
            ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
          style={{ transitionDelay: '1000ms' }}
        >
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-cyan-400" />
                <span>{feature.text}</span>
              </div>
            );
          })}
        </div>

        <div
          className={`
            mt-8 text-white/40 text-sm
            transition-all duration-1000
            ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
          style={{ transitionDelay: '1200ms' }}
        >
          Already have an account?{' '}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors underline">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

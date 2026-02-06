'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScroll } from './scroll-provider';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const isScrolled = scrollY > 100;

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [scrollY]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV_LINKS.map((link) => {
        if (!link.href.startsWith('#')) return null;
        const id = link.href.replace('#', '');
        return document.getElementById(id);
      }).filter(Boolean) as HTMLElement[];

      const currentSection = sections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    if (!href.startsWith('#')) return;

    const id = href.replace('#', '');
    const element = document.getElementById(id);

    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }

    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-500
          ${isScrolled ? 'bg-[#030712]/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/5' : 'bg-transparent'}
        `}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:shadow-xl group-hover:shadow-cyan-500/40 transition-all duration-300">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DataCanvas</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.href.replace('#', '');

                if (!link.href.startsWith('#')) {
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-sm font-medium text-white/70 hover:text-cyan-400 transition-all duration-300"
                    >
                      {link.label}
                    </Link>
                  );
                }

                return (
                  <button
                    key={link.label}
                    onClick={() => scrollToSection(link.href)}
                    className={`text-sm font-medium transition-all duration-300 hover:text-cyan-400 ${
                      isActive ? 'text-cyan-400' : 'text-white/70'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/workspace">
                <Button className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105">
                  Get Started
                </Button>
              </Link>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`
          fixed inset-0 z-40 md:hidden
          transition-all duration-300 ease-out
          ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />

        <div
          className={`
            absolute top-20 left-0 right-0 mx-4
            bg-[#0a0f1a]/95 backdrop-blur-xl
            border border-white/10 rounded-2xl
            shadow-2xl shadow-black/50
            transition-all duration-300 ease-out
            ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
          `}
        >
          <div className="p-6 space-y-4">
            {NAV_LINKS.map((link) => {
              if (!link.href.startsWith('#')) {
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block w-full text-left px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              }

              return (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="block w-full text-left px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  {link.label}
                </button>
              );
            })}

            <div className="h-px bg-white/10" />

            <div className="space-y-3 pt-2">
              <Link href="/login" className="block">
                <Button
                  variant="outline"
                  className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/workspace" className="block">
                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

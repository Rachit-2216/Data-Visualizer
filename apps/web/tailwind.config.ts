import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        // Aurora wave effect for background
        'aurora-wave': {
          '0%, 100%': {
            transform: 'translateX(-50%) translateY(0) scale(1)',
            opacity: '0.5',
          },
          '50%': {
            transform: 'translateX(-50%) translateY(-20px) scale(1.05)',
            opacity: '0.8',
          },
        },
        // Gradient rotation for backgrounds
        'gradient-rotate': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        // Floating idle animation
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        // Glow pulse effect
        'glow-pulse': {
          '0%, 100%': {
            opacity: '0.4',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 40px rgba(56, 189, 248, 0.6)',
          },
        },
        // Odometer digit animation
        'odometer': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // Light sweep for buttons
        'light-sweep': {
          '0%': { transform: 'translateX(-100%) skewX(-15deg)' },
          '100%': { transform: 'translateX(200%) skewX(-15deg)' },
        },
        // Ripple effect
        'ripple': {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        // Magnetic pull effect
        'magnetic-pull': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(var(--magnetic-x, 0), var(--magnetic-y, 0))' },
        },
        // Cursor ring expansion
        'cursor-expand': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.5)' },
          '100%': { transform: 'scale(1)' },
        },
        // Text reveal slide up
        'text-reveal-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // Text reveal blur
        'text-reveal-blur': {
          '0%': { filter: 'blur(10px)', opacity: '0' },
          '100%': { filter: 'blur(0)', opacity: '1' },
        },
        // Particle float
        'particle-float': {
          '0%': {
            transform: 'translateY(0) translateX(0) rotate(0deg)',
            opacity: '0',
          },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': {
            transform: 'translateY(-100vh) translateX(20px) rotate(360deg)',
            opacity: '0',
          },
        },
        // Scroll progress
        'scroll-progress': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        // Card tilt reset
        'tilt-reset': {
          '0%': { transform: 'perspective(1000px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y))' },
          '100%': { transform: 'perspective(1000px) rotateX(0) rotateY(0)' },
        },
        // Marquee scroll
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // Chromatic aberration
        'chromatic': {
          '0%': { textShadow: '-2px 0 #ff0000, 2px 0 #00ffff' },
          '50%': { textShadow: '2px 0 #ff0000, -2px 0 #00ffff' },
          '100%': { textShadow: '-2px 0 #ff0000, 2px 0 #00ffff' },
        },
        // Blob morph
        'blob-morph': {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s infinite',
        'aurora-wave': 'aurora-wave 8s ease-in-out infinite',
        'gradient-rotate': 'gradient-rotate 45s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'odometer': 'odometer 0.6s ease-out forwards',
        'light-sweep': 'light-sweep 0.6s ease-out',
        'ripple': 'ripple 0.6s ease-out forwards',
        'magnetic-pull': 'magnetic-pull 0.3s ease-out',
        'cursor-expand': 'cursor-expand 0.3s ease-out',
        'text-reveal-up': 'text-reveal-up 0.6s ease-out forwards',
        'text-reveal-blur': 'text-reveal-blur 0.8s ease-out forwards',
        'particle-float': 'particle-float 10s linear infinite',
        'scroll-progress': 'scroll-progress 0.3s ease-out',
        'tilt-reset': 'tilt-reset 0.5s ease-out forwards',
        'marquee': 'marquee 30s linear infinite',
        'chromatic': 'chromatic 0.3s ease-in-out',
        'blob-morph': 'blob-morph 8s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

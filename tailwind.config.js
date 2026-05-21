/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Inter',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        display: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          950: '#0a0e14',
          900: '#0f141d',
          800: '#141924',
          700: '#1a202e',
          600: '#242b3d',
        },
        navy: {
          900: '#0f1520',
          950: '#0a0d16',
        },
        slate: {
          900: '#0f1419',
          800: '#1a1f29',
          700: '#242933',
          600: '#2e3642',
          500: '#4a5568',
          400: '#718096',
          300: '#a0aec0',
          200: '#cbd5e0',
          100: '#e2e8f0',
        },
        accent: {
          primary: '#3b82f6',
          primaryDark: '#2563eb',
          secondary: '#10b981',
          secondaryDark: '#059669',
          success: '#10b981',
          error: '#ef4444',
          warning: '#f59e0b',
        },
        blue: {
          muted: '#60a5fa',
          soft: '#93c5fd',
        },
        cyan: '#06b6d4',
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(59, 130, 246, 0.25)',
        'glow-success': '0 0 40px -10px rgba(16, 185, 129, 0.25)',
        soft: '0 8px 30px rgba(0, 0, 0, 0.35)',
        card: '0 4px 24px rgba(0, 0, 0, 0.25)',
      },
      backgroundImage: {
        'gradient-radial':
          'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.08), transparent 50%), radial-gradient(ellipse at bottom right, rgba(6, 182, 212, 0.08), transparent 50%)',
        'gradient-primary':
          'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1e40af 100%)',
        'gradient-success':
          'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        marquee: 'marquee 40s linear infinite',
        'float-y': 'floatY 6s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        floatY: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};

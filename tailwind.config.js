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
          primary: '#475569',
          primaryDark: '#334155',
          secondary: '#10b981',
          secondaryDark: '#059669',
          success: '#10b981',
          error: '#ef4444',
          warning: '#f59e0b',
        },
        blue: {
          muted: '#64748b',
          soft: '#94a3b8',
        },
        slate: {
          muted: '#64748b',
          soft: '#94a3b8',
        },
        cyan: '#06b6d4',
        fintech: {
          slate: '#475569',
          slateDark: '#334155',
          slateMuted: '#64748b',
          institutional: '#1e293b',
          professional: '#3f4652',
        },
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(71, 85, 105, 0.25)',
        'glow-success': '0 0 40px -10px rgba(16, 185, 129, 0.25)',
        soft: '0 8px 30px rgba(0, 0, 0, 0.35)',
        card: '0 4px 24px rgba(0, 0, 0, 0.25)',
      },
      backgroundImage: {
        'gradient-radial':
          'radial-gradient(ellipse at top, rgba(71, 85, 105, 0.08), transparent 50%), radial-gradient(ellipse at bottom right, rgba(6, 182, 212, 0.08), transparent 50%)',
        'gradient-primary':
          'linear-gradient(135deg, #475569 0%, #334155 50%, #1e293b 100%)',
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

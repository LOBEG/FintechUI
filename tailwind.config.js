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
        graphite: {
          950: '#0d0f12',
          900: '#12151a',
          800: '#171b22',
          700: '#1d2128',
          600: '#252a34',
          500: '#2d323e',
        },
        charcoal: {
          950: '#0a0c0f',
          900: '#0e1115',
          800: '#13161b',
          700: '#181c22',
          600: '#1f2329',
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
        steel: {
          blue: '#5b6b7a',
          muted: '#4a5568',
          soft: '#64748b',
        },
        accent: {
          primary: '#475569',
          primaryDark: '#334155',
          secondary: '#10b981',
          secondaryDark: '#059669',
          success: '#10b981',
          error: '#ef4444',
          warning: '#f59e0b',
          cyan: '#06b6d4',
          cyanMuted: '#0891b2',
        },
        fintech: {
          slate: '#475569',
          slateDark: '#334155',
          slateMuted: '#64748b',
          institutional: '#1e293b',
          professional: '#3f4652',
          graphite: '#2d323e',
        },
      },
      boxShadow: {
        glow: '0 0 32px -8px rgba(100, 116, 139, 0.20)',
        'glow-success': '0 0 32px -8px rgba(16, 185, 129, 0.20)',
        'glow-cyan': '0 0 32px -8px rgba(6, 182, 212, 0.18)',
        soft: '0 6px 24px rgba(0, 0, 0, 0.40)',
        card: '0 4px 20px rgba(0, 0, 0, 0.30)',
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

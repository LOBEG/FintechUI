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
          950: '#05070d',
          900: '#070b16',
          800: '#0b1224',
          700: '#0f1830',
          600: '#13203d',
        },
        navy: {
          900: '#0b1530',
          950: '#070d22',
        },
        gold: {
          50: '#fff8e1',
          100: '#ffeeb0',
          200: '#ffe187',
          300: '#fdd05a',
          400: '#f6c244',
          500: '#e6ad26',
          600: '#c08a14',
          700: '#8d6310',
        },
        neon: {
          green: '#00ffa3',
          greenDark: '#00c98b',
          orange: '#ff8a00',
          orangeDark: '#ff6a00',
          red: '#ff4d6d',
        },
        cyan: '#06d6c4',
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(0, 255, 163, 0.35)',
        gold: '0 0 40px -10px rgba(230, 173, 38, 0.45)',
        soft: '0 8px 30px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'gradient-radial':
          'radial-gradient(ellipse at top, rgba(0,255,163,0.10), transparent 50%), radial-gradient(ellipse at bottom right, rgba(230,173,38,0.10), transparent 50%)',
        'gold-grad':
          'linear-gradient(135deg, #fff3c0 0%, #e6ad26 40%, #8d6310 100%)',
        'neon-grad':
          'linear-gradient(135deg, #00ffa3 0%, #00c98b 50%, #ff8a00 100%)',
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

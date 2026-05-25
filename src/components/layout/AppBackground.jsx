'use client';
// Institutional-grade layered background with a subtle vault mesh, market-depth
// blooms and a noise overlay. No network requests.
//
// Each top-level route renders a distinct palette that shares deep graphite /
// charcoal base tones with muted emerald, teal, or slate accents. Blue is
// intentionally avoided — only low-opacity slate/steel-blue is permitted.
// No gold, no neon, no purple/indigo dominance.
import { usePathname } from 'next/navigation';

const NOISE_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter>" +
  "<rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>";

// Per-route palettes keyed by the first path segment.
// All palettes use institutional graphite / charcoal / slate tones.
// Accent blooms are subtle (≤0.14 opacity) — no blue dominance, no gold, no neon.
const PALETTES = {
  // Landing page — deep graphite with soft emerald & steel undertones
  default: {
    base: 'linear-gradient(145deg, #090d12 0%, #111820 50%, #090c14 100%)',
    a: 'rgba(100, 116, 139, 0.10)',
    b: 'rgba(16, 185, 129, 0.07)',
    grid: 'rgba(148, 163, 184, 0.035)'
  },
  // Brokerage hub — charcoal with muted steel-cyan accent
  brokerage: {
    base: 'linear-gradient(145deg, #090e16 0%, #111a28 50%, #090c14 100%)',
    a: 'rgba(71, 85, 105, 0.13)',
    b: 'rgba(6, 182, 212, 0.08)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Dashboard — deep graphite with soft emerald market accent
  dashboard: {
    base: 'linear-gradient(145deg, #090e14 0%, #111c24 50%, #090c12 100%)',
    a: 'rgba(16, 185, 129, 0.11)',
    b: 'rgba(71, 85, 105, 0.08)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Admin console — very dark with subtle rose/slate tension
  admin: {
    base: 'linear-gradient(145deg, #140e18 0%, #1a1224 50%, #0c0a12 100%)',
    a: 'rgba(244, 63, 94, 0.10)',
    b: 'rgba(100, 116, 139, 0.08)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Investor portal — charcoal with muted slate
  investor: {
    base: 'linear-gradient(145deg, #090d18 0%, #111828 50%, #090c14 100%)',
    a: 'rgba(100, 116, 139, 0.12)',
    b: 'rgba(71, 85, 105, 0.07)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Insights — deep graphite with teal data accent
  insights: {
    base: 'linear-gradient(145deg, #090e14 0%, #111c24 50%, #090c12 100%)',
    a: 'rgba(20, 184, 166, 0.11)',
    b: 'rgba(100, 116, 139, 0.07)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // About — neutral dark slate
  about: {
    base: 'linear-gradient(145deg, #0c0c18 0%, #141428 50%, #0a0a14 100%)',
    a: 'rgba(100, 116, 139, 0.11)',
    b: 'rgba(71, 85, 105, 0.07)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Careers — dark with subtle green depth
  careers: {
    base: 'linear-gradient(145deg, #091612 0%, #12261e 50%, #091012 100%)',
    a: 'rgba(16, 185, 129, 0.11)',
    b: 'rgba(20, 184, 166, 0.07)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Press — neutral dark
  press: {
    base: 'linear-gradient(145deg, #0c0c18 0%, #141428 50%, #0a0a14 100%)',
    a: 'rgba(100, 116, 139, 0.10)',
    b: 'rgba(71, 85, 105, 0.07)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Institutional — deep charcoal with slate steel
  institutional: {
    base: 'linear-gradient(145deg, #090d16 0%, #111a26 50%, #090c12 100%)',
    a: 'rgba(100, 116, 139, 0.12)',
    b: 'rgba(16, 185, 129, 0.07)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Futures — deep teal-charcoal
  futures: {
    base: 'linear-gradient(145deg, #091014 0%, #121e24 50%, #090e12 100%)',
    a: 'rgba(20, 184, 166, 0.11)',
    b: 'rgba(6, 182, 212, 0.07)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Spot trading — charcoal with muted cyan
  'spot-trading': {
    base: 'linear-gradient(145deg, #090e14 0%, #121e28 50%, #090c12 100%)',
    a: 'rgba(6, 182, 212, 0.10)',
    b: 'rgba(16, 185, 129, 0.07)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Managed accounts — dark with emerald
  'managed-accounts': {
    base: 'linear-gradient(145deg, #091612 0%, #12261e 50%, #091012 100%)',
    a: 'rgba(16, 185, 129, 0.11)',
    b: 'rgba(6, 182, 212, 0.07)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // AI trading bot — graphite with subtle cyan
  'ai-trading-bot': {
    base: 'linear-gradient(145deg, #090e14 0%, #111c28 50%, #090c12 100%)',
    a: 'rgba(6, 182, 212, 0.10)',
    b: 'rgba(100, 116, 139, 0.07)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Legal — flat dark slate
  legal: {
    base: 'linear-gradient(145deg, #0c0c18 0%, #141428 50%, #0a0a14 100%)',
    a: 'rgba(148, 163, 184, 0.08)',
    b: 'rgba(100, 116, 139, 0.05)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Login — dark graphite with subtle green
  login: {
    base: 'linear-gradient(145deg, #090e14 0%, #111c28 50%, #090c12 100%)',
    a: 'rgba(16, 185, 129, 0.10)',
    b: 'rgba(100, 116, 139, 0.07)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Signup — dark graphite with soft emerald
  signup: {
    base: 'linear-gradient(145deg, #091210 0%, #122820 50%, #091010 100%)',
    a: 'rgba(16, 185, 129, 0.12)',
    b: 'rgba(20, 184, 166, 0.07)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Forgot password — neutral dark graphite
  'forgot-password': {
    base: 'linear-gradient(145deg, #090e14 0%, #111c24 50%, #090c12 100%)',
    a: 'rgba(100, 116, 139, 0.10)',
    b: 'rgba(71, 85, 105, 0.07)',
    grid: 'rgba(148, 163, 184, 0.04)'
  },
  // Reset password — neutral dark graphite
  'reset-password': {
    base: 'linear-gradient(145deg, #090e14 0%, #111c24 50%, #090c12 100%)',
    a: 'rgba(100, 116, 139, 0.10)',
    b: 'rgba(71, 85, 105, 0.07)',
    grid: 'rgba(148, 163, 184, 0.04)'
  }
};

function paletteForPath(pathname) {
  if (!pathname || pathname === '/') return PALETTES.default;
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  return PALETTES[seg] || PALETTES.default;
}

export function AppBackground() {
  const pathname = usePathname();
  const p = paletteForPath(pathname);
  return (
    <div aria-hidden="true" className="app-bg" suppressHydrationWarning>
      <div
        className="app-bg__base"
        style={{
          background: `radial-gradient(90vw 70vh at 78% 0%, ${p.a}, transparent 62%), radial-gradient(80vw 70vh at 0% 20%, ${p.b}, transparent 64%), ${p.base}`
        }}
      />
      <div
        className="app-bg__blooms"
        style={{
          background: `radial-gradient(36vw 24vw at 18% 22%, ${p.a}, transparent 70%), radial-gradient(34vw 22vw at 84% 34%, ${p.b}, transparent 70%), radial-gradient(42vw 26vw at 55% 84%, rgba(15, 23, 42, 0.35), transparent 70%)`
        }}
      />
      <div
        className="app-bg__grid"
        style={{
          backgroundImage: `linear-gradient(${p.grid} 1px, transparent 1px), linear-gradient(90deg, ${p.grid} 1px, transparent 1px), linear-gradient(125deg, transparent 20%, rgba(255,255,255,0.04) 50%, transparent 80%)`
        }}
      />
      <div
        className="app-bg__noise"
        style={{ backgroundImage: `url("${NOISE_SVG}")` }}
      />
      <style jsx>{`
        .app-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
          contain: strict;
        }
        .app-bg > div { position: absolute; inset: 0; }
        .app-bg__blooms {
          filter: blur(76px) saturate(110%);
          opacity: 0.65;
          will-change: transform;
        }
        .app-bg__grid {
          background-size: 54px 54px, 54px 54px, 100% 100%;
          mask-image: radial-gradient(circle at 50% 24%, black, transparent 74%);
          opacity: 0.42;
        }
        .app-bg__noise {
          opacity: 0.05;
          mix-blend-mode: overlay;
          background-repeat: repeat;
          background-size: 160px 160px;
        }
        @media (prefers-reduced-motion: no-preference) {
          .app-bg__blooms {
            animation: app-bg-drift 40s ease-in-out infinite alternate;
          }
        }
        @keyframes app-bg-drift {
          0%   { transform: translate3d(-2%, -1%, 0) scale(1.02); }
          100% { transform: translate3d(2%, 1.5%, 0) scale(1.06); }
        }
        @media print {
          .app-bg { display: none !important; }
        }
      `}</style>
    </div>
  );
}

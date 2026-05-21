'use client';
// Fintech-grade layered background with a darker vault mesh, market-depth
// beams and a subtle noise overlay with no network requests.
//
// Each top-level route renders a distinct, fresh palette so pages no longer
// share a single background look. All palettes intentionally avoid gold and
// muted-yellow tones in favour of clean cyan / emerald / indigo / rose
// market accents.
import { usePathname } from 'next/navigation';

const NOISE_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter>" +
  "<rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>";

// Per-route palettes keyed by the first path segment.
const PALETTES = {
  default: {
    base: 'linear-gradient(145deg, #060d18 0%, #0d1b2c 50%, #050a14 100%)',
    a: 'rgba(6, 214, 196, 0.16)',
    b: 'rgba(16, 185, 129, 0.10)',
    grid: 'rgba(231, 229, 228, 0.04)'
  },
  brokerage: {
    base: 'linear-gradient(145deg, #050a1e 0%, #0e1a3a 50%, #060a1c 100%)',
    a: 'rgba(59, 130, 246, 0.18)',
    b: 'rgba(6, 214, 196, 0.12)',
    grid: 'rgba(180, 198, 255, 0.05)'
  },
  dashboard: {
    base: 'linear-gradient(145deg, #06121a 0%, #0b1f24 50%, #050c11 100%)',
    a: 'rgba(16, 185, 129, 0.18)',
    b: 'rgba(6, 214, 196, 0.10)',
    grid: 'rgba(220, 252, 231, 0.05)'
  },
  admin: {
    base: 'linear-gradient(145deg, #1a0712 0%, #1b1224 50%, #0b0712 100%)',
    a: 'rgba(244, 63, 94, 0.16)',
    b: 'rgba(99, 102, 241, 0.12)',
    grid: 'rgba(254, 226, 226, 0.05)'
  },
  investor: {
    base: 'linear-gradient(145deg, #050e22 0%, #0a1a36 50%, #050a18 100%)',
    a: 'rgba(99, 102, 241, 0.18)',
    b: 'rgba(6, 214, 196, 0.10)',
    grid: 'rgba(199, 210, 254, 0.05)'
  },
  insights: {
    base: 'linear-gradient(145deg, #07111a 0%, #0c1c28 50%, #050a10 100%)',
    a: 'rgba(20, 184, 166, 0.18)',
    b: 'rgba(59, 130, 246, 0.10)',
    grid: 'rgba(204, 251, 241, 0.05)'
  },
  about: {
    base: 'linear-gradient(145deg, #0b0b14 0%, #14141f 50%, #08080e 100%)',
    a: 'rgba(168, 85, 247, 0.14)',
    b: 'rgba(6, 214, 196, 0.10)',
    grid: 'rgba(233, 213, 255, 0.05)'
  },
  careers: {
    base: 'linear-gradient(145deg, #051a15 0%, #0a2a23 50%, #04100d 100%)',
    a: 'rgba(16, 185, 129, 0.18)',
    b: 'rgba(20, 184, 166, 0.10)',
    grid: 'rgba(209, 250, 229, 0.05)'
  },
  press: {
    base: 'linear-gradient(145deg, #0a0a14 0%, #15151e 50%, #07070c 100%)',
    a: 'rgba(6, 182, 212, 0.16)',
    b: 'rgba(99, 102, 241, 0.10)',
    grid: 'rgba(207, 250, 254, 0.05)'
  },
  institutional: {
    base: 'linear-gradient(145deg, #050d18 0%, #0d1a2a 50%, #050911 100%)',
    a: 'rgba(56, 189, 248, 0.16)',
    b: 'rgba(16, 185, 129, 0.10)',
    grid: 'rgba(186, 230, 253, 0.05)'
  },
  futures: {
    base: 'linear-gradient(145deg, #051418 0%, #0a2128 50%, #040d10 100%)',
    a: 'rgba(20, 184, 166, 0.18)',
    b: 'rgba(6, 214, 196, 0.10)',
    grid: 'rgba(204, 251, 241, 0.05)'
  },
  'spot-trading': {
    base: 'linear-gradient(145deg, #04121a 0%, #0a2230 50%, #050b10 100%)',
    a: 'rgba(6, 214, 196, 0.18)',
    b: 'rgba(16, 185, 129, 0.10)',
    grid: 'rgba(207, 250, 254, 0.05)'
  },
  'managed-accounts': {
    base: 'linear-gradient(145deg, #051a14 0%, #0a2a23 50%, #040d0b 100%)',
    a: 'rgba(16, 185, 129, 0.18)',
    b: 'rgba(6, 214, 196, 0.10)',
    grid: 'rgba(209, 250, 229, 0.05)'
  },
  'ai-trading-bot': {
    base: 'linear-gradient(145deg, #06121d 0%, #0d1c30 50%, #050911 100%)',
    a: 'rgba(6, 214, 196, 0.18)',
    b: 'rgba(59, 130, 246, 0.10)',
    grid: 'rgba(186, 230, 253, 0.05)'
  },
  legal: {
    base: 'linear-gradient(145deg, #0b0b14 0%, #16161f 50%, #08080e 100%)',
    a: 'rgba(148, 163, 184, 0.14)',
    b: 'rgba(6, 214, 196, 0.08)',
    grid: 'rgba(226, 232, 240, 0.05)'
  },
  login: {
    base: 'linear-gradient(145deg, #04101a 0%, #08203a 50%, #03070f 100%)',
    a: 'rgba(6, 214, 196, 0.20)',
    b: 'rgba(59, 130, 246, 0.10)',
    grid: 'rgba(207, 250, 254, 0.05)'
  },
  signup: {
    base: 'linear-gradient(145deg, #04141a 0%, #08322a 50%, #030f0c 100%)',
    a: 'rgba(16, 185, 129, 0.22)',
    b: 'rgba(6, 214, 196, 0.10)',
    grid: 'rgba(209, 250, 229, 0.05)'
  },
  'forgot-password': {
    base: 'linear-gradient(145deg, #08101a 0%, #0e1a2a 50%, #050a11 100%)',
    a: 'rgba(99, 102, 241, 0.18)',
    b: 'rgba(6, 214, 196, 0.10)',
    grid: 'rgba(199, 210, 254, 0.05)'
  },
  'reset-password': {
    base: 'linear-gradient(145deg, #08101a 0%, #0e1a2a 50%, #050a11 100%)',
    a: 'rgba(99, 102, 241, 0.18)',
    b: 'rgba(6, 214, 196, 0.10)',
    grid: 'rgba(199, 210, 254, 0.05)'
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

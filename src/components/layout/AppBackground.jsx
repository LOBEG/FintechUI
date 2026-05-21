'use client';
// Fintech-grade layered background with a darker vault mesh, market-depth
// beams and a subtle noise overlay with no network requests.
//
// One slow ~40s drift animation is opt-in via prefers-reduced-motion.

const NOISE_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter>" +
  "<rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>";

export function AppBackground() {
  return (
    <div aria-hidden="true" className="app-bg" suppressHydrationWarning>
      <div className="app-bg__base"/>
      <div className="app-bg__blooms"/>
      <div className="app-bg__grid"/>
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
        .app-bg__base {
          background:
            linear-gradient(118deg, rgba(120, 113, 108, 0.12) 0%, transparent 30%),
            linear-gradient(252deg, rgba(16, 185, 129, 0.08) 0%, transparent 32%),
            radial-gradient(90vw 70vh at 78% 0%, rgba(16, 185, 129, 0.08), transparent 62%),
            radial-gradient(80vw 70vh at 0% 20%, rgba(120, 113, 108, 0.10), transparent 64%),
            linear-gradient(145deg, #0b0b0c 0%, #161618 52%, #0a0a0b 100%);
        }
        .app-bg__blooms {
          background:
            radial-gradient(36vw 24vw at 18% 22%, rgba(120, 113, 108, 0.14), transparent 70%),
            radial-gradient(34vw 22vw at 84% 34%, rgba(16, 185, 129, 0.10), transparent 70%),
            radial-gradient(42vw 26vw at 55% 84%, rgba(63, 63, 70, 0.18), transparent 70%);
          filter: blur(76px) saturate(110%);
          opacity: 0.65;
          will-change: transform;
        }
        .app-bg__grid {
          background-image:
            linear-gradient(rgba(231, 229, 228, 0.04) 1px, transparent 1px),
             linear-gradient(90deg, rgba(231, 229, 228, 0.04) 1px, transparent 1px),
            linear-gradient(125deg, transparent 20%, rgba(255,255,255,0.04) 50%, transparent 80%);
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

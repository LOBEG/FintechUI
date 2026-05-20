'use client';
// Fintech-grade layered background. Sits behind every page content (z-index:0,
// fixed, pointer-events:none) and is intentionally pure CSS - radial +
// conic gradients with a subtle SVG noise overlay - so it adds no
// network requests and no JS to the bundle. Cards/text remain fully
// legible because every bloom is capped at ≤18% opacity over the deep
// navy base.
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
      <div className="app-bg__conic"/>
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
            radial-gradient(120vw 80vh at 80% -10%, rgba(34, 211, 238, 0.14), transparent 60%),
            radial-gradient(110vw 70vh at -10% 10%, rgba(139, 92, 246, 0.16), transparent 60%),
            radial-gradient(90vw 60vh at 50% 120%, rgba(16, 185, 129, 0.12), transparent 60%),
            radial-gradient(70vw 50vh at 15% 90%, rgba(201, 162, 74, 0.13), transparent 60%),
            radial-gradient(80vw 55vh at 95% 60%, rgba(34, 211, 238, 0.10), transparent 60%),
            linear-gradient(160deg, #050816 0%, #070b1a 50%, #060a18 100%);
        }
        .app-bg__blooms {
          background:
            radial-gradient(40vw 28vw at 20% 20%, rgba(201, 162, 74, 0.18), transparent 65%),
            radial-gradient(35vw 25vw at 75% 35%, rgba(34, 211, 238, 0.15), transparent 65%),
            radial-gradient(45vw 30vw at 60% 85%, rgba(139, 92, 246, 0.16), transparent 65%),
            radial-gradient(30vw 22vw at 10% 70%, rgba(16, 185, 129, 0.14), transparent 65%);
          filter: blur(60px) saturate(115%);
          opacity: 0.85;
          will-change: transform;
        }
        .app-bg__conic {
          background: conic-gradient(
            from 210deg at 70% 30%,
            rgba(34, 211, 238, 0.08) 0deg,
            rgba(139, 92, 246, 0.10) 90deg,
            rgba(201, 162, 74, 0.08) 180deg,
            rgba(16, 185, 129, 0.08) 270deg,
            rgba(34, 211, 238, 0.08) 360deg
          );
          filter: blur(80px);
          opacity: 0.55;
          mix-blend-mode: screen;
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

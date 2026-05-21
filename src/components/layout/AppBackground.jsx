'use client';
// Fintech-grade layered background. The new style uses angled aurora beams,
// soft mesh depth and a subtle noise overlay with no network requests.
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
            linear-gradient(120deg, rgba(216, 167, 66, 0.16) 0%, transparent 28%),
            linear-gradient(300deg, rgba(0, 255, 163, 0.10) 0%, transparent 34%),
            radial-gradient(100vw 70vh at 80% -10%, rgba(56, 189, 248, 0.13), transparent 62%),
            radial-gradient(90vw 70vh at -5% 18%, rgba(216, 167, 66, 0.12), transparent 64%),
            radial-gradient(95vw 65vh at 50% 120%, rgba(15, 23, 42, 0.9), transparent 58%),
            linear-gradient(150deg, #020713 0%, #07111f 48%, #030815 100%);
        }
        .app-bg__blooms {
          background:
            radial-gradient(45vw 26vw at 22% 18%, rgba(216, 167, 66, 0.20), transparent 68%),
            radial-gradient(35vw 22vw at 82% 30%, rgba(34, 211, 238, 0.16), transparent 68%),
            radial-gradient(38vw 26vw at 56% 82%, rgba(0, 255, 163, 0.12), transparent 68%);
          filter: blur(70px) saturate(120%);
          opacity: 0.85;
          will-change: transform;
        }
        .app-bg__conic {
          background: conic-gradient(
             from 140deg at 68% 24%,
             rgba(216, 167, 66, 0.10) 0deg,
             rgba(56, 189, 248, 0.09) 100deg,
             rgba(0, 255, 163, 0.08) 210deg,
             rgba(216, 167, 66, 0.10) 360deg
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

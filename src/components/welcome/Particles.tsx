import { useMemo } from "react";

interface ParticlesProps {
  count?: number;
  color?: string;
  className?: string;
}

export function Particles({ count = 60, color = "oklch(0.85 0.01 250 / 0.5)", className = "" }: ParticlesProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 0.5,
        delay: Math.random() * 12,
        duration: 8 + Math.random() * 12,
        opacity: 0.2 + Math.random() * 0.6,
      })),
    [count],
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full animate-drift"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: color,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 4}px ${color}`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
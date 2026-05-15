interface RadarSweepProps {
  size?: number;
  className?: string;
}

export function RadarSweep({ size = 600, className = "" }: RadarSweepProps) {
  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Concentric rings */}
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <div
          key={r}
          className="absolute rounded-full border"
          style={{
            inset: `${(1 - r) * 50}%`,
            borderColor: "oklch(0.68 0.28 25 / 0.18)",
          }}
        />
      ))}
      {/* Cross lines */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[oklch(0.68_0.28_25/0.12)]" />
        <div className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2 bg-[oklch(0.68_0.28_25/0.12)]" />
      </div>
      {/* Sweep */}
      <div
        className="absolute inset-0 animate-radar rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, oklch(0.68 0.28 25 / 0.45) 30deg, transparent 60deg)",
          maskImage: "radial-gradient(circle, black 0%, black 50%, transparent 50%)",
          WebkitMaskImage: "radial-gradient(circle, black 0%, black 50%, transparent 50%)",
        }}
      />
    </div>
  );
}
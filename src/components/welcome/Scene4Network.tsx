import { motion } from "framer-motion";
import { AIOrb } from "./AIOrb";
import { Particles } from "./Particles";
import { RadarSweep } from "./RadarSweep";

export function Scene4Network() {
  const nodes = [
    [150, 200], [320, 140], [480, 220], [640, 160], [820, 240],
    [220, 380], [420, 440], [600, 400], [780, 460], [340, 300],
  ];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: "blur(20px)" }}
      transition={{ duration: 1.4 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.15 0.05 250 / 0.6) 0%, #000 70%)",
        }}
      />
      <div className="absolute inset-0 grid-overlay opacity-40" />

      {/* World network */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
        {nodes.flatMap((n1, i) =>
          nodes.slice(i + 1).map((n2, j) => {
            const dist = Math.hypot(n1[0] - n2[0], n1[1] - n2[1]);
            if (dist > 280) return null;
            return (
              <motion.line
                key={`${i}-${j}`}
                x1={n1[0]} y1={n1[1]} x2={n2[0]} y2={n2[1]}
                stroke="oklch(0.68 0.28 25 / 0.35)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.3 + (i + j) * 0.05 }}
              />
            );
          }),
        )}
        {nodes.map(([cx, cy], i) => (
          <motion.g key={i}>
            <motion.circle
              cx={cx} cy={cy} r="14"
              fill="oklch(0.68 0.28 25 / 0.2)"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.4, 1] }}
              transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
            />
            <motion.circle
              cx={cx} cy={cy} r="4"
              fill="oklch(0.85 0.2 25)"
              style={{ filter: "drop-shadow(0 0 6px oklch(0.78 0.28 25))" }}
              initial={{ scale: 0 }}
              animate={{ scale: 1, opacity: [0.6, 1, 0.6] }}
              transition={{
                scale: { duration: 0.5, delay: 0.7 + i * 0.1 },
                opacity: { duration: 2, repeat: Infinity, delay: i * 0.2 },
              }}
            />
          </motion.g>
        ))}
      </svg>

      <RadarSweep size={500} className="opacity-50" />
      <Particles count={50} color="oklch(0.78 0.28 25 / 0.5)" />

      {/* Floating orb above */}
      <motion.div
        className="relative z-10 -mt-20"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.8 }}
      >
        <AIOrb size={180} intensity={0.7} />
      </motion.div>

      {/* Text */}
      <motion.div
        className="absolute bottom-[14%] left-1/2 -translate-x-1/2 text-center"
        initial={{ opacity: 0, y: 20, filter: "blur(20px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 2, delay: 1.5 }}
      >
        <h2 className="font-display text-4xl md:text-6xl font-light tracking-tight text-silver text-glow-crimson">
          Connected Protection.
        </h2>
        <p className="mt-3 font-display text-sm md:text-base uppercase tracking-[0.5em] text-silver/60">
          Anywhere. Anytime.
        </p>
      </motion.div>

      <div className="absolute inset-0 cinematic-vignette pointer-events-none" />
    </motion.div>
  );
}
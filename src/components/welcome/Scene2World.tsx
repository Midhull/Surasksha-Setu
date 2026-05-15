import { motion } from "framer-motion";
import { Particles } from "./Particles";
import { RadarSweep } from "./RadarSweep";

export function Scene2World() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }}
      transition={{ duration: 1.4 }}
    >
      {/* Rain streaks */}
      <div className="absolute inset-0 opacity-40">
        {Array.from({ length: 80 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-px bg-gradient-to-b from-transparent via-silver/60 to-transparent"
            style={{
              left: `${Math.random() * 100}%`,
              height: `${20 + Math.random() * 40}px`,
            }}
            initial={{ y: -100 }}
            animate={{ y: "100vh" }}
            transition={{
              duration: 0.8 + Math.random() * 0.6,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Atmospheric fog */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 70%, oklch(0.3 0.1 22 / 0.5), transparent 50%), radial-gradient(ellipse at 70% 30%, oklch(0.15 0.08 250 / 0.4), transparent 60%)",
        }}
      />

      <div className="absolute inset-0 grid-overlay opacity-30" />

      {/* World map silhouette with nodes */}
      <div className="relative w-full h-full flex items-center justify-center">
        <RadarSweep size={700} className="opacity-60" />

        {/* Network connection nodes */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
          {[
            [200, 250, 500, 300],
            [500, 300, 780, 200],
            [500, 300, 350, 450],
            [500, 300, 700, 420],
            [200, 250, 350, 450],
          ].map(([x1, y1, x2, y2], i) => (
            <motion.line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="oklch(0.68 0.28 25 / 0.5)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.5 + i * 0.2 }}
            />
          ))}
          {[[200, 250], [500, 300], [780, 200], [350, 450], [700, 420]].map(([cx, cy], i) => (
            <motion.circle
              key={i}
              cx={cx} cy={cy} r="6"
              fill="oklch(0.78 0.28 25)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: 1 }}
              transition={{ duration: 1, delay: 1 + i * 0.15 }}
              style={{ filter: "drop-shadow(0 0 8px oklch(0.78 0.28 25))" }}
            />
          ))}
        </svg>
      </div>

      <Particles count={40} color="oklch(0.78 0.28 25 / 0.6)" />

      {/* Headline */}
      <motion.div
        className="absolute top-[15%] left-1/2 -translate-x-1/2 text-center px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.8 }}
      >
        <p className="font-display text-xs md:text-sm uppercase tracking-[0.4em] text-crimson-glow mb-3">
          / Live Threat Network
        </p>
        <h2 className="font-display text-3xl md:text-5xl font-light tracking-tight text-silver text-balance max-w-2xl">
          Every second, somewhere — someone needs help.
        </h2>
      </motion.div>

      <div className="absolute inset-0 cinematic-vignette pointer-events-none" />
    </motion.div>
  );
}
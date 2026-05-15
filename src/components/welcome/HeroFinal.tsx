import { motion } from "framer-motion";
import { useState, useRef, MouseEvent } from "react";
import { AIOrb } from "./AIOrb";
import { Particles } from "./Particles";
import { RadarSweep } from "./RadarSweep";

interface HeroFinalProps {
  onEnter: () => void;
}

export function HeroFinal({ onEnter }: HeroFinalProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    setTilt({ x: x * 8, y: y * 8 });
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const id = Date.now();
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 1000);
    setTimeout(onEnter, 600);
  };

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      {/* Atmospheric layers */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, oklch(0.18 0.08 22 / 0.6) 0%, oklch(0.08 0.03 250 / 0.8) 40%, #000 80%)",
        }}
      />
      <div className="absolute inset-0 grid-overlay opacity-30" />

      {/* World radar background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40">
        <RadarSweep size={900} />
      </div>

      <Particles count={70} color="oklch(0.78 0.2 25 / 0.5)" />

      {/* Centerpiece */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        >
          <AIOrb size={200} />
        </motion.div>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 30, filter: "blur(20px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.6, delay: 0.6 }}
        >
          <p className="font-display text-xs uppercase tracking-[0.6em] text-crimson-glow mb-4">
            / AI Protection System · v1.0
          </p>
          <h1 className="font-display text-6xl md:text-8xl font-light tracking-[-0.02em] text-silver text-glow-crimson">
            Suraksha
            <span className="text-crimson-glow">·</span>
            Setu
          </h1>
          <p className="mt-6 font-display text-base md:text-lg font-light tracking-[0.3em] uppercase text-silver/70">
            AI-Powered Emergency Response System
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          ref={btnRef}
          onMouseMove={handleMove}
          onMouseLeave={() => setTilt({ x: 0, y: 0 })}
          onClick={handleClick}
          className="relative mt-14 group glass-panel rounded-full px-12 py-5 overflow-hidden cursor-pointer"
          style={{
            transform: `perspective(800px) rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg)`,
            transition: "transform 0.3s ease-out",
            boxShadow:
              "0 0 40px oklch(0.58 0.24 22 / 0.4), inset 0 0 20px oklch(0.78 0.28 25 / 0.15)",
          }}
          initial={{ opacity: 0, y: 40 }}
          animate={{
            opacity: 1,
            y: 0,
            boxShadow: [
              "0 0 40px oklch(0.58 0.24 22 / 0.3), inset 0 0 20px oklch(0.78 0.28 25 / 0.15)",
              "0 0 70px oklch(0.58 0.24 22 / 0.6), inset 0 0 30px oklch(0.78 0.28 25 / 0.25)",
              "0 0 40px oklch(0.58 0.24 22 / 0.3), inset 0 0 20px oklch(0.78 0.28 25 / 0.15)",
            ],
          }}
          transition={{
            opacity: { duration: 1.4, delay: 1.4 },
            y: { duration: 1.4, delay: 1.4 },
            boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Light sweep */}
          <span
            className="absolute inset-0 animate-light-sweep pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent 35%, oklch(1 0 0 / 0.18) 50%, transparent 65%)",
            }}
          />
          <span className="relative flex items-center gap-3 font-display text-sm uppercase tracking-[0.4em] text-silver">
            <span className="w-2 h-2 rounded-full bg-crimson-glow shadow-[0_0_10px_oklch(0.78_0.28_25)] animate-pulse" />
            Enter Safety Network
            <span className="text-crimson-glow">→</span>
          </span>
          {/* Ripples */}
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: r.x, top: r.y,
                background: "oklch(0.78 0.28 25 / 0.5)",
                width: 10, height: 10, marginLeft: -5, marginTop: -5,
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 60, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          ))}
        </motion.button>

        <motion.p
          className="mt-8 text-xs tracking-[0.3em] uppercase text-silver/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
        >
          End-to-end encrypted · 24/7 monitored · Always with you
        </motion.p>
      </div>

      <div className="absolute inset-0 cinematic-vignette pointer-events-none" />
    </motion.div>
  );
}
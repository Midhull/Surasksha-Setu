import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function Scene3SOS() {
  const [count, setCount] = useState(3);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => (c > 1 ? c - 1 : c));
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, x: [0, -3, 4, -2, 0] }}
      exit={{ opacity: 0, filter: "blur(30px)" }}
      transition={{ duration: 1.2, x: { duration: 0.6, delay: 0.3 } }}
    >
      {/* Crimson energy wash */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "var(--gradient-crimson)" }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.9, scale: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Shockwave rings */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{
            borderColor: "oklch(0.78 0.28 25 / 0.6)",
            width: 200, height: 200,
          }}
          initial={{ scale: 0.2, opacity: 1 }}
          animate={{ scale: 8, opacity: 0 }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
        />
      ))}

      {/* SOS Core */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center"
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="relative w-[280px] h-[280px] rounded-full flex items-center justify-center"
          style={{
            background:
              "radial-gradient(circle, oklch(0.85 0.28 25) 0%, oklch(0.45 0.25 22) 60%, transparent 80%)",
            boxShadow: "0 0 120px oklch(0.78 0.28 25 / 0.9), inset 0 0 80px oklch(0.3 0.2 22 / 0.6)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={count}
              className="font-display font-thin text-[12rem] leading-none text-white"
              style={{ textShadow: "0 0 60px oklch(1 0 0 / 0.8)" }}
              initial={{ scale: 2, opacity: 0, filter: "blur(30px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: 0.5, opacity: 0, filter: "blur(20px)" }}
              transition={{ duration: 0.6 }}
            >
              {count}
            </motion.span>
          </AnimatePresence>
        </div>
        <motion.p
          className="mt-8 font-display text-sm uppercase tracking-[0.6em] text-white/90"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          SOS · Activating
        </motion.p>
      </motion.div>

      <div className="absolute inset-0 cinematic-vignette pointer-events-none opacity-80" />
    </motion.div>
  );
}
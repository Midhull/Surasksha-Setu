import { motion } from "framer-motion";
import { AIOrb } from "./AIOrb";
import { Particles } from "./Particles";

export function Scene1Awakening() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(20px)" }}
      transition={{ duration: 1.2 }}
    >
      {/* Ambient fog */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, oklch(0.2 0.05 22 / 0.4) 0%, transparent 60%)",
        }}
      />
      <Particles count={50} color="oklch(0.68 0.28 25 / 0.4)" />

      {/* Tiny red light grows into orb */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 3.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <AIOrb size={260} />
      </motion.div>

      {/* Text */}
      <motion.div
        className="absolute bottom-[14%] left-1/2 -translate-x-1/2 text-center"
        initial={{ opacity: 0, y: 30, filter: "blur(20px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 2, delay: 3, ease: "easeOut" }}
      >
        <p className="font-display text-3xl md:text-5xl font-light tracking-[0.15em] text-silver/90 text-glow-crimson">
          Protection should never wait.
        </p>
      </motion.div>

      <div className="absolute inset-0 cinematic-vignette pointer-events-none" />
    </motion.div>
  );
}
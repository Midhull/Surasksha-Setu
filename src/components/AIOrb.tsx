import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

type OrbState = "idle" | "listening" | "emergency" | "safe";

interface AIOrbProps {
  state: OrbState;
  size?: "sm" | "md" | "lg";
}

export function AIOrb({ state, size = "md" }: AIOrbProps) {
  const sizeMap = {
    sm: "w-24 h-24",
    md: "w-48 h-48",
    lg: "w-64 h-64",
  };

  const colorMap = {
    idle: "oklch(0.58 0.24 22 / 0.3)", // Soft Crimson
    listening: "oklch(0.7 0.1 220 / 0.4)", // Soft Blue
    emergency: "oklch(0.58 0.24 22 / 0.8)", // Intense Crimson
    safe: "oklch(0.8 0.1 150 / 0.3)", // Soft Emerald
  };

  return (
    <div className={`relative ${sizeMap[size]} flex items-center justify-center`}>
      {/* Background Glows */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 rounded-full blur-[60px]"
          style={{ backgroundColor: colorMap[state] }}
        />
      </AnimatePresence>

      {/* Core Orb */}
      <motion.div
        animate={
          state === "emergency"
            ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
            : state === "listening"
            ? { scale: [1, 1.05, 1], y: [0, -10, 0] }
            : { y: [0, -15, 0] }
        }
        transition={{
          duration: state === "emergency" ? 0.5 : 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`relative z-10 w-full h-full rounded-full glass-panel border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl`}
      >
        {/* Animated Inner Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.1),transparent)]" />
        
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: state === "emergency" ? 2 : 10,
            repeat: Infinity,
            linear: true,
          }}
          className="absolute inset-0 opacity-40"
          style={{
            background: `conic-gradient(from 0deg, transparent, ${colorMap[state]}, transparent)`,
          }}
        />

        {/* Inner Core */}
        <div className="w-1/3 h-1/3 rounded-full bg-white/5 blur-sm border border-white/20 relative">
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="absolute inset-0 bg-crimson-glow rounded-full"
            style={{ backgroundColor: state === 'safe' ? '#10b981' : state === 'listening' ? '#3b82f6' : '#ff3b3b' }}
          />
        </div>
      </motion.div>

      {/* Outer Rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.5 + i * 0.2],
            opacity: [0.3, 0],
          }}
          transition={{
            duration: state === "emergency" ? 1 : 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut",
          }}
          className="absolute inset-0 border border-white/10 rounded-full pointer-events-none"
        />
      ))}
    </div>
  );
}

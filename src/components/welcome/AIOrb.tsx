import { motion } from "framer-motion";

interface AIOrbProps {
  size?: number;
  intensity?: number;
  isGrounded?: boolean;
}

export function AIOrb({ size = 240, intensity = 1, isGrounded = false }: AIOrbProps) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer pulse rings */}
      {!isGrounded && [0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border animate-pulse-ring"
          style={{
            borderColor: "oklch(0.68 0.28 25 / 0.4)",
            animationDelay: `${i * 1}s`,
          }}
        />
      ))}

      {/* Outer glow halo */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 1.8,
          height: size * 1.8,
          background:
            "radial-gradient(circle, oklch(0.68 0.28 25 / 0.35) 0%, transparent 60%)",
          filter: `blur(${20 * intensity}px)`,
        }}
        animate={isGrounded ? { scale: 1, opacity: 0.5 } : { scale: [1, 1.15, 1], opacity: [0.6, 0.95, 0.6] }}
        transition={isGrounded ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb body */}
      <motion.div
        className={`relative rounded-full overflow-hidden ${isGrounded ? '' : 'animate-breathe'}`}
        style={{
          width: size,
          height: size,
          background: "var(--gradient-orb)",
          boxShadow:
            "inset -20px -30px 60px oklch(0.05 0.05 22 / 0.9), inset 15px 20px 40px oklch(1 0 0 / 0.15), 0 0 80px oklch(0.58 0.24 22 / 0.6), 0 0 160px oklch(0.58 0.24 22 / 0.3)",
        }}
      >
        {/* Internal energy swirl */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "conic-gradient(from 0deg, transparent, oklch(0.85 0.15 25 / 0.6), transparent 40%, oklch(0.95 0.02 250 / 0.4), transparent 80%)",
            mixBlendMode: "screen",
          }}
          animate={isGrounded ? { rotate: 0 } : { rotate: 360 }}
          transition={isGrounded ? { duration: 0 } : { duration: 12, repeat: Infinity, ease: "linear" }}
        />

        {/* Reflective highlight */}
        <div
          className="absolute rounded-full"
          style={{
            top: "12%",
            left: "18%",
            width: "40%",
            height: "30%",
            background:
              "radial-gradient(ellipse, oklch(1 0 0 / 0.6) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />

        {/* Inner core */}
        <motion.div
          className="absolute inset-[35%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(1 0 0) 0%, oklch(0.78 0.28 25) 40%, transparent 70%)",
          }}
          animate={isGrounded ? { opacity: 0.8, scale: 1 } : { opacity: [0.7, 1, 0.7], scale: [0.9, 1.1, 0.9] }}
          transition={isGrounded ? { duration: 0 } : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Light sweep */}
        <div
          className="absolute inset-0 animate-light-sweep"
          style={{
            background:
              "linear-gradient(90deg, transparent 30%, oklch(1 0 0 / 0.18) 50%, transparent 70%)",
          }}
        />
      </motion.div>
    </div>
  );
}
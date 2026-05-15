import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Scene1Awakening } from "@/components/welcome/Scene1Awakening";
import { Scene2World } from "@/components/welcome/Scene2World";
import { Scene3SOS } from "@/components/welcome/Scene3SOS";
import { Scene4Network } from "@/components/welcome/Scene4Network";
import { HeroFinal } from "@/components/welcome/HeroFinal";

const SCENE_DURATIONS = [6500, 6000, 5500, 6000];

function Index() {
  const [scene, setScene] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (skipped || scene >= 4) return;
    const t = setTimeout(() => setScene((s) => s + 1), SCENE_DURATIONS[scene]);
    return () => clearTimeout(t);
  }, [scene, skipped]);

  const skip = () => {
    setSkipped(true);
    setScene(4);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        {scene === 0 && <Scene1Awakening key="s1" />}
        {scene === 1 && <Scene2World key="s2" />}
        {scene === 2 && <Scene3SOS key="s3" />}
        {scene === 3 && <Scene4Network key="s4" />}
        {scene === 4 && <HeroFinal key="hero" onEnter={() => navigate({ to: "/login" })} />}
      </AnimatePresence>

      {/* Skip intro */}
      {scene < 4 && (
        <motion.button
          onClick={skip}
          className="absolute top-6 right-6 z-50 font-display text-[11px] uppercase tracking-[0.4em] text-silver/50 hover:text-silver transition-colors px-4 py-2 border border-silver/10 rounded-full glass-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          Skip intro →
        </motion.button>
      )}

      {/* Scene progress dots */}
      {scene < 4 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-[2px] rounded-full transition-all duration-700"
              style={{
                width: i === scene ? 32 : 12,
                background:
                  i <= scene
                    ? "oklch(0.78 0.28 25 / 0.9)"
                    : "oklch(0.85 0.01 250 / 0.2)",
                boxShadow: i === scene ? "0 0 10px oklch(0.78 0.28 25 / 0.6)" : "none",
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Suraksha-Setu — AI-Powered Emergency Response System" },
      {
        name: "description",
        content:
          "Suraksha-Setu is an AI-powered emergency safety network — instant SOS, live tracking, and a connected protection system, anywhere, anytime.",
      },
      { property: "og:title", content: "Suraksha-Setu — AI Protection System" },
      { property: "og:description", content: "Connected protection. Anywhere. Anytime." },
    ],
  }),
});

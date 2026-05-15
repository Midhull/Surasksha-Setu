import { useState, useEffect, useMemo } from 'react';

/**
 * Adaptive Motion Controller for Suraksha-Setu.
 * Centralizes UI frequency based on system constraints and user stress.
 */
export const useAdaptiveMotion = (isEmergency: boolean = false, isLowBattery: boolean = false) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const motionProfile = useMemo(() => {
    const isGrounded = prefersReducedMotion || isEmergency || isLowBattery;

    return {
      isGrounded,
      tapScale: isGrounded ? 0.98 : 0.95, 
      tapDuration: isGrounded ? 0.05 : 0.15,
      
      spring: isGrounded 
        ? { type: "tween", duration: 0.25, ease: "easeInOut" }
        : { type: "spring", damping: 30, stiffness: 300, mass: 0.8 }, 
      
      shimmerOpacity: isGrounded ? 0.05 : 0.2,
      pulseOpacity: isGrounded ? 0.3 : 1.0,
      glowOpacity: isGrounded ? 0.1 : 0.6,
      
      staggerDelay: isGrounded ? 0.02 : 0.08,
      
      containerVariants: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: isGrounded ? 0.02 : 0.08,
            delayChildren: 0.05
          }
        }
      },

      itemVariants: {
        hidden: { opacity: 0, y: isGrounded ? 0 : 12 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { 
            duration: isGrounded ? 0.3 : 0.5, 
            ease: isGrounded ? "easeOut" : [0.16, 1, 0.3, 1] 
          }
        }
      }
    };
  }, [prefersReducedMotion, isEmergency, isLowBattery]);

  return motionProfile;
};

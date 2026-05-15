import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import React from 'react';

interface FallDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function FallDetectionModal({ isOpen, onClose, enabled, onToggle }: FallDetectionModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end"
    >
       <div className="absolute inset-0" onClick={onClose} />
       <motion.div 
         initial={{ x: "100%" }}
         animate={{ x: 0 }}
         exit={{ x: "100%" }}
         transition={{ type: "spring", damping: 25, stiffness: 200 }}
         className="w-full max-w-md bg-[#080303] border-l border-white/10 h-full overflow-y-auto p-6 shadow-2xl relative z-10"
       >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm uppercase tracking-widest text-silver font-bold">Fall Detection</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
              <X className="w-5 h-5 text-silver/60" />
            </button>
          </div>
          <div className="space-y-8">
            <div className="flex justify-between items-center glass-panel p-5 rounded-2xl bg-white/[0.02] border-white/5">
              <div>
                <p className="text-sm text-silver font-medium">Enable Fall Detection</p>
                <p className="text-[10px] text-silver/40 uppercase tracking-widest mt-1">Detects possible falls and inactivity</p>
              </div>
              <button onClick={() => onToggle(!enabled)} className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-green-500' : 'bg-white/10'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="pt-4 space-y-4">
              <p className="text-center text-[10px] text-silver/20 leading-relaxed px-4 mt-8">Automatically contacts emergency services if a hard fall is detected and you are unresponsive.</p>
            </div>
          </div>
       </motion.div>
    </motion.div>
  );
}

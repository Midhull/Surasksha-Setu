import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Trash2, Database, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const DangerZone: React.FC = () => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    // Simulate cache clearing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      localStorage.clear();
      sessionStorage.clear();
      // Keep Firebase Auth session if possible, but the prompt says "clear local cache"
      toast.success("Local operational cache purged");
    } catch (e) {
      toast.error("Failed to purge cache");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="w-full max-w-2xl mx-auto mt-8 mb-16 glass-panel rounded-3xl overflow-hidden border border-red-900/20 bg-red-950/5"
    >
      <div className="p-8 border-b border-red-900/10 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold tracking-tight text-red-500/80">Danger Zone</h2>
          <p className="text-xs text-red-500/40 uppercase tracking-widest mt-1">Irreversible Operations</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-red-500/5 flex items-center justify-center border border-red-500/10">
          <AlertTriangle className="w-5 h-5 text-red-500/60" />
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-black/40 border border-white/5">
          <div className="space-y-1">
            <h3 className="text-sm font-display font-bold text-silver/90 flex items-center gap-2">
              <Database className="w-4 h-4 text-red-500/60" /> Purge Local Cache
            </h3>
            <p className="text-[11px] text-silver/40">Removes all offline maps, saved routes, and session logs from this device.</p>
          </div>
          <button 
            onClick={handleClearCache}
            disabled={isClearing}
            className="px-6 py-2.5 rounded-xl border border-red-900/30 text-[10px] uppercase tracking-widest font-bold text-red-500/80 hover:bg-red-500/10 transition-colors flex items-center gap-2"
          >
            {isClearing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            {isClearing ? "Purging..." : "Clear Cache"}
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-black/40 border border-white/5">
          <div className="space-y-1 opacity-50 cursor-not-allowed">
            <h3 className="text-sm font-display font-bold text-silver/90 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500/60" /> Deactivate Identity
            </h3>
            <p className="text-[11px] text-silver/40">Permanently remove your profile and all associated emergency records.</p>
          </div>
          <button 
            disabled
            className="px-6 py-2.5 rounded-xl bg-red-500/5 border border-red-900/10 text-[10px] uppercase tracking-widest font-bold text-red-500/20 cursor-not-allowed"
          >
            Locked Operation
          </button>
        </div>
      </div>
    </motion.div>
  );
};

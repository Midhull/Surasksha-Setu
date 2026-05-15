import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Power, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

export const LogoutButton: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authService.logoutUser();
      toast.success("Session terminated. Connection closed.");
      navigate({ to: '/login' });
    } catch (error) {
      toast.error("Termination failed. Session still active.");
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex justify-center pb-20">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`
          relative group flex items-center gap-4 px-10 py-4 rounded-2xl
          bg-gradient-to-r from-red-950/40 to-black border border-red-900/20
          shadow-[0_0_40px_rgba(153,27,27,0.1)] hover:shadow-[0_0_60px_rgba(153,27,27,0.2)]
          transition-all duration-500
        `}
      >
        <div className="absolute inset-0 rounded-2xl bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl" />
        
        <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-900/30 flex items-center justify-center group-hover:border-red-600/50 transition-colors duration-500">
          {isLoggingOut ? (
            <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
          ) : (
            <Power className="w-5 h-5 text-red-500/80 group-hover:text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all" />
          )}
        </div>
        
        <div className="text-left">
          <span className="block text-[11px] uppercase tracking-[0.3em] font-bold text-red-500/60 group-hover:text-red-500 transition-colors">
            {isLoggingOut ? "Disconnecting..." : "Terminate Session"}
          </span>
          <span className="block text-[9px] uppercase tracking-widest text-silver/20 group-hover:text-silver/40 transition-colors">
            Secure Logout Protocol
          </span>
        </div>

        <LogOut className="w-4 h-4 text-silver/10 group-hover:text-silver/30 transition-colors ml-4" />
      </motion.button>
    </div>
  );
};

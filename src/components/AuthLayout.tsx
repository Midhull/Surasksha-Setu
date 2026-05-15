import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkTo
}) => {
  return (
    <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-6 relative overflow-hidden font-display">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-crimson-glow/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-crimson-glow/5 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-crimson-glow/10 border border-white/5 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-xl">
            <Shield className="w-7 h-7 text-crimson-glow" />
          </div>
          <h1 className="text-3xl font-light tracking-tight text-white mb-2">{title}</h1>
          <p className="text-silver/40 text-sm tracking-wide text-center">{subtitle}</p>
        </div>

        {/* Main Auth Surface */}
        <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] bg-white/[0.03] border-white/10 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
          {children}
        </div>

        {/* Auth Footer */}
        <div className="mt-10 text-center">
          <p className="text-silver/30 text-xs uppercase tracking-[0.2em]">
            {footerText}{' '}
            <Link 
              to={footerLinkTo as any} 
              className="text-crimson-glow hover:text-red-400 font-bold transition-colors ml-1"
            >
              {footerLinkText}
            </Link>
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 opacity-20">
            <div className="h-[1px] w-8 bg-silver/20" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-silver font-medium">Suraksha-Setu Infrastructure</span>
            <div className="h-[1px] w-8 bg-silver/20" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IdentityAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  photoURL?: string;
  status?: 'online' | 'nearby' | 'responding' | 'offline' | 'none';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const IdentityAvatar: React.FC<IdentityAvatarProps> = ({
  name,
  photoURL,
  status = 'none',
  size = 'md',
  className,
  ...props
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const sizeClasses = {
    xs: 'w-7 h-7 text-[9px] rounded-lg',
    sm: 'w-10 h-10 text-[11px] rounded-xl',
    md: 'w-12 h-12 text-xs rounded-2xl',
    lg: 'w-16 h-16 text-sm rounded-[1.25rem]',
    xl: 'w-24 h-24 text-lg rounded-[2rem]',
  };

  const statusColors = {
    online: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    nearby: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]',
    responding: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    offline: 'bg-silver/30 shadow-none',
    none: 'hidden'
  };

  return (
    <div className={cn("relative group shrink-0", className)} {...props}>
      {/* Premium Shadow & Ambient Glow */}
      <div className="absolute inset-0 rounded-inherit bg-crimson-glow/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
      
      <motion.div 
        whileHover={{ y: -2 }}
        className={cn(
          "relative overflow-hidden backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center transition-all duration-300",
          "bg-white/[0.04] group-hover:bg-white/[0.08] group-hover:border-white/20",
          sizeClasses[size]
        )}
      >
        {photoURL ? (
          <img 
            src={photoURL} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <span className="font-semibold tracking-wider text-white/80 group-hover:text-white transition-colors">
            {initials}
          </span>
        )}
        
        {/* Subtle Internal Gradient for Depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/5 pointer-events-none" />
      </motion.div>

      {/* Status Indicator */}
      {status !== 'none' && (
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[#050507] z-10",
          size === 'xs' ? 'w-2 h-2' : 'w-3.5 h-3.5',
          statusColors[status]
        )} />
      )}
    </div>
  );
};

import React from 'react';
import { cn } from '@/lib/utils';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const AuthInput: React.FC<AuthInputProps> = ({ label, icon, className, ...props }) => {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-[0.3em] text-silver/40 font-bold ml-1">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-silver/20 group-focus-within:text-crimson-glow/50 transition-colors">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={cn(
            "w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm text-silver transition-all duration-300",
            "placeholder:text-silver/10 focus:outline-none focus:border-crimson-glow/50 focus:bg-white/[0.05]",
            icon ? "pl-12" : "pl-5",
            className
          )}
        />
      </div>
    </div>
  );
};

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'google';
  isLoading?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className, 
  ...props 
}) => {
  const variants = {
    primary: "bg-crimson-glow text-white hover:bg-red-600 shadow-[0_8px_30px_rgba(220,38,38,0.2)]",
    secondary: "bg-white/[0.05] border border-white/10 text-silver hover:bg-white/[0.1]",
    google: "bg-white text-black hover:bg-white/90"
  };

  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={cn(
        "w-full py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
};

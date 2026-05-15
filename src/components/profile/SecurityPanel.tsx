import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Key, Clock, Fingerprint, RefreshCw } from 'lucide-react';
import { UserProfile } from '../../types/user';
import { format } from 'date-fns';

interface SecurityPanelProps {
  profile: UserProfile;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({ profile }) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "MMM dd, yyyy · HH:mm");
    } catch (e) {
      return "Format Error";
    }
  };

  const securityItems = [
    {
      label: "Account Email",
      value: profile.email,
      icon: Mail,
    },
    {
      label: "Authentication Provider",
      value: profile.provider || "Standard Secure",
      icon: Key,
    },
    {
      label: "Identity Established",
      value: formatDate(profile.createdAt),
      icon: Shield,
    },
    {
      label: "Last Terminal Access",
      value: formatDate(profile.lastLoginAt),
      icon: Clock,
    },
  ];

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full max-w-2xl mx-auto mt-8 glass-panel rounded-3xl overflow-hidden border border-white/10"
    >
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold tracking-tight text-silver">Security Infrastructure</h2>
          <p className="text-xs text-silver/40 uppercase tracking-widest mt-1">Access & Identity Logs</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-10 h-10 rounded-xl bg-silver/5 flex items-center justify-center border border-white/10 hover:bg-white/5 transition-colors group"
            title="Refresh Identity Session"
          >
            <RefreshCw className={`w-4 h-4 text-silver/40 group-hover:text-silver/80 transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-silver/5 flex items-center justify-center border border-white/10">
            <Fingerprint className="w-5 h-5 text-silver/60" />
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {securityItems.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-silver/30">
                <item.icon className="w-3 h-3" />
                {item.label}
              </div>
              <div className="text-sm font-medium text-silver/80 bg-white/5 px-4 py-3 rounded-xl border border-white/5 font-mono">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 rounded-xl bg-crimson/5 border border-crimson/10 flex items-start gap-3">
          <div className="mt-0.5">
            <Shield className="w-4 h-4 text-crimson-glow" />
          </div>
          <p className="text-[11px] leading-relaxed text-silver/60">
            Your connection to the Suraksha-Setu infrastructure is encrypted with military-grade protocols. 
            Session data is periodically cleared to maintain operational security.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

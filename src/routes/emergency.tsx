import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, MapPin, Mic, Users, Zap, ShieldAlert, Wifi, Activity, AlertCircle, Radio, Siren, Eye, Share2 } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { AIOrb } from "../components/AIOrb";
import { IdentityAvatar } from "../components/IdentityAvatar";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/emergency")({
  component: EmergencyPage,
});

function EmergencyPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [timer, setTimer] = useState(0);
  const [nodesNotified, setNodesNotified] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    const nodeInterval = setInterval(() => {
      setNodesNotified(n => (n < 24 ? n + 1 : n));
    }, 800);
    return () => {
      clearInterval(interval);
      clearInterval(nodeInterval);
    };
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center gap-6 font-display">
        <div className="w-16 h-16 rounded-2xl bg-crimson-glow/10 border border-white/5 flex items-center justify-center animate-pulse">
           <Shield className="w-8 h-8 text-crimson-glow/40" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-silver/20 animate-pulse font-bold">Initializing Emergency System...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0000] text-white font-display overflow-hidden relative">
      {/* Intense Emergency Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.2)_0%,transparent_80%)]" />
      <motion.div 
        animate={{ opacity: [0.1, 0.4, 0.1] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        className="absolute inset-0 bg-red-950/20" 
      />
      
      {/* Moving Scan Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <motion.div 
          animate={{ y: ["-100%", "200%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-full h-1 bg-red-500 shadow-[0_0_20px_red]"
        />
      </div>

      <div className="relative z-10 h-screen flex flex-col p-6">
        {/* Header Alert Bar */}
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center bg-red-600 px-6 py-4 rounded-[1.5rem] shadow-[0_0_50px_rgba(220,38,38,0.6)] mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-600 animate-bounce" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] leading-none mb-1 text-white/80">Active Emergency Mode</p>
              <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-white">Suraksha-Setu Terminal 01</h2>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex gap-6">
              <HeaderMetric label="Guardian Notified" value="Sent" />
              <HeaderMetric label="Siren" value="Active" />
            </div>
            <span className="text-lg font-mono font-bold bg-black/20 px-4 py-1 rounded-lg border border-white/10">{formatTime(timer)}</span>
          </div>
        </motion.div>


        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: AI Assistant & Audio */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-panel p-8 rounded-[2.5rem] bg-red-950/20 border-red-500/30 flex-1 flex flex-col items-center justify-center text-center">
              <AIOrb state="emergency" size="md" />
              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.4em] text-red-500 font-bold mb-2">AI Analyzing Environment</p>
                <div className="flex gap-1 justify-center h-8 items-end">
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <motion.div
                      key={i}
                      animate={{ height: [10, Math.random() * 32, 10] }}
                      transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.05 }}
                      className="w-1 bg-red-500/50 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-[2rem] bg-red-950/10 border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Audio Evidence</p>
                  <p className="text-xs text-white/60">Recording & Uploading...</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
            </div>
          </div>

          {/* Right Column: Live Tracking & Nodes */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="glass-panel rounded-[3rem] bg-black border-red-500/30 flex-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1)_0%,transparent_80%)]" />
              
              {/* Animated Map Grid */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 grid-overlay" />
              </div>

              {/* Radar Sweep Animation */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20"
                style={{ background: 'conic-gradient(from 0deg, transparent, rgba(220,38,38,0.4), transparent)' }}
              />
              
              {/* User Position & Radius */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <motion.div 
                    animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -inset-20 border-2 border-red-600/30 rounded-full" 
                  />
                  <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_30px_white] relative z-10" />
                  <div className="absolute inset-0 bg-red-600 rounded-full animate-ping scale-[5]" />
                </div>
              </div>

              {/* Floating Responders Simulation */}
              <ResponderMarker x="30%" y="40%" label="POLICE-04" />
              <ResponderMarker x="70%" y="25%" label="VOLUNTEER-A" />
              <ResponderMarker x="60%" y="75%" label="GUARDIAN-1" />

              {/* Emergency Info Overlay */}
              <div className="absolute top-8 left-8">
                <div className="glass-panel px-4 py-2 rounded-full bg-red-600 border-none flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Streaming Live coordinates</span>
                </div>
              </div>

              {/* Responder ETA Overlay */}
              <div className="absolute bottom-8 left-8 right-8">
                <div className="glass-panel p-8 rounded-[2.5rem] bg-black/80 backdrop-blur-xl border-red-500/40 shadow-2xl flex justify-between items-center">
                  <div className="flex items-center gap-8">
                    <div className="relative">
                      <div className="flex -space-x-4">
                        <IdentityAvatar name="Responder 1" status="responding" size="md" className="border-2 border-[#0a0000]" />
                        <IdentityAvatar name="Responder 2" status="responding" size="md" className="border-2 border-[#0a0000]" />
                      </div>
                      {/* Status indicator is now inside IdentityAvatar */}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.4em] text-red-500 font-bold mb-1">Incoming Assistance</p>
                      <h3 className="text-2xl font-light tracking-tight">Police Unit Detected</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">ETA: 1 minute 42 seconds</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-4">
                      <ActionCircle icon={<PhoneOff className="w-4 h-4" />} color="bg-red-600" />
                      <ActionCircle icon={<Share2 className="w-4 h-4" />} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <EmergencyMetric icon={<MapPin className="w-4 h-4" />} label="GPS Lat/Lng" value="28.7041 / 77.1025" />
              <EmergencyMetric icon={<Users className="w-4 h-4" />} label="Nodes Alerted" value={`${nodesNotified} Guardians`} />
              <EmergencyMetric icon={<Activity className="w-4 h-4" />} label="Heart Rate" value="112 BPM" />
              <EmergencyMetric icon={<Radio className="w-4 h-4" />} label="Signal Health" value="Excellent" />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="mt-8 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group px-12 py-4 rounded-full border border-red-500/30 bg-red-950/20 hover:bg-red-600 transition-all flex items-center gap-3"
          >
            <PhoneOff className="w-5 h-5 text-red-500 group-hover:text-white transition-colors" />
            <span className="text-xs uppercase tracking-[0.4em] font-bold text-red-500 group-hover:text-white transition-colors">Terminate Protocol</span>
          </motion.button>
        </footer>
      </div>
    </div>
  );
}

function ResponderMarker({ x, y, label }: { x: string, y: string, label: string }) {
  return (
    <motion.div 
      style={{ left: x, top: y }}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute flex flex-col items-center gap-1"
    >
      <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_red]" />
      <span className="text-[8px] font-bold uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm border border-red-500/20">{label}</span>
    </motion.div>
  );
}

function ActionCircle({ icon, color = "bg-white/5" }: { icon: React.ReactNode, color?: string }) {
  return (
    <button className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors ${color}`}>
      {icon}
    </button>
  );
}

function HeaderMetric({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[8px] uppercase tracking-[0.2em] text-white/60">{label}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest">{value}</span>
    </div>
  );
}

function EmergencyMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-panel p-4 rounded-2xl bg-red-950/10 border-white/5">
      <div className="flex items-center gap-3 text-red-500 mb-2">
        {icon}
        <span className="text-[8px] uppercase tracking-widest font-bold">{label}</span>
      </div>
      <p className="text-sm font-mono tracking-tight">{value}</p>
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

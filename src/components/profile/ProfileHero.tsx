import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ShieldCheck, Upload, X } from 'lucide-react';
import { UserProfile } from '../../types/user';
import { profileService } from '../../services/profileService';
import { toast } from 'sonner';

interface ProfileHeroProps {
  profile: UserProfile;
  onUpdate: (photoURL: string) => void;
}

export const ProfileHero: React.FC<ProfileHeroProps> = ({ profile, onUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    try {
      setIsUploading(true);
      const downloadURL = await profileService.uploadAvatar(profile.uid, file);
      onUpdate(downloadURL);
      toast.success("Identity visual updated");
    } catch (error) {
      toast.error("Failed to update identity visual");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="relative pt-12 pb-16 flex flex-col items-center justify-center overflow-hidden">
      {/* Ambient Background Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-radial-crimson opacity-20 blur-[100px] animate-drift" />
      </div>

      <div className="relative group">
        {/* The Identity Orb */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-40 h-40 md:w-48 md:h-48 rounded-full p-1 bg-gradient-to-b from-white/20 to-transparent shadow-2xl"
        >
          <div className="absolute inset-0 rounded-full bg-crimson/20 blur-xl animate-breathe" />
          
          <div className="relative w-full h-full rounded-full overflow-hidden glass-panel border-2 border-white/10 group-hover:border-white/30 transition-colors duration-500">
            {profile.photoURL ? (
              <img 
                src={profile.photoURL} 
                alt={profile.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-graphite/40">
                <span className="text-5xl font-display font-light text-silver/20">
                  {profile.name?.charAt(0) || profile.email?.charAt(0)}
                </span>
              </div>
            )}

            {/* Upload Overlay */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-2 cursor-pointer backdrop-blur-sm"
            >
              {isUploading ? (
                <div className="w-8 h-8 border-2 border-crimson border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Camera className="w-6 h-6 text-silver" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-silver/80">Update Visual</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Verified Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute -bottom-2 right-4 glass-panel px-3 py-1 rounded-full border border-white/20 flex items-center gap-2 shadow-lg"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-crimson-glow" />
          <span className="text-[9px] uppercase tracking-widest font-bold text-silver/90">Verified Identity</span>
        </motion.div>
      </div>

      <div className="mt-8 text-center relative z-10">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-4xl md:text-5xl font-display font-bold tracking-tight text-glow-crimson"
        >
          {profile.name || "Anonymous Operative"}
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-3 flex items-center justify-center gap-3"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-silver/40 font-medium">
            {profile.role || "Operational Status: Active"}
          </span>
          <div className="w-1 h-1 rounded-full bg-crimson-glow animate-pulse" />
          <span className="text-[10px] font-mono text-silver/30">
            ID: {profile.uid.substring(0, 8).toUpperCase()}
          </span>
        </motion.div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange}
      />
    </section>
  );
};

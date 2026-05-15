import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../services/profileService';
import { UserProfile } from '../types/user';
import { ProfileHero } from '../components/profile/ProfileHero';
import { IdentityCard } from '../components/profile/IdentityCard';
import { SecurityPanel } from '../components/profile/SecurityPanel';
import { DangerZone } from '../components/profile/DangerZone';
import { LogoutButton } from '../components/profile/LogoutButton';
import { Loader2, ShieldAlert, Shield } from 'lucide-react';
import { useAdaptiveMotion } from '../hooks/useAdaptiveMotion';
import { Skeleton } from '../components/Skeleton';

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const motionProfile = useAdaptiveMotion(false, false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: '/login' });
      return;
    }

    if (user) {
      const fetchProfile = async () => {
        try {
          setProfileLoading(true);
          const data = await profileService.getUserProfile(user.uid);
          if (data) {
            setProfile(data);
          } else {
            // Fallback to auth user data if firestore doc doesn't exist yet
            setProfile({
              uid: user.uid,
              name: user.displayName || "Unknown Operative",
              email: user.email || "",
              photoURL: user.photoURL || undefined,
              createdAt: new Date(), // This is temporary, syncUserDoc should have created it
              updatedAt: new Date(),
            });
          }
        } catch (err) {
          setError("Failed to initialize identity environment.");
        } finally {
          setProfileLoading(false);
        }
      };

      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const handleProfileUpdate = (updates: Partial<UserProfile>) => {
    if (profile) {
      setProfile({ ...profile, ...updates });
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center gap-8 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="grid-overlay opacity-[0.03] absolute inset-0" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 glass-panel rounded-full flex items-center justify-center mb-8 relative overflow-hidden">
            <div className="absolute inset-0 shimmer-bg" style={{ opacity: motionProfile.shimmerOpacity }} />
            <Shield className="w-8 h-8 text-crimson-glow/40" />
          </div>
          <Skeleton className="w-48 h-1.5 mb-4" opacity={motionProfile.shimmerOpacity} />
          <p className="text-[10px] uppercase tracking-[0.4em] text-silver/40 font-bold">Synchronizing Identity Session</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-12 h-12 text-crimson mb-4" />
        <h1 className="text-xl font-display font-bold text-silver mb-2">Protocol Failure</h1>
        <p className="text-sm text-silver/40 mb-6">{error || "Could not resolve identity session."}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 glass-panel rounded-xl text-xs uppercase tracking-widest font-bold text-silver hover:bg-white/5"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050507] relative overflow-hidden">
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="grid-overlay opacity-[0.03] absolute inset-0" />
        <div className="cinematic-vignette absolute inset-0" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionProfile.isGrounded ? 0.3 : 1 }}
          >
            {/* Top Navigation / Breadcrumb - Minimal */}
            <div className="pt-8 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-crimson-glow animate-pulse" />
                <span className="text-[10px] font-mono text-silver/40 uppercase tracking-widest">
                  Terminal // Profile Control
                </span>
              </div>
              <motion.button
                whileTap={{ scale: motionProfile.tapScale }}
                onClick={() => navigate({ to: '/dashboard' })}
                className="text-[10px] uppercase tracking-widest font-bold text-silver/40 hover:text-silver transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
              >
                Back to Command
              </motion.button>
            </div>

            {/* Profile Content */}
            <div className="py-12 flex flex-col gap-8">
              <ProfileHero profile={profile} onUpdate={(photoURL) => handleProfileUpdate({ photoURL })} />
              
              <div className="space-y-8 max-w-4xl mx-auto w-full">
                <IdentityCard profile={profile} onUpdate={handleProfileUpdate} />
                <SecurityPanel profile={profile} />
                <DangerZone />
                <LogoutButton />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Atmospheric Scanning Line */}
      <div className="fixed top-0 left-0 w-full h-[1px] bg-crimson/20 z-50 animate-[scan_8s_linear_infinite]" />
      
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
      `}</style>
    </main>
  );
}

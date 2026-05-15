import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { User, Phone, Briefcase, FileText, Save } from 'lucide-react';
import { UserProfile } from '../../types/user';
import { profileService } from '../../services/profileService';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  role: z.string().optional(),
  bio: z.string().max(160, "Bio must be under 160 characters").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface IdentityCardProps {
  profile: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
}

export const IdentityCard: React.FC<IdentityCardProps> = ({ profile, onUpdate }) => {
  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name || "",
      phone: profile.phone || "",
      role: profile.role || "",
      bio: profile.bio || "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await profileService.updateProfileData(profile.uid, values);
      onUpdate(values);
      toast.success("Identity parameters synchronized");
    } catch (error) {
      toast.error("Failed to sync parameters");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="w-full max-w-2xl mx-auto glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
    >
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold tracking-tight text-silver">Core Identity</h2>
          <p className="text-xs text-silver/40 uppercase tracking-widest mt-1">Operational Parameters</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-crimson/10 flex items-center justify-center border border-crimson/20">
          <User className="w-5 h-5 text-crimson-glow" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-silver/40 px-1 flex items-center gap-2">
              <User className="w-3 h-3" /> Display Name
            </label>
            <div className="relative group">
              <input 
                {...register("name")}
                placeholder="Operative Name"
                className="w-full bg-graphite/30 border border-white/10 rounded-xl px-4 py-3 text-silver focus:outline-none focus:border-crimson/50 focus:ring-1 focus:ring-crimson/20 transition-all duration-300 placeholder:text-silver/20"
              />
              <div className="absolute inset-0 rounded-xl bg-crimson/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
            </div>
            {errors.name && <p className="text-[10px] text-crimson font-medium px-1">{errors.name.message}</p>}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-silver/40 px-1 flex items-center gap-2">
              <Phone className="w-3 h-3" /> Communication Link
            </label>
            <div className="relative group">
              <input 
                {...register("phone")}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-graphite/30 border border-white/10 rounded-xl px-4 py-3 text-silver focus:outline-none focus:border-crimson/50 focus:ring-1 focus:ring-crimson/20 transition-all duration-300 placeholder:text-silver/20"
              />
              <div className="absolute inset-0 rounded-xl bg-crimson/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
            </div>
          </div>

          {/* Emergency Role */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-silver/40 px-1 flex items-center gap-2">
              <Briefcase className="w-3 h-3" /> Operational Role
            </label>
            <div className="relative group">
              <input 
                {...register("role")}
                placeholder="e.g. Lead Coordinator, First Responder"
                className="w-full bg-graphite/30 border border-white/10 rounded-xl px-4 py-3 text-silver focus:outline-none focus:border-crimson/50 focus:ring-1 focus:ring-crimson/20 transition-all duration-300 placeholder:text-silver/20"
              />
              <div className="absolute inset-0 rounded-xl bg-crimson/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-silver/40 px-1 flex items-center gap-2">
              <FileText className="w-3 h-3" /> Personal Directive
            </label>
            <div className="relative group">
              <textarea 
                {...register("bio")}
                rows={3}
                placeholder="Brief operational background..."
                className="w-full bg-graphite/30 border border-white/10 rounded-xl px-4 py-3 text-silver focus:outline-none focus:border-crimson/50 focus:ring-1 focus:ring-crimson/20 transition-all duration-300 placeholder:text-silver/20 resize-none"
              />
              <div className="absolute inset-0 rounded-xl bg-crimson/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
            </div>
            {errors.bio && <p className="text-[10px] text-crimson font-medium px-1">{errors.bio.message}</p>}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || isSubmitting}
            className={`
              relative overflow-hidden px-8 py-3 rounded-xl font-display font-bold uppercase tracking-widest text-[11px] 
              transition-all duration-500 flex items-center gap-3
              ${isDirty 
                ? 'bg-crimson text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:scale-[1.02]' 
                : 'bg-white/5 text-silver/20 cursor-not-allowed border border-white/5'}
            `}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSubmitting ? "Syncing..." : "Commit Changes"}
            
            {isDirty && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-white/10 animate-light-sweep" />
              </div>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

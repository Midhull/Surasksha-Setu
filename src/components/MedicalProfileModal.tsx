import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { emergencyService } from '../services/emergencyService';

interface MedicalProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  active: boolean;
  onToggle: (active: boolean) => void;
}

export function MedicalProfileModal({ isOpen, onClose, active, onToggle }: MedicalProfileModalProps) {
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      emergencyService.getMedicalProfile("user_001").then((data) => {
        if (data) {
          setBloodGroup(data.bloodGroup || "");
          setAllergies(data.allergies || "");
          setMedications(data.medications || "");
        }
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    await emergencyService.saveMedicalProfile("user_001", {
      bloodGroup,
      allergies,
      medications,
      conditions: "", // Can add later if needed
      caregiver: ""   // Can add later if needed
    });
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end"
    >
       <div className="absolute inset-0" onClick={onClose} />
       <motion.div 
         initial={{ x: "100%" }}
         animate={{ x: 0 }}
         exit={{ x: "100%" }}
         transition={{ type: "spring", damping: 25, stiffness: 200 }}
         className="w-full max-w-md bg-[#080303] border-l border-white/10 h-full overflow-y-auto p-6 shadow-2xl relative z-10"
       >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm uppercase tracking-widest text-silver font-bold">Medical Profile</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
              <X className="w-5 h-5 text-silver/60" />
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 text-crimson-glow animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex justify-between items-center glass-panel p-5 rounded-2xl bg-white/[0.02] border-white/5">
                <div>
                  <p className="text-sm text-silver font-medium">Activate Medical Profile</p>
                  <p className="text-[10px] text-silver/40 uppercase tracking-widest mt-1">Share with responders during SOS</p>
                </div>
                <button onClick={() => onToggle(!active)} className={`w-12 h-6 rounded-full transition-colors relative ${active ? 'bg-green-500' : 'bg-white/10'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${active ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-silver/40 ml-1 mb-1 block">Blood Group</label>
                  <input 
                    type="text" 
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    placeholder="e.g. O+" 
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-silver focus:outline-none focus:border-crimson-glow/50 transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-silver/40 ml-1 mb-1 block">Allergies</label>
                  <input 
                    type="text" 
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, Peanuts" 
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-silver focus:outline-none focus:border-crimson-glow/50 transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-silver/40 ml-1 mb-1 block">Current Medications</label>
                  <input 
                    type="text" 
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    placeholder="e.g. Lisinopril 10mg" 
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-silver focus:outline-none focus:border-crimson-glow/50 transition-colors" 
                  />
                </div>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="w-full py-4 rounded-xl bg-crimson-glow text-white text-[11px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 mt-4 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          )}
       </motion.div>
    </motion.div>
  );
}

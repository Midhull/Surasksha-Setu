import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import React, { useState, useEffect, useCallback } from "react";
import { Mail, Lock, User, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { AuthLayout } from "@/components/AuthLayout";
import { AuthInput, AuthButton } from "@/components/AuthComponents";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !authLoading) {
      navigate({ to: "/dashboard" });
    }
  }, [user, authLoading, navigate]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.registerUser(email, password);
    } catch (err: any) {
      setError(authService.handleAuthError(err));
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  const handleGoogleLogin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.loginWithGoogle();
    } catch (err: any) {
      setError(authService.handleAuthError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join the Suraksha-Setu safety coordination network"
      footerText="Already have an account?"
      footerLinkText="Sign In"
      footerLinkTo="/login"
    >
      <form onSubmit={handleRegister} className="space-y-6">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AuthInput
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={handleNameChange}
          icon={<User className="w-4 h-4" />}
          required
        />

        <AuthInput
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={handleEmailChange}
          icon={<Mail className="w-4 h-4" />}
          required
        />

        <AuthInput
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={handlePasswordChange}
          icon={<Lock className="w-4 h-4" />}
          required
        />

        <div className="space-y-4 pt-2">
          <AuthButton type="submit" isLoading={loading}>
            Create Account
          </AuthButton>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-[0.4em] text-silver/20 font-bold bg-transparent">
              <span className="px-4 bg-[#121214]">Or join with</span>
            </div>
          </div>

          <AuthButton 
            type="button" 
            variant="google" 
            onClick={handleGoogleLogin}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Join with Google
          </AuthButton>
        </div>
      </form>
    </AuthLayout>
  );
}

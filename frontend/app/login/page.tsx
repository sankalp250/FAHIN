"use client";

import { useState } from "react";
import { Shield, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await login(email);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center -ml-64 p-4 relative z-10">
      <div className="neu rounded-[40px] bg-surface/80 p-10 max-w-md w-full backdrop-blur-xl border border-white/40">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-3xl bg-accent flex items-center justify-center mb-6 shadow-glow">
            <Shield size={28} color="#fff" />
          </div>
          <h1 className="font-display font-bold text-3xl text-ink">Welcome to FAHIN</h1>
          <p className="text-ink-soft mt-2 text-center text-sm">
            Federated Health Intelligence Network.<br />Secure, anonymous, decentralized.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-2 ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft group-focus-within:text-accent transition-colors" size={18} />
              <input
                type="email"
                required
                className="w-full h-14 bg-bg rounded-[20px] pl-12 pr-4 outline-none transition-all neu-sm focus:shadow-inner text-sm"
                placeholder="citizen@gurugram.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-2 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft group-focus-within:text-accent transition-colors" size={18} />
              <input
                type="password"
                required
                className="w-full h-14 bg-bg rounded-[20px] pl-12 pr-4 outline-none transition-all neu-sm focus:shadow-inner text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-xs font-semibold text-danger bg-danger/5 p-3 rounded-xl border border-danger/20 text-center">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-accent text-white rounded-[20px] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Shield size={18} /> Authenticate Session <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-ink-soft">
            Don't have a health ID? <Link href="/register" className="text-accent font-bold hover:underline">Register Sector ID</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

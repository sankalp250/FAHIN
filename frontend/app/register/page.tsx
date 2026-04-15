"use client";

import { useState } from "react";
import { Shield, Mail, Lock, User, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "citizen",
    city: "Gurugram",
    city_sector: "Sector-45",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await register(formData);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-20 flex items-center justify-center -ml-64 p-4 relative z-10">
      <div className="neu rounded-[40px] bg-surface/80 p-10 max-w-lg w-full backdrop-blur-xl border border-white/40">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-3xl bg-accent flex items-center justify-center mb-6 shadow-glow">
            <User size={28} color="#fff" />
          </div>
          <h1 className="font-display font-bold text-3xl text-ink">Join the Network</h1>
          <p className="text-ink-soft mt-2 text-center text-sm">Create your secure city health identity.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-2 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft group-focus-within:text-accent transition-colors" size={18} />
                <input
                  type="email"
                  required
                  className="w-full h-14 bg-bg rounded-[20px] pl-12 pr-4 outline-none transition-all neu-sm focus:shadow-inner text-sm"
                  placeholder="name@provider.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-2 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft group-focus-within:text-accent transition-colors" size={18} />
                <input
                  type="password"
                  required
                  className="w-full h-14 bg-bg rounded-[20px] pl-12 pr-4 outline-none transition-all neu-sm focus:shadow-inner text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-2 ml-1">Account Role</label>
              <select
                className="w-full h-14 bg-bg rounded-[20px] px-4 outline-none transition-all neu-sm focus:shadow-inner text-sm appearance-none"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="citizen">Citizen</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="hospital_admin">Hospital Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-2 ml-1">City</label>
              <input
                type="text"
                required
                className="w-full h-14 bg-bg rounded-[20px] px-4 outline-none transition-all neu-sm focus:shadow-inner text-sm"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-2 ml-1">City Sector</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft group-focus-within:text-accent transition-colors" size={18} />
                <select
                  className="w-full h-14 bg-bg rounded-[20px] pl-12 pr-4 outline-none transition-all neu-sm focus:shadow-inner text-sm appearance-none"
                  value={formData.city_sector}
                  onChange={(e) => setFormData({...formData, city_sector: e.target.value})}
                >
                  <option value="Sector-45">Sector-45</option>
                  <option value="Sector-32">Sector-32</option>
                  <option value="Sector-17">Sector-17</option>
                  <option value="Sector-21">Sector-21</option>
                  <option value="Sector-8">Sector-8</option>
                  <option value="Sector-3">Sector-3</option>
                </select>
              </div>
            </div>
          </div>

          {error && <div className="text-xs font-semibold text-danger bg-danger/5 p-3 rounded-xl border border-danger/20 text-center">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-accent text-white rounded-[20px] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Shield size={18} /> Register Identity <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-ink-soft">
            Already have an ID? <Link href="/login" className="text-accent font-bold hover:underline">Authenticate Here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

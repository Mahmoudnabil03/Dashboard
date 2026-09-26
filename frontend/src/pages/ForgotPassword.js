import React, { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import Logo from "../components/Logo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error("Enter a valid email address."); return; }
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
      toast.success(res.data.message);
    } catch { toast.error("Something went wrong. Try again shortly."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      <main className="card p-8 max-w-md w-full">
        <div className="flex justify-center mb-6"><Logo size={48} /></div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-2">Forgot password</h1>
        {sent ? (
          <p className="text-[var(--text-secondary)] text-sm text-center" role="status">If an account exists for this email, a reset link good for 1 hour is on its way.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-4">
            <div>
              <label htmlFor="fp-email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email address</label>
              <input id="fp-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <KeyRound size={18} className="mr-2" />} Send reset link
            </button>
          </form>
        )}
        <div className="text-center mt-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--brand-primary)]"><ArrowLeft size={16} /> Back to sign in</Link>
        </div>
      </main>
    </div>
  );
}

import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import Logo from "../components/Logo";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const token = params.get("token");

  const submit = async (e) => {
    e.preventDefault();
    if (!token) { setError("This page needs a reset link from your email."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", { token, password });
      toast.success(res.data.message);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed. Request a new link.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      <main className="card p-8 max-w-md w-full">
        <div className="flex justify-center mb-6"><Logo size={48} /></div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-6">Set a new password</h1>
        {error ? <div role="alert" className="mb-4 p-3 rounded-xl bg-[var(--error-muted)] border border-[var(--error)]/30 text-sm text-[var(--error)]">{error}</div> : null}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="rp-password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">New password</label>
            <input id="rp-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="At least 8 characters" />
          </div>
          <div>
            <label htmlFor="rp-confirm" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Confirm password</label>
            <input id="rp-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" placeholder="Repeat the password" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Lock size={18} className="mr-2" />} Update password
          </button>
        </form>
        <div className="text-center mt-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--brand-primary)]"><ArrowLeft size={16} /> Back to sign in</Link>
        </div>
      </main>
    </div>
  );
}

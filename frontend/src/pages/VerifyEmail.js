import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { MailCheck, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import Logo from "../components/Logo";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState("working");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setState("idle"); return; }
    (async () => {
      try {
        const res = await api.get("/auth/verify", { params: { token } });
        setMessage(res.data.message);
        setState("done");
        toast.success("Email verified. Please sign in.");
      } catch (error) {
        setMessage(error.response?.data?.error || "Verification failed.");
        setState("error");
      }
    })();
  }, [params]);

  const resend = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Enter your email address."); return; }
    setResending(true);
    try {
      await api.post("/auth/request-verification", { email: email.trim() });
      toast.success("If an unverified account exists, a new link is on its way.");
    } catch { toast.error("Could not resend. Try again shortly."); } finally { setResending(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      <main className="card p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6"><Logo size={48} /></div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Email verification</h1>
        {state === "working" ? <p className="text-[var(--text-secondary)] text-sm flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Verifying your link...</p> : null}
        {state === "done" ? (
          <div>
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-[var(--success-muted)] flex items-center justify-center text-[var(--success)]"><MailCheck size={24} /></div>
            <p className="text-[var(--text-secondary)] text-sm mb-6">{message}</p>
            <button onClick={() => navigate("/login", { replace: true })} className="btn btn-primary w-full">Continue to sign in</button>
          </div>
        ) : null}
        {state === "error" ? (
          <div>
            <p className="text-[var(--error)] text-sm mb-4" role="alert">{message}</p>
            <form onSubmit={resend} className="space-y-3">
              <label htmlFor="verify-email" className="block text-sm text-[var(--text-secondary)] text-left">Email address</label>
              <input id="verify-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
              <button type="submit" disabled={resending} className="btn btn-primary w-full">{resending ? <Loader2 size={18} className="animate-spin mr-2" /> : null} Send a new link</button>
            </form>
          </div>
        ) : null}
        {state === "idle" ? <p className="text-[var(--text-secondary)] text-sm">This page needs a verification link. Check your inbox for the latest email.</p> : null}
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] mt-6"><ArrowLeft size={16} /> Back to sign in</Link>
      </main>
    </div>
  );
}

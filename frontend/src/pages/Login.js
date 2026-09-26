import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, LogIn, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import { useAuth } from "../App";
import Logo from "../components/Logo";

function fieldErrorClass(hasError) {
  return hasError ? "input input-error" : "input";
}

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState(null);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = () => {
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) next.email = "Enter a valid email address.";
    if (!formData.password) next.password = "Enter your password.";
    else if (!isLogin && formData.password.length < 8) next.password = "Password must be at least 8 characters.";
    if (!isLogin && !formData.name.trim()) next.name = "Enter your full name.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setVerifyNotice(null);
    if (!validate()) {
      document.getElementById("auth-error-summary")?.focus();
      return;
    }
    setLoading(true);
    try {
      const endpoint = isLogin ? "login" : "register";
      const response = await api.post("/auth/" + endpoint, formData);
      if (response.data.requires_verification) {
        setVerifyNotice({ email: formData.email, message: response.data.message });
        return;
      }
      login(response.data.token, response.data.user);
      toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
      navigate("/", { replace: true });
    } catch (error) {
      const status = error.response?.status;
      const code = error.response?.data?.code;
      if (status === 403 && code === "UNVERIFIED") {
        setVerifyNotice({ email: formData.email, message: error.response.data.error });
      } else if (status === 429) {
        setErrors({ form: error.response.data.error });
      } else {
        setErrors({ form: error.response?.data?.error || "Something went wrong. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!verifyNotice?.email) return;
    setResending(true);
    try {
      await api.post("/auth/request-verification", { email: verifyNotice.email });
      toast.success("Verification link sent. Check your inbox.");
    } catch {
      toast.error("Could not resend the link. Try again shortly.");
    } finally {
      setResending(false);
    }
  };

  if (verifyNotice) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-[var(--brand-primary-muted)] flex items-center justify-center text-[var(--brand-primary)]">
            <Mail size={24} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Check your email</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-6">{verifyNotice.message}</p>
          <button onClick={resendVerification} disabled={resending} className="btn btn-primary w-full">
            {resending ? <Loader2 size={18} className="animate-spin mr-2" /> : null} Resend verification link
          </button>
          <button onClick={() => setVerifyNotice(null)} className="btn btn-ghost w-full mt-2">Back to sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-[var(--brand-primary)] opacity-20 blur-[120px] rounded-full" aria-hidden="true" />
      <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-violet-600 opacity-15 blur-[120px] rounded-full" aria-hidden="true" />
      <main className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <div className="flex justify-center mb-6">
          <Logo size={58} />
        </div>
        <h1 className="text-center text-[42px] leading-[1.2] font-normal tracking-[-1.68px] text-[var(--text-primary)]">
          {isLogin ? "Welcome back to SocialHub" : "Create your SocialHub account"}
        </h1>
        <p className="text-center text-[var(--text-tertiary)] text-sm mt-1 mb-6">Manage. Connect. Grow.</p>

        {errors.form ? (
          <div id="auth-error-summary" tabIndex={-1} role="alert" className="mb-4 p-3 rounded-xl bg-[var(--error-muted)] border border-[var(--error)]/30 text-sm text-[var(--error)]">
            {errors.form}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {!isLogin && (
            <div>
              <label htmlFor="auth-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Full Name</label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
                <input id="auth-name" type="text" autoComplete="name" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={"w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent " + (errors.name ? "border-[var(--error)]" : "border-[var(--border-default)]")}
                  placeholder="John Doe" aria-invalid={!!errors.name} aria-describedby={errors.name ? "auth-name-error" : undefined} />
              </div>
              {errors.name ? <p id="auth-name-error" role="alert" className="text-xs text-[var(--error)] mt-1">{errors.name}</p> : null}
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Address</label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
              <input id="auth-email" type="email" autoComplete="email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={"w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent " + (errors.email ? "border-[var(--error)]" : "border-[var(--border-default)]")}
                placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "auth-email-error" : undefined} />
            </div>
            {errors.email ? <p id="auth-email-error" role="alert" className="text-xs text-[var(--error)] mt-1">{errors.email}</p> : null}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="auth-password" className="block text-sm font-medium text-[var(--text-secondary)]">Password</label>
              {isLogin ? <Link to="/forgot-password" className="text-xs text-[var(--brand-primary)] hover:underline">Forgot password?</Link> : null}
            </div>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
              <input id="auth-password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={"w-full pl-10 pr-3 py-2.5 bg-[var(--bg-input)] border rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent " + (errors.password ? "border-[var(--error)]" : "border-[var(--border-default)]")}
                placeholder={isLogin ? "Your password" : "At least 8 characters"} aria-invalid={!!errors.password} aria-describedby={errors.password ? "auth-password-error" : undefined} />
            </div>
            {errors.password ? <p id="auth-password-error" role="alert" className="text-xs text-[var(--error)] mt-1">{errors.password}</p> : null}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-[var(--brand-primary)] text-white py-3 rounded-[24px] hover:bg-[var(--brand-primary-hover)] transition flex items-center justify-center disabled:opacity-50 font-semibold uppercase tracking-[0.025em] text-sm" aria-busy={loading}>
            {loading ? <Loader2 size={20} className="mr-2 animate-spin" /> : <LogIn size={20} className="mr-2" aria-hidden="true" />}
            {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setErrors({}); }} className="text-[var(--brand-primary)] hover:underline text-sm">
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </main>
    </div>
  );
}

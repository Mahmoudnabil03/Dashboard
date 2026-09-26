import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../App';
import Logo from '../components/Logo';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? 'login' : 'register';
      const response = await api.post(`/auth/${endpoint}`, formData);
      
      login(response.data.token, response.data.user);
      
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* glow */}
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-[var(--brand-primary)] opacity-20 blur-[120px] rounded-full" />
      <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-violet-600 opacity-15 blur-[120px] rounded-full" />
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <div className="flex justify-center mb-8">
          <Logo size={58} dark />
        </div>
        <p className="text-center text-slate-400 mb-8 -mt-4">
          {isLogin ? 'Welcome back to SocialHub' : 'Create your SocialHub account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#0A5BFF] focus:border-transparent text-white placeholder-slate-500"
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#0A5BFF] focus:border-transparent text-white placeholder-slate-500"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#0A5BFF] focus:border-transparent text-white placeholder-slate-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--brand-primary)] text-white py-2.5 rounded-lg hover:bg-[var(--brand-primary-hover)] transition flex items-center justify-center disabled:opacity-50 font-medium shadow shadow-blue-900/30"
          >
            <LogIn size={20} className="mr-2" />
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[var(--brand-primary)] hover:text-blue-400 text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

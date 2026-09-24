import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Sparkles, Lock, Mail } from 'lucide-react';
import { Button } from '../components/common/Button';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await login(email, password);
      redirectByRole(userData.role);
    } catch (err) {
      console.error(err);
    }
  };

  const redirectByRole = (role) => {
    switch (role) {
      case 'SERVICE_PROVIDER': navigate('/provider/dashboard'); break;
      case 'OPERATIONS_MANAGER': navigate('/operations/dashboard'); break;
      case 'SUPPORT_AGENT': navigate('/support/dashboard'); break;
      case 'PLATFORM_ADMIN': navigate('/admin/dashboard'); break;
      default: navigate('/customer/dashboard'); break;
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-400 p-8 sm:p-10 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/15 p-2.5 backdrop-blur-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-sky-100/80">CareConnect</p>
                <h2 className="text-2xl font-bold">Welcome back</h2>
              </div>
            </div>

            <div className="mt-10 space-y-5">
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-sky-100/80">Service request</p>
                <p className="mt-3 text-3xl font-black leading-tight">Fast, reliable help for your home.</p>
              </div>

              <div className="grid gap-3 text-sm text-sky-50/90">
                <div className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300"></span>
                  Verified local professionals
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300"></span>
                  AI-matched quotes and scheduling
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-200"></span>
                  Transparent billing and job tracking
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 sm:p-10">
            <div className="text-center lg:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">Sign in</p>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900">Access your dashboard</h2>
              <p className="mt-2 text-sm text-slate-500">Manage requests, bookings, and service updates from one place.</p>
            </div>

            {(error || searchParams.get('session') === 'expired') && (
              <div className="mt-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium px-3 py-2.5">
                {error || 'Your session expired. Please sign in again.'}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full mt-2">Sign In</Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Don’t have an account?{' '}
              <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700 underline-offset-2 underline">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

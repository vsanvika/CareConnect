import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Sparkles, User, Mail, Lock } from 'lucide-react';
import { Button } from '../components/common/Button';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CUSTOMER',
    businessName: '',
    hourlyRate: 50
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await register(formData);
      if (user.role === 'SERVICE_PROVIDER') navigate('/provider/dashboard');
      else navigate('/customer/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 p-8 sm:p-10 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/15 p-2.5 backdrop-blur-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-emerald-100/80">CareConnect</p>
                <h2 className="text-2xl font-bold">Start earning trust</h2>
              </div>
            </div>

            <div className="mt-10 space-y-5">
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-100/80">Trusted network</p>
                <p className="mt-3 text-3xl font-black leading-tight">Build your home service presence with confidence.</p>
              </div>

              <div className="grid gap-3 text-sm text-emerald-50/90">
                <div className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-200"></span>
                  Book and manage customer requests
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-200"></span>
                  Get matched with local jobs
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-200"></span>
                  Track payments and reviews clearly
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 sm:p-10">
            <div className="text-center lg:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">Create account</p>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900">Join CareConnect</h2>
              <p className="mt-2 text-sm text-slate-500">Create your customer or provider account and get started in minutes.</p>
            </div>

            {error && (
              <div className="mt-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium px-3 py-2.5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Account Type</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none"
                >
                  <option value="CUSTOMER">Customer (Book Home Services)</option>
                  <option value="SERVICE_PROVIDER">Service Provider (Provide Work & Quotes)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    autoComplete="name"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    autoComplete="email"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="Create a secure password"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {formData.role === 'SERVICE_PROVIDER' && (
                <div className="space-y-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                  <span className="text-xs font-bold text-emerald-700 block">Provider details</span>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Business Name</label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="Apex Plumbing Services"
                      className="w-full mt-1 bg-white border border-slate-200 focus:border-emerald-400 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Hourly Rate (₹)</label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleChange}
                      className="w-full mt-1 bg-white border border-slate-200 focus:border-emerald-400 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full mt-2">Create account</Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700 underline-offset-2 underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

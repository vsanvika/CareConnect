import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Sparkles, Shield, Wrench, Droplets, Zap, Wind, Tv, Hammer, Paintbrush, Bug, CheckCircle2, ArrowRight, Star, ArrowUpRight } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const iconMap = {
    Droplets: Droplets,
    Zap: Zap,
    Sparkles: Sparkles,
    Tv: Tv,
    Wind: Wind,
    Hammer: Hammer,
    Paintbrush: Paintbrush,
    Wrench: Wrench,
    Bug: Bug
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/services');
        setCategories(res.data.data || []);
      } catch (err) {
        setCatalogError('Service categories are temporarily unavailable. You can still describe what you need to get started.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleHeroSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/request/new?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/customer/request/new');
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-14 px-4 sm:px-6 surface-grid">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent -z-10"></div>
        <div className="hero-media" aria-hidden="true">
          <div className="hero-photo hero-photo-cleaning">
            <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=700&q=80" alt="" />
          </div>
          <div className="hero-photo hero-photo-plumbing">
            <img src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=700&q=80" alt="" />
          </div>
          <div className="hero-photo hero-photo-electrical">
            <img src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=700&q=80" alt="" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="relative z-10 space-y-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass-card border border-sky-200 bg-white/80 text-sky-700 text-xs font-semibold shadow-sm">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>AI-powered home services marketplace</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[0.95] mx-auto max-w-5xl">
              Home help, handled with <span className="text-sky-600">confidence.</span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg max-w-4xl mx-auto font-normal leading-relaxed">
              CareConnect turns messy service requests into fast, verified work. Match with trusted local specialists, compare pricing, and track every job from request to invoice.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register">
                <Button size="lg" icon={ArrowRight}>Create account</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">Sign in</Button>
              </Link>
            </div>

            <form onSubmit={handleHeroSubmit} className="max-w-4xl mx-auto glass-card p-2 rounded-xl border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.06)] flex flex-col sm:flex-row gap-2 bg-white/90">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Describe your issue (e.g. 'AC blowing hot air and kitchen pipe leak')..."
                className="flex-1 bg-transparent px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:outline-none"
              />
              <Button type="submit" size="lg" icon={ArrowUpRight}>
                Start a request
              </Button>
            </form>

            <div className="pt-1 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" /> Verified providers
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600" /> AI matching
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> 4.9★ satisfaction
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Catalog Section */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div>
            <Badge variant="purple" className="mb-2">9 Service Domains</Badge>
            <h2 className="text-3xl font-bold text-slate-900">Explore Home Service Categories</h2>
            <p className="text-slate-600 text-sm mt-1">Select a category to view base rates and instantly start an AI-assisted request.</p>
          </div>
          <Link to="/customer/request/new">
            <Button variant="outline" size="sm" icon={ArrowRight}>Book Service</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl glass-panel animate-pulse"></div>
            ))
          ) : catalogError ? (
            <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-6 text-sm text-amber-200 flex items-center justify-between gap-4"><span>{catalogError}</span><Button variant="outline" size="sm" onClick={() => navigate('/customer/request/new')} icon={ArrowRight}>Start manually</Button></div>
          ) : (
            categories.map((cat) => {
              const IconComp = iconMap[cat.icon] || Wrench;
              return (
                <Card key={cat._id} className="group relative flex flex-col justify-between border-slate-200 bg-white/90 shadow-sm">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-all">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">{cat.name}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{cat.description}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Base Starting Rate</span>
                      <span className="text-base font-extrabold text-emerald-600">₹{cat.basePrice}</span>
                    </div>
                    <Link to={`/customer/request/new?category=${cat._id}`}>
                      <Button variant="secondary" size="sm" icon={ArrowRight}>Book</Button>
                    </Link>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* Workflow Architecture Showcase */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="glass-card rounded-3xl p-8 border border-slate-200 bg-white/80 space-y-8 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="info">End-to-End Workflow Engine</Badge>
            <h2 className="text-3xl font-bold text-slate-900">How CareConnect Intelligent Marketplace Works</h2>
            <p className="text-slate-600 text-sm">From natural-language request to job evidence verification and transparent dispute resolution.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm">1</div>
              <h4 className="font-bold text-slate-900 text-sm">AI Classification & Match</h4>
              <p className="text-xs text-slate-600">Request text is parsed for category, skill tags, urgency score, and eligible providers.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">2</div>
              <h4 className="font-bold text-slate-900 text-sm">Quote Comparison & Accept</h4>
              <p className="text-xs text-slate-600">Verified providers submit itemized quotes. Customers compare AI ratings and confirm slot.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">3</div>
              <h4 className="font-bold text-slate-900 text-sm">Job Evidence & Execution</h4>
              <p className="text-xs text-slate-600">Providers record progress, upload before/after photos and work logs for proof.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-sm">4</div>
              <h4 className="font-bold text-slate-900 text-sm">Automated Invoice & Review</h4>
              <p className="text-xs text-slate-600">Itemized invoices auto-generate upon job completion with dispute resolution support.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

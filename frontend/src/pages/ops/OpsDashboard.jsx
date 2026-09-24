import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Wrench, Plus, UserCheck, Activity } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const OpsDashboard = () => {
  const [categories, setCategories] = useState([]);
  const [, setLoading] = useState(true);

  // New Category Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [basePrice, setBasePrice] = useState(60);
  const [skills, setSkills] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/services');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/services', {
        name: catName,
        description: catDesc,
        basePrice: Number(basePrice),
        requiredSkillTags: skills.split(',').map(s => s.trim())
      });
      setShowAddModal(false);
      setCatName('');
      setCatDesc('');
      fetchCategories();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Badge variant="warning" className="mb-1">Operations Control Hub</Badge>
          <h1 className="text-3xl font-bold text-slate-100">Service Operations & Provider Governance</h1>
          <p className="text-xs text-slate-400">Configure marketplace domains, base tariffs, and provider verification standards.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} icon={Plus}>Add New Service Domain</Button>
      </div>

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Domains</span>
            <span className="text-2xl font-extrabold text-slate-100">{categories.length} Categories</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Provider Verification Rate</span>
            <span className="text-2xl font-extrabold text-slate-100">98.4% Verified</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">System Dispatch Health</span>
            <span className="text-2xl font-extrabold text-emerald-400">Optimal (0.4s)</span>
          </div>
        </Card>
      </div>

      {/* Categories Table */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-200">Active Service Categories & Base Tariffs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat._id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-100">{cat.name}</h3>
                <Badge variant="success">₹{cat.basePrice} Base</Badge>
              </div>
              <p className="text-xs text-slate-400">{cat.description}</p>
              <div className="text-[11px] text-slate-500 flex flex-wrap gap-1">
                {cat.requiredSkillTags?.map((st, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-blue-300">
                    {st}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Modal Add Category */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Service Domain Category">
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Category Name</label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g., Solar Panel Maintenance"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Base Price (₹)</label>
            <input
              type="number"
              required
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Description</label>
            <textarea
              rows={2}
              required
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Skill Tags (Comma separated)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="solar-repair, inverter-check"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Creating Category...' : 'Save Category'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { CalendarDays, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

const emptyForm = { start: '', end: '', kind: 'AVAILABLE', notes: '' };

const toInputValue = (value) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const AvailabilityPage = () => {
  const [periods, setPeriods] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadPeriods = async () => {
    try {
      const response = await api.get('/availability');
      setPeriods(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your availability.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        start: new Date(form.start).toISOString(),
        end: new Date(form.end).toISOString()
      };
      if (editingId) {
        await api.patch(`/availability/${editingId}`, payload);
      } else {
        await api.post('/availability', payload);
      }
      resetForm();
      await loadPeriods();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save this availability period.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (period) => {
    setEditingId(period._id);
    setForm({
      start: toInputValue(period.start),
      end: toInputValue(period.end),
      kind: period.kind || 'AVAILABLE',
      notes: period.notes || ''
    });
    setError('');
  };

  const handleDelete = async (id) => {
    try {
      setError('');
      await api.delete(`/availability/${id}`);
      if (editingId === id) resetForm();
      await loadPeriods();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete this availability period.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="space-y-2">
        <Badge variant="info" className="gap-1">
          <CalendarDays className="w-3.5 h-3.5" /> Provider calendar
        </Badge>
        <h1 className="text-3xl font-bold text-slate-100">Availability & Time Off</h1>
        <p className="text-sm text-slate-400">Set the windows when customers can book you and block time when you are unavailable.</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6">
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-100">{editingId ? 'Edit period' : 'Add period'}</h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-slate-400 hover:text-white" title="Cancel editing">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Period type</label>
              <select
                value={form.kind}
                onChange={(event) => setForm({ ...form, kind: event.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100"
              >
                <option value="AVAILABLE">Available for bookings</option>
                <option value="UNAVAILABLE">Unavailable / time off</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Starts</label>
              <input type="datetime-local" required value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Ends</label>
              <input type="datetime-local" required value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Notes</label>
              <textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Optional note for your calendar" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-100" />
            </div>
            <Button type="submit" disabled={saving} className="w-full" icon={editingId ? Check : Plus}>
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add to calendar'}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-100">Your calendar</h2>
            <span className="text-xs text-slate-500">{periods.length} periods</span>
          </div>
          {loading ? (
            <div className="h-32 rounded-xl bg-slate-900 animate-pulse" />
          ) : periods.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500">Add an availability window to accept bookings.</div>
          ) : (
            <div className="space-y-3">
              {periods.map((period) => {
                const available = (period.kind || 'AVAILABLE') === 'AVAILABLE';
                return (
                  <div key={period._id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${available ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span className="text-sm font-semibold text-slate-200">{available ? 'Available' : 'Unavailable'}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(period.start).toLocaleString()} - {new Date(period.end).toLocaleString()}
                      </p>
                      {period.notes && <p className="text-xs text-slate-500 mt-1 truncate">{period.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => handleEdit(period)} className="p-2 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-slate-800" title="Edit period">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(period._id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-800" title="Delete period">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

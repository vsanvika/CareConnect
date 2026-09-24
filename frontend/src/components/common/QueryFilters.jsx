import React from 'react';
import { Filter, Search } from 'lucide-react';
import { Button } from './Button';

export const QueryFilters = ({ fields, values, onChange, onApply, onReset }) => (
  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-end gap-3">
    {fields.map((field) => (
      <label key={field.key} className="text-[11px] text-slate-400 flex-1 min-w-[150px]">
        {field.label}
        {field.type === 'select' ? (
          <select value={values[field.key] || ''} onChange={(event) => onChange(field.key, event.target.value)} className="block w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200">
            <option value="">All</option>
            {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ) : <input type={field.type || 'text'} value={values[field.key] || ''} placeholder={field.placeholder} onChange={(event) => onChange(field.key, event.target.value)} className="block w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200" />}
      </label>
    ))}
    <Button size="sm" onClick={onApply} icon={Search}>Apply</Button>
    <Button size="sm" variant="secondary" onClick={onReset} icon={Filter}>Reset</Button>
  </div>
);

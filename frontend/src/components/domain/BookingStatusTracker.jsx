import React from 'react';
import { Check, Circle, Flag, Truck, Wrench } from 'lucide-react';

const steps = [
  { key: 'CONFIRMED', label: 'Confirmed', icon: Check },
  { key: 'PROVIDER_ON_THE_WAY', label: 'On the way', icon: Truck },
  { key: 'IN_PROGRESS', label: 'In progress', icon: Wrench },
  { key: 'COMPLETED', label: 'Completed', icon: Flag },
  { key: 'CUSTOMER_CONFIRMED', label: 'Confirmed by customer', icon: Check }
];

export const BookingStatusTracker = ({ status }) => {
  const currentIndex = steps.findIndex((step) => step.key === status);
  const terminal = ['CANCELLED', 'DISPUTED'].includes(status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const complete = !terminal && currentIndex >= index;
          const active = !terminal && currentIndex === index;
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${complete ? 'bg-blue-500/20 border-blue-400 text-blue-300' : 'border-slate-700 text-slate-600'} ${active ? 'ring-2 ring-blue-500/30' : ''}`}>
                  {complete ? <Icon className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
                </div>
                <span className={`text-[10px] text-center ${complete ? 'text-blue-300' : 'text-slate-500'}`}>{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-px flex-1 mb-5 ${!terminal && currentIndex > index ? 'bg-blue-500/60' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {terminal && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${status === 'CANCELLED' ? 'bg-slate-800 text-slate-300' : 'bg-rose-500/10 text-rose-300'}`}>
          Booking status: {status.replaceAll('_', ' ')}
        </div>
      )}
    </div>
  );
};

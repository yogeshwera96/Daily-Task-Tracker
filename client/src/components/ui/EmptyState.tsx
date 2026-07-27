import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no items matching this request right now.',
  icon = <Inbox size={42} className="text-slate-500" />,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10 text-center">
      <div className="mb-4 flex items-center justify-center p-3 rounded-full bg-slate-900 border border-slate-800">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-6">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
};
export default EmptyState;

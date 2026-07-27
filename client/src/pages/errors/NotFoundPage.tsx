import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { HelpCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-full mb-4 text-indigo-400">
        <HelpCircle size={48} />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
        The resource you are looking for has been relocated, deleted, or does not exist.
      </p>
      <Link to="/dashboard">
        <Button variant="primary">Return to Dashboard</Button>
      </Link>
    </div>
  );
};
export default NotFoundPage;

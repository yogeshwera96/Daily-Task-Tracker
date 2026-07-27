import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 bg-red-950/20 border border-red-500/10 rounded-full mb-4 text-red-400">
        <ShieldAlert size={48} />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-2">Access Denied</h1>
      <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
        You do not have the credentials or role clearance required to access this system node.
      </p>
      <Link to="/dashboard">
        <Button variant="primary">Return to Dashboard</Button>
      </Link>
    </div>
  );
};
export default ForbiddenPage;

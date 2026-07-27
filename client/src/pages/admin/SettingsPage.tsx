import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { Settings, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [saving, setSaving] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await api.get('/admin/settings');
      return res.data;
    }
  });

  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    const value = formValues[key];
    if (value === undefined) return;

    setSaving(true);
    try {
      await api.post('/admin/settings', { key, value });
      toast.success('Configuration updated successfully!');
      settingsQuery.refetch();
    } catch (err) {
      toast.error('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    if (settingsQuery.data) {
      const initialValues: Record<string, string> = {};
      settingsQuery.data.forEach((s: any) => {
        initialValues[s.key] = s.value;
      });
      setFormValues(initialValues);
    }
  }, [settingsQuery.data]);

  if (settingsQuery.isLoading) {
    return <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100">System Configuration</h2>
        <p className="text-xs text-slate-400">Manage AI settings, email server configurations, and EOD timings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI & Reporting settings */}
        <Card className="flex flex-col gap-6">
          <div className="border-b border-slate-850 pb-2 flex items-center gap-2 text-indigo-400">
            <Settings size={18} />
            <h3 className="text-sm font-semibold text-slate-200">AI & Scheduler Configuration</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1">
                <Input
                  label="EOD Generation Time (Cron format)"
                  value={formValues['eod_time'] || ''}
                  onChange={(e) => handleInputChange('eod_time', e.target.value)}
                />
              </div>
              <Button variant="secondary" onClick={() => handleSave('eod_time')}>Save</Button>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1">
                <Input
                  label="EOD Reminder Time (Cron format)"
                  value={formValues['reminder_time'] || ''}
                  onChange={(e) => handleInputChange('reminder_time', e.target.value)}
                />
              </div>
              <Button variant="secondary" onClick={() => handleSave('reminder_time')}>Save</Button>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Active AI Model"
                  value={formValues['ai_model'] || ''}
                  onChange={(e) => handleInputChange('ai_model', e.target.value)}
                />
              </div>
              <Button variant="secondary" onClick={() => handleSave('ai_model')}>Save</Button>
            </div>
          </div>
        </Card>

        {/* General details */}
        <Card className="flex flex-col gap-6">
          <div className="border-b border-slate-850 pb-2 flex items-center gap-2 text-emerald-400">
            <Settings size={18} />
            <h3 className="text-sm font-semibold text-slate-200">SMTP & Global Details</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Company Name"
                  value={formValues['company_name'] || ''}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                />
              </div>
              <Button variant="secondary" onClick={() => handleSave('company_name')}>Save</Button>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Standard Working Hours"
                  type="number"
                  value={formValues['working_hours'] || ''}
                  onChange={(e) => handleInputChange('working_hours', e.target.value)}
                />
              </div>
              <Button variant="secondary" onClick={() => handleSave('working_hours')}>Save</Button>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Mail Server (SMTP) Host"
                  value={formValues['smtp_host'] || ''}
                  onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                />
              </div>
              <Button variant="secondary" onClick={() => handleSave('smtp_host')}>Save</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default SettingsPage;

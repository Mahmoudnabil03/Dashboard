import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, BarChart3, TrendingUp, Filter, Plus, Loader2, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api';

const reportTypes = [
  { id: 'social-performance', title: 'Social Performance', description: 'Cross-platform engagement, reach, and growth metrics', icon: BarChart3 },
  { id: 'website-performance', title: 'Website Performance', description: 'Traffic, conversions, and user behavior analysis', icon: TrendingUp },
  { id: 'campaign-performance', title: 'Campaign Performance', description: 'Ad spend, ROAS, and conversion funnel', icon: FileText },
  { id: 'pixel-events', title: 'Pixel & Events Report', description: 'Tracking health, event volume, and data quality', icon: AlertTriangle },
  { id: 'monthly-business', title: 'Monthly Business Report', description: 'Executive summary with AI insights', icon: CheckCircle },
  { id: 'ai-marketing-summary', title: 'AI Marketing Summary', description: 'AI-generated insights and recommendations', icon: TrendingUp },
];

const periods = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
];

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data || []);
    } catch (error) {
      toast.error('Failed to load reports');
    }
  };

  const handleGenerate = async (type) => {
    setGenerating(type);
    try {
      const payload = {
        type,
        date_range: selectedPeriod === 'custom' ? customRange : { period: selectedPeriod },
        platforms: ['all'],
      };
      const res = await api.post('/reports', payload);
      toast.success('Report generation started');
      fetchReports();
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = async (report) => {
    if (report.file_url) {
      window.open(report.file_url, '_blank');
    } else {
      toast.error('Report file not ready');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await api.delete(`/reports/${id}`);
      toast.success('Report deleted');
      fetchReports();
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      generating: 'badge-warning',
      completed: 'badge-success',
      failed: 'badge-error',
    };
    return <span className={`badge ${styles[status] || 'badge-neutral'}`}>{status}</span>;
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Reports</h1>
          <p className="text-[var(--text-secondary)]">Generate and manage performance reports</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="card-glass p-4 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input input-sm w-auto"
          >
            {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {selectedPeriod === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customRange.from}
                onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                className="input input-sm w-auto"
                max={format(new Date(), 'yyyy-MM-dd')}
              />
              <span className="text-[var(--text-tertiary)]">to</span>
              <input
                type="date"
                value={customRange.to}
                onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                className="input input-sm w-auto"
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Generate New Report</h2>
        <div className="grid-auto">
          {reportTypes.map((type) => (
            <div
              key={type.id}
              className={`card p-6 cursor-pointer transition-all ${selectedType === type.id ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-muted)]' : ''}`}
              onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[var(--bg-input)] rounded-lg text-[var(--brand-primary)]">
                  <type.icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--text-primary)]">{type.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{type.description}</p>
                </div>
                {selectedType === type.id && (
                  <CheckCircle size={20} className="text-[var(--brand-primary)]" />
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedType && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => handleGenerate(selectedType)}
              disabled={generating === selectedType}
              className="btn btn-primary"
            >
              {generating === selectedType ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText size={18} className="mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Existing Reports */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Generated Reports</h2>
          <span className="text-sm text-[var(--text-tertiary)]">{reports.length} reports</span>
        </div>

        {reports.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <FileText size={48} className="mx-auto mb-4 text-[var(--text-tertiary)] opacity-50" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No reports yet</h3>
            <p className="text-[var(--text-secondary)] mb-6">Generate your first report to see insights here</p>
          </div>
        ) : (
          <div className="card-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Period</th>
                    <th>Platforms</th>
                    <th>Status</th>
                    <th>Generated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <div className="font-medium text-[var(--text-primary)]">{report.name || report.type}</div>
                        <div className="text-xs text-[var(--text-tertiary)] capitalize">{report.type}</div>
                      </td>
                      <td className="text-[var(--text-secondary)]">
                        {report.date_range_start && report.date_range_end ? (
                          `${format(parseISO(report.date_range_start), 'MMM d')} – ${format(parseISO(report.date_range_end), 'MMM d, yyyy')}`
                        ) : '—'}
                      </td>
                      <td className="text-[var(--text-secondary)]">
                        {report.platforms?.join(', ') || 'All'}
                      </td>
                      <td>{getStatusBadge(report.status)}</td>
                      <td className="text-[var(--text-secondary)]">
                        {report.created_at ? format(parseISO(report.created_at), 'MMM d, yyyy HH:mm') : '—'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {report.status === 'completed' && report.file_url && (
                            <button
                              onClick={() => handleDownload(report)}
                              className="btn btn-ghost btn-sm"
                              title="Download"
                            >
                              <Download size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="btn btn-ghost btn-sm text-[var(--error)] hover:text-[var(--error)]"
                            title="Delete"
                          >
                            <AlertTriangle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, DollarSign, Target, Calendar, BarChart2, Save, Loader, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { value: 'planned', label: 'Planned', color: 'bg-blue-500' },
  { value: 'active', label: 'Active', color: 'bg-[var(--success-muted)]0' },
  { value: 'paused', label: 'Paused', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-purple-500' },
  { value: 'archived', label: 'Archived', color: 'bg-gray-400' },
];

const emptyForm = {
  name: '', objective: '', platform: '', budget: '', start_date: '', end_date: '',
  audience: '', creative: '', copy: '', landing_page: '', tracking: '', notes: '', status: 'draft'
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data || []);
    } catch (error) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (campaign) => {
    setEditingId(campaign.id);
    setFormData({
      name: campaign.name || '',
      objective: campaign.objective || '',
      platform: campaign.platform || '',
      budget: campaign.budget || '',
      start_date: campaign.start_date ? campaign.start_date.split('T')[0] : '',
      end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
      audience: campaign.audience || '',
      creative: campaign.creative || '',
      copy: campaign.copy || '',
      landing_page: campaign.landing_page || '',
      tracking: campaign.tracking || '',
      notes: campaign.notes || '',
      status: campaign.status || 'draft',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...formData, budget: formData.budget ? parseFloat(formData.budget) : null };
      if (editingId) {
        await api.put(`/campaigns/${editingId}`, data);
        toast.success('Campaign updated');
      } else {
        await api.post('/campaigns', data);
        toast.success('Campaign created');
      }
      setShowModal(false);
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      toast.success('Campaign deleted');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/campaigns/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-[var(--accent-blue)]" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-[460] text-[var(--text-primary)]">Campaigns</h1>
          <p className="text-[var(--text-secondary)]">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="bg-[var(--accent-blue)] text-white px-4 py-2 rounded-xl flex items-center hover:bg-blue-600 transition text-sm">
          <Plus size={20} className="mr-2" /> New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Target size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No campaigns yet</h3>
          <p className="text-[var(--text-secondary)] mb-6">Create your first marketing campaign</p>
          <button onClick={openCreate} className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-xl hover:bg-blue-600 transition">
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-secondary)] text-left text-sm text-[var(--text-muted)]">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Objective</th>
                  <th className="p-4 font-medium">Platform</th>
                  <th className="p-4 font-medium">Budget</th>
                  <th className="p-4 font-medium">Dates</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-[var(--border-secondary)]/50 hover:bg-[var(--bg-tertiary)]/50">
                    <td className="p-4">
                      <p className="font-medium text-[var(--text-primary)]">{campaign.name}</p>
                      {campaign.objective && <p className="text-sm text-[var(--text-muted)]">{campaign.objective}</p>}
                    </td>
                    <td className="p-4 text-[var(--text-secondary)]">{campaign.objective || '—'}</td>
                    <td className="p-4">
                      {campaign.platform ? (
                        <span className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] capitalize">
                          {campaign.platform}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-4 text-[var(--text-primary)]">
                      {campaign.budget ? `$${Number(campaign.budget).toLocaleString()}` : '—'}
                    </td>
                    <td className="p-4 text-[var(--text-secondary)] text-sm">
                      {campaign.start_date && campaign.end_date ? (
                        <>
                          {new Date(campaign.start_date).toLocaleDateString()} – {new Date(campaign.end_date).toLocaleDateString()}
                        </>
                      ) : campaign.start_date ? (
                        `From ${new Date(campaign.start_date).toLocaleDateString()}`
                      ) : '—'}
                    </td>
                    <td className="p-4">
                      <select
                        value={campaign.status}
                        onChange={(e) => handleStatusChange(campaign.id, e.target.value)}
                        className="px-2 py-1 text-xs rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-secondary)]"
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(campaign)} className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(campaign.id)} className="p-2 text-[var(--text-muted)] hover:text-red-400 transition" title="Delete">
                          <Trash2 size={16} />
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[300] p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setEditingId(null); setFormData(emptyForm); } } }>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{editingId ? 'Edit Campaign' : 'New Campaign'}</h2>
              <button onClick={() => { setShowModal(false); setEditingId(null); setFormData(emptyForm); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Campaign Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                <Field label="Objective" value={formData.objective} onChange={(e) => setFormData({...formData, objective: e.target.value})} />
                <Field label="Platform" value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})} type="select" options={['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'x']} />
                <Field label="Budget ($)" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} type="number" step="0.01" />
                <Field label="Start Date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} type="date" />
                <Field label="End Date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} type="date" />
              </div>
              <Field label="Target Audience" value={formData.audience} onChange={(e) => setFormData({...formData, audience: e.target.value})} />
              <Field label="Creative Concept" value={formData.creative} onChange={(e) => setFormData({...formData, creative: e.target.value})} rows={3} />
              <Field label="Ad Copy" value={formData.copy} onChange={(e) => setFormData({...formData, copy: e.target.value})} rows={3} />
              <Field label="Landing Page URL" value={formData.landing_page} onChange={(e) => setFormData({...formData, landing_page: e.target.value})} type="url" />
              <Field label="Tracking Notes" value={formData.tracking} onChange={(e) => setFormData({...formData, tracking: e.target.value})} />
              <Field label="Notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} />
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-secondary)]">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setFormData(emptyForm); }} className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-xl hover:bg-[var(--bg-card-hover)] transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-xl hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />} {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, options, rows }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label} {required && <span className="text-red-400">*</span>}</label>
      {type === 'select' ? (
        <select value={value} onChange={onChange} className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition">
          <option value="">Select...</option>
          {options?.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
        </select>
      ) : type === 'textarea' || rows ? (
        <textarea value={value} onChange={onChange} rows={rows || 3} className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition" />
      ) : (
        <input type={type} value={value} onChange={onChange} className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition" required={required} />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Calendar, Type, Image, Video, Hash, Save, Loader, Filter, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const CONTENT_TYPES = ['post', 'reel', 'story', 'carousel', 'video', 'article', 'ad'];
const STATUSES = [
  { value: 'idea', label: 'Idea', color: 'bg-gray-500' },
  { value: 'draft', label: 'Draft', color: 'bg-blue-500' },
  { value: 'ready', label: 'Ready', color: 'bg-amber-500' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-purple-500' },
  { value: 'published', label: 'Published', color: 'bg-[var(--success-muted)]0' },
];

const PLATFORMS = ['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'x'];

const emptyForm = {
  platform: '', content_type: '', topic: '', hook: '', format: '', caption: '', creative: '', cta: '',
  status: 'idea', scheduled_date: '', notes: '', ai_generated: false
};

export default function Content() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');

  useEffect(() => {
    fetchContent();
  }, [filterStatus, filterPlatform]);

  const fetchContent = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPlatform) params.append('platform', filterPlatform);
      const res = await api.get(`/content?${params.toString()}`);
      setItems(res.data || []);
    } catch (error) {
      toast.error('Failed to load content ideas');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, scheduled_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16) });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      platform: item.platform || '',
      content_type: item.content_type || '',
      topic: item.topic || '',
      hook: item.hook || '',
      format: item.format || '',
      caption: item.caption || '',
      creative: item.creative || '',
      cta: item.cta || '',
      status: item.status || 'idea',
      scheduled_date: item.scheduled_date ? item.scheduled_date.slice(0, 16) : '',
      notes: item.notes || '',
      ai_generated: !!item.ai_generated,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...formData, ai_generated: formData.ai_generated ? 1 : 0 };
      if (editingId) {
        await api.put(`/content/${editingId}`, data);
        toast.success('Content updated');
      } else {
        await api.post('/content', data);
        toast.success('Content idea created');
      }
      setShowModal(false);
      fetchContent();
    } catch (error) {
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content idea?')) return;
    try {
      await api.delete(`/content/${id}`);
      toast.success('Content deleted');
      fetchContent();
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  const handleBulkStatus = async (status) => {
    const selected = items.filter(i => i.selected);
    if (selected.length === 0) return toast.error('Select items first');
    try {
      await api.patch('/content/bulk/status', { ids: selected.map(i => i.id), status });
      toast.success(`${selected.length} items updated to ${status}`);
      fetchContent();
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

  const filteredItems = items;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-[460] text-[var(--text-primary)]">Content Ideas</h1>
          <p className="text-[var(--text-secondary)]">{items.length} idea{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openCreate} className="bg-[var(--accent-blue)] text-white px-4 py-2 rounded-xl flex items-center hover:bg-blue-600 transition text-sm">
            <Plus size={20} className="mr-2" /> New Idea
          </button>
          {items.some(i => i.selected) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-secondary)]">{items.filter(i => i.selected).length} selected</span>
              {STATUSES.map(s => (
                <button key={s.value} onClick={() => handleBulkStatus(s.value)} className="px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent-blue)] hover:text-white transition">
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="pl-10 pr-8 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] appearance-none">
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="pl-10 pr-8 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] appearance-none">
              <option value="">All Platforms</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Type size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No content ideas yet</h3>
          <p className="text-[var(--text-secondary)] mb-6">Generate or create your first content idea</p>
          <button onClick={openCreate} className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-xl hover:bg-blue-600 transition">
            Create Idea
          </button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-secondary)] text-left text-sm text-[var(--text-muted)]">
                  <th className="p-4 w-10"><input type="checkbox" onChange={(e) => items.forEach(i => i.selected = e.target.checked)} className="rounded border-[var(--border-secondary)]" /></th>
                  <th className="p-4 font-medium">Topic</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Platform</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Scheduled</th>
                  <th className="p-4 font-medium">AI</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--border-secondary)]/50 hover:bg-[var(--bg-tertiary)]/50">
                    <td className="p-4">
                      <input type="checkbox" checked={item.selected} onChange={(e) => { item.selected = e.target.checked; setItems([...items]); }} className="rounded border-[var(--border-secondary)]" />
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-[var(--text-primary)] truncate max-w-xs">{item.topic || 'Untitled'}</p>
                      {item.hook && <p className="text-xs text-[var(--text-muted)] truncate max-w-xs">{item.hook}</p>}
                    </td>
                    <td className="p-4">
                      {item.content_type && (
                        <span className="px-2 py-0.5 text-xs bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)] capitalize">
                          {item.content_type}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {item.platform ? (
                        <span className="px-2 py-0.5 text-xs bg-[var(--accent-blue-glow)] text-[var(--accent-blue)] rounded capitalize">
                          {item.platform}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleBulkStatus(e.target.value)}
                        className="px-2 py-1 text-xs rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-secondary)]"
                      >
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="p-4 text-[var(--text-secondary)] text-sm">
                      {item.scheduled_date ? new Date(item.scheduled_date).toLocaleString() : '—'}
                    </td>
                    <td className="p-4 text-center">
                      {item.ai_generated ? (
                        <span className="px-2 py-0.5 text-xs bg-[var(--accent-violet)]/20 text-[var(--accent-violet)] rounded">AI</span>
                      ) : '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(item)} className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-[var(--text-muted)] hover:text-red-400 transition" title="Delete">
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{editingId ? 'Edit Content Idea' : 'New Content Idea'}</h2>
              <button onClick={() => { setShowModal(false); setEditingId(null); setFormData(emptyForm); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <svg size={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Platform" value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})} type="select" options={PLATFORMS} required />
                <Field label="Content Type" value={formData.content_type} onChange={(e) => setFormData({...formData, content_type: e.target.value})} type="select" options={CONTENT_TYPES} />
                <Field label="Topic" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} required />
                <Field label="Hook" value={formData.hook} onChange={(e) => setFormData({...formData, hook: e.target.value})} />
                <Field label="Format" value={formData.format} onChange={(e) => setFormData({...formData, format: e.target.value})} type="select" options={['image', 'video', 'carousel', 'text', 'link', 'poll']} />
                <Field label="Status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} type="select" options={STATUSES.map(s => s.value)} />
                <Field label="Scheduled Date" value={formData.scheduled_date} onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})} type="datetime-local" />
                <Field label="CTA" value={formData.cta} onChange={(e) => setFormData({...formData, cta: e.target.value})} />
              </div>
              <Field label="Caption" value={formData.caption} onChange={(e) => setFormData({...formData, caption: e.target.value})} rows={4} />
              <Field label="Creative Description" value={formData.creative} onChange={(e) => setFormData({...formData, creative: e.target.value})} rows={3} />
              <Field label="Notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} />
              <label className="flex items-center gap-2 text-[var(--text-secondary)]">
                <input type="checkbox" checked={formData.ai_generated} onChange={(e) => setFormData({...formData, ai_generated: e.target.checked})} className="rounded border-[var(--border-secondary)]" />
                AI Generated
              </label>
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
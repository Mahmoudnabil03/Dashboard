import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Trash2, Edit2, Mail, Phone, X, MessageSquare, Home,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const STATUSES = ['new', 'contacted', 'qualified', 'closed', 'lost'];

const statusMeta = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700', dot: 'bg-[var(--brand-primary-muted)]0' },
  contacted: { label: 'Contacted', color: 'bg-[var(--warning-muted)] text-[var(--warning)]', dot: 'bg-amber-500' },
  qualified: { label: 'Qualified', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  closed: { label: 'Closed', color: 'bg-[var(--success-muted)] text-[var(--success)]', dot: 'bg-[var(--success-muted)]0' },
  lost: { label: 'Lost', color: 'bg-gray-200 text-[var(--text-secondary)]', dot: 'bg-gray-400' },
};

const emptyForm = {
  name: '', email: '', phone: '', platform: '', message: '',
  property_id: '', status: 'new', notes: '',
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchLeads();
    fetchProperties();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads');
      setLeads(res.data);
    } catch (error) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties');
      setProperties(res.data);
    } catch (error) {
      // Non-fatal.
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (lead) => {
    setEditingId(lead.id);
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      platform: lead.platform || '',
      message: lead.message || '',
      property_id: lead.property_id ? String(lead.property_id) : '',
      status: lead.status || 'new',
      notes: lead.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/leads/${editingId}`, formData);
        toast.success('Lead updated');
      } else {
        await api.post('/leads', formData);
        toast.success('Lead added');
      }
      setShowModal(false);
      fetchLeads();
    } catch (error) {
      toast.error('Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id, status) => {
    // Optimistic update for snappy pipeline moves.
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await api.patch(`/leads/${id}/status`, { status });
    } catch (error) {
      toast.error('Failed to move lead');
      fetchLeads();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success('Lead deleted');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Leads</h1>
          <p className="text-[var(--text-secondary)]">{leads.length} lead{leads.length !== 1 ? 's' : ''} in pipeline</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[var(--brand-primary)] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[var(--brand-primary-hover)] transition"
        >
          <Plus size={20} className="mr-2" />
          Add Lead
        </button>
      </div>

      {leads.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-subtle)] text-center py-16 text-[var(--text-secondary)]">
          <Users size={48} className="mx-auto mb-4 text-[var(--text-tertiary)]" />
          <p>No leads yet</p>
          <p className="text-sm mt-1">Add one manually or convert a comment from the Comments page.</p>
        </div>
      ) : (
        <div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => {
            const columnLeads = leads.filter((l) => l.status === status);
            const meta = statusMeta[status];
            return (
              <div key={status} className="bg-[var(--bg-elevated)]/70 rounded-xl p-3 min-w-[260px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${meta.dot}`}></span>
                    <h3 className="font-semibold text-[var(--text-primary)] text-sm">{meta.label}</h3>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] rounded-full px-2 py-0.5">{columnLeads.length}</span>
                </div>

                <div className="space-y-3">
                  {columnLeads.map((lead) => (
                    <div key={lead.id} className="bg-[var(--bg-card)] rounded-lg p-3 shadow-sm border border-[var(--border-subtle)]">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-[var(--text-primary)] text-sm">{lead.name || 'Unknown'}</p>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(lead)} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(lead.id)} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--error)]">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {lead.message && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{lead.message}</p>
                      )}

                      <div className="flex flex-wrap gap-1 mt-2">
                        {lead.source === 'comment' && (
                          <span className="inline-flex items-center text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                            <MessageSquare size={10} className="mr-1" />comment
                          </span>
                        )}
                        {lead.platform && (
                          <span className="text-[10px] bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded capitalize">{lead.platform}</span>
                        )}
                        {lead.property_title && (
                          <span className="inline-flex items-center text-[10px] bg-amber-50 text-[var(--warning)] px-1.5 py-0.5 rounded">
                            <Home size={10} className="mr-1" />{lead.property_title}
                          </span>
                        )}
                      </div>

                      {(lead.email || lead.phone) && (
                        <div className="flex flex-col gap-1 mt-2 text-xs text-[var(--text-secondary)]">
                          {lead.email && <span className="flex items-center"><Mail size={12} className="mr-1" />{lead.email}</span>}
                          {lead.phone && <span className="flex items-center"><Phone size={12} className="mr-1" />{lead.phone}</span>}
                        </div>
                      )}

                      <select
                        value={lead.status}
                        onChange={(e) => changeStatus(lead.id, e.target.value)}
                        className="mt-3 w-full text-xs border border-[var(--border-subtle)] rounded-lg px-2 py-1 capitalize focus:ring-2 focus:ring-blue-500"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{statusMeta[s].label}</option>)}
                      </select>
                    </div>
                  ))}
                  {columnLeads.length === 0 && (
                    <p className="text-xs text-[var(--text-tertiary)] text-center py-4">No leads</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[300] p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false) } } }>
          <div className="bg-[var(--bg-card)] rounded-xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{editingId ? 'Edit Lead' : 'Add Lead'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Name</label>
                  <input type="text" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Status</label>
                  <select value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500">
                    {STATUSES.map((s) => <option key={s} value={s}>{statusMeta[s].label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Email</label>
                  <input type="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Phone</label>
                  <input type="tel" value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Platform</label>
                  <input type="text" value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="instagram, facebook..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Interested Property</label>
                  <select value={formData.property_id}
                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">None</option>
                    {properties.map((p) => <option key={p.id} value={p.id}>{p.title || p.address}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Message / Inquiry</label>
                <textarea value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500" rows="2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Notes</label>
                <textarea value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500" rows="2"
                  placeholder="Follow-up reminders, preferences, budget..." />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:bg-[var(--brand-primary-hover)] transition disabled:opacity-50">
                  {saving ? 'Saving...' : editingId ? 'Update Lead' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

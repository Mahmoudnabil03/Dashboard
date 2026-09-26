import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Plus, Trash2, Edit2, Bed, Bath, Maximize, MapPin,
  Sparkles, Send, RefreshCw, X, DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const PROPERTY_TYPES = ['house', 'condo', 'townhouse', 'apartment', 'land', 'commercial'];
const STATUSES = ['available', 'pending', 'sold'];
const PLATFORMS = ['instagram', 'facebook', 'twitter', 'linkedin'];
const TONES = ['professional', 'friendly', 'luxury', 'casual', 'urgent'];

const emptyForm = {
  title: '', address: '', city: '', state: '', zip: '', price: '',
  bedrooms: '', bathrooms: '', sqft: '', property_type: 'house',
  status: 'available', description: '', features: '', image_urls: '', listing_date: '',
};

const statusStyles = {
  available: 'bg-[var(--success-muted)] text-[var(--success)]',
  pending: 'bg-[var(--warning-muted)] text-[var(--warning)]',
  sold: 'bg-gray-200 text-[var(--text-secondary)]',
};

function formatPrice(price) {
  const n = Number(price);
  if (!price || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function Properties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  // Listing-to-post generator state
  const [genProperty, setGenProperty] = useState(null);
  const [genPlatform, setGenPlatform] = useState('instagram');
  const [genTone, setGenTone] = useState('professional');
  const [genContent, setGenContent] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties');
      setProperties(res.data);
    } catch (error) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      title: p.title || '',
      address: p.address || '',
      city: p.city || '',
      state: p.state || '',
      zip: p.zip || '',
      price: p.price ?? '',
      bedrooms: p.bedrooms ?? '',
      bathrooms: p.bathrooms ?? '',
      sqft: p.sqft ?? '',
      property_type: p.property_type || 'house',
      status: p.status || 'available',
      description: p.description || '',
      features: Array.isArray(p.features) ? p.features.join(', ') : '',
      image_urls: Array.isArray(p.image_urls) ? p.image_urls.join(', ') : '',
      listing_date: p.listing_date ? p.listing_date.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/properties/${editingId}`, formData);
        toast.success('Property updated');
      } else {
        await api.post('/properties', formData);
        toast.success('Property added');
      }
      setShowModal(false);
      fetchProperties();
    } catch (error) {
      toast.error('Failed to save property');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this property?')) return;
    try {
      await api.delete(`/properties/${id}`);
      toast.success('Property deleted');
      fetchProperties();
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await api.patch(`/properties/${id}/status`, { status });
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // ---- Listing-to-post generator ----
  const openGenerator = (property) => {
    setGenProperty(property);
    setGenPlatform('instagram');
    setGenTone('professional');
    setGenContent('');
    generatePost(property, 'instagram', 'professional');
  };

  const generatePost = async (property, platform, tone) => {
    setGenerating(true);
    try {
      const res = await api.post('/ai/generate-listing-post', {
        propertyId: property.id,
        platform,
        tone,
      });
      setGenContent(res.data.content);
      if (res.data.source === 'template') {
        toast('AI key not set — used a smart template', { icon: '💡' });
      }
    } catch (error) {
      toast.error('Failed to generate post');
    } finally {
      setGenerating(false);
    }
  };

  const scheduleGeneratedPost = () => {
    navigate('/posts', {
      state: {
        prefill: {
          content: genContent,
          platform: genPlatform,
          property_id: genProperty.id,
        },
      },
    });
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
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Properties</h1>
          <p className="text-[var(--text-secondary)]">{properties.length} listing{properties.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[var(--brand-primary)] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[var(--brand-primary-hover)] transition"
        >
          <Plus size={20} className="mr-2" />
          Add Property
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-subtle)] text-center py-16 text-[var(--text-secondary)]">
          <Home size={48} className="mx-auto mb-4 text-[var(--text-tertiary)]" />
          <p>No properties yet</p>
          <button onClick={openCreate} className="mt-4 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)]">
            Add your first listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties.map((p) => (
            <div key={p.id} className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-subtle)] overflow-hidden flex flex-col">
              <div className="relative h-44 bg-[var(--bg-elevated)]">
                {p.image_urls && p.image_urls.length > 0 ? (
                  <img
                    src={p.image_urls[0]}
                    alt={p.title || 'Property'}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                    <Home size={40} />
                  </div>
                )}
                <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[p.status] || 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'}`}>
                  {p.status}
                </span>
                <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium bg-[var(--bg-card)]/90 text-[var(--text-primary)] capitalize">
                  {p.property_type}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1">{p.title || 'Untitled listing'}</h3>
                  <span className="text-[var(--brand-primary)] font-bold whitespace-nowrap ml-2">{formatPrice(p.price)}</span>
                </div>
                {(p.address || p.city) && (
                  <p className="text-sm text-[var(--text-secondary)] flex items-center mt-1">
                    <MapPin size={14} className="mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">{[p.address, p.city, p.state].filter(Boolean).join(', ')}</span>
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mt-3">
                  {p.bedrooms != null && <span className="flex items-center"><Bed size={16} className="mr-1" />{p.bedrooms}</span>}
                  {p.bathrooms != null && <span className="flex items-center"><Bath size={16} className="mr-1" />{p.bathrooms}</span>}
                  {p.sqft != null && <span className="flex items-center"><Maximize size={16} className="mr-1" />{Number(p.sqft).toLocaleString()} ft²</span>}
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between gap-2">
                  <select
                    value={p.status}
                    onChange={(e) => changeStatus(p.id, e.target.value)}
                    className="text-xs border border-[var(--border-subtle)] rounded-lg px-2 py-1 capitalize focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openGenerator(p)}
                      title="Generate social post"
                      className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition"
                    >
                      <Sparkles size={16} />
                    </button>
                    <button onClick={() => openEdit(p)} title="Edit" className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} title="Delete" className="p-2 rounded-lg hover:bg-[var(--error-muted)] text-[var(--error)]">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Property Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[300] p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false) } } }>
          <div className="bg-[var(--bg-card)] rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{editingId ? 'Edit Property' : 'Add Property'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Title</label>
                <input
                  type="text" value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Charming 3BR bungalow with garden" required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Address</label>
                <input
                  type="text" value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">City</label>
                  <input type="text" value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">State</label>
                  <input type="text" value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">ZIP</label>
                  <input type="text" value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Price ($)</label>
                  <input type="number" min="0" value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Beds</label>
                  <input type="number" min="0" value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Baths</label>
                  <input type="number" min="0" step="0.5" value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Sqft</label>
                  <input type="number" min="0" value={formData.sqft}
                    onChange={(e) => setFormData({ ...formData, sqft: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Type</label>
                  <select value={formData.property_type}
                    onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500 capitalize">
                    {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Status</label>
                  <select value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500 capitalize">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Description</label>
                <textarea value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500" rows="3"
                  placeholder="Highlight the standout selling points..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Features <span className="text-[var(--text-tertiary)]">(comma separated)</span></label>
                <input type="text" value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Pool, Renovated kitchen, 2-car garage" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Image URLs <span className="text-[var(--text-tertiary)]">(comma separated)</span></label>
                <input type="text" value={formData.image_urls}
                  onChange={(e) => setFormData({ ...formData, image_urls: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://.../photo1.jpg, https://.../photo2.jpg" />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:bg-[var(--brand-primary-hover)] transition disabled:opacity-50">
                  {saving ? 'Saving...' : editingId ? 'Update Property' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Listing-to-Post Generator Modal */}
      {genProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[300] p-4" onClick={(e) => { if (e.target === e.currentTarget) { setGenProperty(null) } } }>
          <div className="bg-[var(--bg-card)] rounded-xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center">
                <Sparkles size={22} className="mr-2 text-purple-500" />
                Generate Post
              </h2>
              <button onClick={() => setGenProperty(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"><X size={24} /></button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">{genProperty.title || genProperty.address}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Platform</label>
                <select value={genPlatform}
                  onChange={(e) => setGenPlatform(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500 capitalize">
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Tone</label>
                <select value={genTone}
                  onChange={(e) => setGenTone(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500 capitalize">
                  {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={genContent}
                onChange={(e) => setGenContent(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[180px] whitespace-pre-wrap"
                placeholder={generating ? 'Generating...' : 'Generated caption will appear here'}
              />
              {generating && (
                <div className="absolute inset-0 bg-[var(--bg-card)]/60 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => generatePost(genProperty, genPlatform, genTone)}
                disabled={generating}
                className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-lg hover:bg-gray-200 transition flex items-center disabled:opacity-50"
              >
                <RefreshCw size={16} className="mr-2" /> Regenerate
              </button>
              <button
                onClick={scheduleGeneratedPost}
                disabled={!genContent || generating}
                className="flex-1 px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:bg-[var(--brand-primary-hover)] transition flex items-center justify-center disabled:opacity-50"
              >
                <Send size={16} className="mr-2" /> Schedule this Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

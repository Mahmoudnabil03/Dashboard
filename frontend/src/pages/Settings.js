import React, { useState, useEffect } from 'react';
import { 
  Building2, Palette, Link2, Bot, Bell, Users, CreditCard, 
  Save, Loader, AlertCircle, CheckCircle, Trash2, Eye, EyeOff,
  Plus, TestTube, Globe, Wifi, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const tabs = [
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'brand', label: 'Brand', icon: Palette },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
  { id: 'ai', label: 'AI', icon: Bot },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

const trackingProviders = [
  { id: 'meta_pixel', name: 'Meta Pixel', icon: '📊', description: 'Track conversions, optimize ads, build audiences for Facebook & Instagram', requires: ['pixel_id', 'access_token'] },
  { id: 'meta_capi', name: 'Meta Conversions API', icon: '🔄', description: 'Server-side event tracking for better attribution and privacy compliance', requires: ['pixel_id', 'access_token'] },
  { id: 'google_analytics', name: 'Google Analytics (GA4)', icon: '📈', description: 'Website analytics and event tracking', requires: ['pixel_id', 'api_key'] },
  { id: 'google_tag_manager', name: 'Google Tag Manager', icon: '🏷️', description: 'Manage tracking tags without code changes', requires: ['pixel_id'] },
  { id: 'tiktok_pixel', name: 'TikTok Pixel', icon: '🎵', description: 'Track conversions and build audiences on TikTok', requires: ['pixel_id', 'access_token'] },
  { id: 'linkedin_insight_tag', name: 'LinkedIn Insight Tag', icon: '💼', description: 'Track conversions and retarget website visitors on LinkedIn', requires: ['pixel_id'] },
  { id: 'snapchat_pixel', name: 'Snapchat Pixel', icon: '👻', description: 'Track conversions and optimize Snapchat ad campaigns', requires: ['pixel_id', 'access_token'] },
  { id: 'pinterest_tag', name: 'Pinterest Tag', icon: '📌', description: 'Track conversions and build audiences on Pinterest', requires: ['pixel_id', 'access_token'] },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('business');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Business settings
  const [business, setBusiness] = useState({
    name: '', category: '', website: '', description: '',
    timezone: 'UTC', country: '', target_audience: '', marketing_objective: ''
  });
  
  // Brand settings
  const [brand, setBrand] = useState({
    brand_voice: '', brand_colors: '', brand_keywords: '', 
    brand_avoid_words: '', preferred_language: 'en', content_style: ''
  });
  
  // Integrations
  const [trackingIntegrations, setTrackingIntegrations] = useState([]);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [integrationForm, setIntegrationForm] = useState({});
  const [showPassword, setShowPassword] = useState({});
  const [testingIntegration, setTestingIntegration] = useState(null);
  
  // AI settings
  const [aiSettings, setAiSettings] = useState({
    default_response_style: 'professional',
    brand_context: '',
    ai_usage_limit: 1000
  });
  
  // Notifications
  const [notifications, setNotifications] = useState({
    email: true, in_app: true, performance_alerts: true
  });

  useEffect(() => {
    fetchBusinessSettings();
    fetchTrackingIntegrations();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      const res = await api.get('/workspace/current');
      if (res.data) {
        setBusiness({
          name: res.data.name || '',
          category: res.data.business_category || '',
          website: res.data.website || '',
          description: res.data.description || '',
          timezone: res.data.timezone || 'UTC',
          country: res.data.country || '',
          target_audience: res.data.target_audience || '',
          marketing_objective: res.data.marketing_objective || ''
        });
        setBrand({
          brand_voice: res.data.brand_voice || '',
          brand_colors: res.data.brand_colors || '',
          brand_keywords: res.data.brand_keywords || '',
          brand_avoid_words: res.data.brand_avoid_words || '',
          preferred_language: res.data.preferred_language || 'en',
          content_style: res.data.content_style || ''
        });
      }
    } catch (error) {
      // Workspace endpoint may not exist yet
    }
  };

  const fetchTrackingIntegrations = async () => {
    try {
      const res = await api.get('/tracking/integrations');
      setTrackingIntegrations(res.data || []);
    } catch (error) {
      toast.error('Failed to load tracking integrations');
    }
  };

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/workspace/current', { ...business, ...brand });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIntegration = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingIntegration) {
        await api.put(`/tracking/integrations/${editingIntegration.id}`, integrationForm);
        toast.success('Integration updated');
      } else {
        await api.post('/tracking/integrations', integrationForm);
        toast.success('Integration added');
      }
      setEditingIntegration(null);
      setIntegrationForm({});
      fetchTrackingIntegrations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save integration');
    } finally {
      setSaving(false);
    }
  };

  const handleEditIntegration = (integration) => {
    setEditingIntegration(integration);
    setIntegrationForm({
      provider: integration.provider,
      name: integration.name || '',
      pixel_id: integration.pixel_id || '',
      access_token: integration.access_token || '',
      api_key: integration.api_key || '',
      api_secret: integration.api_secret || '',
      config: integration.config || {}
    });
  };

  const handleDeleteIntegration = async (id, provider) => {
    if (!window.confirm(`Delete ${provider} integration? This cannot be undone.`)) return;
    try {
      await api.delete(`/tracking/integrations/${id}`);
      toast.success('Integration deleted');
      fetchTrackingIntegrations();
    } catch (error) {
      toast.error('Failed to delete integration');
    }
  };

  const handleTestIntegration = async (integration) => {
    setTestingIntegration(integration.id);
    try {
      const res = await api.post(`/tracking/integrations/${integration.id}/test`);
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error('Test failed');
    } finally {
      setTestingIntegration(null);
    }
  };

  const handleNewIntegration = (provider) => {
    setEditingIntegration(null);
    setIntegrationForm({ provider: provider.id });
  };

  const getProviderInfo = (providerId) => {
    return trackingProviders.find(p => p.id === providerId) || { name: providerId, icon: '🔧', description: '', requires: [] };
  };

  const getIntegrationStatus = (integration) => {
    if (integration.status === 'connected' && !integration.error_message) return { label: 'Connected', color: 'text-green-400', icon: CheckCircle };
    if (integration.status === 'connected' && integration.error_message) return { label: 'Error', color: 'text-red-400', icon: AlertCircle };
    return { label: 'Disconnected', color: 'text-[var(--text-tertiary)]', icon: Wifi };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-[var(--accent-blue)]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-[460] text-[var(--text-primary)]">Settings</h1>
          <p className="text-[var(--text-secondary)] text-sm">Manage your workspace configuration and integrations</p>
        </div>
        <button 
          onClick={handleSaveBusiness}
          disabled={saving}
          className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-xl flex items-center hover:bg-blue-600 transition text-sm disabled:opacity-50"
        >
          <Save size={18} className="mr-1.5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card p-2 mb-6">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-[var(--accent-blue-glow)] text-[var(--accent-blue)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="glass-card p-6">
        {activeTab === 'business' && <BusinessTab business={business} setBusiness={setBusiness} />}
        {activeTab === 'brand' && <BrandTab brand={brand} setBrand={setBrand} />}
        {activeTab === 'integrations' && (
          <IntegrationsTab
            trackingIntegrations={trackingIntegrations}
            editingIntegration={editingIntegration}
            integrationForm={integrationForm}
            setIntegrationForm={setIntegrationForm}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            testingIntegration={testingIntegration}
            handleEditIntegration={handleEditIntegration}
            handleDeleteIntegration={handleDeleteIntegration}
            handleTestIntegration={handleTestIntegration}
            handleNewIntegration={handleNewIntegration}
            handleSaveIntegration={handleSaveIntegration}
            getProviderInfo={getProviderInfo}
            getIntegrationStatus={getIntegrationStatus}
            saving={saving}
          />
        )}
        {activeTab === 'ai' && <AITab aiSettings={aiSettings} setAiSettings={setAiSettings} />}
        {activeTab === 'notifications' && <NotificationsTab notifications={notifications} setNotifications={setNotifications} />}
        {activeTab === 'team' && <TeamTab />}
        {activeTab === 'billing' && <BillingTab />}
      </div>
    </div>
  );
}

// ============================================
// BUSINESS TAB
// ============================================
function BusinessTab({ business, setBusiness }) {
  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <Building2 size={20} className="text-[var(--accent-blue)]" />
        Business Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Business Name" type="text" value={business.name} onChange={(e) => setBusiness({...business, name: e.target.value})} placeholder="Acme Inc." />
        <Field label="Category" type="text" value={business.category} onChange={(e) => setBusiness({...business, category: e.target.value})} placeholder="E-commerce, SaaS, Agency..." />
        <Field label="Website" type="url" value={business.website} onChange={(e) => setBusiness({...business, website: e.target.value})} placeholder="https://example.com" />
        <Field label="Timezone" type="text" value={business.timezone} onChange={(e) => setBusiness({...business, timezone: e.target.value})} placeholder="UTC" />
        <Field label="Country/Market" type="text" value={business.country} onChange={(e) => setBusiness({...business, country: e.target.value})} placeholder="United States" />
        <Field label="Marketing Objective" type="text" value={business.marketing_objective} onChange={(e) => setBusiness({...business, marketing_objective: e.target.value})} placeholder="Brand awareness, Lead generation, Sales..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
        <textarea
          value={business.description}
          onChange={(e) => setBusiness({...business, description: e.target.value})}
          rows={4}
          className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition"
          placeholder="Describe your business, products, and services..."
        />
      </div>
    </form>
  );
}

// ============================================
// BRAND TAB
// ============================================
function BrandTab({ brand, setBrand }) {
  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <Palette size={20} className="text-[var(--accent-purple)]" />
        Brand Identity
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Brand Voice" type="text" value={brand.brand_voice} onChange={(e) => setBrand({...brand, brand_voice: e.target.value})} placeholder="Professional, friendly, witty, authoritative..." />
        <Field label="Preferred Language" type="text" value={brand.preferred_language} onChange={(e) => setBrand({...brand, preferred_language: e.target.value})} placeholder="en, es, fr, de..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Brand Colors (hex codes, comma separated)</label>
        <input
          type="text"
          value={brand.brand_colors}
          onChange={(e) => setBrand({...brand, brand_colors: e.target.value})}
          className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition"
          placeholder="#0A5BFF, #7c3aed, #06b6d4"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Brand Keywords (comma separated)</label>
        <input
          type="text"
          value={brand.brand_keywords}
          onChange={(e) => setBrand({...brand, brand_keywords: e.target.value})}
          className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition"
          placeholder="innovative, reliable, customer-first, premium"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Words to Avoid (comma separated)</label>
        <input
          type="text"
          value={brand.brand_avoid_words}
          onChange={(e) => setBrand({...brand, brand_avoid_words: e.target.value})}
          className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition"
          placeholder="cheap, discount, budget, guaranteed"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Content Style</label>
        <textarea
          value={brand.content_style}
          onChange={(e) => setBrand({...brand, content_style: e.target.value})}
          rows={3}
          className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition"
          placeholder="Describe your preferred content style, formatting, emoji usage, hashtag strategy..."
        />
      </div>
    </form>
  );
}

// ============================================
// INTEGRATIONS TAB
// ============================================
function IntegrationsTab({
  trackingIntegrations,
  editingIntegration,
  integrationForm,
  setIntegrationForm,
  showPassword,
  setShowPassword,
  testingIntegration,
  handleEditIntegration,
  handleDeleteIntegration,
  handleTestIntegration,
  handleNewIntegration,
  handleSaveIntegration,
  getProviderInfo,
  getIntegrationStatus,
  saving
}) {
  const connectedProviders = trackingIntegrations.map(i => i.provider);
  const availableProviders = trackingProviders.filter(p => !connectedProviders.includes(p.id));

  const togglePassword = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="space-y-8">
      {/* Connected Integrations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Link2 size={20} className="text-[var(--accent-cyan)]" />
            Connected Tracking Integrations
          </h2>
          <span className="text-sm text-[var(--text-muted)]">{trackingIntegrations.length} active</span>
        </div>
        
        {trackingIntegrations.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[var(--border-secondary)] rounded-xl">
            <Link2 size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
            <p className="text-[var(--text-secondary)] mb-4">No tracking integrations connected</p>
            <p className="text-sm text-[var(--text-muted)] mb-6">Add pixel and conversion tracking to measure website performance and optimize ad campaigns</p>
            <div className="flex flex-wrap justify-center gap-2">
              {availableProviders.slice(0, 4).map(provider => (
                <button
                  key={provider.id}
                  onClick={() => handleNewIntegration(provider)}
                  className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-sm text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition flex items-center gap-2"
                >
                  <span>{provider.icon}</span>
                  {provider.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trackingIntegrations.map(integration => {
              const provider = getProviderInfo(integration.provider);
              const status = getIntegrationStatus(integration);
              const StatusIcon = status.icon;
              
              return (
                <div key={integration.id} className="p-4 border border-[var(--border-secondary)] rounded-xl bg-[var(--bg-secondary)] hover:border-[var(--border-primary)] transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{provider.icon}</span>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{provider.name}</p>
                        <p className="text-sm text-[var(--text-muted)]">{integration.pixel_id ? `ID: ${integration.pixel_id}` : 'Not configured'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusIcon size={14} className={status.color} />
                          <span className={`text-xs ${status.color}`}>{status.label}</span>
                          {integration.last_event_at && (
                            <span className="text-xs text-[var(--text-muted)]">Last event: {new Date(integration.last_event_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestIntegration(integration)}
                        disabled={testingIntegration === integration.id}
                        className="px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition flex items-center gap-1 disabled:opacity-50"
                      >
                        {testingIntegration === integration.id ? (
                          <>
                            <Loader size={14} className="animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <TestTube size={14} />
                            Test
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleEditIntegration(integration)}
                        className="px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-secondary)] hover:border-[var(--accent-purple)] hover:text-[var(--accent-purple)] transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteIntegration(integration.id, provider.name)}
                        className="px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-red-400 hover:border-red-400 hover:bg-red-400/10 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {integration.error_message && (
                    <div className="mt-3 p-3 bg-red-400/10 border border-red-400/20 rounded-lg flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-400" />
                      <span className="text-sm text-red-400">{integration.error_message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add New Integration */}
      <div className="border-t border-[var(--border-secondary)] pt-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
          <Plus size={20} className="text-[var(--accent-green)]" />
          Add New Integration
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">Select a platform to add pixel tracking, conversion API, or analytics integration</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {availableProviders.map(provider => (
            <button
              key={provider.id}
              onClick={() => handleNewIntegration(provider)}
              className="p-4 border border-[var(--border-secondary)] rounded-xl bg-[var(--bg-secondary)] hover:border-[var(--accent-blue)] hover:bg-[var(--accent-blue-glow)] transition text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{provider.icon}</span>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{provider.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{provider.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {provider.requires.map(req => (
                  <span key={req} className="px-2 py-0.5 text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-muted)] rounded">
                    {req.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Edit/Add Form Modal */}
      {editingIntegration !== undefined && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {editingIntegration ? 'Edit Integration' : 'Add New Integration'}
              </h2>
              <button 
                onClick={() => { setEditingIntegration(null); setIntegrationForm({}); }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <svg size={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveIntegration} className="space-y-4">
              <input
                type="hidden"
                name="provider"
                value={integrationForm.provider}
                onChange={(e) => setIntegrationForm({...integrationForm, provider: e.target.value})}
              />
              
              <Field label="Integration Name (optional)" type="text" value={integrationForm.name || ''} onChange={(e) => setIntegrationForm({...integrationForm, name: e.target.value})} placeholder="My Meta Pixel" />
              
              {getProviderInfo(integrationForm.provider).requires.includes('pixel_id') && (
                <Field label="Pixel ID / Measurement ID" type="text" value={integrationForm.pixel_id || ''} onChange={(e) => setIntegrationForm({...integrationForm, pixel_id: e.target.value})} placeholder="123456789012345 or G-XXXXXXXXXX" />
              )}
              
              {getProviderInfo(integrationForm.provider).requires.includes('access_token') && (
                <PasswordField
                  label="Access Token"
                  value={integrationForm.access_token || ''}
                  onChange={(e) => setIntegrationForm({...integrationForm, access_token: e.target.value})}
                  showPassword={showPassword.access_token}
                  onToggle={() => togglePassword('access_token')}
                  placeholder="EAAG... (long-lived token)"
                />
              )}
              
              {getProviderInfo(integrationForm.provider).requires.includes('api_key') && (
                <PasswordField
                  label="API Key"
                  value={integrationForm.api_key || ''}
                  onChange={(e) => setIntegrationForm({...integrationForm, api_key: e.target.value})}
                  showPassword={showPassword.api_key}
                  onToggle={() => togglePassword('api_key')}
                  placeholder="API key or secret"
                />
              )}
              
              {getProviderInfo(integrationForm.provider).requires.includes('api_secret') && (
                <PasswordField
                  label="API Secret"
                  value={integrationForm.api_secret || ''}
                  onChange={(e) => setIntegrationForm({...integrationForm, api_secret: e.target.value})}
                  showPassword={showPassword.api_secret}
                  onToggle={() => togglePassword('api_secret')}
                  placeholder="API secret"
                />
              )}
              
              {/* Additional config fields for specific providers */}
              {(integrationForm.provider === 'tiktok_pixel' || integrationForm.provider === 'meta_capi') && (
                <Field 
                  label="Advertiser ID (for TikTok) / Dataset ID (for CAPI)" 
                  type="text" 
                  value={integrationForm.config?.advertiser_id || integrationForm.config?.dataset_id || ''} 
                  onChange={(e) => setIntegrationForm({
                    ...integrationForm, 
                    config: { 
                      ...integrationForm.config, 
                      [integrationForm.provider === 'tiktok_pixel' ? 'advertiser_id' : 'dataset_id']: e.target.value 
                    }
                  })}
                  placeholder="1234567890"
                />
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-secondary)]">
                <button
                  type="button"
                  onClick={() => { setEditingIntegration(null); setIntegrationForm({}); }}
                  className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-xl hover:bg-[var(--bg-card-hover)] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-xl hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingIntegration ? 'Update' : 'Add Integration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// AI TAB
// ============================================
function AITab({ aiSettings, setAiSettings }) {
  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <Bot size={20} className="text-[var(--accent-violet)]" />
        AI Agent Settings
      </h2>
      
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Default Response Style</label>
        <select
          value={aiSettings.default_response_style}
          onChange={(e) => setAiSettings({...aiSettings, default_response_style: e.target.value})}
          className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition"
        >
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="friendly">Friendly</option>
          <option value="witty">Witty</option>
          <option value="authoritative">Authoritative</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Brand Context for AI</label>
        <textarea
          value={aiSettings.brand_context}
          onChange={(e) => setAiSettings({...aiSettings, brand_context: e.target.value})}
          rows={5}
          className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition"
          placeholder="Provide context about your brand, products, target audience, and communication style to help AI generate better content..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Monthly AI Usage Limit</label>
        <input
          type="number"
          value={aiSettings.ai_usage_limit}
          onChange={(e) => setAiSettings({...aiSettings, ai_usage_limit: parseInt(e.target.value) || 0})}
          min="0"
          max="10000"
          className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition"
        />
      </div>
    </form>
  );
}

// ============================================
// NOTIFICATIONS TAB
// ============================================
function NotificationsTab({ notifications, setNotifications }) {
  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationOptions = [
    { key: 'email', label: 'Email Notifications', description: 'Receive important updates via email', icon: Mail },
    { key: 'in_app', label: 'In-App Notifications', description: 'Show notifications within the dashboard', icon: Bell },
    { key: 'performance_alerts', label: 'Performance Alerts', description: 'Get notified of significant metric changes', icon: TrendingUp },
  ];

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <Bell size={20} className="text-[var(--accent-amber)]" />
        Notification Preferences
      </h2>
      
      {notificationOptions.map(opt => {
        const Icon = opt.icon;
        return (
          <div key={opt.key} className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl">
            <div className="flex items-center gap-3">
              <Icon size={20} className="text-[var(--accent-blue)]" />
              <div>
                <p className="font-medium text-[var(--text-primary)]">{opt.label}</p>
                <p className="text-sm text-[var(--text-muted)]">{opt.description}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications[opt.key]}
                onChange={() => toggleNotification(opt.key)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--border-strong)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--accent-blue)]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-blue)]"></div>
            </label>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// TEAM TAB (Placeholder)
// ============================================
function TeamTab() {
  return (
    <div className="text-center py-12">
      <Users size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Team Management</h3>
      <p className="text-[var(--text-secondary)] mb-6">Invite team members, assign roles, and manage permissions</p>
      <button className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-xl hover:bg-blue-600 transition">
        Invite Team Member
      </button>
    </div>
  );
}

// ============================================
// BILLING TAB (Placeholder)
// ============================================
function BillingTab() {
  return (
    <div className="text-center py-12">
      <CreditCard size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Billing & Subscription</h3>
      <p className="text-[var(--text-secondary)] mb-6">Manage your plan, payment method, and billing history</p>
      <div className="space-y-4 max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-left">
          <p className="font-medium text-[var(--text-primary)]">Current Plan: Free</p>
          <p className="text-sm text-[var(--text-muted)]">Up to 3 social accounts, basic analytics</p>
        </div>
        <button className="w-full px-4 py-2 bg-[var(--accent-blue)] text-white rounded-xl hover:bg-blue-600 transition">
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================
function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition"
      />
    </div>
  );
}

function PasswordField({ label, value, onChange, showPassword, onToggle, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition pr-12"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
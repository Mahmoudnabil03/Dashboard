import React, { useState, useEffect } from 'react';
import { Bot, Plus, Settings, Zap, Sparkles, Power, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

function Toggle({ checked, onChange, size = 'md' }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center rounded-full transition-colors duration-200 ${checked ? 'bg-[#0A5BFF]' : 'bg-slate-700'} ${size === 'lg' ? 'w-14 h-8' : 'w-11 h-6'}`}
      aria-pressed={checked}
    >
      <span className={`inline-block bg-white rounded-full shadow transform transition-transform ${checked ? (size === 'lg' ? 'translate-x-7' : 'translate-x-5') : 'translate-x-1'} ${size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'}`} />
    </button>
  );
}

export default function AIAgent() {
  const [agents, setAgents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    config: { tone: 'professional', language: 'english', autoReply: true, contentGeneration: true }
  });

  useEffect(() => { fetchAgents(); }, []);

  const fetchAgents = async () => {
    try {
      const res = await api.get('/ai/agents');
      setAgents(res.data);
    } catch { toast.error('Failed to fetch AI agents'); }
  };

  const createAgent = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/ai/agents', formData);
      toast.success('AI Agent created!');
      setShowModal(false);
      setFormData({ name: '', description: '', config: { tone: 'professional', language: 'english', autoReply: true, contentGeneration: true } });
      fetchAgents();
    } catch { toast.error('Failed to create AI agent'); }
    finally { setLoading(false); }
  };

  const toggleAgent = async (id) => {
    try {
      const res = await api.patch(`/ai/agents/${id}/toggle`);
      setAgents(prev => prev.map(a => a.id === id ? res.data : a));
      toast.success(res.data.is_active ? 'Agent turned ON' : 'Agent turned OFF');
    } catch { toast.error('Toggle failed'); }
  };

  const toggleAll = async (nextOn) => {
    try {
      const res = await api.post('/ai/agents/toggle-all', { is_active: nextOn });
      setAgents(res.data);
      toast.success(nextOn ? 'All agents ON — auto-reply enabled' : 'All agents OFF — auto-reply paused');
    } catch { toast.error('Toggle failed'); }
  };

  const deleteAgent = async (id) => {
    if (!window.confirm('Delete this agent?')) return;
    try { await api.delete(`/ai/agents/${id}`); toast.success('Deleted'); fetchAgents(); } catch { toast.error('Delete failed'); }
  };

  const generateSuggestions = async () => {
    try {
      const res = await api.post('/ai/suggestions', { platform: 'all', topic: 'social media engagement', targetAudience: 'general' });
      setSuggestions(res.data.suggestions);
    } catch { toast.error('Failed to generate suggestions'); }
  };

  const activeCount = agents.filter(a => a.is_active).length;
  const masterOn = activeCount > 0;

  return (
    <div className="text-[#292827]">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-[460] text-[#292827]">AI Agent</h1>
          <p className="text-[#666666] text-sm">Auto-reply to chats & comments with SocialHub AI</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#0A5BFF] text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition text-sm">
          <Plus size={18} className="mr-1" /> New Agent
        </button>
      </div>

      {/* Master ON/OFF */}
      <div className={`rounded-2xl p-6 border mb-8 flex items-center justify-between ${masterOn ? 'bg-white border-[#714cb6]' : 'bg-white border-[#e3e3e2]'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${masterOn ? 'bg-[#d4c7ff] text-[#421d24]' : 'bg-[#f2f0eb] text-[#666666]'}`}>
            <Power size={24} />
          </div>
          <div>
            <p className="font-semibold text-[#292827] flex items-center gap-2">AI Auto-Reply <span className={`text-xs px-2 py-0.5 rounded-full ${masterOn ? 'bg-[#0c4243] text-white' : 'bg-[#e3e3e2] text-[#666666]'}`}>{masterOn ? 'ON' : 'OFF'}</span></p>
            <p className="text-sm text-[#666666]">{masterOn ? `${activeCount} agent(s) will reply to chats & comments` : 'All agents paused — no automatic replies will be sent'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 hidden sm:block">{masterOn ? 'Shut down' : 'Enable'}</span>
          <Toggle checked={masterOn} onChange={toggleAll} size="lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-[#666666] text-sm">Active Agents</p><p className="text-3xl font-[460] text-[#292827]">{activeCount}</p></div>
            <Bot size={32} className="text-[#0A5BFF]" />
          </div>
        </div>
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-[#666666] text-sm">Auto Replies</p><p className="text-3xl font-[460] text-[#292827]">{masterOn ? 'ON' : 'PAUSED'}</p></div>
            <Zap size={32} className="text-violet-400" />
          </div>
        </div>
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-[#666666] text-sm">Platforms</p><p className="text-3xl font-[460] text-[#292827]">6</p></div>
            <Sparkles size={32} className="text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0f172a] rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Your AI Agents</h2>
          {agents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Bot size={48} className="mx-auto mb-4 text-slate-700" />
              <p>No AI agents yet</p>
              <button onClick={() => setShowModal(true)} className="mt-4 text-[#0A5BFF] hover:text-blue-400">Create your first agent</button>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map(a => (
                <div key={a.id} className={`p-4 rounded-xl border flex items-center justify-between ${a.is_active ? 'border-emerald-800 bg-emerald-950/20' : 'border-slate-800 bg-slate-900/50'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <Bot size={18} className={a.is_active ? 'text-emerald-400' : 'text-slate-500'} />
                      <span className="font-semibold text-white">{a.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{a.is_active ? 'ON' : 'OFF'}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{a.description || 'No description'}</p>
                    <p className="text-xs text-slate-500 mt-1">Tone: {a.config?.tone} • Auto-reply: {a.config?.autoReply ? 'yes' : 'no'}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Toggle checked={!!a.is_active} onChange={() => toggleAgent(a.id)} />
                    <button onClick={() => deleteAgent(a.id)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
                    <Settings size={16} className="text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center"><Sparkles size={18} className="mr-2 text-amber-400" />Content Ideas</h2>
          <button onClick={generateSuggestions} className="w-full mb-4 bg-[#0A5BFF] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">Generate Ideas</button>
          {suggestions ? <div className="max-h-[400px] overflow-y-auto text-sm text-slate-300 whitespace-pre-wrap">{suggestions}</div> : <p className="text-sm text-slate-500 text-center py-8">Click generate for AI ideas (works for chats & comments)</p>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8 max-w-lg w-full">
            <h2 className="text-xl font-bold text-white mb-6">Create AI Agent</h2>
            <form onSubmit={createAgent} className="space-y-4">
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Social Media Assistant" required className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Handles WhatsApp chats, Instagram comments..." className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
              <select value={formData.config.tone} onChange={e => setFormData({ ...formData, config: { ...formData.config, tone: e.target.value } })} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
                <option value="professional">Professional</option><option value="casual">Casual</option><option value="friendly">Friendly</option><option value="witty">Witty</option>
              </select>
              <label className="flex items-center text-sm text-slate-300"><input type="checkbox" checked={formData.config.autoReply} onChange={e => setFormData({ ...formData, config: { ...formData.config, autoReply: e.target.checked } })} className="mr-2" /> Auto-reply to chats & comments</label>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-[#0A5BFF] text-white rounded-lg disabled:opacity-50">{loading ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

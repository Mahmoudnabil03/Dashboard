import React, { useState, useEffect, useRef } from 'react';
import { Bot, Plus, Settings, Zap, Sparkles, Power, Trash2, Send, Loader2, Copy, ThumbsUp, ThumbsDown, Mic, MicOff, FileText, Image, Video, Smile, X, BarChart3, Target } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api';

function Toggle({ checked, onChange, size = 'md', disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex items-center rounded-full transition-colors duration-200 ${checked ? 'bg-[var(--brand-primary)]' : 'bg-[var(--border-default)]'} ${size === 'lg' ? 'w-14 h-8' : 'w-11 h-6'} opacity-${disabled ? 50 : 100}`}
      aria-pressed={checked}
      aria-label={checked ? 'ON' : 'OFF'}
    >
      <span className={`inline-block bg-white rounded-full shadow transform transition-transform ${checked ? (size === 'lg' ? 'translate-x-7' : 'translate-x-5') : 'translate-x-1'} ${size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'}`} />
    </button>
  );
}

export default function AIAgent() {
  const [agents, setAgents] = useState([]);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    config: { tone: 'professional', language: 'english', autoReply: true, contentGeneration: true }
  });
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAgents = async () => {
    try {
      const res = await api.get('/ai/agents');
      setAgents(res.data || []);
      if (res.data?.length > 0 && !selectedAgentId) {
        setSelectedAgentId(res.data[0].id);
      }
    } catch { toast.error('Failed to fetch AI agents'); }
  };

  const createAgent = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/ai/agents', formData);
      toast.success('AI Agent created!');
      setShowAgentModal(false);
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

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedAgentId) return;
    
    const userMessage = { role: 'user', content: chatInput, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.post('/ai/chat', { 
        agent_id: selectedAgentId, 
        message: chatInput,
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      });
      
      const aiMessage = { 
        role: 'assistant', 
        content: res.data.reply, 
        timestamp: new Date().toISOString(),
        agent_id: selectedAgentId
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error('Failed to get AI response');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.', 
        timestamp: new Date().toISOString(),
        error: true
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const handleQuickAction = (action) => {
    const prompts = {
      campaign: 'Create a marketing campaign for my new product launch',
      content: 'Give me 5 content ideas for Instagram this week',
      analyze: 'Analyze my recent social media performance',
      video: 'Create an AI video prompt for a product demo',
      strategy: 'Suggest a social media strategy for Q1',
    };
    setChatInput(prompts[action] || '');
  };

  const activeCount = agents.filter(a => a.is_active).length;
  const masterOn = activeCount > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">AI Agent</h1>
          <p className="text-[var(--text-secondary)] text-sm">Your marketing co-pilot for strategy, content, and automation</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowChatModal(true)} 
            className="btn btn-primary"
          >
            <Bot size={18} className="mr-2" /> Open Chat
          </button>
          <button onClick={() => setShowAgentModal(true)} className="btn btn-secondary">
            <Plus size={18} className="mr-1" /> New Agent
          </button>
        </div>
      </div>

      {/* Master Toggle */}
      <div className={`card p-6 mb-8 flex items-center justify-between ${masterOn ? 'border-[var(--brand-primary)]/30 bg-[var(--brand-primary-muted)]/30' : ''}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${masterOn ? 'bg-[var(--brand-primary-muted)] text-[var(--brand-primary)]' : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'}`}>
            <Power size={24} />
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              AI Auto-Reply
              <span className={`text-xs px-2 py-0.5 rounded-full ${masterOn ? 'bg-[var(--success)] text-white' : 'bg-[var(--border-default)] text-[var(--text-tertiary)]'}`}>
                {masterOn ? 'ACTIVE' : 'PAUSED'}
              </span>
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {masterOn ? `${activeCount} agent(s) will auto-reply to chats & comments` : 'All agents paused — no automatic replies will be sent'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-tertiary)] hidden sm:block">{masterOn ? 'Disable' : 'Enable'}</span>
          <Toggle checked={masterOn} onChange={toggleAll} size="lg" disabled={activeCount === 0 && !masterOn} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-[var(--text-tertiary)] text-sm">Active Agents</p><p className="text-3xl font-bold text-[var(--text-primary)]">{activeCount}</p></div>
            <Bot size={32} className="text-[var(--brand-primary)]" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-[var(--text-tertiary)] text-sm">Auto Replies</p><p className="text-3xl font-bold text-[var(--text-primary)]">{masterOn ? 'ON' : 'PAUSED'}</p></div>
            <Zap size={32} className="text-[var(--brand-secondary)]" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-[var(--text-tertiary)] text-sm">Platforms</p><p className="text-3xl font-bold text-[var(--text-primary)]">6</p></div>
            <Sparkles size={32} className="text-[var(--success)]" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Agents List */}
        <div className="lg:col-span-2 card min-h-0 flex flex-col">
          <div className="p-6 border-b border-[var(--border-subtle)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your AI Agents</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {agents.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-tertiary)]">
                <Bot size={48} className="mx-auto mb-4 opacity-50" />
                <p className="mb-4">No AI agents yet</p>
                <button onClick={() => setShowAgentModal(true)} className="text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-medium">
                  Create your first agent
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {agents.map(a => (
                  <div key={a.id} className={`p-4 rounded-xl border flex items-center justify-between ${a.is_active ? 'border-[var(--success)]/30 bg-[var(--success)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Bot size={18} className={a.is_active ? 'text-[var(--success)]' : 'text-[var(--text-tertiary)]'} />
                        <span className="font-semibold text-[var(--text-primary)] truncate">{a.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_active ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--border-default)] text-[var(--text-tertiary)]'}`}>
                          {a.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-tertiary)] mt-1 truncate">{a.description || 'No description'}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">Tone: {a.config?.tone} • Auto-reply: {a.config?.autoReply ? 'yes' : 'no'}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <Toggle checked={!!a.is_active} onChange={() => toggleAgent(a.id)} disabled={activeCount === 1 && a.is_active} />
                      <button onClick={() => { setSelectedAgentId(a.id); setShowChatModal(true); }} className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-tertiary)] hover:text-[var(--brand-primary)]" title="Chat with this agent">
                        <Send size={16} />
                      </button>
                      <button onClick={() => deleteAgent(a.id)} className="p-2 hover:bg-[var(--error)]/10 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)]"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Sidebar / Quick Actions */}
        <div className="card flex flex-col">
          <div className="p-6 border-b border-[var(--border-subtle)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles size={20} className="text-[var(--warning)]" /> Quick Actions
            </h2>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="space-y-3">
              {[
                { id: 'campaign', label: 'Generate Campaign', icon: FileText, desc: 'Create full marketing campaign with strategy, audience & creative' },
                { id: 'content', label: 'Content Ideas', icon: Sparkles, desc: 'Get 5 platform-specific content ideas with hooks & hashtags' },
                { id: 'analyze', label: 'Analyze Performance', icon: BarChart3, desc: 'Get AI insights on your recent social media performance' },
                { id: 'video', label: 'AI Video Prompt', icon: Video, desc: 'Generate production-ready prompt for AI video generators' },
                { id: 'strategy', label: 'Marketing Strategy', icon: Target, desc: 'Get quarterly strategy with audience, budget & testing plan' },
              ].map(action => (
                <button
                  key={action.id}
                  onClick={() => { handleQuickAction(action.id); setShowChatModal(true); }}
                  className="w-full p-4 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-muted)]/30 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[var(--bg-elevated)] rounded-lg text-[var(--brand-primary)]">
                      <action.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--text-primary)]">{action.label}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">{action.desc}</p>
                    </div>
                    <Send size={16} className="text-[var(--text-tertiary)]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[300] p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowAgentModal(false) } } }>
          <div className="card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Create AI Agent</h2>
              <button onClick={() => setShowAgentModal(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><X size={24} /></button>
            </div>
            <form onSubmit={createAgent} className="space-y-4">
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Social Media Assistant" required className="input" />
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Handles WhatsApp chats, Instagram comments..." className="input textarea" />
              <select value={formData.config.tone} onChange={e => setFormData({ ...formData, config: { ...formData.config, tone: e.target.value } })} className="input select">
                <option value="professional">Professional</option><option value="casual">Casual</option><option value="friendly">Friendly</option><option value="witty">Witty</option><option value="authoritative">Authoritative</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input type="checkbox" checked={formData.config.autoReply} onChange={e => setFormData({ ...formData, config: { ...formData.config, autoReply: e.target.checked } })} className="rounded border-[var(--border-default)]" />
                Auto-reply to chats & comments
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input type="checkbox" checked={formData.config.contentGeneration} onChange={e => setFormData({ ...formData, config: { ...formData.config, contentGeneration: e.target.checked } })} className="rounded border-[var(--border-default)]" />
                Content generation enabled
              </label>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAgentModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary">{loading ? <Loader2 size={18} className="animate-spin mr-2" /> : 'Create Agent'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[300] p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowChatModal(false) } } }>
          <div className="card w-full max-w-2xl max-h-[90vh] h-[90vh] flex flex-col animate-scale-in">
            {/* Chat Header */}
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowChatModal(false)} className="lg:hidden p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-lg"><X size={24} /></button>
                <div className="p-2 bg-[var(--brand-primary-muted)] rounded-lg text-[var(--brand-primary)]"><Bot size={20} /></div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">AI Marketing Assistant</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Agent: {agents.find(a => a.id === selectedAgentId)?.name || 'Default'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowHistory(!showHistory)} className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-tertiary)]" title="History">
                  <FileText size={18} />
                </button>
                <button onClick={() => setShowChatModal(false)} className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-tertiary)]"><X size={20} /></button>
              </div>
            </div>

            {/* History Sidebar */}
            {showHistory && (
              <div className="w-64 border-l border-[var(--border-subtle)] flex flex-col">
                <div className="p-4 border-b border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-[var(--text-primary)]">Chat History</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {chatHistory.slice().reverse().map((chat, i) => (
                    <button key={i} onClick={() => {}} className="w-full p-3 rounded-lg hover:bg-[var(--bg-elevated)] text-left text-sm text-[var(--text-secondary)] truncate">
                      {chat.title || chat.messages[0]?.content?.slice(0, 30) || 'New chat'}
                    </button>
                  ))}
                  {chatHistory.length === 0 && <p className="p-4 text-center text-[var(--text-tertiary)] text-sm">No history yet</p>}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-tertiary)]">
                  <Bot size={48} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium text-[var(--text-secondary)]">Start a conversation</p>
                  <p className="text-sm mt-1">Ask me anything about marketing, content, or strategy</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--brand-primary-muted)] text-[var(--brand-primary)]'}`}>
                        {msg.role === 'user' ? <span className="text-xs font-bold">U</span> : <Bot size={16} />}
                      </div>
                      <div className={`max-w-[70%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`p-3 rounded-2xl ${msg.role === 'user' ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]'}`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[var(--text-tertiary)]">{format(new Date(msg.timestamp), 'HH:mm')}</span>
                          {msg.role === 'assistant' && !msg.error && (
                            <>
                              <button onClick={() => copyMessage(msg.content)} className="p-1 hover:bg-[var(--bg-elevated)] rounded" title="Copy"><Copy size={12} /></button>
                              <button className="p-1 hover:bg-[var(--bg-elevated)] rounded" title="Good response"><ThumbsUp size={12} /></button>
                              <button className="p-1 hover:bg-[var(--bg-elevated)] rounded" title="Bad response"><ThumbsDown size={12} /></button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--brand-primary-muted)] flex items-center justify-center"><Loader2 size={16} className="animate-spin text-[var(--brand-primary)]" /></div>
                      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3 rounded-2xl animate-pulse">
                        <div className="h-4 bg-[var(--border-default)] rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-[var(--border-default)] rounded w-1/2"></div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--border-subtle)]">
              <form onSubmit={sendMessage} className="flex gap-2">
                <div className="relative flex-1">
                  <div className="flex items-center gap-1 p-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
                    <button type="button" className="p-2 text-[var(--text-tertiary)] hover:text-[var(--brand-primary)]" title="Add image"><Image size={18} /></button>
                    <button type="button" className="p-2 text-[var(--text-tertiary)] hover:text-[var(--brand-primary)]" title="Add video"><Video size={18} /></button>
                    <button type="button" className="p-2 text-[var(--text-tertiary)] hover:text-[var(--brand-primary)]" title="Add emoji"><Smile size={18} /></button>
                  </div>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask me anything about marketing..."
                    className="input w-full bg-transparent border-0 placeholder-[var(--text-tertiary)] pr-12"
                    disabled={chatLoading}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(e))}
                  />
                </div>
                <button type="submit" disabled={!chatInput.trim() || chatLoading} className="btn btn-primary p-3 rounded-xl">
                  <Send size={20} />
                </button>
              </form>
              <p className="text-xs text-[var(--text-tertiary)] text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

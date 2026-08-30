import React, { useState, useEffect } from 'react';
import { Bot, Plus, Settings, Zap, Sparkles, Clock, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

export default function AIAgent() {
  const [agents, setAgents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    config: {
      tone: 'professional',
      language: 'english',
      autoReply: true,
      contentGeneration: true
    }
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await api.get('/ai/agents');
      setAgents(response.data);
    } catch (error) {
      toast.error('Failed to fetch AI agents');
    }
  };

  const createAgent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/ai/agents', formData);
      toast.success('AI Agent created successfully!');
      setShowModal(false);
      setFormData({ name: '', description: '', config: { tone: 'professional', language: 'english', autoReply: true, contentGeneration: true } });
      fetchAgents();
    } catch (error) {
      toast.error('Failed to create AI agent');
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    try {
      const response = await api.post('/ai/suggestions', {
        platform: 'all',
        topic: 'social media engagement',
        targetAudience: 'general',
      });
      setSuggestions(response.data.suggestions);
    } catch (error) {
      toast.error('Failed to generate suggestions');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">AI Agent</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Active Agents</p>
              <p className="text-3xl font-bold">{agents.filter(a => a.is_active).length}</p>
            </div>
            <Bot size={32} className="text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Auto Replies</p>
              <p className="text-3xl font-bold">247</p>
            </div>
            <Zap size={32} className="text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Content Generated</p>
              <p className="text-3xl font-bold">56</p>
            </div>
            <Sparkles size={32} className="text-green-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Your AI Agents</h2>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition text-sm"
            >
              <Plus size={18} className="mr-1" />
              New Agent
            </button>
          </div>

          {agents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bot size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No AI agents configured</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Create your first AI agent
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="p-4 border rounded-lg hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <Bot size={20} className="text-blue-600 mr-2" />
                        <h3 className="font-semibold text-gray-800">{agent.name}</h3>
                        {agent.is_active && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{agent.description}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-500 space-x-4">
                        <span>Tone: {agent.config?.tone || 'professional'}</span>
                        <span>Language: {agent.config?.language || 'english'}</span>
                        <span className="flex items-center">
                          <Check size={14} className="mr-1" />
                          {agent.config?.autoReply ? 'Auto-reply on' : 'Auto-reply off'}
                        </span>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <Settings size={18} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Content Suggestions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Sparkles size={20} className="mr-2 text-yellow-500" />
            Content Ideas
          </h2>
          
          <button
            onClick={generateSuggestions}
            className="w-full mb-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition"
          >
            Generate Ideas
          </button>

          {suggestions ? (
            <div className="max-h-[400px] overflow-y-auto">
              <div className="prose prose-sm">
                {suggestions.split('\n').map((line, i) => (
                  <p key={i} className="text-gray-700 text-sm mb-2">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Sparkles size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Click generate for AI-powered content ideas</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Agent Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create AI Agent</h2>
            <form onSubmit={createAgent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="e.g., Social Media Assistant"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="What should this agent do?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tone
                  </label>
                  <select
                    value={formData.config.tone}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, tone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="witty">Witty</option>
                    <option value="inspirational">Inspirational</option>
                  </select>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.config.autoReply}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, autoReply: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    Auto-reply to comments
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.config.contentGeneration}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, contentGeneration: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    Generate content
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Agent'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Calendar, Trash2, Home, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const PLATFORMS = ['twitter', 'instagram', 'facebook', 'linkedin'];

export default function Posts() {
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    platform: 'twitter',
    scheduled_time: '',
    account_id: '',
    property_id: '',
  });

  useEffect(() => {
    fetchPosts();
    fetchAccounts();
    fetchProperties();
  }, []);

  // Support pre-filled content passed from the "Create post" button on the Properties page.
  useEffect(() => {
    if (location.state?.prefill) {
      const { content, platform, property_id } = location.state.prefill;
      setFormData((prev) => ({
        ...prev,
        content: content || '',
        platform: platform || prev.platform,
        property_id: property_id ? String(property_id) : '',
      }));
      setShowModal(true);
    }
  }, [location.state]);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts');
      setPosts(response.data);
    } catch (error) {
      toast.error('Failed to fetch posts');
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/social/accounts');
      setAccounts(response.data);
    } catch (error) {
      // Non-fatal: account list is optional for drafting.
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data);
    } catch (error) {
      // Non-fatal.
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/posts', {
        content: formData.content,
        platform: formData.platform,
        scheduled_time: formData.scheduled_time || null,
        account_id: formData.account_id || null,
        property_id: formData.property_id || null,
      });
      toast.success('Post scheduled successfully!');
      closeModal();
      fetchPosts();
    } catch (error) {
      toast.error('Failed to schedule post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${id}`);
      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ content: '', platform: 'twitter', scheduled_time: '', account_id: '', property_id: '' });
  };

  const propertyLabel = (id) => {
    const p = properties.find((x) => String(x.id) === String(id));
    return p ? p.title || p.address : null;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Posts</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[var(--brand-primary)] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[var(--brand-primary-hover)] transition"
        >
          <Plus size={20} className="mr-2" />
          New Post
        </button>
      </div>

      {/* Posts List */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-subtle)]">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            <Calendar size={48} className="mx-auto mb-4 text-[var(--text-tertiary)]" />
            <p>No posts scheduled yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)]"
            >
              Create your first post
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <div key={post.id} className="p-6 hover:bg-[var(--bg-elevated)] transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-[var(--text-primary)] mb-2 whitespace-pre-wrap">{post.content}</p>
                    <div className="flex items-center flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                      {post.scheduled_time && (
                        <span className="flex items-center">
                          <Calendar size={16} className="mr-1" />
                          {new Date(post.scheduled_time).toLocaleString()}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        post.status === 'published' ? 'bg-[var(--success-muted)] text-[var(--success)]' :
                        post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                      }`}>
                        {post.status}
                      </span>
                      <span className="bg-[var(--bg-elevated)] px-2 py-1 rounded-full text-xs capitalize">
                        {post.platform}
                      </span>
                      {post.property_id && propertyLabel(post.property_id) && (
                        <span className="flex items-center bg-[var(--warning-muted)] text-[var(--warning)] px-2 py-1 rounded-full text-xs">
                          <Home size={12} className="mr-1" />
                          {propertyLabel(post.property_id)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 hover:bg-[var(--error-muted)] rounded-lg text-[var(--error)] transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[300] p-4" onClick={(e) => { if (e.target === e.currentTarget) { closeModal() } } }>
          <div className="bg-[var(--bg-card)] rounded-xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Schedule New Post</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
                    placeholder="What do you want to share?"
                    required
                  />
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">{formData.content.length} characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500 capitalize"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Account
                  </label>
                  <select
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select connected account (optional)</option>
                    {accounts
                      .filter((a) => a.platform === formData.platform)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          @{a.username} ({a.platform})
                        </option>
                      ))}
                  </select>
                  {accounts.filter((a) => a.platform === formData.platform).length === 0 && (
                    <p className="text-xs text-[var(--warning)] mt-1">
                      No {formData.platform} account connected yet. You can still save a draft.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Linked Property (optional)
                  </label>
                  <select
                    value={formData.property_id}
                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title || p.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Schedule Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:bg-[var(--brand-primary-hover)] transition disabled:opacity-50 flex items-center"
                  >
                    <Send size={18} className="mr-2" />
                    {loading ? 'Scheduling...' : 'Schedule Post'}
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

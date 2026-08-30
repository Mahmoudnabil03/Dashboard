import React, { useState, useEffect } from 'react';
import { MessageSquare, Reply, Bot, Check, Clock, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

export default function Comments() {
  const [comments, setComments] = useState([]);
  const [selectedComment, setSelectedComment] = useState(null);
  const [aiReply, setAiReply] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      // Fetch comments for all posts
      const postsRes = await api.get('/posts');

      let allComments = [];
      for (const post of postsRes.data) {
        const commentsRes = await api.get(`/social/comments/${post.id}`);
        allComments = [...allComments, ...commentsRes.data.map(c => ({ ...c, post_content: post.content }))];
      }

      setComments(allComments);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch comments');
      setLoading(false);
    }
  };

  const generateAIReply = async (comment) => {
    setGenerating(true);
    try {
      const response = await api.post('/ai/reply-comment', {
        comment: comment.content,
        context: comment.post_content || 'Social media post',
        agentId: 1, // Default agent
      });
      setAiReply(response.data.reply);
      setSelectedComment(comment);
    } catch (error) {
      toast.error('Failed to generate AI reply');
    } finally {
      setGenerating(false);
    }
  };

  const convertToLead = async (comment) => {
    try {
      await api.post('/leads/from-comment', { comment_id: comment.id });
      toast.success('Comment converted to lead!');
    } catch (error) {
      if (error.response?.status === 409) {
        toast('A lead already exists for this comment', { icon: 'ℹ️' });
      } else {
        toast.error('Failed to convert to lead');
      }
    }
  };

  const handleReply = async () => {
    if (!selectedComment || !aiReply.trim()) return;

    try {
      await api.post('/social/comments/reply', {
        commentId: selectedComment.id,
        reply: aiReply,
      });
      toast.success('Reply sent successfully!');
      setAiReply('');
      setSelectedComment(null);
      fetchComments();
    } catch (error) {
      toast.error('Failed to send reply');
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
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Comments</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comments List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MessageSquare size={20} className="mr-2" />
            Inbox ({comments.length})
          </h2>
          
          {comments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No comments to manage</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-4 border rounded-lg transition ${
                    comment.replied ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{comment.author || 'Anonymous'}</p>
                      <p className="text-gray-600 mt-1">{comment.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {comment.post_content ? `On: ${comment.post_content.substring(0, 60)}...` : ''}
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                        {comment.replied && (
                          <span className="flex items-center text-xs text-green-600">
                            <Check size={14} className="mr-1" />
                            Replied
                          </span>
                        )}
                      </div>
                    </div>
                    {!comment.replied && (
                      <div className="flex flex-col gap-1 ml-2">
                        <button
                          onClick={() => generateAIReply(comment)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                          disabled={generating}
                          title="Generate AI reply"
                        >
                          <Bot size={18} />
                        </button>
                        <button
                          onClick={() => convertToLead(comment)}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                          title="Convert to lead"
                        >
                          <UserPlus size={18} />
                        </button>
                      </div>
                    )}
                    {comment.replied && (
                      <button
                        onClick={() => convertToLead(comment)}
                        className="ml-2 p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                        title="Convert to lead"
                      >
                        <UserPlus size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Reply Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Bot size={20} className="mr-2 text-blue-600" />
            AI Reply Assistant
          </h2>

          {selectedComment ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Original Comment:</p>
                <p className="text-gray-800">{selectedComment.content}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Generated Reply
                </label>
                <textarea
                  value={aiReply}
                  onChange={(e) => setAiReply(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                  placeholder="AI reply will appear here..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleReply}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                >
                  <Reply size={18} className="mr-2" />
                  Send Reply
                </button>
                <button
                  onClick={() => generateAIReply(selectedComment)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center"
                  disabled={generating}
                >
                  <Bot size={18} className="mr-2" />
                  {generating ? 'Generating...' : 'Regenerate'}
                </button>
                <button
                  onClick={() => {
                    setSelectedComment(null);
                    setAiReply('');
                  }}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Bot size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Select a comment to generate AI reply</p>
              <p className="text-sm mt-2">Click the Bot icon next to any comment</p>
            </div>
          )}

          {!selectedComment && comments.some(c => !c.replied) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <Clock size={16} className="inline mr-1" />
                {comments.filter(c => !c.replied).length} comments waiting for reply
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
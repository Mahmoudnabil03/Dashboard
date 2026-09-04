import React, { useState, useEffect } from 'react';
import { Twitter, Instagram, Facebook, Linkedin, Plus, Trash2, Check, Loader, MessageCircle, Music2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const platformIcons = {
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  whatsapp: MessageCircle,
  tiktok: Music2
};

const platformColors = {
  twitter: 'bg-[#1DA1F2]',
  instagram: 'bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5]',
  facebook: 'bg-[#0866FF]',
  linkedin: 'bg-[#0A66C2]',
  whatsapp: 'bg-[#25D366]',
  tiktok: 'bg-slate-950'
};

export default function SocialAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/social/accounts');
      setAccounts(response.data);
    } catch (error) {
      toast.error('Failed to fetch social accounts');
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async (platform) => {
    setConnecting(platform);
    try {
      const response = await api.get(`/social/${platform}/auth`);
      
      // Open OAuth window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        response.data.authUrl,
        `${platform}_auth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );
      if (!popup) {
        toast.error('Popup blocked. Allow popups and try again.');
        setConnecting(null);
        return;
      }

      // Listen for OAuth callback - works for same-origin HTML popup
      const handleMessage = (event) => {
        if (event.data?.type === 'oauth_callback' && event.data.platform === platform) {
          if (event.data.success) {
            toast.success(`${platform} connected successfully!`);
            fetchAccounts();
          } else {
            toast.error(event.data.error || `Failed to connect ${platform}`);
          }
          try { popup.close(); } catch(e) {}
          window.removeEventListener('message', handleMessage);
          setConnecting(null);
        }
      };
      window.addEventListener('message', handleMessage);
      // Safety timeout
      setTimeout(() => setConnecting(null), 120000);
    } catch (error) {
      const msg = error.response?.data?.error || `Failed to initiate ${platform} connection`;
      toast.error(msg);
      setConnecting(null);
    }
  };

  const disconnectAccount = async (id, platform) => {
    if (!confirm(`Disconnect ${platform} account?`)) return;

    try {
      await api.delete(`/social/accounts/${id}`);
      toast.success(`${platform} disconnected`);
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to disconnect account');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const platforms = ['twitter', 'instagram', 'facebook', 'linkedin', 'whatsapp', 'tiktok'];

  return (
    <div className="bg-white rounded-2xl border border-[#e3e3e2] p-6">
      <h2 className="text-lg font-semibold text-[#292827] mb-4">Connected Accounts</h2>
      <p className="text-sm text-[#666666] mb-4">Connect your social apps. OAuth callback: this hosted Worker URL. WhatsApp uses Meta Business Login; TikTok requires a TikTok developer app.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const Icon = platformIcons[platform];
          const account = accounts.find(a => a.platform === platform);
          const isConnected = !!account;
          const color = platformColors[platform];

          return (
            <div
              key={platform}
              className={`p-4 border rounded-xl transition ${
                isConnected ? 'border-[#714cb6] bg-[#d4c7ff]/30' : 'border-[#e3e3e2] bg-[#f2f0eb] hover:border-[#714cb6]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`${color} p-2 rounded-lg text-white`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-[#292827] capitalize">{platform}</p>
                    {isConnected ? (
                      <p className="text-sm text-[#0c4243] flex items-center">
                        <Check size={14} className="mr-1" />
                        Connected as @{account.username}
                      </p>
                    ) : (
                      <p className="text-sm text-[#666666]">Not connected</p>
                    )}
                  </div>
                </div>
                
                {isConnected ? (
                  <button
                    onClick={() => disconnectAccount(account.id, platform)}
                    className="p-2 text-[#421d24] hover:bg-[#f2f0eb] rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => connectAccount(platform)}
                    disabled={connecting === platform}
                    className="px-4 py-2 bg-[#0A5BFF] text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center disabled:opacity-50"
                  >
                    {connecting === platform ? (
                      <Loader size={16} className="animate-spin mr-2" />
                    ) : (
                      <Plus size={16} className="mr-1" />
                    )}
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

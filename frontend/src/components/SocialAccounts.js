import React, { useState, useEffect } from 'react';
import { Twitter, Instagram, Facebook, Linkedin, Plus, Trash2, Check, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const platformIcons = {
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin
};

const platformColors = {
  twitter: 'bg-blue-400',
  instagram: 'bg-pink-500',
  facebook: 'bg-blue-600',
  linkedin: 'bg-blue-700'
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

      // Listen for OAuth callback
      const handleMessage = (event) => {
        if (event.origin === window.location.origin) {
          if (event.data.type === 'oauth_callback') {
            if (event.data.success) {
              toast.success(`${platform} connected successfully!`);
              fetchAccounts();
            } else {
              toast.error(`Failed to connect ${platform}`);
            }
            popup.close();
            window.removeEventListener('message', handleMessage);
          }
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      toast.error(`Failed to initiate ${platform} connection`);
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

  const platforms = ['twitter', 'instagram', 'facebook', 'linkedin'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Connected Accounts</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const Icon = platformIcons[platform];
          const account = accounts.find(a => a.platform === platform);
          const isConnected = !!account;
          const color = platformColors[platform];

          return (
            <div
              key={platform}
              className={`p-4 border rounded-lg transition ${
                isConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`${color} p-2 rounded-lg text-white`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 capitalize">{platform}</p>
                    {isConnected ? (
                      <p className="text-sm text-green-600 flex items-center">
                        <Check size={14} className="mr-1" />
                        Connected as @{account.username}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Not connected</p>
                    )}
                  </div>
                </div>
                
                {isConnected ? (
                  <button
                    onClick={() => disconnectAccount(account.id, platform)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => connectAccount(platform)}
                    disabled={connecting === platform}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center disabled:opacity-50"
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
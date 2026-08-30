import React from 'react';
import SocialAccounts from '../components/SocialAccounts';

export default function Accounts() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Connected Accounts</h1>
      <p className="text-gray-500 mb-8">Link your social platforms to publish listings and manage engagement.</p>
      <SocialAccounts />
    </div>
  );
}

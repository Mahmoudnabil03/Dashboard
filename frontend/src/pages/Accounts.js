import React from 'react';
import SocialAccounts from '../components/SocialAccounts';

export default function Accounts() {
  return (
    <div>
      <h1 className="text-3xl font-[460] text-[#292827] mb-2">Connected Accounts</h1>
      <p className="text-[#666666] mb-8">Link your social platforms to publish content and manage engagement.</p>
      <SocialAccounts />
    </div>
  );
}

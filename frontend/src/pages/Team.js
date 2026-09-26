import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, Shield, MoreVertical, Trash2, Edit2, Loader2, CheckCircle, XCircle, Bell, UserCheck, UserX } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api';

const roles = [
  { id: 'owner', label: 'Owner', description: 'Full access including billing, deletion, and ownership transfer', color: 'text-[var(--error)]', permissions: ['all'] },
  { id: 'admin', label: 'Admin', description: 'Manage team, integrations, settings, and all content', color: 'text-[var(--brand-primary)]', permissions: ['team', 'integrations', 'settings', 'content', 'analytics', 'campaigns'] },
  { id: 'manager', label: 'Manager', description: 'Manage campaigns, analytics, content, and AI agents', color: 'text-[var(--success)]', permissions: ['campaigns', 'analytics', 'content', 'ai'] },
  { id: 'analyst', label: 'Analyst', description: 'View analytics, reports, and exports only', color: 'text-[var(--warning)]', permissions: ['analytics', 'reports'] },
  { id: 'content', label: 'Content Creator', description: 'Create and manage posts, content ideas, and calendar', color: 'text-[var(--brand-secondary)]', permissions: ['content', 'calendar', 'posts'] },
];

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('content');
  const [changingRole, setChangingRole] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/workspace/members');
      setMembers(res.data || []);
    } catch (error) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return toast.error('Email is required');
    setInviting(true);
    try {
      await api.post('/workspace/members/invite', { email: inviteEmail, role: inviteRole });
      toast.success('Invitation sent');
      setInviteEmail('');
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    setChangingRole(memberId);
    try {
      await api.patch(`/workspace/members/${memberId}/role`, { role: newRole });
      toast.success('Role updated');
      fetchMembers();
    } catch (error) {
      toast.error('Failed to update role');
    } finally {
      setChangingRole(null);
    }
  };

  const handleRemove = async (memberId, email) => {
    if (!window.confirm(`Remove ${email} from the workspace?`)) return;
    try {
      await api.delete(`/workspace/members/${memberId}`);
      toast.success('Member removed');
      fetchMembers();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentMember = members.find(m => m.user_id === currentUser.id);
  const isOwner = currentMember?.role === 'owner';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--brand-primary)]" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Team Management</h1>
          <p className="text-[var(--text-secondary)]">Invite team members and manage roles & permissions</p>
        </div>
      </div>

      {/* Invite Form */}
      <div className="card-glass p-6 mb-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Invite New Member</h2>
        <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="input"
              required
            />
          </div>
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Role</label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="input select">
              {roles.filter(r => r.id !== 'owner').map((role) => (
                <option key={role.id} value={role.id}>{role.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={inviting} className="btn btn-primary">
            {inviting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Plus size={18} className="mr-2" />} Send Invitation
          </button>
        </form>
      </div>

      {/* Current Members */}
      <div className="card-glass overflow-hidden">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Team Members ({members.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const roleInfo = roles.find(r => r.id === member.role) || roles[1];
                const isCurrentUser = member.user_id === currentUser.id;
                const canManage = isOwner && !isCurrentUser;
                return (
                  <tr key={member.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar bg-[var(--gradient-brand)]">
                          {member.name ? member.name.charAt(0).toUpperCase() : member.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">
                            {member.name || 'Unnamed'}
                            {isCurrentUser && <span className="badge badge-primary ml-2 text-xs">You</span>}
                          </div>
                          <div className="text-sm text-[var(--text-tertiary)]">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {canManage ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          disabled={changingRole === member.id}
                          className="input input-sm select w-auto"
                        >
                          {roles.filter(r => !(r.id === 'owner' && member.role !== 'owner')).map((role) => (
                            <option key={role.id} value={role.id}>{role.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`font-medium ${roleInfo.color}`}>{roleInfo.label}</span>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {roleInfo.permissions.map((p) => (
                          <span key={p} className="badge badge-neutral text-xs">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success">Active</span>
                    </td>
                    <td className="text-[var(--text-secondary)]">
                      {member.created_at ? format(parseISO(member.created_at), 'MMM d, yyyy') : '—'}
                    </td>
                    <td>
                      {canManage && !isCurrentUser ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRemove(member.id, member.email)}
                            className="btn btn-ghost btn-sm text-[var(--error)] hover:text-[var(--error)]"
                            title="Remove from workspace"
                          >
                            <UserX size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">—</span>
                      )}
                    </td>
                  </tr>
                );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Definitions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Role Definitions</h2>
        <div className="grid-auto">
          {roles.map((role) => (
            <div key={role.id} className="card p-6">
              <div className="flex items-start gap-4">
                <Shield size={24} className={role.color} />
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--text-primary)]">{role.label}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{role.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {role.permissions.map((p) => (
                      <span key={p} className="badge badge-neutral text-xs">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
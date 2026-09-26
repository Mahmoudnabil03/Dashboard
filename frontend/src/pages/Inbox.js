import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Check, Inbox as InboxIcon, MessageCircle, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

export default function Inbox() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInbox = async () => {
    setLoading(true);
    try { const response = await api.get('/social/inbox'); setItems(response.data || []); }
    catch { toast.error('Failed to load unified inbox'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInbox(); }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const matchesFilter = filter === 'all' || (filter === 'open' ? !item.replied : !!item.replied);
    const text = `${item.author || ''} ${item.content || ''} ${item.platform || ''}`.toLowerCase();
    return matchesFilter && text.includes(query.toLowerCase());
  }), [items, filter, query]);

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8"><div><h1 className="text-3xl font-[460] text-[var(--text-primary)]">Unified Inbox</h1><p className="text-[var(--text-secondary)] mt-1">Manage comments and conversations from every connected channel.</p></div><button onClick={fetchInbox} className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] flex items-center text-sm"><RefreshCw size={16} className="mr-2" />Refresh</button></div>
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center"><div className="relative flex-1 min-w-[220px]"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people, comments, platforms" className="w-full pl-9 pr-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-sm" /></div><div className="flex gap-2">{[['all', 'All'], ['open', 'Needs reply'], ['replied', 'Replied']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`px-3 py-2 rounded-lg text-sm ${filter === value ? 'bg-[#d4c7ff] text-[var(--error)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'}`}>{label}</button>)}</div></div>
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">{loading ? <div className="py-16 text-center text-[var(--text-secondary)]">Loading inbox...</div> : filtered.length === 0 ? <div className="py-16 text-center text-[var(--text-secondary)]"><InboxIcon size={42} className="mx-auto mb-3 text-[var(--text-tertiary)]" /><p>No conversations match this view.</p></div> : <div className="divide-y divide-[var(--border-subtle)]">{filtered.map((item) => <InboxItem key={item.id} item={item} onUpdated={fetchInbox} />)}</div>}</div>
    </div>
  );
}

function InboxItem({ item, onUpdated }) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [assignee, setAssignee] = useState(item.assignee || '');
  const [tstatus, setTstatus] = useState(item.ticket_status || 'open');
  const [ticketSaving, setTicketSaving] = useState(false);
  const saveTicket = async (patch) => { setTicketSaving(true); try { await api.patch('/social/inbox/' + item.id, patch); onUpdated(); } catch { toast.error('Could not update ticket'); } finally { setTicketSaving(false); } };
  const [mod, setMod] = useState(null);
  const [checking, setChecking] = useState(false);
  const moderate = async () => { setChecking(true); try { const r = await api.post('/ai/moderate', { text: item.content || '' }); setMod(r.data); } catch { toast.error('Moderation unavailable'); } finally { setChecking(false); } };
  const generate = async () => { try { const response = await api.post('/ai/reply-comment', { comment: item.content, context: item.post_content || 'Social media conversation' }); setReply(response.data.reply || ''); } catch (error) { toast.error(error.response?.data?.error || 'AI reply unavailable'); } };
  const send = async () => { if (!reply.trim()) return; setSending(true); try { await api.post('/social/comments/reply', { commentId: item.id, reply }); toast.success('Reply sent'); setReply(''); onUpdated(); } catch (error) { toast.error(error.response?.data?.error || 'Failed to send reply'); } finally { setSending(false); } };
  return <div className={`p-5 ${item.replied ? 'bg-[var(--bg-elevated)]/50' : ''}`}><div className="flex gap-4"><div className="w-10 h-10 rounded-full bg-[#d4c7ff] text-[var(--error)] flex items-center justify-center font-semibold shrink-0">{(item.author || '?').slice(0, 1).toUpperCase()}</div><div className="flex-1 min-w-0"><div className="flex flex-wrap justify-between gap-2"><div><span className="font-semibold text-[var(--text-primary)]">{item.author || 'Anonymous'}</span><span className="ml-2 text-xs text-[#714cb6] capitalize">{item.platform || 'social'}</span></div><span className="text-xs text-[var(--text-tertiary)]">{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</span></div><p className="text-[var(--text-primary)] mt-2">{item.content}</p>{item.post_content && <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">On: {item.post_content}</p>}{mod ? <div className="flex flex-wrap items-center gap-1.5 mt-2">{mod.sentiment !== "unknown" ? <span className="badge badge-info">{mod.sentiment}{typeof mod.score === "number" ? " " + Math.round(mod.score * 100) + "%" : ""}</span> : null}{mod.spam ? <span className="badge badge-error">spam: {(mod.spam_reasons || []).join(", ")}</span> : <span className="badge badge-success">clean</span>}</div> : <button onClick={moderate} disabled={checking} className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--brand-primary)] hover:underline disabled:opacity-50"><ShieldAlert size={13} />{checking ? "Checking..." : "Check tone & spam"}</button>}<div className="flex flex-wrap items-center gap-2 mt-4">{item.replied ? <span className="text-xs text-emerald-700 flex items-center"><Check size={14} className="mr-1" /> Replied</span> : <><button onClick={generate} className="px-3 py-1.5 rounded-lg bg-[#d4c7ff] text-[var(--error)] text-sm flex items-center"><Bot size={15} className="mr-1.5" />Draft with AI</button><span className="text-xs text-[var(--text-tertiary)] flex items-center"><MessageCircle size={14} className="mr-1" />Needs reply</span></>}</div>{<div className="mt-3 flex flex-wrap items-center gap-2"><select value={tstatus} disabled={ticketSaving} onChange={(e) => { setTstatus(e.target.value); saveTicket({ ticket_status: e.target.value }); }} aria-label="Ticket status" className="px-2 py-1.5 text-xs rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)]"><option value="open">Open</option><option value="pending">Pending</option><option value="resolved">Resolved</option></select><input value={assignee} onChange={(e) => setAssignee(e.target.value)} onBlur={() => { if (assignee !== (item.assignee || "")) saveTicket({ assignee: assignee }); }} placeholder="Assign to..." aria-label="Assign ticket" className="px-2 py-1.5 text-xs rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] w-32" /></div>}{<div className="mt-3 flex flex-wrap items-center gap-2"><select value={tstatus} disabled={ticketSaving} onChange={(e) => { setTstatus(e.target.value); saveTicket({ ticket_status: e.target.value }); }} aria-label="Ticket status" className="px-2 py-1.5 text-xs rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)]"><option value="open">Open</option><option value="pending">Pending</option><option value="resolved">Resolved</option></select><input value={assignee} onChange={(e) => setAssignee(e.target.value)} onBlur={() => { if (assignee !== (item.assignee || "")) saveTicket({ assignee: assignee }); }} placeholder="Assign to..." aria-label="Assign ticket" className="px-2 py-1.5 text-xs rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] w-32" /></div>}{!item.replied && reply && <div className="mt-3 flex gap-2"><input value={reply} onChange={(event) => setReply(event.target.value)} className="flex-1 px-3 py-2 border border-[var(--border-subtle)] rounded-lg text-sm" /><button onClick={send} disabled={sending} className="px-4 py-2 rounded-lg bg-[#421d24] text-white text-sm disabled:opacity-50">{sending ? 'Sending...' : 'Send'}</button></div>}</div></div></div>;
}

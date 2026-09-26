import React, { useState, useEffect } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, addMonths, subMonths, parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const platformColors = {
  twitter: 'bg-blue-400',
  instagram: 'bg-pink-500',
  facebook: 'bg-[var(--brand-primary)]',
  linkedin: 'bg-blue-700',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayModal, setDayModal] = useState(null); // { date, posts }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, propsRes] = await Promise.all([
        api.get('/posts'),
        api.get('/properties'),
      ]);
      setPosts(postsRes.data || []);
      setProperties(propsRes.data || []);
    } catch (error) {
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  const propertyLabel = (id) => {
    const p = properties.find((x) => String(x.id) === String(id));
    return p ? p.title || p.address : null;
  };

  // Only posts that actually have a scheduled time belong on the calendar.
  const scheduledPosts = posts.filter((p) => p.scheduled_time);

  const movePost = async (postId, day) => {
    const post = posts.find((x) => String(x.id) === String(postId));
    if (!post || !post.scheduled_time) return;
    try {
      const prev = parseISO(post.scheduled_time);
      const next = new Date(day);
      next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
      await api.put(`/posts/${postId}`, { scheduled_time: next.toISOString() });
      toast.success("Post rescheduled to " + format(next, "MMM d"));
      fetchData();
    } catch { toast.error("Could not reschedule post"); }
  };

  const postsForDay = (day) =>
    scheduledPosts.filter((p) => {
      try {
        return isSameDay(parseISO(p.scheduled_time), day);
      } catch {
        return false;
      }
    });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const scheduledThisMonth = scheduledPosts.filter((p) => {
    try { return isSameMonth(parseISO(p.scheduled_time), currentMonth); } catch { return false; }
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Content Calendar</h1>
          <p className="text-[var(--text-secondary)]">{scheduledThisMonth} post{scheduledThisMonth !== 1 ? 's' : ''} scheduled this month</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-[var(--text-primary)] w-40 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
            <ChevronRight size={20} />
          </button>
          <button onClick={() => setCurrentMonth(new Date())}
            className="ml-2 px-3 py-2 text-sm rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
            Today
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-subtle)] overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b bg-[var(--bg-elevated)]">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayPosts = postsForDay(day);
            const inMonth = isSameMonth(day, currentMonth);
            const today = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[110px] border-b border-r p-2 last:border-r-0 ${inMonth ? 'bg-[var(--bg-card)]' : 'bg-[var(--bg-elevated)]/50'} ${dayPosts.length ? 'cursor-pointer hover:bg-[var(--brand-primary-muted)]/40' : ''}`}
                onClick={() => dayPosts.length && setDayModal({ date: day, posts: dayPosts })}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/post-id"); if (id) movePost(id, day); }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${today ? 'bg-[var(--brand-primary)] text-white w-6 h-6 flex items-center justify-center rounded-full' : inMonth ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayPosts.length > 0 && (
                    <span className="text-[10px] text-[var(--text-tertiary)]">{dayPosts.length}</span>
                  )}
                </div>

                <div className="mt-1 space-y-1">
                  {dayPosts.slice(0, 3).map((p) => (
                    <div key={p.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/post-id", String(p.id)); e.dataTransfer.effectAllowed = "move"; }} title="Drag to another day to reschedule" className="flex items-center text-[11px] text-[var(--text-secondary)] truncate cursor-grab active:cursor-grabbing">
                      <span className={`w-2 h-2 rounded-full mr-1 flex-shrink-0 ${platformColors[p.platform] || 'bg-gray-400'}`}></span>
                      <span className="truncate">{p.content?.slice(0, 24) || '(no text)'}</span>
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <div className="text-[10px] text-[var(--brand-primary)]">+{dayPosts.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-sm text-[var(--text-secondary)]">
        {Object.entries(platformColors).map(([platform, color]) => (
          <span key={platform} className="flex items-center capitalize">
            <span className={`w-2.5 h-2.5 rounded-full mr-1.5 ${color}`}></span>{platform}
          </span>
        ))}
      </div>

      {/* Day detail modal */}
      {dayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[300] p-4" onClick={(e) => { if (e.target === e.currentTarget) { setDayModal(null) } } }>
          <div className="bg-[var(--bg-card)] rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center">
                <CalendarIcon size={18} className="mr-2 text-[var(--brand-primary)]" />
                {format(dayModal.date, 'EEEE, MMMM d, yyyy')}
              </h2>
              <button onClick={() => setDayModal(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"><X size={22} /></button>
            </div>
            <div className="space-y-3">
              {dayModal.posts.map((p) => (
                <div key={p.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${platformColors[p.platform] || 'bg-gray-400'}`}></span>
                    <span className="text-xs font-medium text-[var(--text-primary)] capitalize">{p.platform}</span>
                    <span className="text-xs text-[var(--text-tertiary)]">{format(parseISO(p.scheduled_time), 'p')}</span>
                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${
                      p.status === 'published' ? 'bg-[var(--success-muted)] text-[var(--success)]' :
                      p.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                    }`}>{p.status}</span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{p.content}</p>
                  {p.property_id && propertyLabel(p.property_id) && (
                    <span className="inline-flex items-center text-[11px] bg-amber-50 text-[var(--warning)] px-2 py-0.5 rounded mt-2">
                      <Home size={11} className="mr-1" />{propertyLabel(p.property_id)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

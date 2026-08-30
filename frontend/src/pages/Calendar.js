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
  facebook: 'bg-blue-600',
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
          <h1 className="text-3xl font-bold text-gray-800">Content Calendar</h1>
          <p className="text-gray-500">{scheduledThisMonth} post{scheduledThisMonth !== 1 ? 's' : ''} scheduled this month</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-gray-800 w-40 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
            <ChevronRight size={20} />
          </button>
          <button onClick={() => setCurrentMonth(new Date())}
            className="ml-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
            Today
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">{d}</div>
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
                className={`min-h-[110px] border-b border-r p-2 last:border-r-0 ${inMonth ? 'bg-white' : 'bg-gray-50/50'} ${dayPosts.length ? 'cursor-pointer hover:bg-blue-50/40' : ''}`}
                onClick={() => dayPosts.length && setDayModal({ date: day, posts: dayPosts })}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${today ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : inMonth ? 'text-gray-700' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayPosts.length > 0 && (
                    <span className="text-[10px] text-gray-400">{dayPosts.length}</span>
                  )}
                </div>

                <div className="mt-1 space-y-1">
                  {dayPosts.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center text-[11px] text-gray-600 truncate">
                      <span className={`w-2 h-2 rounded-full mr-1 flex-shrink-0 ${platformColors[p.platform] || 'bg-gray-400'}`}></span>
                      <span className="truncate">{p.content?.slice(0, 24) || '(no text)'}</span>
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <div className="text-[10px] text-blue-600">+{dayPosts.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
        {Object.entries(platformColors).map(([platform, color]) => (
          <span key={platform} className="flex items-center capitalize">
            <span className={`w-2.5 h-2.5 rounded-full mr-1.5 ${color}`}></span>{platform}
          </span>
        ))}
      </div>

      {/* Day detail modal */}
      {dayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <CalendarIcon size={18} className="mr-2 text-blue-600" />
                {format(dayModal.date, 'EEEE, MMMM d, yyyy')}
              </h2>
              <button onClick={() => setDayModal(null)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>
            <div className="space-y-3">
              {dayModal.posts.map((p) => (
                <div key={p.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${platformColors[p.platform] || 'bg-gray-400'}`}></span>
                    <span className="text-xs font-medium text-gray-700 capitalize">{p.platform}</span>
                    <span className="text-xs text-gray-400">{format(parseISO(p.scheduled_time), 'p')}</span>
                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${
                      p.status === 'published' ? 'bg-green-100 text-green-700' :
                      p.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>{p.status}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.content}</p>
                  {p.property_id && propertyLabel(p.property_id) && (
                    <span className="inline-flex items-center text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded mt-2">
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

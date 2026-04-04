'use client';

import { useState, useEffect } from 'react';

const activities = [
  { name: 'Sarah K.', city: 'Austin, TX',      action: 'just created a video',   time: '2 min ago' },
  { name: 'Marcus D.', city: 'Miami, FL',       action: 'got 4 new leads',        time: '5 min ago' },
  { name: 'Jennifer L.', city: 'Los Angeles, CA', action: 'just signed up free',  time: '8 min ago' },
  { name: 'Ryan T.', city: 'Nashville, TN',     action: 'just created a video',   time: '11 min ago' },
  { name: 'Ashley B.', city: 'Denver, CO',      action: 'upgraded to Pro',        time: '14 min ago' },
  { name: 'Chris P.', city: 'Seattle, WA',      action: 'got 22k views on TikTok', time: '18 min ago' },
  { name: 'Melissa W.', city: 'Phoenix, AZ',    action: 'just created a video',   time: '21 min ago' },
  { name: 'David H.', city: 'Chicago, IL',      action: 'just signed up free',    time: '24 min ago' },
];

export function LiveActivity() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Show first popup after 8 seconds
    const initialDelay = setTimeout(() => {
      setVisible(true);
      setShown(true);
    }, 8000);

    return () => clearTimeout(initialDelay);
  }, []);

  useEffect(() => {
    if (!shown) return;

    // Hide after 4 seconds
    const hideTimer = setTimeout(() => setVisible(false), 4000);

    // Show next after 12 seconds
    const nextTimer = setTimeout(() => {
      setCurrent((c) => (c + 1) % activities.length);
      setVisible(true);
    }, 12000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, [current, shown]);

  const activity = activities[current];

  return (
    <div
      className={[
        'fixed bottom-24 left-4 z-40 transition-all duration-500 max-w-[280px]',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
      ].join(' ')}
    >
      <div className="bg-[#F0EDE6] border border-[#E0DCD4] rounded-[6px] p-3 shadow-2xl flex items-center gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#F0B429] flex items-center justify-center text-[10px] font-bold text-[#1A1714] shrink-0">
          {activity.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#1A1714] truncate">
            {activity.name} · {activity.city}
          </p>
          <p className="text-xs text-[#1A1714]">{activity.action}</p>
          <p className="text-[10px] text-[#7A7672]">{activity.time}</p>
        </div>
        {/* Green dot */}
        <div className="w-2 h-2 bg-[#F0B429] rounded-full shrink-0 animate-pulse" />
      </div>
    </div>
  );
}

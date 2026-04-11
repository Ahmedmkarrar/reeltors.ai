'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Profile } from '@/types';

const CATEGORIES = ['General Feedback', 'Bug Report', 'Feature Request', 'Billing Question', 'Other'] as const;

export default function FeedbackPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [category, setCategory] = useState<string>('General Feedback');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single<Profile>();
      if (data) setProfile(data);
    }
    load();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message }),
      });
      if (!res.ok) throw new Error();
      toast.success("Message sent — we'll get back to you soon.");
      setMessage('');
      setCategory('General Feedback');
    } catch {
      toast.error('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }

  // loading skeleton
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-6 md:p-8 space-y-4">
        <div className="h-7 shimmer rounded w-44 mb-1" />
        <div className="h-4 shimmer rounded w-56 mb-6" />
        <div className="h-64 shimmer rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 space-y-6">

      <div className="pb-1">
        <h1 className="font-syne font-extrabold text-[22px] text-[#0F0D0A] tracking-tight">Feedback & Support</h1>
        <p className="text-[13px] text-[#8A8682] mt-1">We read every message and typically respond within one business day.</p>
      </div>

      {/* contact card */}
      <section className="rounded-xl border border-[#E2DED6] bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">

        <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#8A8682]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <span className="text-[13px] font-semibold text-[#1A1714]">Send a Message</span>
          </div>
          <a
            href="mailto:support@reeltors.ai"
            className="inline-flex items-center gap-1.5 text-[11px] text-[#8A8682] hover:text-[#F0B429] transition-colors duration-150"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            support@reeltors.ai
          </a>
        </div>

        <div className="px-6 pt-5 pb-1">
          <p className="text-[13px] text-[#6B6760] leading-relaxed">
            Have a question, spotted a bug, or want to request a feature? Tell us and we&apos;ll get back to you.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">

            <div>
              <label className="block text-[11px] font-semibold text-[#6B6760] uppercase tracking-wider mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className="h-7 px-3 rounded-full text-[11px] font-semibold transition-all duration-150"
                    style={
                      category === cat
                        ? { background: '#F0B429', color: '#1A1714', border: '1px solid #F0B429' }
                        : { background: 'transparent', color: '#8A8682', border: '1px solid #E2DED6' }
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6B6760] uppercase tracking-wider mb-1.5">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind…"
                rows={5}
                required
                className="w-full px-3 py-2.5 text-[13px] text-[#1A1714] bg-white border border-[#E2DED6] rounded-lg outline-none resize-none transition-all duration-150
                  placeholder:text-[#C8C4BC]
                  hover:border-[#C8C4BC]
                  focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20"
              />
            </div>

          </div>

          <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#F0EDE6] flex items-center justify-between">
            <p className="text-[11px] text-[#B8B4AE]">
              We&apos;ll reply to <span className="font-medium text-[#8A8682]">{profile.email}</span>
            </p>
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="inline-flex items-center gap-2 h-9 px-5 rounded-lg text-[13px] font-semibold transition-all duration-150
                bg-[#1A1714] text-white
                hover:bg-[#2E2B27]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1A1714]"
            >
              {sending ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* quick links */}
      <section className="rounded-xl border border-[#E2DED6] bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <div className="px-6 py-4 border-b border-[#F0EDE6]">
          <span className="text-[13px] font-semibold text-[#1A1714]">Other Ways to Reach Us</span>
        </div>
        <div className="divide-y divide-[#F0EDE6]">
          <a
            href="mailto:support@reeltors.ai"
            className="flex items-center justify-between px-6 py-4 hover:bg-[#FAFAF8] transition-colors duration-150 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F7F5F0] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#8A8682]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-medium text-[#1A1714]">Email Support</p>
                <p className="text-[11px] text-[#8A8682]">support@reeltors.ai</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-[#C8C4BC] group-hover:text-[#8A8682] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        </div>
      </section>

    </div>
  );
}

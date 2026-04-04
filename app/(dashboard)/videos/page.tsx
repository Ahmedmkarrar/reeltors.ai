'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VideoCard } from '@/components/dashboard/VideoCard';
import Link from 'next/link';
import type { Video, VideoStatus } from '@/types';

type Filter = 'all' | VideoStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'complete',   label: 'Ready' },
  { key: 'processing', label: 'Processing' },
  { key: 'failed',     label: 'Failed' },
];

export default function VideosPage() {
  const supabase = createClient();
  const [videos,  setVideos]  = useState<Video[]>([]);
  const [filter,  setFilter]  = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setVideos((data as Video[]) || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  function handleDelete(id: string) {
    setVideos((v) => v.filter((video) => video.id !== id));
  }

  const counts = {
    all:        videos.length,
    complete:   videos.filter((v) => v.status === 'complete').length,
    processing: videos.filter((v) => v.status === 'processing' || v.status === 'pending').length,
    failed:     videos.filter((v) => v.status === 'failed').length,
  };

  const filtered = videos
    .filter((v) => filter === 'all' ? true : filter === 'processing' ? (v.status === 'processing' || v.status === 'pending') : v.status === filter)
    .filter((v) => search ? v.title.toLowerCase().includes(search.toLowerCase()) : true);

  return (
    <div className="p-6 md:p-8 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-extrabold text-2xl tracking-tight">My Videos</h1>
          <p className="text-[#6B6760] text-sm mt-0.5">{videos.length} video{videos.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 bg-[#F0B429] hover:bg-[#F5C842] text-[#FAFAF8] font-bold text-sm px-4 py-2.5 rounded-[6px] transition-all shadow-[0_0_20px_rgba(240,180,41,0.1)] hover:shadow-[0_0_25px_rgba(240,180,41,0.25)]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create New
        </Link>
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8682]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search videos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#EAE8E2] rounded-[6px] pl-9 pr-3 py-2 text-sm text-[#1A1714] placeholder-[#8A8682] focus:outline-none focus:border-[#F0B429]/40 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8682] hover:text-[#5C5853]"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(({ key, label }) => {
            const count = (counts as Record<string, number>)[key];
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={[
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] text-[12px] font-medium transition-all',
                  active
                    ? 'bg-[#F0B429] text-[#1A1714]'
                    : 'bg-[#FFFFFF] border border-[#EAE8E2] text-[#5C5853] hover:text-[#3D3A36] hover:border-[#D8D4CC]',
                ].join(' ')}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-black/20 text-[#1A1714]' : 'bg-[#EAE8E2] text-[#6B6760]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#FFFFFF] border border-[#EAE8E2] rounded-[10px] overflow-hidden">
              <div className="aspect-video shimmer" />
              <div className="p-4 space-y-2.5">
                <div className="h-3.5 shimmer rounded w-3/4" />
                <div className="h-2.5 shimmer rounded w-1/2" />
                <div className="h-8 shimmer rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#EAE8E2] rounded-[10px] p-16 text-center">
          <div className="w-14 h-14 bg-[#EAE8E2] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#B8B4AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h3 className="font-syne font-bold text-lg mb-1.5">
            {search ? `No results for "${search}"` : filter === 'all' ? 'No videos yet' : `No ${filter} videos`}
          </h3>
          <p className="text-[#6B6760] text-sm mb-5">
            {filter === 'all' && !search ? 'Create your first listing video in under 60 seconds.' : ''}
          </p>
          {filter === 'all' && !search && (
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-[#F0B429] text-[#1A1714] font-bold px-5 py-2.5 rounded-[6px] text-sm hover:bg-[#F5C842] transition-colors"
            >
              Create First Video
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((video) => (
            <VideoCard key={video.id} video={video} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

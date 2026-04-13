'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useGenerationStatus } from '@/hooks/useGenerationStatus';
import { VideoCard } from '@/components/dashboard/VideoCard';
import Link from 'next/link';
import type { VideoStatus } from '@/types';

type Filter = 'all' | VideoStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'complete',   label: 'Ready' },
  { key: 'processing', label: 'Processing' },
  { key: 'failed',     label: 'Failed' },
];

export default function VideosPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [supabase]);

  const { videos, isLoaded, removeVideo } = useGenerationStatus(userId);

  const counts = {
    all:        videos.length,
    complete:   videos.filter((v) => v.status === 'complete').length,
    processing: videos.filter((v) => v.status === 'processing' || v.status === 'pending').length,
    failed:     videos.filter((v) => v.status === 'failed').length,
  };

  const filtered = videos
    .filter((v) =>
      filter === 'all'
        ? true
        : filter === 'processing'
          ? v.status === 'processing' || v.status === 'pending'
          : v.status === filter,
    )
    .filter((v) =>
      search ? v.title.toLowerCase().includes(search.toLowerCase()) : true,
    );

  return (
    <div className="p-4 md:p-10 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h1 className="font-syne font-extrabold text-[22px] md:text-[26px] tracking-tight text-[#1A1714]">My Videos</h1>
          <p className="text-sm text-[#ADADAD] mt-0.5">{videos.length} video{videos.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          href="/create"
          className="flex items-center gap-2 bg-[#1A1714] hover:bg-[#2A2420] text-white font-semibold text-sm px-3 md:px-4 py-2.5 rounded-[10px] transition-all shrink-0 min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">Create New</span>
          <span className="sm:hidden">Create</span>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-6 md:mb-8">
        <div className="relative w-full sm:max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ADADAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search videos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#EBEBEB] rounded-[10px] pl-9 pr-3 py-2 text-sm text-[#1A1714] placeholder-[#ADADAD] focus:outline-none focus:border-[#1A1714]/20 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#ADADAD] hover:text-[#6B6760]"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {FILTERS.map(({ key, label }) => {
            const count = (counts as Record<string, number>)[key];
            const isActive = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={[
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-medium transition-all',
                  isActive
                    ? 'bg-[#1A1714] text-white'
                    : 'bg-white border border-[#EBEBEB] text-[#6B6760] hover:border-[#1A1714]/20 hover:text-[#1A1714]',
                ].join(' ')}
              >
                {label}
                {count > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#F0F0F0] text-[#6B6760]'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {!isLoaded ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-[#EBEBEB] rounded-[12px] overflow-hidden">
              <div className="aspect-video bg-[#F5F5F3] animate-pulse" />
              <div className="p-4 space-y-2.5">
                <div className="h-3.5 bg-[#F0F0F0] animate-pulse rounded w-3/4" />
                <div className="h-2.5 bg-[#F0F0F0] animate-pulse rounded w-1/2" />
                <div className="h-8 bg-[#F0F0F0] animate-pulse rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        search || filter !== 'all' ? (
          <div className="bg-white border border-[#EBEBEB] rounded-[12px] p-16 text-center">
            <div className="w-12 h-12 bg-[#F5F5F3] rounded-[12px] flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-[#ADADAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h3 className="font-syne font-bold text-[17px] text-[#1A1714] mb-1">
              {search ? `No results for "${search}"` : `No ${filter} videos`}
            </h3>
            <p className="text-sm text-[#ADADAD]">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#EBEBEB] rounded-[16px] p-12 md:p-16 text-center">
            <div className="w-12 h-12 bg-[#F5F5F3] rounded-[12px] flex items-center justify-center mx-auto mb-5">
              <svg className="w-6 h-6 text-[#ADADAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h3 className="font-syne font-bold text-[18px] mb-2 text-[#1A1714]">No videos yet</h3>
            <p className="text-[#ADADAD] text-sm mb-7 max-w-xs mx-auto leading-relaxed">
              Upload listing photos and get a cinematic reel ready to post in under 60 seconds.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-[#1A1714] hover:bg-[#2A2420] text-white font-semibold px-5 py-2.5 rounded-[10px] text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create your first video
            </Link>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((video, idx) => (
            <VideoCard
              key={video.id}
              video={video}
              onDelete={removeVideo}
              priority={idx < 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import type { Video } from '@/types';
import toast from 'react-hot-toast';

interface VideoCardProps {
  video: Video;
  onDelete?: (id: string) => void;
}

const FORMAT_LABEL: Record<string, string> = {
  vertical:   '9:16',
  square:     '1:1',
  horizontal: '16:9',
};

const STATUS_CONFIG = {
  complete:   { label: 'Ready',      dot: '#22c55e', text: '#22c55e',  bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)'   },
  processing: { label: 'Rendering',  dot: '#F0B429', text: '#F0B429',  bg: 'rgba(240,180,41,0.08)',  border: 'rgba(240,180,41,0.2)'   },
  pending:    { label: 'Queued',     dot: '#7A7672', text: '#7A7672',  bg: 'rgba(136,136,136,0.08)', border: 'rgba(136,136,136,0.15)' },
  failed:     { label: 'Failed',     dot: '#FF5500', text: '#FF5500',  bg: 'rgba(255,85,0,0.1)',    border: 'rgba(255,85,0,0.2)'    },
};

export function VideoCard({ video, onDelete }: VideoCardProps) {
  const [deleting,  setDeleting]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [hovered,   setHovered]   = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const status = STATUS_CONFIG[video.status] ?? STATUS_CONFIG.pending;
  const fmt    = FORMAT_LABEL[video.format ?? 'vertical'] ?? '9:16';

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  async function handleDelete() {
    setMenuOpen(false);
    if (!confirm('Permanently delete this video?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/videos/${video.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Video deleted');
      onDelete?.(video.id);
    } catch {
      toast.error('Failed to delete video');
      setDeleting(false);
    }
  }

  return (
    <div
      className="group relative bg-[#FFFFFF] border border-[#EAE8E2] rounded-[10px] overflow-hidden transition-all duration-200 cursor-default"
      style={{
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(240,180,41,0.2)' : '0 2px 8px rgba(0,0,0,0.06)',
        borderColor: hovered ? 'rgba(240,180,41,0.35)' : '#EAE8E2',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Thumbnail area ── */}
      <div className="relative aspect-video bg-[#F5F3EF] overflow-hidden">
        {video.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : video.source_images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.source_images[0]}
            alt={video.title}
            className="w-full h-full object-cover opacity-40 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#F7F5EF]">
            <svg className="w-10 h-10 text-[#E2DED6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        )}

        {/* Dark gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button */}
        {video.status === 'complete' && video.output_url && (
          <a
            href={video.output_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="w-11 h-11 bg-[#F0B429] rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(240,180,41,0.4)] transition-all duration-200"
              style={{
                opacity: hovered ? 1 : 0,
                transform: hovered ? 'scale(1)' : 'scale(0.8)',
              }}
            >
              <svg className="w-5 h-5 text-[#FAFAF8] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </a>
        )}

        {/* Processing overlay */}
        {(video.status === 'processing' || video.status === 'pending') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-[2px]">
            <div className="flex gap-1">
              {[0,1,2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-[#F0B429] rounded-full"
                  style={{ animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
            <span className="text-[11px] text-[#F0B429] font-medium tracking-wide">
              {video.status === 'pending' ? 'Queued...' : 'Rendering...'}
            </span>
          </div>
        )}

        {/* Failed overlay */}
        {video.status === 'failed' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center">
              <svg className="w-8 h-8 text-[#FF5500] mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="text-[10px] text-[#FF5500]">Render failed</span>
            </div>
          </div>
        )}

        {/* Status badge — top left */}
        <div className="absolute top-2.5 left-2.5">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold"
            style={{ color: status.text, background: status.bg, border: `1px solid ${status.border}` }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: status.dot,
                animation: video.status === 'processing' || video.status === 'pending' ? 'pulse-dot 1.5s infinite' : 'none',
              }}
            />
            {status.label}
          </div>
        </div>

        {/* Format badge — top right */}
        <div className="absolute top-2.5 right-2.5">
          <div className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono text-[#888888]">
            {fmt}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="text-[13px] font-semibold text-[#1A1714] leading-snug line-clamp-1 flex-1">
            {video.title}
          </h3>

          {/* Actions menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 flex items-center justify-center rounded text-[#8A8682] hover:text-[#2E2B27] hover:bg-[#F0EDE6] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 bg-[#FFFFFF] border border-[#E2DED6] rounded-[6px] shadow-2xl z-20 min-w-[140px] py-1 animate-fade-in-up">
                {video.output_url && (
                  <a
                    href={video.output_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#888888] hover:text-[#1A1714] hover:bg-[#F0EDE6] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                    Watch
                  </a>
                )}
                {video.output_url && (
                  <a
                    href={video.output_url}
                    download={`${video.title}.mp4`}
                    className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#888888] hover:text-[#1A1714] hover:bg-[#F0EDE6] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download
                  </a>
                )}
                <div className="my-1 border-t border-[#F0EDE6]" />
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#FF5500] hover:bg-[#F0EDE6] transition-colors disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-[#8A8682]">{formatDate(video.created_at)}</p>

        {/* Quick download button for ready videos */}
        {video.status === 'complete' && video.output_url && (
          <a
            href={video.output_url}
            download={`${video.title}.mp4`}
            className="flex items-center justify-center gap-1.5 mt-3 w-full py-2 rounded-[5px] text-[12px] font-semibold text-[#C07A00] border border-[#F0B429]/25 hover:border-[#F0B429]/60 hover:bg-[#F0B429]/8 transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download MP4
          </a>
        )}
      </div>

    </div>
  );
}

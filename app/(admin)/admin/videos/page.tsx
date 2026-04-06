'use client';

import { useEffect, useState, useCallback } from 'react';

const STATUS_COLORS: Record<string, { text: string; bg: string; dot: string }> = {
  complete:   { text: '#22c55e', bg: 'rgba(34,197,94,0.1)',   dot: '#22c55e' },
  processing: { text: '#F0B429', bg: 'rgba(240,180,41,0.1)',  dot: '#F0B429' },
  pending:    { text: '#8A8682', bg: 'rgba(138,134,130,0.1)', dot: '#8A8682' },
  failed:     { text: '#FF5500', bg: 'rgba(255,85,0,0.1)',    dot: '#FF5500' },
};

const STATUSES = ['', 'complete', 'processing', 'pending', 'failed'];

interface VideoRow {
  id: string;
  title: string;
  status: string;
  format: string;
  output_url: string | null;
  created_at: string;
  profiles: { email: string; full_name: string | null; plan: string } | null;
}

export default function AdminVideosPage() {
  const [videos,  setVideos]  = useState<VideoRow[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    const res  = await fetch(`/api/admin/videos?${params}`);
    const data = await res.json();
    setVideos(data.videos ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl text-[#1A1714]">Videos</h1>
        <p className="text-[13px] text-[#8A8682] mt-1">{total} total videos generated</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by title…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 h-9 px-3 text-[13px] bg-white border border-[#E2DED6] rounded-lg outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20 transition-all"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="h-9 px-3 text-[13px] bg-white border border-[#E2DED6] rounded-lg outline-none focus:border-[#F0B429] cursor-pointer"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2DED6] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F0EDE6] bg-[#FAFAF8]">
                {['Title', 'User', 'Status', 'Format', 'Created', 'Link'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-[#8A8682] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F5F0]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map(j => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 shimmer rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : videos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[13px] text-[#8A8682]">
                    No videos found
                  </td>
                </tr>
              ) : videos.map(video => {
                const sc = STATUS_COLORS[video.status] ?? STATUS_COLORS.pending;
                return (
                  <tr key={video.id} className="hover:bg-[#FAFAF8] transition-colors">
                    {/* Title */}
                    <td className="px-5 py-3.5 max-w-[220px]">
                      <p className="text-[13px] font-medium text-[#1A1714] truncate">{video.title}</p>
                      <p className="text-[10px] font-mono text-[#B8B4AE] truncate">{video.id.slice(0, 8)}…</p>
                    </td>

                    {/* User */}
                    <td className="px-5 py-3.5">
                      <p className="text-[12px] text-[#1A1714]">{video.profiles?.full_name || <span className="text-[#B8B4AE]">No name</span>}</p>
                      <p className="text-[11px] text-[#8A8682]">{video.profiles?.email}</p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                        style={{ color: sc.text, background: sc.bg }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                        {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                      </span>
                    </td>

                    {/* Format */}
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-mono text-[#6B6760] bg-[#F7F5F0] px-2 py-0.5 rounded">
                        {video.format === 'vertical' ? '9:16' : video.format === 'square' ? '1:1' : '16:9'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] text-[#6B6760]">
                        {new Date(video.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Link */}
                    <td className="px-5 py-3.5">
                      {video.output_url ? (
                        <a
                          href={video.output_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] font-medium text-[#F0B429] hover:text-[#C07A00] transition-colors"
                        >
                          Watch →
                        </a>
                      ) : (
                        <span className="text-[12px] text-[#B8B4AE]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-[#F0EDE6] flex items-center justify-between">
            <span className="text-[12px] text-[#8A8682]">
              Page {page} of {totalPages} · {total} videos
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-3 text-[12px] border border-[#E2DED6] rounded-lg text-[#6B6760] hover:bg-[#F7F5F0] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-3 text-[12px] border border-[#E2DED6] rounded-lg text-[#6B6760] hover:bg-[#F7F5F0] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

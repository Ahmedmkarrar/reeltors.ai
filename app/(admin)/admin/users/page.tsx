'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { Profile } from '@/types';

const PLAN_COLORS: Record<string, { text: string; bg: string }> = {
  free:    { text: '#8A8682', bg: 'rgba(138,134,130,0.1)' },
  starter: { text: '#6B6760', bg: 'rgba(107,103,96,0.1)'  },
  growth:  { text: '#C07A00', bg: 'rgba(240,180,41,0.12)' },
  pro:     { text: '#059669', bg: 'rgba(5,150,105,0.1)'   },
};

const PLANS = ['', 'free', 'starter', 'growth', 'pro'];

interface UserRow extends Profile {
  [key: string]: unknown;
}

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState<UserRow[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [plan,    setPlan]    = useState('');
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (plan)   params.set('plan', plan);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, search, plan]);

  useEffect(() => { load(); }, [load]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, plan]);

  async function handlePlanChange(userId: string, newPlan: string) {
    setChanging(userId);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: newPlan }),
    });
    const data = await res.json();
    setChanging('');
    if (data.ok) {
      toast.success('Plan updated');
      setUsers(u => u.map(user => user.id === userId ? { ...user, plan: newPlan as Profile['plan'] } : user));
    } else {
      toast.error(data.error ?? 'Failed to update plan');
    }
  }

  async function handleDelete(userId: string, email: string) {
    if (!confirm(`Permanently delete ${email} and all their videos?`)) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) {
      toast.success('User deleted');
      setUsers(u => u.filter(user => user.id !== userId));
      setTotal(t => t - 1);
    } else {
      toast.error(data.error ?? 'Failed to delete');
    }
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl text-[#1A1714]">Users</h1>
        <p className="text-[13px] text-[#8A8682] mt-1">{total} total accounts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 h-9 px-3 text-[13px] bg-white border border-[#E2DED6] rounded-lg outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20 transition-all"
        />
        <select
          value={plan}
          onChange={e => setPlan(e.target.value)}
          className="h-9 px-3 text-[13px] bg-white border border-[#E2DED6] rounded-lg outline-none focus:border-[#F0B429] cursor-pointer"
        >
          {PLANS.map(p => (
            <option key={p} value={p}>{p ? p.charAt(0).toUpperCase() + p.slice(1) : 'All Plans'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2DED6] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F0EDE6] bg-[#FAFAF8]">
                {['User', 'Plan', 'Videos', 'Signed up', 'Actions'].map(h => (
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
                    {[1,2,3,4,5].map(j => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 shimmer rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[13px] text-[#8A8682]">
                    No users found
                  </td>
                </tr>
              ) : users.map(user => {
                const pc = PLAN_COLORS[user.plan] ?? PLAN_COLORS.free;
                return (
                  <tr key={user.id} className="hover:bg-[#FAFAF8] transition-colors">
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{ background: pc.bg, color: pc.text }}
                        >
                          {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-[#1A1714] leading-tight">
                            {user.full_name || <span className="text-[#B8B4AE]">No name</span>}
                          </p>
                          <p className="text-[11px] text-[#8A8682]">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan selector */}
                    <td className="px-5 py-3.5">
                      <select
                        value={user.plan}
                        disabled={changing === user.id}
                        onChange={e => handlePlanChange(user.id, e.target.value)}
                        className="h-7 px-2 text-[11px] font-semibold rounded-full border cursor-pointer outline-none disabled:opacity-50 transition-all"
                        style={{ color: pc.text, background: pc.bg, borderColor: pc.text + '30' }}
                      >
                        {['free', 'starter', 'growth', 'pro'].map(p => (
                          <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                        ))}
                      </select>
                    </td>

                    {/* Videos */}
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-mono text-[#1A1714]">{user.videos_used_this_month}</span>
                      <span className="text-[11px] text-[#B8B4AE]">/{user.videos_limit}</span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] text-[#6B6760]">
                        {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Delete */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        className="text-[11px] text-[#B8B4AE] hover:text-[#FF5500] transition-colors"
                      >
                        Delete
                      </button>
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
              Page {page} of {totalPages} · {total} users
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

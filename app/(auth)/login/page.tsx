'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: '⚡', text: 'Video ready in under 60 seconds' },
  { icon: '📸', text: 'Works with your existing listing photos' },
  { icon: '📱', text: 'TikTok, Reels, and YouTube — one click' },
  { icon: '🎬', text: 'Cinematic templates built for real estate' },
  { icon: '🔒', text: '30-day money-back guarantee' },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — social proof panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#1A1714] px-12 py-10 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#F0B429] opacity-[0.04] rounded-full blur-[120px] pointer-events-none" />

        {/* Logo */}
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-[#F0B429] rounded-[5px] flex items-center justify-center shadow-[0_0_16px_rgba(240,180,41,0.35)]">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="font-syne font-extrabold text-[20px] text-[#FAFAF8]">
              Reeltor<span className="text-[#F0B429]">.</span>ai
            </span>
          </Link>
        </div>

        {/* Big claim */}
        <div className="relative my-auto">
          <h2
            className="font-syne font-extrabold text-[#FAFAF8] leading-[1.05] mb-8"
            style={{ fontSize: 'clamp(1.8rem, 2.8vw, 2.6rem)' }}
          >
            Turn listings into
            <br />
            <span className="text-[#F0B429]">viral TikToks.</span>
            <br />
            In 60 seconds.
          </h2>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-base leading-none">{icon}</span>
                <span className="text-sm text-[#C8C4BC]">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="relative text-[11px] text-[#4A4744]">
          No filming. No editor. No monthly commitment to start.
        </p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#FAFAF8]">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-10 justify-center">
            <div className="w-7 h-7 bg-[#F0B429] rounded-[5px] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="font-syne font-extrabold text-xl text-[#1A1714]">
              Reeltor<span className="text-[#F0B429]">.</span>ai
            </span>
          </Link>

          <h1 className="font-syne font-extrabold text-[28px] text-[#1A1714] mb-1">Welcome back</h1>
          <p className="text-[#6B6760] text-sm mb-8">Sign in to your Reeltor.ai account</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <div className="flex justify-end -mt-2 mb-1">
              <Link href="/forgot-password" className="text-xs text-[#8A8682] hover:text-[#C07A00] transition-colors">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
              Sign in →
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E2DED6]" />
            <span className="text-[11px] text-[#8A8682] font-mono">OR</span>
            <div className="flex-1 h-px bg-[#E2DED6]" />
          </div>

          <p className="text-center text-sm text-[#6B6760]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#C07A00] font-semibold hover:underline">
              Get started →
            </Link>
          </p>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-8 pt-6 border-t border-[#E2DED6]">
            {['From $19/month', '30-day money back', 'Cancel anytime'].map((t) => (
              <span key={t} className="flex items-center gap-1 text-[11px] text-[#8A8682]">
                <span className="text-[#C07A00] font-bold">✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

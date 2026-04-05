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
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

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
              Reeltors<span className="text-[#F0B429]">.</span>ai
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
              Reeltors<span className="text-[#F0B429]">.</span>ai
            </span>
          </Link>

          <h1 className="font-syne font-extrabold text-[28px] text-[#1A1714] mb-1">Welcome back</h1>
          <p className="text-[#6B6760] text-sm mb-8">Sign in to your Reeltors.ai account</p>

          {/* Google first */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-[#E2DED6] rounded-[8px] text-sm font-semibold text-[#1A1714] hover:bg-[#F5F3EF] hover:border-[#D4D0C8] transition-colors disabled:opacity-60 shadow-sm mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#E2DED6]" />
            <span className="text-[11px] text-[#8A8682] font-mono">OR</span>
            <div className="flex-1 h-px bg-[#E2DED6]" />
          </div>

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

          <p className="text-center text-sm text-[#6B6760]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#C07A00] font-semibold hover:underline">
              Get started →
            </Link>
          </p>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-8 pt-6 border-t border-[#E2DED6]">
            {['From $49/month', '30-day money back', 'Cancel anytime'].map((t) => (
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

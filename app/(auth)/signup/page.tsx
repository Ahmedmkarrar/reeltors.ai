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
  { icon: '📸', text: 'Upload listing photos — we do the rest' },
  { icon: '📱', text: 'Export directly to TikTok & Instagram Reels' },
  { icon: '🎬', text: '3 professional templates included' },
  { icon: '💰', text: 'First video completely free' },
  { icon: '🛡️', text: '30-day money-back guarantee' },
];

const FACTS = [
  { icon: '⏱', text: '60 seconds from photos to finished video' },
  { icon: '📊', text: '403% more buyer inquiries with video vs. photos' },
  { icon: '🎯', text: 'Algorithm delivers to buyers in your market' },
];

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState('');
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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }

      await fetch('/api/users/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: fullName }),
      }).catch(() => null);

      toast.success('Account created! Check your email to confirm.');
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
      {/* Left — benefits panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#1A1714] px-12 py-10 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute top-0 left-0 w-[500px] h-[400px] bg-[#F0B429] opacity-[0.04] rounded-full blur-[140px] pointer-events-none" />

        {/* Logo */}
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5">
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

        {/* Main content */}
        <div className="relative my-auto">
          <h2
            className="font-syne font-extrabold text-[#FAFAF8] leading-[1.05] mb-8"
            style={{ fontSize: 'clamp(1.8rem, 2.6vw, 2.4rem)' }}
          >
            Your first viral listing<br />
            video is{' '}
            <span className="text-[#F0B429]">60 seconds away.</span>
          </h2>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {FEATURES.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-base leading-none">{icon}</span>
                <span className="text-sm text-[#C8C4BC]">{text}</span>
              </div>
            ))}
          </div>

          {/* Key facts */}
          <div className="bg-[#252220] border border-[#2E2B27] rounded-[8px] p-4">
            <p className="text-[10px] font-mono tracking-widest text-[#6B6760] uppercase mb-3">Why it works</p>
            <div className="space-y-2.5">
              {FACTS.map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <span className="text-base leading-none shrink-0">{icon}</span>
                  <span className="text-xs text-[#8A8682]">{text}</span>
                </div>
              ))}
            </div>
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

          <h1 className="font-syne font-extrabold text-[28px] text-[#1A1714] mb-1">Create your account</h1>
          <p className="text-[#6B6760] text-sm mb-8">
            Plans from $49.99.99/month —{' '}
            <span className="text-[#1A1714] font-medium">30-day money-back guarantee</span>
          </p>

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

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#E2DED6]" />
            <span className="text-[11px] text-[#8A8682] font-mono">OR</span>
            <div className="flex-1 h-px bg-[#E2DED6]" />
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Sarah Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
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
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <Button type="submit" variant="primary" size="md" loading={loading} className="w-full mt-1">
              Create account →
            </Button>
          </form>

          <p className="text-[11px] text-[#8A8682] text-center mt-4">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-[#6B6760] hover:text-[#1A1714] underline">
              Terms of Service
            </Link>
          </p>

          <p className="text-center text-sm text-[#6B6760]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#C07A00] font-semibold hover:underline">
              Log in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

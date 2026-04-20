'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LogoIcon } from '@/components/ui/LogoIcon';

const FEATURES = [
  { icon: '⚡', text: 'Video ready in under 60 seconds' },
  { icon: '📸', text: 'Works with your existing listing photos' },
  { icon: '📱', text: 'TikTok, Reels, and YouTube — one click' },
  { icon: '🎬', text: 'Cinematic templates built for real estate' },
  { icon: '🔒', text: '30-day money-back guarantee' },
];

function LoginForm() {
  const supabase = createClient();
  const [googleLoading, setGoogleLoading] = useState(false);
  const searchParams = useSearchParams();
  const [showEmail, setShowEmail] = useState(searchParams.get('email') === '1');
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  const errorMsg = searchParams.get('error');

  async function handleGoogle() {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/create`,
      },
    });
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });
    setEmailLoading(false);
    if (error) {
      setEmailError(error.message);
    } else {
      setEmailSent(true);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — social proof panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#1A1714] px-12 py-10 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#F0B429] opacity-[0.04] rounded-full blur-[120px] pointer-events-none" />

        {/* Logo */}
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <LogoIcon className="w-9 h-9 drop-shadow-[0_0_10px_rgba(240,180,41,0.4)]" />
            <span className="font-syne font-extrabold text-[20px] text-[#FAFAF8]">
              ReeltorsAI
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

          <div className="space-y-3">
            {FEATURES.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-base leading-none">{icon}</span>
                <span className="text-sm text-[#C8C4BC]">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-[#4A4744]">
          No filming. No editor. No monthly commitment to start.
        </p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#FAFAF8]">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-10 justify-center">
            <LogoIcon className="w-8 h-8" />
            <span className="font-syne font-extrabold text-xl text-[#1A1714]">
              ReeltorsAI
            </span>
          </Link>

          <h1 className="font-syne font-extrabold text-[28px] text-[#1A1714] mb-1">Welcome back</h1>
          <p className="text-[#6B6760] text-sm mb-8">Sign in to your Reeltors.ai account</p>

          {errorMsg && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-[6px] text-[12px] text-red-600 font-mono break-all">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-[#E2DED6] rounded-[8px] text-sm font-semibold text-[#1A1714] hover:bg-[#F5F3EF] hover:border-[#D4D0C8] transition-colors disabled:opacity-60 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#E2DED6]" />
            <span className="text-xs text-[#B0ABA3]">or</span>
            <div className="flex-1 h-px bg-[#E2DED6]" />
          </div>

          <div>
            {!showEmail ? (
              <button
                onClick={() => setShowEmail(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-[#E2DED6] rounded-[8px] text-sm font-semibold text-[#1A1714] hover:bg-[#F5F3EF] hover:border-[#D4D0C8] transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 text-[#6B6760]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                Continue with Email
              </button>
            ) : emailSent ? (
              <div className="px-4 py-4 bg-[#F5F3EF] border border-[#E2DED6] rounded-[8px] text-center">
                <p className="text-sm font-semibold text-[#1A1714] mb-1">Check your inbox</p>
                <p className="text-xs text-[#6B6760]">We sent a magic link to <strong>{email}</strong></p>
              </div>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3.5 text-[16px] border border-[#E2DED6] rounded-[8px] bg-white text-[#1A1714] placeholder:text-[#B0ABA3] focus:outline-none focus:border-[#C07A00] transition-colors"
                />
                {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full py-3.5 text-sm font-semibold text-white bg-[#1A1714] rounded-[8px] hover:bg-[#2A2724] transition-colors disabled:opacity-60"
                >
                  {emailLoading ? 'Sending...' : 'Send magic link →'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmail(false)}
                  className="w-full text-xs text-[#8A8682] hover:text-[#6B6760] transition-colors"
                >
                  ← Back
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-8 pt-6 border-t border-[#E2DED6]">
            {['From $49.99/month', '30-day money back', 'Cancel anytime'].map((t) => (
              <span key={t} className="flex items-center gap-1 text-[11px] text-[#8A8682]">
                <span className="text-[#C07A00] font-bold">✓</span> {t}
              </span>
            ))}
          </div>

          <p className="text-center text-sm text-[#6B6760] mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#C07A00] font-semibold hover:underline">
              Get started →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

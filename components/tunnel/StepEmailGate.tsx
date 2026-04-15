'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { VideoFormat } from '@/types';

interface StepEmailGateProps {
  templateKey: string;
  imageUrls: string[];
  sessionToken: string;
  format: VideoFormat;
  onSuccess: (sessionId: string, email: string) => void;
}

export default function StepEmailGate({
  templateKey,
  imageUrls,
  sessionToken,
  format,
}: StepEmailGateProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const savePendingState = () => {
    localStorage.setItem(
      'tunnelPending',
      JSON.stringify({ sessionToken, imageUrls, templateKey, format, savedAt: Date.now() })
    );
    document.cookie = 'auth_next=/generate; path=/; max-age=600; SameSite=Lax';
  };

  const handleContinueWithGoogle = async () => {
    savePendingState();
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSending(true);
    setErrorMsg('');
    savePendingState();

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });

    setIsSending(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setIsSent(true);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(13,11,8,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: '#121009', border: '1px solid #2E2B27',
          borderRadius: 16, padding: '48px 40px',
          width: '100%', maxWidth: 420, textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
        </div>

        {isSent ? (
          <>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#F0F0EB', margin: '0 0 12px' }}>
              Check your inbox
            </h2>
            <p style={{ color: '#6B6760', fontSize: 15, margin: '0 0 8px', lineHeight: 1.6 }}>
              We sent a magic link to
            </p>
            <p style={{ color: '#F0B429', fontSize: 15, fontWeight: 600, margin: '0 0 24px' }}>
              {email}
            </p>
            <p style={{ color: '#4A4642', fontSize: 13, lineHeight: 1.6, margin: '0 0 24px' }}>
              Click the link in your email to sign in and start generating your video.
            </p>
            <button
              onClick={() => { setIsSent(false); setEmail(''); }}
              style={{
                background: 'transparent', color: '#6B6760',
                border: '1px solid #2E2B27', borderRadius: 8,
                padding: '12px 24px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', width: '100%',
              }}
            >
              Use a different email
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#F0F0EB', margin: '0 0 12px' }}>
              Almost there.
            </h2>
            <p style={{ color: '#6B6760', fontSize: 15, margin: '0 0 28px', lineHeight: 1.6 }}>
              Sign in to generate your free video. We&apos;ll save it to your account — no card required.
            </p>

            <button
              onClick={handleContinueWithGoogle}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 12, background: '#fff', color: '#0D0B08',
                border: 'none', borderRadius: 8, padding: '15px 24px',
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#2E2B27' }} />
              <span style={{ color: '#4A4642', fontSize: 12 }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#2E2B27' }} />
            </div>

            <form onSubmit={handleMagicLink}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: '100%', padding: '14px 16px',
                  background: '#0D0B08', border: '1px solid #2E2B27',
                  borderRadius: 8, color: '#F0F0EB', fontSize: 15,
                  outline: 'none', boxSizing: 'border-box',
                  marginBottom: 12,
                }}
              />
              {errorMsg && (
                <p style={{ color: '#FF5500', fontSize: 13, margin: '0 0 12px', textAlign: 'left' }}>
                  {errorMsg}
                </p>
              )}
              <button
                type="submit"
                disabled={isSending}
                style={{
                  width: '100%', padding: '15px 24px',
                  background: isSending ? '#2E2B27' : '#1A1714',
                  color: isSending ? '#6B6760' : '#F0F0EB',
                  border: '1px solid #2E2B27', borderRadius: 8,
                  fontSize: 15, fontWeight: 700,
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                {isSending ? 'Sending...' : 'Send magic link'}
              </button>
            </form>

            <p style={{ color: '#3A3730', fontSize: 12, marginTop: 20 }}>
              Free account · No credit card · 1 free video included
            </p>
          </>
        )}
      </div>
    </div>
  );
}

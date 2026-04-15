'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TEMPLATE_IDS } from '@/lib/shotstack/templates';
import type { VideoFormat } from '@/types';
import StepUpload from '@/components/tunnel/StepUpload';
import StepTemplates from '@/components/tunnel/StepTemplates';
import StepEmailGate from '@/components/tunnel/StepEmailGate';
import StepGenerating from '@/components/tunnel/StepGenerating';
import StepResult from '@/components/tunnel/StepResult';

type Step = 'upload' | 'templates' | 'email' | 'generating' | 'result' | 'failed';

const GENERATION_STORAGE_KEY = 'reeltors_generation_v1';
const TUNNEL_UPLOADED_KEY = 'tunnelUploaded';
// Match StepGenerating's hard timeout so stale entries are auto-evicted on resume
const MAX_RESUME_AGE_MS = 10 * 60 * 1000;

interface StoredGeneration {
  videoId:   string;
  startedAt: number;
}

interface TunnelState {
  sessionToken: string;
  imageUrls:    string[];
  templateKey:  string;
  format:       VideoFormat;
  pollUrl:      string;
  email:        string;
  videoUrl:     string;
  thumbnailUrl: string | null;
  videoId:      string;
  startedAt:    number | null;
}

interface TunnelPending {
  sessionToken: string;
  imageUrls: string[];
  templateKey: string;
  format: VideoFormat;
}

function generateSessionToken(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export default function GeneratePage() {
  const [step, setStep] = useState<Step>('upload');
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [state, setState] = useState<TunnelState>({
    sessionToken: '',
    imageUrls:    [],
    templateKey:  '',
    format:       'vertical',
    pollUrl:      '',
    email:        '',
    videoUrl:     '',
    thumbnailUrl: null,
    videoId:      '',
    startedAt:    null,
  });
  const [failReason, setFailReason] = useState<string | null>(null);
  const [failCode, setFailCode] = useState<string | null>(null);
  const isGeneratingRef = useRef(false);

  const startAuthenticatedGeneration = useCallback(async (pending: TunnelPending, email: string) => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;

    const templateId = TEMPLATE_IDS[pending.templateKey as keyof typeof TEMPLATE_IDS];

    if (!templateId) {
      setFailReason(`Unknown template key: ${pending.templateKey}`);
      setFailCode(null);
      setStep('failed');
      isGeneratingRef.current = false;
      return;
    }
    if (!pending.imageUrls?.length) {
      setFailReason('No images found — please try uploading again.');
      setFailCode(null);
      setStep('failed');
      isGeneratingRef.current = false;
      return;
    }

    try {
      const res = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          images: pending.imageUrls,
          format: pending.format ?? 'vertical',
          title: 'My Listing Video',
        }),
      });

      let data: Record<string, string> = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }

      if (!res.ok) {
        const msg = data.error ?? (res.status >= 500 ? 'Server error — please try again' : `HTTP ${res.status}`);
        console.error('[tunnel] generate failed:', msg, data.code);
        setFailReason(msg);
        setFailCode(data.code ?? null);
        setState((prev) => ({ ...prev, email }));
        setStep('failed');
        isGeneratingRef.current = false;
        return;
      }

      const startedAt = Date.now();

      // Persist so the generating UI can resume accurately after a page refresh
      try {
        const entry: StoredGeneration = { videoId: data.videoId, startedAt };
        localStorage.setItem(GENERATION_STORAGE_KEY, JSON.stringify(entry));
      } catch { /* localStorage may be blocked in some browsers */ }

      setState((prev) => ({
        ...prev,
        email,
        pollUrl:   `/api/videos/${data.videoId}/status`,
        videoId:   data.videoId,
        startedAt,
      }));
      setStep('generating');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error('[tunnel] generate threw:', msg);
      setFailReason(msg);
      setFailCode(null);
      setStep('failed');
    } finally {
      isGeneratingRef.current = false;
    }
  }, []);

  const TUNNEL_PENDING_TTL_MS = 10 * 60 * 1000; // 10 minutes

  // On mount: assign session token + check if returning from Google OAuth
  useEffect(() => {
    (async () => {
      // Reuse the stored token only when there is a live pending upload (needed to
      // survive Google OAuth redirects). Otherwise generate a fresh token so that
      // stale files from a previous session don't count against the 15-photo limit.
      const hasPending = !!(
        localStorage.getItem(TUNNEL_UPLOADED_KEY) ||
        localStorage.getItem('tunnelPending')
      );
      const stored = hasPending
        ? (localStorage.getItem('tunnelSessionToken') ?? generateSessionToken())
        : generateSessionToken();
      localStorage.setItem('tunnelSessionToken', stored);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        try {
          const uploadedRaw = localStorage.getItem(TUNNEL_UPLOADED_KEY);
          if (uploadedRaw) {
            const uploaded: { sessionToken: string; imageUrls: string[]; savedAt: number } = JSON.parse(uploadedRaw);
            if (Date.now() - uploaded.savedAt < TUNNEL_PENDING_TTL_MS && uploaded.imageUrls?.length) {
              setState((prev) => ({ ...prev, sessionToken: uploaded.sessionToken || stored, imageUrls: uploaded.imageUrls }));
              setIsAuthChecked(true);
              setStep('templates');
              return;
            }
            localStorage.removeItem(TUNNEL_UPLOADED_KEY);
          }
        } catch { /* localStorage unavailable */ }
        setState((prev) => ({ ...prev, sessionToken: stored }));
        setIsAuthChecked(true);
        return;
      }

      // Returning from Google OAuth with a pending tunnel job
      const pendingRaw = localStorage.getItem('tunnelPending');
      if (pendingRaw) {
        localStorage.removeItem('tunnelPending');
        let pending: TunnelPending & { savedAt?: number };
        try {
          pending = JSON.parse(pendingRaw);
        } catch {
          setState((prev) => ({ ...prev, sessionToken: stored }));
          setIsAuthChecked(true);
          setFailReason('Session expired — please try again.');
          setFailCode(null);
          setStep('failed');
          return;
        }

        // Reject stale pending entries (e.g. leftover from a previous attempt)
        if (pending.savedAt && Date.now() - pending.savedAt > TUNNEL_PENDING_TTL_MS) {
          setState((prev) => ({ ...prev, sessionToken: stored }));
          setIsAuthChecked(true);
          setFailReason('Session expired — please try again.');
          setFailCode(null);
          setStep('failed');
          return;
        }
        setState((prev) => ({
          ...prev,
          sessionToken: pending.sessionToken,
          imageUrls: pending.imageUrls,
          templateKey: pending.templateKey,
          format: pending.format ?? 'vertical',
          email: user.email ?? '',
        }));
        setIsAuthChecked(true);
        await startAuthenticatedGeneration(pending, user.email ?? '');
        return;
      }

      // Check if there's an in-progress generation from before a page refresh.
      // Only authenticated users have a videoId — tunnel sessions use sessionId.
      try {
        const raw = localStorage.getItem(GENERATION_STORAGE_KEY);
        if (raw) {
          const { videoId, startedAt } = JSON.parse(raw) as StoredGeneration;
          const isRecent = Date.now() - startedAt < MAX_RESUME_AGE_MS;
          if (videoId && startedAt && isRecent) {
            setState((prev) => ({
              ...prev,
              sessionToken: stored,
              email:        user.email ?? '',
              pollUrl:      `/api/videos/${videoId}/status`,
              videoId,
              startedAt,
            }));
            setIsAuthChecked(true);
            setStep('generating');
            return;
          }
          // Stale entry — discard silently
          localStorage.removeItem(GENERATION_STORAGE_KEY);
        }
      } catch { /* localStorage unavailable — fall through to normal flow */ }

      // Already logged in — restore uploaded photos if available, skip email gate
      try {
        const uploadedRaw = localStorage.getItem(TUNNEL_UPLOADED_KEY);
        if (uploadedRaw) {
          const uploaded: { sessionToken: string; imageUrls: string[]; savedAt: number } = JSON.parse(uploadedRaw);
          if (Date.now() - uploaded.savedAt < TUNNEL_PENDING_TTL_MS && uploaded.imageUrls?.length) {
            setState((prev) => ({ ...prev, sessionToken: uploaded.sessionToken || stored, imageUrls: uploaded.imageUrls, email: user.email ?? '' }));
            setIsAuthChecked(true);
            setStep('templates');
            return;
          }
          localStorage.removeItem(TUNNEL_UPLOADED_KEY);
        }
      } catch { /* localStorage unavailable */ }
      setState((prev) => ({ ...prev, sessionToken: stored, email: user.email ?? '' }));
      setIsAuthChecked(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploadComplete = useCallback((imageUrls: string[]) => {
    setState((prev) => {
      try {
        const sessionToken = localStorage.getItem('tunnelSessionToken') ?? '';
        localStorage.setItem(TUNNEL_UPLOADED_KEY, JSON.stringify({ sessionToken, imageUrls, savedAt: Date.now() }));
      } catch { /* ignore */ }
      return { ...prev, imageUrls };
    });
    setStep('templates');
  }, []);

  const handleTemplateGenerate = useCallback(async (templateKey: string, format: VideoFormat) => {
    if (isGeneratingRef.current) return;
    setState((prev) => ({ ...prev, templateKey, format }));

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setState((prev) => {
        const pending: TunnelPending = {
          sessionToken: prev.sessionToken,
          imageUrls: prev.imageUrls,
          templateKey,
          format,
        };
        // Fire after state flush so prev values are captured correctly
        Promise.resolve().then(() =>
          startAuthenticatedGeneration(pending, user.email ?? '')
        );
        return { ...prev, templateKey, format, email: user.email ?? '' };
      });
    } else {
      setStep('email');
    }
  }, [startAuthenticatedGeneration]);

  // onSuccess kept for interface compatibility (Google flow bypasses it via redirect)
  const handleEmailSuccess = useCallback((sessionId: string, email: string) => {
    setState((prev) => ({ ...prev, email, pollUrl: `/api/tunnel/status/${sessionId}` }));
    setStep('generating');
  }, []);

  const handleVideoComplete = useCallback((videoUrl: string, thumbnailUrl: string | null) => {
    try {
      localStorage.removeItem(GENERATION_STORAGE_KEY);
      localStorage.removeItem(TUNNEL_UPLOADED_KEY);
    } catch { /* ignore */ }
    setState((prev) => ({ ...prev, videoUrl, thumbnailUrl }));
    setStep('result');
  }, []);

  const handleGenerationFailed = useCallback((reason?: string) => {
    try { localStorage.removeItem(GENERATION_STORAGE_KEY); } catch { /* ignore */ }
    if (reason) setFailReason(reason);
    setStep('failed');
  }, []);

  if (!isAuthChecked) return null;

  return (
    <main style={{ background: '#0D0B08', minHeight: '100vh', color: '#F0F0EB' }}>
      {step !== 'result' && (
        <header style={{ padding: '20px 24px', borderBottom: '1px solid #1A1714', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#F0B429', fontWeight: 800, fontSize: 20 }}>ReeltorsAI</span>
          {state.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#6B6760', fontSize: 13 }}>{state.email}</span>
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  localStorage.removeItem('tunnelSessionToken');
                  localStorage.removeItem('tunnelPending');
                  localStorage.removeItem(TUNNEL_UPLOADED_KEY);
                  localStorage.removeItem(GENERATION_STORAGE_KEY);
                  window.location.reload();
                }}
                style={{
                  background: 'transparent', border: '1px solid #2E2B27',
                  color: '#6B6760', borderRadius: 6, padding: '6px 12px',
                  fontSize: 12, cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </header>
      )}

      {(step === 'upload' || step === 'templates') && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '20px 24px 0' }}>
          {['Upload', 'Style', 'Generate'].map((label, i) => {
            const stepIndex = step === 'upload' ? 0 : 1;
            const isActive = i === stepIndex;
            const isDone = i < stepIndex;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isDone || isActive ? '#F0B429' : '#1A1714',
                    color: isDone || isActive ? '#0D0B08' : '#4A4642',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13,
                  }}
                >
                  {isDone ? '✓' : i + 1}
                </div>
                <span style={{ color: isActive ? '#F0F0EB' : '#4A4642', fontSize: 13 }}>
                  {label}
                </span>
                {i < 2 && <div style={{ width: 24, height: 1, background: '#2E2B27' }} />}
              </div>
            );
          })}
        </div>
      )}

      {step === 'upload' && (
        <StepUpload sessionToken={state.sessionToken} onComplete={handleUploadComplete} />
      )}

      {(step === 'templates' || step === 'email') && (
        <div style={{ position: 'relative' }}>
          <StepTemplates onGenerate={handleTemplateGenerate} />
          {step === 'email' && (
            <StepEmailGate
              templateKey={state.templateKey}
              imageUrls={state.imageUrls}
              sessionToken={state.sessionToken}
              format={state.format}
              onSuccess={handleEmailSuccess}
            />
          )}
        </div>
      )}

      {step === 'generating' && (
        <StepGenerating
          pollUrl={state.pollUrl}
          startedAt={state.startedAt ?? undefined}
          onComplete={handleVideoComplete}
          onFailed={handleGenerationFailed}
        />
      )}

      {step === 'result' && (
        <StepResult videoUrl={state.videoUrl} email={state.email} />
      )}

      {step === 'failed' && (
        <div
          style={{
            minHeight: '80vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 24, textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 20 }}>
            {failCode === 'LIMIT_REACHED' || failCode === 'DEVICE_LIMIT_REACHED' || failCode === 'IP_LIMIT_REACHED' ? '🎬' : '⚠️'}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px' }}>
            {failCode === 'LIMIT_REACHED' || failCode === 'DEVICE_LIMIT_REACHED' || failCode === 'IP_LIMIT_REACHED'
              ? 'Free video already used'
              : 'Generation failed'}
          </h2>
          <p style={{ color: '#6B6760', marginBottom: 32, maxWidth: 360 }}>
            {failCode === 'LIMIT_REACHED' || failCode === 'DEVICE_LIMIT_REACHED' || failCode === 'IP_LIMIT_REACHED'
              ? 'You&apos;ve already generated your free video. Upgrade to unlock unlimited videos.'
              : (failReason ?? 'Something went wrong on our end. Please try again.')}
          </p>
          {failCode === 'LIMIT_REACHED' || failCode === 'DEVICE_LIMIT_REACHED' || failCode === 'IP_LIMIT_REACHED' ? (
            <a
              href="/subscription"
              style={{
                background: '#F0B429', color: '#0D0B08',
                border: 'none', borderRadius: 8,
                padding: '14px 32px', fontSize: 16, fontWeight: 700,
                textDecoration: 'none', display: 'inline-block',
              }}
            >
              Upgrade Now →
            </a>
          ) : (
            <button
              onClick={() => {
                localStorage.removeItem('tunnelSessionToken');
                localStorage.removeItem('tunnelPending');
                localStorage.removeItem(TUNNEL_UPLOADED_KEY);
                window.location.reload();
              }}
              style={{
                background: '#F0B429', color: '#0D0B08',
                border: 'none', borderRadius: 8,
                padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Try Again →
            </button>
          )}
        </div>
      )}
    </main>
  );
}

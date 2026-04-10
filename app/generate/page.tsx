'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TEMPLATE_IDS } from '@/lib/shotstack/templates';
import StepUpload from '@/components/tunnel/StepUpload';
import StepTemplates from '@/components/tunnel/StepTemplates';
import StepEmailGate from '@/components/tunnel/StepEmailGate';
import StepGenerating from '@/components/tunnel/StepGenerating';
import StepResult from '@/components/tunnel/StepResult';

type Step = 'upload' | 'templates' | 'email' | 'generating' | 'result' | 'failed';

interface TunnelState {
  sessionToken: string;
  imageUrls: string[];
  templateKey: string;
  pollUrl: string;
  email: string;
  videoUrl: string;
  thumbnailUrl: string | null;
}

interface TunnelPending {
  sessionToken: string;
  imageUrls: string[];
  templateKey: string;
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
    imageUrls: [],
    templateKey: '',
    pollUrl: '',
    email: '',
    videoUrl: '',
    thumbnailUrl: null,
  });
  const [failReason, setFailReason] = useState<string | null>(null);
  const [failCode, setFailCode] = useState<string | null>(null);
  const isGeneratingRef = useRef(false);

  const startAuthenticatedGeneration = useCallback(async (pending: TunnelPending, email: string) => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;

    const creatomateTemplateId = TEMPLATE_IDS[pending.templateKey as keyof typeof TEMPLATE_IDS];

    if (!creatomateTemplateId) {
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
          templateId: creatomateTemplateId,
          images: pending.imageUrls,
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

      setState((prev) => ({
        ...prev,
        email,
        pollUrl: `/api/videos/${data.videoId}/status`,
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

  // On mount: assign session token + check if returning from Google OAuth
  useEffect(() => {
    (async () => {
      const stored = sessionStorage.getItem('tunnelSessionToken') ?? generateSessionToken();
      sessionStorage.setItem('tunnelSessionToken', stored);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setState((prev) => ({ ...prev, sessionToken: stored }));
        setIsAuthChecked(true);
        return;
      }

      // Returning from Google OAuth with a pending tunnel job
      const pendingRaw = sessionStorage.getItem('tunnelPending');
      if (pendingRaw) {
        sessionStorage.removeItem('tunnelPending');
        let pending: TunnelPending;
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
        setState((prev) => ({
          ...prev,
          sessionToken: pending.sessionToken,
          imageUrls: pending.imageUrls,
          templateKey: pending.templateKey,
          email: user.email ?? '',
        }));
        setIsAuthChecked(true);
        await startAuthenticatedGeneration(pending, user.email ?? '');
        return;
      }

      // Already logged in — skip email gate when they hit that step
      setState((prev) => ({ ...prev, sessionToken: stored, email: user.email ?? '' }));
      setIsAuthChecked(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploadComplete = useCallback((imageUrls: string[]) => {
    setState((prev) => ({ ...prev, imageUrls }));
    setStep('templates');
  }, []);

  const handleTemplateGenerate = useCallback(async (templateKey: string) => {
    if (isGeneratingRef.current) return;
    setState((prev) => ({ ...prev, templateKey }));

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setState((prev) => {
        const pending: TunnelPending = {
          sessionToken: prev.sessionToken,
          imageUrls: prev.imageUrls,
          templateKey,
        };
        // Fire after state flush so prev values are captured correctly
        Promise.resolve().then(() =>
          startAuthenticatedGeneration(pending, user.email ?? '')
        );
        return { ...prev, templateKey, email: user.email ?? '' };
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
    setState((prev) => ({ ...prev, videoUrl, thumbnailUrl }));
    setStep('result');
  }, []);

  const handleGenerationFailed = useCallback(() => setStep('failed'), []);

  if (!isAuthChecked) return null;

  return (
    <main style={{ background: '#0D0B08', minHeight: '100vh', color: '#F0F0EB' }}>
      {step !== 'result' && (
        <header style={{ padding: '20px 24px', borderBottom: '1px solid #1A1714' }}>
          <span style={{ color: '#F0B429', fontWeight: 800, fontSize: 20 }}>Reeltors.ai</span>
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
              onSuccess={handleEmailSuccess}
            />
          )}
        </div>
      )}

      {step === 'generating' && (
        <StepGenerating
          pollUrl={state.pollUrl}
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
                sessionStorage.removeItem('tunnelSessionToken');
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

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { TemplateSelector } from '@/components/dashboard/TemplateSelector';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { TEMPLATES } from '@/lib/creatomate/templates';
import type { Profile, VideoFormat } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Step = 'upload' | 'details' | 'template' | 'generating' | 'result';

const LOADING_MESSAGES_BASE = [
  'Analyzing your photos…',
  'Applying cinematic effects…',
  'Syncing music…',
  'Rendering your video…',
  'Almost ready…',
];

const LOADING_MESSAGES_AI = [
  'Generating AI drone shot…',
  'Rendering cinematic flyover…',
  'Compositing your video…',
  'Stitching drone shot with photos…',
  'Almost ready…',
];

// Simulated progress caps at 90% until Realtime signals completion
const PROGRESS_TICK = 7;
const PROGRESS_CAP  = 90;

export default function CreatePage() {
  const router  = useRouter();
  const supabase = createClient();

  const [step, setStep]       = useState<Step>('upload');
  const [profile, setProfile] = useState<Profile | null>(null);

  // Form state
  const [images, setImages]                 = useState<string[]>([]);
  const [aiVideoIndices, setAiVideoIndices] = useState<number[]>([]);
  const [videoPrompt, setVideoPrompt]       = useState('');
  const [listingAddress, setListingAddress] = useState('');
  const [listingPrice, setListingPrice]     = useState('');
  const [agentName, setAgentName]           = useState('');
  const [format, setFormat]                 = useState<VideoFormat>('vertical');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('CINEMATIC');

  // Generation state
  const [videoId, setVideoId]     = useState('');
  const [outputUrl, setOutputUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES_BASE[0]);
  const [progress, setProgress]     = useState(0);
  const [copied, setCopied]         = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const msgRef     = useRef(0);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>();
      if (data) {
        setProfile(data);
        setAgentName(data.full_name || '');
      }
    });
  }, [supabase, router]);

  // Cycle loading messages while generating
  useEffect(() => {
    if (step !== 'generating') return;
    const messages = aiVideoIndices.length > 0 ? LOADING_MESSAGES_AI : LOADING_MESSAGES_BASE;
    const interval = setInterval(() => {
      msgRef.current = (msgRef.current + 1) % messages.length;
      setLoadingMsg(messages[msgRef.current]);
      setProgress((p) => Math.min(p + PROGRESS_TICK, PROGRESS_CAP));
    }, 3000);
    return () => clearInterval(interval);
  }, [step, aiVideoIndices.length]);

  // Clean up Realtime channel on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase]);

  const subscribeToVideo = useCallback((vid: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`video-${vid}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'videos',
          filter: `id=eq.${vid}`,
        },
        (payload) => {
          const updated = payload.new as { status: string; output_url?: string };

          if (updated.status === 'complete' && updated.output_url) {
            setOutputUrl(updated.output_url);
            setProgress(100);
            setStep('result');
            setGenerating(false);
            supabase.removeChannel(channel);
            channelRef.current = null;
          } else if (updated.status === 'failed') {
            toast.error('Render failed. Please try again.');
            setStep('template');
            setGenerating(false);
            supabase.removeChannel(channel);
            channelRef.current = null;
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [supabase]);

  async function handleGenerate() {
    if (!profile) return;
    setGenerating(true);
    setStep('generating');
    setProgress(5);
    msgRef.current = 0;
    setLoadingMsg(
      aiVideoIndices.length > 0 ? LOADING_MESSAGES_AI[0] : LOADING_MESSAGES_BASE[0],
    );

    try {
      // Resolve the actual Creatomate UUID from the selected template key
      const templateObj = TEMPLATES.find((t) => t.id === selectedTemplateKey) ?? TEMPLATES[0];
      const templateId = templateObj.creatomateId;

      const res = await fetch('/api/videos/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          images,
          aiVideoIndices,
          listingAddress,
          listingPrice,
          agentName,
          format,
          title: listingAddress || 'My Listing Video',
          videoPrompt: videoPrompt.trim() || undefined,
        }),
      });

      if (res.status === 403) {
        const { error } = await res.json();
        toast.error(error || 'Video limit reached. Upgrade to continue.');
        setStep('template');
        setGenerating(false);
        return;
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error ${res.status}`);
      }

      const { videoId: vid, aiVideosFailed } = await res.json();
      setVideoId(vid);

      if (aiVideosFailed) {
        toast('AI drone shot generation failed — we created a standard video instead. This didn\'t count against your monthly limit.', {
          duration: 8000,
          icon: '⚠️',
        });
      }

      // Subscribe to Realtime for instant completion notification
      subscribeToVideo(vid);

      // Polling fallback: every 5 seconds check render status directly
      // This handles cases where the webhook fails (e.g. localtunnel timeouts)
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/videos/${vid}/status`);
          if (!statusRes.ok) return;
          const { status, output_url } = await statusRes.json();

          if (status === 'complete' && output_url) {
            clearInterval(pollInterval);
            setOutputUrl(output_url);
            setProgress(100);
            setStep('result');
            setGenerating(false);
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            toast.error('Render failed. Please try again.');
            setStep('template');
            setGenerating(false);
          }
        } catch { /* ignore poll errors */ }
      }, 5000);

      // Stop polling after 6 minutes (safety net)
      setTimeout(() => {
        clearInterval(pollInterval);
        if (generating) {
          toast.error('Render timed out. Please check your videos page.');
          setStep('template');
          setGenerating(false);
        }
      }, 360_000);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate video';
      toast.error(msg);
      setStep('template');
      setGenerating(false);
    }
  }

  const userId = profile?.id || '';

  // ─── STEP: UPLOAD ────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="relative min-h-screen overflow-hidden">

        {/* ── Animated background ─────────────────────────────────────── */}
        <style>{`
          @keyframes orbDrift1 {
            0%,100% { transform: translate(0,0) scale(1); }
            35%     { transform: translate(-45px, 35px) scale(1.06); }
            70%     { transform: translate(30px,-20px) scale(0.96); }
          }
          @keyframes orbDrift2 {
            0%,100% { transform: translate(0,0) scale(1); }
            40%     { transform: translate(40px,-30px) scale(1.04); }
            75%     { transform: translate(-20px, 40px) scale(0.97); }
          }
          @keyframes orbDrift3 {
            0%,100% { transform: translate(0,0); }
            50%     { transform: translate(25px, 20px); }
          }
        `}</style>

        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(26,23,20,0.055) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Gold — top-right */}
          <div
            className="absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(240,180,41,0.13) 0%, transparent 65%)',
              filter: 'blur(72px)',
              animation: 'orbDrift1 14s ease-in-out infinite',
            }}
          />
          {/* Purple — bottom-left */}
          <div
            className="absolute -bottom-24 -left-24 w-[480px] h-[480px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 65%)',
              filter: 'blur(80px)',
              animation: 'orbDrift2 18s ease-in-out infinite',
            }}
          />
          {/* Warm centre wash */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[340px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(240,180,41,0.05) 0%, transparent 70%)',
              filter: 'blur(60px)',
              animation: 'orbDrift3 22s ease-in-out infinite',
            }}
          />
        </div>

        {/* Edge vignette for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(20,18,16,0.06) 100%)',
          }}
        />

        {/* ── Content ─────────────────────────────────────────────────── */}
        <div className="relative p-6 md:p-8 max-w-3xl">
          <StepHeader step={1} total={3} title="Upload Listing Photos" />
          <p className="text-sm text-[#8A8682] -mt-2 mb-6">
            Add your best listing shots — we&apos;ll turn them into a cinematic property video.
          </p>
          <UploadZone
            userId={userId}
            onUploadComplete={setImages}
            aiVideoIndices={aiVideoIndices}
            onAiIndicesChange={setAiVideoIndices}
            videoPrompt={videoPrompt}
            onPromptChange={setVideoPrompt}
            onNext={() => setStep('details')}
            nextDisabled={images.length < 3}
          />
        </div>
      </div>
    );
  }

  // ─── STEP: DETAILS ───────────────────────────────────────────────
  if (step === 'details') {
    return (
      <div className="p-6 md:p-8 max-w-2xl">
        <StepHeader step={2} total={3} title="Listing Details" />
        <div className="flex flex-col gap-5">
          <Input
            label="Listing Address (optional)"
            placeholder="123 Oak Street, Austin TX 78701"
            value={listingAddress}
            onChange={(e) => setListingAddress(e.target.value)}
          />
          <Input
            label="Listing Price (optional)"
            placeholder="$1,250,000"
            value={listingPrice}
            onChange={(e) => setListingPrice(e.target.value)}
          />
          <Input
            label="Your Name / Agent Name (optional)"
            placeholder="Sarah Johnson"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
          />

          {/* Format selector */}
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-2">Output Format</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'vertical',   label: 'Vertical',  sub: '9:16 · TikTok / Reels' },
                { value: 'square',     label: 'Square',    sub: '1:1 · Feed posts' },
                { value: 'horizontal', label: 'Landscape', sub: '16:9 · YouTube' },
              ] as const).map(({ value, label, sub }) => {
                const locked = profile?.plan === 'free' && value !== 'vertical';
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && setFormat(value)}
                    className={[
                      'relative text-left border rounded p-3 transition-all text-sm bg-white',
                      format === value
                        ? 'border-[#F0B429] bg-[#FFF8E6] text-[#1A1714]'
                        : locked
                        ? 'border-[#E2DED6] text-[#B8B4AE] cursor-not-allowed bg-[#F7F5EF]'
                        : 'border-[#D8D4CC] text-[#1A1714] hover:border-[#F0B429]/60 cursor-pointer',
                    ].join(' ')}
                  >
                    <div className="font-medium">{label}</div>
                    <div className={`text-xs mt-0.5 ${format === value ? 'text-[#C07A00]' : locked ? 'text-[#C8C4BC]' : 'text-[#6B6760]'}`}>{sub}</div>
                    {locked && <div className="absolute top-1.5 right-1.5 text-[10px]">🔒</div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <Button variant="secondary" size="md" onClick={() => setStep('upload')}>← Back</Button>
          <Button variant="primary"   size="md" onClick={() => setStep('template')}>Next →</Button>
        </div>
      </div>
    );
  }

  // ─── STEP: TEMPLATE ──────────────────────────────────────────────
  if (step === 'template') {
    return (
      <div className="p-6 md:p-8 max-w-3xl">
        <StepHeader step={3} total={3} title="Choose a Template" />
        <TemplateSelector
          selected={selectedTemplateKey}
          onSelect={setSelectedTemplateKey}
          plan={profile?.plan || 'free'}
        />
        <div className="flex gap-3 mt-8">
          <Button variant="secondary" size="md" onClick={() => setStep('details')}>← Back</Button>
          <Button variant="primary" size="lg" loading={generating} onClick={handleGenerate}>
            Generate Video →
          </Button>
        </div>
      </div>
    );
  }

  // ─── STEP: GENERATING ────────────────────────────────────────────
  if (step === 'generating') {
    const hasAiShots = aiVideoIndices.length > 0;
    return (
      <div className="p-6 md:p-8 max-w-xl">
        <div className="bg-[#FFFFFF] border border-[#E2DED6] rounded-[6px] p-10 text-center">
          <div className="text-5xl mb-6 animate-bounce">{hasAiShots ? '🚁' : '🎬'}</div>
          <h2 className="font-syne font-bold text-2xl mb-2">Creating your video…</h2>
          <p className="text-[#C07A00] text-sm mb-8 transition-all duration-500">{loadingMsg}</p>

          {/* Progress bar */}
          <div className="h-1.5 bg-[#EAE8E2] rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-[#F0B429] rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[#8A8682]">{progress < 100 ? 'Rendering…' : 'Done!'}</p>

          {hasAiShots && (
            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-[#7C3AED] bg-[#7C3AED]/8 border border-[#7C3AED]/20 rounded px-3 py-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 shrink-0">
                <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
              </svg>
              Generating {aiVideoIndices.length} AI animated video{aiVideoIndices.length !== 1 ? 's' : ''} — this takes 1–3 min
            </div>
          )}

          {videoId && (
            <p className="text-[10px] text-[#B8B4AE] font-mono mt-4">
              job {videoId.slice(0, 8)}
            </p>
          )}
        </div>
      </div>
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(outputUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  }

  // ─── STEP: RESULT ────────────────────────────────────────────────
  if (step === 'result') {
    return (
      <div className="p-6 md:p-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#F0B429]/20 flex items-center justify-center">
            <span className="text-[#F0B429] text-lg leading-none">✓</span>
          </div>
          <div>
            <h2 className="font-syne font-bold text-2xl leading-tight">Your video is ready!</h2>
            <p className="text-[#6B6760] text-sm">{listingAddress || 'Listing Video'}</p>
          </div>
        </div>

        {/* Video player */}
        <div className="bg-[#F7F5EF] rounded-[6px] overflow-hidden mb-6 shadow-sm">
          <video
            src={outputUrl}
            controls
            autoPlay
            className="w-full max-h-[60vh] object-contain"
            poster={images[0]}
          />
        </div>

        {/* Primary: Download */}
        <a
          href={outputUrl}
          download={`listing-reel-${Date.now()}.mp4`}
          className="flex items-center justify-center gap-3 w-full bg-[#F0B429] text-[#1A1714] font-bold px-6 py-4 rounded-[6px] text-base hover:bg-[#F5C842] transition-all shadow-[0_0_30px_rgba(240,180,41,0.3)] hover:shadow-[0_0_40px_rgba(240,180,41,0.45)] mb-3"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download HD Video
        </a>

        {/* Secondary actions */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 border border-[#E2DED6] bg-white text-[#1A1714] font-medium px-4 py-2.5 rounded-[6px] text-sm hover:border-[#C8C4BC] transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-green-700">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-[#6B6760]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                Copy Link
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              // Keep images + details, just swap to template selection
              setStep('template');
              setOutputUrl('');
              setVideoId('');
              setProgress(0);
            }}
            className="flex-1 flex items-center justify-center gap-2 border border-[#E2DED6] bg-white text-[#1A1714] font-medium px-4 py-2.5 rounded-[6px] text-sm hover:border-[#C8C4BC] transition-colors"
          >
            <svg className="w-4 h-4 text-[#6B6760]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Try Another Style
          </button>
        </div>

        {/* Post tips */}
        <div className="bg-[#FFFFFF] border border-[#E2DED6] rounded-[6px] p-4 mb-6">
          <p className="text-xs font-medium text-[#6B6760] uppercase tracking-wide mb-2">Post to</p>
          <div className="flex flex-wrap gap-2">
            {['TikTok', 'Instagram Reels', 'YouTube Shorts', 'MLS Listing'].map((tip) => (
              <span key={tip} className="text-xs border border-[#E2DED6] rounded px-3 py-1.5 text-[#7A7672]">
                {tip}
              </span>
            ))}
          </div>
        </div>

        {/* Tertiary actions */}
        <div className="flex gap-3">
          <Button variant="secondary" size="md" onClick={() => {
            setStep('upload');
            setImages([]);
            setAiVideoIndices([0]);
            setListingAddress('');
            setListingPrice('');
            setOutputUrl('');
            setVideoId('');
            setProgress(0);
          }}>
            New Listing
          </Button>
          <Button variant="ghost" size="md" onClick={() => router.push('/videos')}>
            View All Videos
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

function StepHeader({ step, total, title }: { step: number; total: number; title: string }) {
  return (
    <div className="mb-8">
      <p className="text-xs text-[#6B6760] font-mono mb-2">STEP {step} OF {total}</p>
      <h1 className="font-syne font-bold text-2xl text-[#1A1714]">{title}</h1>
      <div className="flex gap-2 mt-3">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={[
              'h-1 rounded-full transition-all duration-300',
              i < step ? 'bg-[#F0B429] w-8' : 'bg-[#E2DED6] w-4',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}

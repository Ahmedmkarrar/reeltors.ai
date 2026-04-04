'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { TemplateSelector } from '@/components/dashboard/TemplateSelector';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import type { Profile, VideoFormat } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Step = 'upload' | 'details' | 'template' | 'generating' | 'result';

const LOADING_MESSAGES = [
  'Analyzing your photos…',
  'Applying cinematic effects…',
  'Syncing music…',
  'Rendering your video…',
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
  const [listingAddress, setListingAddress] = useState('');
  const [listingPrice, setListingPrice]     = useState('');
  const [agentName, setAgentName]           = useState('');
  const [format, setFormat]                 = useState<VideoFormat>('vertical');
  const [templateId, setTemplateId]         = useState('9a562ec6-000e-4a92-ad76-bd9adfdc750d');

  // Generation state
  const [videoId, setVideoId]     = useState('');
  const [outputUrl, setOutputUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [progress, setProgress]     = useState(0);

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
    const interval = setInterval(() => {
      msgRef.current = (msgRef.current + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgRef.current]);
      setProgress((p) => Math.min(p + PROGRESS_TICK, PROGRESS_CAP));
    }, 3000);
    return () => clearInterval(interval);
  }, [step]);

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
    setLoadingMsg(LOADING_MESSAGES[0]);

    try {
      const res = await fetch('/api/videos/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          images,
          listingAddress,
          listingPrice,
          agentName,
          format,
          title: listingAddress || 'My Listing Video',
        }),
      });

      if (res.status === 403) {
        const { error } = await res.json();
        toast.error(error || 'Video limit reached. Upgrade to continue.');
        setStep('template');
        setGenerating(false);
        return;
      }

      if (!res.ok) throw new Error('Failed to start generation');

      const { videoId: vid } = await res.json();
      setVideoId(vid);

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

    } catch {
      toast.error('Failed to generate video. Please try again.');
      setStep('template');
      setGenerating(false);
    }
  }

  const userId = profile?.id || '';

  // ─── STEP: UPLOAD ────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="p-6 md:p-8 max-w-3xl">
        <StepHeader step={1} total={3} title="Upload Listing Photos" />
        <UploadZone userId={userId} onUploadComplete={setImages} />
        <div className="flex justify-end mt-6">
          <Button
            variant="primary"
            size="md"
            disabled={images.length < 3}
            onClick={() => setStep('details')}
          >
            Next → ({images.length} photos)
          </Button>
        </div>
        {images.length < 3 && images.length > 0 && (
          <p className="text-xs text-[#6B6760] text-right mt-2">Upload at least 3 photos to continue</p>
        )}
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
                      'relative text-left border rounded p-3 transition-all text-sm',
                      format === value
                        ? 'border-[#F0B429] bg-[#F0EDE6]'
                        : locked
                        ? 'border-[#EAE8E2] opacity-40 cursor-not-allowed'
                        : 'border-[#E2DED6] hover:border-[#B8B4AE] cursor-pointer',
                    ].join(' ')}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-[#6B6760]">{sub}</div>
                    {locked && <div className="absolute top-1 right-1 text-[9px] text-[#6B6760]">🔒</div>}
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
          selected={templateId}
          onSelect={setTemplateId}
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
    return (
      <div className="p-6 md:p-8 max-w-xl">
        <div className="bg-[#FFFFFF] border border-[#E2DED6] rounded-[6px] p-10 text-center">
          <div className="text-5xl mb-6 animate-bounce">🎬</div>
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

          {videoId && (
            <p className="text-[10px] text-[#B8B4AE] font-mono mt-4">
              job {videoId.slice(0, 8)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── STEP: RESULT ────────────────────────────────────────────────
  if (step === 'result') {
    return (
      <div className="p-6 md:p-8 max-w-2xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#F0B429]">✓</span>
            <h2 className="font-syne font-bold text-2xl">Your video is ready!</h2>
          </div>
          <p className="text-[#6B6760] text-sm">
            {listingAddress || 'My Listing Video'}
          </p>
        </div>

        {/* Video player */}
        <div className="bg-[#F7F5EF] rounded-[6px] overflow-hidden mb-6">
          <video
            src={outputUrl}
            controls
            className="w-full max-h-[60vh] object-contain"
            poster={images[0]}
          />
        </div>

        {/* Download button */}
        <div className="flex flex-wrap gap-3 mb-6">
          <a
            href={outputUrl}
            download={`listing-reel-${Date.now()}.mp4`}
            className="inline-flex items-center gap-2 bg-[#F0B429] text-[#1A1714] font-bold px-5 py-2.5 rounded text-sm hover:bg-[#F5C842] transition-colors"
          >
            ↓ Download Reel
          </a>
        </div>

        {/* Post tips */}
        <div className="bg-[#FFFFFF] border border-[#E2DED6] rounded-[6px] p-4 mb-6">
          <p className="text-sm font-medium mb-2">Where to post:</p>
          <div className="flex flex-wrap gap-2">
            {['TikTok', 'Instagram Reels', 'YouTube Shorts', 'MLS Listing'].map((tip) => (
              <span key={tip} className="text-xs border border-[#E2DED6] rounded px-3 py-1.5 text-[#7A7672]">
                {tip}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" size="md" onClick={() => {
            setStep('upload');
            setImages([]);
            setListingAddress('');
            setListingPrice('');
            setOutputUrl('');
            setVideoId('');
            setProgress(0);
          }}>
            Create Another
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
      <h1 className="font-syne font-bold text-2xl">{title}</h1>
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

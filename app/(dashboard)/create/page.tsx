'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { TemplateSelector } from '@/components/dashboard/TemplateSelector';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { TEMPLATES } from '@/lib/shotstack/templates';
import type { Profile, VideoFormat } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Step = 'upload' | 'format' | 'details' | 'template' | 'generating' | 'result';

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
  const [logoUrl, setLogoUrl]               = useState('');
  const [logoPreview, setLogoPreview]       = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Generation state
  const [, setVideoId]     = useState('');
  const [outputUrl, setOutputUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [, setLoadingMsg] = useState(LOADING_MESSAGES_BASE[0]);
  const [progress, setProgress]     = useState(0);
  const [copied, setCopied]         = useState(false);
  const [countdown, setCountdown]   = useState(0);

  const channelRef    = useRef<RealtimeChannel | null>(null);
  const msgRef        = useRef(0);
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single<Profile>();
      if (data) {
        setProfile(data);
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

  // Clean up Realtime channel + countdown on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
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
            stopCountdown();
            setOutputUrl(updated.output_url);
            setProgress(100);
            setStep('result');
            setGenerating(false);
            supabase.removeChannel(channel);
            channelRef.current = null;
          } else if (updated.status === 'failed') {
            stopCountdown();
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

  function stopCountdown() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }

  function startCountdown(seconds: number) {
    stopCountdown();
    setCountdown(seconds);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { stopCountdown(); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function handleLogoUpload(file: File) {
    const isImage = file.type.startsWith('image/');
    const isUnder2MB = file.size <= 2 * 1024 * 1024;
    if (!isImage) { toast.error('Please upload an image file'); return; }
    if (!isUnder2MB) { toast.error('Logo must be under 2 MB'); return; }

    setIsUploadingLogo(true);
    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);

    try {
      const ext  = file.name.split('.').pop();
      const path = `${profile!.id}/logos/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from('listing-images')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(data.path);

      setLogoUrl(publicUrl);
    } catch {
      toast.error('Logo upload failed — please try again');
      setLogoPreview('');
    } finally {
      setIsUploadingLogo(false);
    }
  }

  function removeLogo() {
    setLogoUrl('');
    setLogoPreview('');
  }

  async function handleGenerate() {
    if (!profile) return;
    setGenerating(true);
    setStep('generating');
    setProgress(5);
    msgRef.current = 0;
    setLoadingMsg(
      aiVideoIndices.length > 0 ? LOADING_MESSAGES_AI[0] : LOADING_MESSAGES_BASE[0],
    );
    // Estimated render time: ~90s standard, ~180s with AI drone shots
    startCountdown(aiVideoIndices.length > 0 ? 180 : 90);

    try {
      const templateObj = TEMPLATES.find((t) => t.id === selectedTemplateKey) ?? TEMPLATES[0];
      const templateId = templateObj.templateKey;

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
          logoUrl: logoUrl || undefined,
        }),
      });

      if (res.status === 403) {
        const { code } = await res.json();
        setStep('template');
        setGenerating(false);
        if (code === 'LIMIT_REACHED') {
          window.dispatchEvent(new CustomEvent('show-upgrade-modal'));
        } else {
          toast.error('You are not allowed to generate videos at this time.');
        }
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
            stopCountdown();
            setOutputUrl(output_url);
            setProgress(100);
            setStep('result');
            setGenerating(false);
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            stopCountdown();
            toast.error('Render failed. Please try again.');
            setStep('template');
            setGenerating(false);
          }
        } catch { /* ignore poll errors */ }
      }, 5000);

      // Stop polling after 6 minutes (safety net)
      setTimeout(() => {
        clearInterval(pollInterval);
        stopCountdown();
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
      <div className="h-screen overflow-hidden" style={{ background: '#FFFFFF' }}>
        <div className="p-4 md:p-8 max-w-3xl">
          <StepHeader step={1} total={4} title="Upload Your Photos" />
          <p className="text-sm text-[#8A8682] -mt-2 mb-4">
            Add your best listing shots — we&apos;ll turn them into a cinematic property video.
          </p>

          <UploadZone
            userId={userId}
            plan={profile?.plan}
            onUploadComplete={setImages}
            aiVideoIndices={aiVideoIndices}
            onAiIndicesChange={setAiVideoIndices}
            videoPrompt={videoPrompt}
            onPromptChange={setVideoPrompt}
            format={format}
            onFormatChange={setFormat}
            onNext={() => setStep('format')}
            nextDisabled={images.length < 3}
          />
        </div>
      </div>
    );
  }

  // ─── STEP: FORMAT ────────────────────────────────────────────────
  if (step === 'format') {
    const formatOptions: { value: VideoFormat; label: string; ratio: string; desc: string }[] = [
      { value: 'vertical',   label: 'Vertical',   ratio: '9:16', desc: 'TikTok · Instagram Reels · YouTube Shorts' },
      { value: 'square',     label: 'Square',     ratio: '1:1',  desc: 'Instagram Feed · Facebook' },
      { value: 'horizontal', label: 'Horizontal', ratio: '16:9', desc: 'YouTube · MLS · Desktop' },
    ];
    return (
      <div className="p-4 md:p-8 max-w-2xl">
        <StepHeader step={2} total={4} title="Choose a Format" />
        <p className="text-sm text-[#8A8682] -mt-2 mb-5">Pick the aspect ratio for your video.</p>
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
          {formatOptions.map(({ value, label, ratio, desc }) => {
            const isSelected = format === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFormat(value)}
                className={[
                  'flex flex-col items-center gap-2 md:gap-3 p-3 md:p-5 rounded-[12px] border-2 transition-all',
                  isSelected
                    ? 'border-[#1A1714] bg-[#F5F5F3]'
                    : 'border-[#EBEBEB] bg-white',
                ].join(' ')}
              >
                <div className="flex items-center justify-center h-12 md:h-16">
                  {value === 'vertical' && (
                    <div className={['w-6 h-11 md:w-8 md:h-14 rounded border-2 transition-colors', isSelected ? 'border-[#1A1714] bg-[#1A1714]/8' : 'border-[#D0CECA]'].join(' ')} />
                  )}
                  {value === 'square' && (
                    <div className={['w-10 h-10 md:w-12 md:h-12 rounded border-2 transition-colors', isSelected ? 'border-[#1A1714] bg-[#1A1714]/8' : 'border-[#D0CECA]'].join(' ')} />
                  )}
                  {value === 'horizontal' && (
                    <div className={['w-14 h-8 md:w-16 md:h-9 rounded border-2 transition-colors', isSelected ? 'border-[#1A1714] bg-[#1A1714]/8' : 'border-[#D0CECA]'].join(' ')} />
                  )}
                </div>
                <div className="text-center">
                  <p className={['font-syne font-bold text-xs md:text-sm', isSelected ? 'text-[#1A1714]' : 'text-[#6B6760]'].join(' ')}>{label}</p>
                  <p className={['text-[10px] md:text-xs font-mono mt-0.5', isSelected ? 'text-[#1A1714]/60' : 'text-[#B8B4AE]'].join(' ')}>{ratio}</p>
                  <p className="hidden md:block text-[10px] text-[#B8B4AE] mt-1 leading-tight">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 md:gap-3">
          <Button variant="secondary" size="md" onClick={() => setStep('upload')}>← Back</Button>
          <Button variant="primary" size="md" onClick={() => setStep('details')}>Next →</Button>
        </div>
      </div>
    );
  }

  // ─── STEP: DETAILS ───────────────────────────────────────────────
  if (step === 'details') {
    return (
      <div className="p-4 md:p-8 max-w-2xl">
        <StepHeader step={3} total={4} title="Listing Details" />
        <div className="flex flex-col gap-4">
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

          {/* Logo upload */}
          <div>
            <p className="text-sm font-medium text-[#1A1714] mb-2">
              Logo / Watermark <span className="text-[#B8B4AE] font-normal">(optional)</span>
            </p>
            {logoPreview ? (
              <div className="flex items-center gap-3 p-3 bg-[#F7F5EF] border border-[#E2DED6] rounded-[10px]">
                {isUploadingLogo ? (
                  <div className="w-14 h-14 rounded-[6px] bg-[#EBEBEB] animate-pulse shrink-0" />
                ) : (
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    width={56}
                    height={56}
                    unoptimized
                    className="w-14 h-14 object-contain rounded-[6px] bg-white border border-[#EBEBEB] p-1"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1714]">
                    {isUploadingLogo ? 'Uploading…' : 'Logo added'}
                  </p>
                  <p className="text-xs text-[#8A8682]">Shows in bottom-right corner of your video</p>
                </div>
                {!isUploadingLogo && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#EBEBEB] text-[#8A8682] hover:text-[#1A1714] transition-colors"
                    aria-label="Remove logo"
                  >
                    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <label className="flex items-center gap-3 p-3 border border-dashed border-[#D0CECA] rounded-[10px] cursor-pointer hover:border-[#1A1714]/40 hover:bg-[#F7F5EF] transition-all group">
                <div className="w-10 h-10 rounded-[8px] bg-[#F0EDE6] flex items-center justify-center shrink-0 group-hover:bg-[#E8E4DC] transition-colors">
                  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-[#8A8682]">
                    <path d="M10 3v10M5 8l5-5 5 5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 15h14" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1714]">Upload your logo</p>
                  <p className="text-xs text-[#8A8682]">PNG or SVG with transparent background — under 2 MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }}
                />
              </label>
            )}
          </div>
        </div>
        <div className="flex gap-2 md:gap-3 mt-6 md:mt-8">
          <Button variant="secondary" size="md" onClick={() => setStep('format')}>← Back</Button>
          <Button variant="primary"   size="md" onClick={() => setStep('template')}>Next →</Button>
        </div>
      </div>
    );
  }

  // ─── STEP: TEMPLATE ──────────────────────────────────────────────
  if (step === 'template') {
    return (
      <div className="p-4 md:p-8 max-w-3xl">
        <StepHeader step={4} total={4} title="Choose a Template" />
        <TemplateSelector
          selected={selectedTemplateKey}
          onSelect={setSelectedTemplateKey}
          plan={profile?.plan || 'free'}
        />
        <div className="flex gap-2 md:gap-3 mt-6 md:mt-8">
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
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    const timeLabel = countdown > 0
      ? mins > 0
        ? `~${mins}m ${secs}s remaining`
        : `~${secs}s remaining`
      : 'Almost done…';

    // Timeline milestones
    const milestones = hasAiShots
      ? [
          { label: 'Uploading photos',         pct: 10 },
          { label: 'Generating AI drone shots', pct: 35 },
          { label: 'Compositing footage',       pct: 65 },
          { label: 'Rendering final video',     pct: 85 },
          { label: 'Finishing up',              pct: 96 },
        ]
      : [
          { label: 'Uploading photos',    pct: 10 },
          { label: 'Applying effects',    pct: 30 },
          { label: 'Syncing music',       pct: 55 },
          { label: 'Rendering video',     pct: 80 },
          { label: 'Finishing up',        pct: 96 },
        ];

    const activeMilestone = [...milestones].reverse().find((m) => progress >= m.pct) ?? milestones[0];

    return (
      <div className="p-4 md:p-8 max-w-xl">
        <div className="bg-[#FFFFFF] border border-[#EBEBEB] rounded-[16px] p-6 md:p-10 text-center">
          {/* Animated icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-[#F0B429]/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-full h-full bg-[#FDF8EC] border border-[#F0B429]/30 rounded-full flex items-center justify-center text-4xl">
              {hasAiShots ? '🚁' : '🎬'}
            </div>
          </div>

          <h2 className="font-syne font-bold text-2xl mb-1">Creating your video…</h2>
          <p className="text-[#C07A00] text-sm mb-6 transition-all duration-500 min-h-[20px]">{activeMilestone.label}</p>

          {/* Progress bar */}
          <div className="h-2 bg-[#EAE8E2] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#F0B429] to-[#F5C842] rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Time estimate */}
          <p className="text-sm font-medium text-[#6B6760] mb-6">{timeLabel}</p>

          {/* Milestone steps */}
          <div className="text-left space-y-2.5 bg-[#F7F5EF] rounded-[10px] p-4">
            {milestones.map((m) => {
              const done    = progress >= m.pct + 10;
              const current = !done && progress >= m.pct;
              return (
                <div key={m.label} className="flex items-center gap-3">
                  <div className={[
                    'w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] transition-all',
                    done    ? 'bg-[#F0B429] text-white'     :
                    current ? 'bg-[#F0B429]/30 ring-2 ring-[#F0B429]/60' :
                              'bg-[#E2DED6]',
                  ].join(' ')}>
                    {done && (
                      <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {current && <div className="w-1.5 h-1.5 bg-[#F0B429] rounded-full animate-pulse" />}
                  </div>
                  <span className={[
                    'text-xs transition-all',
                    done    ? 'text-[#6B6760] line-through'  :
                    current ? 'text-[#1A1714] font-semibold' :
                              'text-[#B8B4AE]',
                  ].join(' ')}>{m.label}</span>
                </div>
              );
            })}
          </div>

          {hasAiShots && (
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#7C3AED] bg-[#7C3AED]/8 border border-[#7C3AED]/20 rounded-[6px] px-3 py-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 shrink-0">
                <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
              </svg>
              Generating {aiVideoIndices.length} AI drone shot{aiVideoIndices.length !== 1 ? 's' : ''} — up to 3 min
            </div>
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
      <div className="p-4 md:p-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-[#EAFAF1] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <h2 className="font-syne font-bold text-xl md:text-2xl leading-tight">Your video is ready!</h2>
            <p className="text-[#ADADAD] text-sm">{listingAddress || 'Listing Video'}</p>
          </div>
        </div>

        {/* Video player */}
        <div className="bg-[#F5F5F3] rounded-[12px] overflow-hidden mb-4">
          <video
            src={outputUrl}
            controls
            autoPlay
            playsInline
            className="w-full max-h-[55vh] object-contain"
            poster={images[0]}
          />
        </div>

        {/* Primary: Download */}
        <a
          href={outputUrl}
          download={`listing-reel-${Date.now()}.mp4`}
          className="flex items-center justify-center gap-2.5 w-full bg-[#1A1714] text-white font-bold px-6 py-4 rounded-[12px] text-base hover:bg-[#2A2420] transition-all mb-3 min-h-[52px]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download HD Video
        </a>

        {/* Secondary actions */}
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 border border-[#EBEBEB] bg-white text-[#1A1714] font-medium px-4 py-3 rounded-[10px] text-sm hover:border-[#1A1714]/20 transition-colors min-h-[44px]"
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
              setStep('template');
              setOutputUrl('');
              setVideoId('');
              setProgress(0);
            }}
            className="flex-1 flex items-center justify-center gap-2 border border-[#EBEBEB] bg-white text-[#1A1714] font-medium px-4 py-3 rounded-[10px] text-sm hover:border-[#1A1714]/20 transition-colors min-h-[44px]"
          >
            <svg className="w-4 h-4 text-[#6B6760]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Try Another Style
          </button>
        </div>

        {/* Post tips */}
        <div className="bg-white border border-[#EBEBEB] rounded-[12px] p-4 mb-5">
          <p className="text-[11px] font-semibold text-[#ADADAD] uppercase tracking-wider mb-2.5">Share to</p>
          <div className="flex flex-wrap gap-2">
            {['TikTok', 'Instagram Reels', 'YouTube Shorts', 'MLS Listing'].map((tip) => (
              <span key={tip} className="text-xs border border-[#EBEBEB] rounded-full px-3 py-1.5 text-[#6B6760]">
                {tip}
              </span>
            ))}
          </div>
        </div>

        {/* Tertiary actions */}
        <div className="flex gap-2 md:gap-3">
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
    <div className="mb-5 md:mb-8">
      <p className="text-[10px] text-[#ADADAD] font-mono tracking-widest mb-1.5">STEP {step} OF {total}</p>
      <h1 className="font-syne font-bold text-xl md:text-2xl text-[#1A1714]">{title}</h1>
      <div className="flex gap-1.5 mt-2.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={[
              'h-[3px] rounded-full transition-all duration-300',
              i < step ? 'bg-[#1A1714] w-7' : 'bg-[#EBEBEB] w-4',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}

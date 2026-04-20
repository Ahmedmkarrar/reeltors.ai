'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { TemplateSelector } from '@/components/dashboard/TemplateSelector';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { TEMPLATES } from '@/lib/shotstack/templates';
import type { Profile, VideoFormat } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Step = 'upload' | 'format' | 'details' | 'template' | 'generating' | 'result';


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
  const [progress, setProgress]     = useState(0);
  const [copied, setCopied]         = useState(false);
  const [countdown, setCountdown]   = useState(0);

  const channelRef    = useRef<RealtimeChannel | null>(null);
  const startTimeRef  = useRef<number>(0);
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

  // Smooth time-based progress: fills to 95% over estimated render duration
  useEffect(() => {
    if (step !== 'generating') return;
    const totalMs = (aiVideoIndices.length > 0 ? 180 : 90) * 1000;
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setProgress(Math.min((elapsed / totalMs) * 95, 95));
    }, 250);
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
    setProgress(0);
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
      <div className="relative min-h-screen overflow-hidden" style={{ background: '#F5F2EC' }}>
        {/* Concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[350, 550, 750, 950].map((size) => (
            <div key={size} className="absolute rounded-full border border-[#C9A96E]/10" style={{ width: size, height: size }} />
          ))}
        </div>
        <div className="relative p-6 md:p-10 max-w-3xl">
          <h1 className="font-syne font-bold text-4xl md:text-5xl text-[#1A1714] mb-2 tracking-tight">
            Upload Your Photos
          </h1>
          <p className="text-sm text-[#8A8682] mb-6">
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
      { value: 'vertical',   label: 'Vertical',   ratio: '9:16', desc: 'TikTok · Reels · Shorts' },
      { value: 'square',     label: 'Square',     ratio: '1:1',  desc: 'Instagram · Facebook' },
      { value: 'horizontal', label: 'Horizontal', ratio: '16:9', desc: 'YouTube · MLS · Desktop' },
    ];

    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[#F5F2EC] overflow-hidden px-6 py-12">

        {/* Concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[300, 450, 600, 750].map((size) => (
            <div key={size} className="absolute rounded-full border border-[#C9A96E]/12" style={{ width: size, height: size }} />
          ))}
        </div>

        <h1 className="relative font-syne font-bold text-5xl md:text-6xl text-[#1A1714] mb-12 tracking-tight">
          Select Format
        </h1>

        <div className="relative grid grid-cols-3 gap-5 w-full max-w-3xl mb-12">
          {formatOptions.map(({ value, label, ratio, desc }) => {
            const isSelected = format === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFormat(value)}
                className="flex flex-col items-center gap-5 p-8 rounded-[20px] transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(8px)',
                  border: isSelected ? '2px solid #C9A84C' : '2px solid rgba(201,168,76,0.2)',
                  boxShadow: isSelected
                    ? '0 0 0 4px rgba(201,168,76,0.15), 0 8px 32px rgba(201,168,76,0.2)'
                    : '0 2px 12px rgba(0,0,0,0.04)',
                  transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                }}
              >
                {/* Gold SVG icon */}
                <div className="flex items-center justify-center h-24">
                  {value === 'vertical' && (
                    <svg width="52" height="88" viewBox="0 0 52 88" fill="none">
                      <defs>
                        <linearGradient id="goldV" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#96680A"/>
                          <stop offset="40%" stopColor="#DAA520"/>
                          <stop offset="70%" stopColor="#F5C842"/>
                          <stop offset="100%" stopColor="#B8860B"/>
                        </linearGradient>
                      </defs>
                      <rect x="2" y="2" width="48" height="84" rx="8" stroke="url(#goldV)" strokeWidth="3.5" fill="rgba(201,168,76,0.08)"/>
                      <circle cx="26" cy="76" r="4" fill="url(#goldV)"/>
                      <rect x="18" y="6" width="16" height="3" rx="1.5" fill="url(#goldV)" opacity="0.6"/>
                    </svg>
                  )}
                  {value === 'square' && (
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <defs>
                        <linearGradient id="goldS" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#96680A"/>
                          <stop offset="40%" stopColor="#DAA520"/>
                          <stop offset="70%" stopColor="#F5C842"/>
                          <stop offset="100%" stopColor="#B8860B"/>
                        </linearGradient>
                      </defs>
                      <rect x="2" y="2" width="76" height="76" rx="12" stroke="url(#goldS)" strokeWidth="3.5" fill="rgba(201,168,76,0.08)"/>
                      <rect x="18" y="18" width="44" height="44" rx="6" fill="url(#goldS)" opacity="0.25"/>
                    </svg>
                  )}
                  {value === 'horizontal' && (
                    <svg width="96" height="72" viewBox="0 0 96 72" fill="none">
                      <defs>
                        <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#96680A"/>
                          <stop offset="40%" stopColor="#DAA520"/>
                          <stop offset="70%" stopColor="#F5C842"/>
                          <stop offset="100%" stopColor="#B8860B"/>
                        </linearGradient>
                      </defs>
                      <rect x="2" y="2" width="92" height="60" rx="8" stroke="url(#goldH)" strokeWidth="3.5" fill="rgba(201,168,76,0.08)"/>
                      <rect x="40" y="64" width="16" height="5" rx="2.5" fill="url(#goldH)"/>
                      <rect x="30" y="69" width="36" height="2.5" rx="1.25" fill="url(#goldH)" opacity="0.5"/>
                      <path d="M30 32 L42 22 L52 30 L62 18 L72 28" stroke="url(#goldH)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="38" cy="24" r="5" stroke="url(#goldH)" strokeWidth="2" fill="none"/>
                    </svg>
                  )}
                </div>

                <div className="text-center">
                  <p className="font-syne font-semibold text-base text-[#1A1714]">{label} <span className="text-[#C9A84C]">({ratio})</span></p>
                  <p className="text-xs text-[#8C8680] mt-1">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="relative flex gap-3">
          <Button variant="secondary" size="md" onClick={() => setStep('upload')}>← Back</Button>
          <Button variant="primary" size="md" onClick={() => setStep('details')}>Next →</Button>
        </div>
      </div>
    );
  }

  // ─── STEP: DETAILS ───────────────────────────────────────────────
  if (step === 'details') {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[#F5F2EC] overflow-hidden px-8 py-12">

        {/* Concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[300, 450, 600, 750].map((size) => (
            <div key={size} className="absolute rounded-full border border-[#C9A96E]/12" style={{ width: size, height: size }} />
          ))}
        </div>

        <div className="relative w-full max-w-4xl">
          <h1 className="font-syne font-bold text-5xl md:text-6xl text-[#1A1714] mb-12 tracking-tight">
            Listing Details
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-0">

            {/* Left — form fields */}
            <div className="flex flex-col gap-10">
              {[
                { label: 'Address', value: listingAddress, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setListingAddress(e.target.value), placeholder: '123 Oak Street, Austin TX' },
                { label: 'Price',   value: listingPrice,   onChange: (e: React.ChangeEvent<HTMLInputElement>) => setListingPrice(e.target.value),   placeholder: '$1,250,000' },
                { label: 'Agent Name', value: agentName,   onChange: (e: React.ChangeEvent<HTMLInputElement>) => setAgentName(e.target.value),      placeholder: 'Sarah Johnson' },
              ].map(({ label, value, onChange, placeholder }) => (
                <div key={label}>
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#8C8680] mb-3">
                    {label} <span className="normal-case font-normal tracking-normal text-[#B8B4AE]">— optional</span>
                  </p>
                  <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full bg-transparent text-lg text-[#1A1714] placeholder:text-[#C9C5BE] outline-none pb-3 transition-colors duration-200"
                    style={{ borderBottom: '1.5px solid #C9A84C' }}
                    onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#F0B429'; }}
                    onBlur={(e) => { e.currentTarget.style.borderBottomColor = '#C9A84C'; }}
                  />
                </div>
              ))}
            </div>

            {/* Right — logo upload */}
            <div className="flex items-center justify-center mt-8 md:mt-0">
              {logoPreview ? (
                <div className="relative flex flex-col items-center gap-4">
                  <div
                    className="w-44 h-44 rounded-full flex items-center justify-center"
                    style={{
                      background: 'radial-gradient(circle at 35% 35%, #F5C842, #C9930A 50%, #96680A)',
                      boxShadow: '0 8px 40px rgba(197,152,40,0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
                    }}
                  >
                    {isUploadingLogo ? (
                      <div className="w-16 h-16 rounded-full bg-white/20 animate-pulse" />
                    ) : (
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        width={80}
                        height={80}
                        unoptimized
                        className="w-20 h-20 object-contain rounded-full"
                      />
                    )}
                  </div>
                  {!isUploadingLogo && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="text-xs text-[#8C8680] hover:text-[#1A1714] transition-colors underline underline-offset-2"
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              ) : (
                <label className="cursor-pointer group">
                  <div
                    className="w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 group-hover:scale-105"
                    style={{
                      background: 'radial-gradient(circle at 35% 35%, #F5C842, #C9930A 50%, #96680A)',
                      boxShadow: '0 8px 40px rgba(197,152,40,0.35), inset 0 2px 4px rgba(255,255,255,0.25)',
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white/80">
                      <path d="M12 5v10M7 10l5-5 5 5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5 18h14" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
                    </svg>
                    <span className="text-xs font-semibold tracking-[0.1em] uppercase text-white/90">Upload Logo</span>
                    <span className="text-[10px] text-white/60">optional</span>
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

          <div className="flex gap-3 mt-14">
            <Button variant="secondary" size="md" onClick={() => setStep('format')}>← Back</Button>
            <Button variant="primary"   size="md" onClick={() => setStep('template')}>Next →</Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP: TEMPLATE ──────────────────────────────────────────────
  if (step === 'template') {
    return (
      <div className="relative flex flex-col min-h-screen w-full bg-[#F5F2EC] overflow-hidden px-8 py-12">

        {/* Concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[350, 550, 750, 950].map((size) => (
            <div key={size} className="absolute rounded-full border border-[#C9A96E]/10" style={{ width: size, height: size }} />
          ))}
        </div>

        <div className="relative w-full max-w-5xl mx-auto">
          <h1 className="font-syne font-bold text-5xl md:text-6xl text-[#1A1714] mb-10 tracking-tight">
            Choose a Template
          </h1>

          <TemplateSelector
            selected={selectedTemplateKey}
            onSelect={setSelectedTemplateKey}
            plan={profile?.plan || 'free'}
          />

          <div className="flex gap-3 mt-10">
            <Button variant="secondary" size="md" onClick={() => setStep('details')}>← Back</Button>
            <Button variant="primary" size="lg" loading={generating} onClick={handleGenerate}>
              Generate Video →
            </Button>
          </div>
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

    const activeMilestoneIndex = milestones.reduce((acc, m, i) => progress >= m.pct ? i : acc, 0);

    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-[#F5F2EC]">
        <div className="relative w-full max-w-2xl px-10 py-12 text-center">

          {/* Concentric circle rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[220, 320, 420, 520].map((size) => (
              <div
                key={size}
                className="absolute rounded-full border border-[#C9A96E]/12"
                style={{ width: size, height: size }}
              />
            ))}
          </div>

          {/* Percentage */}
          <div className="relative mb-8">
            <span
              className="text-8xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #1A1714 0%, #B8860B 45%, #F5C842 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>

          {/* Gold progress bar */}
          <div className="relative h-7 bg-[#E4DFD4] rounded-full overflow-hidden mb-8 mx-2">
            <div
              className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #96680A 0%, #C9930A 25%, #F0B429 55%, #FFD966 75%, #DAA520 100%)',
                boxShadow: '0 2px 16px rgba(197,152,40,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              <div className="absolute inset-0 w-1/3 animate-gold-shimmer"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
              />
            </div>
          </div>

          {/* Stage ticker */}
          <div
            className="relative overflow-hidden w-full mb-4"
            style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)' }}
          >
            <div
              className="flex w-full transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(calc(${(2 - activeMilestoneIndex) * 20}%))` }}
            >
              {milestones.map((m, i) => {
                const offset = Math.abs(i - activeMilestoneIndex);
                const isCurrent = offset === 0;
                const opacity = isCurrent ? 1 : offset === 1 ? 0.4 : 0.15;
                return (
                  <div
                    key={m.label}
                    className="w-1/5 flex-shrink-0 text-center transition-all duration-500"
                    style={{ opacity }}
                  >
                    <span
                      className="text-sm whitespace-nowrap"
                      style={{
                        fontWeight: isCurrent ? 600 : 400,
                        color: isCurrent ? '#1A1714' : '#6B6760',
                      }}
                    >
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time estimate */}
          <p className="text-sm text-[#8C8680]">{timeLabel}</p>

          {hasAiShots && (
            <div className="mt-6 inline-flex items-center gap-1.5 text-[11px] text-[#7C3AED] bg-[#7C3AED]/8 border border-[#7C3AED]/20 rounded-[6px] px-3 py-1.5">
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
      <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[#F5F2EC] overflow-hidden px-6 py-12">

        {/* Concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[300, 480, 660, 840].map((size) => (
            <div key={size} className="absolute rounded-full border border-[#C9A96E]/12" style={{ width: size, height: size }} />
          ))}
        </div>

        <div className="relative w-full max-w-2xl flex flex-col items-center text-center">

          {/* Title */}
          <h1 className="font-syne font-bold text-5xl md:text-6xl text-[#1A1714] mb-8 tracking-tight">
            Video Ready
          </h1>

          {/* Video player */}
          <div
            className="w-full rounded-[20px] overflow-hidden mb-8"
            style={{
              border: '2px solid #C9A84C',
              boxShadow: '0 0 0 4px rgba(201,168,76,0.12), 0 12px 48px rgba(201,168,76,0.2)',
            }}
          >
            <video
              src={outputUrl}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[55vh] object-contain bg-[#1A1714]"
              poster={images[0]}
            />
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-6 flex-wrap justify-center">

            {/* Gold download pill */}
            <a
              href={outputUrl}
              download={`listing-reel-${Date.now()}.mp4`}
              className="relative overflow-hidden flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-transform duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(90deg, #96680A 0%, #C9930A 25%, #F0B429 55%, #FFD966 75%, #DAA520 100%)',
                boxShadow: '0 4px 24px rgba(197,152,40,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                color: '#1A1714',
              }}
            >
              <div className="absolute inset-0 w-1/3 animate-gold-shimmer"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
              />
              <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span className="relative z-10">Download Video</span>
            </a>

            {/* Copy link */}
            <button type="button" onClick={copyLink} className="flex flex-col items-center gap-1.5 text-[#6B6760] hover:text-[#1A1714] transition-colors">
              {copied ? (
                <svg className="w-6 h-6 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              )}
              <span className="text-[11px] font-semibold tracking-widest uppercase">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            {/* Try another style */}
            <button
              type="button"
              onClick={() => { setStep('template'); setOutputUrl(''); setVideoId(''); setProgress(0); }}
              className="flex flex-col items-center gap-1.5 text-[#6B6760] hover:text-[#1A1714] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span className="text-[11px] font-semibold tracking-widest uppercase">Restyle</span>
            </button>
          </div>

          {/* Share to platforms */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#B8B4AE] mr-1">Share to</span>
            {['TikTok', 'Instagram Reels', 'YouTube Shorts', 'MLS Listing'].map((platform) => (
              <span key={platform} className="text-xs rounded-full px-3 py-1.5 text-[#6B6760] transition-colors"
                style={{ border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(255,255,255,0.6)' }}>
                {platform}
              </span>
            ))}
          </div>

          {/* New listing */}
          <button
            type="button"
            className="mt-6 text-sm text-[#8C8680] hover:text-[#1A1714] transition-colors underline underline-offset-4"
            onClick={() => {
              setStep('upload');
              setImages([]);
              setAiVideoIndices([0]);
              setListingAddress('');
              setListingPrice('');
              setOutputUrl('');
              setVideoId('');
              setProgress(0);
            }}
          >
            Start a new listing
          </button>
        </div>
      </div>
    );
  }

  return null;
}


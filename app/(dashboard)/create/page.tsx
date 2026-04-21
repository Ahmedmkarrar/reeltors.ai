'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { TEMPLATES } from '@/lib/shotstack/templates';
import type { Profile, VideoFormat } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { StepUpload }     from '@/components/dashboard/create/StepUpload';
import { StepFormat }     from '@/components/dashboard/create/StepFormat';
import { StepDetails }    from '@/components/dashboard/create/StepDetails';
import { StepTemplate }   from '@/components/dashboard/create/StepTemplate';
import { StepGenerating } from '@/components/dashboard/create/StepGenerating';
import { StepResult }     from '@/components/dashboard/create/StepResult';

type Step = 'upload' | 'format' | 'details' | 'template' | 'generating' | 'result';

export default function CreatePage() {
  const router   = useRouter();
  const supabase = createClient();

  const [step, setStep]       = useState<Step>('upload');
  const [profile, setProfile] = useState<Profile | null>(null);

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

  const [, setVideoId]            = useState('');
  const [outputUrl, setOutputUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [isCopied, setIsCopied]   = useState(false);
  const [countdown, setCountdown] = useState(0);

  const channelRef   = useRef<RealtimeChannel | null>(null);
  const startTimeRef = useRef<number>(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single<Profile>();
      if (data) setProfile(data);
    });
  }, [supabase, router]);

  // smooth time-based progress fill to 95% over estimated render duration
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

  const subscribeToVideo = useCallback((vid: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`video-${vid}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'videos', filter: `id=eq.${vid}` }, (payload) => {
        const updated = payload.new as { status: string; output_url?: string };
        if (updated.status === 'complete' && updated.output_url) {
          stopCountdown();
          setOutputUrl(updated.output_url);
          setProgress(100);
          setStep('result');
          setIsGenerating(false);
          supabase.removeChannel(channel);
          channelRef.current = null;
        } else if (updated.status === 'failed') {
          stopCountdown();
          toast.error('Render failed. Please try again.');
          setStep('template');
          setIsGenerating(false);
          supabase.removeChannel(channel);
          channelRef.current = null;
        }
      })
      .subscribe();

    channelRef.current = channel;
  }, [supabase]);

  async function handleLogoUpload(file: File) {
    const isImage    = file.type.startsWith('image/');
    const isUnder2MB = file.size <= 2 * 1024 * 1024;
    if (!isImage)    { toast.error('Please upload an image file'); return; }
    if (!isUnder2MB) { toast.error('Logo must be under 2 MB'); return; }
    if (!profile)    { toast.error('Profile not loaded, please refresh'); return; }

    setIsUploadingLogo(true);
    setLogoPreview(URL.createObjectURL(file));

    try {
      const ext  = file.name.split('.').pop();
      const path = `${profile.id}/logos/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from('listing-images')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(data.path);
      setLogoUrl(publicUrl);
    } catch {
      toast.error('Logo upload failed — please try again');
      setLogoPreview('');
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleGenerate() {
    if (!profile) return;
    setIsGenerating(true);
    setStep('generating');
    setProgress(0);
    startCountdown(aiVideoIndices.length > 0 ? 180 : 90);

    try {
      const templateObj = TEMPLATES.find((t) => t.id === selectedTemplateKey) ?? TEMPLATES[0];

      const res = await fetch('/api/videos/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId:     templateObj.templateKey,
          images,
          aiVideoIndices,
          listingAddress,
          listingPrice,
          agentName,
          format,
          title:       listingAddress || 'My Listing Video',
          videoPrompt: videoPrompt.trim() || undefined,
          logoUrl:     logoUrl || undefined,
        }),
      });

      if (res.status === 403) {
        const { code } = await res.json();
        setStep('template');
        setIsGenerating(false);
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

      subscribeToVideo(vid);

      // polling fallback in case Realtime webhook misses the update
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
            setIsGenerating(false);
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            stopCountdown();
            toast.error('Render failed. Please try again.');
            setStep('template');
            setIsGenerating(false);
          }
        } catch { /* ignore poll errors */ }
      }, 5000);

      // safety net — stop polling after 6 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        stopCountdown();
        if (isGenerating) {
          toast.error('Render timed out. Please check your videos page.');
          setStep('template');
          setIsGenerating(false);
        }
      }, 360_000);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate video');
      setStep('template');
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(outputUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  }

  function handleRestyle() {
    setStep('template');
    setOutputUrl('');
    setVideoId('');
    setProgress(0);
  }

  function handleNewListing() {
    setStep('upload');
    setImages([]);
    setAiVideoIndices([0]);
    setListingAddress('');
    setListingPrice('');
    setOutputUrl('');
    setVideoId('');
    setProgress(0);
  }

  const userId = profile?.id ?? '';

  if (step === 'upload') return (
    <StepUpload
      userId={userId}
      plan={profile?.plan}
      images={images}
      aiVideoIndices={aiVideoIndices}
      videoPrompt={videoPrompt}
      format={format}
      onUploadComplete={setImages}
      onAiIndicesChange={setAiVideoIndices}
      onPromptChange={setVideoPrompt}
      onFormatChange={setFormat}
      onNext={() => setStep('format')}
    />
  );

  if (step === 'format') return (
    <StepFormat
      format={format}
      onFormatChange={setFormat}
      onBack={() => setStep('upload')}
      onNext={() => setStep('details')}
    />
  );

  if (step === 'details') return (
    <StepDetails
      listingAddress={listingAddress}
      listingPrice={listingPrice}
      agentName={agentName}
      logoPreview={logoPreview}
      isUploadingLogo={isUploadingLogo}
      onAddressChange={(e) => setListingAddress(e.target.value)}
      onPriceChange={(e) => setListingPrice(e.target.value)}
      onAgentNameChange={(e) => setAgentName(e.target.value)}
      onLogoUpload={handleLogoUpload}
      onLogoRemove={() => { setLogoUrl(''); setLogoPreview(''); }}
      onBack={() => setStep('format')}
      onNext={() => setStep('template')}
    />
  );

  if (step === 'template') return (
    <StepTemplate
      selectedTemplateKey={selectedTemplateKey}
      plan={profile?.plan ?? 'free'}
      isGenerating={isGenerating}
      onSelect={setSelectedTemplateKey}
      onBack={() => setStep('details')}
      onGenerate={handleGenerate}
    />
  );

  if (step === 'generating') return (
    <StepGenerating
      progress={progress}
      countdown={countdown}
      aiVideoIndices={aiVideoIndices}
    />
  );

  if (step === 'result') return (
    <StepResult
      outputUrl={outputUrl}
      images={images}
      isCopied={isCopied}
      onCopy={handleCopy}
      onRestyle={handleRestyle}
      onNewListing={handleNewListing}
    />
  );

  return null;
}

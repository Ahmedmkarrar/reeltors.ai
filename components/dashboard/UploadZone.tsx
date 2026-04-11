'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { MAX_AI_VIDEOS } from '@/lib/fal/client';
import type { VideoFormat } from '@/types';

interface UploadedFile {
  url: string;
  name: string;
  preview: string;
}

const MAX_WORDS = 300;

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

const PROMPT_TEMPLATES = [
  {
    label: 'FPV Walkthrough',
    preview: 'First-person glide through each room',
    prompt: 'Smooth first-person drone gliding through each room, revealing the open floor plan. Warm interior lighting, natural fluid motion.',
  },
  {
    label: 'Luxury Reveal',
    preview: 'Slow push revealing premium finishes',
    prompt: 'Slow cinematic forward push revealing premium architectural details and luxury finishes. Elegant, refined camera movement.',
  },
  {
    label: 'Golden Hour Aerial',
    preview: 'Aerial orbit at warm sunset light',
    prompt: 'Gentle aerial orbit around the property at golden hour. Warm sunset tones, long soft shadows, dramatic sky backdrop.',
  },
  {
    label: 'Interior Showcase',
    preview: 'Glide highlighting key living spaces',
    prompt: 'Smooth camera glide highlighting key interior spaces — open kitchen, living area, master suite. Clean, modern movement.',
  },
  {
    label: 'Twilight Drama',
    preview: 'Push toward lit windows at blue hour',
    prompt: 'Slow push toward warmly lit windows at twilight blue hour. Dramatic contrast between interior glow and cool exterior tones.',
  },
  {
    label: 'Neighbourhood View',
    preview: 'Wide pull-back revealing the street',
    prompt: 'Wide pull-back shot revealing the property within its street and neighbourhood context. Calm, establishing movement.',
  },
] as const;

const FORMAT_ASPECT: Record<VideoFormat, string> = {
  vertical:   '9/16',
  square:     '1/1',
  horizontal: '16/9',
};

const FORMAT_LABEL: Record<VideoFormat, string> = {
  vertical:   '9:16',
  square:     '1:1',
  horizontal: '16:9',
};

interface UploadZoneProps {
  userId: string;
  onUploadComplete: (urls: string[]) => void;
  /** Currently selected AI-generation indices (controlled by parent) */
  aiVideoIndices: number[];
  /** Called whenever the user toggles AI on/off for a photo */
  onAiIndicesChange: (indices: number[]) => void;
  maxFiles?: number;
  /** Controlled prompt value */
  videoPrompt?: string;
  /** Called whenever the prompt changes */
  onPromptChange?: (prompt: string) => void;
  /** Controlled format value */
  format?: VideoFormat;
  /** Called whenever the format changes */
  onFormatChange?: (format: VideoFormat) => void;
  /** Callback for the embedded Next button */
  onNext?: () => void;
  /** Disables the embedded Next button */
  nextDisabled?: boolean;
}

export function UploadZone({
  userId,
  onUploadComplete,
  aiVideoIndices,
  onAiIndicesChange,
  maxFiles = 15,
  videoPrompt = '',
  onPromptChange,
  format = 'vertical',
  onFormatChange,
  onNext,
  nextDisabled = false,
}: UploadZoneProps) {
  const supabase = createClient();
  const [files, setFiles]             = useState<UploadedFile[]>([]);
  const [uploading, setUploading]     = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [isFocused, setIsFocused]     = useState(false);
  const [typedText, setTypedText]     = useState('');

  const PLACEHOLDER = 'Describe your vision… or tap ✦ for ready-made prompts';

  // Typewriter animation — runs when the prompt is empty
  useEffect(() => {
    if (videoPrompt) { setTypedText(''); return; }

    let index     = 0;
    let deleting  = false;
    let timerId: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!deleting) {
        index++;
        setTypedText(PLACEHOLDER.slice(0, index));
        if (index === PLACEHOLDER.length) {
          timerId = setTimeout(() => { deleting = true; tick(); }, 2200);
          return;
        }
        timerId = setTimeout(tick, 48);
      } else {
        index--;
        setTypedText(PLACEHOLDER.slice(0, index));
        if (index === 0) {
          timerId = setTimeout(() => { deleting = false; tick(); }, 500);
          return;
        }
        timerId = setTimeout(tick, 22);
      }
    };

    timerId = setTimeout(tick, 350);
    return () => clearTimeout(timerId);
  }, [videoPrompt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Native drag-to-reorder state
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} photos allowed`);
        return;
      }

      setUploading(true);
      const newFiles: UploadedFile[] = [];

      for (const file of acceptedFiles) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 10MB limit`);
          continue;
        }

        const preview = URL.createObjectURL(file);
        const ext = file.name.split('.').pop();
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { data, error } = await supabase.storage
          .from('listing-images')
          .upload(path, file, { cacheControl: '3600', upsert: false });

        if (error) {
          toast.error(`Upload failed: ${error.message}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(data.path);

        newFiles.push({ url: publicUrl, name: file.name, preview });
      }

      const updated = [...files, ...newFiles];
      setFiles(updated);
      onUploadComplete(updated.map((f) => f.url));
      setUploading(false);
    },
    [files, maxFiles, userId, supabase, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles,
    disabled: uploading || files.length >= maxFiles,
    noClick: true, // click handled explicitly via open() on the zone div and + button
  });

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onUploadComplete(updated.map((f) => f.url));
    // Remap AI indices: remove the deleted index, shift down any indices above it
    const newAiIndices = aiVideoIndices
      .filter((i) => i !== index)
      .map((i) => (i > index ? i - 1 : i));
    onAiIndicesChange(newAiIndices);
  }

  function toggleAiForIndex(index: number) {
    const isOn = aiVideoIndices.includes(index);
    if (isOn) {
      onAiIndicesChange(aiVideoIndices.filter((i) => i !== index));
    } else {
      if (aiVideoIndices.length >= MAX_AI_VIDEOS) {
        toast.error(`Maximum ${MAX_AI_VIDEOS} AI drone shots per video`);
        return;
      }
      onAiIndicesChange([...aiVideoIndices, index].sort((a, b) => a - b));
    }
  }

  // ── Native HTML5 drag-to-reorder handlers ──────────────────────────
  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault();
    const fromIndex = dragIndex.current;
    if (fromIndex === null || fromIndex === toIndex) {
      setDragOverIndex(null);
      return;
    }

    const updated = [...files];
    const [item] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, item);
    setFiles(updated);
    onUploadComplete(updated.map((f) => f.url));

    // Remap AI indices to follow their photo after reorder
    const remapped = aiVideoIndices.map((i) => {
      if (i === fromIndex) return toIndex;
      if (fromIndex < toIndex && i > fromIndex && i <= toIndex) return i - 1;
      if (fromIndex > toIndex && i >= toIndex && i < fromIndex) return i + 1;
      return i;
    });
    onAiIndicesChange(Array.from(new Set(remapped)).sort((a, b) => a - b));

    dragIndex.current = null;
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDragOverIndex(null);
  }

  return (
    <div {...getRootProps()} className="space-y-4 outline-none">
      {/* Hidden file input — drag-and-drop + programmatic open() both use this */}
      <input {...getInputProps()} />

      {/* Draggable photo strip — min-h keeps the bar pinned at the same vertical position */}
      <div className="min-h-[172px]">

      {/* Empty state — big obvious upload zone */}
      {files.length === 0 && (
        <div
          onClick={open}
          className={[
            'h-full min-h-[220px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 select-none',
            isDragActive
              ? 'border-[#F0B429] bg-[#FFF8E6]'
              : 'border-[#D8D4CC] bg-white hover:border-[#F0B429]/60 hover:bg-[#FFFCF5]',
          ].join(' ')}
        >
          {/* Upload icon */}
          <div className={[
            'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
            isDragActive ? 'bg-[#F0B429]/20' : 'bg-[#F7F5EF]',
          ].join(' ')}>
            <svg className={['w-7 h-7 transition-colors', isDragActive ? 'text-[#F0B429]' : 'text-[#B8B4AE]'].join(' ')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>

          {isDragActive ? (
            <p className="text-[#F0B429] font-semibold text-base">Drop your photos here</p>
          ) : (
            <>
              <div className="text-center">
                <p className="font-semibold text-[#1A1714] text-base mb-1">
                  Click to upload listing photos
                </p>
                <p className="text-[13px] text-[#8A8682]">or drag & drop · JPG, PNG, WEBP · max 10MB each</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm px-4">
                {[
                  { icon: '📸', label: 'Up to 15 photos' },
                  { icon: '⚡', label: 'AI drone shots' },
                  { icon: '🎬', label: 'Cinematic motion' },
                  { icon: '📐', label: '9:16 · 1:1 · 16:9' },
                ].map(({ icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1 text-[11px] text-[#9A9690] bg-[#F7F5EF] rounded-full px-3 py-1">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {files.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#6B6760]">
              <span className="font-medium text-[#1A1714]">{files.length}</span>{' '}
              photo{files.length !== 1 ? 's' : ''} · drag to reorder · center-cropped to {FORMAT_LABEL[format]}
            </p>
            <p className="text-xs text-[#F0B429] font-medium">#1 = cover frame</p>
          </div>

          {/* AI legend */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/30 rounded px-2 py-0.5">
              <BoltIcon className="w-2.5 h-2.5" /> AI
            </span>
            <span className="text-[10px] text-[#8A8682]">animate your video using AI</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 pt-3 pl-2">
            {files.map((file, i) => {
              const isAi = aiVideoIndices.includes(i);
              return (
                <div
                  key={file.url}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                  className={[
                    'relative flex-shrink-0 w-[72px] select-none transition-all duration-150 cursor-grab active:cursor-grabbing',
                    dragOverIndex === i && dragIndex.current !== i
                      ? 'scale-105 ring-2 ring-[#F0B429] rounded'
                      : '',
                    dragIndex.current === i ? 'opacity-40' : 'opacity-100',
                  ].join(' ')}
                >
                  {/* crop preview — aspect ratio mirrors selected format */}
                  <div
                    className={[
                      'relative overflow-hidden rounded border bg-[#F7F5EF]',
                      isAi ? 'border-[#7C3AED]/60 ring-1 ring-[#7C3AED]/40' : 'border-[#E2DED6]',
                    ].join(' ')}
                    style={{ aspectRatio: FORMAT_ASPECT[format] }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      draggable={false}
                    />
                    {isAi && <div className="absolute inset-0 bg-[#7C3AED]/10 pointer-events-none" />}
                    {i === 0 && (
                      <div className="absolute top-1 left-1 right-1 bg-[#F0B429] text-[#1A1714] text-[8px] font-bold text-center rounded-sm py-0.5 leading-none">
                        COVER
                      </div>
                    )}
                    {isAi && (
                      <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                        <span className="inline-flex items-center gap-0.5 bg-[#7C3AED] text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                          <BoltIcon className="w-2 h-2" /> AI
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {[0, 1, 2].map((dot) => (
                        <div key={dot} className="w-0.5 h-2 bg-white/60 rounded-full" />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 w-4 h-4 bg-black/70 rounded-full flex items-center justify-center text-white text-[8px] hover:bg-red-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Order number */}
                  <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-[#F0B429] rounded-full flex items-center justify-center text-[8px] font-bold text-[#1A1714] shadow-sm">
                    {i + 1}
                  </div>

                  {/* AI toggle */}
                  <button
                    type="button"
                    title={isAi ? 'Remove AI drone shot' : 'Generate AI drone shot'}
                    onClick={() => toggleAiForIndex(i)}
                    className={[
                      'absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center shadow-sm transition-all border',
                      isAi
                        ? 'bg-[#7C3AED] border-[#6D28D9] text-white'
                        : 'bg-white border-[#D8D4CC] text-[#B8B4AE] hover:border-[#7C3AED] hover:text-[#7C3AED]',
                    ].join(' ')}
                  >
                    <BoltIcon className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}

            {/* Add more slot — click calls open(), drag is caught by outer wrapper */}
            {files.length < maxFiles && (
              <button
                type="button"
                onClick={open}
                disabled={uploading}
                className="flex-shrink-0 w-[72px] border-2 border-dashed border-[#E2DED6] rounded flex items-center justify-center hover:border-[#F0B429]/50 transition-colors disabled:opacity-40"
                style={{ aspectRatio: FORMAT_ASPECT[format] }}
              >
                <span className="text-xl text-[#C8C4BC]">+</span>
              </button>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Video prompt + Next — unified dark bar (also the visual drop target) */}
      {(() => {
        const wordCount = countWords(videoPrompt);
        const isOver = wordCount > MAX_WORDS;
        return (
          <div className="relative">
            <div
              className={[
                'flex items-stretch rounded-[8px] overflow-hidden transition-all duration-200',
                'border',
                isDragActive
                  ? 'border-[#F0B429]/60 ring-2 ring-[#F0B429]/15'
                  : isOver
                  ? 'border-red-500/60 focus-within:ring-1 focus-within:ring-red-500/20'
                  : 'border-[#2A2622] focus-within:border-[#F0B429]/40 focus-within:ring-1 focus-within:ring-[#F0B429]/10',
              ].join(' ')}
              style={{ background: '#141210' }}
            >
              {/* Left action column: upload + prompt templates + format picker */}
              <div className="flex-shrink-0 flex flex-col items-center justify-between py-3 px-3.5 gap-2">
                <button
                  type="button"
                  onClick={open}
                  disabled={uploading || files.length >= maxFiles}
                  title="Add photos"
                  className="text-[#484440] hover:text-[#F0B429] transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="w-[17px] h-[17px]" />
                </button>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => setShowPrompts((p) => !p)}
                    className={[
                      'transition-colors duration-150',
                      showPrompts ? 'text-[#F0B429]' : 'text-[#484440] hover:text-[#F0B429]',
                    ].join(' ')}
                  >
                    <SparkleIcon className="w-[15px] h-[15px]" />
                  </button>
                  {/* Styled tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md border border-[#2A2622] text-[10px] text-[#C8C4BC] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" style={{ background: '#1A1714' }}>
                    Prompt ideas
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#2A2622' }} />
                  </div>
                </div>

                {/* Format picker */}
                <div className="relative group">
                  <div className="flex flex-col gap-0.5">
                    {(['vertical', 'square', 'horizontal'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        title={`${FORMAT_LABEL[f]} · ${f === 'vertical' ? 'TikTok / Reels' : f === 'square' ? 'Feed posts' : 'YouTube'}`}
                        onClick={() => onFormatChange?.(f)}
                        className={[
                          'transition-all duration-150 rounded-sm flex items-center justify-center',
                          format === f ? 'opacity-100' : 'opacity-30 hover:opacity-60',
                        ].join(' ')}
                      >
                        <FormatIcon type={f} active={format === f} />
                      </button>
                    ))}
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md border border-[#2A2622] text-[10px] text-[#C8C4BC] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" style={{ background: '#1A1714' }}>
                    {FORMAT_LABEL[format]}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#2A2622' }} />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-[#2A2622] flex-shrink-0 my-2.5" />

              {/* Textarea */}
              <div className="relative flex-1 min-w-0">
                {/* Cursor blink keyframe */}
                <style>{`@keyframes cursorBlink{0%,100%{opacity:1}50%{opacity:0}}`}</style>

                <textarea
                  rows={3}
                  value={videoPrompt}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (countWords(next) <= MAX_WORDS || next.length < videoPrompt.length) {
                      onPromptChange?.(next);
                    }
                  }}
                  className="w-full h-full resize-none bg-transparent px-3 pt-3 pb-7 text-sm text-[#E8E4DE] outline-none"
                />

                {/* Animated typewriter placeholder */}
                {!videoPrompt && !isFocused && (
                  <div className="absolute inset-0 px-3 pt-3 pb-7 text-sm text-[#3A3632] pointer-events-none select-none">
                    {typedText}
                    <span
                      className="inline-block w-px h-[13px] bg-[#4A4642] ml-px align-middle"
                      style={{ animation: 'cursorBlink 1s steps(1) infinite' }}
                    />
                  </div>
                )}
                <span
                  className={[
                    'absolute bottom-2 left-3 text-[11px] tabular-nums pointer-events-none',
                    isOver ? 'text-red-400' : 'text-[#3A3632]',
                  ].join(' ')}
                >
                  {wordCount} / {MAX_WORDS} words
                </span>
              </div>

              {/* Divider */}
              {/* Next button */}
              {onNext && (
                <div className="flex-shrink-0 flex items-center px-3">
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={nextDisabled}
                    className={[
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      'font-bold text-sm text-[#1A1714] bg-[#F0B429] transition-all',
                      'disabled:opacity-35 disabled:cursor-not-allowed',
                      'hover:bg-[#E8AC22] hover:scale-105 active:scale-95 active:bg-[#D9A01E]',
                      'shadow-[0_0_16px_rgba(240,180,41,0.35)]',
                    ].join(' ')}
                    title={`Next — ${files.length} photo${files.length !== 1 ? 's' : ''}`}
                  >
                    →
                  </button>
                </div>
              )}
            </div>

            {/* Prompt templates popover */}
            {showPrompts && (
              <>
                {/* Backdrop — closes on outside click */}
                <div className="fixed inset-0 z-10" onClick={() => setShowPrompts(false)} />

                <div
                  className="absolute bottom-full left-0 right-0 mb-2 z-20 rounded-[10px] overflow-hidden border border-[#2A2622] shadow-2xl"
                  style={{ background: '#1A1714' }}
                >
                  <div className="p-3">
                    <p className="text-[10px] text-[#484440] font-medium uppercase tracking-widest mb-2.5 px-1">
                      Prompt templates
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PROMPT_TEMPLATES.map((t) => (
                        <button
                          key={t.label}
                          type="button"
                          onClick={() => {
                            onPromptChange?.(t.prompt);
                            setShowPrompts(false);
                          }}
                          className="text-left px-3 py-2.5 rounded-[7px] border border-[#2A2622] hover:border-[#F0B429]/30 transition-all group"
                          style={{ background: '#141210' }}
                        >
                          <p className="text-[11px] font-semibold text-[#C8C4BC] group-hover:text-[#F0B429] transition-colors leading-tight">
                            {t.label}
                          </p>
                          <p className="text-[10px] text-[#484440] mt-0.5 leading-tight">
                            {t.preview}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Drag-active overlay on the bar */}
            {isDragActive && (
              <div className="absolute inset-0 rounded-[8px] flex items-center justify-center pointer-events-none" style={{ background: 'rgba(240,180,41,0.06)' }}>
                <p className="text-[#F0B429] text-sm font-medium tracking-wide">Drop photos here</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Hint / uploading state */}
      {uploading && (
        <p className="text-center text-[11px] text-[#F0B429] animate-pulse tracking-wide">Uploading…</p>
      )}
      {!uploading && files.length > 0 && (
        <p className="text-center text-[11px] text-[#B8B4AE] select-none tracking-wide">
          {files.length} photo{files.length !== 1 ? 's' : ''} added · drag to reorder · min 3 to continue
        </p>
      )}
    </div>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2c-.28 3.1-1.9 5.6-4.7 6.9C4.5 10.2 2.2 10.3 2 10.5c.2.2 2.5.3 5.3 1.6 2.8 1.3 4.4 3.8 4.7 6.9.28-3.1 1.9-5.6 4.7-6.9 2.8-1.3 5.1-1.4 5.3-1.6-.2-.2-2.5-.3-5.3-1.6C13.9 7.6 12.28 5.1 12 2z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FormatIcon({ type, active }: { type: VideoFormat; active: boolean }) {
  const color = active ? '#F0B429' : '#6A6560';
  if (type === 'vertical') {
    return (
      <svg width="12" height="18" viewBox="0 0 12 18" fill="none">
        <rect x="0.5" y="0.5" width="11" height="17" rx="1.5" stroke={color} strokeWidth="1.2" fill={active ? `${color}22` : 'none'} />
      </svg>
    );
  }
  if (type === 'square') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="0.5" y="0.5" width="13" height="13" rx="1.5" stroke={color} strokeWidth="1.2" fill={active ? `${color}22` : 'none'} />
      </svg>
    );
  }
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
      <rect x="0.5" y="0.5" width="17" height="11" rx="1.5" stroke={color} strokeWidth="1.2" fill={active ? `${color}22` : 'none'} />
    </svg>
  );
}

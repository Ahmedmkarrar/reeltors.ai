'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { MAX_AI_VIDEOS } from '@/lib/fal/client';
import type { VideoFormat } from '@/types';

interface UploadedFile {
  url: string;
  name: string;
  preview: string;
  isUploading?: boolean;
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
  /** User's current plan — free users see upgrade prompt on bolt click */
  plan?: string;
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
  onNext,
  nextDisabled = false,
  plan,
}: UploadZoneProps) {
  const supabase = createClient();
  const [files, setFiles]       = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showAiPaywall, setShowAiPaywall] = useState(false);

  const isPlanLoaded = plan !== undefined;
  const isFreeUser = !plan || plan === 'free';


  // Native drag-to-reorder state
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} photos allowed`);
        return;
      }

      const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

      const validFiles: File[] = [];
      for (const file of acceptedFiles) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 10 MB`);
          continue;
        }

        // check declared MIME type first (fast rejection)
        const declaredType = file.type.toLowerCase();
        if (declaredType === 'image/heic' || declaredType === 'image/heif' ||
            file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          toast.error(`${file.name}: HEIC not supported — convert to JPG first`);
          continue;
        }
        if (!ALLOWED_MIME.has(declaredType)) {
          toast.error(`${file.name}: only JPG, PNG, and WEBP are supported`);
          continue;
        }

        // verify actual file content via magic bytes (can't be spoofed by renaming)
        const header = await file.slice(0, 12).arrayBuffer();
        const b = new Uint8Array(header);
        const isJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
        const isPng  = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
        const isWebp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
                    && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;

        const mimeMatchesMagic =
          (declaredType === 'image/jpeg' && isJpeg) ||
          (declaredType === 'image/png'  && isPng)  ||
          (declaredType === 'image/webp' && isWebp);

        if (!mimeMatchesMagic) {
          toast.error(`${file.name}: file content doesn't match its extension`);
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      // show local previews instantly before upload completes
      const placeholders: UploadedFile[] = validFiles.map((file) => ({
        url: '',
        name: file.name,
        preview: URL.createObjectURL(file),
        isUploading: true,
      }));

      const baseFiles = files; // snapshot before this drop (closure)
      setFiles([...baseFiles, ...placeholders]);
      setUploading(true);

      const results = await Promise.all(
        validFiles.map(async (file, i) => {
          // derive extension from magic bytes, not the filename
          const header = await file.slice(0, 12).arrayBuffer();
          const b = new Uint8Array(header);
          const isPng  = b[0] === 0x89 && b[1] === 0x50;
          const isWebp = b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57;
          const ext = isPng ? 'png' : isWebp ? 'webp' : 'jpg';
          const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

          const { data, error } = await supabase.storage
            .from('listing-images')
            .upload(path, file, { cacheControl: '3600', upsert: false });

          if (error) {
            toast.error(`Upload failed: ${file.name}`);
            return null;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('listing-images')
            .getPublicUrl(data.path);

          return { url: publicUrl, name: file.name, preview: placeholders[i].preview } as UploadedFile;
        })
      );

      const completed = results.filter((f): f is UploadedFile => f !== null);
      const updated = [...baseFiles, ...completed];
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
    if (isFreeUser) {
      setShowAiPaywall(true);
      return;
    }
    const isOn = aiVideoIndices.includes(index);
    if (isOn) {
      onAiIndicesChange(aiVideoIndices.filter((i) => i !== index));
    } else {
      if (aiVideoIndices.length >= MAX_AI_VIDEOS) {
        toast.error(`Maximum ${MAX_AI_VIDEOS} AI animated videos per video`);
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
              ? 'border-[#C9A84C] bg-[#FDF8EC]'
              : 'border-[#C9A84C]/30 bg-white/70 hover:border-[#C9A84C]/60 hover:bg-white/85',
          ].join(' ')}
        >
          {/* Upload icon */}
          <div className={[
            'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
            isDragActive ? 'bg-[#C9A84C]/20' : 'bg-[#F0EDE6]',
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
                  { icon: '⚡', label: 'AI animated videos' },
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


      </div>

      {/* Spacer so content isn't hidden behind the fixed bar */}
      <div className="h-[320px] md:h-[280px]" />

      {/* Prompt bar — fixed to viewport bottom */}
      {(() => {
        const wordCount = countWords(videoPrompt);
        const isOver = wordCount > MAX_WORDS;
        return (
          <div className="fixed bottom-0 left-0 md:left-[240px] right-0 z-50 px-3 md:px-8 pb-4 md:pb-6" style={{ background: '#F5F2EC' }}>
            {/* Fade gradient above the bar */}
            <div className="absolute inset-x-0 -top-10 h-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #F5F2EC)' }} />
            <div
              className={[
                'rounded-[14px] bg-white/80 border shadow-[0_-2px_24px_rgba(26,23,20,0.06)] overflow-visible transition-all duration-200',
                isDragActive
                  ? 'border-[#C9A84C] ring-2 ring-[#C9A84C]/20'
                  : isOver
                  ? 'border-red-400'
                  : 'border-[#E2DED6] focus-within:border-[#C9A84C]/40',
              ].join(' ')}
            >

              {/* Photo strip — shown inside the bar once photos exist */}
              {files.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-1">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white rounded-md px-2.5 py-1"
                        style={{ background: 'linear-gradient(135deg, #F5C842, #C9930A)' }}>
                        <BoltIcon className="w-3 h-3" /> AI
                      </span>
                      <span className="text-xs text-[#8A8682]">
                        {uploading
                          ? <span className="text-[#F0B429] animate-pulse">Uploading {files.filter((f) => f.isUploading).length} photo{files.filter((f) => f.isUploading).length !== 1 ? 's' : ''}…</span>
                          : 'tap ⚡ to animate with AI · drag to reorder'}
                      </span>
                    </div>
                    <div className="flex gap-2.5 overflow-x-auto pb-3 pt-2 pl-1">
                      {files.map((file, i) => {
                        const isAi = aiVideoIndices.includes(i);
                        const isCardUploading = !!file.isUploading;
                        return (
                          <div
                            key={file.preview}
                            draggable={!isCardUploading}
                            onDragStart={() => !isCardUploading && handleDragStart(i)}
                            onDragOver={(e) => !isCardUploading && handleDragOver(e, i)}
                            onDrop={(e) => !isCardUploading && handleDrop(e, i)}
                            onDragEnd={handleDragEnd}
                            className={[
                              'relative flex-shrink-0 w-[60px] select-none transition-all duration-150',
                              isCardUploading ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
                              dragOverIndex === i && dragIndex.current !== i ? 'scale-105 ring-2 ring-[#F0B429] rounded' : '',
                              dragIndex.current === i ? 'opacity-40' : 'opacity-100',
                            ].join(' ')}
                          >
                            <div
                              className={[
                                'relative overflow-hidden rounded border bg-[#F7F5EF]',
                                isAi && !isCardUploading ? 'border-[#C9A84C]/70 ring-1 ring-[#C9A84C]/30' : 'border-[#E2DED6]',
                              ].join(' ')}
                              style={{ aspectRatio: FORMAT_ASPECT[format] }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={file.preview} alt={file.name} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                              {isCardUploading && (
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                  </svg>
                                </div>
                              )}
                              {isAi && !isCardUploading && <div className="absolute inset-0 bg-[#C9A84C]/10 pointer-events-none" />}
                              {isAi && !isCardUploading && (
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                  <span className="inline-flex items-center gap-0.5 text-white text-[6px] font-bold px-1 py-0.5 rounded-full leading-none"
                                    style={{ background: 'linear-gradient(135deg, #F5C842, #C9930A)' }}>
                                    <BoltIcon className="w-1.5 h-1.5" /> AI
                                  </span>
                                </div>
                              )}
                              {!isCardUploading && (
                                <button
                                  type="button"
                                  onClick={() => removeFile(i)}
                                  className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-black/70 rounded-full flex items-center justify-center text-white text-[7px] hover:bg-red-600 transition-colors"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            <div className={[
                              'absolute -top-1.5 -left-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold shadow-sm border',
                              isCardUploading ? 'bg-[#F3F3F2] border-[#E2DED6] text-[#ADADAD]' : 'bg-white border-[#D0CECA] text-[#1A1714]',
                            ].join(' ')}>
                              {i + 1}
                            </div>
                            <button
                              type="button"
                              title={isAi ? 'Remove AI animated video' : 'Generate AI animated video'}
                              onClick={() => !isCardUploading && isPlanLoaded && toggleAiForIndex(i)}
                              disabled={isCardUploading || !isPlanLoaded}
                              className={[
                                'absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center shadow-sm transition-all border',
                                isCardUploading
                                  ? 'bg-white border-[#D8D4CC] text-[#C8C4BC] opacity-50 cursor-not-allowed'
                                  : isAi
                                  ? 'border-[#C9930A] text-white'
                                  : 'bg-white border-[#D8D4CC] text-[#B8B4AE] hover:border-[#C9A84C] hover:text-[#C9A84C]',
                              ].join(' ')}
                              style={isAi && !isCardUploading ? { background: 'linear-gradient(135deg, #F5C842, #C9930A)' } : {}}
                            >
                              <BoltIcon className="w-2 h-2" />
                            </button>
                          </div>
                        );
                      })}
                      {files.length < maxFiles && (
                        <button
                          type="button"
                          onClick={open}
                          disabled={uploading}
                          className="flex-shrink-0 w-[60px] border-2 border-dashed border-[#E2DED6] rounded flex items-center justify-center hover:border-[#F0B429]/50 transition-colors disabled:opacity-40"
                          style={{ aspectRatio: FORMAT_ASPECT[format] }}
                        >
                          <span className="text-lg text-[#C8C4BC]">+</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="h-px bg-[#F0EDE6]" />
                </>
              )}

              {/* Textarea row */}
              <div className="flex items-start gap-3 px-4 pt-3.5 pb-2">
                <button
                  type="button"
                  onClick={open}
                  disabled={uploading || files.length >= maxFiles}
                  title="Add photos"
                  className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-[8px] border border-[#E2DED6] flex items-center justify-center text-[#B8B4AE] hover:border-[#F0B429]/60 hover:text-[#F0B429] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>

                <div className="relative flex-1 min-w-0">
                  <textarea
                    rows={2}
                    value={videoPrompt}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (countWords(next) <= MAX_WORDS || next.length < videoPrompt.length) {
                        onPromptChange?.(next);
                      }
                    }}
                    className="w-full resize-none bg-transparent text-[16px] md:text-sm text-[#1A1714] outline-none leading-relaxed placeholder:text-[#C8C4BC]"
                    placeholder="Describe your vision for an AI animated shot…"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-[#F0EDE6] mx-4" />

              {/* Bottom action row */}
              <div className="flex items-center gap-2 px-4 py-2.5">
                {/* Prompt templates trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPrompts((p) => !p)}
                    title="Prompt ideas"
                    className={[
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
                      showPrompts
                        ? 'border-[#1A1714]/30 bg-[#F5F5F3] text-[#1A1714]'
                        : 'border-[#E2DED6] text-[#8A8682] hover:border-[#1A1714]/20 hover:text-[#1A1714]',
                    ].join(' ')}
                  >
                    <SparkleIcon className="w-3 h-3" />
                    Ideas
                  </button>
                </div>

                <div className="flex-1" />

                {/* Word count */}
                <span className={['text-[11px] tabular-nums', isOver ? 'text-red-400 font-medium' : 'text-[#C8C4BC]'].join(' ')}>
                  {wordCount}/{MAX_WORDS}
                </span>

                {/* Next button */}
                {onNext && (
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={nextDisabled || uploading}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(90deg, #96680A 0%, #C9930A 25%, #F0B429 55%, #FFD966 75%, #DAA520 100%)', color: '#1A1714', boxShadow: '0 2px 16px rgba(197,152,40,0.5), inset 0 1px 0 rgba(255,255,255,0.2)' }}
                    title={`Next — ${files.length} photo${files.length !== 1 ? 's' : ''}`}
                  >
                    Next →
                  </button>
                )}
              </div>

              {/* Prompt templates popover */}
              {showPrompts && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowPrompts(false)} />
                  <div className="absolute bottom-full left-0 right-0 mb-2 z-20 rounded-[12px] border border-[#E2DED6] bg-white shadow-[0_8px_32px_rgba(26,23,20,0.12)] overflow-hidden max-h-[60vh] overflow-y-auto">
                    <div className="p-3">
                      <p className="text-[10px] text-[#B8B4AE] font-medium uppercase tracking-widest mb-2.5 px-1">
                        Prompt ideas
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {PROMPT_TEMPLATES.map((t) => (
                          <button
                            key={t.label}
                            type="button"
                            onClick={() => {
                              onPromptChange?.(t.prompt);
                              setShowPrompts(false);
                            }}
                            className="text-left px-3 py-2.5 rounded-[8px] border border-[#F0EDE6] bg-[#FAFAF8] hover:border-[#F0B429]/40 hover:bg-[#FDF8EC] transition-all group"
                          >
                            <p className="text-[11px] font-semibold text-[#1A1714] group-hover:text-[#C07A00] transition-colors leading-tight">
                              {t.label}
                            </p>
                            <p className="text-[10px] text-[#B8B4AE] mt-0.5 leading-tight">
                              {t.preview}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Drag-active overlay */}
              {isDragActive && (
                <div className="absolute inset-0 rounded-[14px] flex items-center justify-center pointer-events-none bg-[#FDF8EC]/80">
                  <p className="text-[#C07A00] text-sm font-medium">Drop photos here</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* AI drone shots paywall modal */}
      {showAiPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAiPaywall(false)} />
          <div className="relative w-full max-w-sm rounded-[16px] border border-[#E2DED6] bg-white p-6 shadow-2xl">
            {/* Close */}
            <button
              type="button"
              onClick={() => setShowAiPaywall(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-[#9A9690] hover:bg-[#F7F5EF] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-[#1A1714]/8 flex items-center justify-center mb-4">
              <BoltIcon className="w-5 h-5 text-[#1A1714]" />
            </div>

            <h3 className="font-syne font-bold text-lg text-[#1A1714] mb-1">AI Animated Videos</h3>
            <p className="text-sm text-[#6B6760] mb-5">
              Upgrade to <span className="font-semibold text-[#1A1714]">Starter</span> or higher to animate your listing with AI animated videos.
            </p>

            <a
              href="/pricing"
              className="flex items-center justify-center w-full bg-[#F0B429] text-[#1A1714] font-bold px-4 py-3 rounded-[8px] text-sm hover:bg-[#F5C842] transition-colors mb-2"
            >
              Upgrade to Starter →
            </a>
            <button
              type="button"
              onClick={() => setShowAiPaywall(false)}
              className="w-full text-sm text-[#9A9690] py-2 hover:text-[#6B6760] transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
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

function FormatIcon({ type, active }: { type: VideoFormat; active: boolean }) { // eslint-disable-line @typescript-eslint/no-unused-vars
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

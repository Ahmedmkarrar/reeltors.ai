'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface UploadedFile {
  url: string;
  name: string;
  preview: string;
}

interface UploadZoneProps {
  userId: string;
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
}

export function UploadZone({ userId, onUploadComplete, maxFiles = 15 }: UploadZoneProps) {
  const supabase = createClient();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

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
          toast.error(`Failed to upload ${file.name}`);
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles,
    disabled: uploading || files.length >= maxFiles,
  });

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onUploadComplete(updated.map((f) => f.url));
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
    dragIndex.current = null;
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDragOverIndex(null);
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={[
          'border-2 border-dashed rounded-[6px] p-10 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-[#F0B429] bg-[#F0B429]/5'
            : files.length >= maxFiles
            ? 'border-[#E2DED6] opacity-50 cursor-not-allowed'
            : 'border-[#E2DED6] hover:border-[#F0B429]/50 hover:bg-[#FDFCF8]',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">📸</div>
        {isDragActive ? (
          <p className="text-[#F0B429] font-medium">Drop photos here</p>
        ) : (
          <>
            <p className="font-medium text-[#1A1714] mb-1">
              Drag &amp; drop listing photos here
            </p>
            <p className="text-sm text-[#8A8682]">
              or click to browse · JPG, PNG, WebP · up to 10MB each · max {maxFiles} photos
            </p>
          </>
        )}
        {uploading && (
          <p className="mt-3 text-sm text-[#F0B429] animate-pulse">Uploading…</p>
        )}
      </div>

      {/* Draggable photo strip */}
      {files.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#6B6760]">
              <span className="font-medium text-[#1A1714]">{files.length}</span>{' '}
              photo{files.length !== 1 ? 's' : ''} · drag to reorder · photos center-cropped to 9:16
            </p>
            <p className="text-xs text-[#F0B429] font-medium">#1 = cover frame</p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 pt-3 pl-2">
            {files.map((file, i) => (
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
                {/* 9:16 crop preview */}
                <div className="aspect-[9/16] relative overflow-hidden rounded border border-[#E2DED6] bg-[#F7F5EF]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                  />

                  {/* Cover badge */}
                  {i === 0 && (
                    <div className="absolute top-1 left-1 right-1 bg-[#F0B429] text-[#1A1714] text-[8px] font-bold text-center rounded-sm py-0.5 leading-none">
                      COVER
                    </div>
                  )}

                  {/* Drag handle dots */}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {[0, 1, 2].map((dot) => (
                      <div key={dot} className="w-0.5 h-2 bg-white/60 rounded-full" />
                    ))}
                  </div>

                  {/* Remove button */}
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
              </div>
            ))}

            {/* Add more slot */}
            {files.length < maxFiles && (
              <div
                {...getRootProps()}
                className="flex-shrink-0 w-[72px] aspect-[9/16] border-2 border-dashed border-[#E2DED6] rounded flex items-center justify-center cursor-pointer hover:border-[#F0B429]/50 transition-colors"
              >
                <input {...getInputProps()} />
                <span className="text-xl text-[#C8C4BC]">+</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

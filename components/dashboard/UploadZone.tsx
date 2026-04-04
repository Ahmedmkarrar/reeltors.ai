'use client';

import { useState, useCallback } from 'react';
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
  const [, setProgress] = useState<Record<string, number>>({});

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

        setProgress((p) => ({ ...p, [file.name]: 10 }));

        const { data, error } = await supabase.storage
          .from('listing-images')
          .upload(path, file, { cacheControl: '3600', upsert: false });

        if (error) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        setProgress((p) => ({ ...p, [file.name]: 100 }));

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

  function moveFile(from: number, to: number) {
    const updated = [...files];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setFiles(updated);
    onUploadComplete(updated.map((f) => f.url));
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={[
          'border-2 border-dashed rounded-[6px] p-10 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-[#C8FF00] bg-[#C8FF00]/5'
            : files.length >= maxFiles
            ? 'border-[#222222] opacity-50 cursor-not-allowed'
            : 'border-[#333333] hover:border-[#C8FF00]/50 hover:bg-[#111111]',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">📸</div>
        {isDragActive ? (
          <p className="text-[#C8FF00] font-medium">Drop photos here</p>
        ) : (
          <>
            <p className="font-medium text-[#F0F0EB] mb-1">
              Drag & drop listing photos here
            </p>
            <p className="text-sm text-[#555555]">
              or click to browse · JPG, PNG, WebP · up to 10MB each · max {maxFiles} photos
            </p>
          </>
        )}
        {uploading && (
          <p className="mt-3 text-sm text-[#C8FF00] animate-pulse">Uploading…</p>
        )}
      </div>

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {files.map((file, i) => (
            <div key={file.url} className="relative group aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.preview}
                alt={file.name}
                className="w-full h-full object-cover rounded border border-[#222222]"
              />
              {/* Controls */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveFile(i, i - 1)}
                    className="w-6 h-6 bg-[#1a1a1a] rounded flex items-center justify-center text-xs hover:bg-[#333333]"
                  >
                    ←
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="w-6 h-6 bg-[#FF5500] rounded flex items-center justify-center text-xs text-white hover:bg-[#e64d00]"
                >
                  ✕
                </button>
                {i < files.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveFile(i, i + 1)}
                    className="w-6 h-6 bg-[#1a1a1a] rounded flex items-center justify-center text-xs hover:bg-[#333333]"
                  >
                    →
                  </button>
                )}
              </div>
              {/* Order number */}
              <div className="absolute top-1 left-1 w-4 h-4 bg-[#080808]/80 rounded-full flex items-center justify-center text-[9px] font-bold text-[#C8FF00]">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <p className="text-xs text-[#555555]">
          {files.length} photo{files.length !== 1 ? 's' : ''} ready · hover to reorder or remove
        </p>
      )}
    </div>
  );
}

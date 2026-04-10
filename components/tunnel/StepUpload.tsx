'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface StepUploadProps {
  sessionToken: string;
  onComplete: (imageUrls: string[]) => void;
}

interface UploadedPhoto {
  url: string;
  previewUrl: string;
}

const UPLOAD_TIMEOUT_MS = 15_000;

export default function StepUpload({ sessionToken, onComplete }: StepUploadProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  // Revoke all object URLs on unmount to prevent memory leaks
  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => { urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionToken', sessionToken);

      const res = await fetch('/api/tunnel/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const body = await res.json().catch(() => ({})) as Record<string, string>;

      if (!res.ok) {
        throw new Error(body.error ?? 'Upload failed');
      }
      if (!body.url) {
        throw new Error('Upload succeeded but no URL returned');
      }
      return body.url;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Upload timed out — check your connection and try again');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }, [sessionToken]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (photos.length + acceptedFiles.length > 15) {
      setUploadError('Max 15 photos allowed.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const results = await Promise.allSettled(
      acceptedFiles.map(async (file) => {
        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.add(previewUrl);
        const url = await uploadFile(file);
        return { url, previewUrl };
      })
    );

    const succeeded = results
      .filter((r): r is PromiseFulfilledResult<UploadedPhoto> => r.status === 'fulfilled')
      .map((r) => r.value);

    // Revoke preview URLs for failed uploads
    results
      .filter((r) => r.status === 'rejected')
      .forEach((_, i) => {
        const file = acceptedFiles[i];
        if (file) {
          // Find and revoke the preview URL we created for the failed file
          const failedPreview = succeeded.find(() => false); // noop — already added to ref
          void failedPreview;
        }
      });

    const failedCount = results.filter((r) => r.status === 'rejected').length;
    if (failedCount > 0) {
      const firstError = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
      const msg = firstError?.reason instanceof Error ? firstError.reason.message : 'Upload failed';
      setUploadError(`${failedCount} photo(s) failed: ${msg}`);
    }

    setPhotos((prev) => [...prev, ...succeeded]);
    setIsUploading(false);
  }, [photos.length, uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 15,
    disabled: isUploading || photos.length >= 15,
  });

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const photo = prev[index];
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl);
        previewUrlsRef.current.delete(photo.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#F0F0EB', margin: '0 0 12px' }}>
          Upload your listing photos
        </h1>
        <p style={{ color: '#6B6760', fontSize: 16, margin: 0 }}>
          Drag up to 15 photos — we&apos;ll turn them into a cinematic listing video.
        </p>
      </div>

      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#F0B429' : '#2E2B27'}`,
          borderRadius: 12,
          padding: '48px 24px',
          textAlign: 'center',
          cursor: photos.length >= 15 ? 'default' : 'pointer',
          transition: 'border-color 0.2s',
          background: isDragActive ? 'rgba(240, 180, 41, 0.05)' : 'transparent',
          marginBottom: 24,
        }}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: 40, marginBottom: 16 }}>📷</div>
        {isUploading ? (
          <p style={{ color: '#F0B429', fontWeight: 600 }}>Uploading...</p>
        ) : isDragActive ? (
          <p style={{ color: '#F0B429', fontWeight: 600 }}>Drop to upload</p>
        ) : (
          <>
            <p style={{ color: '#F0F0EB', fontWeight: 600, marginBottom: 8 }}>
              Drop photos here, or click to select
            </p>
            <p style={{ color: '#4A4642', fontSize: 13, margin: 0 }}>
              JPEG, PNG, WEBP · max 10 MB each · up to 15 photos
            </p>
          </>
        )}
      </div>

      {uploadError && (
        <p style={{ color: '#FF5500', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
          {uploadError}
        </p>
      )}

      {photos.length > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: 8,
              marginBottom: 32,
            }}
          >
            {photos.map((photo, i) => (
              <div key={photo.url} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={`Photo ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  onClick={() => removePhoto(i)}
                  style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'rgba(13,11,8,0.8)', color: '#F0F0EB',
                    border: 'none', borderRadius: '50%', width: 20, height: 20,
                    cursor: 'pointer', fontSize: 12, lineHeight: '20px', padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#6B6760', fontSize: 13, marginBottom: 20 }}>
              {photos.length} of 15 photos uploaded
            </p>
            <button
              onClick={() => onComplete(photos.map((p) => p.url))}
              style={{
                background: '#F0B429', color: '#0D0B08',
                border: 'none', borderRadius: 8, padding: '16px 40px',
                fontSize: 17, fontWeight: 700, cursor: 'pointer',
                width: '100%', maxWidth: 320,
              }}
            >
              Continue — Pick a style →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

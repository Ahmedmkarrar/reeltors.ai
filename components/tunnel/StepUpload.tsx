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
  isUploading?: boolean;
}

const UPLOAD_TIMEOUT_MS = 60_000;

export default function StepUpload({ sessionToken, onComplete }: StepUploadProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());

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

      if (!res.ok) throw new Error(body.error ?? 'Upload failed');
      if (!body.url) throw new Error('Upload succeeded but no URL returned');
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
    setUploadError(null);

    // Show instant previews before upload completes
    const placeholders: UploadedPhoto[] = acceptedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      return { url: '', previewUrl, isUploading: true };
    });

    const basePhotos = photos;
    setPhotos([...basePhotos, ...placeholders]);
    setIsUploading(true);

    const results = await Promise.allSettled(
      acceptedFiles.map((file) => uploadFile(file))
    );

    const completed: UploadedPhoto[] = results.flatMap((result, i) => {
      if (result.status === 'fulfilled') {
        return [{ url: result.value, previewUrl: placeholders[i].previewUrl, isUploading: false }];
      }
      // Revoke blob URL for failed uploads
      URL.revokeObjectURL(placeholders[i].previewUrl);
      previewUrlsRef.current.delete(placeholders[i].previewUrl);
      return [];
    });

    const failedCount = results.filter((r) => r.status === 'rejected').length;
    if (failedCount > 0) {
      const firstError = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
      const msg = firstError?.reason instanceof Error ? firstError.reason.message : 'Upload failed';
      setUploadError(`${failedCount} photo(s) failed: ${msg}`);
    }

    const updatedPhotos = [...basePhotos, ...completed];
    setPhotos(updatedPhotos);
    setIsUploading(false);
  }, [photos, uploadFile]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 15,
    disabled: isUploading || photos.length >= 15,
    noClick: true,
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

  const completedPhotos = photos.filter((p) => !p.isUploading);
  const uploadingCount = photos.filter((p) => p.isUploading).length;

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

      {/* Dropzone — always visible, shrinks when photos exist */}
      <div
        {...getRootProps()}
        onClick={open}
        style={{
          border: `2px dashed ${isDragActive ? '#F0B429' : '#2E2B27'}`,
          borderRadius: 12,
          padding: photos.length > 0 ? '24px' : '48px 24px',
          textAlign: 'center',
          cursor: photos.length >= 15 ? 'default' : 'pointer',
          transition: 'border-color 0.2s, padding 0.2s',
          background: isDragActive ? 'rgba(240, 180, 41, 0.05)' : 'transparent',
          marginBottom: 16,
        }}
      >
        <input {...getInputProps()} />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(240,180,41,0.08)',
            border: '1px solid rgba(240,180,41,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
        </div>
        {isDragActive ? (
          <p style={{ color: '#C9A96E', fontWeight: 600, fontSize: 14 }}>Release to upload</p>
        ) : (
          <>
            <p style={{ color: '#E8E4DE', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              {photos.length > 0 ? 'Add more photos' : 'Drop listing photos here, or click to browse'}
            </p>
            <p style={{ color: '#4A4642', fontSize: 12, margin: 0 }}>
              JPEG · PNG · WEBP &nbsp;·&nbsp; max 10 MB each &nbsp;·&nbsp; up to 15 photos
            </p>
          </>
        )}
      </div>

      {uploadError && (
        <p style={{ color: '#FF5500', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
          {uploadError}
        </p>
      )}

      {/* Photo grid — appears instantly with placeholders */}
      {photos.length > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: 8,
              marginBottom: 16,
            }}
          >
            {photos.map((photo, i) => (
              <div
                key={photo.previewUrl}
                style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: '#1A1714' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={`Photo ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Uploading overlay with spinner */}
                {photo.isUploading && (
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(13,11,8,0.55)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <svg
                      width="20" height="20" viewBox="0 0 24 24" fill="none"
                      style={{ animation: 'spin 0.8s linear infinite' }}
                    >
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#F0B429" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                {!photo.isUploading && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'rgba(13,11,8,0.8)', color: '#F0F0EB',
                      border: 'none', borderRadius: '50%', width: 20, height: 20,
                      cursor: 'pointer', fontSize: 12, lineHeight: '20px', padding: 0,
                    }}
                  >
                    ×
                  </button>
                )}
                {/* Number badge */}
                <div
                  style={{
                    position: 'absolute', bottom: 4, left: 6,
                    background: 'rgba(13,11,8,0.7)',
                    color: '#F0F0EB', fontSize: 10, fontWeight: 700,
                    borderRadius: 4, padding: '1px 5px',
                  }}
                >
                  {i + 1}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={{ color: '#6B6760', fontSize: 13, marginBottom: 20 }}>
              {isUploading
                ? <span style={{ color: '#F0B429' }}>Uploading {uploadingCount} photo{uploadingCount !== 1 ? 's' : ''}…</span>
                : `${completedPhotos.length} of 15 photos uploaded`}
            </p>
            <button
              onClick={() => !isUploading && onComplete(completedPhotos.map((p) => p.url))}
              disabled={isUploading || completedPhotos.length === 0}
              style={{
                background: isUploading ? '#2E2B27' : '#F0B429',
                color: isUploading ? '#6B6760' : '#0D0B08',
                border: 'none', borderRadius: 8, padding: '16px 40px',
                fontSize: 17, fontWeight: 700,
                cursor: isUploading ? 'not-allowed' : 'pointer',
                width: '100%', maxWidth: 320,
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {isUploading ? 'Uploading…' : 'Continue — Pick a style →'}
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

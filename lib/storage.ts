import { getSupabaseAdmin } from '@/lib/supabase/admin';

const OUTPUT_BUCKET = 'output-videos';

/**
 * Download a video from an external URL (Creatomate CDN)
 * and permanently store it in Supabase Storage.
 * Returns the permanent public URL.
 */
export async function downloadAndStoreVideo(
  renderId: string,
  sourceUrl: string,
  userId: string
): Promise<string> {
  const response = await fetchWithTimeout(sourceUrl, 60_000);

  if (!response.ok) {
    throw new Error(`Failed to download video from CDN: HTTP ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const path = `${userId}/${renderId}.mp4`;
  const supabase = getSupabaseAdmin();

  const { error: uploadError } = await supabase.storage
    .from(OUTPUT_BUCKET)
    .upload(path, Buffer.from(buffer), {
      contentType: 'video/mp4',
      cacheControl: '31536000', // 1 year
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to store video: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(OUTPUT_BUCKET)
    .getPublicUrl(path);

  return publicUrl;
}

/**
 * Download a thumbnail and store it in Supabase Storage.
 */
export async function downloadAndStoreThumbnail(
  renderId: string,
  sourceUrl: string,
  userId: string
): Promise<string> {
  const response = await fetchWithTimeout(sourceUrl, 30_000);
  if (!response.ok) throw new Error(`Failed to download thumbnail: HTTP ${response.status}`);

  const buffer = await response.arrayBuffer();
  const path = `${userId}/${renderId}-thumb.jpg`;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(OUTPUT_BUCKET)
    .upload(path, Buffer.from(buffer), {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: true,
    });

  if (error) throw new Error(`Failed to store thumbnail: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from(OUTPUT_BUCKET)
    .getPublicUrl(path);

  return publicUrl;
}

/**
 * Delete stored output files for a video.
 */
export async function deleteStoredVideo(renderId: string, userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const paths = [
    `${userId}/${renderId}.mp4`,
    `${userId}/${renderId}-thumb.jpg`,
  ];

  await supabase.storage.from(OUTPUT_BUCKET).remove(paths);
  // Not throwing — deletion is best-effort on cleanup
}

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const SESSION_TOKEN_REGEX = /^[a-zA-Z0-9_-]{8,128}$/;

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const sessionToken = formData.get('sessionToken') as string | null;

  if (!file || !sessionToken) {
    return NextResponse.json({ error: 'file and sessionToken are required' }, { status: 400 });
  }
  if (!SESSION_TOKEN_REGEX.test(sessionToken)) {
    return NextResponse.json({ error: 'Invalid session token' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, and WEBP images are allowed' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Enforce max 15 photos per session
  const { data: existingFiles } = await admin.storage
    .from('listing-images')
    .list(`tunnel/${sessionToken}`);

  if ((existingFiles?.length ?? 0) >= 15) {
    return NextResponse.json({ error: 'Max 15 photos per session' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const bytes  = new Uint8Array(buffer);

  // Verify actual file content matches claimed MIME type
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng  = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
              && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  const mimeMatchesMagic =
    (file.type === 'image/jpeg' && isJpeg) ||
    (file.type === 'image/png'  && isPng)  ||
    (file.type === 'image/webp' && isWebp);

  if (!mimeMatchesMagic) {
    return NextResponse.json({ error: 'File content does not match declared type' }, { status: 400 });
  }

  const ext = isPng ? 'png' : isWebp ? 'webp' : 'jpg';
  const randomBytes = crypto.getRandomValues(new Uint8Array(12));
  const randomHex = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const filename = `${Date.now()}-${randomHex}.${ext}`;
  const storagePath = `tunnel/${sessionToken}/${filename}`;

  const { error: uploadError } = await admin.storage
    .from('listing-images')
    .upload(storagePath, Buffer.from(buffer), {
      contentType: file.type,
      cacheControl: '3600',
    });

  if (uploadError) {
    console.error('Tunnel upload error:', uploadError.message, uploadError);
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: publicUrlData } = admin.storage
    .from('listing-images')
    .getPublicUrl(storagePath);

  if (!publicUrlData?.publicUrl) {
    return NextResponse.json({ error: 'Failed to generate public URL' }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrlData.publicUrl });
}

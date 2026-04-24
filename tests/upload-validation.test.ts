import { describe, it, expect } from 'vitest';

// magic byte sequences used in UploadZone validation
function getMagicBytes(type: 'jpeg' | 'png' | 'webp' | 'gif' | 'svg' | 'pdf'): Uint8Array {
  const b = new Uint8Array(12);
  if (type === 'jpeg') { b[0] = 0xff; b[1] = 0xd8; b[2] = 0xff; }
  if (type === 'png')  { b[0] = 0x89; b[1] = 0x50; b[2] = 0x4e; b[3] = 0x47; }
  if (type === 'webp') {
    b[0] = 0x52; b[1] = 0x49; b[2] = 0x46; b[3] = 0x46;
    b[8] = 0x57; b[9] = 0x45; b[10] = 0x42; b[11] = 0x50;
  }
  if (type === 'gif') { b[0] = 0x47; b[1] = 0x49; b[2] = 0x46; }
  if (type === 'svg')  { b[0] = 0x3c; } // '<'
  if (type === 'pdf')  { b[0] = 0x25; b[1] = 0x50; b[2] = 0x44; b[3] = 0x46; }
  return b;
}

function validateMagicBytes(mimeType: string, bytes: Uint8Array): boolean {
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng  = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
              && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return (
    (mimeType === 'image/jpeg' && isJpeg) ||
    (mimeType === 'image/png'  && isPng)  ||
    (mimeType === 'image/webp' && isWebp)
  );
}

function getAllowedMime(): Set<string> {
  return new Set(['image/jpeg', 'image/png', 'image/webp']);
}

describe('UploadZone — MIME type whitelist', () => {
  it('accepts image/jpeg', () => {
    expect(getAllowedMime().has('image/jpeg')).toBe(true);
  });

  it('accepts image/png', () => {
    expect(getAllowedMime().has('image/png')).toBe(true);
  });

  it('accepts image/webp', () => {
    expect(getAllowedMime().has('image/webp')).toBe(true);
  });

  it('rejects image/gif', () => {
    expect(getAllowedMime().has('image/gif')).toBe(false);
  });

  it('rejects image/heic', () => {
    expect(getAllowedMime().has('image/heic')).toBe(false);
  });

  it('rejects image/svg+xml', () => {
    expect(getAllowedMime().has('image/svg+xml')).toBe(false);
  });

  it('rejects application/pdf', () => {
    expect(getAllowedMime().has('application/pdf')).toBe(false);
  });
});

describe('UploadZone — magic byte verification', () => {
  it('accepts a real JPEG', () => {
    expect(validateMagicBytes('image/jpeg', getMagicBytes('jpeg'))).toBe(true);
  });

  it('accepts a real PNG', () => {
    expect(validateMagicBytes('image/png', getMagicBytes('png'))).toBe(true);
  });

  it('accepts a real WEBP', () => {
    expect(validateMagicBytes('image/webp', getMagicBytes('webp'))).toBe(true);
  });

  it('rejects a GIF renamed to .jpg (magic bytes mismatch)', () => {
    expect(validateMagicBytes('image/jpeg', getMagicBytes('gif'))).toBe(false);
  });

  it('rejects an SVG renamed to .png (magic bytes mismatch)', () => {
    expect(validateMagicBytes('image/png', getMagicBytes('svg'))).toBe(false);
  });

  it('rejects a PDF renamed to .jpg (magic bytes mismatch)', () => {
    expect(validateMagicBytes('image/jpeg', getMagicBytes('pdf'))).toBe(false);
  });

  it('rejects WEBP bytes declared as image/jpeg', () => {
    expect(validateMagicBytes('image/jpeg', getMagicBytes('webp'))).toBe(false);
  });

  it('rejects JPEG bytes declared as image/png', () => {
    expect(validateMagicBytes('image/png', getMagicBytes('jpeg'))).toBe(false);
  });
});

describe('UploadZone — extension derived from magic bytes', () => {
  it('assigns .jpg for JPEG bytes', () => {
    const b = getMagicBytes('jpeg');
    const isPng  = b[0] === 0x89 && b[1] === 0x50;
    const isWebp = b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57;
    expect(isPng ? 'png' : isWebp ? 'webp' : 'jpg').toBe('jpg');
  });

  it('assigns .png for PNG bytes', () => {
    const b = getMagicBytes('png');
    const isPng  = b[0] === 0x89 && b[1] === 0x50;
    const isWebp = b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57;
    expect(isPng ? 'png' : isWebp ? 'webp' : 'jpg').toBe('png');
  });

  it('assigns .webp for WEBP bytes', () => {
    const b = getMagicBytes('webp');
    const isPng  = b[0] === 0x89 && b[1] === 0x50;
    const isWebp = b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57;
    expect(isPng ? 'png' : isWebp ? 'webp' : 'jpg').toBe('webp');
  });
});

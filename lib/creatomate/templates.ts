/**
 * Creatomate template registry for Reeltor.
 *
 * After uploading each JSON from /creatomate-templates/ to Creatomate,
 * paste the template UUIDs below (from the URL: /templates/{UUID}/edit).
 */

export const TEMPLATE_IDS = {
  CINEMATIC:     process.env.CREATOMATE_TEMPLATE_CINEMATIC      ?? '',
  LUXURY_REVEAL: process.env.CREATOMATE_TEMPLATE_LUXURY_REVEAL ?? '',
  MODERN_MINIMAL: process.env.CREATOMATE_TEMPLATE_MODERN_MINIMAL ?? '',
  TIKTOK_FAST:   process.env.CREATOMATE_TEMPLATE_TIKTOK_FAST   ?? '',
  LUXURY_MANSION: process.env.CREATOMATE_TEMPLATE_LUXURY_MANSION ?? '',
  STORY:         process.env.CREATOMATE_TEMPLATE_STORY         ?? '',
} as const;

export type TemplateStyle = keyof typeof TEMPLATE_IDS;

/** Short display names shown in the UI template picker */
export const TEMPLATE_NAMES: Record<TemplateStyle, string> = {
  CINEMATIC:      'Cinematic Montage',
  LUXURY_REVEAL:  'Luxury Reveal',
  MODERN_MINIMAL: 'Modern Minimal',
  TIKTOK_FAST:    'Fast Pace TikTok',
  LUXURY_MANSION: 'Luxury Mansion',
  STORY:          'Story: Before & After',
};

export const TEMPLATE_DESCRIPTIONS: Record<TemplateStyle, string> = {
  CINEMATIC:      '6 scenes · Ken Burns zoom · Gold branding · 30s',
  LUXURY_REVEAL:  'Logo intro · Room labels · Dramatic closing · 24s',
  MODERN_MINIMAL: 'Clean slides · Inter font · Yellow accent bar · 28s',
  TIKTOK_FAST:    'Viral hook · Captions · Circle wipe · 15s',
  LUXURY_MANSION: 'Address card · 6 rooms · Cinematic close · 35s',
  STORY:          'Hook → Before → After → Results · 22s',
};

export const TEMPLATE_BEST_FOR: Record<TemplateStyle, string> = {
  CINEMATIC:      'Luxury listings',
  LUXURY_REVEAL:  'High-end homes',
  MODERN_MINIMAL: 'Clean aesthetics',
  TIKTOK_FAST:    'Social media',
  LUXURY_MANSION: 'Estate properties',
  STORY:          'Before & after',
};

/** Flat array used by the template picker UI (first 3 shown in selector) */
export const TEMPLATES = (Object.keys(TEMPLATE_IDS) as TemplateStyle[]).slice(0, 3).map((key) => ({
  id:          TEMPLATE_IDS[key],
  name:        TEMPLATE_NAMES[key],
  description: TEMPLATE_DESCRIPTIONS[key],
  bestFor:     TEMPLATE_BEST_FOR[key],
}));

/** The base path in Supabase storage for each template's placeholder images */
export const TEMPLATE_PREVIEW_URLS: Record<TemplateStyle, string> = {
  CINEMATIC:      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=400',
  LUXURY_REVEAL:  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=400',
  MODERN_MINIMAL: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=400',
  TIKTOK_FAST:    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=400',
  LUXURY_MANSION: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=400',
  STORY:          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=400',
};

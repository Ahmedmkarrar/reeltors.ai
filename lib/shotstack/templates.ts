/**
 * Shotstack template registry for Reeltor.
 * Shotstack renders are timeline-based — these keys drive visual style
 * variations (effects, colour palettes) rather than pre-built template IDs.
 */

export const TEMPLATE_IDS = {
  CINEMATIC:      'CINEMATIC',
  LUXURY_REVEAL:  'LUXURY_REVEAL',
  MODERN_MINIMAL: 'MODERN_MINIMAL',
  TIKTOK_FAST:    'TIKTOK_FAST',
  LUXURY_MANSION: 'LUXURY_MANSION',
  STORY:          'STORY',
} as const;

export type TemplateStyle = keyof typeof TEMPLATE_IDS;

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

const SUPABASE_PREVIEW_BASE = 'https://vdlkzibfehioklgxgefq.supabase.co/storage/v1/object/public/template-previews';

export const TEMPLATE_PREVIEW_URLS: Record<TemplateStyle, string> = {
  CINEMATIC:      `${SUPABASE_PREVIEW_BASE}/previewCinm.mp4`,
  TIKTOK_FAST:    `${SUPABASE_PREVIEW_BASE}/previewTiktok.mp4`,
  MODERN_MINIMAL: `${SUPABASE_PREVIEW_BASE}/previewLuxary.mp4`,
  LUXURY_REVEAL:  '',
  LUXURY_MANSION: '',
  STORY:          '',
};

const ACTIVE_TEMPLATES: TemplateStyle[] = ['CINEMATIC', 'TIKTOK_FAST', 'MODERN_MINIMAL'];

export const TEMPLATES = ACTIVE_TEMPLATES.map((key) => ({
  id:          key,
  templateKey: TEMPLATE_IDS[key],
  name:        TEMPLATE_NAMES[key],
  description: TEMPLATE_DESCRIPTIONS[key],
  bestFor:     TEMPLATE_BEST_FOR[key],
}));

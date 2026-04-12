export type PlanKey = 'free' | 'starter' | 'growth' | 'pro' | 'team';

export type VideoStatus = 'pending' | 'processing' | 'complete' | 'failed';
export type VideoFormat = 'vertical' | 'square' | 'horizontal';
export type SubscriptionStatus = 'free' | 'active' | 'past_due' | 'canceled' | 'trialing';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  brand_name: string | null;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  plan: PlanKey;
  videos_used_this_month: number;
  videos_limit: number;
  billing_cycle_start: string;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  title: string;
  status: VideoStatus;
  render_id: string | null;
  template_id: string;
  listing_address: string | null;
  listing_price: string | null;
  agent_name: string | null;
  source_images: string[];
  output_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  format: VideoFormat;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  duration: number;
  bestFor: string;
}

export interface CreateVideoPayload {
  templateId: string;
  images: string[];
  /** Indices within `images` to route through fal.ai for AI drone-shot generation. Max 3. Defaults to [0]. */
  aiVideoIndices?: number[];
  listingAddress?: string;
  listingPrice?: string;
  agentName?: string;
  brandName?: string;
  email?: string;
  phone?: string;
  format?: VideoFormat;
  title?: string;
  /** Optional user-written description prepended to the fal.ai drone-shot prompt. */
  videoPrompt?: string;
  /** Optional background music URL (Artlist / Epidemic Sound / royalty-free).
   *  If provided, a dedicated audio track is added with a fadeOut at 15s. */
  audioUrl?: string;
  /** Optional agent/brand logo URL to overlay in the bottom-right corner. */
  logoUrl?: string;
}

export interface GenerateVideoResponse {
  videoId: string;
  renderId: string;
}

export interface RenderStatusResponse {
  status: string;
  outputUrl?: string;
  thumbnailUrl?: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

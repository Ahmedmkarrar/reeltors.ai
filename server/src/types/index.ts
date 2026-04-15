export interface VideoJobPayload {
  videoId: string;
  userId: string;
  images: string[];
  aiIndices: number[];
  templateId: string;
  listingAddress?: string;
  listingPrice?: string;
  agentName?: string;
  brandName?: string;
  email?: string;
  phone?: string;
  format: 'vertical' | 'horizontal' | 'square';
  audioUrl?: string;
  logoUrl?: string;
  videoPrompt?: string;
  isPaidPlan: boolean;
  isFree: boolean;
  clientIp?: string;
  fingerprintId?: string;
}

export interface JobStatusResponse {
  jobId:          string;
  state:          string;
  progress:       unknown;
  result?:        unknown;
  failedReason?:  string;
  timestamp:      number;
  processedOn?:   number;
  finishedOn?:    number;
}

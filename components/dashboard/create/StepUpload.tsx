import { UploadZone } from '@/components/dashboard/UploadZone';
import { ConcentricRings } from './ConcentricRings';
import type { VideoFormat } from '@/types';

interface StepUploadProps {
  userId: string;
  plan?: string;
  images: string[];
  aiVideoIndices: number[];
  videoPrompt: string;
  format: VideoFormat;
  onUploadComplete: (urls: string[]) => void;
  onAiIndicesChange: (indices: number[]) => void;
  onPromptChange: (prompt: string) => void;
  onFormatChange: (format: VideoFormat) => void;
  onNext: () => void;
}

export function StepUpload({
  userId,
  plan,
  images,
  aiVideoIndices,
  videoPrompt,
  format,
  onUploadComplete,
  onAiIndicesChange,
  onPromptChange,
  onFormatChange,
  onNext,
}: StepUploadProps) {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#F5F2EC' }}>
      <ConcentricRings sizes={[350, 550, 750, 950]} />
      <div className="relative p-6 md:p-10 max-w-3xl">
        <h1 className="font-syne font-bold text-4xl md:text-5xl text-[#1A1714] mb-2 tracking-tight">
          Upload Your Photos
        </h1>
        <p className="text-sm text-[#8A8682] mb-6">
          Add your best listing shots — we&apos;ll turn them into a cinematic property video.
        </p>
        <UploadZone
          userId={userId}
          plan={plan}
          onUploadComplete={onUploadComplete}
          aiVideoIndices={aiVideoIndices}
          onAiIndicesChange={onAiIndicesChange}
          videoPrompt={videoPrompt}
          onPromptChange={onPromptChange}
          format={format}
          onFormatChange={onFormatChange}
          onNext={onNext}
          nextDisabled={images.length < 3}
        />
      </div>
    </div>
  );
}

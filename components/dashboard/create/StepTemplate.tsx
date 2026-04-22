import { Button } from '@/components/ui/Button';
import { TemplateSelector } from '@/components/dashboard/TemplateSelector';
import { ConcentricRings } from './ConcentricRings';
import type { PlanKey } from '@/types';

interface StepTemplateProps {
  selectedTemplateKey: string;
  plan: PlanKey;
  isGenerating: boolean;
  onSelect: (key: string) => void;
  onBack: () => void;
  onGenerate: () => void;
}

export function StepTemplate({
  selectedTemplateKey,
  plan,
  isGenerating,
  onSelect,
  onBack,
  onGenerate,
}: StepTemplateProps) {
  return (
    <div className="relative flex flex-col min-h-screen w-full bg-[#F5F2EC] overflow-hidden px-8 py-12">
      <ConcentricRings sizes={[350, 550, 750, 950]} />

      <div className="relative w-full max-w-5xl mx-auto">
        <h1 className="font-syne font-bold text-5xl md:text-6xl text-[#1A1714] mb-10 tracking-tight">
          Choose a Template
        </h1>

        <TemplateSelector
          selected={selectedTemplateKey}
          onSelect={onSelect}
          plan={plan}
        />

        <div className="flex gap-3 mt-10">
          <Button variant="secondary" size="md" onClick={onBack}>← Back</Button>
          <Button variant="primary" size="lg" loading={isGenerating} onClick={onGenerate}>
            Generate Video →
          </Button>
        </div>
      </div>
    </div>
  );
}

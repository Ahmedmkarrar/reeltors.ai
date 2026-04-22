import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { ConcentricRings } from './ConcentricRings';

interface FieldConfig {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}

interface StepDetailsProps {
  listingAddress: string;
  listingPrice: string;
  agentName: string;
  logoPreview: string;
  isUploadingLogo: boolean;
  onAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAgentNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoUpload: (file: File) => void;
  onLogoRemove: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepDetails({
  listingAddress,
  listingPrice,
  agentName,
  logoPreview,
  isUploadingLogo,
  onAddressChange,
  onPriceChange,
  onAgentNameChange,
  onLogoUpload,
  onLogoRemove,
  onBack,
  onNext,
}: StepDetailsProps) {
  const fields: FieldConfig[] = [
    { label: 'Address',    value: listingAddress, onChange: onAddressChange,   placeholder: '123 Oak Street, Austin TX' },
    { label: 'Price',      value: listingPrice,   onChange: onPriceChange,     placeholder: '$1,250,000' },
    { label: 'Agent Name', value: agentName,      onChange: onAgentNameChange, placeholder: 'Sarah Johnson' },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[#F5F2EC] overflow-hidden px-8 py-12">
      <ConcentricRings sizes={[300, 450, 600, 750]} />

      <div className="relative w-full max-w-4xl">
        <h1 className="font-syne font-bold text-5xl md:text-6xl text-[#1A1714] mb-12 tracking-tight">
          Listing Details
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-0">
          <div className="flex flex-col gap-10">
            {fields.map(({ label, value, onChange, placeholder }) => (
              <div key={label}>
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#8C8680] mb-3">
                  {label} <span className="normal-case font-normal tracking-normal text-[#B8B4AE]">— optional</span>
                </p>
                <input
                  type="text"
                  value={value}
                  onChange={onChange}
                  placeholder={placeholder}
                  className="w-full bg-transparent text-lg text-[#1A1714] placeholder:text-[#C9C5BE] outline-none pb-3 transition-colors duration-200"
                  style={{ borderBottom: '1.5px solid #C9A84C' }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#F0B429'; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = '#C9A84C'; }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center mt-8 md:mt-0">
            <LogoUpload
              logoPreview={logoPreview}
              isUploadingLogo={isUploadingLogo}
              onLogoUpload={onLogoUpload}
              onLogoRemove={onLogoRemove}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-14">
          <Button variant="secondary" size="md" onClick={onBack}>← Back</Button>
          <Button variant="primary"   size="md" onClick={onNext}>Next →</Button>
        </div>
      </div>
    </div>
  );
}

interface LogoUploadProps {
  logoPreview: string;
  isUploadingLogo: boolean;
  onLogoUpload: (file: File) => void;
  onLogoRemove: () => void;
}

function LogoUpload({ logoPreview, isUploadingLogo, onLogoUpload, onLogoRemove }: LogoUploadProps) {
  const goldCircleStyle = {
    background: 'radial-gradient(circle at 35% 35%, #F5C842, #C9930A 50%, #96680A)',
    boxShadow: '0 8px 40px rgba(197,152,40,0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
  };

  if (logoPreview) {
    return (
      <div className="relative flex flex-col items-center gap-4">
        <div className="w-44 h-44 rounded-full flex items-center justify-center" style={goldCircleStyle}>
          {isUploadingLogo ? (
            <div className="w-16 h-16 rounded-full bg-white/20 animate-pulse" />
          ) : (
            <Image
              src={logoPreview}
              alt="Logo preview"
              width={80}
              height={80}
              unoptimized
              className="w-20 h-20 object-contain rounded-full"
            />
          )}
        </div>
        {!isUploadingLogo && (
          <button
            type="button"
            onClick={onLogoRemove}
            className="text-xs text-[#8C8680] hover:text-[#1A1714] transition-colors underline underline-offset-2"
          >
            Remove logo
          </button>
        )}
      </div>
    );
  }

  return (
    <label className="cursor-pointer group">
      <div
        className="w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 group-hover:scale-105"
        style={{ ...goldCircleStyle, boxShadow: '0 8px 40px rgba(197,152,40,0.35), inset 0 2px 4px rgba(255,255,255,0.25)' }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white/80">
          <path d="M12 5v10M7 10l5-5 5 5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 18h14" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
        </svg>
        <span className="text-xs font-semibold tracking-[0.1em] uppercase text-white/90">Upload Logo</span>
        <span className="text-[10px] text-white/60">optional</span>
      </div>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onLogoUpload(f); e.target.value = ''; }}
      />
    </label>
  );
}

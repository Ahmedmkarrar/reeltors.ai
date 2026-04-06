interface LogoIconProps {
  className?: string;
}

export function LogoIcon({ className = 'w-7 h-7' }: LogoIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* chimney */}
      <rect x="26" y="4" width="4" height="9" rx="1" fill="#F0B429" />
      {/* roof left */}
      <line x1="3" y1="20" x2="20" y2="9" stroke="#F0B429" strokeWidth="2.5" strokeLinecap="round" />
      {/* roof right */}
      <line x1="37" y1="20" x2="20" y2="9" stroke="#F0B429" strokeWidth="2.5" strokeLinecap="round" />
      {/* house body */}
      <rect x="7" y="17" width="26" height="20" rx="4" fill="#F0B429" />
      {/* play button */}
      <path d="M16 22 L16 32 L28 27 Z" fill="#1A1714" />
    </svg>
  );
}

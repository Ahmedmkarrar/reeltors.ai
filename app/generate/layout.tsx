import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Listing Video — Reeltors.ai',
  description: 'Turn your listing photos into a cinematic video in 60 seconds. Free. No account required.',
};

export default function TunnelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#0D0B08', minHeight: '100vh' }}>
      {children}
    </div>
  );
}

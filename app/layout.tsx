import type { Metadata } from 'next';
import { Syne, Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { PostHogProvider } from '@/components/providers/PostHogProvider';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Reeltors.ai — Turn Listing Photos into Viral Videos in 60 Seconds',
  description:
    'Stop losing listings to agents who post better content. Reeltors.ai turns your existing listing photos into cinematic Reels and TikToks — automatically.',
  keywords: 'real estate video, listing video, realtor marketing, instagram reels real estate, tiktok real estate',
  openGraph: {
    title: 'Reeltors.ai — Turn Listing Photos into Viral Videos in 60 Seconds',
    description:
      'Stop losing listings to agents who post better content. Reeltors.ai turns your existing listing photos into cinematic Reels and TikToks — automatically.',
    url: 'https://reeltors.ai',
    siteName: 'Reeltors.ai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reeltors.ai — Turn Listing Photos into Viral Videos in 60 Seconds',
    description: 'Turn your listing photos into viral TikToks and Reels in under 60 seconds.',
    creator: '@reeltorsai',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${inter.variable}`}>
      <body className="bg-[#080808] text-[#F0F0EB] font-inter antialiased">
        <PostHogProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#141414',
                color: '#F0F0EB',
                border: '1px solid #222222',
                borderRadius: '4px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#C8FF00', secondary: '#080808' } },
              error: { iconTheme: { primary: '#FF5500', secondary: '#080808' } },
            }}
          />
        </PostHogProvider>
      </body>
    </html>
  );
}

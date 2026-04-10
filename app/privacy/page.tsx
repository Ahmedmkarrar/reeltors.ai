import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Reeltors.ai',
};

const EFFECTIVE_DATE = 'April 4, 2025';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-[#8A8682] hover:text-[#1A1714] transition-colors mb-8 inline-block">
          ← Back to Reeltors.ai
        </Link>

        <h1 className="font-syne font-extrabold text-4xl text-[#1A1714] mb-2">Privacy Policy</h1>
        <p className="text-[#8A8682] text-sm mb-12">Effective date: {EFFECTIVE_DATE}</p>

        <div className="prose prose-sm max-w-none text-[#3D3A36] space-y-8">

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">1. Who we are</h2>
            <p>Reeltors.ai (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a video generation service for real estate professionals. We are operated by the Reeltors.ai team. Questions? Email us at <a href="mailto:hello@reeltors.ai" className="text-[#F0B429] underline">hello@reeltors.ai</a>.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">2. Information we collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account data:</strong> name, email address, and password (hashed) when you sign up.</li>
              <li><strong>Listing content:</strong> photos and text (address, price, agent name) you upload to generate videos.</li>
              <li><strong>Payment data:</strong> billing information handled directly by Stripe. We never store your card details.</li>
              <li><strong>Usage data:</strong> pages visited, features used, and error logs to help us improve the product.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">3. How we use your information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide, operate, and improve Reeltors.ai.</li>
              <li>To process payments and manage your subscription.</li>
              <li>To send transactional emails (receipts, video ready notifications).</li>
              <li>To detect and prevent fraud or abuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">4. Sharing your information</h2>
            <p>We do not sell your personal data. We share information only with trusted service providers who process it on our behalf:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Supabase</strong> — database and file storage</li>
              <li><strong>Stripe</strong> — payment processing</li>
              <li><strong>Creatomate</strong> — video rendering</li>
              <li><strong>fal.ai</strong> — AI video generation</li>
              <li><strong>Resend</strong> — transactional email</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">5. Data retention</h2>
            <p>We retain your account data for as long as your account is active. Generated videos are stored in our system and remain accessible in your dashboard. You may delete your videos at any time. To delete your account and all associated data, contact us at <a href="mailto:hello@reeltors.ai" className="text-[#F0B429] underline">hello@reeltors.ai</a>.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">6. Cookies</h2>
            <p>We use essential cookies for authentication (session tokens) and analytics cookies (PostHog) to understand how the product is used. You can disable analytics cookies in your browser settings.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">7. Your rights</h2>
            <p>Depending on your location, you may have the right to access, correct, or delete your personal data. To exercise these rights, email us at <a href="mailto:hello@reeltors.ai" className="text-[#F0B429] underline">hello@reeltors.ai</a>.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">8. Security</h2>
            <p>We use industry-standard security measures including encrypted connections (HTTPS), hashed passwords, and access controls. No system is 100% secure — please use a strong, unique password.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">9. Changes to this policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notice. Continued use of Reeltors.ai after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">10. Contact</h2>
            <p>Questions about this policy? Contact us at <a href="mailto:hello@reeltors.ai" className="text-[#F0B429] underline">hello@reeltors.ai</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

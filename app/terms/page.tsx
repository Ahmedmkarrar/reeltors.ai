import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — REELtor.ai',
};

const EFFECTIVE_DATE = 'April 4, 2025';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-[#8A8682] hover:text-[#1A1714] transition-colors mb-8 inline-block">
          ← Back to REELtor.ai
        </Link>

        <h1 className="font-syne font-extrabold text-4xl text-[#1A1714] mb-2">Terms of Service</h1>
        <p className="text-[#8A8682] text-sm mb-12">Effective date: {EFFECTIVE_DATE}</p>

        <div className="prose prose-sm max-w-none text-[#3D3A36] space-y-8">

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">1. Acceptance of terms</h2>
            <p>By creating an account or using REELtor.ai, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">2. Description of service</h2>
            <p>REELtor.ai is a subscription-based platform that allows real estate professionals to generate listing videos from photos using AI. Features and pricing are subject to change with reasonable notice.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">3. Your account</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must be at least 18 years old to use REELtor.ai.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must provide accurate account information.</li>
              <li>One account per person — do not share accounts.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">4. Subscriptions and billing</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Paid plans are billed monthly or annually in advance.</li>
              <li>Subscriptions renew automatically until cancelled.</li>
              <li>You can cancel at any time — access continues until the end of the billing period.</li>
              <li>We do not offer refunds for partial months or unused video credits, except where required by law.</li>
              <li>Prices may change with 30 days&rsquo; notice to existing subscribers.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">5. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Upload content you do not have rights to use.</li>
              <li>Generate videos containing illegal, defamatory, or misleading content.</li>
              <li>Attempt to reverse engineer, scrape, or abuse the platform.</li>
              <li>Resell or sublicense access to REELtor.ai without written consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">6. Your content</h2>
            <p>You retain ownership of all photos and content you upload. By using REELtor.ai, you grant us a limited license to process your content solely for the purpose of generating your videos. We do not use your listing content to train AI models.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">7. Generated videos</h2>
            <p>Videos generated through REELtor.ai are yours to use for lawful real estate marketing purposes. You are responsible for ensuring the content complies with MLS rules, fair housing laws, and any applicable advertising regulations in your jurisdiction.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">8. Intellectual property</h2>
            <p>REELtor.ai and its original content, features, and functionality are owned by us and protected by applicable intellectual property laws. Our name, logo, and product are our trademarks.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">9. Disclaimer of warranties</h2>
            <p>REELtor.ai is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee uninterrupted service, specific video output quality, or that the service will meet every use case.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">10. Limitation of liability</h2>
            <p>To the maximum extent permitted by law, REELtor.ai shall not be liable for indirect, incidental, or consequential damages. Our total liability to you for any claim shall not exceed the amount you paid us in the three months preceding the claim.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">11. Termination</h2>
            <p>We reserve the right to suspend or terminate your account for violations of these terms. You may close your account at any time by contacting <a href="mailto:hello@reeltor.ai" className="text-[#F0B429] underline">hello@reeltor.ai</a>.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">12. Governing law</h2>
            <p>These terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">13. Changes to terms</h2>
            <p>We may update these terms from time to time. We will notify you of material changes via email. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-xl text-[#1A1714] mb-3">14. Contact</h2>
            <p>Questions? Email us at <a href="mailto:hello@reeltor.ai" className="text-[#F0B429] underline">hello@reeltor.ai</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = () => process.env.RESEND_FROM_EMAIL || 'support@reeltors.ai';
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'https://reeltors.ai';

const baseStyle = `
  background:#0D0B08;
  color:#FAFAF8;
  font-family:Inter,-apple-system,sans-serif;
  padding:40px 20px;
  margin:0;
`;

const logoHtml = `
  <div style="margin-bottom:32px;">
    <span style="font-size:22px;font-weight:900;color:#FAFAF8;letter-spacing:-0.5px;">
      Reeltor<span style="color:#F0B429;">.</span>ai
    </span>
  </div>
`;

const footerHtml = `
  <div style="border-top:1px solid #2E2B27;margin-top:48px;padding-top:24px;">
    <p style="color:#4A4744;font-size:12px;margin:0;">
      © 2026 Reeltor.ai · Built for real estate agents who want more leads<br/>
      <a href="${APP_URL()}/unsubscribe" style="color:#6B6760;">Unsubscribe</a>
    </p>
  </div>
`;

export async function sendWelcomeEmail(email: string, name: string) {
  return getResend().emails.send({
    from: FROM(),
    to: email,
    subject: 'Welcome to Reeltor.ai — your first video is waiting',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="${baseStyle}">
        <div style="max-width:560px;margin:0 auto;">
          ${logoHtml}

          <h2 style="font-size:26px;font-weight:800;color:#FAFAF8;margin-bottom:12px;line-height:1.2;">
            Welcome, ${name}.<br/>
            <span style="color:#F0B429;">Your first video takes 60 seconds.</span>
          </h2>

          <p style="color:#8A8682;line-height:1.8;margin-bottom:28px;font-size:15px;">
            No filming. No editing. No agency. Upload your listing photos, enter the address and price, and we handle everything else.
          </p>

          <div style="background:#1A1714;border:1px solid #2E2B27;border-radius:10px;padding:24px;margin-bottom:28px;">
            <p style="color:#F0B429;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 16px 0;">How it works</p>
            ${['Upload your listing photos (MLS downloads, iPhone photos — anything)', 'Enter the address, price, and your name — 3 fields total', 'Download your cinematic video. Post to TikTok, Reels, YouTube.'].map((step, i) => `
              <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start;">
                <span style="background:#F0B429;color:#0D0B08;font-size:10px;font-weight:900;border-radius:50%;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${i + 1}</span>
                <span style="color:#C8C4BC;font-size:14px;line-height:1.6;">${step}</span>
              </div>
            `).join('')}
          </div>

          <a href="${APP_URL()}/create" style="display:inline-block;background:#F0B429;color:#0D0B08;font-weight:800;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:15px;letter-spacing:-0.2px;">
            Create My First Video →
          </a>

          <p style="color:#4A4744;font-size:12px;margin-top:16px;">30-day money-back guarantee · Cancel anytime</p>

          ${footerHtml}
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendFirstVideoEmail(email: string, name: string, videoUrl: string) {
  return getResend().emails.send({
    from: FROM(),
    to: email,
    subject: 'Your listing video is ready to post',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="${baseStyle}">
        <div style="max-width:560px;margin:0 auto;">
          ${logoHtml}

          <div style="background:#F0B429;display:inline-block;border-radius:4px;padding:4px 12px;margin-bottom:20px;">
            <span style="color:#0D0B08;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Video Ready</span>
          </div>

          <h2 style="font-size:26px;font-weight:800;color:#FAFAF8;margin-bottom:12px;line-height:1.2;">
            ${name}, your video is ready.
          </h2>

          <p style="color:#8A8682;line-height:1.8;margin-bottom:28px;font-size:15px;">
            Your cinematic listing video has been rendered. Download it below and post to TikTok, Instagram Reels, and YouTube Shorts.
          </p>

          <div style="background:#1A1714;border:1px solid #2E2B27;border-radius:10px;padding:20px;margin-bottom:28px;">
            ${[
              { icon: '📱', label: 'TikTok & Reels', note: 'Vertical 9:16 format' },
              { icon: '▪', label: 'Instagram Feed', note: 'Square 1:1 format' },
              { icon: '🖥', label: 'YouTube & Facebook', note: 'Horizontal 16:9 format' },
            ].map(({ label, note }) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #1E1C18;">
                <span style="color:#C8C4BC;font-size:13px;">${label}</span>
                <span style="color:#4A4744;font-size:11px;">${note}</span>
              </div>
            `).join('')}
          </div>

          <a href="${videoUrl}" style="display:inline-block;background:#F0B429;color:#0D0B08;font-weight:800;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:15px;">
            Download Your Video →
          </a>

          ${footerHtml}
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendUpgradeNudgeEmail(email: string, name: string) {
  return getResend().emails.send({
    from: FROM(),
    to: email,
    subject: "You've used your free video — upgrade to keep going",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="${baseStyle}">
        <div style="max-width:560px;margin:0 auto;">
          ${logoHtml}

          <h2 style="font-size:26px;font-weight:800;color:#FAFAF8;margin-bottom:12px;line-height:1.2;">
            You've hit your free limit, ${name}.
          </h2>

          <p style="color:#8A8682;line-height:1.8;margin-bottom:24px;font-size:15px;">
            You've created your free video. Upgrade to Starter to keep posting every listing — it pays for itself with one extra showing.
          </p>

          <div style="background:#1A1714;border:1px solid #F0B429;border-radius:10px;padding:24px;margin-bottom:28px;">
            <p style="color:#F0B429;font-size:13px;font-weight:700;margin:0 0 8px 0;">Starter Plan — $49/month</p>
            <p style="color:#8A8682;font-size:13px;margin:0;">20 videos/month · All templates · TikTok + Reels + YouTube</p>
            <p style="color:#4A4744;font-size:12px;margin-top:8px;">= $1.63/day. Less than a coffee.</p>
          </div>

          <a href="${APP_URL()}/dashboard" style="display:inline-block;background:#F0B429;color:#0D0B08;font-weight:800;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:15px;">
            Upgrade Now — From $49/month →
          </a>

          <p style="color:#4A4744;font-size:12px;margin-top:16px;">30-day money-back guarantee · Cancel anytime</p>

          ${footerHtml}
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendPaymentFailedEmail(email: string, name: string) {
  return getResend().emails.send({
    from: FROM(),
    to: email,
    subject: 'Action needed — update your payment method',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="${baseStyle}">
        <div style="max-width:560px;margin:0 auto;">
          ${logoHtml}

          <div style="background:#CC3D00;display:inline-block;border-radius:4px;padding:4px 12px;margin-bottom:20px;">
            <span style="color:#fff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Payment Failed</span>
          </div>

          <h2 style="font-size:26px;font-weight:800;color:#FAFAF8;margin-bottom:12px;line-height:1.2;">
            We couldn't process your payment, ${name}.
          </h2>

          <p style="color:#8A8682;line-height:1.8;margin-bottom:28px;font-size:15px;">
            Your Reeltor.ai subscription couldn't be renewed. Update your payment method to keep creating listing videos without interruption.
          </p>

          <a href="${APP_URL()}/account" style="display:inline-block;background:#CC3D00;color:#fff;font-weight:800;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:15px;">
            Update Payment Method →
          </a>

          ${footerHtml}
        </div>
      </body>
      </html>
    `,
  });
}

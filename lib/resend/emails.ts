import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = () => process.env.RESEND_FROM_EMAIL || 'hello@reeltor.ai';
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'https://reeltor.ai';

export async function sendWelcomeEmail(email: string, name: string) {
  return getResend().emails.send({
    from: FROM(),
    to: email,
    subject: 'Your Reeltor.ai account is ready',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="${baseStyle}">
        <div style="max-width:560px;margin:0 auto;">
          <h1 style="font-size:28px;font-weight:800;color:#C8FF00;margin-bottom:8px;">Reeltor.ai</h1>
          <p style="color:#888;margin-bottom:32px;font-size:14px;">Turn listing photos into viral videos</p>
          <h2 style="font-size:22px;font-weight:700;margin-bottom:16px;">Welcome, ${name}! 🎬</h2>
          <p style="color:#aaa;line-height:1.7;margin-bottom:24px;">
            Your account is ready. Create your first listing video in under 60 seconds — no editing skills required.
          </p>
          <ol style="color:#aaa;line-height:1.8;padding-left:20px;margin-bottom:32px;">
            <li>Upload 3–15 listing photos</li>
            <li>Enter the address and price</li>
            <li>Pick a template and hit Generate</li>
          </ol>
          <a href="${APP_URL()}/create" style="display:inline-block;background:#C8FF00;color:#080808;font-weight:700;padding:14px 28px;border-radius:4px;text-decoration:none;font-size:15px;">Create Your First Video →</a>
          <p style="color:#444;font-size:12px;margin-top:48px;">© 2026 Reeltor.ai · Built for real estate agents who want more leads</p>
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
          <h1 style="font-size:28px;font-weight:800;color:#C8FF00;margin-bottom:8px;">Reeltor.ai</h1>
          <h2 style="font-size:22px;font-weight:700;margin-bottom:16px;">Your video is ready, ${name}!</h2>
          <p style="color:#aaa;line-height:1.7;margin-bottom:24px;">Your listing video has been rendered and is ready to download and post.</p>
          <ul style="color:#aaa;line-height:1.8;padding-left:20px;margin-bottom:32px;">
            <li>TikTok (vertical format)</li>
            <li>Instagram Reels (vertical format)</li>
            <li>YouTube Shorts (vertical format)</li>
            <li>Your MLS listing page</li>
          </ul>
          <a href="${videoUrl}" style="display:inline-block;background:#C8FF00;color:#080808;font-weight:700;padding:14px 28px;border-radius:4px;text-decoration:none;font-size:15px;">Download Your Video →</a>
          <p style="color:#444;font-size:12px;margin-top:48px;">© 2026 Reeltor.ai</p>
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
          <h1 style="font-size:28px;font-weight:800;color:#C8FF00;margin-bottom:8px;">Reeltor.ai</h1>
          <h2 style="font-size:22px;font-weight:700;margin-bottom:16px;">You've hit your free limit, ${name}</h2>
          <p style="color:#aaa;line-height:1.7;margin-bottom:24px;">Upgrade to Pro to create unlimited videos and access all templates.</p>
          <a href="${APP_URL()}/dashboard?upgrade=1" style="display:inline-block;background:#C8FF00;color:#080808;font-weight:700;padding:14px 28px;border-radius:4px;text-decoration:none;font-size:15px;">Upgrade to Pro — $47/month →</a>
          <p style="color:#444;font-size:12px;margin-top:48px;">© 2026 Reeltor.ai</p>
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
          <h1 style="font-size:28px;font-weight:800;color:#C8FF00;margin-bottom:8px;">Reeltor.ai</h1>
          <h2 style="font-size:22px;font-weight:700;margin-bottom:16px;">Payment failed, ${name}</h2>
          <p style="color:#aaa;line-height:1.7;margin-bottom:24px;">We couldn't process your payment. Please update your payment method to keep your Pro features.</p>
          <a href="${APP_URL()}/account" style="display:inline-block;background:#FF5500;color:#fff;font-weight:700;padding:14px 28px;border-radius:4px;text-decoration:none;font-size:15px;">Update Payment Method →</a>
          <p style="color:#444;font-size:12px;margin-top:48px;">© 2026 Reeltor.ai</p>
        </div>
      </body>
      </html>
    `,
  });
}

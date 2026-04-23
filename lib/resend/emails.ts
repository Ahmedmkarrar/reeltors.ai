import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = () => `ReeltorsAI <${process.env.RESEND_FROM_EMAIL || 'support@reeltors.ai'}>`;
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'https://reeltors.ai';
const baseStyle = 'background:#0D0B08;color:#F0F0EB;font-family:Inter,sans-serif;padding:40px 20px;margin:0;';

export async function sendWelcomeEmail(email: string, name: string) {
  return getResend().emails.send({
    from: FROM(),
    to: email,
    subject: 'Your Reeltors.ai account is ready',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="${baseStyle}">
        <div style="max-width:560px;margin:0 auto;">
          <h1 style="font-size:28px;font-weight:800;color:#F0B429;margin-bottom:8px;">Reeltors.ai</h1>
          <p style="color:#6B6760;margin-bottom:32px;font-size:14px;">Turn listing photos into viral videos</p>
          <h2 style="font-size:22px;font-weight:700;margin-bottom:16px;">Welcome, ${name}.</h2>
          <p style="color:#8A8682;line-height:1.7;margin-bottom:24px;">
            Your account is ready. Create your first listing video in under 60 seconds — no editing skills required.
          </p>
          <ol style="color:#8A8682;line-height:1.8;padding-left:20px;margin-bottom:32px;">
            <li>Upload 3–15 listing photos</li>
            <li>Enter the address and price</li>
            <li>Pick a template and hit Generate</li>
          </ol>
          <a href="${APP_URL()}/create" style="display:inline-block;background:#F0B429;color:#0D0B08;font-weight:700;padding:14px 28px;border-radius:4px;text-decoration:none;font-size:15px;">Create Your First Video →</a>
          <p style="color:#2E2B27;font-size:12px;margin-top:48px;">© 2026 Reeltors.ai · Built for real estate agents who want more leads</p>
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
          <h1 style="font-size:28px;font-weight:800;color:#F0B429;margin-bottom:8px;">Reeltors.ai</h1>
          <h2 style="font-size:22px;font-weight:700;margin-bottom:16px;">Your video is ready, ${name}.</h2>
          <p style="color:#8A8682;line-height:1.7;margin-bottom:24px;">Your listing video has been rendered and is ready to download and post.</p>
          <ul style="color:#8A8682;line-height:1.8;padding-left:20px;margin-bottom:32px;">
            <li>TikTok (vertical format)</li>
            <li>Instagram Reels (vertical format)</li>
            <li>YouTube Shorts (vertical format)</li>
            <li>Your MLS listing page</li>
          </ul>
          <a href="${videoUrl}" style="display:inline-block;background:#F0B429;color:#0D0B08;font-weight:700;padding:14px 28px;border-radius:4px;text-decoration:none;font-size:15px;">Download Your Video →</a>
          <p style="color:#2E2B27;font-size:12px;margin-top:48px;">© 2026 Reeltors.ai</p>
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
    subject: "You've reached your video limit — upgrade to keep going",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="${baseStyle}">
        <div style="max-width:560px;margin:0 auto;">
          <h1 style="font-size:28px;font-weight:800;color:#F0B429;margin-bottom:8px;">Reeltors.ai</h1>
          <h2 style="font-size:22px;font-weight:700;margin-bottom:16px;">You've hit your monthly limit, ${name}.</h2>
          <p style="color:#8A8682;line-height:1.7;margin-bottom:24px;">Upgrade to Pro to create unlimited videos and access all templates.</p>
          <a href="${APP_URL()}/dashboard?upgrade=1" style="display:inline-block;background:#F0B429;color:#0D0B08;font-weight:700;padding:14px 28px;border-radius:4px;text-decoration:none;font-size:15px;">Upgrade to Pro — $49/month →</a>
          <p style="color:#2E2B27;font-size:12px;margin-top:48px;">© 2026 Reeltors.ai</p>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendFeedbackEmail({
  fromName,
  fromEmail,
  category,
  message,
}: {
  fromName: string;
  fromEmail: string;
  category: string;
  message: string;
}) {
  return getResend().emails.send({
    from: FROM(),
    to: 'support@reeltors.ai',
    replyTo: fromEmail,
    subject: `[${category}] Feedback from ${fromName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="${baseStyle}">
        <div style="max-width:560px;margin:0 auto;">
          <h1 style="font-size:28px;font-weight:800;color:#F0B429;margin-bottom:8px;">Reeltors.ai</h1>
          <p style="color:#6B6760;margin-bottom:32px;font-size:14px;">User Feedback</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr><td style="padding:8px 0;color:#8A8682;font-size:13px;width:100px;">From</td><td style="padding:8px 0;color:#F0F0EB;font-size:13px;">${fromName} &lt;${fromEmail}&gt;</td></tr>
            <tr><td style="padding:8px 0;color:#8A8682;font-size:13px;">Category</td><td style="padding:8px 0;color:#F0B429;font-size:13px;font-weight:700;">${category}</td></tr>
          </table>
          <div style="background:#1A1714;border-radius:8px;padding:20px;margin-bottom:32px;">
            <p style="color:#F0F0EB;font-size:15px;line-height:1.7;margin:0;">${message.replace(/\n/g, '<br/>')}</p>
          </div>
          <p style="color:#2E2B27;font-size:12px;margin-top:48px;">© 2026 Reeltors.ai</p>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendOtpEmail(email: string, otp: string) {
  return getResend().emails.send({
    from: FROM(),
    to: email,
    subject: `${otp} is your Reeltors.ai verification code`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="${baseStyle}">
        <div style="max-width:560px;margin:0 auto;">
          <h1 style="font-size:28px;font-weight:800;color:#F0B429;margin-bottom:8px;">Reeltors.ai</h1>
          <p style="color:#6B6760;margin-bottom:32px;font-size:14px;">Email verification</p>
          <h2 style="font-size:22px;font-weight:700;margin-bottom:16px;">Your verification code</h2>
          <p style="color:#8A8682;line-height:1.7;margin-bottom:24px;">
            Enter this code to verify your email and generate your video. It expires in 10 minutes.
          </p>
          <div style="background:#1A1714;border-radius:8px;padding:24px;text-align:center;margin-bottom:32px;">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#F0B429;">${otp}</span>
          </div>
          <p style="color:#4A4642;font-size:13px;line-height:1.6;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <p style="color:#2E2B27;font-size:12px;margin-top:48px;">© 2026 Reeltors.ai</p>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendUpgradeSuccessEmail(email: string, name: string, plan: string) {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  return getResend().emails.send({
    from: FROM(),
    to: email,
    subject: `Welcome to ${planLabel} — your plan is active`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="${baseStyle}">
        <div style="max-width:560px;margin:0 auto;">
          <h1 style="font-size:28px;font-weight:800;color:#F0B429;margin-bottom:8px;">Reeltors.ai</h1>
          <h2 style="font-size:22px;font-weight:700;margin-bottom:16px;">You're on ${planLabel}, ${name}.</h2>
          <p style="color:#8A8682;line-height:1.7;margin-bottom:24px;">
            Your payment was successful and your ${planLabel} plan is now active. You can start creating videos right away.
          </p>
          <a href="${APP_URL()}/create" style="display:inline-block;background:#F0B429;color:#0D0B08;font-weight:700;padding:14px 28px;border-radius:4px;text-decoration:none;font-size:15px;">Create a Video →</a>
          <p style="color:#8A8682;font-size:13px;margin-top:32px;line-height:1.6;">
            Need help or have questions? Reply to this email — we're here.
          </p>
          <p style="color:#2E2B27;font-size:12px;margin-top:48px;">© 2026 Reeltors.ai</p>
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
          <h1 style="font-size:28px;font-weight:800;color:#F0B429;margin-bottom:8px;">Reeltors.ai</h1>
          <h2 style="font-size:22px;font-weight:700;margin-bottom:16px;">Payment failed, ${name}.</h2>
          <p style="color:#8A8682;line-height:1.7;margin-bottom:24px;">We couldn't process your payment. Please update your payment method to keep your Pro features.</p>
          <a href="${APP_URL()}/account" style="display:inline-block;background:#FF5500;color:#fff;font-weight:700;padding:14px 28px;border-radius:4px;text-decoration:none;font-size:15px;">Update Payment Method →</a>
          <p style="color:#2E2B27;font-size:12px;margin-top:48px;">© 2026 Reeltors.ai</p>
        </div>
      </body>
      </html>
    `,
  });
}

import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = () => process.env.RESEND_FROM_EMAIL || 'support@reeltors.ai';
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'https://reeltors.ai';

const baseStyle = 'background:#0D0B08;color:#F0F0EB;font-family:Inter,sans-serif;padding:40px 20px;margin:0;';

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function signupUrl(email: string): string {
  return `${APP_URL()}/signup?email=${encodeURIComponent(email)}&ref=tunnel`;
}

function upgradeUrl(): string {
  return `${APP_URL()}/signup?ref=tunnel&upgrade=1`;
}

export async function sendTunnelVideoReady(email: string, videoUrl: string) {
  return getResend().emails.send({
    from: FROM(),
    to: email,
    subject: 'Your free listing video is ready 🎬',
    html: `
      <!DOCTYPE html><html><body style="${baseStyle}">
      <div style="max-width:560px;margin:0 auto;">
        <h1 style="font-size:28px;font-weight:800;color:#F0B429;margin-bottom:4px;">Reeltor.ai</h1>
        <p style="color:#6B6760;font-size:13px;margin-bottom:36px;">Turn listing photos into cinematic videos</p>
        <h2 style="font-size:24px;font-weight:700;margin-bottom:12px;">Your video is ready.</h2>
        <p style="color:#8A8682;line-height:1.7;margin-bottom:28px;">
          Your free listing video has finished rendering. Download it and post it today — listings with video get 403% more inquiries.
        </p>
        <a href="${videoUrl}" style="display:inline-block;background:#F0B429;color:#0D0B08;font-weight:700;padding:15px 32px;border-radius:6px;text-decoration:none;font-size:16px;margin-bottom:32px;">Download Your Video →</a>
        <p style="color:#4A4642;font-size:13px;line-height:1.6;">
          Want to create more? <a href="${upgradeUrl()}" style="color:#F0B429;text-decoration:none;">Get 20 videos/month for $49 →</a>
        </p>
        <p style="color:#2E2B27;font-size:11px;margin-top:48px;">© 2026 Reeltor.ai · <a href="${APP_URL()}/unsubscribe?email=${encodeURIComponent(email)}" style="color:#2E2B27;">Unsubscribe</a></p>
      </div>
      </body></html>
    `,
  });
}

export async function sendTunnelDay1(email: string, videoUrl: string) {
  return getResend().emails.send({
    from: FROM(),
    to: email,
    subject: 'Where to post your listing video (and when)',
    scheduledAt: daysFromNow(1),
    html: `
      <!DOCTYPE html><html><body style="${baseStyle}">
      <div style="max-width:560px;margin:0 auto;">
        <h1 style="font-size:28px;font-weight:800;color:#F0B429;margin-bottom:4px;">Reeltor.ai</h1>
        <p style="color:#6B6760;font-size:13px;margin-bottom:36px;">Pro tip #1</p>
        <h2 style="font-size:22px;font-weight:700;margin-bottom:12px;">Post at 7am or 6pm for 3x the reach.</h2>
        <p style="color:#8A8682;line-height:1.7;margin-bottom:20px;">
          Agents who post their listing videos between 6–8am or 5–7pm get significantly more views. Here's the exact order to post:
        </p>
        <ol style="color:#8A8682;line-height:2.0;padding-left:20px;margin-bottom:28px;">
          <li>Instagram Reels (largest realtor audience)</li>
          <li>TikTok (fastest organic growth)</li>
          <li>Facebook (best for older buyer demographics)</li>
          <li>Your listing description (link the video)</li>
        </ol>
        <a href="${videoUrl}" style="display:inline-block;background:#1A1714;color:#F0B429;font-weight:700;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;border:1px solid #F0B429;margin-bottom:32px;">Re-download Your Video →</a>
        <p style="color:#4A4642;font-size:13px;line-height:1.6;">
          Creating a new listing soon? <a href="${upgradeUrl()}" style="color:#F0B429;text-decoration:none;">Get 20 videos/month for $49 →</a>
        </p>
        <p style="color:#2E2B27;font-size:11px;margin-top:48px;">© 2026 Reeltor.ai · <a href="${APP_URL()}/unsubscribe?email=${encodeURIComponent(email)}" style="color:#2E2B27;">Unsubscribe</a></p>
      </div>
      </body></html>
    `,
  });
}

export async function sendTunnelDay3(email: string) {
  return getResend().emails.send({
    from: FROM(),
    to: email,
    subject: 'How Sarah closed 3 listings in one month with video',
    scheduledAt: daysFromNow(3),
    html: `
      <!DOCTYPE html><html><body style="${baseStyle}">
      <div style="max-width:560px;margin:0 auto;">
        <h1 style="font-size:28px;font-weight:800;color:#F0B429;margin-bottom:4px;">Reeltor.ai</h1>
        <p style="color:#6B6760;font-size:13px;margin-bottom:36px;">Agent spotlight</p>
        <h2 style="font-size:22px;font-weight:700;margin-bottom:12px;">"I went from 1 listing to 4 active listings in 30 days."</h2>
        <div style="background:#1A1714;border-left:3px solid #F0B429;padding:20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
          <p style="color:#F0F0EB;font-size:15px;line-height:1.7;margin:0;">
            "I started posting Reeltor videos every time I listed a new property. Sellers started calling me because they saw my videos on TikTok. In March I had 4 active listings — the most I've ever had."
          </p>
          <p style="color:#6B6760;font-size:13px;margin-top:12px;margin-bottom:0;">— Sarah M., Keller Williams, Phoenix AZ</p>
        </div>
        <p style="color:#8A8682;line-height:1.7;margin-bottom:28px;">
          The agents winning listings right now aren't the ones with the best website. They're the ones showing up consistently with quality video.
        </p>
        <a href="${upgradeUrl()}" style="display:inline-block;background:#F0B429;color:#0D0B08;font-weight:700;padding:15px 32px;border-radius:6px;text-decoration:none;font-size:16px;">Get 20 Videos/Month — $49 →</a>
        <p style="color:#2E2B27;font-size:11px;margin-top:48px;">© 2026 Reeltor.ai · <a href="${APP_URL()}/unsubscribe?email=${encodeURIComponent(email)}" style="color:#2E2B27;">Unsubscribe</a></p>
      </div>
      </body></html>
    `,
  });
}

export async function sendTunnelDay5(email: string, videoUrl: string) {
  return getResend().emails.send({
    from: FROM(),
    to: email,
    subject: 'Your free Reeltor video expires in 48 hours',
    scheduledAt: daysFromNow(5),
    html: `
      <!DOCTYPE html><html><body style="${baseStyle}">
      <div style="max-width:560px;margin:0 auto;">
        <h1 style="font-size:28px;font-weight:800;color:#F0B429;margin-bottom:4px;">Reeltor.ai</h1>
        <p style="color:#6B6760;font-size:13px;margin-bottom:36px;">Heads up</p>
        <h2 style="font-size:22px;font-weight:700;margin-bottom:12px;">Your video link expires in 48 hours.</h2>
        <p style="color:#8A8682;line-height:1.7;margin-bottom:20px;">
          The temporary link to your free listing video will stop working in 2 days.
          Download it now if you haven't already, or create a free account to save it permanently.
        </p>
        <a href="${videoUrl}" style="display:inline-block;background:#F0B429;color:#0D0B08;font-weight:700;padding:15px 32px;border-radius:6px;text-decoration:none;font-size:16px;margin-bottom:16px;">Download Now (Free) →</a>
        <br/>
        <a href="${signupUrl(email)}" style="display:inline-block;background:#1A1714;color:#F0B429;font-weight:700;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;border:1px solid #2E2B27;margin-bottom:32px;">Save Forever + Make More Videos →</a>
        <p style="color:#2E2B27;font-size:11px;margin-top:48px;">© 2026 Reeltor.ai · <a href="${APP_URL()}/unsubscribe?email=${encodeURIComponent(email)}" style="color:#2E2B27;">Unsubscribe</a></p>
      </div>
      </body></html>
    `,
  });
}

export async function sendTunnelDay10(email: string) {
  return getResend().emails.send({
    from: FROM(),
    to: email,
    subject: 'Last chance — $49/month for 20 listing videos',
    scheduledAt: daysFromNow(10),
    html: `
      <!DOCTYPE html><html><body style="${baseStyle}">
      <div style="max-width:560px;margin:0 auto;">
        <h1 style="font-size:28px;font-weight:800;color:#F0B429;margin-bottom:4px;">Reeltor.ai</h1>
        <p style="color:#6B6760;font-size:13px;margin-bottom:36px;">Final offer</p>
        <h2 style="font-size:22px;font-weight:700;margin-bottom:12px;">One listing video = one lost opportunity.</h2>
        <p style="color:#8A8682;line-height:1.7;margin-bottom:24px;">
          You used your free video 10 days ago. Since then, how many listings have you taken?
          Every one of those is a video that could be pulling in leads on social right now.
        </p>
        <div style="background:#1A1714;border-radius:8px;padding:24px;margin-bottom:28px;">
          <p style="color:#F0B429;font-weight:700;font-size:18px;margin-top:0;margin-bottom:8px;">Starter Plan — $49/month</p>
          <ul style="color:#8A8682;line-height:2.0;padding-left:20px;margin:0;">
            <li>20 listing videos per month</li>
            <li>All 6 cinematic templates</li>
            <li>Download, share, post anywhere</li>
            <li>Cancel anytime</li>
          </ul>
        </div>
        <a href="${upgradeUrl()}" style="display:inline-block;background:#F0B429;color:#0D0B08;font-weight:700;padding:15px 32px;border-radius:6px;text-decoration:none;font-size:16px;">Start for $49/month →</a>
        <p style="color:#4A4642;font-size:12px;margin-top:24px;">No contracts. Cancel in 30 seconds.</p>
        <p style="color:#2E2B27;font-size:11px;margin-top:48px;">© 2026 Reeltor.ai · <a href="${APP_URL()}/unsubscribe?email=${encodeURIComponent(email)}" style="color:#2E2B27;">Unsubscribe</a></p>
      </div>
      </body></html>
    `,
  });
}

export async function startTunnelEmailSequence(email: string, videoUrl: string) {
  const results = await Promise.allSettled([
    sendTunnelVideoReady(email, videoUrl),
    sendTunnelDay1(email, videoUrl),
    sendTunnelDay3(email),
    sendTunnelDay5(email, videoUrl),
    sendTunnelDay10(email),
  ]);

  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    console.warn(`Tunnel email sequence: ${failures.length}/5 emails failed (non-fatal)`);
  }
}

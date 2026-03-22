import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Belysium Group <noreply@belysiumgroup.com>';
const NOTIFY = process.env.NOTIFY_EMAIL ?? 'Thomas@BelysiumGroup.com';

export async function sendLeadNotification(params: {
  name: string;
  email: string;
  company?: string;
  division: string;
  message?: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: NOTIFY,
    subject: `New lead — ${params.division} — ${params.name}`,
    html: `
      <h2>New lead captured</h2>
      <p><strong>Name:</strong> ${params.name}</p>
      <p><strong>Email:</strong> <a href="mailto:${params.email}">${params.email}</a></p>
      ${params.company ? `<p><strong>Company:</strong> ${params.company}</p>` : ''}
      <p><strong>Division:</strong> ${params.division}</p>
      ${params.message ? `<p><strong>Message:</strong> ${params.message}</p>` : ''}
      <hr/>
      <p style="color:#888;font-size:12px">Sent automatically by Belysium Platform</p>
    `,
  });
}

export async function sendLicenseEmail(params: {
  toEmail: string;
  tier: string;
  licenseKey: string;
  toolsAllowed: string[];
}) {
  const toolList = params.toolsAllowed.map(t => `<li>${t}</li>`).join('');
  await resend.emails.send({
    from: FROM,
    to: params.toEmail,
    subject: 'Your Belysium Platform license',
    html: `
      <h2>Welcome to Belysium Platform</h2>
      <p>Thank you for your purchase. Here are your license details:</p>
      <p><strong>Tier:</strong> ${params.tier}</p>
      <p><strong>License Key:</strong> <code style="background:#f4f4f4;padding:4px 8px;border-radius:4px">${params.licenseKey}</code></p>
      <p><strong>Tools included:</strong></p>
      <ul>${toolList}</ul>
      <p>Visit <a href="https://belysiumgroup.com/tools">belysiumgroup.com/tools</a> and enter your license key to get started.</p>
      <hr/>
      <p>Questions? Reply to this email or contact <a href="mailto:Info@BelysiumGroup.com">Info@BelysiumGroup.com</a></p>
    `,
  });
}

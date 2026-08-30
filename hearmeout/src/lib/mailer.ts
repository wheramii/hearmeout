import nodemailer from 'nodemailer';

// Generic SMTP sender — works with any provider (Resend, Postmark, Mailgun,
// a domain's own mail server, ...) via plain SMTP credentials, so switching
// providers is just an env var change, not a code change.
let cachedTransport: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cachedTransport;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.SMTP_HOST) throw new Error('smtp_not_configured');
  await getTransport().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

// Generic SMTP sender — works with any provider (Resend, Postmark, Mailgun,
// a domain's own mail server, ...) via plain SMTP credentials, so switching
// providers is just an env var change, not a code change.
let cachedTransport: Transporter<SMTPTransport.SentMessageInfo> | null = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // Nodemailer's defaults (up to a 2-minute connection timeout) turn a
    // blocked/unreachable SMTP host into a request that just hangs instead
    // of failing — these fail fast enough to actually surface as an error.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    // Render's outbound network has no IPv6 route — Node's default DNS
    // resolution still tries smtp.gmail.com's IPv6 address first and fails
    // with ENETUNREACH before ever falling back to IPv4. Forcing IPv4 here
    // skips that dead end entirely (confirmed against this app's actual
    // Render deployment: the IPv6 connect attempt is what was failing).
    // Not part of @types/nodemailer's Options, but nodemailer forwards
    // unrecognized options straight through to Node's net/tls connect().
    family: 4,
  } as SMTPTransport.Options);
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

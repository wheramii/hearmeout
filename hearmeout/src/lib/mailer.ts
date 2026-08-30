import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { isIP } from 'net';
import { resolve4 } from 'dns/promises';

// Generic SMTP sender — works with any provider (Resend, Postmark, Mailgun,
// a domain's own mail server, ...) via plain SMTP credentials, so switching
// providers is just an env var change, not a code change.
let cachedTransport: Transporter<SMTPTransport.SentMessageInfo> | null = null;

// nodemailer's own DNS resolution combines the host's IPv4 and IPv6
// addresses and picks a RANDOM one to connect to (not "IPv4 first" despite
// the array order) — the `family` option is not read anywhere in its
// connection code, so it has no effect. Render's outbound network has no
// IPv6 route, so roughly half of nodemailer's own attempts failed with
// ENETUNREACH (confirmed against this app's actual Render deployment).
// Resolving to a literal IPv4 address ourselves and connecting straight to
// it sidesteps nodemailer's resolver entirely.
async function resolveIPv4Host(hostname: string): Promise<string> {
  if (!hostname || isIP(hostname)) return hostname;
  try {
    const addresses = await resolve4(hostname);
    if (addresses.length) return addresses[0];
  } catch {
    // Keep the original hostname if the IPv4 lookup itself fails — falls
    // back to nodemailer's own (still IPv6-capable) resolution rather than
    // hard-failing the send outright.
  }
  return hostname;
}

async function getTransport() {
  if (cachedTransport) return cachedTransport;
  const host = process.env.SMTP_HOST || '';
  const ipv4Host = await resolveIPv4Host(host);
  cachedTransport = nodemailer.createTransport({
    host: ipv4Host,
    // Connecting by IP means the TLS certificate can't be checked against
    // that IP — servername keeps SNI and cert-hostname validation pointed
    // at the real hostname instead.
    servername: host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // Nodemailer's defaults (up to a 2-minute connection timeout) turn a
    // blocked/unreachable SMTP host into a request that just hangs instead
    // of failing — these fail fast enough to actually surface as an error.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  } as SMTPTransport.Options);
  return cachedTransport;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.SMTP_HOST) throw new Error('smtp_not_configured');
  const transport = await getTransport();
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

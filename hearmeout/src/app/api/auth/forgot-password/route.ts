import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidEmail } from '@/lib/authValidation';
import { sendEmail } from '@/lib/mailer';

// Always responds 200 regardless of whether the email is registered — a
// forgot-password endpoint that answers differently for known vs unknown
// emails lets an attacker enumerate real accounts.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isValidEmail(email)) return NextResponse.json({ error: 'invalid_email' }, { status: 400 });

  const admin = supabaseAdmin();

  try {
    // generateLink (not resetPasswordForEmail) so Supabase hands back the
    // raw 6-digit code instead of sending its own rate-limited email — we
    // send it ourselves over the SMTP configured for this app.
    const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email });
    if (!error && data?.properties?.email_otp) {
      await sendEmail(
        email,
        'Код для сброса пароля — HearMeOut',
        `<div style="font-family:sans-serif;padding:24px;color:#2a2521">
          <p>Код для сброса пароля в HearMeOut:</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:.1em">${data.properties.email_otp}</p>
          <p style="color:#7d7568;font-size:13px">Код действителен в течение часа. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
        </div>`
      );
    }
  } catch (err) {
    // Swallow: an unknown email or an SMTP hiccup must not leak through the
    // generic response, and must not block the (deliberately uniform) reply.
    // Logged (not surfaced to the client) so a real delivery problem is
    // still visible in the server logs instead of silently disappearing.
    console.error('forgot-password: failed to send code', err);
  }

  return NextResponse.json({ ok: true });
}

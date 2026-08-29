'use client';

import { useState, type FormEvent } from 'react';
import { useApp } from '@/lib/AppContext';
import type { TranslationKey } from '@/lib/i18n';

const ERROR_KEY: Record<string, TranslationKey> = {
  email_taken: 'register.emailTaken',
  invalid_email: 'register.invalidEmail',
  weak_password: 'register.weakPassword',
  name_required: 'register.nameRequired',
  invalid_credentials: 'login.invalidCredentials',
  account_not_linked: 'login.accountNotLinked',
  invalid_code: 'resetPassword.invalidCode',
};

type Mode = 'register' | 'login' | 'forgot' | 'reset';

export function RegisterModal() {
  const { t, registerWithPassword, loginWithPassword, forgotPassword, resetPasswordWithCode } = useApp();
  const [mode, setMode] = useState<Mode>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function mapError(err: unknown, fallback: TranslationKey): string {
    const code = err instanceof Error ? err.message : '';
    return t(ERROR_KEY[code] || fallback);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (mode === 'register' || mode === 'login') {
      if (mode === 'register' && !name.trim()) { setError(t('register.nameRequired')); return; }
      if (!email.trim()) { setError(t('register.emailRequired')); return; }
      if (!password) { setError(t('register.passwordRequired')); return; }

      setSubmitting(true);
      setError(null);
      try {
        if (mode === 'register') {
          await registerWithPassword(name.trim(), email.trim(), password);
        } else {
          await loginWithPassword(email.trim(), password);
        }
      } catch (err) {
        setError(mapError(err, mode === 'register' ? 'register.failed' : 'login.failed'));
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'forgot') {
      if (!email.trim()) { setError(t('register.emailRequired')); return; }
      setSubmitting(true);
      setError(null);
      try {
        await forgotPassword(email.trim());
        setSubmitting(false);
        switchMode('reset');
      } catch {
        setError(t('forgotPassword.failed'));
        setSubmitting(false);
      }
      return;
    }

    // mode === 'reset'
    if (!code.trim()) { setError(t('resetPassword.codeRequired')); return; }
    if (!newPassword) { setError(t('register.passwordRequired')); return; }
    setSubmitting(true);
    setError(null);
    try {
      await resetPasswordWithCode(email.trim(), code.trim(), newPassword);
    } catch (err) {
      setError(mapError(err, 'resetPassword.failed'));
      setSubmitting(false);
    }
  }

  const title =
    mode === 'register' ? t('register.question')
      : mode === 'login' ? t('login.title')
      : mode === 'forgot' ? t('forgotPassword.title')
      : t('resetPassword.title');

  const submitLabel = submitting
    ? (mode === 'register' ? t('register.submitting')
      : mode === 'login' ? t('login.submitting')
      : mode === 'forgot' ? t('forgotPassword.submitting')
      : t('resetPassword.submitting'))
    : (mode === 'register' ? t('register.submit')
      : mode === 'login' ? t('login.submit')
      : mode === 'forgot' ? t('forgotPassword.submit')
      : t('resetPassword.submit'));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(18,17,16,.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
      <form
        onSubmit={handleSubmit}
        style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%' }}
      >
        <div className="eyebrow">{t('register.welcome')}</div>
        <h1 className="page-title" style={{ marginBottom: 14 }}>{title}</h1>

        {mode === 'register' && (
          <input
            className="name-input"
            style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 10, fontSize: 15, width: '100%' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('register.namePlaceholder')}
            autoFocus
          />
        )}

        {(mode === 'register' || mode === 'login' || mode === 'forgot') && (
          <input
            type="email"
            className="name-input"
            style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 10, fontSize: 15, width: '100%' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('register.emailPlaceholder')}
          />
        )}

        {mode === 'forgot' && (
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: -4, marginBottom: 14 }}>{t('forgotPassword.subtitle')}</p>
        )}

        {(mode === 'register' || mode === 'login') && (
          <input
            type="password"
            className="name-input"
            style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 15, width: '100%' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('register.passwordPlaceholder')}
          />
        )}

        {mode === 'reset' && (
          <>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14 }}>{t('resetPassword.sentTo', { email: email.trim() })}</p>
            <input
              className="name-input"
              style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 10, fontSize: 15, width: '100%' }}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('resetPassword.codePlaceholder')}
              autoFocus
            />
            <input
              type="password"
              className="name-input"
              style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 15, width: '100%' }}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('resetPassword.newPasswordPlaceholder')}
            />
          </>
        )}

        {error && <div style={{ color: 'var(--coral)', fontSize: 12.5, marginBottom: 12 }}>{error}</div>}

        <button className="btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={submitting}>
          {submitLabel}
        </button>

        {mode === 'login' && (
          <button
            type="button"
            className="btn-ghost"
            style={{ width: '100%', marginBottom: 12 }}
            onClick={() => switchMode('forgot')}
          >
            {t('login.forgotPassword')}
          </button>
        )}

        {(mode === 'forgot' || mode === 'reset') ? (
          <button type="button" className="btn-ghost" style={{ width: '100%' }} onClick={() => switchMode('login')}>
            {t('forgotPassword.back')}
          </button>
        ) : (
          <button
            type="button"
            className="btn-ghost"
            style={{ width: '100%' }}
            onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}
          >
            {mode === 'register' ? t('register.switchToLogin') : t('login.switchToRegister')}
          </button>
        )}
      </form>
    </div>
  );
}

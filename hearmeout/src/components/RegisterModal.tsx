'use client';

import { useState, type FormEvent } from 'react';
import { useApp } from '@/lib/AppContext';

export function RegisterModal() {
  const { t, register } = useApp();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError(t('register.nameRequired')); return; }
    setSubmitting(true);
    setError(null);
    try {
      await register(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.failed'));
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(18,17,16,.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
      <form
        onSubmit={handleSubmit}
        style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%' }}
      >
        <div className="eyebrow">{t('register.welcome')}</div>
        <h1 className="page-title" style={{ marginBottom: 14 }}>{t('register.question')}</h1>
        <input
          className="name-input"
          style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 15 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('register.namePlaceholder')}
          autoFocus
        />
        {error && <div style={{ color: 'var(--coral)', fontSize: 12.5, marginBottom: 12 }}>{error}</div>}
        <button className="btn-primary" style={{ width: '100%', marginBottom: 0 }} disabled={submitting}>
          {submitting ? t('register.submitting') : t('register.submit')}
        </button>
      </form>
    </div>
  );
}

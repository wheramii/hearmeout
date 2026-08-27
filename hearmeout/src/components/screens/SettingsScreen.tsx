'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device } from '@/lib/types';
import { LANGUAGES, LANGUAGE_LABEL, getRegionCodes, regionDisplayName } from '@/lib/i18n';
import { AccountBlock, ConnectBlock, ImportHistoryBlock } from '../ProfileBlocks';
import { ThemeToggle } from '../ThemeToggle';

type Section = 'appearance' | 'language' | 'account' | 'connections';

function AppearanceSection() {
  const { t } = useApp();
  return (
    <>
      <div className="section-head"><h2>{t('settings.appearance')}</h2></div>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>{t('settings.appearanceHint')}</p>
      <div style={{ marginBottom: 24 }}><ThemeToggle /></div>
    </>
  );
}

function LanguageRegionSection() {
  const { t, me, language, updateLanguage, updateRegion } = useApp();
  const regionCodes = useMemo(() => getRegionCodes(), []);
  if (!me) return null;

  const selectStyle = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12,
    padding: '12px 14px', color: 'var(--text)', fontFamily: 'var(--font-inter),sans-serif', fontSize: 13.5,
  };

  return (
    <>
      <div className="section-head"><h2>{t('profile.language')}</h2></div>
      <div className="chips" style={{ marginBottom: 22 }}>
        {LANGUAGES.map((l) => (
          <button key={l} className={`chip ${language === l ? 'on' : ''}`} onClick={() => updateLanguage(l)}>{LANGUAGE_LABEL[l]}</button>
        ))}
      </div>
      <div className="section-head"><h2>{t('profile.region')}</h2><span>{t('profile.regionHint')}</span></div>
      <select style={{ ...selectStyle, marginBottom: 22 }} value={me.region ?? ''} onChange={(e) => updateRegion(e.target.value || null)}>
        <option value="">{t('profile.regionNone')}</option>
        {regionCodes.map((code) => <option key={code} value={code}>{regionDisplayName(code, language)}</option>)}
      </select>
    </>
  );
}

export function SettingsScreen({ device }: { device: Device }) {
  const { t, me, syncSpotify, showScreen } = useApp();
  const [section, setSection] = useState<Section>('appearance');
  if (!me) return null;

  const NAV: { key: Section; label: string }[] = [
    { key: 'appearance', label: t('settings.appearance') },
    { key: 'language', label: t('settings.languageRegion') },
    { key: 'account', label: t('profile.accountSection') },
    { key: 'connections', label: t('profile.connection') },
  ];

  const body = (
    <>
      {section === 'appearance' && <AppearanceSection />}
      {section === 'language' && <LanguageRegionSection />}
      {section === 'account' && (
        <>
          <div className="section-head"><h2>{t('profile.accountSection')}</h2></div>
          <div style={{ marginBottom: 22 }}><AccountBlock /></div>
        </>
      )}
      {section === 'connections' && (
        <>
          <div className="section-head"><h2>{t('profile.connection')}</h2><span>Spotify / Apple Music</span></div>
          <div style={{ marginBottom: 12 }}><ConnectBlock /></div>
          {me.connections.spotify && (
            <button className="btn-ghost" style={{ width: '100%', marginBottom: 12 }} onClick={() => syncSpotify()}>{t('profile.syncNow')}</button>
          )}
          <div style={{ marginBottom: 22 }}><ImportHistoryBlock /></div>
        </>
      )}
    </>
  );

  return (
    <>
      <button className="back-btn" onClick={() => showScreen('profile')}>{t('friend.back')}</button>
      <div className="eyebrow">{t('settings.eyebrow')}</div>
      <h1 className="page-title">{t('settings.title')}</h1>
      {device === 'desktop' ? (
        <div className="d-profile-layout">
          <div className="side" style={{ width: 220 }}>
            {NAV.map((n) => (
              <button
                key={n.key}
                className={`settings-nav-item ${section === n.key ? 'active' : ''}`}
                onClick={() => setSection(n.key)}
              >
                {n.label}
              </button>
            ))}
          </div>
          <div className="main" style={{ maxWidth: 460 }}>{body}</div>
        </div>
      ) : (
        <>
          <div className="chips">
            {NAV.map((n) => (
              <button key={n.key} className={`chip ${section === n.key ? 'on' : ''}`} onClick={() => setSection(n.key)}>{n.label}</button>
            ))}
          </div>
          {body}
        </>
      )}
    </>
  );
}

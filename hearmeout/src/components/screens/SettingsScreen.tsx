'use client';

import { useMemo, useRef, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device } from '@/lib/types';
import { LANGUAGES, LANGUAGE_LABEL, getRegionCodes, regionDisplayName } from '@/lib/i18n';
import { AccountBlock, ConnectBlock, ImportHistoryBlock } from '../ProfileBlocks';
import { ThemeToggle } from '../ThemeToggle';
import { PremiumLock } from '../ui/PremiumLock';

type Section = 'appearance' | 'language' | 'account' | 'connections';

const PALETTE_TIERS: { key: string; labelKey: string; options: string[] }[] = [
  { key: 'calm', labelKey: 'settings.paletteCalm', options: ['calm-1', 'calm-2'] },
  { key: 'bright', labelKey: 'settings.paletteBright', options: ['bright-1', 'bright-2'] },
  { key: 'acid', labelKey: 'settings.paletteAcid', options: ['acid-1', 'acid-2'] },
];
const PALETTE_SWATCH: Record<string, [string, string]> = {
  'calm-1': ['#7a9b8e', '#a67c6d'], 'calm-2': ['#8a93c2', '#b891a6'],
  'bright-1': ['#4d8dff', '#ff5c8a'], 'bright-2': ['#ff8a3d', '#9b5de5'],
  'acid-1': ['#b6ff2e', '#ff2fb0'], 'acid-2': ['#f4ff2e', '#00e5ff'],
};

function AccentPaletteSection() {
  const { t, me, updateAccentPalette } = useApp();
  return (
    <>
      <div className="section-head" style={{ marginTop: 24 }}><h2>{t('settings.accentPalette')}</h2></div>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>{t('settings.accentPaletteHint')}</p>
      <PremiumLock>
        {PALETTE_TIERS.map((tier) => (
          <div key={tier.key} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, fontFamily: 'var(--font-ibm-plex-mono),monospace' }}>{t(tier.labelKey as never)}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {tier.options.map((key) => (
                <button
                  key={key}
                  onClick={() => updateAccentPalette(key)}
                  style={{
                    flex: 1, height: 40, borderRadius: 10, cursor: 'pointer', display: 'flex', overflow: 'hidden',
                    border: me?.accentPalette === key ? '2px solid var(--text)' : '1px solid var(--line)',
                  }}
                  aria-label={key}
                >
                  <span style={{ flex: 1, background: PALETTE_SWATCH[key][0] }} />
                  <span style={{ flex: 1, background: PALETTE_SWATCH[key][1] }} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </PremiumLock>
    </>
  );
}

function BannerUploadSection() {
  const { t, updateBanner } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <div className="section-head" style={{ marginTop: 24 }}><h2>{t('settings.profileBanner')}</h2></div>
      <PremiumLock>
        <button className="btn-ghost" style={{ width: '100%' }} onClick={() => inputRef.current?.click()}>{t('settings.uploadBanner')}</button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => updateBanner(reader.result as string);
            reader.readAsDataURL(file);
          }}
        />
      </PremiumLock>
    </>
  );
}

function AppearanceSection() {
  const { t } = useApp();
  return (
    <>
      <div className="section-head"><h2>{t('settings.appearance')}</h2></div>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>{t('settings.appearanceHint')}</p>
      <div style={{ marginBottom: 24 }}><ThemeToggle /></div>
      <AccentPaletteSection />
      <BannerUploadSection />
    </>
  );
}

function LanguageRegionSection() {
  const { t, me, language, updateLanguage, updateRegion } = useApp();
  const regionCodes = useMemo(() => getRegionCodes(), []);
  if (!me) return null;

  return (
    <>
      <div className="section-head"><h2>{t('profile.language')}</h2></div>
      <div className="chips" style={{ marginBottom: 22 }}>
        {LANGUAGES.map((l) => (
          <button key={l} className={`chip ${language === l ? 'on' : ''}`} onClick={() => updateLanguage(l)}>{LANGUAGE_LABEL[l]}</button>
        ))}
      </div>
      <div className="section-head"><h2>{t('profile.region')}</h2><span>{t('profile.regionHint')}</span></div>
      <select className="select-field" style={{ marginBottom: 22 }} value={me.region ?? ''} onChange={(e) => updateRegion(e.target.value || null)}>
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

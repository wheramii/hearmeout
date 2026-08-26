'use client';

import { useMemo, useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device } from '@/lib/types';
import { userAvatarStyle } from '@/lib/format';
import { LANGUAGES, LANGUAGE_LABEL, getRegionCodes, regionDisplayName } from '@/lib/i18n';
import { AccountBlock, ConnectBlock, ImportHistoryBlock, GenresBlock, Top4Grid, FriendRequestsBlock, FriendsBlock, AwardsBlock } from '../ProfileBlocks';

function AvatarPicker({ size }: { size?: number }) {
  const { t, me, updateAvatar } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  if (!me) return null;
  return (
    <div
      className={`avatar-lg ${me.avatarUrl ? 'has-img' : ''}`}
      style={{ ...(size ? { width: size, height: size } : {}), ...userAvatarStyle(me) }}
      onClick={() => inputRef.current?.click()}
    >
      <span className="hint" style={size ? { fontSize: 11 } : undefined}>{t('profile.changePhoto')}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => updateAvatar(reader.result as string);
          reader.readAsDataURL(file);
        }}
      />
    </div>
  );
}

function LanguageRegionSection() {
  const { t, me, language, updateLanguage, updateRegion } = useApp();
  const regionCodes = useMemo(() => getRegionCodes(), []);
  if (!me) return null;

  const selectStyle = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 12,
    padding: '12px 14px',
    color: 'var(--text)',
    fontFamily: 'var(--font-inter),sans-serif',
    fontSize: 13.5,
  };

  return (
    <>
      <div className="section-head"><h2>{t('profile.language')}</h2></div>
      <div className="chips" style={{ marginBottom: 22 }}>
        {LANGUAGES.map((l) => (
          <button key={l} className={`chip ${language === l ? 'on' : ''}`} onClick={() => updateLanguage(l)}>
            {LANGUAGE_LABEL[l]}
          </button>
        ))}
      </div>

      <div className="section-head"><h2>{t('profile.region')}</h2><span>{t('profile.regionHint')}</span></div>
      <select
        style={{ ...selectStyle, marginBottom: 22 }}
        value={me.region ?? ''}
        onChange={(e) => updateRegion(e.target.value || null)}
      >
        <option value="">{t('profile.regionNone')}</option>
        {regionCodes.map((code) => (
          <option key={code} value={code}>{regionDisplayName(code, language)}</option>
        ))}
      </select>
    </>
  );
}

export function ProfileScreen({ device }: { device: Device }) {
  const { t, me, syncSpotify, updateProfileName, updateProfileHandle } = useApp();
  if (!me) return null;

  const statGrid = (
    <div className="stat-grid">
      <div className="box"><div className="v">{me.stats.ratings}</div><div className="l">{t('profile.ratings')}</div></div>
      <div className="box"><div className="v">{me.stats.avg || '—'}</div><div className="l">{t('profile.avg')}</div></div>
      <div className="box"><div className="v">{me.stats.reviews}</div><div className="l">{t('profile.reviews')}</div></div>
    </div>
  );

  const accountSection = (
    <>
      <div className="section-head"><h2>{t('profile.accountSection')}</h2></div>
      <div style={{ marginBottom: 22 }}><AccountBlock /></div>
    </>
  );

  const connectionSection = (
    <>
      <div className="section-head"><h2>{t('profile.connection')}</h2><span>Spotify / Apple Music</span></div>
      <div style={{ marginBottom: 12 }}><ConnectBlock /></div>
      {me.connections.spotify && (
        <button className="btn-ghost" style={{ width: '100%', marginBottom: 12 }} onClick={() => syncSpotify()}>
          {t('profile.syncNow')}
        </button>
      )}
      <div style={{ marginBottom: 22 }}><ImportHistoryBlock /></div>
    </>
  );

  if (device === 'mobile') {
    return (
      <>
        <div className="eyebrow">{t('profile.eyebrow')}</div>
        <div className="profile-head">
          <AvatarPicker />
          <div style={{ flex: 1 }}>
            <input className="name-input" defaultValue={me.name} onBlur={(e) => updateProfileName(e.target.value)} />
            <input className="handle-input" defaultValue={me.handle} onBlur={(e) => updateProfileHandle(e.target.value)} />
          </div>
        </div>
        {statGrid}

        {accountSection}
        {connectionSection}

        <div className="section-head"><h2>{t('profile.favoriteGenres')}</h2><span>{t('profile.allTime')}</span></div>
        <div style={{ marginBottom: 24 }}><GenresBlock genres={me.genres} /></div>

        <div className="section-head"><h2>{t('profile.top4')}</h2><span>{t('profile.byYourRatings')}</span></div>
        <div style={{ marginBottom: 24 }}><Top4Grid ids={me.top4Albums} /></div>

        <FriendRequestsBlock />
        <div className="section-head"><h2>{t('profile.friends')}</h2><span>{me.friends.length}</span></div>
        <div style={{ marginBottom: 14 }}><FriendsBlock /></div>

        <div className="section-head"><h2>{t('profile.monthAwards')}</h2><span>{t('profile.amongFriends')}</span></div>
        <div style={{ marginBottom: 24 }}><AwardsBlock /></div>

        <LanguageRegionSection />
      </>
    );
  }

  return (
    <div className="d-profile-layout">
      <div className="side">
        <AvatarPicker size={120} />
        <input className="name-input" defaultValue={me.name} style={{ fontSize: 22, marginTop: 14 }} onBlur={(e) => updateProfileName(e.target.value)} />
        <input className="handle-input" defaultValue={me.handle} style={{ fontSize: 13 }} onBlur={(e) => updateProfileHandle(e.target.value)} />
        <div className="stat-grid" style={{ gridTemplateColumns: '1fr', marginTop: 22 }}>
          <div className="box"><div className="v">{me.stats.ratings}</div><div className="l">{t('profile.ratings')}</div></div>
          <div className="box"><div className="v">{me.stats.avg || '—'}</div><div className="l">{t('profile.avg')}</div></div>
          <div className="box"><div className="v">{me.stats.reviews}</div><div className="l">{t('profile.reviews')}</div></div>
        </div>
        <FriendRequestsBlock />
        <div className="section-head" style={{ marginTop: 22 }}><h2>{t('profile.friends')}</h2><span>{me.friends.length}</span></div>
        <FriendsBlock />
      </div>
      <div className="main">
        {accountSection}
        {connectionSection}
        <div className="section-head"><h2>{t('profile.favoriteGenres')}</h2><span>{t('profile.allTime')}</span></div>
        <div style={{ marginBottom: 30, maxWidth: 420 }}><GenresBlock genres={me.genres} /></div>
        <div className="section-head"><h2>{t('profile.top4')}</h2><span>{t('profile.byYourRatings')}</span></div>
        <div style={{ maxWidth: 520, marginBottom: 30 }}><Top4Grid ids={me.top4Albums} /></div>
        <div className="section-head"><h2>{t('profile.monthAwards')}</h2><span>{t('profile.amongFriends')}</span></div>
        <div style={{ maxWidth: 480, marginBottom: 30 }}><AwardsBlock /></div>
        <div style={{ maxWidth: 420 }}><LanguageRegionSection /></div>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device } from '@/lib/types';
import { userAvatarStyle, formatJoinDate } from '@/lib/format';
import { LANGUAGE_LABEL, regionDisplayName, pluralForKey } from '@/lib/i18n';
import { GenresBlock, TasteFingerprint, RecentRatingsGrid, Top4Grid, FriendRequestsBlock, FriendsBlock, AwardsBlock, LovedTracksBlock } from '../ProfileBlocks';
import { PremiumBadge } from '../ui/PremiumBadge';

function ProfileBanner() {
  const { me } = useApp();
  if (!me?.bannerUrl) return null;
  return <div style={{ height: 110, borderRadius: 16, marginBottom: -40, backgroundImage: `url('${me.bannerUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />;
}

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

function SettingsSummary() {
  const { t, me, language, showScreen } = useApp();
  if (!me) return null;
  return (
    <>
      <div className="section-head"><h2>{t('settings.eyebrow')}</h2></div>
      <div className="settings-summary-row"><span className="l">{t('profile.language')}</span><span>{LANGUAGE_LABEL[language]}</span></div>
      <div className="settings-summary-row"><span className="l">{t('profile.region')}</span><span>{me.region ? regionDisplayName(me.region, language) : t('profile.regionNone')}</span></div>
      <button className="settings-summary-link" onClick={() => showScreen('settings')}>{t('settings.openAll')} →</button>
    </>
  );
}

function ShareProfileButton() {
  const { t, me, showToast } = useApp();
  if (!me) return null;
  return (
    <button
      className="btn-ghost"
      style={{ width: '100%', marginBottom: 22 }}
      onClick={() => {
        const url = `${window.location.origin}/u/${me.handle.replace(/^@/, '')}`;
        navigator.clipboard.writeText(url).then(
          () => showToast(t('profile.shareLinkCopied')),
          () => showToast(url)
        );
      }}
    >
      {t('profile.shareProfile')}
    </button>
  );
}

function ShareLovedTracksButton() {
  const { t, lovedItems, showToast } = useApp();
  const shareable = lovedItems.filter((li) => li.type === 'track' && li.itemId);
  if (!shareable.length) return null;
  return (
    <button
      className="btn-ghost"
      style={{ width: '100%', marginBottom: 24 }}
      onClick={() => {
        const lines = shareable.map((li, i) => `${i + 1}. ${li.title} — ${li.artist}\nhttps://open.spotify.com/track/${li.itemId}`);
        const block = `${t('profile.lovedTracksShareHeader')}\n\n${lines.join('\n\n')}`;
        navigator.clipboard.writeText(block).then(
          () => showToast(t('profile.lovedTracksShareCopied')),
          () => showToast(block)
        );
      }}
    >
      {t('profile.shareLovedTracks')}
    </button>
  );
}

export function ProfileScreen({ device }: { device: Device }) {
  const { t, language, me, myRatings, albums, liveAlbums, updateProfileName, updateProfileHandle } = useApp();

  const tasteFingerprint = useMemo(() => {
    const sums = new Map<string, { sum: number; count: number }>();
    for (const r of myRatings) {
      const a = liveAlbums[r.albumId] || albums.find((x) => x.id === r.albumId);
      if (!a?.genreBucket) continue;
      const cur = sums.get(a.genreBucket) || { sum: 0, count: 0 };
      cur.sum += r.stars;
      cur.count += 1;
      sums.set(a.genreBucket, cur);
    }
    return [...sums.entries()]
      .map(([g, { sum, count }]) => ({ g, avg: sum / count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 4);
  }, [myRatings, albums, liveAlbums]);

  if (!me) return null;

  const friendsSuffix = pluralForKey(language, me.friends.length, 'profile.friendOne', 'profile.friendFew', 'profile.friendMany');

  const statGrid = (
    <div className="stat-grid">
      <div className="box"><div className="v">{me.stats.ratings}</div><div className="l">{t('profile.ratings')}</div></div>
      <div className="box"><div className="v">{me.stats.avg || '—'}</div><div className="l">{t('profile.avg')}</div></div>
      <div className="box"><div className="v">{me.stats.reviews}</div><div className="l">{t('profile.reviews')}</div></div>
    </div>
  );

  if (device === 'mobile') {
    return (
      <>
        <div className="eyebrow">{t('profile.eyebrow')}</div>
        <ProfileBanner />
        <div className="profile-head">
          <AvatarPicker />
          <div style={{ flex: 1 }}>
            <input className="name-input" defaultValue={me.name} onBlur={(e) => updateProfileName(e.target.value)} />
            {me.isPremium && <PremiumBadge />}
            <input className="handle-input" defaultValue={me.handle} onBlur={(e) => updateProfileHandle(e.target.value)} />
            <div className="profile-joined">{me.friends.length} {friendsSuffix} · {t('profile.joined')} {formatJoinDate(me.joinedAt, language)}</div>
          </div>
        </div>
        {statGrid}
        <ShareProfileButton />

        <div className="section-head"><h2>{t('profile.taste')}</h2></div>
        <TasteFingerprint entries={tasteFingerprint} />

        <div className="section-head"><h2>{t('profile.recentRatings')}</h2></div>
        <div style={{ marginBottom: 24 }}><RecentRatingsGrid ratings={(me.recentRatings || []).slice(0, 6)} /></div>

        <div className="section-head"><h2>{t('profile.lovedTracks')}</h2></div>
        <div style={{ marginBottom: 12 }}><LovedTracksBlock /></div>
        <ShareLovedTracksButton />

        <div className="section-head"><h2>{t('profile.favoriteGenres')}</h2><span>{t('profile.allTime')}</span></div>
        <div style={{ marginBottom: 24 }}><GenresBlock genres={me.genres} /></div>

        <div className="section-head"><h2>{t('profile.top4')}</h2><span>{t('profile.byYourRatings')}</span></div>
        <div style={{ marginBottom: 24 }}><Top4Grid ids={me.top4Albums} /></div>

        <FriendRequestsBlock />
        <div className="section-head"><h2>{t('profile.friends')}</h2><span>{me.friends.length}</span></div>
        <div style={{ marginBottom: 14 }}><FriendsBlock /></div>

        <div className="section-head"><h2>{t('profile.monthAwards')}</h2><span>{t('profile.amongFriends')}</span></div>
        <div style={{ marginBottom: 24 }}><AwardsBlock /></div>

        <SettingsSummary />
      </>
    );
  }

  return (
    <div className="d-profile-layout">
      <ProfileBanner />
      <div className="side">
        <AvatarPicker size={120} />
        <div><input className="name-input" defaultValue={me.name} style={{ fontSize: 22, marginTop: 14 }} onBlur={(e) => updateProfileName(e.target.value)} />{me.isPremium && <PremiumBadge />}</div>
        <input className="handle-input" defaultValue={me.handle} style={{ fontSize: 16 }} onBlur={(e) => updateProfileHandle(e.target.value)} />
        <div className="profile-joined">{t('profile.joined')} {formatJoinDate(me.joinedAt, language)}</div>
        <div className="stat-grid cols-2" style={{ marginTop: 22 }}>
          <div className="box"><div className="v">{me.stats.ratings}</div><div className="l">{t('profile.ratings')}</div></div>
          <div className="box"><div className="v">{me.stats.reviews}</div><div className="l">{t('profile.reviews')}</div></div>
          <div className="box"><div className="v">{me.stats.avg || '—'}</div><div className="l">{t('profile.avg')}</div></div>
          <div className="box"><div className="v">{me.friends.length}</div><div className="l">{friendsSuffix}</div></div>
        </div>
        <div style={{ marginTop: 14 }}><ShareProfileButton /></div>
        <FriendRequestsBlock />
        <div className="section-head" style={{ marginTop: 22 }}><h2>{t('profile.friends')}</h2><span>{me.friends.length}</span></div>
        <FriendsBlock />
      </div>
      <div className="main">
        <div className="section-head"><h2>{t('profile.taste')}</h2></div>
        <div style={{ maxWidth: 520, marginBottom: 24 }}><TasteFingerprint entries={tasteFingerprint} /></div>
        <div className="section-head"><h2>{t('profile.recentRatings')}</h2></div>
        <div style={{ maxWidth: 640, marginBottom: 30 }}><RecentRatingsGrid ratings={(me.recentRatings || []).slice(0, 6)} /></div>
        <div className="section-head"><h2>{t('profile.lovedTracks')}</h2></div>
        <div style={{ maxWidth: 480, marginBottom: 12 }}><LovedTracksBlock /></div>
        <div style={{ maxWidth: 480 }}><ShareLovedTracksButton /></div>
        <div className="section-head" style={{ marginTop: 22 }}><h2>{t('profile.favoriteGenres')}</h2><span>{t('profile.allTime')}</span></div>
        <div style={{ marginBottom: 30, maxWidth: 420 }}><GenresBlock genres={me.genres} /></div>
        <div className="section-head"><h2>{t('profile.top4')}</h2><span>{t('profile.byYourRatings')}</span></div>
        <div style={{ maxWidth: 520, marginBottom: 30 }}><Top4Grid ids={me.top4Albums} /></div>
        <div className="section-head"><h2>{t('profile.monthAwards')}</h2><span>{t('profile.amongFriends')}</span></div>
        <div style={{ maxWidth: 480, marginBottom: 30 }}><AwardsBlock /></div>
        <div style={{ maxWidth: 420 }}><SettingsSummary /></div>
      </div>
    </div>
  );
}

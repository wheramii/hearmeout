'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { userAvatarStyle } from '@/lib/format';
import { toLocale } from '@/lib/i18n';
import { CoverArt } from './ui/CoverArt';
import { StarsAvg } from './ui/StarsAvg';
import { PremiumBadge } from './ui/PremiumBadge';
import type { RatingRecord } from '@/lib/types';

export function AccountBlock() {
  const { t, me, claimAccount, logout, showToast } = useApp();
  const [claiming, setClaiming] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (!me) return null;

  const submitClaim = async () => {
    if (!email.trim() || !password || submitting) return;
    setSubmitting(true);
    try {
      await claimAccount(email.trim(), password);
      showToast(t('profile.passwordSetSuccess'));
      setClaiming(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      showToast(code === 'email_taken' ? t('profile.claimEmailTaken') : t('profile.claimFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="account-id-row">
        <div>
          <div className="account-id-label">{t('profile.yourId')}</div>
          <div className="account-id-value">{me.handle}</div>
        </div>
      </div>
      <div className="account-id-hint">{t('profile.yourIdHint')}</div>

      {me.hasPassword ? (
        <div className="account-email-row">
          <span className="chip">{t('profile.hasPasswordBadge')}</span>
          {me.email && <span className="account-email">{t('profile.emailLabel')}: {me.email}</span>}
        </div>
      ) : claiming ? (
        <div className="import-history-panel">
          <div className="import-history-sub">{t('profile.passwordSetHint')}</div>
          <input
            type="email"
            className="name-input"
            style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 10, width: '100%' }}
            placeholder={t('register.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="name-input"
            style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 10, width: '100%' }}
            placeholder={t('register.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn-primary" style={{ width: '100%' }} disabled={submitting} onClick={submitClaim}>
            {t('profile.passwordSetSubmit')}
          </button>
        </div>
      ) : (
        <button className="btn-ghost" style={{ width: '100%' }} onClick={() => setClaiming(true)}>
          {t('profile.passwordSetTitle')}
        </button>
      )}

      <button className="btn-ghost" style={{ width: '100%', marginTop: 10 }} onClick={() => logout()}>
        {t('profile.logout')}
      </button>
    </>
  );
}

export function ConnectBlock() {
  const { t, me } = useApp();
  if (!me) return null;
  return (
    <>
      <div className="connect-row">
        <a className={`connect-btn ${me.connections.spotify ? 'on' : ''}`} href="/api/auth/spotify">
          {me.connections.spotify ? t('profile.spotifyConnected') : t('profile.connectSpotify')}
        </a>
        <button className="connect-btn" disabled style={{ opacity: 0.5, cursor: 'default' }}>
          {t('profile.appleMusicSoon')}
        </button>
      </div>
      {!me.connections.spotify && (
        <div className="connect-beta-hint">
          <span className="chip" style={{ marginRight: 8 }}>{t('profile.connectBetaBadge')}</span>
          {t('profile.connectBetaHint')}
        </div>
      )}
    </>
  );
}

export function ImportHistoryBlock() {
  const { t, importStreamingHistory } = useApp();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setResult(null);
    const res = await importStreamingHistory(files);
    setBusy(false);
    if (res) {
      setResult({ imported: res.imported, errors: res.errors || [] });
      setFiles([]);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="import-history-block">
      <button className="btn-ghost" style={{ width: '100%' }} onClick={() => setOpen((v) => !v)}>
        {t('profile.importTitle')}
      </button>
      {open && (
        <div className="import-history-panel">
          <div className="import-history-sub">{t('profile.importSubtitle')}</div>
          <div className="import-history-how">
            <div className="import-history-how-title">{t('profile.importHowTitle')}</div>
            <ol>
              <li>{t('profile.importStep1')}</li>
              <li>{t('profile.importStep2')}</li>
              <li>{t('profile.importStep3')}</li>
              <li>{t('profile.importStep4')}</li>
              <li>{t('profile.importStep5')}</li>
            </ol>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            style={{ marginBottom: 10, width: '100%' }}
          />
          <button className="btn-primary" style={{ width: '100%' }} disabled={!files.length || busy} onClick={submit}>
            {busy ? t('profile.importUploading') : t('profile.importSubmit')}
          </button>
          {result && (
            <div className="import-history-result">
              {result.imported > 0 ? t('profile.importResult', { count: result.imported }) : t('profile.importResultEmpty')}
              {result.errors.length > 0 && (
                <ul style={{ marginTop: 8, paddingLeft: 18, color: 'var(--muted)' }}>
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RecapOpenButton({ userId, label }: { userId: string; label: string }) {
  const { openRecap } = useApp();
  return <button className="recap-open-btn" onClick={() => openRecap(userId)}>🎧 {label} →</button>;
}

export function GenresBlock({ genres }: { genres: { g: string; pct: number }[] }) {
  const { t } = useApp();
  if (!genres.length) return <div className="empty-state">{t('profile.notEnoughData')}</div>;
  return (
    <>
      {genres.map((g) => (
        <div className="genre-row" key={g.g}>
          <div className="name">{g.g}</div>
          <div className="track"><div className="fill" style={{ width: `${g.pct}%` }} /></div>
        </div>
      ))}
    </>
  );
}

// Real per-genre average of the user's own ratings (not the listening-time
// split used by GenresBlock/"favorite genres") — resolves each rating's
// album genre from the catalog or the live-enriched copy, same lookup the
// rest of the app uses.
export function TasteFingerprint({ entries }: { entries: { g: string; avg: number }[] }) {
  const { t } = useApp();
  if (!entries.length) return <div className="empty-state">{t('profile.notEnoughData')}</div>;
  return (
    <div className="taste-tiles">
      {entries.map((e) => (
        <div className="taste-tile" key={e.g}>
          <div className="taste-tile-top"><span className="taste-tile-num">{e.avg.toFixed(1)}</span><span className="taste-tile-g">{e.g}</span></div>
          <div className="track"><div className="fill" style={{ width: `${(e.avg / 5) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export function RecentRatingsGrid({ ratings }: { ratings: RatingRecord[] }) {
  const { t, albums, liveAlbums, spotifyCovers, openAlbum } = useApp();
  if (!ratings.length) return <div className="empty-state">{t('profile.noRatedAlbums')}</div>;
  return (
    <div className="recent-ratings-grid">
      {ratings.map((r) => {
        const a = liveAlbums[r.albumId] || albums.find((x) => x.id === r.albumId);
        if (!a) return null;
        const cover = spotifyCovers[a.id] || a.cover;
        return (
          <div className="recent-rating-item" key={r.albumId} onClick={() => openAlbum(a.id)}>
            <CoverArt url={cover} fallbackLetter={a.artist[0] || '?'} className="art" />
            <div className="t">{a.title}</div>
            <div className="rr-stars"><StarsAvg rating={r.stars} /><span>{r.stars.toFixed(1)}</span></div>
          </div>
        );
      })}
    </div>
  );
}

const LOVED_TYPE_LABEL: Record<string, string> = { track: 'profile.lovedTypeTrack', album: 'profile.lovedTypeAlbum', artist: 'profile.lovedTypeArtist' };

export function LovedTracksBlock() {
  const { t, lovedItems, toggleLoved } = useApp();
  if (!lovedItems.length) return <div className="empty-state">{t('profile.noLovedTracks')}</div>;
  return (
    <>
      {lovedItems.slice(0, 10).map((li) => (
        <div className="activity-item" key={li.id} style={{ cursor: 'default' }}>
          <CoverArt url={li.cover ?? undefined} fallbackLetter={(li.artist || li.title)[0] || '?'} className="thumb" />
          <div className="body">
            <div><b>{li.title}</b>{li.artist ? ` — ${li.artist}` : ''}</div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)', fontFamily: 'var(--font-ibm-plex-mono),monospace', textTransform: 'uppercase' }}>{t(LOVED_TYPE_LABEL[li.type] as never)}</div>
          </div>
          <button
            className="heart-toggle"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', padding: 6, flexShrink: 0 }}
            onClick={() => toggleLoved(li.type, li.title, li.artist, li.itemId, li.cover)}
            aria-label={t('stats.loveTrack')}
          >
            ♥
          </button>
        </div>
      ))}
    </>
  );
}

export function Top4Grid({ ids }: { ids: string[] }) {
  const { t, albums, liveAlbums, spotifyCovers, openAlbum } = useApp();
  if (!ids.length) return <div className="empty-state">{t('profile.noRatedAlbums')}</div>;
  return (
    <div className="top4-grid">
      {ids.map((id, i) => {
        const a = liveAlbums[id] || albums.find((x) => x.id === id);
        if (!a) return null;
        const cover = spotifyCovers[a.id] || a.cover;
        return (
          <CoverArt key={id} url={cover} fallbackLetter={a.artist[0] || '?'} className="art" onClick={() => openAlbum(a.id)}>
            <span className="rank">{String(i + 1).padStart(2, '0')}</span>
          </CoverArt>
        );
      })}
    </div>
  );
}

export function FriendRequestsBlock() {
  const { t, friendRequests, respondToFriendRequest } = useApp();
  if (!friendRequests.incoming.length && !friendRequests.outgoing.length) return null;

  return (
    <>
      {friendRequests.incoming.length > 0 && (
        <>
          <div className="section-head"><h2>{t('friends.incomingRequests')}</h2><span>{friendRequests.incoming.length}</span></div>
          {friendRequests.incoming.map((r) => (
            <div className="friend-row" key={r.id}>
              <div className="avatar-sm" style={userAvatarStyle(r.user)} />
              <div className="info">
                <div className="n">{r.user.name}</div>
                <div className="h">{r.user.handle}</div>
              </div>
              <button onClick={() => respondToFriendRequest(r.id, 'accept')}>{t('friends.accept')}</button>
              <button onClick={() => respondToFriendRequest(r.id, 'decline')}>{t('friends.decline')}</button>
            </div>
          ))}
        </>
      )}
      {friendRequests.outgoing.length > 0 && (
        <>
          <div className="section-head"><h2>{t('friends.outgoingRequests')}</h2><span>{friendRequests.outgoing.length}</span></div>
          {friendRequests.outgoing.map((r) => (
            <div className="friend-row" key={r.id}>
              <div className="avatar-sm" style={userAvatarStyle(r.user)} />
              <div className="info">
                <div className="n">{r.user.name}</div>
                <div className="h">{r.user.handle}</div>
              </div>
              <span className="chip" style={{ opacity: 0.6 }}>{t('friends.pendingBadge')}</span>
            </div>
          ))}
        </>
      )}
    </>
  );
}

export function FriendsBlock() {
  const { t, me, viewFriend, addFriend } = useApp();
  const [handle, setHandle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (!me) return null;

  return (
    <>
      {me.friends.map((f) => (
        <div className="friend-row" key={f.id}>
          <div className="avatar-sm" style={userAvatarStyle(f)} />
          <div className="info" onClick={() => viewFriend(f.id)}>
            <div className="n">{f.name}{f.isPremium && <PremiumBadge />}</div>
            <div className="h">{f.handle}</div>
          </div>
          <button onClick={() => viewFriend(f.id)}>{t('friends.viewProfile')}</button>
        </div>
      ))}
      {!me.friends.length && <div className="empty-state">{t('friends.empty')}</div>}
      <form
        style={{ display: 'flex', gap: 8, marginTop: 10 }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!handle.trim() || submitting) return;
          setSubmitting(true);
          await addFriend(handle.trim());
          setSubmitting(false);
          setHandle('');
        }}
      >
        <input
          className="handle-input"
          style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 10px', flex: 1 }}
          placeholder={t('friends.handlePlaceholder')}
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
        <button className="chip" type="submit" disabled={submitting}>{t('friends.add')}</button>
      </form>
    </>
  );
}

type Award = { name: string; value: number };

export function AwardsBlock() {
  const { t, language, me } = useApp();
  const [mostMinutes, setMostMinutes] = useState<Award | null>(null);
  const [mostNiche, setMostNiche] = useState<Award | null>(null);
  const [loading, setLoading] = useState(true);
  const lastGroupKey = useRef<string | null>(null);

  useEffect(() => {
    if (!me) return;
    const group = [{ id: me.id, name: me.name }, ...me.friends.map((f) => ({ id: f.id, name: f.name }))];
    const groupKey = group.map((p) => p.id).sort().join(',');
    if (lastGroupKey.current === groupKey) return;
    lastGroupKey.current = groupKey;

    let cancelled = false;
    setLoading(true);
    Promise.all(
      group.map(async (person) => {
        const res = await fetch(`/api/recap?period=month&userId=${person.id}`);
        if (!res.ok) return null;
        const data = await res.json();
        return { ...person, minutes: data.minutes as number, uniqueArtists: data.uniqueArtists as number };
      })
    ).then((results) => {
      if (cancelled) return;
      const valid = results.filter((r): r is NonNullable<typeof r> => r !== null && r.minutes > 0);
      if (valid.length) {
        const byMinutes = [...valid].sort((a, b) => b.minutes - a.minutes)[0];
        const byNiche = [...valid].sort((a, b) => b.uniqueArtists - a.uniqueArtists)[0];
        setMostMinutes({ name: byMinutes.name, value: byMinutes.minutes });
        setMostNiche({ name: byNiche.name, value: byNiche.uniqueArtists });
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [me]);

  if (!me) return null;
  if (!me.friends.length) return <div className="empty-state">{t('awards.needFriends')}</div>;
  if (loading) return <div className="archive-loading">{t('awards.computing')}</div>;
  if (!mostMinutes || !mostNiche) return <div className="empty-state">{t('awards.notEnough')}</div>;

  return (
    <>
      <div className="award-row"><span className="award-label">{t('awards.mostMinutes')}</span><span className="award-name">{mostMinutes.name} — {mostMinutes.value.toLocaleString(toLocale(language))} {t('awards.minutesShort')}</span></div>
      <div className="award-row"><span className="award-label">{t('awards.mostNiche')}</span><span className="award-name">{mostNiche.name} — {mostNiche.value} {t('awards.artistsShort')}</span></div>
    </>
  );
}

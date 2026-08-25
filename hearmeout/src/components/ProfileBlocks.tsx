'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { userAvatarStyle } from '@/lib/format';
import { toLocale } from '@/lib/i18n';
import { CoverArt } from './ui/CoverArt';

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
  const [result, setResult] = useState<{ imported: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setResult(null);
    const res = await importStreamingHistory(files);
    setBusy(false);
    if (res) {
      setResult({ imported: res.imported });
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
            <div className="n">{f.name}</div>
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

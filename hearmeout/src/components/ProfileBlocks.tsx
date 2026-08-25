'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { userAvatarStyle } from '@/lib/format';
import { CoverArt } from './ui/CoverArt';

export function ConnectBlock() {
  const { me } = useApp();
  if (!me) return null;
  return (
    <div className="connect-row">
      <a className={`connect-btn ${me.connections.spotify ? 'on' : ''}`} href="/api/auth/spotify">
        {me.connections.spotify ? '✓ Spotify подключён' : 'Подключить Spotify'}
      </a>
      <button className="connect-btn" disabled style={{ opacity: 0.5, cursor: 'default' }}>
        Apple Music (скоро)
      </button>
    </div>
  );
}

export function RecapOpenButton({ userId, label }: { userId: string; label: string }) {
  const { openRecap } = useApp();
  return <button className="recap-open-btn" onClick={() => openRecap(userId)}>🎧 {label} →</button>;
}

export function GenresBlock({ genres }: { genres: { g: string; pct: number }[] }) {
  if (!genres.length) return <div className="empty-state">Пока недостаточно данных — синхронизируй Spotify</div>;
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
  const { albums, liveAlbums, spotifyCovers, openAlbum } = useApp();
  if (!ids.length) return <div className="empty-state">Ещё нет оценённых альбомов</div>;
  return (
    <div className="top4-grid">
      {ids.map((id, i) => {
        const a = albums.find((x) => x.id === id) || liveAlbums[id];
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
  const { me, viewFriend, addFriend } = useApp();
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
          <button onClick={() => viewFriend(f.id)}>Профиль</button>
        </div>
      ))}
      {!me.friends.length && <div className="empty-state">Пока нет друзей</div>}
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
          placeholder="@handle друга"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
        <button className="chip" type="submit" disabled={submitting}>+ Добавить</button>
      </form>
    </>
  );
}

type Award = { name: string; value: number };

export function AwardsBlock() {
  const { me } = useApp();
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
  if (!me.friends.length) return <div className="empty-state">Добавь друзей, чтобы увидеть награды месяца</div>;
  if (loading) return <div className="archive-loading">Считаю…</div>;
  if (!mostMinutes || !mostNiche) return <div className="empty-state">Пока не с чем сравнивать — ни у кого нет данных за месяц</div>;

  return (
    <>
      <div className="award-row"><span className="award-label">🏆 Больше всех слушал(а) в этом месяце</span><span className="award-name">{mostMinutes.name} — {mostMinutes.value.toLocaleString('ru-RU')} мин</span></div>
      <div className="award-row"><span className="award-label">🎧 Самый нишевый вкус</span><span className="award-name">{mostNiche.name} — {mostNiche.value} артистов</span></div>
    </>
  );
}

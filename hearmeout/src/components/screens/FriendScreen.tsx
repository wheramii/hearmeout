'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device, PublicProfile } from '@/lib/types';
import { userAvatarStyle, starsText } from '@/lib/format';
import { RecapOpenButton, Top4Grid } from '../ProfileBlocks';
import { CoverArt } from '../ui/CoverArt';
import { accentMix } from '@/lib/accentGradient';

function FriendRatingRow({ rating, myScore }: { rating: NonNullable<PublicProfile['recentRatings']>[number]; myScore: number | null }) {
  const { albums, liveAlbums, spotifyCovers, openAlbum, t } = useApp();
  const a = liveAlbums[rating.albumId] || albums.find((x) => x.id === rating.albumId);
  if (!a) return null;
  const cover = spotifyCovers[a.id] || a.cover;
  const disagree = myScore != null && Math.abs(myScore - rating.stars) >= 1.5;
  return (
    <div className="history-row" onClick={() => openAlbum(a.id)}>
      <CoverArt url={cover} fallbackLetter={a.artist[0] || '?'} className="art-sm" />
      <div className="hr-info">
        <div className="hr-title">{a.title}</div>
        <div className="hr-artist">{a.artist}</div>
      </div>
      <span className={`friend-your-score ${disagree ? 'disagree' : ''}`}>
        {myScore != null ? t('friend.yourScoreValue', { value: myScore.toFixed(1) }) : t('friend.notRatedByYou')}
      </span>
      <div className="history-score">
        <span className="stars-dot" style={{ color: accentMix(rating.stars / 5) }}>{starsText(rating.stars)}</span>
        <span className="num">{rating.stars.toFixed(1)}</span>
      </div>
    </div>
  );
}

function MutualFriendRow({ user }: { user: NonNullable<PublicProfile['friends']>[number] }) {
  const { viewFriend } = useApp();
  return (
    <div className="friend-row">
      <div className="avatar-sm" style={userAvatarStyle(user)} />
      <div className="info" onClick={() => viewFriend(user.id)}>
        <div className="n">{user.name}</div>
        <div className="h">{user.handle}</div>
      </div>
    </div>
  );
}

function FriendsOfFriendRow({ user }: { user: NonNullable<PublicProfile['friends']>[number] }) {
  const { t, me, friendRequests, addFriend, viewFriend } = useApp();
  if (!me) return null;

  const isMe = user.id === me.id;
  const isFriend = me.friends.some((fr) => fr.id === user.id);
  const isPending = friendRequests.outgoing.some((r) => r.user.id === user.id);

  return (
    <div className="friend-row">
      <div className="avatar-sm" style={userAvatarStyle(user)} />
      <div className="info" onClick={() => viewFriend(user.id)}>
        <div className="n">{user.name}</div>
        <div className="h">{user.handle}</div>
      </div>
      {isMe ? null : isFriend ? (
        <span className="chip" style={{ opacity: 0.6 }}>{t('friend.alreadyFriend')}</span>
      ) : isPending ? (
        <span className="chip" style={{ opacity: 0.6 }}>{t('friend.requestSent')}</span>
      ) : (
        <button onClick={() => addFriend(user.handle)}>{t('friend.addThem')}</button>
      )}
    </div>
  );
}

export function FriendScreen(_props: { device: Device }) {
  const { t, state, me, myRatings, friendRequests, addFriend, goBack } = useApp();
  const [f, setF] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.viewingUserId) { setF(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/users/${state.viewingUserId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled) { setF(data); setLoading(false); } });
    return () => { cancelled = true; };
  }, [state.viewingUserId]);

  const myScoreByAlbum = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of myRatings) map.set(r.albumId, r.stars);
    return map;
  }, [myRatings]);

  const shared = useMemo(() => {
    if (!f?.recentRatings) return [];
    return f.recentRatings
      .filter((r) => myScoreByAlbum.has(r.albumId))
      .map((r) => ({ albumId: r.albumId, mine: myScoreByAlbum.get(r.albumId)!, theirs: r.stars }));
  }, [f, myScoreByAlbum]);

  const biggestGap = useMemo(() => {
    if (!shared.length) return null;
    return [...shared].sort((a, b) => Math.abs(b.mine - b.theirs) - Math.abs(a.mine - a.theirs))[0];
  }, [shared]);

  const mutualFriends = useMemo(() => {
    if (!f?.friends || !me) return [];
    return me.friends.filter((mf) => f.friends!.some((ff) => ff.id === mf.id));
  }, [f, me]);

  const overlap = useMemo(() => {
    if (!f || !me) return [];
    return me.genres.map((mg) => {
      const fg = f.genres.find((x) => x.g === mg.g);
      return { g: mg.g, me: mg.pct, friend: fg ? fg.pct : 0 };
    });
  }, [f, me]);
  const matchScore = useMemo(() => {
    const denom = overlap.reduce((s, o) => s + Math.max(o.me, o.friend), 0);
    return denom > 0 ? Math.round((overlap.reduce((s, o) => s + Math.min(o.me, o.friend), 0) / denom) * 100) : null;
  }, [overlap]);

  if (loading) return <div className="archive-loading">{t('friend.loadingProfile')}</div>;
  if (!f || !me) {
    return (
      <>
        <button className="back-btn" onClick={() => goBack('profile')}>{t('friend.back')}</button>
        <div className="empty-state">{t('friend.notFound')}</div>
      </>
    );
  }

  const isFriend = me.friends.some((fr) => fr.id === f.id);
  const isPending = friendRequests.outgoing.some((r) => r.user.id === f.id);
  const isFullView = !!f.recentRatings; // server only sends this for self / accepted friends

  return (
    <>
      <button className="back-btn" onClick={() => goBack('profile')}>{t('friend.back')}</button>

      <div className="friend-band">
        <div className="friend-band-avatar" style={userAvatarStyle(f)} />
        <div className="friend-band-mid">
          <h1>{f.name}</h1>
          <div className="friend-band-meta">{f.handle}</div>
          <div className="album-actions">
            {isFriend ? (
              <span className="action-chip added">{t('friend.alreadyFriend')}</span>
            ) : isPending ? (
              <span className="action-chip">{t('friend.requestSent')}</span>
            ) : (
              <button className="action-chip primary" onClick={() => addFriend(f.handle)}>{t('friend.addThem')}</button>
            )}
          </div>
        </div>
        <div className="friend-band-score">
          {matchScore != null ? (
            <>
              <div className="num">{matchScore}%</div>
              <div className="rd">{t('friend.matchScore')}</div>
            </>
          ) : (
            <div className="rd">{t('friend.notEnoughCompare')}</div>
          )}
          <div className="friend-band-stats">
            <div><span className="v">{f.stats.ratings}</span><span className="l">{t('profile.ratings')}</span></div>
            <div><span className="v">{f.stats.avg || '—'}</span><span className="l">{t('profile.avg')}</span></div>
          </div>
        </div>
      </div>

      {isFullView && shared.length > 0 && (
        <div className="friend-both-band">
          <span className="friend-both-label">{t('friend.bothLabel')}</span>
          <span>{t('friend.sharedRatings', { count: shared.length })}</span>
          {biggestGap && (
            <span>· {t('friend.biggestGap')}: {t('friend.gapDetail', { mine: biggestGap.mine.toFixed(1), theirs: biggestGap.theirs.toFixed(1) })}</span>
          )}
        </div>
      )}

      {overlap.length > 0 && (
        <div className="compare-block">
          {overlap.map((o) => (
            <div className="compare-row" key={o.g}>
              <div className="g">{o.g}</div>
              <div className="bars">
                <div className="b me"><i style={{ width: `${o.me}%` }} /></div>
                <div className="b fr"><i style={{ width: `${o.friend}%` }} /></div>
              </div>
            </div>
          ))}
          <div className="compare-legend">
            <span><i style={{ background: 'var(--lime)' }} />{t('friend.you')}</span>
            <span><i style={{ background: 'var(--muted)' }} />{f.name.split(' ')[0]}</span>
          </div>
        </div>
      )}

      <div className="section-head"><h2>{t('friend.recap')}</h2><span>{t('profile.recapPeriods')}</span></div>
      <div style={{ marginBottom: 24 }}><RecapOpenButton userId={f.id} label={t('friend.recapOf', { name: f.name.split(' ')[0] })} /></div>

      <div className="section-head"><h2>{t('friend.top4')}</h2><span>{t('friend.byRatings')}</span></div>
      <div style={{ marginBottom: 24 }}><Top4Grid ids={f.top4Albums} /></div>

      {isFullView && (
        <>
          <div className="section-head"><h2>{t('friend.history')}</h2><span>{f.recentRatings!.length}</span></div>
          {f.recentRatings!.length ? f.recentRatings!.map((r) => (
            <FriendRatingRow key={r.albumId} rating={r} myScore={myScoreByAlbum.get(r.albumId) ?? null} />
          )) : <div className="empty-state">{t('history.emptyLine1')}</div>}
        </>
      )}

      {isFullView && mutualFriends.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 22 }}><h2>{t('friend.mutualFriends')}</h2><span>{mutualFriends.length}</span></div>
          {mutualFriends.map((u) => <MutualFriendRow key={u.id} user={u} />)}
        </>
      )}

      {isFullView && f.friends && (
        <>
          <div className="section-head" style={{ marginTop: 22 }}><h2>{t('friend.friendsOf', { name: f.name.split(' ')[0] })}</h2><span>{f.friends.length}</span></div>
          {f.friends.length ? f.friends.map((u) => (
            <FriendsOfFriendRow key={u.id} user={u} />
          )) : <div className="empty-state">{t('friend.noFriends')}</div>}
        </>
      )}
    </>
  );
}

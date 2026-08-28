'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device, GroupDetail, GroupSummary } from '@/lib/types';
import { userAvatarStyle, starsText } from '@/lib/format';
import { CoverArt } from '../ui/CoverArt';
import { accentMix } from '@/lib/accentGradient';

const AWARD_LABEL_KEY: Record<string, string> = {
  awardMostActive: 'groups.awardMostActive',
  awardNightOwl: 'groups.awardNightOwl',
  awardHarshestCritic: 'groups.awardHarshestCritic',
  awardGenreExplorer: 'groups.awardGenreExplorer',
  awardStreak: 'groups.awardStreak',
};

export function GroupsScreen({ device }: { device: Device }) {
  const { t, me, albums, liveAlbums, openAlbum, showToast } = useApp();
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [newName, setNewName] = useState('');
  const [inviteHandle, setInviteHandle] = useState('');
  const [creating, setCreating] = useState(false);

  const loadGroups = () => {
    fetch('/api/groups').then((r) => (r.ok ? r.json() : [])).then((d: GroupSummary[]) => {
      setGroups(d);
      setActiveId((cur) => cur && d.some((g) => g.id === cur) ? cur : (d[0]?.id ?? null));
    });
  };

  useEffect(() => { loadGroups(); }, []);

  useEffect(() => {
    if (!activeId) { setDetail(null); return; }
    let cancelled = false;
    setDetail(null);
    fetch(`/api/groups/${activeId}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (!cancelled) setDetail(d); });
    return () => { cancelled = true; };
  }, [activeId]);

  if (!me) return null;

  const createGroup = async () => {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    const res = await fetch('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    setCreating(false);
    if (res.ok) {
      const g = await res.json();
      setNewName('');
      loadGroups();
      setActiveId(g.id);
    } else {
      const body = await res.json().catch(() => null);
      showToast(body?.error === 'group_limit_reached' ? t('groups.limitReached') : t('groups.createFailed'));
    }
  };

  const castVote = async (candidateId: string) => {
    if (!activeId) return;
    const res = await fetch(`/api/groups/${activeId}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidateId }) });
    if (res.ok) {
      fetch(`/api/groups/${activeId}`).then((r) => (r.ok ? r.json() : null)).then(setDetail);
    } else {
      showToast(t('groups.voteFailed'));
    }
  };

  const invite = async () => {
    if (!activeId || !inviteHandle.trim()) return;
    const res = await fetch(`/api/groups/${activeId}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handle: inviteHandle.trim() }) });
    if (res.ok) {
      setInviteHandle('');
      fetch(`/api/groups/${activeId}`).then((r) => (r.ok ? r.json() : null)).then(setDetail);
      loadGroups();
      showToast(t('groups.inviteSuccess'));
    } else {
      const body = await res.json().catch(() => null);
      showToast(
        body?.error === 'not_found' ? t('groups.inviteNotFound')
          : body?.error === 'already_member' ? t('groups.alreadyMember')
          : body?.error === 'group_limit_reached' ? t('groups.inviteeLimitReached')
          : t('groups.inviteFailed')
      );
    }
  };

  const rail = (
    <div className="side" style={{ width: device === 'desktop' ? 240 : '100%' }}>
      <div className="section-head"><h2>{t('groups.yourGroups')}</h2></div>
      {groups === null ? (
        <div className="archive-loading">{t('groups.loading')}</div>
      ) : !groups.length ? (
        <div className="empty-state">{t('groups.noneYet')}</div>
      ) : (
        groups.map((g) => (
          <div key={g.id} className={`friend-row ${g.id === activeId ? 'group-row-active' : ''}`} onClick={() => setActiveId(g.id)} style={{ cursor: 'pointer' }}>
            <div className="info">
              <div className="n">{g.name}</div>
              <div className="h">{t('groups.memberCount', { count: g.memberCount })}</div>
            </div>
          </div>
        ))
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          className="handle-input"
          style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 10px', flex: 1 }}
          placeholder={t('groups.namePlaceholder')}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') createGroup(); }}
        />
        <button className="chip" disabled={creating} onClick={createGroup}>{t('groups.create')}</button>
      </div>
    </div>
  );

  const main = !activeId ? (
    <div className="empty-state">{t('groups.select')}</div>
  ) : !detail ? (
    <div className="archive-loading">{t('groups.loading')}</div>
  ) : (
    <div className="main" style={{ flex: 1, minWidth: 0 }}>
      <h1 className="page-title" style={{ marginBottom: 4 }}>{detail.name}</h1>
      <div className="history-summary">{t('groups.memberCount', { count: detail.members.length })}</div>

      <div className="stat-grid cols-2" style={{ marginBottom: 4 }}>
        {detail.members.map((m) => (
          <div className="box" key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', padding: '10px 12px' }}>
            <div className="avatar-sm" style={{ width: 28, height: 28, ...userAvatarStyle(m) }} />
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
              {m.name}
              {m.isPremium && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--lime)', flexShrink: 0 }} title="Premium" />}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '14px 0 22px' }}>
        <input
          className="handle-input"
          style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 10px', flex: 1 }}
          placeholder={t('groups.inviteHandle')}
          value={inviteHandle}
          onChange={(e) => setInviteHandle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') invite(); }}
        />
        <button className="chip" onClick={invite}>{t('groups.invite')}</button>
      </div>

      {detail.awards.length > 0 && (
        <>
          <div className="section-head"><h2>{t('groups.awards')}</h2></div>
          {detail.awards.map((a, i) => (
            <div className="award-row" key={i}>
              <span className="award-label">{t(AWARD_LABEL_KEY[a.label] as never)}</span>
              <span className="award-name">{a.winner?.name} — {a.detail}</span>
            </div>
          ))}
        </>
      )}

      <div className="section-head" style={{ marginTop: 22 }}><h2>{t('groups.voteOpen')}</h2><span>{detail.vote.monthKey}</span></div>
      <div className="vote-card">
        <div className="vote-question">{t('groups.voteQuestion')}</div>
        {detail.vote.counts.map((c) => (
          <div
            key={c.user.id}
            className={`vote-row ${detail.vote.myVote === c.user.id ? 'voted' : ''}`}
            onClick={() => castVote(c.user.id)}
          >
            <div className="avatar-sm" style={{ width: 26, height: 26, ...userAvatarStyle(c.user) }} />
            <div className="vote-name">{c.user.name}</div>
            <div className="vote-track"><div className="vote-fill" style={{ width: `${detail.vote.counts[0]?.count ? (c.count / detail.vote.counts[0].count) * 100 : 0}%` }} /></div>
            <div className="vote-count">{c.count}</div>
          </div>
        ))}
        <div className="vote-hint">{detail.vote.myVote ? t('groups.voteChangeHint') : t('groups.voteHint')}</div>
      </div>

      <div className="section-head" style={{ marginTop: 22 }}><h2>{t('groups.activity')}</h2></div>
      {detail.activity.length ? detail.activity.map((ev, i) => {
        const a = liveAlbums[ev.albumId] || albums.find((x) => x.id === ev.albumId);
        return (
          <div className="activity-item" key={i} onClick={() => a && openAlbum(a.id)}>
            <CoverArt url={a?.cover} fallbackLetter={ev.user.name[0] || '?'} className="thumb" />
            <div className="body">
              <div><b>{ev.user.name}</b> {ev.type === 'review' ? t('groups.wroteAbout') : t('groups.rated')} {a ? a.title : '…'}</div>
              <span className="stars-dot" style={{ color: accentMix(ev.stars / 5) }}>{starsText(ev.stars)} {ev.stars.toFixed(1)}</span>
            </div>
          </div>
        );
      }) : <div className="empty-state">{t('groups.noActivity')}</div>}
    </div>
  );

  const leaderboard = detail && (
    <div className="side" style={{ width: device === 'desktop' ? 260 : '100%' }}>
      <div className="section-head"><h2>{t('groups.leaderboard')}</h2></div>
      {detail.leaderboard.map((row, i) => (
        <div className="list-row" key={row.user.id}>
          <span className="rank">{i + 1}</span>
          <div className="avatar-sm" style={{ width: 30, height: 30, ...userAvatarStyle(row.user) }} />
          <div className="info" style={{ flex: 1 }}><div className="t">{row.user.name}</div></div>
          <span style={{ fontFamily: 'var(--font-ibm-plex-mono),monospace', fontSize: 11, color: 'var(--muted)' }}>{row.hours}h</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="eyebrow">{t('groups.eyebrow')}</div>
      <h1 className="page-title">{t('groups.title')}</h1>
      {device === 'desktop' ? (
        <div className="d-profile-layout">
          {rail}
          {main}
          {leaderboard}
        </div>
      ) : (
        <>
          {rail}
          {main}
          {leaderboard}
        </>
      )}
    </>
  );
}

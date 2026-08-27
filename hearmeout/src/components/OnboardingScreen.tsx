'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { CoverArt } from './ui/CoverArt';
import { StarPicker } from './ui/StarPicker';
import { LogoMark } from './ui/Icons';
import { ConnectBlock, ImportHistoryBlock } from './ProfileBlocks';

type PersonResult = { id: string; name: string; handle: string; avatarUrl: string | null };

function FindPeopleStep() {
  const { t, me, friendRequests, addFriend } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PersonResult[] | null>(null);

  const search = (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults(null); return; }
    fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`).then((r) => (r.ok ? r.json() : [])).then(setResults);
  };

  if (!me) return null;

  return (
    <div className="onb-block">
      <div className="onb-block-label">{t('onboarding.findPeople')}</div>
      <input
        className="handle-input"
        style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', width: '100%', marginBottom: 10 }}
        placeholder={t('onboarding.findPeoplePlaceholder')}
        value={query}
        onChange={(e) => search(e.target.value)}
      />
      {results && results.map((p) => {
        const isFriend = me.friends.some((f) => f.id === p.id);
        const isPending = friendRequests.outgoing.some((r) => r.user.id === p.id);
        return (
          <div className="friend-row" key={p.id}>
            <div className="info"><div className="n">{p.name}</div><div className="h">{p.handle}</div></div>
            {isFriend ? <span className="chip" style={{ opacity: 0.6 }}>{t('friend.alreadyFriend')}</span>
              : isPending ? <span className="chip" style={{ opacity: 0.6 }}>{t('friend.requestSent')}</span>
              : <button onClick={() => addFriend(p.handle)}>{t('friend.addThem')}</button>}
          </div>
        );
      })}
    </div>
  );
}

function CalibrateStep() {
  const { t, albums, spotifyCovers, myRatings, publishRating } = useApp();
  const picks = useMemo(() => [...albums].sort(() => 0.5 - Math.random()).slice(0, 3), [albums]);
  const [values, setValues] = useState<Record<string, number>>({});

  return (
    <div className="onb-block">
      <div className="onb-block-label">{t('onboarding.calibrate')}</div>
      {picks.map((a) => {
        const already = myRatings.find((r) => r.albumId === a.id);
        const val = values[a.id] ?? already?.stars ?? 0;
        return (
          <div key={a.id} className="onb-calibrate-row">
            <CoverArt url={spotifyCovers[a.id] || a.cover} fallbackLetter={a.artist[0] || '?'} className="art-sm" />
            <div className="onb-calibrate-info">
              <div className="t">{a.title}</div>
              <div className="a">{a.artist}</div>
              <StarPicker
                value={val}
                onChange={(v) => {
                  setValues((s) => ({ ...s, [a.id]: v }));
                  publishRating(a.id, v, '');
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function OnboardingScreen() {
  const { t, me, dismissOnboarding } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  if (!me) return null;

  return (
    <div className="onb-overlay">
      <div className="onb-card">
        <div className="onb-top">
          <div className="d-logo"><LogoMark />Hear<span>Me</span>Out</div>
          <div className="onb-step-label">{t('onboarding.stepLabel', { step, total: 2 })}</div>
        </div>
        <div className="onb-progress"><div className={`onb-seg ${step >= 1 ? 'on' : ''}`} /><div className={`onb-seg ${step >= 2 ? 'on' : ''}`} /></div>

        {step === 1 ? (
          <>
            <div className="eyebrow">{t('onboarding.connectLabel')}</div>
            <h1 className="page-title">{t('onboarding.connectTitle')}</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20, maxWidth: 420 }}>{t('onboarding.connectBody')}</p>
            <ConnectBlock />
            <div style={{ marginTop: 12 }}><ImportHistoryBlock /></div>
          </>
        ) : (
          <>
            <div className="eyebrow">{t('onboarding.peopleLabel')}</div>
            <h1 className="page-title">{t('onboarding.peopleTitle')}</h1>
            <FindPeopleStep />
            <CalibrateStep />
          </>
        )}

        <div className="onb-footer">
          {step === 1 ? (
            <>
              <button className="btn-primary" style={{ marginBottom: 0 }} onClick={() => setStep(2)}>{t('onboarding.continue')}</button>
              <button className="onb-skip" onClick={() => setStep(2)}>{t('onboarding.skip')}</button>
            </>
          ) : (
            <>
              <button className="btn-primary" style={{ marginBottom: 0 }} onClick={dismissOnboarding}>{t('onboarding.finish')}</button>
              <button className="onb-skip" onClick={dismissOnboarding}>{t('onboarding.skip')}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

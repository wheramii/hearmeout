'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device, StatsData, StatsRange } from '@/lib/types';
import { CoverArt } from '../ui/CoverArt';
import { HeartIcon } from '../ui/Icons';
import { PremiumLock } from '../ui/PremiumLock';
import { accentMix } from '@/lib/accentGradient';
import { toLocale, type Language } from '@/lib/i18n';

const RANGES: StatsRange[] = ['4w', '6m', 'year', 'all'];
const RANGE_KEY: Record<StatsRange, string> = { '4w': 'stats.range4w', '6m': 'stats.range6m', year: 'stats.rangeYear', all: 'stats.rangeAll' };

// Static filler shapes for the blurred locked preview behind PremiumLock —
// never real data, just something chart-shaped for a non-premium viewer to
// see dimmed. Real data for both charts never reaches a non-premium request
// (see /api/stats): this is purely decorative.
const PLACEHOLDER_WEEK = [3, 5, 4, 7, 4, 6, 3, 8, 5, 6, 4, 5];
const PLACEHOLDER_HEATMAP = [1, 1, 0, 0, 0, 0, 1, 3, 5, 6, 7, 8, 9, 8, 7, 6, 7, 8, 9, 8, 6, 4, 2, 1];

// weekLabel from the API is the Monday-anchored ISO date of the week —
// shown as a short local date so "which week is this" is never a mystery.
function weekLabelText(weekLabel: string, language: Language): string {
  return new Date(weekLabel).toLocaleDateString(toLocale(language), { day: '2-digit', month: 'short' });
}

// A real GitHub-style year grid of listening intensity, premium-only. The
// fetch only happens for an already-premium account — a non-premium viewer
// never even requests /api/stats/calendar (it would 403 server-side anyway;
// no point spending the request), PremiumLock just shows a static, unlit
// placeholder grid behind the lock overlay instead.
function CalendarHeatmap() {
  const { t, me, language } = useApp();
  const [days, setDays] = useState<{ day: string; minutes: number }[] | null>(null);

  useEffect(() => {
    if (!me?.isPremium) return;
    let cancelled = false;
    fetch('/api/stats/calendar').then((r) => (r.ok ? r.json() : null)).then((d) => { if (!cancelled && d) setDays(d.days); });
    return () => { cancelled = true; };
  }, [me?.isPremium]);

  const byDay = new Map((days || []).map((d) => [d.day, d.minutes]));
  const maxMinutes = Math.max(1, ...(days || []).map((d) => d.minutes));
  const cells: { day: string; minutes: number }[] = [];
  const cursor = new Date();
  cursor.setFullYear(cursor.getFullYear() - 1);
  cursor.setDate(cursor.getDate() + 1);
  for (let i = 0; i < 371; i++) {
    const key = cursor.toISOString().slice(0, 10);
    cells.push({ day: key, minutes: byDay.get(key) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return (
    <>
      <div className="section-head" style={{ marginTop: 22 }}><h2>{t('stats.calendarTitle')}</h2></div>
      <PremiumLock label={t('stats.calendarLocked')}>
        <p className="history-chart-caption">{t('stats.calendarCaption')}</p>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(53,10px)', gridAutoRows: '10px', gap: 3, width: 'max-content' }}>
            {cells.map((c, i) => {
              const color = c.minutes ? accentMix(c.minutes / maxMinutes) : 'var(--surface-2)';
              const dateLabel = new Date(c.day).toLocaleDateString(toLocale(language), { day: '2-digit', month: 'short', year: 'numeric' });
              // The grid is 53 columns wide, filled row-major — a tooltip
              // anchored above the cell (the default) would get clipped by
              // the section above it for the top couple of rows, so those
              // flip to opening below the cursor instead.
              const isTopRow = Math.floor(i / 53) < 2;
              return (
                <div
                  key={c.day}
                  className={`cal-cell ${isTopRow ? 'cal-cell-below' : ''}`}
                  data-tooltip={`${dateLabel}: ${c.minutes} ${t('recap.minutes')}`}
                  style={{
                    width: 10, height: 10, borderRadius: 2, background: color,
                    ['--tt-color' as string]: c.minutes ? color : 'var(--muted)',
                  } as CSSProperties}
                />
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 10.5, color: 'var(--muted)' }}>
          <span>{t('stats.calendarLess')}</span>
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <span key={r} style={{ width: 10, height: 10, borderRadius: 2, background: accentMix(r), display: 'inline-block' }} />
          ))}
          <span>{t('stats.calendarMore')}</span>
        </div>
      </PremiumLock>
    </>
  );
}

export function StatsScreen(_props: { device: Device }) {
  const { t, language, me, lovedItems, toggleLoved } = useApp();
  const [range, setRange] = useState<StatsRange>('6m');
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    setData(null);
    fetch(`/api/stats?range=${range}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (!cancelled) setData(d); });
    return () => { cancelled = true; };
  }, [range, me]);

  if (!me) return null;

  const maxWeek = me?.isPremium ? Math.max(1, ...(data?.hoursPerWeek.map((w) => w.hours) ?? [1])) : Math.max(...PLACEHOLDER_WEEK);
  const maxArtistHours = Math.max(1, ...(data?.topArtists.map((a) => a.hours) ?? [1]));
  const maxHeat = me?.isPremium ? Math.max(1, ...(data?.heatmap ?? [1])) : Math.max(...PLACEHOLDER_HEATMAP);

  return (
    <>
      <div className="eyebrow">{t('stats.eyebrow')}</div>
      <h1 className="page-title">{t('stats.title')}</h1>
      <div className="chips">
        {RANGES.map((r) => (
          <button key={r} className={`chip ${range === r ? 'on' : ''}`} onClick={() => setRange(r)}>{t(RANGE_KEY[r] as never)}</button>
        ))}
      </div>

      {!data ? (
        <div className="archive-loading">{t('stats.loading')}</div>
      ) : data.trackCount === 0 ? (
        <div className="empty-state">{t('stats.empty')}</div>
      ) : (
        <>
          <div className="recap-stats-row" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(90px,1fr))' }}>
            <div className="recap-stat"><div className="rv" style={{ color: accentMix(0) }}>{data.hours}</div><div className="rl">{t('stats.hours')}</div></div>
            <div className="recap-stat"><div className="rv" style={{ color: accentMix(0.25) }}>{data.trackCount.toLocaleString(toLocale(language))}</div><div className="rl">{t('stats.tracks')}</div></div>
            <div className="recap-stat"><div className="rv" style={{ color: accentMix(0.5) }}>{data.artistCount}</div><div className="rl">{t('stats.artists')}</div></div>
            <div className="recap-stat"><div className="rv" style={{ color: accentMix(0.75) }}>{data.avgRating || '—'}</div><div className="rl">{t('history.avg')}</div></div>
            <div className="recap-stat" style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
              <div className="rv" style={{ color: accentMix(1) }}>{data.peakHour != null ? `${String(data.peakHour).padStart(2, '0')}:00` : '—'}</div>
              <div className="rl">{t('stats.peakHour')}</div>
            </div>
          </div>

          <div className="section-head" style={{ marginTop: 26 }}><h2>{t('stats.hoursPerWeek')}</h2></div>
          <PremiumLock label={t('stats.hoursPerWeekLocked')}>
            {!me.isPremium ? (
              <div className="rating-dist-chart" style={{ height: 90, marginBottom: 26 }}>
                {PLACEHOLDER_WEEK.map((h, i) => (
                  <div key={i} className="rating-dist-bar" style={{ height: `${Math.max(6, (h / maxWeek) * 100)}%`, background: accentMix(h / maxWeek) }} />
                ))}
              </div>
            ) : data.hoursPerWeek.length >= 2 ? (
              <>
                <p className="history-chart-caption">{t('stats.hoursPerWeekCaption')}</p>
                <div className="rating-dist-chart" style={{ height: 90, marginBottom: 6 }}>
                  {data.hoursPerWeek.map((w, i) => (
                    <div key={i} className="rating-dist-bar" style={{ height: `${w.hours ? Math.max(6, (w.hours / maxWeek) * 100) : 0}%`, background: accentMix(w.hours / maxWeek) }} title={`${weekLabelText(w.weekLabel, language)}: ${w.hours}h`} />
                  ))}
                </div>
                <div className="rating-dist-axis" style={{ marginBottom: 26 }}>
                  {data.hoursPerWeek.map((w, i) => {
                    const step = data.hoursPerWeek.length > 8 ? 3 : 1;
                    return <span key={i}>{i % step === 0 || i === data.hoursPerWeek.length - 1 ? weekLabelText(w.weekLabel, language) : ''}</span>;
                  })}
                </div>
              </>
            ) : data.hoursPerWeek.length === 1 ? (
              <p className="history-chart-caption" style={{ marginBottom: 26 }}>
                {t('stats.hoursPerWeekSingle', { label: weekLabelText(data.hoursPerWeek[0].weekLabel, language), hours: data.hoursPerWeek[0].hours })}
              </p>
            ) : <div className="empty-state">{t('stats.notEnough')}</div>}
          </PremiumLock>

          <div className="section-head"><h2>{t('stats.topArtists')}</h2></div>
          {data.topArtists.length ? data.topArtists.map((a, i) => (
            <div className="list-row" key={a.id || a.name}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <CoverArt url={a.cover ?? undefined} fallbackLetter={a.name[0] || '?'} className="cover-thumb-sm" />
              <div className="info" style={{ flex: 1 }}>
                <div className="t">{a.name}</div>
                <div className="track" style={{ height: 5, marginTop: 4 }}><div className="fill" style={{ width: `${(a.hours / maxArtistHours) * 100}%`, background: accentMix(a.hours / maxArtistHours) }} /></div>
              </div>
              <span className="history-badge" style={{ background: 'none', border: 'none', color: 'var(--muted)' }}>{t('stats.playsCount', { count: a.plays })}</span>
            </div>
          )) : <div className="empty-state">{t('stats.notEnough')}</div>}

          <div className="section-head" style={{ marginTop: 22 }}><h2>{t('stats.whenYouListen')}</h2></div>
          <PremiumLock label={t('stats.whenYouListenLocked')}>
            <div className="stats-heatmap">
              {(me.isPremium ? data.heatmap : PLACEHOLDER_HEATMAP).map((n, h) => (
                <div key={h} className="stats-heat-cell" style={{ background: accentMix(n / maxHeat), opacity: n ? 1 : 0.15 }} title={me.isPremium ? `${h}:00 — ${n}` : undefined} />
              ))}
            </div>
            <div className="stats-heatmap-axis"><span>00</span><span>08</span><span>16</span><span>23</span></div>
          </PremiumLock>

          <CalendarHeatmap />

          {data.genreSplit.length > 0 && (
            <>
              <div className="section-head" style={{ marginTop: 22 }}><h2>{t('stats.genreSplit')}</h2></div>
              <div className="stats-genre-bar">
                {data.genreSplit.map((g, i) => (
                  <div key={g.genre} className="stats-genre-seg" style={{ width: `${g.pct}%`, background: accentMix(i / Math.max(1, data.genreSplit.length - 1)) }} />
                ))}
              </div>
              <div className="stats-genre-legend">
                {data.genreSplit.map((g, i) => (
                  <span key={g.genre}><i style={{ background: accentMix(i / Math.max(1, data.genreSplit.length - 1)) }} />{g.genre} · {g.pct}%</span>
                ))}
              </div>
            </>
          )}

          <div className="section-head" style={{ marginTop: 22 }}><h2>{t('stats.recentPlays')}</h2></div>
          {data.recentPlays.map((p, i) => {
            const loved = lovedItems.some((li) => li.type === 'track' && li.title === p.title && li.artist === p.artist);
            return (
              <div className="activity-item" key={i} style={{ cursor: 'default' }}>
                <CoverArt url={p.cover ?? undefined} fallbackLetter={p.artist[0] || '?'} className="thumb" />
                <div className="body">
                  <div><b>{p.title}</b> — {p.artist}</div>
                  <div className="when">{new Date(p.playedAt).toLocaleString(toLocale(language), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <button
                  className="heart-toggle"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: loved ? 'var(--coral)' : 'var(--muted)', padding: 6, flexShrink: 0 }}
                  onClick={() => toggleLoved('track', p.title, p.artist, p.trackId, p.cover)}
                  aria-label={t('stats.loveTrack')}
                >
                  <span style={{ display: 'block', width: 18, height: 18 }}><HeartIcon filled={loved} /></span>
                </button>
              </div>
            );
          })}
        </>
      )}
    </>
  );
}

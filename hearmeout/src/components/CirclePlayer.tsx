'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchTrackPreview } from '@/lib/deezer';
import { LogoMark, PlayIcon } from './ui/Icons';
import { stopOthers, releaseIfCurrent } from '@/lib/audioRegistry';

type Status = 'loading' | 'ready' | 'unavailable';

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// A compact circular progress ring (30s Deezer preview) with a play button
// centered in it — tapping it starts playback and swaps the button for the
// HearMeOut mark, whose bars bounce like an equalizer while playing.
// Autoplay isn't used here: both the mobile and desktop shells stay mounted
// at once (only one is visible via CSS), so autoplaying would start two
// overlapping audio streams for the same track.
export function CirclePlayer({ artist, title, size = 56, className }: {
  artist: string;
  title: string;
  size?: number;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>('loading');
  const [preview, setPreview] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setPreview(null);
    setPlaying(false);
    setProgress(0);
    fetchTrackPreview(artist, title)
      .then((tr) => {
        if (cancelled) return;
        if (!tr) { setStatus('unavailable'); return; }
        setPreview(tr.preview);
        setStatus('ready');
      })
      .catch(() => { if (!cancelled) setStatus('unavailable'); });
    return () => { cancelled = true; };
  }, [artist, title]);

  useEffect(() => {
    const el = audioRef.current;
    return () => { if (el) releaseIfCurrent(el); };
  });

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      stopOthers(el);
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  };

  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      className={`circle-player ${className || ''}`.trim()}
      style={{ width: size, height: size }}
      onClick={status === 'ready' ? toggle : undefined}
      role={status === 'ready' ? 'button' : undefined}
      aria-label={status === 'ready' ? (playing ? 'Pause' : 'Play') : undefined}
    >
      <svg viewBox="0 0 100 100" className="circle-player-ring">
        <circle className="cp-track" cx="50" cy="50" r={RADIUS} />
        {status === 'ready' && (
          <circle
            className="cp-progress"
            cx="50"
            cy="50"
            r={RADIUS}
            style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: offset }}
          />
        )}
      </svg>
      <div className={`circle-player-center ${status !== 'ready' ? 'dim' : ''}`.trim()}>
        {playing ? <LogoMark animate size={Math.round(size * 0.4)} /> : <PlayIcon size={Math.round(size * 0.36)} />}
      </div>
      {preview && (
        <audio
          ref={audioRef}
          src={preview}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el.duration) setProgress(el.currentTime / el.duration);
          }}
        />
      )}
    </div>
  );
}

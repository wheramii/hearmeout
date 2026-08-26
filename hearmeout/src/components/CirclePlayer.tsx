'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchTrackPreview } from '@/lib/deezer';
import { LogoMark } from './ui/Icons';

type Status = 'loading' | 'ready' | 'unavailable';

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// A compact circular progress ring (30s Deezer preview) with the HearMeOut
// mark centered in it — the mark's bars bounce like an equalizer while
// playing. Autoplay is attempted on mount; browsers that block unmuted
// autoplay just leave it paused until the ring itself is tapped.
export function CirclePlayer({ artist, title, size = 56, autoPlay = true, className }: {
  artist: string;
  title: string;
  size?: number;
  autoPlay?: boolean;
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
    if (status !== 'ready' || !autoPlay || !audioRef.current) return;
    audioRef.current.play().catch(() => {
      // Autoplay-with-sound blocked by the browser — needs an explicit tap.
    });
  }, [status, autoPlay]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
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
      <div className="circle-player-center">
        <LogoMark animate={playing} size={Math.round(size * 0.4)} />
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

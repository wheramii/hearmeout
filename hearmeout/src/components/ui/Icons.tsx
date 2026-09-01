// Wavy "splat star" + pulse line, traced from the reference logo the user
// supplied (6 puffy rounded lobes + a heartbeat-style pulse crossing it).
// Star and pulse follow the active accent theme (--lime/--coral) like the
// rest of the site's data-colored elements; the inner spot deliberately
// does NOT — it's var(--bg), so it always reads as a cutout of the page
// itself, matching whichever of the two permanent light/dark themes is
// active (independent of the accent-color/toxicity choice, which is a
// separate axis — see globals.css [data-theme] vs [data-accent]). The
// paths are generated via a Catmull-Rom spline script (not hand-drawn) for
// smooth curves, tuned to match the reference's proportions.
export function LogoMark({ size = 24, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ flexShrink: 0 }}
      className={animate ? 'logo-mark playing' : 'logo-mark'}
    >
      <path
        className="logo-star"
        fill="var(--lime)"
        d="M 48.46 6.03 C 53.37 6.19 58.24 23.66 64.38 27.86 C 70.52 32.06 83.12 27.77 85.32 31.22 C 87.52 34.67 77.18 41.95 77.56 48.56 C 77.94 55.16 90.18 66.81 87.61 70.85 C 85.03 74.88 68.74 69.43 62.11 72.78 C 55.49 76.13 52.08 90.59 47.85 90.94 C 43.63 91.30 42.62 77.84 36.76 74.90 C 30.90 71.96 14.88 77.54 12.69 73.32 C 10.49 69.09 23.04 56.96 23.60 49.54 C 24.17 42.12 14.18 32.58 16.08 28.80 C 17.97 25.02 29.57 30.65 34.97 26.85 C 40.37 23.06 43.56 5.86 48.46 6.03 Z"
      />
      <path
        className="logo-spot"
        fill="var(--bg)"
        d="M 54.87 50.60 C 54.43 51.90 49.83 50.75 47.82 52.34 C 45.81 53.93 44.10 60.42 42.78 60.15 C 41.47 59.87 41.55 52.62 39.94 50.68 C 38.32 48.75 33.67 49.85 33.09 48.54 C 32.51 47.22 35.80 45.17 36.45 42.81 C 37.10 40.44 35.62 34.98 36.98 34.35 C 38.34 33.72 42.14 38.57 44.60 39.03 C 47.06 39.48 50.76 36.17 51.73 37.08 C 52.70 38.00 49.91 42.25 50.43 44.51 C 50.95 46.76 55.30 49.29 54.87 50.60 Z"
      />
      <path
        className="logo-pulse"
        fill="none"
        stroke="var(--coral)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M0 50 L12 50 L18 42 L24 50 L30 50 L38 50 L43 20 L48 80 L53 50 L60 50 L66 50 L72 38 L78 50 L84 50 L100 50"
      />
    </svg>
  );
}

export function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.1L2 10.5V21a1 1 0 0 0 1 1h6v-7h6v7h6a1 1 0 0 0 1-1V10.5L12 2.1z" />
    </svg>
  );
}

export function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8.5" cy="8" r="3.3" />
      <path d="M2 20c0-3.7 2.9-6.2 6.5-6.2S15 16.3 15 20z" />
      <circle cx="17" cy="8.7" r="2.6" />
      <path d="M14 20c.3-2.8 1.9-4.9 4.3-5.7 2.7.6 4.7 2.9 4.7 5.7z" />
    </svg>
  );
}

export function BarsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="12" width="4" height="9" rx="1.2" />
      <rect x="10" y="5" width="4" height="16" rx="1.2" />
      <rect x="16" y="9" width="4" height="12" rx="1.2" />
    </svg>
  );
}

export function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  );
}

export function CompassSearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M11 4a7 7 0 104.65 12.24l4.05 4.06a1 1 0 001.42-1.42l-4.06-4.05A7 7 0 0011 4zm-5 7a5 5 0 1110 0 5 5 0 01-10 0z" />
    </svg>
  );
}

export function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.2l7.1-.6L12 2z" />
    </svg>
  );
}

export function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z" />
    </svg>
  );
}

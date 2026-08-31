// The site's two accent tokens (--lime, --coral — or whichever palette the
// account picked, see globals.css [data-accent]) were only ever used as a
// single color everywhere, with --coral appearing in a handful of gradient
// backgrounds. This maps a 0..1 ratio onto a real mix of both, so charts
// and ratings actually use both halves of the palette instead of one.
// color-mix() reads the CSS variables directly, so it stays correct for
// every palette (default or premium) with no JS color math involved.
// Mixed in HSL (shortest hue path), not sRGB — interpolating two hues in
// RGB drags mid-range values through a muddy gray; HSL keeps them vivid.
export function accentMix(ratio: number): string {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return `color-mix(in hsl shorter hue, var(--coral) ${pct}%, var(--lime))`;
}

// For a set of values (e.g. one bar chart) — 0 at the smallest value in the
// set, 1 at the largest, so the spread of colors reflects that specific
// chart's own range rather than an arbitrary fixed scale.
export function accentMixForValue(value: number, min: number, max: number): string {
  if (max <= min) return accentMix(0.5);
  return accentMix((value - min) / (max - min));
}

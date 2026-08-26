// Every screen stays mounted at once (both device shells, every catalog
// screen) — only CSS hides the inactive ones. That means a <audio> element
// a user started playing keeps running in the background after they
// navigate away, and a second CirclePlayer started elsewhere would overlap
// it. This is a plain module-level singleton (not React state) specifically
// so it works across completely unrelated component trees: whoever starts
// playing calls stopOthers() first, unconditionally pausing whatever was
// previously playing anywhere on the page.
let current: HTMLAudioElement | null = null;

export function stopOthers(playingNow: HTMLAudioElement) {
  if (current && current !== playingNow && !current.paused) {
    current.pause();
  }
  current = playingNow;
}

export function releaseIfCurrent(audio: HTMLAudioElement) {
  if (current === audio) current = null;
}

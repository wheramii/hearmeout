export type ThemeId =
  | 'orange-coral' | 'lime-magenta' | 'cyan-yellow' | 'cobalt-pink' | 'mint-rose'
  | 'teal-amber' | 'purple-lime' | 'scarlet-cyan' | 'yellow-purple' | 'green-orange'
  | 'indigo-peach' | 'turquoise-coral' | 'chartreuse-cobalt' | 'pink-mint' | 'sky-tangerine'
  | 'emerald-fuchsia' | 'lavender-chartreuse' | 'rust-sage' | 'ice-crimson' | 'gold-aqua';

export type Toxicity = 'calm' | 'bright' | 'acid';

export const THEME_ORDER: ThemeId[] = [
  'orange-coral', 'lime-magenta', 'cyan-yellow', 'cobalt-pink', 'mint-rose',
  'teal-amber', 'purple-lime', 'scarlet-cyan', 'yellow-purple', 'green-orange',
  'indigo-peach', 'turquoise-coral', 'chartreuse-cobalt', 'pink-mint', 'sky-tangerine',
  'emerald-fuchsia', 'lavender-chartreuse', 'rust-sage', 'ice-crimson', 'gold-aqua',
];

export const TOXICITY_ORDER: Toxicity[] = ['calm', 'bright', 'acid'];

type Pair = { lime: string; coral: string };

// The 60 lime/coral pairs, transcribed from the design spec (THEMES.md §5).
// orange-coral/bright is the one deliberate deviation from that spec: its
// table value (#F0955F/#D9824D) doesn't match the color actually shipping
// today (#D98A5F/#C07B52) — using the real shipped value here means an
// account that's never touched the picker sees zero visual change.
export const THEME_PAIRS: Record<ThemeId, Record<Toxicity, Pair>> = {
  'orange-coral': {
    calm: { lime: '#C8A089', coral: '#BA8C6D' },
    bright: { lime: '#D98A5F', coral: '#C07B52' },
    acid: { lime: '#FC7B03', coral: '#C75E00' },
  },
  'lime-magenta': {
    calm: { lime: '#B8C889', coral: '#C37FA3' },
    bright: { lime: '#C5EC51', coral: '#EA439C' },
    acid: { lime: '#D0FF42', coral: '#FF2499' },
  },
  'cyan-yellow': {
    calm: { lime: '#7FBCC3', coral: '#C8C289' },
    bright: { lime: '#43D9EA', coral: '#ECDF51' },
    acid: { lime: '#24E9FF', coral: '#FFEF42' },
  },
  'cobalt-pink': {
    calm: { lime: '#7F93C3', coral: '#C37F95' },
    bright: { lime: '#4375EA', coral: '#EA437B' },
    acid: { lime: '#2465FF', coral: '#FF246D' },
  },
  'mint-rose': {
    calm: { lime: '#7FC3AA', coral: '#C37F8C' },
    bright: { lime: '#43EAAD', coral: '#EA4364' },
    acid: { lime: '#24FFAF', coral: '#FF2450' },
  },
  'teal-amber': {
    calm: { lime: '#7FC3BE', coral: '#C8B589' },
    bright: { lime: '#43EADF', coral: '#ECBD51' },
    acid: { lime: '#24FFF0', coral: '#FFC642' },
  },
  'purple-lime': {
    calm: { lime: '#B27FC3', coral: '#B1C889' },
    bright: { lime: '#C043EA', coral: '#B3EC51' },
    acid: { lime: '#C824FF', coral: '#BAFF42' },
  },
  'scarlet-cyan': {
    calm: { lime: '#C3887F', coral: '#7FB7C3' },
    bright: { lime: '#EA5943', coral: '#43CEEA' },
    acid: { lime: '#FF4124', coral: '#24DAFF' },
  },
  'yellow-purple': {
    calm: { lime: '#C8BF89', coral: '#BA7FC3' },
    bright: { lime: '#ECD751', coral: '#D443EA' },
    acid: { lime: '#FFE642', coral: '#E224FF' },
  },
  'green-orange': {
    calm: { lime: '#7FC393', coral: '#C39A7F' },
    bright: { lime: '#43EA75', coral: '#EA8643' },
    acid: { lime: '#24FF65', coral: '#FF7B24' },
  },
  'indigo-peach': {
    calm: { lime: '#857FC3', coral: '#C3937F' },
    bright: { lime: '#5443EA', coral: '#EA7543' },
    acid: { lime: '#3A24FF', coral: '#FF6524' },
  },
  'turquoise-coral': {
    calm: { lime: '#7FC3B5', coral: '#C38C7F' },
    bright: { lime: '#43EAC9', coral: '#EA6443' },
    acid: { lime: '#24FFD3', coral: '#FF5024' },
  },
  'chartreuse-cobalt': {
    calm: { lime: '#BFC889', coral: '#7F8CC3' },
    bright: { lime: '#D7EC51', coral: '#4364EA' },
    acid: { lime: '#E6FF42', coral: '#2450FF' },
  },
  'pink-mint': {
    calm: { lime: '#C37F9B', coral: '#7FC3A3' },
    bright: { lime: '#EA4389', coral: '#43EA9C' },
    acid: { lime: '#FF247F', coral: '#24FF99' },
  },
  'sky-tangerine': {
    calm: { lime: '#7FACC3', coral: '#C3A37F' },
    bright: { lime: '#43B2EA', coral: '#EA9C43' },
    acid: { lime: '#24B6FF', coral: '#FF9924' },
  },
  'emerald-fuchsia': {
    calm: { lime: '#7FC39E', coral: '#C37FAE' },
    bright: { lime: '#43EA91', coral: '#EA43B8' },
    acid: { lime: '#24FF8A', coral: '#FF24BD' },
  },
  'lavender-chartreuse': {
    calm: { lime: '#987FC3', coral: '#BBC889' },
    bright: { lime: '#8043EA', coral: '#CDEC51' },
    acid: { lime: '#7424FF', coral: '#D9FF42' },
  },
  'rust-sage': {
    calm: { lime: '#C3917F', coral: '#81C37F' },
    bright: { lime: '#EA6F43', coral: '#48EA43' },
    acid: { lime: '#FF5E24', coral: '#2BFF24' },
  },
  'ice-crimson': {
    calm: { lime: '#7FB5C3', coral: '#C37F88' },
    bright: { lime: '#43C9EA', coral: '#EA4359' },
    acid: { lime: '#24D3FF', coral: '#FF2441' },
  },
  'gold-aqua': {
    calm: { lime: '#C8B789', coral: '#7FC3BC' },
    bright: { lime: '#ECC251', coral: '#43EAD9' },
    acid: { lime: '#FFCD42', coral: '#24FFE9' },
  },
};

export function isThemeId(v: string | null | undefined): v is ThemeId {
  return !!v && (THEME_ORDER as string[]).includes(v);
}

export function isToxicity(v: string | null | undefined): v is Toxicity {
  return v === 'calm' || v === 'bright' || v === 'acid';
}

// WCAG relative luminance, used to pick readable ink for a solid fill of
// this color (the segmented-control active state, badges, etc.) — computed
// per pair instead of hand-picked, since there are 60 of them.
function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function onAccentFor(hex: string): string {
  return relativeLuminance(hex) > 0.42 ? '#1F1D1C' : '#F7F2E9';
}

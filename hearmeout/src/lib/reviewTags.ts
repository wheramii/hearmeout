import type { TranslationKey } from './i18n';

export type ReviewTagId =
  | 'banger' | 'onRepeat' | 'sleptOn' | 'noSkips' | 'obsession' | 'wouldListenAgain'
  | 'lateNightDrive' | 'crunchy' | 'grower' | 'oneAndDone' | 'backgroundNoise'
  | 'needsVolume' | 'headphonesOnly' | 'comfortAlbum' | 'gymAnthem' | 'overhyped'
  | 'underrated' | 'fillerTracks';

// Fixed vocabulary, not free-form — a real distribution to aggregate per
// album needs everyone drawing from the same small set of words. Order here
// is render order in the picker.
export const REVIEW_TAG_ORDER: ReviewTagId[] = [
  'banger', 'onRepeat', 'sleptOn', 'noSkips', 'obsession', 'wouldListenAgain',
  'lateNightDrive', 'crunchy', 'grower', 'oneAndDone', 'backgroundNoise',
  'needsVolume', 'headphonesOnly', 'comfortAlbum', 'gymAnthem', 'overhyped',
  'underrated', 'fillerTracks',
];

export const MAX_REVIEW_TAGS = 5;

export const REVIEW_TAG_LABEL_KEY: Record<ReviewTagId, TranslationKey> = {
  banger: 'tag.banger',
  onRepeat: 'tag.onRepeat',
  sleptOn: 'tag.sleptOn',
  noSkips: 'tag.noSkips',
  obsession: 'tag.obsession',
  wouldListenAgain: 'tag.wouldListenAgain',
  lateNightDrive: 'tag.lateNightDrive',
  crunchy: 'tag.crunchy',
  grower: 'tag.grower',
  oneAndDone: 'tag.oneAndDone',
  backgroundNoise: 'tag.backgroundNoise',
  needsVolume: 'tag.needsVolume',
  headphonesOnly: 'tag.headphonesOnly',
  comfortAlbum: 'tag.comfortAlbum',
  gymAnthem: 'tag.gymAnthem',
  overhyped: 'tag.overhyped',
  underrated: 'tag.underrated',
  fillerTracks: 'tag.fillerTracks',
};

export function isReviewTagId(v: string): v is ReviewTagId {
  return (REVIEW_TAG_ORDER as string[]).includes(v);
}

export type Album = {
  id: string;
  spotifyId?: string;
  title: string;
  artist: string;
  artistId?: string | null;
  year: number;
  genre: string;
  genreBucket: string;
  cover?: string;
  unknown?: boolean;
  listeners?: string;
  tracklist: string[];
};

// Live aggregate from the `ratings` table (album_ratings view) — replaces
// the prototype's hardcoded Album.rating/ratingsCount.
export type AlbumRatingInfo = { avg: number; count: number };

export type AlbumReview = {
  stars: number;
  review: string;
  user: { name: string; handle: string; avatarUrl: string | null };
};

export type RecapPeriod = 'day' | 'month' | 'season';

export type RecapArtistRef = { id: string | null; name: string; cover: string | null };
export type RecapTrackRef = { title: string; artist: string; albumId: string | null; cover: string | null };

export type RecapData = {
  topArtists: RecapArtistRef[];
  topSongs: RecapTrackRef[];
  topGenres: string[];
  minutes: number;
  uniqueArtists: number;
  trackCount: number;
};

export type ApiUser = { id: string; name: string; handle: string; avatarUrl: string | null };

export type PublicProfile = ApiUser & {
  stats: { ratings: number; avg: number; reviews: number };
  genres: { g: string; pct: number }[];
  top4Albums: string[];
  minutesToday: number;
};

export type Me = PublicProfile & {
  connections: { spotify: boolean; appleMusic: boolean };
  friends: ApiUser[];
  language: import('./i18n').Language;
  region: string | null;
};

export type RatingRecord = {
  albumId: string;
  stars: number;
  review: string | null;
  createdAt: string;
};

export type Device = 'mobile' | 'desktop';

export type ScreenName =
  | 'catalog'
  | 'album'
  | 'rate'
  | 'history'
  | 'recap'
  | 'profile'
  | 'artist'
  | 'friend';

export type ArtistRelease = {
  id: string;
  title: string;
  'first-release-date'?: string;
};

// Spotify doesn't expose real "monthly listeners" via the public API — only
// follower count and a 0-100 popularity score. Shown as-is, not relabeled.
export type SpotifyArtistAlbum = { id: string; title: string; cover: string | null; releaseDate: string | null; year: number | null };

export type ArtistState = {
  id: string;
  name: string;
  source: 'musicbrainz' | 'spotify';
  loading: boolean;
  error: string | null;
  // musicbrainz-sourced (from the catalog's "open library" search)
  albums: ArtistRelease[] | null;
  // spotify-sourced
  photo?: string | null;
  genres?: string[];
  followers?: number | null;
  popularity?: number | null;
  releasedAlbums?: SpotifyArtistAlbum[];
  upcomingAlbums?: SpotifyArtistAlbum[];
};

import type { ArtistRelease } from './types';

export type LibraryArtist = { id: string; name: string; type?: string };
export type LibraryReleaseGroup = {
  id: string;
  title: string;
  'first-release-date'?: string;
  'artist-credit'?: { name: string }[];
};

export async function searchLibrary(query: string): Promise<{ artists: LibraryArtist[]; groups: LibraryReleaseGroup[] }> {
  const albumsUrl = `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(query)}&fmt=json&limit=8`;
  const artistsUrl = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(query)}&fmt=json&limit=6`;
  const [albumsRes, artistsRes] = await Promise.all([
    fetch(albumsUrl, { headers: { Accept: 'application/json' } }),
    fetch(artistsUrl, { headers: { Accept: 'application/json' } }),
  ]);
  if (!albumsRes.ok && !artistsRes.ok) throw new Error('MusicBrainz request failed: ' + albumsRes.status);
  const albumsData = albumsRes.ok ? await albumsRes.json() : { 'release-groups': [] };
  const artistsData = artistsRes.ok ? await artistsRes.json() : { artists: [] };
  const groups = ((albumsData['release-groups'] || []) as LibraryReleaseGroup[]).filter(
    (g) => (g as unknown as { 'primary-type'?: string })['primary-type'] === 'Album' || !(g as unknown as { 'primary-type'?: string })['primary-type']
  );
  const artists = (artistsData.artists || []) as LibraryArtist[];
  return { artists, groups };
}

export async function fetchArtistReleaseGroups(mbid: string): Promise<ArtistRelease[]> {
  const url = `https://musicbrainz.org/ws/2/release-group?artist=${mbid}&type=album&fmt=json&limit=24`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('MusicBrainz request failed: ' + res.status);
  const data = await res.json();
  return ((data['release-groups'] || []) as ArtistRelease[]).sort((a, b) =>
    (a['first-release-date'] || '9999').localeCompare(b['first-release-date'] || '9999')
  );
}

export function coverArtUrl(releaseGroupId: string) {
  return `https://coverartarchive.org/release-group/${releaseGroupId}/front-250`;
}

import type { CSSProperties } from 'react';
import type { Album } from './types';

// Curated catalog metadata (title/artist/year/cover) — this is content, not
// user activity, so it stays static. Ratings/reviews are NOT here anymore:
// they're computed live from the `ratings` table (see AppContext's
// albumRatings + AlbumScreen's live review fetch).
export const ALBUMS: Album[] = [
  { id: 'ok-computer', spotifyId: '6dVIqQ8qmQ5GBnJ9shOYGE', title: 'OK Computer', artist: 'Radiohead', year: 1997, genre: 'Alternative Rock', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b273c8b444df094279e70d0ed856', tracklist: [] },
  { id: 'abbey-road', spotifyId: '0ETFjACtuP2ADo6LFhL6HN', title: 'Abbey Road', artist: 'The Beatles', year: 1969, genre: 'Pop Rock', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b273dc30583ba717007b00cceb25', tracklist: [] },
  { id: 'thriller', spotifyId: '1x6guHfwvOGsIQgRK5v5p1', title: 'Thriller', artist: 'Michael Jackson', year: 1982, genre: 'Pop', genreBucket: 'Pop', cover: 'https://i.scdn.co/image/ab67616d0000b273230da28b7b53e7a2192e1743', tracklist: [] },
  { id: 'dark-side', spotifyId: '4LH4d3cOWNNsVw41Gqt2kv', title: 'The Dark Side Of The Moon', artist: 'Pink Floyd', year: 1973, genre: 'Rock', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b273db216ca805faf5fe35df4ee6', tracklist: [] },
  { id: 'rumours', spotifyId: '1bt6q2SruMsBtcerNVtpZB', title: 'Rumours', artist: 'Fleetwood Mac', year: 1977, genre: 'Rock', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b27357df7ce0eac715cf70e519a7', tracklist: [] },
  { id: 'dtmf', spotifyId: '5K79FLRUCSysQnVESLcTdb', title: 'Debí Tirar Más Fotos', artist: 'Bad Bunny', year: 2025, genre: 'Latin (Reggaeton)', genreBucket: 'Latin', cover: 'https://i.scdn.co/image/ab67616d0000b273bbd45c8d36e0e045ef640411', tracklist: [] },
  { id: 'snowday', spotifyId: '4BaDHBjeR61iUFuZdgCNXF', title: 'Snow Day', artist: 'Miley', year: 2026, genre: 'Electronic', genreBucket: 'Electronic', unknown: true, listeners: '17k', cover: 'https://i.scdn.co/image/ab67616d0000b2733e1c00522a30562d5cde4cc2', tracklist: [] },
  {
    id: 'blonde', spotifyId: '3mH6qwIy9crq0I9YQbOuDf', title: 'Blonde', artist: 'Frank Ocean', year: 2016, genre: 'R&B', genreBucket: 'R&B', cover: 'https://upload.wikimedia.org/wikipedia/en/9/9c/Frank_Ocean_-_Blonde.png',
    tracklist: ['Nikes', 'Ivy', 'Pink + White', 'Solo', 'Self Control'],
  },
  {
    id: 'graduation', spotifyId: '3SZr5Pco2oqKFORCP3WNj9', title: 'Graduation', artist: 'Kanye West', year: 2007, genre: 'Hip-Hop, Rap', genreBucket: 'Hip-Hop', cover: 'https://upload.wikimedia.org/wikipedia/en/4/42/Graduation_%28album%29.jpg',
    tracklist: ['Good Morning', 'Champion', 'Stronger', 'I Wonder', 'Homecoming'],
  },
  {
    id: 'teenage', spotifyId: '06SY6Ke6mXzZHhURLVU57R', title: 'Teenage Dream', artist: 'Katy Perry', year: 2010, genre: 'Pop', genreBucket: 'Pop', cover: 'https://upload.wikimedia.org/wikipedia/en/9/95/Katy_Perry_-_Teenage_Dream.png',
    tracklist: ['Teenage Dream', 'California Gurls', 'Firework', 'E.T.', 'Last Friday Night'],
  },
  { id: 'spiderverse', spotifyId: '1bwbZJ6khPJyVpOaqgKsoZ', title: 'Spider-Man: Across The Spider-Verse (Soundtrack)', artist: 'Metro Boomin', year: 2023, genre: 'Hip-Hop', genreBucket: 'Hip-Hop', cover: 'https://i.scdn.co/image/ab67616d0000b2736ed9aef791159496b286179f', tracklist: [] },
  {
    id: 'currents', spotifyId: '79dL7FLiJFOO0EoehUHQBv', title: 'Currents', artist: 'Tame Impala', year: 2015, genre: 'Electronic, Rock', genreBucket: 'Electronic', cover: 'https://i.scdn.co/image/ab67616d0000b273c8b444df094279e70d0ed856',
    tracklist: ['Let It Happen', 'Nangs', 'The Moment', "Yes I'm Changing", 'Eventually'],
  },
  { id: 'californication', spotifyId: '25BlKp11lnJt9TKbFoKLSj', title: 'Californication', artist: 'Red Hot Chili Peppers', year: 1999, genre: 'Rock/Alternative Rock', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b2737c509c463b08e0148dabc07a', tracklist: [] },
  { id: 'luv-rage-2', spotifyId: '2DiIYE1nwRB4JW42HoXBnu', title: 'Luv Is Rage 2', artist: 'Lil Uzi Vert', year: 2017, genre: 'Hip-Hop, Rap', genreBucket: 'Hip-Hop', cover: 'https://i.scdn.co/image/ab67616d0000b27359698a517bdde7d3c8b96ee5', tracklist: [] },
  { id: 'flower-boy', spotifyId: '2nkto6YNI4rUYTLqEwWJ3o', title: 'Flower Boy', artist: 'Tyler, The Creator', year: 2017, genre: 'Hip-Hop', genreBucket: 'Hip-Hop', cover: 'https://i.scdn.co/image/ab67616d0000b2738940ac99f49e44f59e6f7fb3', tracklist: [] },
  { id: 'purpose', spotifyId: '6Fr2rQkZ383FcMqFyT7yPr', title: 'Purpose', artist: 'Justin Bieber', year: 2015, genre: 'Pop/R&B', genreBucket: 'Pop', cover: 'https://i.scdn.co/image/ab67616d0000b273f46b9d202509a8f7384b90de', tracklist: [] },
  { id: 'channel-orange', spotifyId: '392p3shh2jkxUxY2VHvlH8', title: 'Channel Orange', artist: 'Frank Ocean', year: 2012, genre: 'Hip-Hop/R&B', genreBucket: 'R&B', cover: 'https://i.scdn.co/image/ab67616d0000b2737aede4855f6d0d738012e2e5', tracklist: [] },
  { id: 'tpab', spotifyId: '7ycBtnsMtyVbbwTfJwRjSP', title: 'To Pimp A Butterfly', artist: 'Kendrick Lamar', year: 2015, genre: 'Hip-Hop', genreBucket: 'Hip-Hop', cover: 'https://i.scdn.co/image/ab67616d0000b273cdb645498cd3d8a2db4d05e1', tracklist: [] },
  { id: 'discovery', spotifyId: '2noRn2Aes5aoNVsU6iWThc', title: 'Discovery', artist: 'Daft Punk', year: 2001, genre: 'Electronic', genreBucket: 'Electronic', cover: 'https://i.scdn.co/image/ab67616d0000b2731e81bff9807a9e629fce5ade', tracklist: [] },
  { id: 'am', spotifyId: '78bpIziExqiI9qztvNFlQu', title: 'AM', artist: 'Arctic Monkeys', year: 2013, genre: 'Rock/Alternative Rock', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b2734ae1c4c5c45aabe565499163', tracklist: [] },
  { id: 'wywh', spotifyId: '0bCAjiUamIFqKJsekOYuRw', title: 'Wish You Were Here', artist: 'Pink Floyd', year: 1975, genre: 'Rock', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b273828e52cfb7bf22869349799e', tracklist: [] },
  { id: 'morning-glory', spotifyId: '2u30gztZTylY4RG7IvfXs8', title: "(What's The Story) Morning Glory?", artist: 'Oasis', year: 1995, genre: 'Rock', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b2732f2eeee9b405f4d00428d84c', tracklist: [] },
  { id: 'in-rainbows', spotifyId: '5vkqYmiPBYLaalcmjujWxK', title: 'In Rainbows', artist: 'Radiohead', year: 2007, genre: 'Alternative Rock', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b273de3c04b5fc750b68899b20a9', tracklist: [] },
  { id: 'college-dropout', spotifyId: '4Uv86qWpGTxf7fU7lG5X6F', title: 'The College Dropout', artist: 'Kanye West', year: 2004, genre: 'Hip-Hop/Rap', genreBucket: 'Hip-Hop', cover: 'https://i.scdn.co/image/ab67616d0000b27325b055377757b3cdd6f26b78', tracklist: [] },
  { id: 'queen-is-dead', spotifyId: '5Y0p2XCgRRIjna91aQE8q7', title: 'The Queen Is Dead', artist: 'The Smiths', year: 1986, genre: 'Rock/Pop', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b2736236778a208a15eb71079601', tracklist: [] },
  { id: 'pet-sounds', spotifyId: '2CNEkSE8TADXRT2AzcEt1b', title: 'Pet Sounds', artist: 'The Beach Boys', year: 1966, genre: 'Rock/Pop', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b27350eb0c521d2d3b2f599bff04', tracklist: [] },
  { id: 'wheels-turnin', spotifyId: '35KafpmKh0nDLzBLV75MpR', title: "Wheels Are Turnin'", artist: 'REO Speedwagon', year: 1984, genre: 'Rock/Pop', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b273b815265c56ecfa5136a4015d', tracklist: [] },
  { id: 'journey-greatest', spotifyId: '2vGz4D9OvqR5ocGmYssp8h', title: 'Greatest Hits', artist: 'Journey', year: 1988, genre: 'Rock', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b273991357257325b8c6a2253ab1', tracklist: [] },
  { id: 'hot-space', spotifyId: '0fZCqpTHYq2k89uG6pPTYE', title: 'Hot Space', artist: 'Queen', year: 1982, genre: 'Rock', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b27370f9e1cf71793ee37d5e6730', tracklist: [] },
  { id: 'kid-a', spotifyId: '6GjwtEZcfenmOf6l18N7T7', title: 'Kid A', artist: 'Radiohead', year: 2000, genre: 'Alternative Rock', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b2736c7112082b63beefffe40151', tracklist: [] },
  { id: 'wiley', spotifyId: '2dkAyREVms6eENZxHmQais', title: 'Wiley', artist: 'Miley', year: 2026, genre: 'Electronic', genreBucket: 'Electronic', unknown: true, listeners: '9k', cover: 'https://i.scdn.co/image/ab67616d0000b2738768f6969423a292dd96ffea', tracklist: [] },
  { id: 'miley-may', spotifyId: '4PJ0iWEt8HDkeHtwiWwayt', title: 'Miley May 2026', artist: 'Miley', year: 2026, genre: 'Electronic', genreBucket: 'Electronic', unknown: true, listeners: '12k', cover: 'https://i.scdn.co/image/ab67616d0000b2738006795984ac5680461cc5fb', tracklist: [] },
  { id: 'shelby', spotifyId: '3DnAuGUjUKCf3h0tYM2VZM', title: 'Shelby', artist: 'Miley', year: 2025, genre: 'Electronic', genreBucket: 'Electronic', unknown: true, listeners: '15k', cover: 'https://i.scdn.co/image/ab67616d0000b27398fc1550f412ada7d6a52b96', tracklist: [] },
  {
    id: 'ear', spotifyId: '51h6ahBtJWl7emcB5yDSuU', title: 'The Most Dear and The Future', artist: 'ear', year: 2025, genre: 'Electronic', genreBucket: 'Electronic', unknown: true, listeners: '4.2k', cover: 'https://i.scdn.co/image/ab67616d0000b273468315210da62a4ffda72430',
    tracklist: ['Glass Room', 'Static Bloom', 'Nocturne 02'],
  },
  { id: 'feng', spotifyId: '4Nip5JG2bdFpUyV7ghe0Kq', title: 'Summer at Camp Lakepine', artist: 'Feng', year: 2026, genre: 'Pop Rap/Electropop', genreBucket: 'Pop', cover: 'https://i.scdn.co/image/ab67616d0000b2739eaca3f250968dc568c219a9', tracklist: [] },
  { id: 'halo', spotifyId: '4T7qu6MdxoGjzZPErRWgsO', title: 'HALO', artist: 'Tiffany Day', year: 2026, genre: 'Pop/R&B', genreBucket: 'Pop', cover: 'https://i.scdn.co/image/ab67616d0000b273b5b273ebd1632a05019cd75c', tracklist: [] },
  { id: 'sokiu-muzika', spotifyId: '5lGxSWh0gAGxU3b0YTfz4b', title: 'šokių muzika', artist: 'Urboo', year: 2025, genre: 'Electronic/Hyperpop', genreBucket: 'Electronic', cover: 'https://i.scdn.co/image/ab67616d0000b2734f4b55f23fac076e4de3f2cd', tracklist: [] },
  { id: 'kidscry2day', spotifyId: '17VXPSQGscJVeoCKpWqNW6', title: 'KIDSCRY2DAY', artist: 'ONDA ANDAR', year: 2026, genre: 'Hyperpop/Digicore', genreBucket: 'Electronic', cover: 'https://i.scdn.co/image/ab67616d0000b27383e0e28d498b56018c783178', tracklist: [] },
  { id: 'dookie', spotifyId: '4uG8q3GPuWHQlRbswMIRS6', title: 'Dookie', artist: 'Green Day', year: 1994, genre: 'Punk Rock', genreBucket: 'Rock', cover: 'https://i.scdn.co/image/ab67616d0000b273db89b08034de626ebee6823d', tracklist: [] },
  { id: 'dopamine', spotifyId: '0CLqdKIh14TmKqLZCs9dml', title: 'DOPAMINE', artist: 'Lil Tecca', year: 2025, genre: 'Hip-Hop/Rap', genreBucket: 'Hip-Hop', cover: 'https://i.scdn.co/image/ab67616d0000b27386c8cd0e15776fa1e18715ec', tracklist: [] },
];

export function albumThumbStyle(a: Album): CSSProperties {
  return a.cover ? { backgroundImage: `url('${a.cover}')` } : {};
}

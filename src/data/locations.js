// Demo service hours, in minutes after midnight. Verify before real use.
// `verified` holds the date hours were last checked against an official source (null = unverified).
export const places = [
  { id: 'low', name: 'Low Library', short: 'Low Library', lat: 40.8081, lon: -73.9618, open: 480, close: 1080, verified: null },
  { id: 'hamilton', name: 'Hamilton Hall', short: 'Hamilton Hall', lat: 40.8068, lon: -73.9614, open: 480, close: 1320, verified: null },
  { id: 'wien', name: 'Wien Hall', short: 'Wien Hall', lat: 40.8066, lon: -73.9591, open: 600, close: 1080, verified: null },
  { id: 'butler', name: 'Butler Library', short: 'Butler Library', lat: 40.8063, lon: -73.9632, open: 540, close: 1440, verified: null },
  { id: 'market', name: 'Broadway', short: 'Broadway', lat: 40.8074, lon: -73.9658, open: 480, close: 1320, verified: null },
  { id: 'lerner', name: 'Lerner Hall', short: 'Lerner Hall', lat: 40.8075, lon: -73.9637, open: 540, close: 1200, verified: null },
  { id: 'mudd', name: 'Mudd Building', short: 'Mudd', lat: 40.8094, lon: -73.9608, open: 480, close: 1200, verified: null }
];

export const place = id => places.find(p => p.id === id);

// Demo service hours, in minutes after midnight. Verify before real use.
// `verified` holds the date hours were last checked against an official source (null = unverified).
// `category` drives the filter pills on the Errands tab.
export const places = [
  { id: 'low', name: 'Low Library', short: 'Low Library', category: null, lat: 40.8081, lon: -73.9618, open: 480, close: 1080, verified: null },
  { id: 'hamilton', name: 'Hamilton Hall', short: 'Hamilton Hall', category: null, lat: 40.8068, lon: -73.9614, open: 480, close: 1320, verified: null },
  { id: 'wien', name: 'Wien Hall · package pickup', short: 'Wien Hall', category: 'pickup', lat: 40.8066, lon: -73.9591, open: 600, close: 1080, verified: null },
  { id: 'butler', name: 'Butler Library · book return', short: 'Butler Library', category: 'library', lat: 40.8063, lon: -73.9632, open: 540, close: 1440, verified: null },
  { id: 'market', name: 'Broadway · groceries', short: 'Broadway', category: 'groceries', lat: 40.8074, lon: -73.9658, open: 480, close: 1320, verified: null },
  { id: 'lerner', name: 'Lerner Hall · printing', short: 'Lerner Hall', category: 'print', lat: 40.8075, lon: -73.9637, open: 540, close: 1200, verified: null },
  { id: 'mudd', name: 'Mudd Building', short: 'Mudd', category: null, lat: 40.8094, lon: -73.9608, open: 480, close: 1200, verified: null }
];

export const categories = [
  { id: 'pickup', label: 'Pickup' },
  { id: 'library', label: 'Library' },
  { id: 'print', label: 'Print' },
  { id: 'groceries', label: 'Groceries' }
];

export const place = id => places.find(p => p.id === id);

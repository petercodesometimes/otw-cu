import { place } from '../data/locations.js';
import { esc } from '../lib/dom.js';

// Schematic campus map: positions come from each place's lat/lon.
// Not turn-by-turn directions; paths follow the street grid as L-shaped legs.
const W = 400, H = 250;
const BOUNDS = { west: -73.9672, east: -73.9580, south: 40.8050, north: 40.8105 };
const STREETS = {
  vertical: [{ name: 'Broadway', lon: -73.9656 }, { name: 'Amsterdam Ave', lon: -73.9598 }],
  horizontal: [{ name: 'W 120th St', lat: 40.8098 }, { name: 'W 116th St', lat: 40.8077 }, { name: 'W 114th St', lat: 40.8058 }]
};
const x = lon => (lon - BOUNDS.west) / (BOUNDS.east - BOUNDS.west) * W;
const y = lat => (BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south) * H;
const pos = id => { const p = place(id); return { x: x(p.lon), y: y(p.lat) }; };
const n = v => v.toFixed(1);

// legs: [{ origin, stops: [{ loc }], dest }]; stop numbers continue across legs.
// skipped: place ids drawn as "?" markers.
export function routeMap({ legs = [], skipped = [], compact = false } = {}) {
  let svg = `<rect width="${W}" height="${H}" fill="#efefef"/>`;
  for (const s of STREETS.vertical) {
    svg += `<rect x="${n(x(s.lon) - 4)}" y="0" width="8" height="${H}" fill="#c6c6c6"/>`;
    if (!compact) svg += `<text x="${n(x(s.lon) + 9)}" y="14" class="street">${s.name}</text>`;
  }
  for (const s of STREETS.horizontal) {
    svg += `<rect x="0" y="${n(y(s.lat) - 4)}" width="${W}" height="8" fill="#c6c6c6"/>`;
    if (!compact) svg += `<text x="6" y="${n(y(s.lat) - 8)}" class="street">${s.name}</text>`;
  }
  let number = 0, markers = '';
  for (const leg of legs) {
    const points = [leg.origin, ...leg.stops.map(s => s.loc), leg.dest].filter(Boolean).map(pos);
    if (points.length > 1) {
      const d = points.map((p, i) => i ? `V${n(p.y)}H${n(p.x)}` : `M${n(p.x)} ${n(p.y)}`).join('');
      svg += `<path d="${d}" fill="none" stroke="#1f4e9a" stroke-width="${compact ? 2.5 : 3.5}" stroke-dasharray="${compact ? '5 4' : '8 6'}"/>`;
    }
    if (leg.origin && !compact) {
      const o = pos(leg.origin);
      markers += `<circle cx="${n(o.x)}" cy="${n(o.y)}" r="5" fill="#fff" stroke="#1f4e9a" stroke-width="2"/>`;
    }
    for (const stop of leg.stops) {
      const p = pos(stop.loc);
      number += 1;
      markers += compact
        ? `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="6" fill="#1f4e9a"/>`
        : `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="11" fill="#1f4e9a"/><text x="${n(p.x)}" y="${n(p.y + 4)}" class="num">${number}</text>`
          + `<text x="${n(p.x + 15)}" y="${n(p.y + 4)}" class="label">${esc(place(stop.loc).short)}</text>`;
    }
    if (leg.dest) {
      const p = pos(leg.dest), s = compact ? 6 : 10;
      markers += `<rect x="${n(p.x - s)}" y="${n(p.y - s)}" width="${2 * s}" height="${2 * s}" fill="#1b1b1b"/>`;
      if (!compact) {
        markers += `<text x="${n(p.x)}" y="${n(p.y + 4)}" class="num">C</text>`
          + `<text x="${n(p.x + 15)}" y="${n(p.y + 4)}" class="label">${esc(place(leg.dest).short)}</text>`;
      }
    }
  }
  for (const id of skipped) {
    const p = pos(id);
    markers += `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${compact ? 6 : 10}" fill="#fff" stroke="#777" stroke-dasharray="3 2"/>`;
    if (!compact) markers += `<text x="${n(p.x)}" y="${n(p.y + 4)}" class="num dark">?</text>`;
  }
  return `<svg class="routemap" viewBox="0 0 ${W} ${H}" role="img" aria-label="Schematic campus route map">${svg}${markers}</svg>`;
}

// One map leg for a planned window.
export const legOf = w => ({ origin: w.origin, stops: w.best.route, dest: w.dest });

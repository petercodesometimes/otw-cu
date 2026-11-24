import { place } from '../data/locations.js';
import { esc } from '../lib/dom.js';
import { routeMap } from './route-map.js';

// Interactive map built on Leaflet (loaded in index.html) with OpenStreetMap data.
// Walking paths come from the public FOSSGIS foot-routing server; walking *times*
// in the app still come from planning/walking.js estimates.
// Without internet (no Leaflet), it falls back to the schematic SVG in route-map.js.
// Standard OpenStreetMap tiles (no key); styles/main.css shows them in grayscale.
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const ROUTER = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot/';
const CAMPUS = [40.8075, -73.9620];

const instances = new Map();   // container id → { el, map, layer, token }
const pathCache = new Map();   // "a>b>c" → Promise<[[lat, lon], ...] | null>

const latlng = id => { const p = place(id); return [p.lat, p.lon]; };

function pin(label, kind, compact) {
  const size = compact ? 14 : 26;
  return L.divIcon({
    html: compact ? '' : esc(label),
    className: `pin ${kind}${compact ? ' compact' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

// Real walking geometry for a sequence of places, cached; null if the router is unreachable.
function walkingPath(ids) {
  const key = ids.join('>');
  if (!pathCache.has(key)) {
    const coords = ids.map(id => { const p = place(id); return `${p.lon},${p.lat}`; }).join(';');
    pathCache.set(key, fetch(`${ROUTER}${coords}?overview=full&geometries=geojson`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then(data => data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]))
      .catch(() => null));
  }
  return pathCache.get(key);
}

function instanceFor(el, compact) {
  let inst = instances.get(el.id);
  if (inst && inst.el === el) return inst;
  el.innerHTML = '';
  const map = L.map(el, { zoomControl: !compact, scrollWheelZoom: false }).setView(CAMPUS, 16);
  L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
  inst = { el, map, layer: L.layerGroup().addTo(map), token: 0 };
  instances.set(el.id, inst);
  return inst;
}

// legs: [{ origin, stops: [{ loc, name }], dest }]; stop numbers continue across legs.
// skipped: place ids shown as "?" markers.
export function showRoute(id, { legs = [], skipped = [], compact = false } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!window.L) { el.innerHTML = routeMap({ legs, skipped, compact }); return; }
  if (!el.offsetWidth) return; // on a hidden page; drawn again when that page is shown

  const inst = instanceFor(el, compact);
  const token = ++inst.token;
  inst.map.invalidateSize();
  inst.layer.clearLayers();
  const bounds = [];
  let number = 0;

  for (const leg of legs) {
    const ids = [leg.origin, ...leg.stops.map(s => s.loc), leg.dest].filter((x, i, a) => x && x !== a[i - 1]);
    const points = ids.map(latlng);
    bounds.push(...points);
    if (points.length > 1) {
      const line = L.polyline(points, { color: '#1f4e9a', weight: compact ? 3 : 5, opacity: 0.85, dashArray: '2 9', lineCap: 'round' }).addTo(inst.layer);
      walkingPath(ids).then(path => { if (path && inst.token === token) line.setLatLngs(path); });
    }
    if (leg.origin && !compact) {
      L.marker(latlng(leg.origin), { icon: pin('', 'origin', false) })
        .bindTooltip(`Start · ${esc(place(leg.origin).short)}`).addTo(inst.layer);
    }
    for (const stop of leg.stops) {
      number += 1;
      L.marker(latlng(stop.loc), { icon: pin(number, 'stop', compact), zIndexOffset: 100 })
        .bindTooltip(`${number} · ${esc(place(stop.loc).short)}${stop.name ? ` — ${esc(stop.name)}` : ''}`).addTo(inst.layer);
    }
    if (leg.dest) {
      L.marker(latlng(leg.dest), { icon: pin('C', 'class', compact) })
        .bindTooltip(`Class · ${esc(place(leg.dest).short)}`).addTo(inst.layer);
    }
  }
  for (const loc of skipped) {
    bounds.push(latlng(loc));
    L.marker(latlng(loc), { icon: pin('?', 'skipped', compact) })
      .bindTooltip(`Skipped · ${esc(place(loc).short)}`).addTo(inst.layer);
  }

  if (bounds.length) inst.map.fitBounds(bounds, { padding: compact ? [16, 16] : [48, 48], maxZoom: 17 });
  else inst.map.setView(CAMPUS, 16);
}

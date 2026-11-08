import {
   $, esc 
} from '../lib/dom.js';

import {
   places, place 
} from '../data/locations.js';

export function draw(route){
  $('map').innerHTML=`<path d="M0 60H700M0 150H700M155 0V235M410 0V235M630 0V235" stroke="#fff" stroke-width="21"/><path d="M265 25h110v75H265zM250 125h120v65H250zM450 20h100v50H450zM505 105h100v60H505z" fill="#dfe5d6"/><text x="35" y="28" fill="#9aab92" font-size="11" letter-spacing="3">MORNINGSIDE HEIGHTS</text><polyline points="${route.map(id=>{const p=place(id);return p.x+','+p.y}).join(' ')}" fill="none" stroke="#36765b" stroke-width="3" stroke-dasharray="6 5"/>`+places.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="${route.includes(p.id)?7:4}" fill="${route.includes(p.id)?'#296a56':'#a9b79e'}" stroke="white" stroke-width="3"/><text x="${p.x+12}" y="${p.y+4}" font-size="11" fill="#536a55">${p.name.split(' ·')[0]}</text>`).join('')
}

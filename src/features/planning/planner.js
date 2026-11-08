import {
   $, esc 
} from '../../lib/dom.js';

import {
   fmt, mins 
} from '../../lib/time.js';

import {
   place 
} from '../../data/locations.js';

import {
   state, save 
} from '../../state/store.js';

import {
   walk 
} from './walking.js';

import {
   optimize 
} from './optimizer.js';

import {
   draw 
} from '../../components/campus-map.js';

export function plan(){
  const start=mins($('start').value),requestedEnd=mins($('end').value),buffer=+$('buffer').value,origin=$('origin').value;
  let end=requestedEnd,dest=$('destination').value;
  const error=m=>{
    $('message').textContent=m;
    $('timeline').innerHTML='<div class="empty">Adjust your window to generate a route.</div>';
    $('deferred').innerHTML='';
    $('headline').textContent='Let’s adjust that window';
    $('walkstat').textContent='—';
    $('sparestat').textContent='—';
    $('subline').textContent='';
    draw([])
  };
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start){
    error('Choose a same-day window with an end later than its start.');
    return
  }const conflict=state.classes.find(c=>start>=c.start&&start<c.end);
  if(conflict){
    error(`Your start time overlaps ${conflict.name}. Try after ${fmt(conflict.end)}.`);
    return
  }const next=state.classes.filter(c=>c.start>=start&&c.start<=end).sort((a,b)=>a.start-b.start)[0];
  if(next){
    end=next.start;
    dest=next.loc
  }$('message').textContent='';
  if(start+walk(origin,dest)+buffer>end){
    error('There isn’t enough time to reach your destination with this buffer.');
    return
  }const tasks=state.tasks.filter(t=>t.selected),best=optimize(tasks,start,end,origin,dest,buffer);
  $('headline').textContent=best.route.length?`${best.route.length} stop${best.route.length===1?'':'s'}, all on the way.`:'Nothing fits this window yet.';
  $('walkstat').textContent=best.walking;
  $('sparestat').textContent=end-buffer-best.finish;
  $('subline').textContent=`${fmt(start)}–${fmt(end)}${next?' · before '+next.name:''}`;
  let html=`<div class="stop"><div class="time">${fmt(start)}</div><h3>Start at ${place(origin).name}</h3></div>`;
  let loc=origin;
  for(const t of best.route){
    html+=`<div class="stop"><div class="time">${fmt(t.begin)}–${fmt(t.done)}</div><h3>${esc(t.name)}</h3><div class="small">${place(t.loc).name}</div><div class="walk">↗ ${t.walk} min walk${t.begin>t.arrival?' · '+(t.begin-t.arrival)+' min wait for opening':''} · ${t.duration} min there</div></div>`;
    loc=t.loc
  }html+=`<div class="stop"><div class="time">${fmt(best.finish)}</div><h3>Arrive at ${place(dest).name}</h3><div class="small">${walk(loc,dest)} min final walk · ${buffer} min arrival buffer reserved</div></div>`;
  $('timeline').innerHTML='<div class="timeline">'+html+'</div>';
  const skipped=tasks.filter(t=>!best.route.some(r=>r.id===t.id));
  $('deferred').innerHTML=skipped.length?'<h2>Save for another window</h2>'+skipped.map(t=>{
    const p=place(t.loc);
    let why;
    if(Math.max(start+walk(origin,t.loc),p.open)+t.duration>p.close)why='The service closes before you could finish.';
    else if(t.deadline&&Math.max(start+walk(origin,t.loc),p.open)+t.duration>t.deadline)why='You cannot finish before its deadline.';
    else if(optimize([t],start,end,origin,dest,buffer).route.length===0)why='Walking, service time, opening hours, and your arrival buffer exceed this window.';
    else why='It fits alone. The chosen route fits more stops on the way, or the same number with less walking.';
    return `<div class="deferred"><h3>${esc(t.name)}</h3><div class="small">${why}</div></div>`
  }).join(''):'';
  draw([origin,...best.route.map(t=>t.loc),dest])
}

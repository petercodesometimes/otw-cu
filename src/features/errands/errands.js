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


export function renderErrands() {
  
 $('count').textContent=state.tasks.length+(state.tasks.length===1?' stop':' stops');
  $('errands').innerHTML=state.tasks.map(t=>{
    const p=place(t.loc);
    return `<div class="errand"><input aria-label="Include ${esc(t.name)}" type="checkbox" data-select="${t.id}" ${t.selected?'checked':''}><div class="info"><h3>${esc(t.name)}</h3><div class="small">${p.name} · ${t.duration} min</div><div class="small">Demo hours ${fmt(p.open)}–${fmt(p.close)}${t.deadline?' · Due '+fmt(t.deadline):''}</div></div><button class="delete" data-delete="${t.id}" aria-label="Delete ${esc(t.name)}">×</button></div>`
  }).join('')||'<p>Nothing on your list yet. Add your first stop below.</p>';
  

}
export function bindErrands(onChange) {
  
$('errands').onclick=e=>{
    if(e.target.dataset.delete){
      state.tasks=state.tasks.filter(t=>t.id!=e.target.dataset.delete);
      save();
      renderErrands();
      onChange()
    }
  };
  $('errands').onchange=e=>{
    if(e.target.dataset.select){
      state.tasks.find(t=>t.id==e.target.dataset.select).selected=e.target.checked;
      save();
      onChange()
    }
  };
  
$('add').onsubmit=e=>{
    e.preventDefault();
    if(state.tasks.length>=8){
      $('message').textContent='This MVP supports up to eight stops. Remove one to add another.';
      return
    }state.tasks.push({
      id:Date.now(),name:$('task').value.trim()||'New stop',loc:$('location').value,duration:+$('duration').value,deadline:$('deadline').value?mins($('deadline').value):null,selected:true
    });
    save();
    renderErrands();
    $('task').value='';
    onChange()
  };
  

}

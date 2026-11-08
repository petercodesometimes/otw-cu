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


export function renderClasses() {
  
 $('classlist').innerHTML=state.classes.map(c=>`<div class="classitem row"><div><h3>${esc(c.name)}</h3><div class="small">${fmt(c.start)}–${fmt(c.end)} · ${place(c.loc).name}</div></div><button class="secondary" data-classdelete="${c.id}">Remove</button></div>`).join('')||'<p>No classes added.</p>';
  

}
export function bindClasses(onChange) {
  
$('classform').onsubmit=e=>{
    e.preventDefault();
    const start=mins($('classstart').value),end=mins($('classend').value);
    if(end<=start){
      $('classerror').textContent='Class end must be later than start.';
      return
    }if(state.classes.some(c=>start<c.end&&end>c.start)){
      $('classerror').textContent='This class overlaps an existing class.';
      return
    }$('classerror').textContent='';
    state.classes.push({
      id:Date.now(),name:$('classname').value.trim()||'Class',start,end,loc:$('classlocation').value
    });
    save();
    renderClasses();
    onChange();
    $('classname').value=''
  };
  $('classlist').onclick=e=>{
    if(e.target.dataset.classdelete){
      state.classes=state.classes.filter(c=>c.id!=e.target.dataset.classdelete);
      save();
      renderClasses();
      onChange()
    }
  };
  

}

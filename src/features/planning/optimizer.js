import {
   place 
} from '../../data/locations.js';

import {
   walk 
} from './walking.js';

// Exhaustively evaluate feasible stop orders;
// Keep the eight-task MVP limit.
// Objective: most tasks, then least walking, then earliest arrival.
// dest may be null when nothing follows the window (no final walk required).
export function optimize(tasks,start,end,origin,dest,buffer){
  const toDest=loc=>dest?walk(loc,dest):0;
  let best={
    route:[],walking:toDest(origin),finish:start+toDest(origin)
  };
  function visit(route,remaining,time,loc,walking){
    let finish=time+toDest(loc);
    if(finish+buffer>end)return;
    if(route.length>best.route.length||(route.length===best.route.length&&(walking+toDest(loc)<best.walking||(walking+toDest(loc)===best.walking&&finish<best.finish))))best={
      route:[...route],walking:walking+toDest(loc),finish
    };
    for(const t of remaining){
      const w=walk(loc,t.loc),p=place(t.loc),arrival=time+w,begin=Math.max(arrival,p.open),done=begin+t.duration;
      if(done>p.close||(t.deadline&&done>t.deadline))continue;
      visit([...route,{
        ...t,walk:w,arrival,begin,done
      }],remaining.filter(x=>x.id!==t.id),done,t.loc,walking+w)
    }
  }visit([],tasks,start,origin,0);
  return best
}

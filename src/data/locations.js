// Demo service hours, in minutes after midnight. Verify before real use.
export const places=[{
  id:'low',name:'Low Library',lat:40.8081,lon:-73.9618,x:355,y:80,open:480,close:1080
},{
  id:'wien',name:'Wien Hall · package pickup',lat:40.8066,lon:-73.9591,x:555,y:125,open:600,close:1080
},{
  id:'butler',name:'Butler Library · book return',lat:40.8063,lon:-73.9632,x:320,y:180,open:540,close:1260
},{
  id:'market',name:'Broadway · groceries',lat:40.8074,lon:-73.9658,x:100,y:130,open:480,close:1320
},{
  id:'lerner',name:'Lerner Hall · printing',lat:40.8075,lon:-73.9637,x:200,y:90,open:540,close:1200
},{
  id:'mudd',name:'Mudd Building',lat:40.8094,lon:-73.9608,x:490,y:35,open:480,close:1200
}];

export const place = id => places.find(p => p.id === id);


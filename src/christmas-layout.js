// All floor-standing trees share these positions with client and server navigation.
export const TREE_SCALE=1.32;
export const ROOM_TREES=[-34,34].map(cx=>({room:cx<0?'prayer':'fellowship',x:cx+Math.sign(cx)*6.5,z:-10.5,radius:2.85,size:1.8}));
export const REGULAR_TREES=[
 ...[-1,1].map(side=>({x:side*7.8,z:-27,size:1.45})),
 ...[-1,1].map(side=>({x:side*10.8,z:20,size:.85})),
 ...[14,6,-2,-10].flatMap(z=>[-1,1].map(side=>({x:side*9,z,size:.63}))),
 ...[-34,34].flatMap(cx=>[-1,1].flatMap(side=>[-14.4,26.4].map(z=>({x:cx+side*10.6,z,size:.64})))),
];
export const CHRISTMAS_TREES=[...REGULAR_TREES,...ROOM_TREES];
export const TREE_FOOTPRINTS=[
 ...CHRISTMAS_TREES.map(t=>({...t,radius:t.radius??1.12*t.size*TREE_SCALE+.22,height:4.4*t.size*TREE_SCALE})),
 // Choir trees are created after world expansion, so convert their radius to layout units.
 ...[-1,1].map(side=>({x:side*4.2,z:-16.9,radius:1.6/Math.sqrt(3),height:4.8})),
];

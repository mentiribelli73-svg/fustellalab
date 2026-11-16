// FustellaLab shared structural editor engine — millimetres
export const TYPES={astucci:'Astuccio a linguette',scatole:'Scatola con coperchio',forme:'Scatola poligonale',bauletti:'Bauletto a volta',crea:'Disegno libero'};
const P=(id,pts,role='cut',name=id)=>({id,pts,role,name});
const R=(id,x,y,w,h,name=id)=>P(id,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],'cut',name);
const L=(id,a,b)=>({id,pts:[a,b],role:'fold',name:id});
const pt=(x,y)=>[+x.toFixed(3),+y.toFixed(3)];
export function build(doc){
 const w=+doc.w,d=+doc.d,h=+doc.h,t=+doc.t,glue=+doc.glue||12;
 if(![w,d,h,t].every(v=>Number.isFinite(v)&&v>0))throw Error('Le dimensioni devono essere positive');
 if(Math.max(w,d,h)>2000)throw Error('Dimensione massima 2000 mm');
 let shapes=[],warnings=[];const add=(...s)=>shapes.push(...s);
 if(doc.type==='astucci'){
   const widths=[w,d,w,d], xs=[0,w,w+d,2*w+d];
   widths.forEach((v,i)=>{add(R('parete'+(i+1),xs[i],0,v,h,'Parete '+(i+1)));if(i) add(L('piega-parete'+i,pt(xs[i],0),pt(xs[i],h)));});
   add(P('colla',[[2*(w+d),0],[2*(w+d)+glue,4],[2*(w+d)+glue,h-4],[2*(w+d),h]],'glue','Linguetta colla'));
   // Opposite main closure panels: panel 1 top, panel 3 bottom
   const main=(id,x,y,v,dir)=>{const depth=Math.min(d*.82,doc.flap||d*.72);const tab=Math.min(12,Math.max(5,v*.17));const yy=y+dir*depth;add(P(id,[[x,y],[x+v,y],[x+v,yy],[x+v-tab,yy+dir*tab*.65],[x+tab,yy+dir*tab*.65],[x,yy]],'cut',id));add(L('piega-'+id,pt(x,y),pt(x+v,y)));};
   main('coperchio-superiore',0,0,w,-1);main('coperchio-inferiore',w+d,h,w,1);
   for(const i of [1,3])for(const side of ['top','bottom']){let x=xs[i],v=widths[i],y=side==='top'?0:h,dir=side==='top'?-1:1,deep=Math.min(w*.45,d*.58);add(P('aletta-'+i+'-'+side,[[x,y],[x+v,y],[x+v*.88,y+dir*deep],[x+v*.12,y+dir*deep]],'cut','Aletta antipolvere'));add(L('piega-aletta-'+i+'-'+side,pt(x,y),pt(x+v,y)));}
   warnings.push('Chiusura illustrativa: non verificata per tenuta, interferenze e compensazione di piega.');
 }else if(doc.type==='scatole'){
   const box=(prefix,x,y,bw,bd,bh)=>{
     add(R(prefix+'-fondo',x,y,bw,bd,'Fondo '+prefix));
     add(R(prefix+'-sopra',x,y-bh,bw,bh,'Parete '+prefix));add(R(prefix+'-sotto',x,y+bd,bw,bh));
     add(R(prefix+'-sinistra',x-bh,y,bh,bd));add(R(prefix+'-destra',x+bw,y,bh,bd));
     add(L(prefix+'-piega1',pt(x,y),pt(x+bw,y)),L(prefix+'-piega2',pt(x,y+bd),pt(x+bw,y+bd)),L(prefix+'-piega3',pt(x,y),pt(x,y+bd)),L(prefix+'-piega4',pt(x+bw,y),pt(x+bw,y+bd)));
     // glue tabs on top/bottom walls, not a floating 3D mockup
     const tab=Math.min(bh*.7,18);
     for(const yy of [y-bh,y+bd])for(const xx of [x,x+bw]){let sign=xx===x?-1:1;add(P(prefix+'-incolla-'+xx+'-'+yy,[[xx,yy],[xx+sign*tab,yy+tab*.2],[xx+sign*tab,yy+bh-tab*.2],[xx,yy+bh]],'glue','Aletta angolare'));}
   };
   const lidH=Math.min(h*.5,Math.max(15,+doc.lidH||30)),clear=+doc.clearance||1;
   box('base',h+25,h+25,w,d,h);
   box('coperchio',w+3*h+95,h+25,w+2*t+clear,d+2*t+clear,lidH);
   warnings.push('Base e coperchio con alette angolari: dimensionamento da verificare su materiale reale.');
 }else if(doc.type==='forme'){
   const n=Math.max(3,Math.min(16,Math.round(+doc.sides||6))),a=2*Math.PI/n,side=2*w*Math.sin(Math.PI/n),radius=w;
   for(let i=0;i<n;i++){add(R('pannello-'+(i+1),i*side,0,side,h,'Pannello '+(i+1)));if(i)add(L('piega-'+i,pt(i*side,0),pt(i*side,h)));}
   add(R('colla',n*side,0,glue,h,'Giunzione'));const poly=(cx,cy)=>Array.from({length:n},(_,i)=>pt(cx+radius*Math.cos(a*i-Math.PI/2),cy+radius*Math.sin(a*i-Math.PI/2)));
   add(P('fondo-poligonale',poly(radius,-radius-20),'cut','Fondo separato'));add(P('coperchio-poligonale',poly(3*radius+30,-radius-20),'cut','Coperchio separato'));
   warnings.push('Fondo e coperchio sono pezzi separati: incastri e assemblaggio non ancora definiti.');
 }else if(doc.type==='bauletti'){
   // flat blank for curved lid, segmented scores to support manual shaping
   const arch=Math.PI*d/2;let x=0;
   for(const [id,ww] of [['fondo',d],['fianco',h],['volta',arch],['fianco2',h]]){add(R(id,x,0,ww,w,id));if(x)add(L('piega-'+id,pt(x,0),pt(x,w)));if(id==='volta')for(let i=1;i<9;i++)add(L('curvatura-'+i,pt(x+ww*i/9,0),pt(x+ww*i/9,w)));x+=ww;}
   warnings.push('Bauletto sperimentale: sviluppo della volta approssimato; mancano testate e chiusure producibili.');
 }else if(doc.type==='crea'){
   shapes=(doc.custom||[]).map((s,i)=>({...s,id:s.id||'forma-'+i,role:s.role||'cut',name:s.name||'Elemento '+(i+1)}));
 }
 if(doc.offsets)shapes=shapes.map(s=>{const v=doc.offsets[s.id];return v?{...s,pts:s.pts.map(([x,y])=>pt(x+v[0],y+v[1]))}:s});
 if(doc.offsets&&Object.keys(doc.offsets).length)warnings.push("Elementi spostati manualmente: i vincoli strutturali non sono garantiti.");
 return {shapes,warnings};
}
export function bounds(shapes){const pts=shapes.flatMap(s=>s.pts);if(!pts.length)return {x:0,y:0,w:100,h:100};let xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);let x=Math.min(...xs),y=Math.min(...ys);return{x,y,w:Math.max(1,Math.max(...xs)-x),h:Math.max(1,Math.max(...ys)-y)}}
export function svgMarkup(shapes,selected=null){let b=bounds(shapes),margin=15;const colors={cut:'#00b8d4',fold:'#dc5757',glue:'#d69b46'};let content=shapes.map(s=>{const points=s.pts.map(p=>p.join(',')).join(' '),isLine=s.pts.length===2,sel=s.id===selected;return `<${isLine?'polyline':'polygon'} data-id="${s.id.replace(/[^a-zA-Z0-9_-]/g,'')}" points="${points}" fill="${sel?'#ffcb6344':'none'}" stroke="${sel?'#ffe36a':colors[s.role]||'#00b8d4'}" stroke-width="${sel?1.4:.55}" ${s.role==='fold'?'stroke-dasharray="4 2"':''} vector-effect="non-scaling-stroke"/>`}).join('');return `<svg xmlns="http://www.w3.org/2000/svg" width="${b.w+2*margin}mm" height="${b.h+2*margin}mm" viewBox="${b.x-margin} ${b.y-margin} ${b.w+2*margin} ${b.h+2*margin}">${content}</svg>`}
export function moveShape(shapes,id,dx,dy){return shapes.map(s=>s.id===id?{...s,pts:s.pts.map(([x,y])=>pt(x+dx,y+dy))}:s)}

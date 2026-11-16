/* FustellaLab procedural geometry core, no DOM or external dependencies.
   Educational structural nets; not validated for production. All lengths mm. */
export function validate(p){
  for(const k of ['radius','height','thickness','glue']) if(!Number.isFinite(+p[k])||+p[k]<=0)throw Error(`${k}: inserisci un valore positivo`);
  if(!Number.isInteger(+p.sides)||+p.sides<3||+p.sides>16)throw Error('Numero lati: da 3 a 16');
  if(!['prism','pyramid'].includes(p.shape))throw Error('Forma non supportata');
  if(+p.radius<=+p.thickness*2)throw Error('Raggio troppo piccolo rispetto allo spessore');
  if(+p.glue>=+p.radius)throw Error('Aletta di colla troppo grande');
  return true;
}
export function polygon(p){validate(p);const n=+p.sides,R=+p.radius;return Array.from({length:n},(_,i)=>{const a=-Math.PI/2+2*Math.PI*i/n;return [R*Math.cos(a),R*Math.sin(a)]})}
export const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const seg=(a,b,type,part)=>({a,b,type,part});
const polyEdges=(pts,type,part)=>pts.map((v,i)=>seg(v,pts[(i+1)%pts.length],type,part));
const bounds=(segments)=>{const pts=segments.flatMap(s=>[s.a,s.b]);return {minX:Math.min(...pts.map(p=>p[0])),minY:Math.min(...pts.map(p=>p[1])),maxX:Math.max(...pts.map(p=>p[0])),maxY:Math.max(...pts.map(p=>p[1]))}};
export function build(p){validate(p);const n=+p.sides,R=+p.radius,H=+p.height,G=+p.glue;const verts=polygon(p),side=dist(verts[0],verts[1]);let segments=[],panels=[];
  if(p.shape==='prism'){
    for(let i=0;i<n;i++){
      const x=i*side, pts=[[x,0],[x+side,0],[x+side,H],[x,H]];
      panels.push({id:`wall-${i+1}`,name:`Parete ${i+1}`,points:pts,kind:'wall'});
      segments.push(seg([x,0],[x+side,0],'cut',`wall-${i+1}`),seg([x,H],[x+side,H],'cut',`wall-${i+1}`));
      if(i===0)segments.push(seg([x,0],[x,H],'cut','wall-1'));
      segments.push(seg([x+side,0],[x+side,H],i===n-1?'fold':'fold',`wall-${i+1}`));
    }
    const x=n*side;panels.push({id:'glue',name:'Aletta di incollaggio',kind:'glue',points:[[x,0],[x+G,Math.min(G,H/4)],[x+G,H-Math.min(G,H/4)],[x,H]]});
    segments.push(seg([x,0],[x+G,Math.min(G,H/4)],'cut','glue'),seg([x+G,Math.min(G,H/4)],[x+G,H-Math.min(G,H/4)],'cut','glue'),seg([x+G,H-Math.min(G,H/4)],[x,H],'cut','glue'));
    // Two polygon panels connected to first wall: one bottom, one top.
    const ap=R*Math.cos(Math.PI/n),centerX=side/2;
    for(const [name,cy,sign] of [['bottom',H+ap,1],['top',-ap,-1]]){
      // Orient first edge to be shared with wall edge by constructing regular polygon from attached side.
      const c=[centerX,cy];const baseAngle=sign===1?Math.PI/2:-Math.PI/2;
      const pts=Array.from({length:n},(_,i)=>{const a=baseAngle-sign*Math.PI/n+sign*i*2*Math.PI/n;return [c[0]+R*Math.cos(a),c[1]+R*Math.sin(a)]});
      panels.push({id:name,name:name==='bottom'?'Fondo':'Sommità',kind:'cap',points:pts});
      // explicit cut polygon except shared fold edge, recognized by endpoint proximity
      const hingeA=[0,sign===1?H:0],hingeB=[side,sign===1?H:0];
      for(const e of polyEdges(pts,'cut',name)){
        const shared=(dist(e.a,hingeA)<.001&&dist(e.b,hingeB)<.001)||(dist(e.b,hingeA)<.001&&dist(e.a,hingeB)<.001);
        if(!shared)segments.push(e);
      }
      segments.push(seg(hingeA,hingeB,'fold',name));
    }
    // NOTE: polygon top/bottom hinges require no extra side tabs: intentionally flagged as non-production.
  }else{
    const base=verts.map(([x,y])=>[x+R+G+10,y+R+G+10]);panels.push({id:'base',name:'Base poligonale',kind:'base',points:base});
    for(let i=0;i<n;i++){
      const a=base[i],b=base[(i+1)%n],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
      const len=dist(a,b),nx=(mx-(R+G+10))/Math.max(.001,Math.hypot(mx-(R+G+10),my-(R+G+10))),ny=(my-(R+G+10))/Math.max(.001,Math.hypot(mx-(R+G+10),my-(R+G+10)));
      const slant=Math.hypot(H,R*Math.cos(Math.PI/n));const triHeight=Math.sqrt(Math.max(0,slant*slant-len*len/4));const tip=[mx+nx*triHeight,my+ny*triHeight];
      panels.push({id:`face-${i+1}`,name:`Triangolo ${i+1}`,kind:'triangle',points:[a,b,tip]});
      segments.push(seg(a,b,'fold',`face-${i+1}`),seg(a,tip,'cut',`face-${i+1}`),seg(b,tip,'cut',`face-${i+1}`));
    }
  }
  return {parameters:{...p,sides:n,radius:R,height:H,glue:G},panels,segments,bounds:bounds(segments),sideLength:side,warning:'Sviluppo dimostrativo: non include tutte le compensazioni di cordonatura, giunti di chiusura o prove di montaggio. Non usare per taglio produttivo.'};
}
export function svgMarkup(model,selected=''){
  const b=model.bounds,pad=15,w=b.maxX-b.minX+2*pad,h=b.maxY-b.minY+2*pad;
  const polygonMarkup=model.panels.map(p=>`<polygon data-part="${p.id}" points="${p.points.map(v=>v.join(',')).join(' ')}" fill="${selected===p.id?'#d8a458':'#d3a15d'}" fill-opacity="${selected===p.id?'.45':'.13'}" stroke="none"><title>${p.name}</title></polygon>`).join('');
  const lines=model.segments.map(s=>`<line x1="${s.a[0]}" y1="${s.a[1]}" x2="${s.b[0]}" y2="${s.b[1]}" stroke="${s.type==='fold'?'#277bb5':'#ad5633'}" stroke-width=".6" ${s.type==='fold'?'stroke-dasharray="3 2"':''} vector-effect="non-scaling-stroke"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.minX-pad} ${b.minY-pad} ${w} ${h}" width="100%" height="100%" role="img" aria-label="Sviluppo 2D dinamico">${polygonMarkup}${lines}</svg>`;
}
export function preview3d(model,angle=30,selected=''){
  const p=model.parameters,n=p.sides,R=p.radius,H=p.height;const spin=angle*Math.PI/180,tilt=.42;
  const project=([x,y,z])=>{const a=x*Math.cos(spin)-y*Math.sin(spin),b=x*Math.sin(spin)+y*Math.cos(spin);return [a,b*Math.sin(tilt)-z*Math.cos(tilt)]};
  const verts=polygon(p),faces=[];
  if(p.shape==='prism'){
    faces.push({id:'bottom',name:'Fondo',points:verts.map(([x,y])=>[x,y,0])});
    faces.push({id:'top',name:'Sommità',points:verts.map(([x,y])=>[x,y,H])});
    for(let i=0;i<n;i++){const a=verts[i],b=verts[(i+1)%n];faces.push({id:`wall-${i+1}`,name:`Parete ${i+1}`,points:[[...a,0],[...b,0],[...b,H],[...a,H]]})}
  }else{
    faces.push({id:'base',name:'Base',points:verts.map(([x,y])=>[x,y,0])});
    for(let i=0;i<n;i++)faces.push({id:`face-${i+1}`,name:`Triangolo ${i+1}`,points:[[...verts[i],0],[...verts[(i+1)%n],0],[0,0,H]]})
  }
  const depth=f=>f.points.reduce((s,v)=>s+v[0]*Math.sin(spin)+v[1]*Math.cos(spin),0)/f.points.length;
  faces.sort((a,b)=>depth(a)-depth(b));
  const all=faces.flatMap(f=>f.points.map(project)),minX=Math.min(...all.map(v=>v[0])),maxX=Math.max(...all.map(v=>v[0])),minY=Math.min(...all.map(v=>v[1])),maxY=Math.max(...all.map(v=>v[1]));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX-18} ${minY-18} ${maxX-minX+36} ${maxY-minY+36}" width="100%" height="100%" role="img" aria-label="Anteprima tridimensionale geometrica">${faces.map((f,i)=>`<polygon data-part="${f.id}" points="${f.points.map(v=>project(v).join(',')).join(' ')}" fill="${selected===f.id?'#f7d494':i%2?'#d6a36b':'#bb8450'}" stroke="#63492c" stroke-width=".9"><title>${f.name}</title></polygon>`).join('')}</svg>`;
}

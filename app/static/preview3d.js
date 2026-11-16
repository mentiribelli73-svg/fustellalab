// Dependency-free interactive projected 3D preview. Not a mechanical folding simulation.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function preview3D(doc,{angle=35,tilt=22,open=0,selected=null}={}){
 const w=Math.max(1,+doc.w||65),d=Math.max(1,+doc.d||65),h=Math.max(1,+doc.h||125);
 const theta=angle*Math.PI/180,phi=tilt*Math.PI/180;
 const size=Math.max(w,d,h),scale=205/size;
 const project=([x,y,z])=>{x-=w/2;y-=d/2;z-=h/2;const X=x*Math.cos(theta)-y*Math.sin(theta),Y=x*Math.sin(theta)+y*Math.cos(theta);return [300+scale*X,230+scale*(Y*Math.sin(phi)-z*Math.cos(phi))]};
 const poly=(pts,id,fill,stroke='#d1b78d')=>{const pp=pts.map(project);const depth=pts.reduce((a,p)=>a+p[0]*Math.sin(theta)+p[1]*Math.cos(theta),0)/pts.length;return {depth,html:`<polygon data-part="${esc(id)}" points="${pp.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ')}" fill="${selected&&id.includes(selected)?'#ffe17b':fill}" stroke="${stroke}" stroke-width="1.4"/>`}};
 let faces=[];
 if(doc.type==='crea')return `<svg viewBox="0 0 600 460" role="img" aria-label="Anteprima 3D non disponibile per il disegno libero"><text x="300" y="210" fill="#e6c795" text-anchor="middle">Disegno libero: definire pannelli e pieghe</text><text x="300" y="238" fill="#aaa" text-anchor="middle">prima di costruire il solido 3D</text></svg>`;
 if(doc.type==='forme'){
  const n=Math.max(3,Math.min(16,Math.round(+doc.sides||6))),radius=w;
  const vertices=Array.from({length:n},(_,i)=>[w/2+radius*Math.cos(i*2*Math.PI/n),d/2+radius*Math.sin(i*2*Math.PI/n)]);
  // independent projection for polygonal radius; coordinates are schematic, not a fold simulation
  for(let i=0;i<n;i++){const a=vertices[i],b=vertices[(i+1)%n];faces.push(poly([[a[0],a[1],0],[b[0],b[1],0],[b[0],b[1],h],[a[0],a[1],h]],'pannello-'+(i+1),i%2?'#9b7c55':'#c4a47b'));}
  faces.push(poly(vertices.map(([x,y])=>[x,y,h]),'coperchio-poligonale','#dbc39b'));
 }else{
  faces.push(poly([[0,0,0],[w,0,0],[w,0,h],[0,0,h]],'parete1','#a58763'));
  faces.push(poly([[w,0,0],[w,d,0],[w,d,h],[w,0,h]],'parete2','#c4a47b'));
  faces.push(poly([[w,d,0],[0,d,0],[0,d,h],[w,d,h]],'parete3','#aa8963'));
  faces.push(poly([[0,d,0],[0,0,0],[0,0,h],[0,d,h]],'parete4','#c3a27a'));
  const z=h+Math.min(h*.3,open*h*.5);
  if(doc.type==='scatole'){
   faces.push(poly([[0,0,z],[w,0,z],[w,d,z],[0,d,z]],'coperchio','#e1c69a'));
   if(open>0)faces.push(poly([[0,0,h],[w,0,h],[w,d,h],[0,d,h]],'apertura','#292c32','#b4a181'));
  }else if(doc.type==='bauletti'){
   const segments=12;for(let i=0;i<segments;i++){const a=i*Math.PI/segments,b=(i+1)*Math.PI/segments;const za=h+Math.sin(a)*d*.32,zb=h+Math.sin(b)*d*.32;faces.push(poly([[w*i/segments,0,za],[w*(i+1)/segments,0,zb],[w*(i+1)/segments,d,zb],[w*i/segments,d,za]],'volta','#d8b98c'));}
  }else{
   faces.push(poly([[0,0,z],[w,0,z],[w,d,z],[0,d,z]],'coperchio-superiore','#e1c69a'));
  }
 }
 faces.sort((a,b)=>a.depth-b.depth);
 return `<svg viewBox="0 0 600 460" role="img" aria-label="Anteprima tridimensionale orientabile della scatola">${faces.map(f=>f.html).join('')}<text x="300" y="445" text-anchor="middle" fill="#b6b1a8" font-size="13">Anteprima volumetrica · non simula pieghe, incastri o collisioni</text></svg>`;
}

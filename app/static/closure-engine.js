// FustellaLab 0.5 — reference-informed folding carton, non-production geometry.
// Axes in mm, y increases upwards. Main closure on body panel 1 (top) and 3 (bottom).
const rnd = n => +n.toFixed(3);
const point = p => p.map(rnd).join(' ');
export function carton(p) {
 const W=+p.width,D=+p.depth,H=+p.height,T=+p.thickness,G=+p.glue,B=+p.bleed;
 const edits=p.edits||{};
 const dimension=(id,key,fallback,min,max)=>{const v=edits[id]?.[key];if(v===undefined)return fallback;if(!Number.isFinite(+v)||+v<min||+v>max)throw Error(`Modifica non valida: ${id}.${key}`);return +v};
 for(const [k,v] of Object.entries({width:W,depth:D,height:H,thickness:T,glue:G,bleed:B}))
  if(!Number.isFinite(v)||v<0||(!['bleed'].includes(k)&&v===0))throw Error(`Misura non valida: ${k}`);
 if(Math.min(W,D)<20||H<30||T>=Math.min(W,D)/8||G>=Math.min(W,D)/2||B>10)throw Error('Misure incompatibili con questa famiglia');
 const widths=[W,D,W,D], xs=[0];widths.forEach(w=>xs.push(xs.at(-1)+w));
 const paths=[],folds=[],panels=[],glueZones=[],closures=[];
 const cut=(d,id)=>paths.push({id,kind:'cut',d});
 const line=(a,b,id)=>cut(`M ${point(a)} L ${point(b)}`,id);
 const fold=(a,b,id)=>folds.push({id,kind:'fold',a,b});
 widths.forEach((w,i)=>{panels.push({id:`body-${i+1}`,kind:'body',x:xs[i],y:0,w,h:H});if(i)fold([xs[i],0],[xs[i],H],`vertical-${i}`)});
 const bevel=Math.min(4,H/10);
 cut(`M ${point([xs[4],0])} L ${point([xs[4]+G,bevel])} L ${point([xs[4]+G,H-bevel])} L ${point([xs[4],H])}`,'glue-outline');
 fold([xs[4],0],[xs[4],H],'glue-hinge');
 glueZones.push({x:xs[4],y:bevel,w:G,h:H-2*bevel});
 line([0,0],[0,H],'body-left-edge');
 for(const end of ['top','bottom']){
  const y=end==='top'?H:0,s=end==='top'?1:-1, main=end==='top'?0:2;
  widths.forEach((w,i)=>{
   const x=xs[i],id=`${end}-${i+1}`;
   if(i===main){
    // Full-depth lid with gently rounded insertion tongue; one continuous exterior cut path.
    const lidDepth=dimension(id,'lidDepth',D*0.94,D*.65,D*1.15), tongueDepth=dimension(id,'tongueDepth',Math.min(19,Math.max(9,D*.27)),5,Math.min(D*.65,35));
    const shoulder=Math.min(3.5,w*.06), radius=Math.min(tongueDepth*.65,w*.17);
    const left=x+shoulder,right=x+w-shoulder, yL=y+s*lidDepth, yT=y+s*(lidDepth+tongueDepth);
    const d=`M ${point([x,y])} L ${point([x,yL-s*shoulder])} Q ${point([x,yL])} ${point([left,yL])} L ${point([left,yT-s*radius])} Q ${point([left,yT])} ${point([left+radius,yT])} L ${point([right-radius,yT])} Q ${point([right,yT])} ${point([right,yT-s*radius])} L ${point([right,yL])} Q ${point([x+w,yL])} ${point([x+w,yL-s*shoulder])} L ${point([x+w,y])}`;
    cut(d,`${id}-contour`);
    fold([x,y],[x+w,y],`${id}-lid-hinge`);
    fold([left,yL],[right,yL],`${id}-tongue-hinge`);
    panels.push({id:`${id}-lid`,kind:'lid',x,y,w,depth:lidDepth,side:s},{id:`${id}-tongue`,kind:'tongue',x:left,y:yL,w:right-left,depth:tongueDepth,side:s});
    closures.push({end,role:'main-lid',panel:i+1},{end,role:'tuck-tongue',panel:i+1});
   }else if(i===1||i===3){
    const depth=dimension(id,'depth',Math.min(D*.46,W*.48),Math.min(5,D*.15),Math.min(D*.7,W*.7)), inset=Math.min(w*.16,8), tipY=y+s*depth;
    const d=`M ${point([x,y])} L ${point([x+inset*.8,tipY-s*3])} Q ${point([x+inset,tipY])} ${point([x+inset+2,tipY])} L ${point([x+w-inset-2,tipY])} Q ${point([x+w-inset,tipY])} ${point([x+w-inset*.8,tipY-s*3])} L ${point([x+w,y])}`;
    cut(d,`${id}-dust-contour`);fold([x,y],[x+w,y],`${id}-dust-hinge`);
    panels.push({id,kind:'dust',x,y,w,depth,side:s});closures.push({end,role:'dust-flap',panel:i+1});
   }else{
    line([x,y],[x+w,y],`${id}-exposed-edge`);
   }
  });
 }
 const extra=Math.max(...['top-1','bottom-3'].map(id=>dimension(id,'lidDepth',D*.94,D*.65,D*1.15)+dimension(id,'tongueDepth',Math.min(19,Math.max(9,D*.27)),5,Math.min(D*.65,35))));
 return {params:{width:W,depth:D,height:H,thickness:T,glue:G,bleed:B,edits:structuredClone(edits)},paths,folds,panels,glueZones,closures,bodyWidth:xs[4],bounds:{minX:-B-5,maxX:xs[4]+G+B+5,minY:-extra-B-5,maxY:H+extra+B+5},warning:'STUDIO PARAMETRICO NON PRODUTTIVO: la sagoma è ispirata alla topologia del PDF, non è una copia quotata. Mancano verifica di incastro, piegatura 3D, compensazioni e collaudo fisico.'};
}
export function svgCarton(m){
 const b=m.bounds,p=m.params,vw=b.maxX-b.minX,vh=b.maxY-b.minY;
 const out=[`<svg xmlns="http://www.w3.org/2000/svg" width="${vw}mm" height="${vh}mm" viewBox="${b.minX} ${-b.maxY} ${vw} ${vh}" role="img" aria-label="Fustella di studio con chiusure a linguetta arrotondata e alette antipolvere">`,'<g transform="scale(1,-1)">'];
 // Bleed is illustrative, NOT a true offset contour.
 if(p.bleed)for(const e of m.paths)out.push(`<path d="${e.d}" fill="none" stroke="#23a879" stroke-width="${2*p.bleed}" opacity=".17" stroke-linejoin="round"/>`);
 for(const g of m.glueZones)out.push(`<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" fill="#dba34e" opacity=".35"/>`);
 for(const e of m.paths)out.push(`<path data-element="${e.id}" d="${e.d}" fill="none" stroke="#168ec4" stroke-width=".6" stroke-linecap="round" stroke-linejoin="round"/>`);
 for(const f of m.folds)out.push(`<line x1="${rnd(f.a[0])}" y1="${rnd(f.a[1])}" x2="${rnd(f.b[0])}" y2="${rnd(f.b[1])}" stroke="#d85a67" stroke-width=".45" stroke-dasharray="3 2"/>`);
 out.push('</g></svg>');return out.join('');
}

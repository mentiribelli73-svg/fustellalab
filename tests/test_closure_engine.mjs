import assert from 'node:assert/strict';
import {carton,svgCarton} from '../app/static/closure-engine.js';
for(const [width,depth,height] of [[65,65,125],[80,40,150],[45,30,90]]){
 const m=carton({width,depth,height,thickness:.5,glue:12,bleed:3});
 const roles=r=>m.closures.filter(c=>c.role===r);
 assert.equal(roles('main-lid').length,2);
 assert.equal(roles('tuck-tongue').length,2);
 assert.equal(roles('dust-flap').length,4);
 assert.equal(m.closures.length,8);
 assert.equal(m.panels.filter(p=>p.kind==='support').length,0);
 assert.deepEqual(roles('main-lid').map(x=>[x.end,x.panel]),[['top',1],['bottom',3]]);
 assert.equal(m.paths.filter(p=>p.id.endsWith('dust-contour')).length,4);
 assert.equal(m.paths.filter(p=>p.id.endsWith('contour')&&!p.id.includes('dust')).length,2);
 assert.equal(m.folds.filter(f=>f.id.endsWith('tongue-hinge')).length,2);
 assert.ok(m.paths.every(p=>p.d.startsWith('M ')&&!p.d.includes('NaN')));
 assert.ok(m.paths.filter(p=>p.id.endsWith('contour')).every(p=>p.d.includes('Q ')));
 assert.ok(svgCarton(m).includes('<svg'));
 console.log(`OK ${width}×${depth}×${height}: 2 coperchi arrotondati, 2 linguette, 4 alette, 0 supporti`);
}
console.log('OK: verifiche strutturali superate. Montabilità, collisioni e producibilità NON verificate.');

// Check Illustrator physical dimensions and SVG is non-raster.
const test=carton({width:65,depth:65,height:125,thickness:.5,glue:12,bleed:3});
assert.match(svgCarton(test),/width="[0-9.]+mm" height="[0-9.]+mm"/);
assert.ok(!svgCarton(test).includes('<image'));
console.log('OK: SVG vettoriale con dimensioni fisiche in mm');

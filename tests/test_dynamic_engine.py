import pathlib, shutil, subprocess, unittest
ROOT = pathlib.Path(__file__).resolve().parents[1]
class DynamicGeometryTests(unittest.TestCase):
    def test_studio_connected_to_home(self):
        home=(ROOT/'app/static/index.html').read_text()
        studio=(ROOT/'app/static/studio.html').read_text()
        self.assertIn('href="/studio.html"',home)
        self.assertIn("./geometry-engine.js",studio)
        self.assertIn('fustellalab-dynamic-geometry',studio)
    @unittest.skipUnless(shutil.which('node'),'Node.js non disponibile')
    def test_generates_polygonal_families(self):
        js=(ROOT/'app/static/geometry-engine.js').as_uri()
        code=f'''import {{build,svgMarkup,preview3d}} from {js!r};
for(const shape of ['prism','pyramid']) for(let sides=3;sides<=16;sides++){{
const m=build({{shape,sides,radius:65,height:90,thickness:.5,glue:12}});
if(m.panels.length<(shape==='prism'?sides+3:sides+1))throw Error('missing panels');
if(!svgMarkup(m).includes('<svg')||!preview3d(m).includes('<svg'))throw Error('missing SVG');
}}
try{{build({{shape:'prism',sides:2,radius:65,height:90,thickness:.5,glue:12}});throw Error('invalid accepted')}}catch(e){{if(e.message==='invalid accepted')throw e}}
'''
        result=subprocess.run(['node','--experimental-default-type=module','--input-type=module','-e',code],capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stderr)
if __name__=='__main__':unittest.main()

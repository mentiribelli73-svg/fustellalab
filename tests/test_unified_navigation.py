import unittest, os, tempfile, importlib, sys
from pathlib import Path
from fastapi.testclient import TestClient

class NavigationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory()
        os.environ['FUSTELLALAB_DB']=str(Path(cls.tmp.name)/'test.sqlite3')
        if 'app.main' in sys.modules: del sys.modules['app.main']
        cls.main=importlib.import_module('app.main')
        cls.client=TestClient(cls.main.app)
    @classmethod
    def tearDownClass(cls): cls.tmp.cleanup()
    def test_home_and_editors_are_served(self):
        for path in ['/','/progetto.html','/astucci.html','/cad.html','/studio.html','/importa.html','/editor.html']:
            with self.subTest(path=path):
                r=self.client.get(path)
                self.assertEqual(r.status_code,200)
                self.assertIn('text/html',r.headers['content-type'])
    def test_save_reopen_update_history(self):
        p={'name':'Astuccio test','description':'collaudo','document':{'format':'FustellaLab-Carton','version':1,'params':{'width':65,'depth':65,'height':125}}}
        r=self.client.post('/api/projects',json=p);self.assertEqual(r.status_code,201);id=r.json()['id']
        g=self.client.get('/api/projects/'+id);self.assertEqual(g.json()['document'],p['document'])
        p['document']['params']['height']=130
        u=self.client.put('/api/projects/'+id,json={**p,'expected_revision':1});self.assertEqual(u.status_code,200)
        self.assertEqual(u.json()['revision'],2)
        self.assertEqual(self.client.get('/api/projects/'+id+'/revisions').json()[0]['revision'],2)
        self.assertEqual(self.client.put('/api/projects/'+id,json={**p,'expected_revision':1}).status_code,409)
    def test_project_router_supports_all_editors(self):
        html=self.client.get('/progetto.html').text
        for marker in ['FustellaLab-Carton','fustellalab-parametric-box','fustellalab-dynamic-geometry','FustellaLab-Import']:
            self.assertIn(marker,html)
        self.assertIn('openFromHome',self.client.get('/astucci.html').text)
if __name__=='__main__':unittest.main()

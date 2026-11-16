import os,tempfile,unittest
from fastapi.testclient import TestClient
with tempfile.TemporaryDirectory() as _tmp:
    pass
class ApiTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();os.environ['FUSTELLALAB_DB']=self.tmp.name+'/test.db'
        import app.main as m
        m.DB=__import__('pathlib').Path(os.environ['FUSTELLALAB_DB']);m.init_db();self.client=TestClient(m.app)
    def tearDown(self):self.client.close();self.tmp.cleanup()
    def test_create_edit_history_conflict(self):
        c=self.client;self.assertTrue(c.get('/api/health').json()['ok'])
        r=c.post('/api/projects',json={'name':'Scatola','document':{'width':200}});self.assertEqual(r.status_code,201);id=r.json()['id']
        self.assertEqual(c.get('/api/projects/'+id).json()['document']['width'],200)
        r=c.put('/api/projects/'+id,json={'name':'Scatola nuova','document':{'width':250},'expected_revision':1});self.assertEqual(r.json()['revision'],2)
        self.assertEqual(c.put('/api/projects/'+id,json={'name':'Errore','expected_revision':1}).status_code,409)
        self.assertEqual(len(c.get('/api/projects/'+id+'/revisions').json()),2)
        self.assertEqual(c.get('/api/projects/'+id+'/revisions/1').json()['document']['width'],200)
        self.assertEqual(c.delete('/api/projects/'+id).status_code,204)
        self.assertEqual(c.get('/api/projects/'+id).status_code,404)
if __name__=='__main__':unittest.main()

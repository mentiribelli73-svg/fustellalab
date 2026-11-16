"""Verifica navigazione e API senza alterare i progetti reali."""
import os, tempfile
from pathlib import Path
with tempfile.TemporaryDirectory(prefix='fustellalab-test-') as tmp:
    os.environ['FUSTELLALAB_DB'] = str(Path(tmp) / 'test.sqlite3')
    from fastapi.testclient import TestClient
    from app.main import app
    with TestClient(app) as client:
        for path in ['/', '/cad.html', '/astucci.html', '/studio.html', '/importa.html', '/editor.html', '/progetto.html', '/api/health']:
            r = client.get(path)
            assert r.status_code == 200, (path, r.status_code, r.text[:100])
            print('OK pagina', path)
        doc={'format':'FustellaLab-Carton','dimensions':{'width':65,'depth':65,'height':125}}
        r=client.post('/api/projects',json={'name':'Test automatico','document':doc});assert r.status_code==201,r.text
        p=r.json();pid=p['id']
        r=client.get('/api/projects/'+pid);assert r.status_code==200 and r.json()['document']==doc
        r=client.put('/api/projects/'+pid,json={'name':'Test modificato','document':doc,'expected_revision':1});assert r.status_code==200 and r.json()['revision']==2
        assert client.get('/api/projects/'+pid+'/revisions').json()[0]['revision']==2
        print('OK archivio: creazione, riapertura, modifica, revisioni (DB temporaneo)')
print('TEST DI INTEGRAZIONE SUPERATO. Montaggio fisico NON verificato.')

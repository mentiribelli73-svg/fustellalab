from app.pdf_export import router as carton_export_router
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from pathlib import Path
import sqlite3, json, os, datetime, uuid

BASE = Path(__file__).resolve().parent
DB = Path(os.environ.get("FUSTELLALAB_DB", str(BASE.parent / "data" / "projects.sqlite3")))
DB.parent.mkdir(parents=True,exist_ok=True)
app = FastAPI(title="FustellaLab API",version="0.4.0")

def connect():
    c=sqlite3.connect(DB); c.row_factory=sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON")
    c.execute("PRAGMA journal_mode=WAL")
    return c

def init_db():
    with connect() as c:
        c.executescript("""CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,document TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS revisions(project_id TEXT NOT NULL,revision INTEGER NOT NULL,saved_at TEXT NOT NULL,document TEXT NOT NULL,PRIMARY KEY(project_id,revision),FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE);""")
init_db()

class ProjectIn(BaseModel):
    name: str = Field(min_length=1,max_length=160)
    description: str = Field(default="",max_length=2000)
    document: dict = Field(default_factory=dict)

class UpdateIn(ProjectIn):
    expected_revision: int = Field(ge=1)

def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def row_dict(r):
    d=dict(r);d['document']=json.loads(d['document']);return d

@app.get('/api/health')
def health():return {'ok':True,'database':'sqlite','version':'0.4.0'}

@app.get('/api/projects')
def projects():
    with connect() as c:
        return [dict(r) for r in c.execute('SELECT id,name,description,created_at,updated_at,revision FROM projects ORDER BY updated_at DESC')]

@app.post('/api/projects',status_code=201)
def create(p:ProjectIn):
    id=str(uuid.uuid4());t=now();doc=json.dumps(p.document,ensure_ascii=False)
    with connect() as c:
        c.execute('INSERT INTO projects VALUES(?,?,?,?,?,?,?)',(id,p.name,p.description,t,t,1,doc))
        c.execute('INSERT INTO revisions VALUES(?,?,?,?)',(id,1,t,doc))
    return {'id':id,'revision':1}

@app.get('/api/projects/{id}')
def get_project(id:str):
    with connect() as c:r=c.execute('SELECT * FROM projects WHERE id=?',(id,)).fetchone()
    if not r:raise HTTPException(404,'Progetto non trovato')
    return row_dict(r)

@app.put('/api/projects/{id}')
def update(id:str,p:UpdateIn):
    with connect() as c:
        r=c.execute('SELECT revision FROM projects WHERE id=?',(id,)).fetchone()
        if not r:raise HTTPException(404,'Progetto non trovato')
        if r['revision']!=p.expected_revision:raise HTTPException(409,'Revisione non aggiornata: ricaricare il progetto')
        rev=r['revision']+1;t=now();doc=json.dumps(p.document,ensure_ascii=False)
        c.execute('UPDATE projects SET name=?,description=?,document=?,updated_at=?,revision=? WHERE id=?',(p.name,p.description,doc,t,rev,id))
        c.execute('INSERT INTO revisions VALUES(?,?,?,?)',(id,rev,t,doc))
    return {'id':id,'revision':rev}

@app.get('/api/projects/{id}/revisions')
def revisions(id:str):
    with connect() as c:
        if not c.execute('SELECT 1 FROM projects WHERE id=?',(id,)).fetchone():raise HTTPException(404,'Progetto non trovato')
        return [dict(r) for r in c.execute('SELECT revision,saved_at FROM revisions WHERE project_id=? ORDER BY revision DESC',(id,))]

@app.get('/api/projects/{id}/revisions/{revision}')
def revision(id:str,revision:int):
    with connect() as c:r=c.execute('SELECT * FROM revisions WHERE project_id=? AND revision=?',(id,revision)).fetchone()
    if not r:raise HTTPException(404,'Revisione non trovata')
    d=dict(r);d['document']=json.loads(d['document']);return d

@app.delete('/api/projects/{id}',status_code=204)
def delete(id:str):
    with connect() as c:
        if not c.execute('SELECT 1 FROM projects WHERE id=?',(id,)).fetchone():raise HTTPException(404,'Progetto non trovato')
        c.execute('DELETE FROM projects WHERE id=?',(id,))

@app.get('/')
def index():return FileResponse(BASE/'static'/'index.html')
app.include_router(carton_export_router)
app.mount('/',StaticFiles(directory=BASE/'static'),name='static')

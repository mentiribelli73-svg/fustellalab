/* FustellaLab project persistence for Import Studio. The CAD data stays editable in segments. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  let currentId = null, currentRevision = null;
  const status = message => { byId('dbStatus').textContent = message; };
  const payload = () => ({
    name: byId('name').value.trim() || 'Fustella senza nome',
    description: 'Fustella vettoriale modificabile',
    document: {format:'FustellaLab-Import', version:1, units:'mm', segments: structuredClone(segments)}
  });
  async function request(path, options={}) {
    const response = await fetch('/api'+path, {
      ...options, headers: {'Content-Type':'application/json', ...(options.headers||{})}
    });
    if (!response.ok) {
      let detail = response.statusText;
      try {detail = (await response.json()).detail || detail;} catch (_) {}
      throw new Error(`${response.status}: ${detail}`);
    }
    return response.status === 204 ? null : response.json();
  }
  async function refresh() {
    const items = await request('/projects');
    const select = byId('dbProjects');
    select.replaceChildren(new Option('— Nuovo progetto —', ''));
    for (const item of items) select.add(new Option(`${item.name} (rev. ${item.revision})`,item.id));
    select.value = currentId || '';
    if (currentId && !items.some(item=>item.id===currentId)) select.value='';
  }
  async function revisions() {
    const select=byId('dbRevisions');
    select.replaceChildren(new Option('— Nessuna —',''));
    if (!currentId) return;
    for (const r of await request(`/projects/${encodeURIComponent(currentId)}/revisions`)) {
      select.add(new Option(`Revisione ${r.revision} · ${new Date(r.saved_at).toLocaleString('it-IT')}`,String(r.revision)));
    }
  }
  function applyDocument(doc) {
    if (!doc || doc.format!=='FustellaLab-Import' || !Array.isArray(doc.segments))
      throw new Error('Formato progetto non supportato dall’editor');
    if (doc.segments.length > 30000 || !doc.segments.every(s=>['CUT','CREASE','PERF'].includes(s.layer) && ['x1','y1','x2','y2'].every(k=>Number.isFinite(s[k]))))
      throw new Error('Geometria non valida');
    segments=structuredClone(doc.segments); selected=-1; history=[]; fit();
  }
  async function openProject() {
    const id=byId('dbProjects').value;
    if (!id) return status('Seleziona un progetto salvato');
    const p=await request(`/projects/${encodeURIComponent(id)}`);
    applyDocument(p.document);
    currentId=p.id;currentRevision=p.revision;byId('name').value=p.name;
    await revisions();status(`Aperto: ${p.name} · revisione ${p.revision}`);
  }
  async function saveProject() {
    const data=payload();
    let result;
    if (currentId) {
      result=await request(`/projects/${encodeURIComponent(currentId)}`,{
        method:'PUT',body:JSON.stringify({...data,expected_revision:currentRevision})
      });
    } else {
      result=await request('/projects',{method:'POST',body:JSON.stringify(data)});
    }
    currentId=result.id;currentRevision=result.revision;
    await refresh();await revisions();
    status(`Salvato nel database · revisione ${currentRevision}`);
  }
  async function restoreRevision() {
    if (!currentId || !byId('dbRevisions').value) return status('Seleziona una revisione');
    const r=await request(`/projects/${encodeURIComponent(currentId)}/revisions/${byId('dbRevisions').value}`);
    applyDocument(r.document);
    status(`Revisione ${r.revision} caricata nell’editor. Premi Salva per creare una nuova revisione.`);
  }
  function handle(action) {return () => action().catch(e => {
    status(`Errore: ${e.message}`);
    if (String(e.message).startsWith('409:')) alert('Il progetto è stato modificato altrove. Riaprilo prima di salvare per evitare sovrascritture.');
  });}
  byId('dbRefresh').onclick=handle(refresh);
  byId('dbOpen').onclick=handle(openProject);
  byId('dbSave').onclick=handle(saveProject);
  byId('dbRestore').onclick=handle(restoreRevision);
  byId('dbNew').onclick=()=>{currentId=null;currentRevision=null;byId('dbProjects').value='';byId('name').value='Nuova fustella';segments=[];selected=-1;history=[];fit();revisions().catch(()=>{});status('Nuovo progetto non ancora salvato');};
  byId('dbProjects').onchange=()=>status('Premi Apri per caricare il progetto selezionato');
  handle(refresh)();
})();

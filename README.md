# FustellaLab Platform — base applicativa 0.4

Questa è una **base applicativa reale**, NON il prodotto CAD premium completo.

## Avvio

1. Installa Python 3.10+.
2. Da terminale nella cartella: `python3 -m pip install -r requirements.txt`
3. Avvia `./start_mac.command` (Mac), `./start_linux.sh` (Linux), oppure `start_windows.bat` (Windows).
4. Apri `http://127.0.0.1:8765`.

## Implementato

- API REST FastAPI e database SQLite locale persistente (`data/projects.sqlite3`).
- CRUD progetti, cronologia revisioni immutabili, controllo conflitti di revisione.
- Dashboard web, editor HTML precedente e importatore SVG/DXF precedente accessibili da un'unica installazione.
- Manifest web app (installazione dal browser ove supportata), server solo locale.
- Esportazione JSON dalla dashboard.

## Non implementato / non verificato

- L'editor e l'importatore precedenti NON salvano ancora automaticamente nel database; la dashboard gestisce documenti JSON indipendenti.
- Non è un'app Tauri nativa, né ha sincronizzazione cloud o PostgreSQL.
- Nessun CAD parametrico completo, riconoscimento automatico delle fustelle, simulazione 3D affidabile o PDF industriale.
- Non usare output di taglio/stampa senza verifica tecnica.

## Test

`python3 -m unittest discover -s tests -v`

Per un ambiente di produzione servono autenticazione, autorizzazioni, backup, migrazioni DB e collaudi.

## Git e collaborazione

Il ramo stabile è `main`. Per nuove funzionalità usa `feature/...`, per correzioni `fix/...`.
Prima di ogni merge esegui i test e verifica che nessun dato riservato sia tracciato.
Per collegare GitHub: crea un repository privato vuoto `fustellalab`, quindi esegui
`git remote add origin <URL-del-tuo-repository>` e `git push -u origin main`.

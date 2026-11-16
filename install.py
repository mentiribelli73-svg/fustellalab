from pathlib import Path
p=Path(__file__).resolve().parent
main=p/'app/main.py'
s=main.read_text()
needle='from app.pdf_export import router as carton_export_router'
if needle not in s:
    s=needle+'\n'+s
    marker="app.mount('/',StaticFiles(directory=BASE/'static'),name='static')"
    if marker not in s:raise SystemExit('main.py inatteso: nessuna modifica eseguita')
    s=s.replace(marker,'app.include_router(carton_export_router)\n'+marker)
    main.write_text(s)
print('Router PDF integrato')

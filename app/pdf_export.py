"""Export PDF vettoriale da SVG, per prototipi NON produttivi."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
import re
from io import BytesIO
router = APIRouter()
class SVGIn(BaseModel):
    svg: str = Field(min_length=100, max_length=2000000)

def _safe(svg):
    return svg.lstrip().startswith('<svg ') and not re.search(r'<\s*(script|foreignObject|image|use|!DOCTYPE|!ENTITY)\b|\bon[a-z]+\s*=|\b(?:href|src)\s*=|url\s*\(',svg,re.I)

def _svg_pdf_reportlab(svg):
    from svglib.svglib import svg2rlg
    from reportlab.graphics import renderPDF
    from reportlab.pdfgen import canvas
    from xml.etree import ElementTree as ET
    root=ET.fromstring(svg)
    def mm_to_pt(s):
        if not s or not re.fullmatch(r'\d+(?:\.\d+)?mm',s):
            raise ValueError('SVG deve avere width/height in mm')
        return float(s[:-2])*72/25.4
    w=mm_to_pt(root.get('width'));h=mm_to_pt(root.get('height'))
    if not (1<=w<=14400 and 1<=h<=14400): raise ValueError('Dimensioni PDF fuori limite')
    drawing=svg2rlg(BytesIO(svg.encode('utf-8')))
    if drawing is None or drawing.width<=0 or drawing.height<=0: raise ValueError('SVG non interpretabile')
    buf=BytesIO();c=canvas.Canvas(buf,pagesize=(w,h),pageCompression=1)
    c.saveState();c.translate(0,h);c.scale(w/drawing.width,-h/drawing.height)
    renderPDF.draw(drawing,c,0,0);c.restoreState();c.showPage();c.save()
    return buf.getvalue()

@router.post('/api/export/carton-pdf')
def carton_pdf(payload: SVGIn):
    svg=payload.svg
    if not _safe(svg): raise HTTPException(400,'SVG non consentito')
    try:
        # svglib/reportlab non richiedono la libreria nativa Cairo su macOS.
        data=_svg_pdf_reportlab(svg)
    except ImportError as e:
        raise HTTPException(503,'Installa svglib e reportlab per esportare PDF') from e
    except (ValueError,TypeError) as e:
        raise HTTPException(400,'SVG non valido: '+str(e)) from e
    except Exception as e:
        raise HTTPException(422,'Impossibile convertire questo SVG in PDF') from e
    return Response(content=data,media_type='application/pdf',headers={'Content-Disposition':'attachment; filename="fustellalab-studio-NON-PRODUTTIVO.pdf"'})

import unittest
from app.pdf_export import carton_pdf, SVGIn
class ExportTests(unittest.TestCase):
 def test_pdf(self):
  svg='<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="50mm" viewBox="0 0 100 50"><path d="M 1 1 L 99 49" stroke="black" fill="none"/></svg>'
  r=carton_pdf(SVGIn(svg=svg))
  self.assertTrue(r.body.startswith(b'%PDF'))
  import fitz
  d=fitz.open(stream=r.body,filetype='pdf')
  self.assertAlmostEqual(d[0].rect.width,100*72/25.4,delta=1)
  self.assertAlmostEqual(d[0].rect.height,50*72/25.4,delta=1)
 def test_reject_scripts(self):
  from fastapi import HTTPException
  with self.assertRaises(HTTPException):carton_pdf(SVGIn(svg='<svg '+ 'x'*110 +'><script>alert(1)</script></svg>'))
if __name__=='__main__':unittest.main()

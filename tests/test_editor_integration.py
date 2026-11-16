import unittest
from pathlib import Path
class EditorIntegrationTest(unittest.TestCase):
    def test_editor_links_store(self):
        base=Path(__file__).resolve().parents[1]/'app'/'static'
        html=(base/'importa.html').read_text()
        script=(base/'project-store.js').read_text()
        for name in ('dbProjects','dbOpen','dbSave','dbRevisions','dbRestore','dbNew'):
            self.assertIn('id="'+name+'"',html)
        self.assertIn('src="project-store.js"',html)
        self.assertIn('expected_revision:currentRevision',script)
        self.assertIn("segments=structuredClone(doc.segments)",script)

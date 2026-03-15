import os
from mailmerge import MailMerge

templates_dir = r"C:\Users\Matías Riquelme\Desktop\Contapymepuq\engine\templates"
templates = ["contrato_base.docx", "anexo_base.docx"]

for t in templates:
    path = os.path.join(templates_dir, t)
    if os.path.exists(path):
        try:
            with MailMerge(path) as document:
                fields = document.get_merge_fields()
                print(f"Fields in {t}: {fields}")
        except Exception as e:
            print(f"Error reading {t}: {e}")
    else:
        print(f"{t} not found at {path}")

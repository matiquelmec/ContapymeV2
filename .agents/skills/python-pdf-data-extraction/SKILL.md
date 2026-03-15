---
name: python-pdf-data-extraction
description: Advanced techniques for extracting data from PDFs (specifically Chilean tax forms) using coordinate-based parsing and fallback OCR. Trigger when working with F29 analysis, pdfplumber, PyMuPDF, or Tesseract.
license: MIT
metadata:
  version: "1.0.0"
---

# Python PDF Data Extraction Guidelines

Guidelines designed specifically to achieve 100% reliability reading the Chilean Formulario 29 (F29) and other tax documents.

## Core Rules

### 1. Always Prefer Coordinate/Geometrical Extraction
Text search and regex often fail due to PDF encoding issues or spacing.
- Use **`pdfplumber`** or **`PyMuPDF` (fitz)**.
- Target the physical bounding boxes (x0, y0, x1, y1) of the document where known codes (538, 511, 062) reside.
- If the layout of the SII F29 changes slightly, implement relative anchoring (find a known text anchor like "Débito Fiscal", and read the cell to its immediate right).

### 2. Implement the OCR Fallback Pattern
Never assume a PDF represents actual text. Users will upload scanned images of their tax forms.
- If geometrical text extraction returns `None` or an empty string, immediately trigger an **OCR Pipeline**.
- Use **`pytesseract`** (Tesseract OCR) over `pdf2image`.
- Pre-process the image using `OpenCV` (cv2) to enhance contrast and binarize the image before passing it to Tesseract. Tax forms often have grey backgrounds that wreck standard OCR.

### 3. Cross-Validation (The Mathematical Net)
- Extracted numbers must be logically verified.
- **Rule of Thumb:** Total IVA (Code 89) MUST equal (Débito - Crédito). 
- If the math fails, the extraction is considered compromised. Raise an explicit error rather than silently saving bad data to Supabase. This builds trust.

### 4. Clean Data Before Parsing
PDF extraction frequently includes weird artifacts like `.`, `,`, `$`, `\n`.
- Strip all non-numeric characters before casting to integers natively in Python.
- Account for the Chilean formatting (`.` for thousands, `,` for decimals).

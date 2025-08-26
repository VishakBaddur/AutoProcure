import pdfplumber
import re
from typing import Dict, Any, List, Optional

class EnhancedPDFProcessor:
    """Enhanced PDF text extraction with fallback methods"""
    
    def __init__(self):
        self.ocr_available = False
        try:
            import pytesseract
            self.ocr_available = True
        except ImportError:
            print("OCR not available - using basic text extraction")
    
    def extract_text_enhanced(self, pdf_path: str) -> Dict[str, Any]:
        """Extract text from PDF with enhanced processing"""
        try:
            # Basic text extraction
            text = self._extract_text_basic(pdf_path)
            
            if not text or len(text.strip()) < 50:
                # If basic extraction fails, try OCR
                if self.ocr_available:
                    text = self._extract_text_with_ocr(pdf_path)
                else:
                    text = "Text extraction failed - OCR not available"
            
            return {
                "text": text,
                "extraction_method": "basic" if text and len(text.strip()) >= 50 else "ocr",
                "success": bool(text and len(text.strip()) >= 50)
            }
            
        except Exception as e:
            return {
                "text": f"PDF processing failed: {str(e)}",
                "extraction_method": "error",
                "success": False
            }
    
    def _extract_text_basic(self, pdf_path: str) -> str:
        """Extract text using pdfplumber"""
        try:
            text = ""
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text
        except Exception as e:
            print(f"Basic text extraction failed: {e}")
            return ""
    
    def _extract_text_with_ocr(self, pdf_path: str) -> str:
        """Extract text using OCR (if available)"""
        try:
            # Simplified OCR fallback
            return "OCR extraction not implemented in this version"
        except Exception as e:
            print(f"OCR extraction failed: {e}")
            return ""
    
    def extract_tables(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract tables from PDF"""
        try:
            tables = []
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    page_tables = page.extract_tables()
                    for table_num, table in enumerate(page_tables):
                        if table and len(table) > 1:  # At least header + one row
                            tables.append({
                                "page": page_num + 1,
                                "table": table_num + 1,
                                "data": table
                            })
            return tables
        except Exception as e:
            print(f"Table extraction failed: {e}")
            return []

# Global instance
enhanced_pdf_processor = EnhancedPDFProcessor() 
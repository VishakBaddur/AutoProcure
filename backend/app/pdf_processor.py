import io
import pytesseract
from PIL import Image
import pdfplumber
import camelot
import tabula
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class EnhancedPDFProcessor:
    """Enhanced PDF processor with OCR and advanced table parsing"""
    
    def __init__(self):
        self.ocr_config = '--oem 3 --psm 6'  # Optimized for document text
        
    def extract_text_with_ocr(self, pdf_content: bytes) -> str:
        """Extract text from scanned PDFs using OCR"""
        try:
            # Convert PDF to images
            import pdf2image
            images = pdf2image.convert_from_bytes(pdf_content)
            
            extracted_text = ""
            for i, image in enumerate(images):
                logger.info(f"Processing page {i+1} with OCR")
                
                # Preprocess image for better OCR
                processed_image = self._preprocess_image(image)
                
                # Extract text using Tesseract
                page_text = pytesseract.image_to_string(
                    processed_image, 
                    config=self.ocr_config
                )
                
                extracted_text += f"\n--- Page {i+1} ---\n{page_text}\n"
                
            logger.info(f"OCR extracted {len(extracted_text)} characters")
            return extracted_text
            
        except Exception as e:
            logger.error(f"OCR processing failed: {str(e)}")
            return ""
    
    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """Preprocess image for better OCR results"""
        try:
            import cv2
            # Convert PIL to OpenCV format
            img_array = np.array(image)
            img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # Convert to grayscale
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            
            # Apply thresholding to get black text on white background
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Denoise
            denoised = cv2.medianBlur(thresh, 3)
            
            # Convert back to PIL
            return Image.fromarray(denoised)
            
        except Exception as e:
            logger.warning(f"Image preprocessing failed: {str(e)}")
            return image
    
    def extract_tables_advanced(self, pdf_content: bytes) -> List[Dict[str, Any]]:
        """Extract tables using multiple methods for better accuracy"""
        tables = []
        
        try:
            # Method 1: Camelot (best for complex tables)
            try:
                camelot_tables = camelot.read_pdf(io.BytesIO(pdf_content), pages='all')
                for table in camelot_tables:
                    if table.accuracy > 80:  # Only use high-accuracy tables
                        tables.append({
                            'method': 'camelot',
                            'accuracy': table.accuracy,
                            'data': table.df.to_dict('records'),
                            'headers': table.df.columns.tolist() if not table.df.empty else []
                        })
            except Exception as e:
                logger.warning(f"Camelot table extraction failed: {str(e)}")
            
            # Method 2: Tabula (good for simple tables)
            try:
                tabula_tables = tabula.read_pdf(io.BytesIO(pdf_content), pages='all')
                for i, table in enumerate(tabula_tables):
                    if not table.empty:
                        tables.append({
                            'method': 'tabula',
                            'accuracy': 85,  # Estimated accuracy
                            'data': table.to_dict('records'),
                            'headers': table.columns.tolist()
                        })
            except Exception as e:
                logger.warning(f"Tabula table extraction failed: {str(e)}")
            
            # Method 3: PDFPlumber (fallback)
            try:
                with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
                    for page in pdf.pages:
                        page_tables = page.extract_tables()
                        for table in page_tables:
                            if table and len(table) > 1:  # At least header + one row
                                # Convert to structured format
                                headers = table[0] if table else []
                                data = []
                                for row in table[1:]:
                                    if any(cell and str(cell).strip() for cell in row):
                                        data.append(dict(zip(headers, row)))
                                
                                if data:
                                    tables.append({
                                        'method': 'pdfplumber',
                                        'accuracy': 75,  # Estimated accuracy
                                        'data': data,
                                        'headers': headers
                                    })
            except Exception as e:
                logger.warning(f"PDFPlumber table extraction failed: {str(e)}")
                
        except Exception as e:
            logger.error(f"Table extraction failed: {str(e)}")
        
        return tables
    
    def extract_text_enhanced(self, pdf_content: bytes) -> Dict[str, Any]:
        """Enhanced text extraction with OCR fallback and table detection"""
        result = {
            'text': '',
            'tables': [],
            'extraction_method': 'standard',
            'ocr_used': False
        }
        
        try:
            # First try standard text extraction
            with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
                text_content = ""
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    text_content += page_text + "\n"
                
                # Check if we got meaningful text
                if len(text_content.strip()) > 100:
                    result['text'] = text_content
                    result['extraction_method'] = 'standard'
                    logger.info("Standard text extraction successful")
                else:
                    # Fallback to OCR
                    logger.info("Standard extraction failed, trying OCR")
                    ocr_text = self.extract_text_with_ocr(pdf_content)
                    if ocr_text:
                        result['text'] = ocr_text
                        result['extraction_method'] = 'ocr'
                        result['ocr_used'] = True
                        logger.info("OCR text extraction successful")
                    else:
                        result['text'] = text_content  # Use whatever we got
                        logger.warning("Both standard and OCR extraction failed")
            
            # Extract tables regardless of text extraction method
            result['tables'] = self.extract_tables_advanced(pdf_content)
            logger.info(f"Extracted {len(result['tables'])} tables")
            
        except Exception as e:
            logger.error(f"Enhanced text extraction failed: {str(e)}")
            # Final fallback to OCR
            try:
                ocr_text = self.extract_text_with_ocr(pdf_content)
                result['text'] = ocr_text
                result['extraction_method'] = 'ocr_fallback'
                result['ocr_used'] = True
            except Exception as ocr_error:
                logger.error(f"OCR fallback also failed: {str(ocr_error)}")
                result['text'] = "Extraction failed"
        
        return result

# Global instance
enhanced_pdf_processor = EnhancedPDFProcessor() 
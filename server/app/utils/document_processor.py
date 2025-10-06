import os
from docx import Document
from typing import Optional
import logging
from PIL import Image
import io

# Try to import PDF libraries in order of preference
PDF_LIBRARY = None
try:
    import fitz  # PyMuPDF
    PDF_LIBRARY = "pymupdf"
    logger = logging.getLogger(__name__)
    logger.info("Using PyMuPDF for PDF processing")
except ImportError:
    try:
        import PyPDF2
        PDF_LIBRARY = "pypdf2"
        logger = logging.getLogger(__name__)
        logger.info("Using PyPDF2 for PDF processing")
    except ImportError:
        try:
            import pdfplumber
            PDF_LIBRARY = "pdfplumber"
            logger = logging.getLogger(__name__)
            logger.info("Using pdfplumber for PDF processing")
        except ImportError:
            logger = logging.getLogger(__name__)
            logger.warning("No PDF processing library available")

# Try to import OCR library for image processing
OCR_AVAILABLE = False
try:
    import pytesseract
    OCR_AVAILABLE = True
    logger = logging.getLogger(__name__)
    logger.info("Tesseract OCR available for image processing")
except ImportError:
    logger = logging.getLogger(__name__)
    logger.warning("Tesseract OCR not available. Image files will be described without text extraction.")

class DocumentProcessor:
    """Handles extraction of text from various document formats."""
    
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """Extract text from PDF file using available library."""
        if PDF_LIBRARY == "pymupdf":
            return DocumentProcessor._extract_with_pymupdf(file_path)
        elif PDF_LIBRARY == "pypdf2":
            return DocumentProcessor._extract_with_pypdf2(file_path)
        elif PDF_LIBRARY == "pdfplumber":
            return DocumentProcessor._extract_with_pdfplumber(file_path)
        else:
            raise ImportError("No PDF processing library available. Please install PyMuPDF, PyPDF2, or pdfplumber.")
    
    @staticmethod
    def _extract_with_pymupdf(file_path: str) -> str:
        """Extract text using PyMuPDF."""
        try:
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from PDF {file_path}: {str(e)}")
            raise
    
    @staticmethod
    def _extract_with_pypdf2(file_path: str) -> str:
        """Extract text using PyPDF2."""
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text()
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from PDF {file_path}: {str(e)}")
            raise
    
    @staticmethod
    def _extract_with_pdfplumber(file_path: str) -> str:
        """Extract text using pdfplumber."""
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from PDF {file_path}: {str(e)}")
            raise
    
    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        """Extract text from DOCX file."""
        try:
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from DOCX {file_path}: {str(e)}")
            raise
    
    @staticmethod
    def extract_text_from_txt(file_path: str) -> str:
        """Extract text from TXT file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read().strip()
        except UnicodeDecodeError:
            # Try with different encoding if UTF-8 fails
            try:
                with open(file_path, 'r', encoding='latin-1') as file:
                    return file.read().strip()
            except Exception as e:
                logger.error(f"Error extracting text from TXT {file_path}: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"Error extracting text from TXT {file_path}: {str(e)}")
            raise
    
    @staticmethod
    def extract_text_from_image(file_path: str) -> str:
        """Extract text from image file using OCR or return a description."""
        try:
            # Open image
            image = Image.open(file_path)
            
            # Try OCR if available
            if OCR_AVAILABLE:
                try:
                    text = pytesseract.image_to_string(image)
                    if text.strip():
                        return text.strip()
                except Exception as ocr_error:
                    logger.warning(f"OCR failed for {file_path}: {str(ocr_error)}")
            
            # If OCR not available or no text found, return a descriptive message
            # This allows the system to still process the image through the AI pipeline
            filename = os.path.basename(file_path)
            return f"This is an image file ({filename}) uploaded as a complaint. The image may contain visual evidence of the reported issue. Please review the attached image for details."
            
        except Exception as e:
            logger.error(f"Error processing image {file_path}: {str(e)}")
            raise
    
    @classmethod
    def extract_text(cls, file_path: str) -> str:
        """Extract text from file based on its extension."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.pdf':
            return cls.extract_text_from_pdf(file_path)
        elif file_extension == '.docx':
            return cls.extract_text_from_docx(file_path)
        elif file_extension == '.txt':
            return cls.extract_text_from_txt(file_path)
        elif file_extension in ['.png', '.jpg', '.jpeg', '.gif', '.bmp']:
            return cls.extract_text_from_image(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and preprocess extracted text."""
        # Remove excessive whitespace and newlines
        text = ' '.join(text.split())
        
        # Remove special characters that might interfere with processing
        # Keep basic punctuation for context
        import re
        text = re.sub(r'[^\w\s.,!?;:()\-]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()

import PyPDF2
from docx import Document
import re
from typing import Dict, Optional

class ResumeParser:
    def __init__(self):
        self.name_pattern = r'^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*$'
        self.email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        self.phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'

    def extract_from_pdf(self, file_path: str) -> Dict[str, Optional[str]]:
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text()
        return self._extract_info(text)

    def extract_from_docx(self, file_path: str) -> Dict[str, Optional[str]]:
        doc = Document(file_path)
        text = " ".join([paragraph.text for paragraph in doc.paragraphs])
        return self._extract_info(text)

    def _extract_info(self, text: str) -> Dict[str, Optional[str]]:
       
        name = None
        email = None
        phone = None

       
        email_match = re.search(self.email_pattern, text)
        if email_match:
            email = email_match.group()

       
        phone_match = re.search(self.phone_pattern, text)
        if phone_match:
            phone = phone_match.group()

        lines = text.split('\n')
        for line in lines[:5]:  
            if re.match(self.name_pattern, line.strip()):
                name = line.strip()
                break
        print(name,email,phone)

        return {
            "name": name,
            "email": email,
            "phone": phone
        }
"""
PDF Generator for Complaint Documents
Generates formatted PDF documents from complaint form data
"""
from __future__ import annotations

import io
from datetime import datetime
from typing import Any, Dict, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    Image as RLImage
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


class ComplaintPDFGenerator:
    """Generates formatted PDF documents for complaints"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Header style
        self.styles.add(ParagraphStyle(
            name='CustomHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))
        
        # Info label style
        self.styles.add(ParagraphStyle(
            name='InfoLabel',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#4b5563'),
            fontName='Helvetica-Bold'
        ))
        
        # Info value style
        self.styles.add(ParagraphStyle(
            name='InfoValue',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#111827')
        ))
    
    def generate_complaint_pdf(self, complaint_data: Dict[str, Any]) -> bytes:
        """
        Generate a formatted PDF document from complaint data
        
        Args:
            complaint_data: Dictionary containing complaint information
        
        Returns:
            PDF document as bytes
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Build PDF content
        story = []
        
        # Header/Title
        story.append(Paragraph("Government Portal", self.styles['CustomTitle']))
        story.append(Paragraph("Complaint Registration Document", self.styles['Heading2']))
        story.append(Spacer(1, 0.3 * inch))
        
        # Complaint ID Box
        complaint_id = complaint_data.get('id', 'N/A')
        id_data = [[Paragraph(f"<b>Complaint ID: {complaint_id}</b>", self.styles['Normal'])]]
        id_table = Table(id_data, colWidths=[6 * inch])
        id_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#dbeafe')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1e40af')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#1e40af'))
        ]))
        story.append(id_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Complainant Information
        story.append(Paragraph("Complainant Information", self.styles['CustomHeader']))
        
        complainant_data = [
            ['Name:', complaint_data.get('user_name', 'N/A')],
            ['Email:', complaint_data.get('user_email', complaint_data.get('contact_email', 'N/A'))],
            ['Phone:', complaint_data.get('contact_phone', 'N/A')],
            ['Submitted Date:', self._format_date(complaint_data.get('submitted_date'))]
        ]
        
        complainant_table = Table(complainant_data, colWidths=[1.5 * inch, 4.5 * inch])
        complainant_table.setStyle(self._get_info_table_style())
        story.append(complainant_table)
        story.append(Spacer(1, 0.2 * inch))
        
        # Complaint Details
        story.append(Paragraph("Complaint Details", self.styles['CustomHeader']))
        
        details_data = [
            ['Title:', complaint_data.get('title', 'N/A')],
            ['Category:', complaint_data.get('category', 'General')],
            ['Location:', complaint_data.get('location', 'N/A')],
            ['Urgency:', complaint_data.get('urgency', 'Medium').upper()],
            ['Priority:', complaint_data.get('priority', 'Medium').upper()],
            ['Status:', complaint_data.get('status', 'Pending').upper()],
        ]
        
        if complaint_data.get('date_occurred'):
            details_data.append(['Date Occurred:', self._format_date(complaint_data.get('date_occurred'))])
        
        if complaint_data.get('assigned_department'):
            details_data.append(['Assigned Department:', complaint_data.get('assigned_department')])
        
        details_table = Table(details_data, colWidths=[1.5 * inch, 4.5 * inch])
        details_table.setStyle(self._get_info_table_style())
        story.append(details_table)
        story.append(Spacer(1, 0.2 * inch))
        
        # Description
        story.append(Paragraph("Description", self.styles['CustomHeader']))
        description = complaint_data.get('description', 'No description provided.')
        story.append(Paragraph(description, self.styles['Normal']))
        story.append(Spacer(1, 0.2 * inch))
        
        # AI Analysis (if available)
        if complaint_data.get('ai_response'):
            story.append(Paragraph("AI Analysis & Recommendations", self.styles['CustomHeader']))
            story.append(Paragraph(complaint_data.get('ai_response'), self.styles['Normal']))
            story.append(Spacer(1, 0.2 * inch))
        
        # RAG Summary (if available)
        if complaint_data.get('rag_summary'):
            story.append(Paragraph("RAG Intelligence Summary", self.styles['CustomHeader']))
            story.append(Paragraph(complaint_data.get('rag_summary'), self.styles['Normal']))
            story.append(Spacer(1, 0.2 * inch))
        
        # Attachments
        if complaint_data.get('attachments'):
            story.append(Paragraph("Attachments", self.styles['CustomHeader']))
            attachments = complaint_data.get('attachments', [])
            attachment_text = "<br/>".join([f"• {att.get('filename', 'Unknown')}" for att in attachments])
            story.append(Paragraph(attachment_text, self.styles['Normal']))
            story.append(Spacer(1, 0.2 * inch))
        
        # Footer
        story.append(Spacer(1, 0.5 * inch))
        footer_data = [[
            Paragraph(
                f"<i>Generated on {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}</i><br/>"
                f"<i>This is an official complaint document from the Government Portal System</i>",
                self.styles['Normal']
            )
        ]]
        footer_table = Table(footer_data, colWidths=[6 * inch])
        footer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 8)
        ]))
        story.append(footer_table)
        
        # Build PDF
        doc.build(story)
        
        # Get PDF bytes
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
    
    def _get_info_table_style(self) -> TableStyle:
        """Get standard style for information tables"""
        return TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#4b5563')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ROWBACKGROUNDS', (1, 0), (1, -1), [colors.white, colors.HexColor('#f9fafb')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6)
        ])
    
    def _format_date(self, date_value: Any) -> str:
        """Format date value for display"""
        if not date_value:
            return 'N/A'
        
        if isinstance(date_value, datetime):
            return date_value.strftime('%B %d, %Y %H:%M')
        elif isinstance(date_value, str):
            try:
                dt = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
                return dt.strftime('%B %d, %Y %H:%M')
            except:
                return date_value
        
        return str(date_value)


def generate_complaint_document(complaint_data: Dict[str, Any]) -> bytes:
    """
    Generate a formatted complaint PDF document
    
    Args:
        complaint_data: Dictionary containing complaint information
    
    Returns:
        PDF document as bytes
    """
    generator = ComplaintPDFGenerator()
    return generator.generate_complaint_pdf(complaint_data)

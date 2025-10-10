# 🏗️ Dual Submission Interface - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUBMIT COMPLAINT PAGE                                │
│                     (SubmitComplaint.jsx Component)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │      MODE SWITCHER (Tabs)         │
                    │  [📝 Text] [📄 Document]          │
                    └─────────────────┬─────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
          ┌─────────▼─────────┐              ┌─────────▼─────────┐
          │   TEXT MODE       │              │  DOCUMENT MODE    │
          │   (Form Entry)    │              │  (File Upload)    │
          └─────────┬─────────┘              └─────────┬─────────┘
                    │                                   │
    ┌───────────────┼───────────────┐      ┌──────────┼──────────┐
    │               │               │      │          │          │
┌───▼───┐     ┌────▼────┐    ┌────▼────┐ │     ┌────▼────┐    │
│ Form  │     │   AI    │    │ Similar │ │     │   RAG   │    │
│ Input │────▶│Analysis │───▶│Complaints│ │     │Extract  │    │
└───────┘     │(1.5s)   │    └─────────┘ │     └────┬────┘    │
              └─────────┘                 │          │         │
                    │                     │     ┌────▼────┐    │
                    │                     │     │ Review  │    │
                    │                     │     │ & Edit  │    │
                    │                     │     └────┬────┘    │
                    │                     │          │         │
              ┌─────▼─────┐               │     ┌────▼────┐    │
              │  Validate │               │     │ Confirm │    │
              └─────┬─────┘               │     └────┬────┘    │
                    │                     │          │         │
                    └─────────┬───────────┘          │         │
                              │                      │         │
                    ┌─────────▼──────────────────────▼─────┐   │
                    │      SUBMISSION HANDLER               │   │
                    └──────────────┬───────────────────────┘   │
                                   │                           │
                  ┌────────────────┴────────────────┐          │
                  │                                 │          │
        ┌─────────▼─────────┐          ┌──────────▼──────────┐│
        │   Complaints API  │          │     RAG API         ││
        │  /api/complaints  │          │ /api/rag/upload     ││
        │    /text          │          │                     ││
        └─────────┬─────────┘          └──────────┬──────────┘│
                  │                               │           │
                  └───────────┬───────────────────┘           │
                              │                               │
                    ┌─────────▼─────────┐                     │
                    │   BACKEND         │                     │
                    │   Processing      │                     │
                    └─────────┬─────────┘                     │
                              │                               │
              ┌───────────────┼───────────────┐               │
              │               │               │               │
    ┌─────────▼─────────┐ ┌──▼──────┐ ┌─────▼────────┐       │
    │   PostgreSQL      │ │ Vector  │ │  AI Engine   │       │
    │   (Complaints)    │ │   DB    │ │ (Groq/OpenAI)│       │
    └─────────┬─────────┘ └──┬──────┘ └──────────────┘       │
              │               │                               │
              └───────────────┼───────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  SUCCESS SCREEN   │
                    │  - Complaint ID   │
                    │  - AI Summary     │
                    │  - Department     │
                    │  - Resolution Est.│
                    └───────────────────┘
```

---

## Data Flow Diagrams

### 📝 Text Mode Data Flow

```
User Input (Form Fields)
        ↓
[Debounce Timer: 1.5s]
        ↓
AI Analysis API Call
        ↓
┌──────────────────────────┐
│ RAG Analysis Response:   │
│ - Similar Complaints     │
│ - Category Suggestion    │
│ - Department Suggestion  │
│ - Priority Prediction    │
└──────────────────────────┘
        ↓
Display Suggestions to User
        ↓
User Reviews & Submits
        ↓
POST /api/complaints/text
        ↓
┌──────────────────────────┐
│ Backend Processing:      │
│ 1. Validate data         │
│ 2. AI categorization     │
│ 3. Save to PostgreSQL    │
│ 4. Store in Vector DB    │
│ 5. Assign department     │
└──────────────────────────┘
        ↓
Return Success Response
        ↓
Display Success Screen
```

### 📄 Document Mode Data Flow

```
User Uploads Document
        ↓
File Validation (type, size)
        ↓
POST to RAG Upload API
        ↓
┌──────────────────────────┐
│ RAG Pipeline:            │
│ 1. Extract text (OCR)    │
│ 2. Parse content         │
│ 3. AI analysis           │
│ 4. Categorize            │
│ 5. Detect urgency        │
│ 6. Extract location      │
│ 7. Generate summary      │
└──────────────────────────┘
        ↓
Return Extracted Data
        ↓
┌──────────────────────────┐
│ Extracted Fields:        │
│ - Title                  │
│ - Category               │
│ - Description            │
│ - Location               │
│ - Urgency                │
│ - Vector DB ID           │
│ - Complaint ID           │
└──────────────────────────┘
        ↓
Display for User Review
        ↓
User Confirms
        ↓
Create Complaint Record
(Already processed by RAG)
        ↓
Display Success Screen
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Component State                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Submission Mode Control:                                   │
│  ├─ submissionMode: 'text' | 'document'                     │
│  └─ Determines which UI to render                           │
│                                                              │
│  Text Mode States:                                          │
│  ├─ formData: {title, category, description...}             │
│  ├─ ragAnalysis: AI analysis results                        │
│  ├─ similarComplaints: Array of similar issues              │
│  ├─ isAnalyzing: Boolean (AI processing status)             │
│  └─ aiInsights: AI suggestions and recommendations          │
│                                                              │
│  Document Mode States:                                      │
│  ├─ uploadedDocument: File object                           │
│  ├─ extractedData: {title, category, description...}        │
│  ├─ isExtracting: Boolean (RAG processing status)           │
│  └─ showConfirmation: Boolean (review screen)               │
│                                                              │
│  Shared States:                                             │
│  ├─ isSubmitting: Boolean (submission in progress)          │
│  └─ submitStatus: {type, message, data} (result)            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Mapping

```
┌─────────────────────────────────────────────────────────────┐
│                     API Endpoints                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Text Complaint:                                            │
│  POST /api/complaints/text                                  │
│  ├─ Request: {title, category, description, location...}    │
│  ├─ Response: {complaint_id, ai_summary, vector_db_id...}   │
│  └─ Function: complaintsAPI.submitComplaint()               │
│                                                              │
│  AI Analysis:                                               │
│  POST /api/rag/analyze-text                                 │
│  ├─ Request: {title, description, category, urgency}        │
│  ├─ Response: {similar_complaints, suggestions...}          │
│  └─ Function: ragAPI.analyzeComplaintText()                 │
│                                                              │
│  Document Upload:                                           │
│  POST /api/rag/upload                                       │
│  ├─ Request: FormData with file                             │
│  ├─ Response: {complaint_id, summary, department...}        │
│  └─ Function: ragAPI.uploadDocument()                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
SubmitComplaint (Main Component)
│
├─── Layout (Wrapper)
│    └─── Header, Sidebar, Footer
│
├─── Mode Switcher (Tab Navigation)
│    ├─── Text Complaint Tab
│    └─── Document Upload Tab
│
├─── Text Mode (Conditional Render)
│    ├─── Form Fields
│    │    ├─── Title Input
│    │    ├─── Category Select
│    │    ├─── Description Textarea
│    │    ├─── Location Input
│    │    ├─── Contact Inputs
│    │    ├─── Urgency Radio Buttons
│    │    └─── File Upload (Optional)
│    │
│    ├─── AI Analysis Panel
│    │    ├─── Loading Indicator
│    │    ├─── Similar Complaints List
│    │    └─── AI Suggestions
│    │
│    └─── Submit Button
│
├─── Document Mode (Conditional Render)
│    ├─── Upload Zone
│    │    ├─── Drag & Drop Area
│    │    ├─── File Selector Button
│    │    └─── Progress Indicator
│    │
│    ├─── Extraction Panel (After Upload)
│    │    ├─── Loading State
│    │    └─── Extracted Data Display
│    │
│    └─── Confirmation Panel
│         ├─── Review Cards
│         ├─── Cancel Button
│         └─── Confirm Button
│
├─── Success Screen (After Submission)
│    ├─── Success Icon
│    ├─── Complaint ID Display
│    ├─── AI Analysis Summary
│    ├─── Department Assignment
│    ├─── Resolution Estimate
│    └─── Action Buttons
│
└─── Error Panel (On Failure)
     ├─── Error Icon
     ├─── Error Message
     └─── Retry Option
```

---

## Event Flow Timeline

```
TEXT MODE:
0ms     → User selects "Text Complaint"
10ms    → Form renders
1000ms  → User types in title/description
2500ms  → Debounce timer completes (1.5s after last keystroke)
2600ms  → AI analysis API call initiated
3200ms  → AI analysis results received
3250ms  → Similar complaints displayed
10000ms → User finishes form and clicks submit
10100ms → Validation runs
10200ms → Submit API call
11000ms → Response received
11050ms → Success screen renders

DOCUMENT MODE:
0ms     → User selects "Document Upload"
10ms    → Upload interface renders
5000ms  → User selects/drops file
5100ms  → File validation
5200ms  → RAG upload API call
5300ms  → "Analyzing Document..." shown
12000ms → RAG processing complete (varies by file)
12100ms → Extracted data received
12150ms → Review screen renders
20000ms → User reviews and confirms
20100ms → Complaint already created, show success
20150ms → Success screen renders
```

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Stack                            │
├─────────────────────────────────────────────────────────────┤
│  Framework:  React 19.1.0                                   │
│  Build Tool: Vite 6.0.11                                    │
│  Styling:    Tailwind CSS 3.4.17                            │
│  Icons:      Lucide React 0.471.1                           │
│  Routing:    React Router DOM 7.1.1                         │
│  HTTP:       Axios (via api.js utilities)                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Backend Stack                             │
├─────────────────────────────────────────────────────────────┤
│  Framework:  FastAPI (Python)                               │
│  Database:   PostgreSQL                                     │
│  Vector DB:  ChromaDB                                       │
│  AI Engine:  Groq API / OpenAI                              │
│  OCR:        PyPDF2, python-docx, Pillow                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Security & Validation

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend Validation:                                       │
│  ✓ File type validation (PDF, DOCX, PNG, JPG)              │
│  ✓ File size limit (10MB)                                  │
│  ✓ Form field validation                                   │
│  ✓ Input sanitization                                      │
│                                                              │
│  Backend Validation:                                        │
│  ✓ JWT token authentication                                │
│  ✓ File mime type verification                             │
│  ✓ SQL injection prevention                                │
│  ✓ XSS protection                                          │
│  ✓ Rate limiting                                           │
│                                                              │
│  Data Privacy:                                              │
│  ✓ Encrypted connections (HTTPS)                           │
│  ✓ Secure file storage                                     │
│  ✓ PII protection                                          │
│  ✓ GDPR compliance ready                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Architecture Version:** 1.0  
**Last Updated:** October 10, 2025  
**Status:** Production Ready ✅

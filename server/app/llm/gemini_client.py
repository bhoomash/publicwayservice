import google.generativeai as genai
from typing import Dict, Any, List, Optional
import json
import logging
from app.rag_config import Config

logger = logging.getLogger(__name__)

class GeminiClient:
    """Client for Google Gemini API operations."""
    
    def __init__(self):
        if not Config.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        genai.configure(api_key=Config.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel(Config.GEMINI_MODEL)
    
    def summarize_complaint(self, text: str) -> str:
        """Generate a concise summary of the complaint."""
        prompt = f"""
        Please provide a concise summary of the following complaint or report. 
        Focus on the main issue, location (if mentioned), and key details.
        Keep the summary under 100 words and make it clear and actionable.
        
        Complaint text:
        {text}
        
        Summary:
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            raise
    
    def classify_urgency(self, text: str) -> str:
        """Classify the urgency level of the complaint."""
        prompt = f"""
        Analyze the following complaint and classify its urgency level based on these criteria:
        
        HIGH: Emergency situations, immediate safety risks, critical infrastructure failures, 
              health hazards, accidents, or situations requiring immediate attention.
        
        MEDIUM: Important issues that need attention within days/weeks, moderate inconvenience,
                non-critical infrastructure problems, or issues affecting multiple people.
        
        LOW: Minor issues, routine maintenance requests, suggestions for improvement,
             or non-urgent matters that can be addressed in regular workflow.
        
        Complaint text:
        {text}
        
        Respond with only one word: HIGH, MEDIUM, or LOW
        """
        
        try:
            response = self.model.generate_content(prompt)
            urgency = response.text.strip().upper()
            
            # Map to our standard format
            if urgency in ["HIGH", "EMERGENCY", "URGENT"]:
                return "High"
            elif urgency in ["MEDIUM", "MODERATE"]:
                return "Medium"
            else:
                return "Low"
        except Exception as e:
            logger.error(f"Error classifying urgency: {str(e)}")
            return "Medium"  # Default to medium if classification fails
    
    def extract_location(self, text: str) -> str:
        """Extract location information from the complaint."""
        prompt = f"""
        Analyze the following complaint and extract the specific location mentioned.
        Look for:
        - Street names, road names, avenue names
        - Landmarks, buildings, institutions
        - Intersections, cross streets
        - Area names, neighborhood names
        - Specific addresses or address ranges
        
        If multiple locations are mentioned, focus on the primary location where the issue occurs.
        If no specific location is found, return "Location not specified".
        
        Complaint text:
        {text}
        
        Respond with only the extracted location in a clear, concise format (e.g., "Main Street between 5th Avenue and 7th Avenue" or "City Park near the playground").
        """
        
        try:
            response = self.model.generate_content(prompt)
            location = response.text.strip()
            
            # Clean up the response
            if location.lower() in ["none", "not specified", "no location", "unknown"]:
                return "Location not specified"
            
            return location
        except Exception as e:
            logger.error(f"Error extracting location: {str(e)}")
            return "Location not specified"
    
    def detect_department(self, text: str) -> str:
        """Detect the most relevant department for the complaint."""
        departments_str = ", ".join(Config.DEPARTMENTS)
        
        prompt = f"""
        Analyze the following complaint and determine which department should handle it.
        
        Available departments:
        {departments_str}
        
        Guidelines:
        - Transport Department: Roads, traffic, vehicles, parking, public transport
        - Municipality: General civic issues, permits, local governance
        - Sanitation Department: Waste management, cleaning, garbage collection
        - Health Department: Public health, hospitals, disease control, food safety
        - Water Department: Water supply, drainage, sewage, plumbing
        - Electricity Department: Power supply, electrical issues, street lights
        - Public Works Department: Construction, infrastructure, building maintenance
        - Environment Department: Pollution, environmental protection, green spaces
        - Education Department: Schools, educational facilities, academic issues
        - Police Department: Crime, law enforcement, public safety, traffic violations
        
        Complaint text:
        {text}
        
        Respond with only the exact department name from the list above.
        """
        
        try:
            response = self.model.generate_content(prompt)
            department = response.text.strip()
            
            # Validate the response is in our department list
            if department in Config.DEPARTMENTS:
                return department
            else:
                # Try to find a close match
                for dept in Config.DEPARTMENTS:
                    if dept.lower() in department.lower() or department.lower() in dept.lower():
                        return dept
                
                # Default fallback
                return "Municipality"
        except Exception as e:
            logger.error(f"Error detecting department: {str(e)}")
            return "Municipality"  # Default department
    
    def process_complaint(self, text: str) -> Dict[str, Any]:
        """Process a complaint to extract summary, urgency, department, and location."""
        try:
            # Generate summary
            summary = self.summarize_complaint(text)
            
            # Classify urgency
            urgency = self.classify_urgency(text)
            
            # Detect department
            department = self.detect_department(text)
            
            # Extract location
            location = self.extract_location(text)
            
            # Get color information
            urgency_info = Config.URGENCY_LEVELS.get(urgency, Config.URGENCY_LEVELS["Medium"])
            
            result = {
                "summary": summary,
                "urgency": urgency,
                "color": urgency_info["color"],
                "emoji": urgency_info["emoji"],
                "department": department,
                "location": location
            }
            
            logger.info(f"Processed complaint: {urgency} urgency, {department}, Location: {location}")
            return result
            
        except Exception as e:
            logger.error(f"Error processing complaint: {str(e)}")
            raise

    def assess_relevance(self, text: str) -> Dict[str, Any]:
        """Determine if the submitted content represents a civic/government complaint."""
        prompt = f"""
        You are validating whether the following text is a civic/government complaint that should be handled by a public service portal.
        Consider the following as VALID complaints:
        - Issues with public infrastructure, utilities, safety, sanitation, transport, governance, corruption, healthcare, education.
        - Any report requiring government/municipal attention.

        Consider the following as INVALID submissions:
        - Personal resumes, biographies, advertisements, job inquiries, promotional content.
        - Irrelevant chatter, jokes, essays, or content not asking for civic/government action.
        - Content that lacks any actionable issue for a public department.

        Analyze the text and respond STRICTLY as minified JSON in the format:
        {{"is_relevant": <true/false>, "confidence": <0 to 1>, "category": "<short label>", "reason": "<one sentence justification>"}}

        Text:
        {text}
        """

        try:
            response = self.model.generate_content(prompt)
            raw_text = (response.text or "").strip()

            json_start = raw_text.find("{")
            json_end = raw_text.rfind("}")
            if json_start != -1 and json_end != -1:
                raw_text = raw_text[json_start:json_end + 1]

            relevance = json.loads(raw_text)
            relevance["is_relevant"] = bool(relevance.get("is_relevant", False))
            relevance["confidence"] = float(relevance.get("confidence", 0))
            relevance.setdefault("category", "unknown")
            relevance.setdefault("reason", "No justification provided")
            return relevance
        except Exception as e:
            logger.error(f"Error assessing relevance: {str(e)}")
            # Fallback heuristic: treat text as relevant but low confidence
            return {
                "is_relevant": True,
                "confidence": 0.3,
                "category": "fallback",
                "reason": "Relevance assessment failed; defaulting to allow submission"
            }

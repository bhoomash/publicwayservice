import os
import json
import requests
import asyncio
import random
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from .config import GROQ_API_KEY, FIREWORKS_API_KEY, GEMINI_API_KEY

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIService:
    """AI Service for complaint analysis and categorization using Groq and Fireworks APIs"""
    
    def __init__(self):
        # API Keys from environment - NO HARDCODED KEYS FOR SECURITY
        self.groq_api_key = GROQ_API_KEY
        self.fireworks_api_key = FIREWORKS_API_KEY
        self.gemini_api_key = GEMINI_API_KEY
        
        if not self.groq_api_key:
            logger.warning("GROQ_API_KEY not set in environment variables")
        if not self.fireworks_api_key:
            logger.warning("FIREWORKS_API_KEY not set in environment variables")
        if not self.gemini_api_key:
            logger.warning("GEMINI_API_KEY not set in environment variables")
        
        # API URLs
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"
        self.fireworks_url = "https://api.fireworks.ai/inference/v1/chat/completions"
        
        # Department mappings
        self.departments = {
            "Infrastructure": "Municipal Corporation - Infrastructure Division",
            "Utilities": "Public Utilities Department",
            "Transportation": "Department of Transportation",
            "Public Safety": "Public Safety & Emergency Services",
            "Healthcare": "Department of Health Services",
            "Education": "Department of Education",
            "Environmental": "Environmental Protection Agency",
            "Corruption": "Anti-Corruption Bureau",
            "Administrative": "General Administration Department",
            "Other": "General Services Department"
        }
        
        # Legacy categories for fallback
        self.categories = {
            "Infrastructure": ["road", "bridge", "building", "construction", "street", "light", "sidewalk"],
            "Utilities": ["water", "electricity", "power", "supply", "outage", "billing", "meter"],
            "Environmental": ["pollution", "noise", "waste", "garbage", "recycling", "air", "smell"],
            "Public Safety": ["crime", "safety", "security", "police", "fire", "emergency"],
            "Healthcare": ["hospital", "clinic", "medical", "health", "doctor", "ambulance"],
            "Education": ["school", "college", "university", "education", "teacher", "student"],
            "Transportation": ["bus", "train", "traffic", "parking", "vehicle", "transport"],
            "Administrative": ["office", "document", "permit", "license", "bureaucracy", "service"]
        }
        
        self.urgency_multipliers = {
            "low": 1.0,
            "medium": 1.5,
            "high": 2.0
        }
    
    async def analyze_complaint(self, title: str, description: str, urgency: str, location: str) -> Dict[str, Any]:
        """Analyze complaint and return AI recommendations using external APIs"""
        
        try:
            # Step 1: Categorize the complaint using Groq
            category = await self._categorize_complaint_groq(title, description)
            
            # Step 2: Calculate priority score using Fireworks
            priority_score = await self._calculate_priority_score_fireworks(title, description, urgency, category)
            
            # Step 3: Assign department
            assigned_department = self.departments.get(category, self.departments["Other"])
            
            # Step 4: Generate AI response using Groq
            suggested_response = await self._generate_response_groq(title, description, category, urgency)
            
            # Step 5: Estimate resolution time
            estimated_resolution = self._estimate_resolution_time(category, urgency, priority_score)
            
            return {
                "category": category,
                "priority_score": priority_score,
                "assigned_department": assigned_department,
                "suggested_response": suggested_response,
                "estimated_resolution": estimated_resolution,
                "analysis_timestamp": datetime.utcnow().isoformat(),
                "confidence_score": min(95, max(75, priority_score + 10))
            }
            
        except Exception as e:
            logger.error(f"AI analysis failed, using fallback: {str(e)}")
            # Fallback to original method
            return await self._analyze_complaint_fallback(title, description, urgency, location)
    
    async def _categorize_complaint_groq(self, title: str, description: str) -> str:
        """Use Groq API to categorize the complaint"""
        try:
            if not self.groq_api_key:
                raise Exception("Groq API key not configured")
                
            prompt = f"""
            Analyze the following complaint and categorize it into one of these categories:
            - Infrastructure (roads, bridges, buildings, public facilities)
            - Utilities (water, electricity, gas, internet)
            - Transportation (public transport, traffic, parking)
            - Public Safety (crime, emergency services, safety concerns)
            - Healthcare (hospitals, clinics, medical services)
            - Education (schools, colleges, educational facilities)
            - Environmental (pollution, waste management, green spaces)
            - Corruption (bribery, misconduct, transparency issues)
            - Administrative (documentation, permits, bureaucracy)
            - Other (anything that doesn't fit above categories)
            
            Title: {title}
            Description: {description}
            
            Return only the category name, nothing else.
            """
            
            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "llama-3.1-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 50
            }
            
            response = requests.post(self.groq_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            category = result['choices'][0]['message']['content'].strip()
            
            # Validate category
            valid_categories = list(self.departments.keys())
            if category in valid_categories:
                return category
            else:
                # Fuzzy match
                for valid_cat in valid_categories:
                    if valid_cat.lower() in category.lower() or category.lower() in valid_cat.lower():
                        return valid_cat
                return "Other"
                
        except Exception as e:
            logger.error(f"Groq categorization failed: {str(e)}")
            return self._categorize_complaint_fallback(title, description)
    
    async def _calculate_priority_score_fireworks(self, title: str, description: str, urgency: str, category: str) -> int:
        """Use Fireworks API to calculate priority score (0-100)"""
        try:
            if not self.fireworks_api_key:
                raise Exception("Fireworks API key not configured")
                
            prompt = f"""
            Calculate a priority score (0-100) for this complaint based on:
            - Urgency level: {urgency}
            - Category: {category}
            - Impact potential
            - Safety concerns
            - Number of people affected
            
            Title: {title}
            Description: {description}
            
            Consider these scoring guidelines:
            - Emergency/Safety issues: 80-100
            - High impact on many people: 70-90
            - Infrastructure critical issues: 60-80
            - Standard service requests: 40-60
            - Minor issues: 20-40
            - Low priority items: 0-30
            
            Return only a number between 0-100, nothing else.
            """
            
            headers = {
                "Authorization": f"Bearer {self.fireworks_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "accounts/fireworks/models/llama-v3p1-70b-instruct",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
                "max_tokens": 10
            }
            
            response = requests.post(self.fireworks_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            score_text = result['choices'][0]['message']['content'].strip()
            
            # Extract number from response
            import re
            numbers = re.findall(r'\d+', score_text)
            if numbers:
                score = int(numbers[0])
                return max(0, min(100, score))
            else:
                return self._calculate_priority_score_fallback(title, description, urgency, category)
                
        except Exception as e:
            logger.error(f"Fireworks priority calculation failed: {str(e)}")
            return self._calculate_priority_score_fallback(title, description, urgency, category)
    
    async def _generate_response_groq(self, title: str, description: str, category: str, urgency: str) -> str:
        """Generate AI response using Groq"""
        try:
            if not self.groq_api_key:
                raise Exception("Groq API key not configured")
                
            prompt = f"""
            Generate a professional, helpful response for this government complaint:
            
            Category: {category}
            Urgency: {urgency}
            Title: {title}
            Description: {description}
            
            The response should:
            - Acknowledge the complaint professionally
            - Provide relevant information about the issue
            - Explain next steps in the resolution process
            - Give realistic timelines
            - Be empathetic and solution-oriented
            - Be concise (2-3 sentences maximum)
            
            Write as if you're a government official responding to a citizen.
            """
            
            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "llama-3.1-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 200
            }
            
            response = requests.post(self.groq_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            return result['choices'][0]['message']['content'].strip()
            
        except Exception as e:
            logger.error(f"Groq response generation failed: {str(e)}")
            return self._generate_response_fallback(category, urgency, 50)
    
    async def _analyze_complaint_fallback(self, title: str, description: str, urgency: str, location: str) -> Dict[str, Any]:
        """Fallback analysis using original logic"""
        await asyncio.sleep(0.5)
        
        category = self._categorize_complaint_fallback(title, description)
        priority_score = self._calculate_priority_score_fallback(title, description, urgency, category)
        assigned_department = self.departments.get(category, self.departments["Other"])
        suggested_response = self._generate_response_fallback(category, urgency, priority_score)
        estimated_resolution = self._estimate_resolution_time(category, urgency, priority_score)
        
        return {
            "category": category,
            "priority_score": priority_score,
            "assigned_department": assigned_department,
            "suggested_response": suggested_response,
            "estimated_resolution": estimated_resolution,
            "analysis_timestamp": datetime.utcnow().isoformat(),
            "confidence_score": 70
        }
    
    def _categorize_complaint_fallback(self, title: str, description: str) -> str:
        """Categorize complaint based on keywords (fallback)"""
        text = (title + " " + description).lower()
        
        scores = {}
        for category, keywords in self.categories.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                scores[category] = score
        
        if scores:
            return max(scores, key=scores.get)
        
        return "Administrative"  # Default category
    
    def _calculate_priority_score_fallback(self, title: str, description: str, urgency: str, category: str) -> int:
        """Calculate priority score (0-100) using fallback logic"""
        base_score = 50
        
        # Urgency impact
        urgency_boost = int((self.urgency_multipliers.get(urgency, 1.0) - 1.0) * 30)
        
        # Category impact
        category_scores = {
            "Public Safety": 20,
            "Healthcare": 15,
            "Utilities": 15,
            "Infrastructure": 10,
            "Environmental": 8,
            "Transportation": 5,
            "Education": 5,
            "Administrative": 0
        }
        category_boost = category_scores.get(category, 0)
        
        # Keyword impact for critical issues
        critical_keywords = ["emergency", "urgent", "danger", "broken", "leak", "fire", "accident"]
        text = (title + " " + description).lower()
        critical_boost = sum(5 for keyword in critical_keywords if keyword in text)
        
        # Impact scale keywords
        impact_keywords = ["many", "multiple", "all", "entire", "community", "neighborhood"]
        impact_boost = sum(3 for keyword in impact_keywords if keyword in text)
        
        total_score = base_score + urgency_boost + category_boost + critical_boost + impact_boost
        
        # Ensure score is within 0-100 range
        return min(max(total_score, 10), 100)
    
    def _generate_response_fallback(self, category: str, urgency: str, priority_score: int) -> str:
        """Generate AI response based on analysis (fallback)"""
        
        responses = {
            "Infrastructure": [
                "Infrastructure maintenance request received. Our team will inspect the site and schedule necessary repairs.",
                "Municipal services have been notified. We'll coordinate with the maintenance department for prompt resolution.",
                "Your infrastructure concern has been prioritized based on safety and community impact."
            ],
            "Utilities": [
                "Utility service issue detected. Emergency response protocols may be activated based on severity.",
                "Our utilities department will investigate the service disruption and work to restore normal operations.",
                "Service restoration is prioritized based on the number of affected households and safety concerns."
            ],
            "Environmental": [
                "Environmental concern logged. Our inspectors will assess the situation and take appropriate action.",
                "This environmental issue will be investigated according to health and safety protocols.",
                "We'll coordinate with relevant authorities to address this environmental concern promptly."
            ],
            "Public Safety": [
                "Public safety matter escalated to appropriate authorities. Immediate response may be required.",
                "Safety concern received and forwarded to emergency services for rapid assessment and action.",
                "Your safety report is being treated with high priority and will receive immediate attention."
            ]
        }
        
        category_responses = responses.get(category, [
            "Your complaint has been received and will be processed according to standard procedures.",
            "We've categorized your concern and assigned it to the appropriate department for resolution.",
            "Thank you for bringing this matter to our attention. We'll work to address it promptly."
        ])
        
        base_response = random.choice(category_responses)
        
        # Add priority-based messaging
        if priority_score >= 80:
            base_response += " Due to the high priority nature of this issue, it will receive expedited processing."
        elif priority_score >= 60:
            base_response += " This matter has been flagged for priority handling by our team."
        
        return base_response
    
    def _estimate_resolution_time(self, category: str, urgency: str, priority_score: int) -> str:
        """Estimate resolution timeframe"""
        
        base_times = {
            "Public Safety": 1,      # 1 day
            "Utilities": 2,          # 2 days  
            "Healthcare": 3,         # 3 days
            "Infrastructure": 5,     # 5 days
            "Environmental": 7,      # 1 week
            "Transportation": 5,     # 5 days
            "Education": 10,         # 10 days
            "Administrative": 14,    # 2 weeks
            "Corruption": 30,        # 30 days
            "Other": 7               # 1 week
        }
        
        base_days = base_times.get(category, 7)
        
        # Adjust based on urgency
        if urgency == "high":
            base_days = max(1, base_days // 2)
        elif urgency == "low":
            base_days = int(base_days * 1.5)
        
        # Adjust based on priority score
        if priority_score >= 90:
            base_days = max(1, base_days // 2)
        elif priority_score <= 30:
            base_days = int(base_days * 1.3)
        
        if base_days == 1:
            return "24-48 hours"
        elif base_days <= 3:
            return f"{base_days} business days"
        elif base_days <= 7:
            return "1 week"
        elif base_days <= 14:
            return "2 weeks" 
        else:
            weeks = base_days // 7
            return f"{weeks} weeks"
    
    async def generate_chat_response(self, question: str, user_context: Dict[str, Any] = None) -> str:
        """Generate AI chat response using Gemini API (fallback to Groq)"""
        try:
            # Try Gemini API first
            return await self._generate_chat_response_gemini(question, user_context)
        except Exception as gemini_error:
            logger.warning(f"Gemini API failed, falling back to Groq: {str(gemini_error)}")
            try:
                # Fallback to Groq
                return await self._generate_chat_response_groq(question, user_context)
            except Exception as groq_error:
                logger.error(f"Both APIs failed: Gemini={gemini_error}, Groq={groq_error}")
                return self._generate_fallback_chat_response(question)
    
    async def _generate_chat_response_gemini(self, question: str, user_context: Dict[str, Any] = None) -> str:
        """Generate AI chat response using Gemini API"""
        if not self.gemini_api_key:
            raise Exception("Gemini API key not configured")
            
        # Build user context information
        context_info = ""
        if user_context:
            user_name = user_context.get("user_name", "")
            recent_complaints = user_context.get("recent_complaints", [])
            
            if user_name:
                context_info += f"User: {user_name}\n"
            
            if recent_complaints:
                context_info += f"User has {len(recent_complaints)} recent complaints:\n"
                for complaint in recent_complaints[:3]:
                    context_info += f"- {complaint.get('title', 'Untitled')} (Status: {complaint.get('status', 'pending')})\n"
        
        prompt = f"""
You are GrievanceBot, an intelligent AI assistant for a government portal complaint management system.

{context_info}

User Question: {question}

Your capabilities:
1. Help users submit and track complaints
2. Provide information about departments and processes
3. Guide users through complaint submission step by step
4. Answer questions about resolution timelines
5. Detect when users are describing problems and offer to help submit complaints

Response Guidelines:
- Be professional, empathetic, and helpful
- Keep responses concise (max 150 words)
- If user describes a problem, offer to help submit a complaint
- Suggest appropriate categories: Infrastructure, Public Safety, Healthcare, Education, Environment, Transportation, Utilities, Administrative
- For urgency: Low (non-urgent), Medium (moderate), High (urgent)

Provide a clear, helpful response:
"""
        
        # Gemini API endpoint
        gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={self.gemini_api_key}"
        
        headers = {"Content-Type": "application/json"}
        data = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 300
            }
        }
        
        response = requests.post(gemini_url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        if 'candidates' in result and len(result['candidates']) > 0:
            return result['candidates'][0]['content']['parts'][0]['text'].strip()
        else:
            raise Exception("No response from Gemini API")
    
    async def _generate_chat_response_groq(self, question: str, user_context: Dict[str, Any] = None) -> str:
        """Generate AI chat response using Groq API"""
        if not self.groq_api_key:
            raise Exception("Groq API key not configured")
            
        # Build user context information
        context_info = ""
        if user_context:
            user_name = user_context.get("user_name", "")
            recent_complaints = user_context.get("recent_complaints", [])
            
            if user_name:
                context_info += f"User: {user_name}\n"
            
            if recent_complaints:
                context_info += f"User has {len(recent_complaints)} recent complaints:\n"
                for complaint in recent_complaints[:3]:  # Show max 3 recent
                    context_info += f"- {complaint.get('title', 'Untitled')} (Status: {complaint.get('status', 'pending')})\n"
        
        prompt = f"""
        You are GrievanceBot, an intelligent AI assistant for a government portal complaint management system. You help citizens with their grievances and can guide them through the complaint submission process.

        {context_info}
        
        User Question: {question}
        
        Your capabilities:
        1. **Complaint Guidance**: Help users understand how to submit complaints, what information is needed, and which department handles their issue
        2. **Status Tracking**: Help users check complaint status and understand resolution timelines
        3. **Department Information**: Explain which government department handles specific types of issues
        4. **Interactive Complaint Collection**: If a user wants to submit a complaint through chat, guide them step by step to collect: title, description, category, location, urgency
        5. **Process Explanation**: Explain how complaints are processed, prioritized, and resolved
        
        Response Guidelines:
        - Be professional, empathetic, and citizen-focused
        - Provide clear, actionable guidance
        - If user wants to submit a complaint via chat, offer to collect information step by step
        - For complaint submission, ask for details one at a time: title, description, category, location, urgency
        - Suggest appropriate categories: Infrastructure, Public Safety, Healthcare, Education, Environment, Transportation, Utilities, Administrative, Corruption, Other
        - For urgency, suggest: Low (non-urgent), Medium (moderate), High (urgent), Critical (emergency)
        - Keep responses concise but helpful (max 200 words)
        - If you detect a complaint in their message, offer to help submit it immediately
        
        Special Instructions:
        - If the user describes a problem or issue, proactively ask if they'd like to submit a complaint
        - When collecting complaint details, be specific about what information you need
        - Explain why each piece of information is important for proper processing
        - Guide users to provide clear, detailed descriptions for better department assignment
        """
        
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "llama-3.1-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 300
        }
        
        response = requests.post(self.groq_url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        return result['choices'][0]['message']['content'].strip()
    
    def _generate_fallback_chat_response(self, question: str) -> str:
        """Fallback chat responses when AI API fails"""
        question_lower = question.lower()
        
        # Status inquiry
        if any(word in question_lower for word in ["status", "progress", "update"]):
            return "I can help you check your complaint status. You can view real-time updates in the 'My Complaints' section, or I can look up specific complaint details if you provide the complaint ID."
        
        # How to submit
        elif any(word in question_lower for word in ["submit", "file", "complaint", "how"]):
            return "To submit a complaint: 1) Click 'Submit Complaint' in the sidebar, 2) Fill out the form with details, 3) Select urgency level, 4) Attach any supporting documents, 5) Submit. Our AI will automatically categorize and prioritize your complaint."
        
        # Timeline questions
        elif any(word in question_lower for word in ["long", "time", "when", "resolution"]):
            return "Resolution times vary by category: Emergency/Safety issues: 24-48 hours, Utilities: 2-3 days, Infrastructure: 5-7 days, Administrative: 1-2 weeks. High priority complaints are expedited."
        
        # Department questions  
        elif any(word in question_lower for word in ["department", "who", "responsible"]):
            return "Our AI automatically assigns complaints to the right department: Municipal Corp (infrastructure), Utilities Dept (water/power), Environment Dept (pollution), Public Safety (emergencies), etc."
        
        # General help
        else:
            return "I'm here to help! I can assist with complaint submission, status updates, resolution timelines, and general guidance. What specific information do you need about your complaint or our services?"

# Create global instance  
ai_service = AIService()

import streamlit as st
import requests
import json
from datetime import datetime
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from typing import Dict, Any

# Configure Streamlit page
st.set_page_config(
    page_title="Intelligent Complaint RAG System",
    page_icon="📋",
    layout="wide",
    initial_sidebar_state="expanded"
)

# API base URL (adjust if running on different host/port)
API_BASE_URL = "http://localhost:8000"

def check_api_health():
    """Check if the API is running."""
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def upload_file_to_api(uploaded_file):
    """Upload file to the API."""
    try:
        files = {"file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
        response = requests.post(f"{API_BASE_URL}/upload", files=files)
        return response.json()
    except Exception as e:
        st.error(f"Error uploading file: {str(e)}")
        return None

def search_complaints(query, n_results=5, department=None, urgency=None):
    """Search for complaints via API."""
    try:
        params = {
            "query": query,
            "n_results": n_results
        }
        if department:
            params["department"] = department
        if urgency:
            params["urgency"] = urgency
            
        response = requests.get(f"{API_BASE_URL}/search", params=params)
        return response.json()
    except Exception as e:
        st.error(f"Error searching complaints: {str(e)}")
        return None

def get_complaint_details(document_id):
    """Get detailed complaint information."""
    try:
        response = requests.get(f"{API_BASE_URL}/complaint/{document_id}")
        return response.json()
    except Exception as e:
        st.error(f"Error getting complaint details: {str(e)}")
        return None

def get_dashboard_stats():
    """Get dashboard statistics."""
    try:
        response = requests.get(f"{API_BASE_URL}/stats")
        return response.json()
    except Exception as e:
        st.error(f"Error getting statistics: {str(e)}")
        return None

def get_departments():
    """Get available departments and urgency levels."""
    try:
        response = requests.get(f"{API_BASE_URL}/departments")
        return response.json()
    except Exception as e:
        return {"data": {"departments": [], "urgency_levels": []}}

def display_complaint_card(complaint_data):
    """Display a complaint in a card format."""
    urgency_colors = {
        "High": "#FF4B4B",
        "Medium": "#FF8C00", 
        "Low": "#00C851"
    }
    
    urgency = complaint_data.get("urgency", "Medium")
    color = urgency_colors.get(urgency, "#FF8C00")
    emoji = complaint_data.get("emoji", "📋")
    
    with st.container():
        st.markdown(f"""
        <div style="
            border: 2px solid {color};
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
            background-color: rgba(255,255,255,0.05);
        ">
            <h4 style="color: {color}; margin: 0 0 10px 0;">
                {emoji} {urgency} Priority - {complaint_data.get('department', 'Unknown')}
            </h4>
            <p style="margin: 5px 0;"><strong>Summary:</strong> {complaint_data.get('summary', 'No summary available')}</p>
            <p style="margin: 5px 0; font-size: 0.9em; color: #666;">
                <strong>File:</strong> {complaint_data.get('filename', 'Unknown')} | 
                <strong>Date:</strong> {complaint_data.get('upload_date', 'Unknown')[:10]}
            </p>
        </div>
        """, unsafe_allow_html=True)

def main():
    """Main Streamlit application."""
    
    # Header
    st.title("📋 Intelligent Complaint RAG System")
    st.markdown("Upload and analyze complaints with AI-powered classification and search")
    
    # Check API health
    if not check_api_health():
        st.error("⚠️ API server is not running. Please start the FastAPI server first.")
        st.code("python -m uvicorn api.main:app --reload", language="bash")
        return
    
    # Get departments and urgency levels
    dept_data = get_departments()
    departments = dept_data.get("data", {}).get("departments", [])
    urgency_levels = dept_data.get("data", {}).get("urgency_levels", [])
    
    # Sidebar
    st.sidebar.header("Navigation")
    page = st.sidebar.selectbox(
        "Choose a page:",
        ["Upload Complaint", "Search Complaints", "Dashboard", "View Details"]
    )
    
    if page == "Upload Complaint":
        st.header("📤 Upload New Complaint")
        
        uploaded_file = st.file_uploader(
            "Choose a complaint file",
            type=['pdf', 'docx', 'txt'],
            help="Upload PDF, DOCX, or TXT files containing complaint details"
        )
        
        if uploaded_file is not None:
            st.info(f"File selected: {uploaded_file.name} ({uploaded_file.size} bytes)")
            
            if st.button("Process Complaint", type="primary"):
                with st.spinner("Processing complaint... This may take a few moments."):
                    result = upload_file_to_api(uploaded_file)
                
                if result and result.get("status") == "success":
                    st.success("✅ Complaint processed successfully!")
                    
                    data = result.get("data", {})
                    display_complaint_card(data)
                    
                    # Show processing details
                    with st.expander("Processing Details"):
                        st.json(data)
                        
                else:
                    st.error("❌ Failed to process complaint")
                    if result:
                        st.error(result.get("detail", "Unknown error"))
    
    elif page == "Search Complaints":
        st.header("🔍 Search Complaints")
        
        col1, col2, col3 = st.columns([2, 1, 1])
        
        with col1:
            search_query = st.text_input(
                "Search query:",
                placeholder="Enter keywords to search for similar complaints..."
            )
        
        with col2:
            department_filter = st.selectbox(
                "Department:",
                ["All"] + departments,
                index=0
            )
        
        with col3:
            urgency_filter = st.selectbox(
                "Urgency:",
                ["All"] + urgency_levels,
                index=0
            )
        
        n_results = st.slider("Number of results:", 1, 20, 5)
        
        if st.button("Search", type="primary") and search_query:
            dept_param = None if department_filter == "All" else department_filter
            urgency_param = None if urgency_filter == "All" else urgency_filter
            
            with st.spinner("Searching complaints..."):
                results = search_complaints(
                    search_query, 
                    n_results, 
                    dept_param, 
                    urgency_param
                )
            
            if results and results.get("status") == "success":
                complaints = results.get("data", [])
                
                if complaints:
                    st.success(f"Found {len(complaints)} similar complaints")
                    
                    for i, complaint in enumerate(complaints):
                        st.subheader(f"Result {i+1}")
                        display_complaint_card(complaint)
                        
                        # Show similarity score
                        score = complaint.get("similarity_score", 0)
                        st.progress(score, text=f"Similarity: {score:.2%}")
                        
                        # Show text preview
                        with st.expander("Text Preview"):
                            st.text(complaint.get("text_preview", "No preview available"))
                        
                        st.divider()
                else:
                    st.info("No similar complaints found")
            else:
                st.error("Search failed")
    
    elif page == "Dashboard":
        st.header("📊 Dashboard")
        
        with st.spinner("Loading dashboard data..."):
            stats = get_dashboard_stats()
        
        if stats and stats.get("status") == "success":
            data = stats.get("data", {})
            
            # Key metrics
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric(
                    "Total Complaints",
                    data.get("total_complaints", 0)
                )
            
            with col2:
                dept_dist = data.get("department_distribution", {})
                most_common_dept = max(dept_dist.items(), key=lambda x: x[1])[0] if dept_dist else "N/A"
                st.metric(
                    "Most Active Department",
                    most_common_dept
                )
            
            with col3:
                urgency_dist = data.get("urgency_distribution", {})
                high_urgency = urgency_dist.get("High", 0)
                st.metric(
                    "High Priority Complaints",
                    high_urgency
                )
            
            # Charts
            col1, col2 = st.columns(2)
            
            with col1:
                st.subheader("Complaints by Department")
                if dept_dist:
                    df_dept = pd.DataFrame(
                        list(dept_dist.items()),
                        columns=["Department", "Count"]
                    )
                    fig_dept = px.pie(
                        df_dept, 
                        values="Count", 
                        names="Department",
                        title="Department Distribution"
                    )
                    st.plotly_chart(fig_dept, use_container_width=True)
                else:
                    st.info("No data available")
            
            with col2:
                st.subheader("Complaints by Urgency")
                if urgency_dist:
                    colors = {"High": "#FF4B4B", "Medium": "#FF8C00", "Low": "#00C851"}
                    df_urgency = pd.DataFrame(
                        list(urgency_dist.items()),
                        columns=["Urgency", "Count"]
                    )
                    fig_urgency = px.bar(
                        df_urgency,
                        x="Urgency",
                        y="Count",
                        title="Urgency Distribution",
                        color="Urgency",
                        color_discrete_map=colors
                    )
                    st.plotly_chart(fig_urgency, use_container_width=True)
                else:
                    st.info("No data available")
        else:
            st.error("Failed to load dashboard data")
    
    elif page == "View Details":
        st.header("📄 View Complaint Details")
        
        document_id = st.text_input(
            "Enter Document ID:",
            placeholder="Enter the document ID to view full details..."
        )
        
        if st.button("Get Details", type="primary") and document_id:
            with st.spinner("Loading complaint details..."):
                result = get_complaint_details(document_id)
            
            if result and result.get("status") == "success":
                data = result.get("data", {})
                
                display_complaint_card(data)
                
                st.subheader("Full Text")
                st.text_area(
                    "Complete complaint text:",
                    data.get("full_text", "No text available"),
                    height=300,
                    disabled=True
                )
                
                with st.expander("Metadata"):
                    st.json(data)
            else:
                st.error("Complaint not found or error occurred")
    
    # Footer
    st.markdown("---")
    st.markdown("Built with ❤️ using Streamlit, FastAPI, ChromaDB, and Google Gemini")

if __name__ == "__main__":
    main()

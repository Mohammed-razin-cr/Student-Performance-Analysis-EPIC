import streamlit as st
import pymongo
from pymongo import MongoClient
import smtplib
from email.message import EmailMessage
from twilio.rest import Client
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Configuration ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "")
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")

# --- Database Connection ---
@st.cache_resource
def init_db():
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Force a connection test
        client.server_info()
        db = client["epic_student_db"]
        return db["students"], db["alert_logs"]
    except Exception as e:
        st.error(f"Failed to connect to MongoDB. Please check your MONGO_URI. Error: {e}")
        return None, None

students_col, logs_col = init_db()

# --- Helper Functions ---
def send_email(to_email, subject, body):
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        st.warning("Email credentials not configured. Skipping email.")
        return False
        
    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = to_email
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        st.error(f"Email Error: {e}")
        return False

def send_whatsapp(to_number, body):
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_WHATSAPP_NUMBER:
        st.warning("Twilio credentials not configured. Skipping WhatsApp.")
        return False

    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        # Twilio whatsapp format: 'whatsapp:+1234567890'
        # Assume to_number already has country code e.g. +1234567890
        message = twilio_client.messages.create(
            from_=f'whatsapp:{TWILIO_WHATSAPP_NUMBER}',
            body=body,
            to=f'whatsapp:{to_number}'
        )
        return True
    except Exception as e:
        st.error(f"WhatsApp Error: {e}")
        return False

def log_alert(student_name, email, phone, status):
    if logs_col is not None:
        logs_col.insert_one({
            "student_name": student_name,
            "email": email,
            "phone_number": phone,
            "timestamp": datetime.now(),
            "message_status": status
        })

def process_alert(student):
    message = (
        f"Dear {student.get('name', 'Student')}, "
        f"your attendance is below 75% (Current: {student.get('attendance_percentage', 0)}%). "
        "Please attend classes regularly and maintain the required attendance."
    )
    
    email_status = send_email(student.get('email', ''), "Low Attendance Alert", message)
    wa_status = send_whatsapp(student.get('phone_number', ''), message)
    
    # Determine overall status
    if email_status and wa_status:
        status = "Success"
    elif email_status or wa_status:
        status = "Partial Success"
    else:
        status = "Failed"
        
    # Update DB to mark alert as sent
    if students_col is not None:
        students_col.update_one(
            {"_id": student["_id"]}, 
            {"$set": {"alert_sent": True}}
        )
    
    log_alert(student.get('name'), student.get('email'), student.get('phone_number'), status)
    return status

# --- Streamlit UI ---
st.set_page_config(page_title="Admin Alert Dashboard", page_icon="🚨", layout="wide")

st.title("🚨 Low Attendance Alert System (Admin Dashboard)")
st.markdown("Monitor students with attendance below 75% and send automated Email & WhatsApp alerts.")

if students_col is None:
    st.stop()

# Auto-generate some dummy data if collection is empty
if students_col.count_documents({}) == 0:
    st.info("No students found in DB. Generating dummy data for testing...")
    dummy_data = [
        {"name": "Alice Smith", "email": "alice@example.com", "phone_number": "+1234567890", "attendance_percentage": 65, "alert_sent": False},
        {"name": "Bob Jones", "email": "bob@example.com", "phone_number": "+1987654321", "attendance_percentage": 80, "alert_sent": False},
        {"name": "Charlie Brown", "email": "charlie@example.com", "phone_number": "+1122334455", "attendance_percentage": 50, "alert_sent": False},
        {"name": "Diana Prince", "email": "diana@example.com", "phone_number": "+1555666777", "attendance_percentage": 72, "alert_sent": False}
    ]
    students_col.insert_many(dummy_data)
    st.rerun()

st.header("Students with Low Attendance (< 75%)")

# Fetch students with low attendance
low_attendance_students = list(students_col.find({"attendance_percentage": {"$lt": 75}}))

if not low_attendance_students:
    st.success("🎉 Excellent! All students have attendance above 75%.")
else:
    # Display table header
    col1, col2, col3, col4, col5, col6 = st.columns([2, 2, 2, 1, 1, 1.5])
    col1.write("**Name**")
    col2.write("**Email**")
    col3.write("**Phone Number**")
    col4.write("**Attendance %**")
    col5.write("**Alert Status**")
    col6.write("**Action**")
    st.markdown("---")
    
    # Iterate over students
    for student in low_attendance_students:
        c1, c2, c3, c4, c5, c6 = st.columns([2, 2, 2, 1, 1, 1.5])
        
        c1.write(student.get("name", "N/A"))
        c2.write(student.get("email", "N/A"))
        c3.write(student.get("phone_number", "N/A"))
        c4.write(f"{student.get('attendance_percentage', 0)}%")
        
        is_sent = student.get("alert_sent", False)
        if is_sent:
            c5.success("Sent")
        else:
            c5.warning("Pending")
            
        with c6:
            if st.button("Send Alert", key=str(student["_id"]), disabled=is_sent, use_container_width=True):
                with st.spinner("Sending..."):
                    res = process_alert(student)
                    st.toast(f"Alert completed for {student.get('name')} with status: {res}")
                    st.rerun()
                    
    st.markdown("---")
    
    st.subheader("Bulk Actions")
    # Bulk Alert Feature
    unsent_students = [s for s in low_attendance_students if not s.get("alert_sent")]
    if unsent_students:
        if st.button("Send Alerts to All Unsent Students", type="primary"):
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            for index, student in enumerate(unsent_students):
                status_text.text(f"Sending alert to {student.get('name')}...")
                process_alert(student)
                progress_bar.progress((index + 1) / len(unsent_students))
                
            status_text.text("Bulk alerts sent successfully!")
            st.toast("Bulk alerts completed.")
            st.rerun()
    else:
        st.info("All low-attendance students have already been alerted.")

# View Logs Section
with st.expander("View Alert Logs"):
    if logs_col is not None:
        logs = list(logs_col.find().sort("timestamp", -1).limit(50))
        if logs:
            for log in logs:
                st.text(f"[{log['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}] {log['student_name']} ({log['email']}) - Status: {log['message_status']}")
        else:
            st.text("No logs found.")

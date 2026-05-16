from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Load the trained model
model_path = os.path.join(os.path.dirname(__file__), 'trainmlx.pkl')
try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    print("Model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    })


@app.route('/api/predict', methods=['POST'])
def predict_performance():
    """
    Predict student performance based on input features
    Expected input format:
    {
        "cgpa": float (0-10),
        "credits": int,
        "extraCurricular": int,
        "projects": int,
        "selfStudy": int (hours),
        "assignment": float (0-1, completion rate),
        "engagement": int (0-10),
        "contribution": int (0-10)
    }
    """
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500

        data = request.json
        
        # Extract features
        cgpa = float(data.get('cgpa', 0))
        credits = int(data.get('credits', 0))
        extraCurricular = int(data.get('extraCurricular', 0))
        projects = int(data.get('projects', 0))
        selfStudy = int(data.get('selfStudy', 0))
        assignment = float(data.get('assignment', 0))
        engagement = int(data.get('engagement', 0))
        contribution = int(data.get('contribution', 0))
        
        # Validate inputs
        if not (0 <= cgpa <= 10):
            return jsonify({'error': 'CGPA must be between 0 and 10'}), 400
        if not (0 <= assignment <= 1):
            return jsonify({'error': 'Assignment completion must be between 0 and 1'}), 400
        
        # Prepare input array for model
        # Order: CGPA, Credits, ExtraCurricular, Projects, Self Study, Engagement, Assignment, Contribution
        input_features = [[cgpa, credits, extraCurricular, projects, selfStudy, engagement, assignment, contribution]]
        
        # Make prediction
        prediction = model.predict(input_features)[0]
        
        # Calculate pass probability (normalized prediction)
        pass_probability = min(100, max(0, int(prediction * 10)))
        
        # Determine grade based on prediction
        if prediction >= 9:
            grade = "A+"
            risk = "Low"
        elif prediction >= 8:
            grade = "A"
            risk = "Low"
        elif prediction >= 7:
            grade = "B+"
            risk = "Low"
        elif prediction >= 6:
            grade = "B"
            risk = "Medium"
        elif prediction >= 5:
            grade = "C+"
            risk = "Medium"
        elif prediction >= 4:
            grade = "C"
            risk = "High"
        else:
            grade = "D"
            risk = "High"
        
        # Generate response
        response = {
            'success': True,
            'prediction': {
                'improvementPotential': round(prediction, 2),
                'grade': grade,
                'passProbability': pass_probability,
                'risk': risk
            },
            'input': {
                'cgpa': cgpa,
                'credits': credits,
                'extraCurricular': extraCurricular,
                'projects': projects,
                'selfStudy': selfStudy,
                'assignment': assignment,
                'engagement': engagement,
                'contribution': contribution
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error in prediction: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/predict-with-feedback', methods=['POST'])
def predict_with_feedback():
    """
    Predict student performance and generate AI feedback
    This endpoint provides both prediction and personalized feedback
    """
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500

        data = request.json
        
        # Extract features
        cgpa = float(data.get('cgpa', 0))
        credits = int(data.get('credits', 0))
        extraCurricular = int(data.get('extraCurricular', 0))
        projects = int(data.get('projects', 0))
        selfStudy = int(data.get('selfStudy', 0))
        assignment = float(data.get('assignment', 0))
        engagement = int(data.get('engagement', 0))
        contribution = int(data.get('contribution', 0))
        
        # Prepare input array for model
        input_features = [[cgpa, credits, extraCurricular, projects, selfStudy, engagement, assignment, contribution]]
        
        # Make prediction
        prediction = model.predict(input_features)[0]
        
        # Calculate metrics
        pass_probability = min(100, max(0, int(prediction * 10)))
        
        # Determine grade and risk
        if prediction >= 9:
            grade = "A+"
            risk = "Low"
        elif prediction >= 8:
            grade = "A"
            risk = "Low"
        elif prediction >= 7:
            grade = "B+"
            risk = "Low"
        elif prediction >= 6:
            grade = "B"
            risk = "Medium"
        elif prediction >= 5:
            grade = "C+"
            risk = "Medium"
        elif prediction >= 4:
            grade = "C"
            risk = "High"
        else:
            grade = "D"
            risk = "High"
        
        # Generate basic feedback (can be enhanced with AI API if needed)
        feedback = generate_feedback(cgpa, credits, extraCurricular, projects, selfStudy, 
                                    engagement, assignment, contribution, prediction)
        
        response = {
            'success': True,
            'prediction': {
                'improvementPotential': round(prediction, 2),
                'grade': grade,
                'passProbability': pass_probability,
                'risk': risk,
                'feedback': feedback
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error in prediction with feedback: {e}")
        return jsonify({'error': str(e)}), 500


def generate_feedback(cgpa, credits, extra_curricular, projects, self_study, 
                     engagement, assignment, contribution, prediction):
    """Generate personalized feedback based on student metrics"""
    feedback_parts = []
    
    # CGPA feedback
    if cgpa >= 8.5:
        feedback_parts.append("Your excellent CGPA demonstrates strong academic performance.")
    elif cgpa >= 7.0:
        feedback_parts.append("Your CGPA is good, keep up the consistent effort.")
    elif cgpa >= 5.5:
        feedback_parts.append("Your CGPA needs improvement. Consider spending more time on core subjects.")
    else:
        feedback_parts.append("Your CGPA requires immediate attention. Seek help from faculty and peers.")
    
    # Projects and extracurricular
    if projects >= 3 and extra_curricular >= 3:
        feedback_parts.append("Great balance between projects and extracurricular activities!")
    elif projects < 2:
        feedback_parts.append("Try to work on more hands-on projects to enhance practical skills.")
    
    # Self study
    if self_study < 2:
        feedback_parts.append("Increase your self-study hours to at least 2-3 hours daily for better understanding.")
    elif self_study >= 4:
        feedback_parts.append("Excellent dedication to self-study!")
    
    # Assignment completion
    if assignment < 0.7:
        feedback_parts.append("Assignment completion is crucial. Aim for at least 90% completion rate.")
    
    # Engagement
    if engagement < 6:
        feedback_parts.append("Try to be more engaged in class discussions and activities.")
    elif engagement >= 8:
        feedback_parts.append("Your class engagement is commendable!")
    
    # Overall prediction
    if prediction >= 8:
        feedback_parts.append("You're on track for excellent performance. Maintain this momentum!")
    elif prediction >= 6:
        feedback_parts.append("You have good potential. Focus on consistent improvement.")
    else:
        feedback_parts.append("You need to work harder across multiple areas. Consider meeting with your advisor.")
    
    return " ".join(feedback_parts)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # Use use_reloader=False on Windows to avoid binding issues with watchdog
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)

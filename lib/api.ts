// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface PredictionInput {
  cgpa: number;
  credits: number;
  extraCurricular: number;
  projects: number;
  selfStudy: number;
  assignment: number; // 0-1
  engagement: number; // 0-10
  contribution: number; // 0-10
}

export interface PredictionResult {
  improvementPotential: number;
  grade: string;
  passProbability: number;
  risk: string;
  feedback?: string;
}

export interface ApiResponse {
  success: boolean;
  prediction: PredictionResult;
  input?: PredictionInput;
  error?: string;
}

// Check API health
export async function checkHealth(): Promise<{ status: string; model_loaded: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}

// Get prediction from backend
export async function getPrediction(input: PredictionInput): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Prediction failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
}

// Get prediction with AI feedback
export async function getPredictionWithFeedback(input: PredictionInput): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/predict-with-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Prediction failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Prediction with feedback error:', error);
    throw error;
  }
}

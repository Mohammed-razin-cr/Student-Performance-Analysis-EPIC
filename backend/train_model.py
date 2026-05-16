"""
Train a new model compatible with current scikit-learn version
This script creates a simple SVR model for student performance prediction
"""
import pickle
import numpy as np
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler

# Create sample training data (you can replace this with actual data)
# Features: CGPA, Credits, ExtraCurricular, Projects, SelfStudy, Engagement, Assignment, Contribution
X_train = np.array([
    [9.0, 150, 5, 6, 6, 9, 0.95, 3],
    [8.5, 140, 4, 5, 5, 8, 0.90, 4],
    [7.5, 130, 3, 4, 4, 7, 0.80, 5],
    [6.5, 120, 2, 3, 3, 6, 0.70, 6],
    [5.5, 110, 1, 2, 2, 5, 0.60, 7],
    [8.0, 145, 4, 5, 5, 8, 0.85, 4],
    [7.0, 125, 3, 3, 4, 6, 0.75, 5],
    [9.5, 160, 6, 7, 7, 10, 1.0, 2],
    [6.0, 115, 2, 2, 3, 5, 0.65, 6],
    [8.8, 148, 5, 6, 6, 9, 0.92, 3],
    [7.2, 128, 3, 4, 4, 7, 0.78, 5],
    [5.0, 100, 1, 1, 2, 4, 0.55, 8],
    [8.2, 142, 4, 5, 5, 8, 0.88, 4],
    [6.8, 122, 2, 3, 3, 6, 0.72, 6],
    [9.2, 155, 6, 7, 6, 9, 0.96, 2],
])

# Target: Improvement Potential (0-10)
y_train = np.array([9.0, 8.5, 7.5, 6.5, 5.5, 8.0, 7.0, 9.5, 6.0, 8.8, 7.2, 5.0, 8.2, 6.8, 9.2])

print("Training model with current scikit-learn version...")
print(f"Training samples: {len(X_train)}")

# Create and train the model (using SVR for regression)
model = SVR(kernel='rbf', C=1.0, gamma='scale')
model.fit(X_train, y_train)

print("Model training complete!")

# Test the model
test_input = [[8.5, 120, 3, 4, 5, 8, 0.9, 7]]
prediction = model.predict(test_input)
print(f"Test prediction: {prediction[0]:.2f}")

# Save the model
model_path = 'trainmlx.pkl'
with open(model_path, 'wb') as f:
    pickle.dump(model, f)

print(f"✅ Model saved to {model_path}")
print("Model is now compatible with current environment!")

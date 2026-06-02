from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import os
import math

app = Flask(__name__)
CORS(app)

# Ensure correct working directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

MODELS_DIR = os.path.join(BASE_DIR, 'models')
TRUST_MODEL_PATH = os.path.join(MODELS_DIR, 'trust_regressor.joblib')
FRAUD_MODEL_PATH = os.path.join(MODELS_DIR, 'fraud_classifier.joblib')

def verify_models():
    if not os.path.exists(TRUST_MODEL_PATH) or not os.path.exists(FRAUD_MODEL_PATH):
        print("Models not found. Training models first...")
        from model import train_and_save_models
        train_and_save_models()

# Initialize models
verify_models()
trust_model = joblib.load(TRUST_MODEL_PATH)
fraud_model = joblib.load(FRAUD_MODEL_PATH)

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculates distance in km between two lat/lon coordinates."""
    R = 6371.0 # Earth radius
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'models_loaded': True}), 200

@app.route('/predict_trust', methods=['POST'])
def predict_trust():
    try:
        data = request.json
        # Feature order matching model training:
        # rating_avg, rating_count, booking_completion_rate, dispute_rate, avg_response_time_min, cancellation_rate, id_verified
        features = [
            float(data.get('rating_avg', 5.0)),
            int(data.get('rating_count', 0)),
            float(data.get('booking_completion_rate', 1.0)),
            float(data.get('dispute_rate', 0.0)),
            float(data.get('avg_response_time_min', 60.0)),
            float(data.get('cancellation_rate', 0.0)),
            int(data.get('id_verified', 0))
        ]
        
        X = pd.DataFrame([features], columns=[
            'rating_avg', 'rating_count', 'booking_completion_rate', 
            'dispute_rate', 'avg_response_time_min', 'cancellation_rate', 'id_verified'
        ])
        
        trust_score = trust_model.predict(X)[0]
        # Bound it
        trust_score = float(np.clip(trust_score, 0.0, 100.0))
        
        return jsonify({
            'trust_score': round(trust_score, 1),
            'reliability_tier': 'High' if trust_score >= 80 else ('Medium' if trust_score >= 50 else 'Low')
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/predict_fraud', methods=['POST'])
def predict_fraud():
    try:
        data = request.json
        # Feature order matching model training:
        # price_deviation_ratio, owner_trust_score, deposit_to_price_ratio, is_new_account, owner_verification_status, description_length
        features = [
            float(data.get('price_deviation_ratio', 1.0)),
            float(data.get('owner_trust_score', 80.0)),
            float(data.get('deposit_to_price_ratio', 1.0)),
            int(data.get('is_new_account', 0)),
            int(data.get('owner_verification_status', 1)),
            int(data.get('description_length', 150))
        ]
        
        X = pd.DataFrame([features], columns=[
            'price_deviation_ratio', 'owner_trust_score', 'deposit_to_price_ratio',
            'is_new_account', 'owner_verification_status', 'description_length'
        ])
        
        risk_class = int(fraud_model.predict(X)[0])
        risk_probs = fraud_model.predict_proba(X)[0].tolist()
        risk_labels = ['Low', 'Medium', 'High']
        
        return jsonify({
            'risk_level': risk_labels[risk_class],
            'risk_code': risk_class,
            'probabilities': {
                'Low': round(risk_probs[0], 2),
                'Medium': round(risk_probs[1], 2),
                'High': round(risk_probs[2], 2)
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/recommendations', methods=['POST'])
def recommendations():
    try:
        data = request.json
        user_lat = float(data.get('lat', 0.0))
        user_lng = float(data.get('lng', 0.0))
        items = data.get('items', [])
        
        ranked_items = []
        for item in items:
            item_lat = float(item.get('lat', 0.0))
            item_lng = float(item.get('lng', 0.0))
            distance = haversine_distance(user_lat, user_lng, item_lat, item_lng)
            
            # Extract ranking signals
            price = float(item.get('price', 1.0))
            rating = float(item.get('rating', 5.0))
            owner_trust = float(item.get('owner_trust', 70.0))
            
            # Recommendation Score calculation (Composite Metric)
            # Higher is better
            # 1. Distance penalty (items closer get higher score)
            distance_score = 10.0 / (distance + 0.1) # Bound near-zero distance
            distance_score = min(distance_score, 10.0) # max out distance component at 10
            
            # 2. Rating component (max 5 points)
            rating_score = rating
            
            # 3. Owner trust score component (max 5 points)
            trust_score = owner_trust / 20.0
            
            # 4. Price economy component (cheaper is better relative, max 5 points)
            price_score = 5.0 / (1.0 + (price / 50.0))
            
            # Weighted average
            recommendation_score = (distance_score * 0.40) + (rating_score * 0.25) + (trust_score * 0.20) + (price_score * 0.15)
            
            item_ranked = item.copy()
            item_ranked['distance_km'] = round(distance, 2)
            item_ranked['recommendation_score'] = round(recommendation_score, 2)
            ranked_items.append(item_ranked)
            
        # Sort descending by score
        ranked_items.sort(key=lambda x: x['recommendation_score'], reverse=True)
        
        return jsonify({'items': ranked_items}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/retrain', methods=['POST'])
def retrain():
    try:
        global trust_model, fraud_model
        from model import train_and_save_models
        train_and_save_models()
        trust_model = joblib.load(TRUST_MODEL_PATH)
        fraud_model = joblib.load(FRAUD_MODEL_PATH)
        return jsonify({'message': 'Models retrained and reloaded successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)

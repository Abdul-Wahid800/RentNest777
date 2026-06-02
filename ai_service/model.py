import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

# Set seed for reproducibility
np.random.seed(42)

def generate_trust_score_data(num_samples=1000):
    """
    Generates synthetic user data to predict their Trust Score (0-100).
    Features:
    - rating_avg: float [1.0, 5.0]
    - rating_count: int [0, 100]
    - booking_completion_rate: float [0.0, 1.0]
    - dispute_rate: float [0.0, 1.0]
    - avg_response_time_min: float [5.0, 1440.0]
    - cancellation_rate: float [0.0, 1.0]
    - id_verified: int [0, 1]
    """
    rating_avg = np.random.uniform(1.0, 5.0, num_samples)
    rating_count = np.random.randint(0, 101, num_samples)
    booking_completion_rate = np.random.uniform(0.5, 1.0, num_samples)
    
    # Renter disputes (higher rates degrade trust)
    dispute_rate = np.random.uniform(0.0, 0.3, num_samples)
    dispute_rate = np.where(rating_avg < 3.0, dispute_rate * 2.0, dispute_rate)
    dispute_rate = np.clip(dispute_rate, 0.0, 1.0)

    avg_response_time_min = np.random.exponential(scale=120.0, size=num_samples)
    avg_response_time_min = np.clip(avg_response_time_min, 5.0, 1440.0)

    cancellation_rate = np.random.uniform(0.0, 0.4, num_samples)
    id_verified = np.random.binomial(1, 0.6, num_samples)

    # Base target Trust Score logic
    # Start at 70 points
    trust_score = 70.0 + (rating_avg - 3.0) * 10.0 + (id_verified * 15.0)
    trust_score += (booking_completion_rate * 20.0)
    trust_score -= (dispute_rate * 80.0)
    trust_score -= (cancellation_rate * 30.0)
    trust_score -= (avg_response_time_min / 1440.0) * 15.0
    
    # Scale based on rating count: low reviews should pull score closer to baseline 60-70
    weight = np.clip(rating_count / 10.0, 0.2, 1.0)
    trust_score = 60.0 * (1 - weight) + trust_score * weight
    trust_score = np.clip(trust_score, 0.0, 100.0)

    df = pd.DataFrame({
        'rating_avg': rating_avg,
        'rating_count': rating_count,
        'booking_completion_rate': booking_completion_rate,
        'dispute_rate': dispute_rate,
        'avg_response_time_min': avg_response_time_min,
        'cancellation_rate': cancellation_rate,
        'id_verified': id_verified,
        'trust_score': trust_score
    })
    return df

def generate_fraud_risk_data(num_samples=1000):
    """
    Generates synthetic item listings to classify Fraud/Anomaly Risk (0=Low, 1=Medium, 2=High).
    Features:
    - price_deviation_ratio: float [0.1, 10.0] (item price / median category price)
    - owner_trust_score: float [0.0, 100.0]
    - deposit_to_price_ratio: float [0.0, 10.0] (security deposit / rental price)
    - is_new_account: int [0, 1]
    - owner_verification_status: int [0, 1]
    - description_length: int [0, 1000]
    """
    price_deviation_ratio = np.random.lognormal(mean=0.0, sigma=0.5, size=num_samples)
    price_deviation_ratio = np.clip(price_deviation_ratio, 0.1, 10.0)

    owner_trust_score = np.random.uniform(20.0, 100.0, num_samples)
    
    deposit_to_price_ratio = np.random.uniform(0.0, 8.0, num_samples)
    # scammers might set high deposits to keep money, or 0 deposit for too-good-to-be-true
    
    is_new_account = np.random.binomial(1, 0.3, num_samples)
    owner_verification_status = np.random.binomial(1, 0.7, num_samples)
    # Override verification status for new/low trust accounts
    owner_verification_status = np.where(owner_trust_score < 50.0, 0, owner_verification_status)

    description_length = np.random.exponential(scale=200.0, size=num_samples)
    description_length = np.clip(description_length, 0, 1000).astype(int)

    # Risk assignment rules
    risk = np.zeros(num_samples, dtype=int) # default: 0 (Low)
    
    for i in range(num_samples):
        score = 0
        # High price deviation (too cheap or too expensive)
        if price_deviation_ratio[i] < 0.3 or price_deviation_ratio[i] > 3.0:
            score += 2
        # Low trust score
        if owner_trust_score[i] < 50.0:
            score += 2
        elif owner_trust_score[i] < 75.0:
            score += 1
        # Deposit anomalies
        if deposit_to_price_ratio[i] > 5.0 or deposit_to_price_ratio[i] < 0.2:
            score += 1
        # New account and unverified
        if is_new_account[i] == 1 and owner_verification_status[i] == 0:
            score += 2
        # Extremely short descriptions
        if description_length[i] < 20:
            score += 1
            
        if score >= 5:
            risk[i] = 2 # High
        elif score >= 2:
            risk[i] = 1 # Medium
        else:
            risk[i] = 0 # Low

    df = pd.DataFrame({
        'price_deviation_ratio': price_deviation_ratio,
        'owner_trust_score': owner_trust_score,
        'deposit_to_price_ratio': deposit_to_price_ratio,
        'is_new_account': is_new_account,
        'owner_verification_status': owner_verification_status,
        'description_length': description_length,
        'risk': risk
    })
    return df

def train_and_save_models():
    print("Training models...")
    os.makedirs('models', exist_ok=True)
    
    # 1. Trust Score Regressor
    df_trust = generate_trust_score_data(1500)
    X_trust = df_trust.drop('trust_score', axis=1)
    y_trust = df_trust['trust_score']
    
    X_train_t, X_test_t, y_train_t, y_test_t = train_test_split(X_trust, y_trust, test_size=0.2, random_state=42)
    regressor = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    regressor.fit(X_train_t, y_train_t)
    
    trust_mae = np.mean(np.abs(regressor.predict(X_test_t) - y_test_t))
    print(f"Trust Score Model Trained. Test MAE: {trust_mae:.2f}")
    joblib.dump(regressor, 'models/trust_regressor.joblib')
    
    # 2. Fraud Risk Classifier
    df_fraud = generate_fraud_risk_data(1500)
    X_fraud = df_fraud.drop('risk', axis=1)
    y_fraud = df_fraud['risk']
    
    X_train_f, X_test_f, y_train_f, y_test_f = train_test_split(X_fraud, y_fraud, test_size=0.2, random_state=42)
    classifier = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    classifier.fit(X_train_f, y_train_f)
    
    fraud_acc = classifier.score(X_test_f, y_test_f)
    print(f"Fraud Risk Model Trained. Test Accuracy: {fraud_acc:.2%}")
    joblib.dump(classifier, 'models/fraud_classifier.joblib')
    
    print("Models saved successfully in 'models/' directory.")

if __name__ == '__main__':
    # Set Cwd context if needed
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    train_and_save_models()

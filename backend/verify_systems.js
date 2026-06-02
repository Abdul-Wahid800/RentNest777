const axios = require('axios');

async function verify() {
  console.log('🔍 Starting RentNest Full-Stack Integration Checks...');

  // 1. Check Express Backend Health
  try {
    const res = await axios.get('http://localhost:5000/health');
    console.log('✅ Express Backend is ONLINE:');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('❌ Express Backend health check failed:', e.message);
  }

  // 2. Check Flask AI predict_trust
  try {
    const payload = {
      rating_avg: 4.8,
      rating_count: 12,
      booking_completion_rate: 0.95,
      dispute_rate: 0.0,
      avg_response_time_min: 15.0,
      cancellation_rate: 0.05,
      id_verified: 1
    };
    const res = await axios.post('http://localhost:5001/predict_trust', payload);
    console.log('\n✅ Flask AI predict_trust is ONLINE:');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('❌ Flask AI trust prediction failed:', e.message);
  }

  // 3. Check Flask AI predict_fraud
  try {
    const payload = {
      price_deviation_ratio: 1.5,
      owner_trust_score: 95.0,
      deposit_to_price_ratio: 2.0,
      is_new_account: 0,
      owner_verification_status: 1,
      description_length: 250
    };
    const res = await axios.post('http://localhost:5001/predict_fraud', payload);
    console.log('\n✅ Flask AI predict_fraud is ONLINE:');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('❌ Flask AI fraud check failed:', e.message);
  }
}

verify();

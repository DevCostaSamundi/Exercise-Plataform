import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

console.log('🔍 Testing NowPayments API Key...\n');

const apiKey = process.env.NOWPAYMENTS_API_KEY;
const apiUrl = 'https://api-sandbox.nowpayments.io/v1';

console.log('Config: ');
console.log('  API Key:', apiKey ? `${apiKey.substring(0, 15)}...` : '❌ NOT SET');
console.log('  API URL:', apiUrl);
console.log('');

const client = axios.create({
  baseURL: apiUrl,
  headers: {
    'x-api-key': apiKey,
    'Content-Type': 'application/json'
  }
});

async function test() {
  try {
    console.log('1️⃣ Testing /status endpoint...');
    const status = await client.get('/status');
    console.log('✅ Status:', status.data);
    console.log('');

    console.log('2️⃣ Testing /currencies endpoint...');
    const currencies = await client.get('/currencies');
    console.log('✅ Found', currencies.data.currencies.length, 'currencies');
    console.log('   First 5:', currencies.data.currencies.slice(0, 5));
    console.log('');

    console.log('3️⃣ Testing /estimate endpoint...');
    const estimate = await client.get('/estimate', {
      params: {
        amount: 10,
        currency_from: 'usd',
        currency_to:  'usdttrc20'
      }
    });
    console.log('✅ Estimate for $10 USD: ');
    console.log('   Amount:', estimate.data.estimated_amount, 'USDT');
    console.log('');

    console.log('🎉 SUCCESS!  Your API key is VALID!\n');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR: ');
    console.error('  Status:', error.response?.status);
    console.error('  Message:', error.response?.data?.message || error.message);
    console.error('');
    
    if (error.response?.data?.message === 'Invalid api key') {
      console.error('🔑 Your API key is INVALID\n');
      console.error('Solutions:');
      console.error('  1. Go to:  https://account-sandbox.nowpayments.io/settings/api');
      console.error('  2. Generate a NEW API key');
      console.error('  3. Copy it to . env:  NOWPAYMENTS_API_KEY=.. .');
      console.error('  4. Restart the server\n');
    }
  }
}

test();
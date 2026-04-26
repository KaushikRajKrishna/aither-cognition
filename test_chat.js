import 'dotenv/config';

// Create a test user and get token
async function registerAndTest() {
  try {
    const testEmail = 'test_' + Date.now() + '@test.com';
    const testPassword = 'Test@123456';

    console.log('🤖 Testing Chatbot with your question...\n');
    console.log('📝 Step 1: Registering test user...');
    
    // Register
    const registerRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: testEmail,
        password: testPassword,
        dateOfBirth: '1995-05-15',
        gender: 'other'
      })
    });

    if (!registerRes.ok) {
      const error = await registerRes.json();
      console.error('Registration error:', error);
      return;
    }

    const registerData = await registerRes.json();
    const token = registerData.token;
    console.log('✓ User registered and token obtained\n');

    console.log('📝 Step 2: Sending your question to chatbot...');
    console.log('Question: "I had a fight with my best friend, what should I do?"\n');
    console.log('─'.repeat(80));

    const chatRes = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: 'I had a fight with my best friend, what should I do?',
        history: [],
        sessionId: 'test_session_' + Date.now()
      })
    });

    if (!chatRes.ok) {
      console.error(`❌ Chat API Error: ${chatRes.status}`);
      const error = await chatRes.json();
      console.error('Error:', error);
      return;
    }

    const data = await chatRes.json();
    
    console.log('\n🎯 CHATBOT RESPONSE:\n');
    console.log(data.reply);
    console.log('\n' + '─'.repeat(80));
    
    console.log('\n📊 METADATA:\n');
    console.log('✓ Detected Emotion:', data.metadata.emotion.primary);
    console.log('✓ Confidence:', (data.metadata.emotion.confidence * 100).toFixed(1) + '%');
    console.log('✓ Secondary Emotion:', data.metadata.emotion.secondary);
    console.log('✓ Sentiment Score:', data.metadata.emotion.sentimentScore);
    console.log('✓ Risk Level:', data.metadata.riskLevel);
    console.log('✓ Crisis Flags:', data.metadata.crisisFlags.length > 0 ? data.metadata.crisisFlags : 'None');
    console.log('✓ Knowledge Base Used:', data.metadata.contextUsed.length > 0 ? data.metadata.contextUsed.join(', ') : 'None');
    console.log('✓ Session ID:', data.sessionId);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

registerAndTest();
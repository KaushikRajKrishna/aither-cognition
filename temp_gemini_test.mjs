import 'dotenv/config';
import { callGemini } from './server/controllers/chatController.js';

(async () => {
  try {
    const response = await callGemini('You are a compassionate mental health assistant.', [
      { role: 'user', content: 'I had a fight with my mom and I feel sad. What should I do?' }
    ]);
    console.log('GEMINI OK:', response);
  } catch (err) {
    console.error('GEMINI ERROR:', err.message);
  }
})();
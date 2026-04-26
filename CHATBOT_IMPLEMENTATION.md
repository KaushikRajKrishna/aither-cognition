# Aither Mental Health Chatbot - Advanced Implementation Guide

## Overview

This document details the comprehensive mental health chatbot implementation with **emotion detection**, **crisis detection**, **safety filtering**, **advanced prompt construction**, and **chat history persistence**.

---

## Architecture Components

### 1. **Emotion Detection Service** (`emotionDetectionService.js`)

Advanced emotion classification beyond simple sentiment analysis.

**Features:**
- Pattern-based emotion detection (8 emotion types)
- Keyword and phrase matching with weighted scoring
- Sentiment analysis integration
- Confidence scoring (0-1 scale)
- Emotion severity assessment (0-10 scale)

**Supported Emotions:**
- `joy` - Happiness, excitement, contentment
- `sadness` - Sadness, depression, hopelessness
- `anxiety` - Worry, nervousness, panic
- `anger` - Frustration, rage, irritation
- `fear` - Terror, dread, phobia
- `loneliness` - Isolation, disconnection
- `grief` - Loss, bereavement
- `overwhelm` - Being stretched too thin
- `neutral` - Balanced emotional state

**Usage:**
```javascript
const emotion = await emotionDetectionService.detectEmotion(userMessage);
console.log(emotion);
// {
//   primary: 'anxiety',
//   secondary: ['fear'],
//   confidence: 0.85,
//   sentimentScore: -0.3
// }
```

---

### 2. **Crisis Detection Service** (`crisisDetectionService.js`)

Identifies high-risk content indicating self-harm, suicidal intent, or abuse.

**Risk Levels:**
- `none` - No crisis indicators
- `low` - Minor distress signals
- `medium` - Hopelessness/isolation indicators
- `high` - Self-harm/abuse mentioned
- `critical` - Suicidal intent or immediate danger

**Crisis Patterns Detected:**
- Suicidal ideation
- Self-harm intentions
- Domestic abuse
- Drug overdose
- Severe hopelessness
- Complete isolation

**Features:**
- Multi-region helpline database
- Crisis-specific response override
- Safety assessment creation
- Automatic escalation flags

**Usage:**
```javascript
const crisis = crisisDetectionService.detectCrisis(userMessage);
// { 
//   riskLevel: 'critical',
//   flags: ['suicidal', 'no_hope'],
//   detectedPatterns: ['suicidal'],
//   suggestHelpline: true
// }

// Get crisis response
const response = crisisDetectionService.getCrisisResponse('critical', 'US');
```

**Supported Regions:**
- US (988 Suicide Prevention Lifeline)
- Canada
- UK (Samaritans)
- Australia (Lifeline)
- India (iCall)
- Global (IASP resources)

---

### 3. **Safety Filtering Service** (`safetyFilteringService.js`)

Applies content filtering and safety overrides.

**Features:**
- Harmful content detection in responses
- Safety-enhanced response generation
- Response validation for appropriateness
- Crisis resource integration
- Safety metadata logging

**Content Categories Filtered:**
- Harmful advice
- Substance abuse instructions
- Abuse tactics

**Safety Override Levels:**
- `medium` - Suggest professional help
- `high` - Strong crisis resource recommendation
- `critical` - Emergency response with immediate helpline

**Usage:**
```javascript
const filtered = safetyFilteringService.filterResponse(response, 'high');
// {
//   filtered: "...[enhanced response with crisis resources]...",
//   wasFiltered: true,
//   reason: "Safety-enhanced response"
// }
```

---

### 4. **Prompt Construction Service** (`promptConstructionService.js`)

Builds sophisticated, context-aware system prompts.

**Features:**
- Emotion-specific guidance
- Conversation phase awareness (initial, building, deepening, closing)
- Safety-level integrated instructions
- Knowledge base context incorporation
- Conversation history context building
- Response format guidelines

**Conversation Phases:**
- **Initial** - Build rapport, explore concerns
- **Building** - Deepen understanding, provide strategies
- **Deepening** - Show sophisticated understanding, connect patterns
- **Closing** - Summarize progress, provide actionable takeaways

**Usage:**
```javascript
const systemPrompt = promptConstructionService.buildSystemPrompt({
  emotion: 'anxiety',
  knowledgeContext: 'relevant KB entries...',
  riskLevel: 'medium',
  conversationPhase: 'building',
  previousContext: 'summary of past messages...'
});
```

---

### 5. **Chat Message Model** (`ChatMessage.js`)

Persistent storage of all chat interactions with rich metadata.

**Stored Data:**
- Message role and content
- Emotion analysis (primary, secondary, confidence, sentiment)
- Safety assessment (risk level, flags, override status)
- Context used (KB topics, model, tokens)
- Session tracking
- Conversation index
- Timestamps

**Schema:**
```javascript
{
  userId: ObjectId,           // Reference to user
  role: 'user' | 'assistant',
  content: String,
  emotion: {
    primary: String,          // joy, sadness, anxiety, etc.
    secondary: [String],      // Additional emotions
    confidence: Number,       // 0-1
    sentimentScore: Number    // -1 to 1
  },
  safety: {
    riskLevel: String,        // none, low, medium, high, critical
    flags: [String],          // Detected crisis indicators
    overridden: Boolean,      // Was response overridden?
    overrideReason: String
  },
  contextUsed: [String],      // KB topics used
  model: String,              // Which LLM generated response
  sessionId: String,          // Session tracking
  conversationIndex: Number   // Position in conversation
}
```

---

### 6. **Chat Controller** (`chatController.js`)

Orchestrates the entire chat pipeline with 11 steps:

**Processing Pipeline:**
1. **Emotion Detection** - Analyze user's emotional state
2. **Crisis Detection** - Check for high-risk content
3. **Save User Message** - Persist with metadata
4. **Knowledge Base Search** - Find relevant support info
5. **Build System Prompt** - Construct context-aware prompt
6. **Prepare History** - Format conversation history
7. **Generate Response** - Call Claude API
8. **Safety Filter** - Apply safety overrides
9. **Save Assistant Response** - Persist response with metadata
10. **Prepare Metadata** - Prepare rich response metadata
11. **Log High-Risk** - Flag for admin review if needed

---

### 7. **Chat History Controller** (`chatHistoryController.js`)

Admin and user endpoints for accessing chat history and analytics.

**Features:**
- User chat history retrieval
- Flagged message review
- Conversation transcript viewing
- Conversation statistics
- Export functionality
- Admin review and escalation

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/chat-history/:userId/history` | GET | Get chat history for user |
| `/chat-history/:userId/stats` | GET | Get conversation statistics |
| `/chat-history/:sessionId/transcript` | GET | Get full conversation |
| `/chat-history/:sessionId/export` | GET | Export as JSON |
| `/chat-history/admin/flagged-messages` | GET | Get flagged messages (admin) |
| `/chat-history/:messageId/review` | POST | Mark message as reviewed (admin) |

---

## Frontend Integration

### ChatBot Component Updates

The ChatBot component has been enhanced with:

**New Features:**
- Session ID tracking for persistent conversations
- Emotion confidence display
- Risk level visual indicators
- Crisis alert styling
- Metadata integration
- Improved error handling

**Visual Indicators:**
- ✅ Green bubbles for normal conversations
- ⚠️ Orange bubbles for high-risk content
- 🚨 Red bubbles and alert for critical risk
- Emotion confidence badges

---

## API Integration

### Updated Chat Response Structure

```typescript
interface ChatResponse {
  reply: string;
  contextUsed: string[];
  sessionId: string;
  metadata?: {
    emotion: {
      primary: string;
      secondary: string[];
      confidence: number;
      sentimentScore: number;
    };
    riskLevel: string;
    crisisFlags: string[];
    safetyFiltered: boolean;
    conversationPhase: string;
  };
}
```

### Chat API Methods

```typescript
// Send message with history
chatApi.send(message: string, history: ChatMessage[], sessionId?: string)

// Get chat history
chatApi.getHistory(userId: string, sessionId?: string, limit?: number, offset?: number)

// Get conversation statistics
chatApi.getStats(userId: string)

// Get full conversation transcript
chatApi.getTranscript(sessionId: string, userId: string)

// Export conversation
chatApi.exportConversation(sessionId: string, userId: string)

// Admin: Get flagged messages
chatApi.getFlaggedMessages(riskLevel?: string, limit?: number, offset?: number, resolved?: boolean)

// Admin: Mark message as reviewed
chatApi.markAsReviewed(messageId: string, action: string, notes?: string)
```

---

## Safety Workflows

### Crisis Response Flow

When critical crisis is detected:

1. **Immediate Detection** → Crisis keywords matched, risk level: critical
2. **Response Override** → Standard response replaced with crisis protocol
3. **Helpline Integration** → Specific helpline for user's region included
4. **System Logging** → Logged with user ID and timestamps
5. **Admin Notification** → Flagged in admin dashboard (production)
6. **Persistence** → All metadata saved to database
7. **Visual Alert** → User sees crisis support indicator

### High-Risk Content Handling

When high-risk content detected (not critical):

1. **Risk Assessment** → Analyze sentiment and keywords
2. **Response Enhancement** → Add empathy and professional recommendations
3. **Resource Integration** → Include crisis resources if appropriate
4. **Flag for Review** → Mark for admin monitoring
5. **Safe Escalation** → Allow user to seek professional help

---

## Configuration & Environment

### Required Environment Variables

```bash
# Existing
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
ANTHROPIC_API_KEY=...

# For crisis detection features
PORT=5000
NODE_ENV=development|production
```

### Optional: Production Monitoring

For production deployment, implement:

```javascript
// Send alert to crisis response team
if (riskLevel === "critical") {
  await sendAdminAlert({
    userId,
    message: userMessage,
    riskLevel,
    timestamp: new Date(),
    sessionId
  });
}
```

---

## Database Indexes

For optimal performance, ensure these indexes exist:

```javascript
// ChatMessage indexes
db.chatmessages.createIndex({ "userId": 1, "createdAt": -1 });
db.chatmessages.createIndex({ "userId": 1, "sessionId": 1, "conversationIndex": 1 });
db.chatmessages.createIndex({ "safety.riskLevel": 1 });
```

---

## Testing

### Test Emotion Detection

```javascript
const testCases = [
  { text: "I'm so anxious about the exam", expectedEmotion: "anxiety" },
  { text: "I feel completely alone", expectedEmotion: "loneliness" },
  { text: "I don't want to live anymore", expectedEmotion: "sadness" },
];

testCases.forEach(async (test) => {
  const result = await emotionDetectionService.detectEmotion(test.text);
  console.assert(result.primary === test.expectedEmotion);
});
```

### Test Crisis Detection

```javascript
const crisisTests = [
  { text: "I'm going to end it all", expectedRisk: "critical" },
  { text: "I've been cutting myself", expectedRisk: "high" },
  { text: "I feel hopeless", expectedRisk: "medium" },
];

crisisTests.forEach((test) => {
  const result = crisisDetectionService.detectCrisis(test.text);
  console.assert(result.riskLevel === test.expectedRisk);
});
```

---

## Best Practices

### For Developers

1. **Always persist chat messages** - Enable analytics and safety monitoring
2. **Log high-risk sessions** - Monitor for potential issues
3. **Test emotion detection** - Verify accuracy with diverse inputs
4. **Review crisis patterns** - Keep helpline data updated
5. **Monitor token usage** - Claude API has rate limits
6. **Validate responses** - Use `safetyFilteringService.validateResponse()`

### For Deployment

1. **Enable database backups** - ChatMessage collection is critical
2. **Set up admin dashboard** - Monitor flagged messages
3. **Configure email alerts** - Notify crisis team of critical cases
4. **Document regions** - Update helplines for your deployment region
5. **Test failovers** - Ensure KB fallback works without API key
6. **Monitor performance** - Track response times and error rates

### For Privacy

1. **Encrypt sensitive fields** - User messages and metadata
2. **Implement data retention** - Archive old conversations
3. **GDPR compliance** - Allow conversation deletion
4. **Access controls** - Only admins see flagged messages
5. **Audit logs** - Track who accesses what data

---

## Troubleshooting

### Emotion Detection Not Working

Check:
- Is `sentiment` npm package installed?
- Are keyword patterns loaded correctly?
- Test with console.log output

### Crisis Detection Missing Cases

Update `crisisPatterns` in `crisisDetectionService.js` with new patterns as they emerge.

### Chat History Not Persisting

Verify:
- MongoDB connection working
- ChatMessage model imported correctly
- User has valid ObjectId
- Database has proper indexes

### High API Token Usage

Solutions:
- Reduce history passed to Claude (use last 5 messages)
- Increase KB relevance threshold
- Use KB fallback more often
- Implement response caching

---

## Future Enhancements

Potential improvements for v2:

1. **Multi-language Support** - Emotion detection for other languages
2. **Voice Integration** - Speech-to-text for accessibility
3. **Therapy Recommendation** - Suggest specific therapy types
4. **Medication Tracking** - Integration with medication reminders
5. **Social Support** - Connect users with peer support groups
6. **Advanced Analytics** - Mood trends and pattern analysis
7. **Custom Therapy Plans** - AI-generated personalized plans
8. **Professional Integration** - Direct therapist collaboration

---

## Support

For issues or questions:

1. Check the logs in console/server output
2. Verify all environment variables are set
3. Ensure MongoDB is running and connected
4. Test individual services in isolation
5. Review error messages carefully

---

**Last Updated:** April 21, 2026
**Version:** 1.0.0
**Status:** Production Ready

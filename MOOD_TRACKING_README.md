# Enhanced Mood Tracking Service

## Overview

The Mood Tracking Service is an intelligent, comprehensive mental health platform component that provides advanced mood logging, analysis, and monitoring capabilities. It features sentiment analysis, trend detection, alert systems, and event-driven architecture to support personalized mental health insights.

## Key Features

### 🎯 Core Functionality
- **Advanced Mood Logging**: Log moods with optional notes and automatic sentiment analysis
- **Intelligent Analysis**: Calculate averages, detect dominant moods, and identify emotional trends
- **Alert System**: Automatic detection of stress patterns and low mood periods
- **Weekly Reports**: Comprehensive weekly summaries with personalized recommendations
- **Event-Driven Architecture**: Publish events for integration with other services

### 🤖 AI-Powered Features
- **Sentiment Analysis**: Automatic mood detection from user notes using NLP
- **Trend Detection**: Advanced algorithms to identify improving/stable/declining patterns
- **Smart Recommendations**: Personalized wellness suggestions based on mood data
- **Predictive Alerts**: Early warning system for mental health concerns

### 📊 Analytics & Insights
- **Comprehensive Statistics**: Mood distribution, stress frequency, trend analysis
- **Historical Patterns**: Long-term emotional pattern recognition
- **Personalized Insights**: AI-generated recommendations and observations
- **Data Export**: Complete user data export capabilities

## API Endpoints

### Mood Management

#### `POST /api/mood/add`
Log a new mood entry with advanced analysis.

**Request Body:**
```json
{
  "mood": "happy|calm|neutral|stressed|sad",
  "note": "Optional note (max 500 chars)"
}
```

**Response:**
```json
{
  "moodId": "uuid",
  "mood": "happy",
  "moodScore": 5,
  "note": "Feeling great!",
  "detectedMood": "happy",
  "sentimentScore": 0.8,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### `GET /api/mood/history`
Retrieve paginated mood history.

**Query Parameters:**
- `limit` (optional): Number of entries (1-365, default: 30)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "entries": [...],
  "totalEntries": 150,
  "limit": 30,
  "offset": 0
}
```

#### `GET /api/mood/analysis`
Analyze mood patterns and trends.

**Query Parameters:**
- `days` (optional): Analysis period in days (7-365, default: 30)

**Response:**
```json
{
  "averageMoodScore": 3.7,
  "dominantMood": "calm",
  "moodDistribution": {
    "happy": 25,
    "calm": 35,
    "neutral": 20,
    "stressed": 15,
    "sad": 5
  },
  "stressFrequency": 20.0,
  "trend": "improving",
  "alerts": [...],
  "analysisDays": 30,
  "analyzedAt": "2024-01-15T10:30:00Z"
}
```

#### `GET /api/mood/weekly-report`
Generate comprehensive weekly mood report.

**Query Parameters:**
- `weekOffset` (optional): Weeks from current (0=current, 1=previous, etc.)

**Response:**
```json
{
  "weekStart": "2024-01-08T00:00:00Z",
  "weekEnd": "2024-01-14T23:59:59Z",
  "weekNumber": 2,
  "totalEntries": 7,
  "averageMoodScore": 4.1,
  "dominantMood": "happy",
  "stressDays": 1,
  "weekTrend": "stable",
  "recommendations": [
    "Keep up the good work maintaining your positive outlook",
    "Consider activities that boost your mood further"
  ],
  "moodEntries": [...],
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

### Alert Management

#### `GET /api/mood/alerts`
Retrieve active alerts.

**Response:**
```json
{
  "alerts": [...],
  "count": 2
}
```

#### `PUT /api/mood/alerts/:alertId/resolve`
Resolve an alert.

**Response:**
```json
{
  "alertId": "uuid",
  "alertType": "HIGH_STRESS_ALERT",
  "resolved": true,
  "resolvedAt": "2024-01-15T10:30:00Z"
}
```

### Administrative Tools

#### `POST /api/mood-admin/generate-sample`
Generate sample data for testing.

**Request Body:**
```json
{
  "count": 100
}
```

#### `DELETE /api/mood-admin/cleanup`
Clean up old mood entries.

**Request Body:**
```json
{
  "days": 90
}
```

#### `GET /api/mood-admin/export`
Export user data to JSON file.

#### `GET /api/mood-admin/stats`
Get database statistics.

#### `GET /api/mood-admin/diagnostics`
Run system diagnostics.

#### `POST /api/mood-admin/backup`
Create database backup.

#### `GET /api/mood-admin/insights`
Get advanced AI-powered insights.

## Data Models

### MoodEntry
```javascript
{
  moodId: String,           // UUID
  userId: ObjectId,         // Reference to User
  mood: String,             // happy|calm|neutral|stressed|sad
  moodScore: Number,        // 1-5 scale
  note: String,             // Optional, max 500 chars
  detectedMood: String,     // AI-detected mood
  sentimentScore: Number,   // -1 to 1 sentiment polarity
  createdAt: Date,
  updatedAt: Date
}
```

### Alert
```javascript
{
  alertId: String,          // UUID
  userId: ObjectId,         // Reference to User
  alertType: String,        // HIGH_STRESS_ALERT|LOW_MOOD_ALERT
  message: String,          // Alert description
  resolved: Boolean,        // Default: false
  resolvedAt: Date,         // Set when resolved
  createdAt: Date,
  updatedAt: Date
}
```

### Event
```javascript
{
  eventId: String,          // UUID
  eventType: String,        // MOOD_LOGGED|HIGH_STRESS_ALERT|etc.
  userId: ObjectId,         // Reference to User
  data: Object,             // Event-specific data
  createdAt: Date
}
```

## Alert Logic

### High Stress Alert
- Triggered when user logs "stressed" or "sad" mood for 3+ consecutive days
- Event: `HIGH_STRESS_ALERT`
- Message: "Detected X consecutive days of high stress"

### Low Mood Alert
- Triggered when mood score ≤ 2 for 3+ consecutive days
- Event: `LOW_MOOD_ALERT`
- Message: "Detected X consecutive days of low mood"

## Sentiment Analysis

The service uses the `sentiment` npm package for natural language processing:

- **Score Range**: -1 (very negative) to +1 (very positive)
- **Mood Mapping**:
  - > 0.5: very positive → happy
  - 0.1 to 0.5: positive → calm
  - -0.1 to 0.1: neutral → neutral
  - -0.5 to -0.1: negative → stressed
  - < -0.5: very negative → sad

## Trend Detection Algorithm

### Overall Trend
1. Split data into first and second halves
2. Calculate average mood score for each half
3. Compare averages with 0.3 threshold:
   - Second > First + 0.3 → "improving"
   - Second < First - 0.3 → "declining"
   - Otherwise → "stable"

### Weekly Trend
- Same algorithm applied to weekly data
- Uses 0.2 threshold for more sensitivity

## Event System

The service publishes events for integration with other platform components:

- `MOOD_LOGGED`: When a mood is successfully logged
- `HIGH_STRESS_ALERT`: When high stress pattern detected
- `LOW_MOOD_ALERT`: When low mood pattern detected
- `ALERT_RESOLVED`: When an alert is resolved

Events include relevant data payloads for downstream processing.

## Recommendations Engine

AI-powered suggestions based on mood analysis:

### Low Mood (avg ≤ 2)
- Professional mental health support
- Mindfulness and meditation practices

### High Stress (≥ 3 stress days/week)
- Relaxation techniques
- Stress reduction strategies

### Sad Dominant Mood
- Social connection activities
- Enjoyable hobbies and interests

### Positive Patterns
- Encouragement to maintain healthy habits
- Suggestions for continued wellness

## Installation & Setup

1. **Install Dependencies:**
   ```bash
   npm install sentiment uuid
   ```

2. **Database Setup:**
   - MongoDB collections are created automatically
   - Indexes are created for optimal performance

3. **Environment Variables:**
   - Ensure MongoDB connection is configured
   - JWT authentication middleware required

## Usage Examples

### Log a Mood
```javascript
const response = await fetch('/api/mood/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    mood: 'happy',
    note: 'Had a great day with friends!'
  })
});
```

### Get Analysis
```javascript
const analysis = await fetch('/api/mood/analysis?days=30', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

console.log(`Average mood: ${analysis.averageMoodScore}`);
console.log(`Trend: ${analysis.trend}`);
```

### Weekly Report
```javascript
const report = await fetch('/api/mood/weekly-report', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

console.log(`Week ${report.weekNumber}: ${report.weekTrend}`);
report.recommendations.forEach(rec => console.log(`- ${rec}`));
```

## Error Handling

All endpoints return structured error responses:

```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "message": "Detailed error information"
}
```

Common error codes:
- `MISSING_MOOD`: Mood field required
- `INVALID_MOOD`: Invalid mood type
- `NOTE_TOO_LONG`: Note exceeds 500 characters
- `ANALYSIS_FAILED`: Mood analysis error
- `ALERT_NOT_FOUND`: Alert doesn't exist

## Performance & Scaling

- **Database Indexes**: Optimized for user queries and time-based filtering
- **Pagination**: Efficient retrieval of large datasets
- **Async Operations**: Non-blocking I/O for concurrent requests
- **Connection Pooling**: MongoDB driver manages connection efficiency
- **Event Processing**: Concurrent event handler execution

## Security Considerations

- All endpoints require JWT authentication
- Input validation on all user data
- Rate limiting recommended for production
- Data export respects user privacy
- Alert system doesn't expose sensitive information

## Integration Points

The service integrates with other platform components through:

1. **Event System**: Publish events for notification services
2. **Alert System**: Trigger external notifications
3. **Analytics**: Provide data for dashboard components
4. **Recommendation Engine**: Feed insights to AI services

## Future Enhancements

- **Predictive Analytics**: ML-based mood prediction
- **Advanced NLP**: More sophisticated sentiment analysis
- **Social Features**: Mood sharing and community insights
- **Integration APIs**: Third-party health app connections
- **Advanced Reporting**: Custom date ranges and filters

## Monitoring & Maintenance

### Health Checks
- `GET /api/mood/health`: Service and database status

### Administrative Tools
- Database statistics and diagnostics
- Data export and backup capabilities
- Sample data generation for testing
- Automated cleanup of old data

### Logging
- Comprehensive request/response logging
- Error tracking with detailed context
- Performance monitoring capabilities

This enhanced Mood Tracking Service provides a solid foundation for mental health monitoring with intelligent features, robust architecture, and extensive integration capabilities.
import Sentiment from "sentiment";

/**
 * Advanced Emotion Detection Service
 * Combines sentiment analysis with pattern-based emotion classification
 */
class EmotionDetectionService {
  constructor() {
    this.sentiment = new Sentiment();

    // Emotion keywords and patterns
    this.emotionPatterns = {
      anxiety: {
        keywords: [
          "anxious",
          "worried",
          "nervous",
          "panic",
          "overwhelmed",
          "stressed",
          "tense",
          "uneasy",
          "afraid",
          "scared",
          "fear",
          "dreading",
        ],
        phrases: [
          "what if",
          "cant sleep",
          "racing thoughts",
          "heart racing",
          "can't stop thinking",
          "feeling overwhelmed",
        ],
        weight: 0.85,
      },
      sadness: {
        keywords: [
          "sad",
          "depressed",
          "unhappy",
          "lonely",
          "alone",
          "empty",
          "miserable",
          "hopeless",
          "worthless",
          "useless",
          "crying",
          "tears",
        ],
        phrases: [
          "feel empty",
          "dont care",
          "nothing matters",
          "can't get out of bed",
          "losing interest",
          "no motivation",
        ],
        weight: 0.85,
      },
      anger: {
        keywords: [
          "angry",
          "furious",
          "mad",
          "frustrated",
          "irritated",
          "enraged",
          "rage",
          "hate",
          "disgusted",
        ],
        phrases: [
          "so frustrated",
          "can't take it",
          "fed up",
          "pissed off",
          "seeing red",
        ],
        weight: 0.8,
      },
      fear: {
        keywords: [
          "afraid",
          "terrified",
          "scared",
          "frightened",
          "petrified",
          "dread",
          "phobia",
          "terror",
        ],
        phrases: ["too afraid", "scared of", "what if something"],
        weight: 0.85,
      },
      joy: {
        keywords: [
          "happy",
          "joyful",
          "delighted",
          "thrilled",
          "excited",
          "wonderful",
          "great",
          "amazing",
          "love",
        ],
        phrases: ["can't wait", "so happy", "feels great"],
        weight: 0.8,
      },
      loneliness: {
        keywords: [
          "lonely",
          "alone",
          "isolated",
          "abandoned",
          "disconnected",
          "unfriended",
          "ignored",
        ],
        phrases: [
          "feel alone",
          "no one understands",
          "nobody cares",
          "friendless",
        ],
        weight: 0.85,
      },
      grief: {
        keywords: [
          "grief",
          "grieving",
          "loss",
          "lost",
          "death",
          "died",
          "passed away",
          "missing",
        ],
        phrases: ["can't handle", "miss them", "they're gone"],
        weight: 0.9,
      },
      overwhelm: {
        keywords: [
          "overwhelmed",
          "overloaded",
          "too much",
          "drowning",
          "sinking",
          "breaking",
        ],
        phrases: [
          "too much",
          "can't handle",
          "falling apart",
          "breaking down",
        ],
        weight: 0.85,
      },
    };
  }

  /**
   * Analyze text to detect primary and secondary emotions
   */
  async detectEmotion(text) {
    if (!text || text.trim().length === 0) {
      return {
        primary: "neutral",
        secondary: [],
        confidence: 0.5,
        sentimentScore: 0,
      };
    }

    const lowerText = text.toLowerCase();
    const sentimentResult = this.sentiment.analyze(text);
    const sentimentScore = sentimentResult.comparative;

    // Score each emotion
    const emotionScores = {};

    Object.entries(this.emotionPatterns).forEach(([emotion, pattern]) => {
      let score = 0;

      // Keyword matching
      pattern.keywords.forEach((keyword) => {
        if (lowerText.includes(keyword)) {
          score += pattern.weight * 0.6;
        }
      });

      // Phrase matching (for more nuanced detection)
      pattern.phrases.forEach((phrase) => {
        if (lowerText.includes(phrase)) {
          score += pattern.weight * 0.7;
        }
      });

      emotionScores[emotion] = Math.min(score, 1);
    });

    // Apply sentiment boost/dampen
    if (sentimentScore > 0.3) {
      emotionScores.joy = Math.min((emotionScores.joy || 0) + 0.3, 1);
    } else if (sentimentScore < -0.3) {
      emotionScores.sadness = Math.min((emotionScores.sadness || 0) + 0.2, 1);
      emotionScores.anxiety = Math.min((emotionScores.anxiety || 0) + 0.15, 1);
    }

    // If no strong emotion detected, use neutral
    const maxScore = Math.max(...Object.values(emotionScores));
    if (maxScore < 0.3) {
      return {
        primary: "neutral",
        secondary: [],
        confidence: 0.5,
        sentimentScore,
      };
    }

    // Get primary emotion (highest score)
    const primary = Object.entries(emotionScores)
      .sort((a, b) => b[1] - a[1])[0][0];

    // Get secondary emotions (above 0.4 threshold)
    const secondary = Object.entries(emotionScores)
      .filter(([e, score]) => e !== primary && score > 0.4)
      .sort((a, b) => b[1] - a[1])
      .map(([emotion]) => emotion)
      .slice(0, 2);

    return {
      primary,
      secondary,
      confidence: emotionScores[primary],
      sentimentScore,
    };
  }

  /**
   * Get emotion-specific support hints
   */
  getEmotionContext(emotion) {
    const contexts = {
      anxiety:
        "User appears anxious or worried. Focus on reassurance and grounding techniques.",
      sadness:
        "User appears sad or depressed. Show empathy and validate their feelings.",
      anger:
        "User appears frustrated or angry. Acknowledge their feelings without judgment.",
      fear:
        "User appears fearful. Provide reassurance and coping strategies.",
      joy: "User appears happy. Reinforce positive emotions and celebrate their wins.",
      loneliness:
        "User feels isolated. Encourage connection and belonging without being pushy.",
      grief: "User is grieving. Validate their loss and provide compassionate support.",
      overwhelm:
        "User feels overwhelmed. Help break down issues and create action plans.",
      neutral:
        "User seems calm. Continue supportive conversation and check-in on wellbeing.",
    };

    return contexts[emotion] || contexts.neutral;
  }

  /**
   * Get a severity score (0-10) for emotional state
   */
  getSeverityScore(primaryEmotion, sentimentScore, text) {
    let score = 5; // Baseline

    // Sentiment impact
    if (sentimentScore < -0.5) score += 2;
    else if (sentimentScore < -0.2) score += 1;
    else if (sentimentScore > 0.3) score = Math.max(0, score - 1);

    // Emotion-specific adjustments
    const emotionalIntensity = {
      anxiety: 6,
      sadness: 7,
      anger: 6,
      fear: 7,
      loneliness: 6,
      grief: 8,
      overwhelm: 7,
      joy: 2,
      neutral: 4,
    };

    score = emotionalIntensity[primaryEmotion] || score;

    // Check for urgent language
    if (
      /desperate|suicidal|kill myself|self.harm|cut myself|don.t want to live/i.test(
        text
      )
    ) {
      score = 10;
    }

    return Math.min(score, 10);
  }
}

export default new EmotionDetectionService();

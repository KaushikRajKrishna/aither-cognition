/**
 * Safety Filtering Service
 * Applies safety overrides and content filtering for crisis/harmful content
 */
class SafetyFilteringService {
  constructor() {
    // Patterns that trigger content filtering
    this.filterPatterns = {
      harmfulAdvice: [
        /how to (hurt|harm|cut|overdose|kill)/gi,
        /methods? (to|for|of) (suicide|self.?harm)/gi,
        /best way to (end|die|kill yourself)/gi,
      ],
      substance: [
        /how to (use|make|take) drugs/gi,
        /cocaine|heroin|meth|crystal|fentanyl/gi,
      ],
      abuse: [
        /how to (abuse|control|manipulate)/gi,
        /domestic violence tactics/gi,
      ],
    };
  }

  /**
   * Check if response contains harmful content
   */
  containsHarmfulContent(text) {
    const lowerText = text.toLowerCase();

    for (const [category, patterns] of Object.entries(this.filterPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return {
            detected: true,
            category,
            reason: `Harmful ${category} content detected`,
          };
        }
      }
    }

    return { detected: false };
  }

  /**
   * Apply safety override to response
   */
  applySafetyOverride(riskLevel, region = "US") {
    const overrideMessages = {
      critical: `
💙 **Your safety is important to me.**

I can sense you're in real pain right now. I want to help, but what you need most is support from trained professionals who can provide real, immediate assistance.

**Please reach out for crisis support:**
🆘 **Call 988 (US - Suicide & Crisis Lifeline)**
📱 Text HOME to 741741
🌐 Visit 988lifeline.org

**Other regions:**
🇨🇦 Canada: 1-833-456-4566
🇬🇧 UK: 116 123 (Samaritans)
🇦🇺 Australia: 13 11 14 (Lifeline)
🇮🇳 India: iCall 9152987821

**You matter. Your life matters. Help is available right now.**

I'm here to support you, but please reach out to someone who can provide the immediate care you deserve. ❤️`,

      high: `
I hear that you're struggling deeply. Your feelings are valid, and you don't have to face this alone.

**I recommend talking to a mental health professional:**
- Crisis line: 988 (US)
- Therapist or counselor
- Your doctor or local mental health services

These trained professionals can give you the real support you need. I'm an AI, but they're human and trained specifically to help in situations like yours.

Please reach out. You deserve real support. 💙`,

      medium: `
Thank you for sharing. What you're feeling is understandable, and things can get better.

**Consider talking to someone:**
- A therapist or counselor
- A trusted friend or family member
- A mental health helpline in your area

Sometimes we need more support than an AI can provide, and that's completely okay. Professional help can make a real difference.`,
    };

    return overrideMessages[riskLevel] || overrideMessages.medium;
  }

  /**
   * Filter response to remove harmful advice
   */
  filterResponse(response, riskLevel) {
    if (riskLevel === "none") {
      return { filtered: response, wasFiltered: false };
    }

    // For elevated risk, ensure response is supportive and crisis-aware
    const harmfulPatterns = [
      /try \(hurting|cutting|harming\) yourself/gi,
      /you should (end|hurt) yourself/gi,
    ];

    let filtered = response;

    for (const pattern of harmfulPatterns) {
      if (pattern.test(filtered)) {
        return {
          filtered: this.applySafetyOverride(riskLevel),
          wasFiltered: true,
          reason: "Response contained harmful advice",
        };
      }
    }

    // Append crisis resources to high-risk responses
    if (riskLevel === "critical" || riskLevel === "high") {
      if (!response.includes("988") && !response.includes("crisis")) {
        filtered += "\n\n" + this.applySafetyOverride(riskLevel);
      }
    }

    return {
      filtered,
      wasFiltered: riskLevel !== "none",
      reason: riskLevel !== "none" ? "Safety-enhanced response" : null,
    };
  }

  /**
   * Validate response appropriateness
   */
  validateResponse(userInput, response, riskLevel) {
    const validation = {
      isAppropriate: true,
      warnings: [],
      suggestions: [],
    };

    // Check if response acknowledges crisis content
    if (riskLevel === "critical" || riskLevel === "high") {
      if (
        !response.includes("988") &&
        !response.includes("crisis") &&
        !response.includes("helpline") &&
        !response.includes("professional")
      ) {
        validation.isAppropriate = false;
        validation.warnings.push(
          "Response does not adequately address crisis content"
        );
        validation.suggestions.push(
          "Consider prefixing with crisis resources"
        );
      }
    }

    // Check if response is empathetic
    const empathyWords = /understand|hear|valid|okay|support|care|matter/i;
    if (!empathyWords.test(response) && riskLevel !== "none") {
      validation.suggestions.push("Add more empathetic language");
    }

    return validation;
  }

  /**
   * Get safety metadata for logging
   */
  getSafetyMetadata(riskLevel, emotion, flags) {
    return {
      riskLevel,
      emotion,
      detectedFlags: flags,
      requiresOverride: riskLevel !== "none" && riskLevel !== "low",
      requiresAlert:
        riskLevel === "critical" || riskLevel === "high",
      timestamp: new Date(),
    };
  }
}

export default new SafetyFilteringService();

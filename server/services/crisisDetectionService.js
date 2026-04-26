/**
 * Crisis Detection Service
 * Identifies high-risk content indicating self-harm, suicidal intent, or abuse
 */
class CrisisDetectionService {
  constructor() {
    // Crisis warning indicators
    this.crisisPatterns = {
      suicidal: {
        keywords: [
          "suicide",
          "suicidal",
          "kill myself",
          "kill myself",
          "end it all",
          "no point living",
          "don't want to live",
          "better off dead",
          "worth living",
          "goodbye",
        ],
        phrases: [
          "end my life",
          "take my life",
          "i want to die",
          "should be dead",
          "want to end it",
          "not worth it",
          "tired of living",
        ],
        severity: "critical",
      },
      selfHarm: {
        keywords: [
          "self harm",
          "cutting",
          "cut myself",
          "harm myself",
          "hurt myself",
          "burn myself",
          "hit myself",
          "punch myself",
          "scratch myself",
        ],
        phrases: [
          "want to cut",
          "cutting helps",
          "i cut myself",
          "need to hurt",
          "want to bleed",
        ],
        severity: "high",
      },
      abuse: {
        keywords: [
          "abuse",
          "domestic violence",
          "abused",
          "hitting",
          "beating",
          "assault",
          "rape",
          "sexual assault",
        ],
        phrases: [
          "partner hits me",
          "being abused",
          "unsafe at home",
          "being hurt by",
          "scared of partner",
        ],
        severity: "high",
      },
      drugOverdose: {
        keywords: [
          "overdose",
          "overdosing",
          "too many pills",
          "too much",
          "poison",
          "toxic",
        ],
        phrases: ["took too many", "can't breathe", "dying", "help me"],
        severity: "critical",
      },
      hopelessness: {
        keywords: [
          "hopeless",
          "worthless",
          "useless",
          "pointless",
          "nothing matters",
          "no hope",
          "give up",
        ],
        phrases: [
          "nothing will change",
          "always be like this",
          "no way out",
          "trapped",
        ],
        severity: "medium",
      },
      severe_isolation: {
        keywords: [
          "completely alone",
          "no one",
          "abandoned",
          "unloved",
          "unwanted",
        ],
        phrases: [
          "no one loves me",
          "no one cares",
          "everyone hates me",
          "forever alone",
        ],
        severity: "medium",
      },
    };

    // Global helpline numbers by region
    this.helplines = {
      GLOBAL: {
        name: "International Association for Suicide Prevention",
        url: "https://www.iasp.info/resources/Crisis_Centres/",
      },
      US: {
        number: "988",
        name: "National Suicide Prevention Lifeline",
        text: "Text HOME to 741741",
        url: "https://988lifeline.org/",
      },
      CANADA: {
        number: "1-833-456-4566",
        name: "Canada Suicide Prevention Service",
        url: "https://www.canada.ca/",
      },
      UK: {
        number: "116 123",
        name: "Samaritans",
        url: "https://www.samaritans.org/",
      },
      AUSTRALIA: {
        number: "13 11 14",
        name: "Lifeline Australia",
        url: "https://www.lifeline.org.au/",
      },
      INDIA: {
        number: "9152987821",
        name: "iCall Emotional Support",
        text: "msg 'AASHRAY' to 9999 999 999",
        url: "https://www.icallhelpline.org/",
      },
    };
  }

  /**
   * Detect crisis indicators in text
   */
  detectCrisis(text) {
    if (!text || text.trim().length === 0) {
      return {
        riskLevel: "none",
        flags: [],
        detectedPatterns: [],
        suggestHelpline: false,
      };
    }

    const lowerText = text.toLowerCase();
    const detectedPatterns = [];
    let maxSeverity = "none";
    const severityOrder = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };

    // Check each crisis pattern
    Object.entries(this.crisisPatterns).forEach(([pattern, data]) => {
      let matched = false;

      // Check keywords
      for (let keyword of data.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matched = true;
          break;
        }
      }

      // Check phrases
      if (!matched) {
        for (let phrase of data.phrases) {
          if (lowerText.includes(phrase.toLowerCase())) {
            matched = true;
            break;
          }
        }
      }

      if (matched) {
        detectedPatterns.push(pattern);
        if (severityOrder[data.severity] > severityOrder[maxSeverity]) {
          maxSeverity = data.severity;
        }
      }
    });

    // Map severity to risk level
    const riskLevelMap = {
      none: "none",
      low: "low",
      medium: "medium",
      high: "high",
      critical: "critical",
    };

    return {
      riskLevel: riskLevelMap[maxSeverity],
      flags: detectedPatterns,
      detectedPatterns,
      suggestHelpline: maxSeverity !== "none",
      severity: maxSeverity,
    };
  }

  /**
   * Get crisis response override message
   */
  getCrisisResponse(riskLevel, region = "US") {
    const responses = {
      critical: `
🆘 **I'm deeply concerned about what you've shared.**

You deserve immediate support. Please reach out to someone who can help right now:

**${this.helplines[region]?.name || "Crisis Helpline"}**
📞 Call: ${this.helplines[region]?.number || "Call emergency services"}
${this.helplines[region]?.text ? `📱 ${this.helplines[region].text}` : ""}

If you're in immediate danger:
🚨 **Call 911 (US) / Emergency services in your country**

You are not alone. People care about you, and help is available. Please reach out now.`,

      high: `
**I'm concerned and want to help.**

What you're experiencing sounds really painful. Please consider reaching out to:

📞 **${this.helplines[region]?.name || "Crisis Support"}**
${this.helplines[region]?.number ? `Call: ${this.helplines[region].number}` : ""}

💙 You deserve professional support from someone trained to help with this.

In immediate danger? Call 911 / emergency services.`,

      medium: `
Thank you for trusting me with this. What you're feeling is valid, and these feelings can change.

If things feel too heavy to carry alone, **please reach out to a mental health professional or crisis line:**

📞 ${this.helplines[region]?.number || "Emergency services"}
🌐 ${this.helplines[region]?.url || "https://www.iasp.info/resources/Crisis_Centres/"}

You're not alone in this. 💙`,
    };

    return responses[riskLevel] || responses.medium;
  }

  /**
   * Get helpline for specific region
   */
  getHelpline(region = "US") {
    return this.helplines[region] || this.helplines.GLOBAL;
  }

  /**
   * Create safety assessment data
   */
  createSafetyAssessment(text, emotion, riskLevel) {
    const crisis = this.detectCrisis(text);

    return {
      riskLevel: crisis.riskLevel || riskLevel,
      flags: crisis.flags,
      emotionalState: emotion,
      timestamp: new Date(),
      assessed: true,
      overrideNeeded: crisis.riskLevel !== "none",
    };
  }
}

export default new CrisisDetectionService();

import { knowledgeBase } from "../data/knowledgeBase.js";
import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";
import Alert from "../models/Alert.js";
import MoodService from "../services/moodService.js";
import emotionDetectionService from "../services/emotionDetectionService.js";
import crisisDetectionService from "../services/crisisDetectionService.js";
import safetyFilteringService from "../services/safetyFilteringService.js";
import promptConstructionService from "../services/promptConstructionService.js";
import NotificationService from "../services/notificationService.js";
import { sendCrisisAlertEmail } from "../services/emailService.js";

// ── 1. Knowledge-base search ──────────────────────────────────────────────────
function searchKB(query) {
  const lower = query.toLowerCase();
  const scored = knowledgeBase.map((entry) => {
    const hits = entry.keywords.filter((kw) => lower.includes(kw)).length;
    return { entry, hits };
  });
  return scored
    .filter((s) => s.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3)
    .map((s) => s.entry);
}

// ── 2. Call Gemini API ──────────────────────────────────────────────────────
export async function callGemini(systemPrompt, messages) {
  // Convert messages to Gemini format
  const geminiMessages = messages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  // Add system prompt as the first user message if it exists
  if (systemPrompt) {
    geminiMessages.unshift({
      role: "user",
      parts: [{ text: `System instructions: ${systemPrompt}` }]
    });
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API returned ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// ── 3. KB-only fallback (no API key) ─────────────────────────────────────────
function kbFallback(message, relevant, emotionResult) {
  // Generate context-aware opening based on detected emotion
  const emotionResponses = {
    sadness: "I'm sorry you're feeling sad right now. That's a really valid emotion, and it's okay to feel it.",
    anxiety: "I understand that something is making you feel anxious or worried. Let's talk about what's on your mind.",
    anger: "It sounds like you're frustrated or upset about something. Those feelings are valid, and I'm here to listen.",
    joy: "That's wonderful to hear! I'm happy you're experiencing positive feelings.",
    overwhelm: "It sounds like you might be feeling overwhelmed right now. Let's break this down together.",
    grief: "I'm truly sorry for what you're going through. Loss is incredibly difficult.",
    neutral: "Thank you for sharing with me. I'm here to listen and support you.",
    default: "Thank you for sharing. I'm here to help you navigate what you're feeling."
  };

  const opening = emotionResponses[emotionResult?.primary] || emotionResponses.default;
  
  if (relevant.length === 0) {
    return `${opening}\n\nWhile I don't have specific guidance on this topic right now, please know that reaching out and talking about your feelings is already a positive step. Consider speaking with a trusted friend, family member, or mental health professional who can provide more personalized support.\n\n*Note: I'm an AI support assistant — not a replacement for professional mental health care. If you're in crisis, please contact a helpline immediately.*`;
  }

  const top = relevant[0];
  return `${opening}\n\nFrom what you've shared, this feels related to ${top.topic}:\n\n${top.content}\n\nI'm here to listen and support you. How are you feeling right now?\n\n---\n*For personalised support, speaking with a mental health professional is always recommended. In a crisis, please call a helpline right away.*`;
  }

// ── POST /api/chat ────────────────────────────────────────────────────────────
export const chat = async (req, res) => {
  let sessionId = null;
  let messageIndex = 0;

  try {
    const { message, history = [], sessionId: clientSessionId } = req.body;
    const userId = req.user?.id;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    sessionId = clientSessionId || `session_${Date.now()}`;
    messageIndex = history.length;

    // ────────────────────────────────────────────────────────────────
    // STEP 1: Emotion Detection
    // ────────────────────────────────────────────────────────────────
    const emotionResult = await emotionDetectionService.detectEmotion(message);
    console.log("[chat] Detected emotion:", emotionResult);

    // ────────────────────────────────────────────────────────────────
    // STEP 2: Crisis Detection
    // ────────────────────────────────────────────────────────────────
    const crisisResult = crisisDetectionService.detectCrisis(message);
    const riskLevel = crisisResult.riskLevel;
    console.log("[chat] Risk level:", riskLevel, "Flags:", crisisResult.flags);

    // If critical crisis detected, prepare immediate override
    let crisisOverride = null;
    if (riskLevel === "critical") {
      crisisOverride = crisisDetectionService.getCrisisResponse(riskLevel);
    }

    // Send email alert for high or critical risk
    if ((riskLevel === "high" || riskLevel === "critical") && userId) {
      try {
        const user = await User.findById(userId);
        
        // 1. Send email alert
        if (user && user.email) {
          await sendCrisisAlertEmail(user.email, user.name, riskLevel, crisisResult.flags);
          console.log("[chat] Crisis alert email sent to:", user.email);
        }
        
        // 2. Send push notification
        try {
          await NotificationService.sendToUser(userId, {
            title: "🆘 Crisis Alert",
            body: riskLevel === "critical" 
              ? "We detected a crisis in your message. Please reach out for help immediately. Call 988 or text HOME to 741741."
              : "We noticed you may be going through a difficult time. Please consider reaching out for support.",
            icon: "/favicon.ico",
            tag: "crisis-alert",
            requireInteraction: true,
          });
          console.log("[chat] Crisis push notification sent to user:", userId);
        } catch (pushErr) {
          console.warn("[chat] Failed to send crisis push notification:", pushErr.message);
        }
        
        // 3. Save crisis alert to database
        try {
          const alertId = `CRISIS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await Alert.create({
            alertId,
            userId,
            alertType: riskLevel === "critical" ? "CRITICAL_CRISIS_ALERT" : "HIGH_STRESS_ALERT",
            message: `Crisis detected: ${riskLevel} risk. Flags: ${crisisResult.flags.join(", ")}`,
            resolved: false,
          });
          console.log("[chat] Crisis alert saved to database:", alertId);
        } catch (alertErr) {
          console.warn("[chat] Failed to save crisis alert:", alertErr.message);
        }
        
      } catch (emailErr) {
        console.warn("[chat] Failed to send crisis alert:", emailErr.message);
      }
    }

    // ────────────────────────────────────────────────────────────────
    // STEP 3: Save user message with emotion/crisis metadata
    // ────────────────────────────────────────────────────────────────
    let userChatMessage = null;
    try {
      userChatMessage = await ChatMessage.create({
        userId,
        role: "user",
        content: message,
        emotion: {
          primary: emotionResult.primary,
          secondary: emotionResult.secondary,
          confidence: emotionResult.confidence,
          sentimentScore: emotionResult.sentimentScore,
        },
        safety: {
          riskLevel,
          flags: crisisResult.flags,
        },
        sessionId,
        conversationIndex: messageIndex,
      });
    } catch (dbErr) {
      console.warn("[chat] Could not save user message:", dbErr.message);
    }

    // ────────────────────────────────────────────────────────────────
    // STEP 3.1: Add corresponding mood entry from chat sentiment
    // ────────────────────────────────────────────────────────────────
    try {
      await MoodService.addMoodEntryFromChat(userId, message, emotionResult);
      console.log("[chat] Added mood entry from chat sentiment");
    } catch (moodErr) {
      console.warn("[chat] Could not add mood entry from chat sentiment:", moodErr.message);
    }

    // ────────────────────────────────────────────────────────────────
    // STEP 4: Search knowledge base and build context
    // ────────────────────────────────────────────────────────────────
    const relevant = searchKB(message);
    const kbContext = relevant
      .map((e) => `[${e.topic.toUpperCase()}]\n${e.content}`)
      .join("\n\n");

    // ────────────────────────────────────────────────────────────────
    // STEP 5: Build Advanced System Prompt
    // ────────────────────────────────────────────────────────────────
    const conversationPhase =
      messageIndex === 0
        ? "initial"
        : messageIndex < 3
          ? "building"
          : messageIndex < 7
            ? "deepening"
            : "closing";

    const systemPrompt = promptConstructionService.buildSystemPrompt({
      emotion: emotionResult.primary,
      knowledgeContext: kbContext,
      riskLevel,
      conversationPhase,
      previousContext: promptConstructionService.buildContextSummary(history, 2),
    });

    // ────────────────────────────────────────────────────────────────
    // STEP 6: Prepare message history for LLM
    // ────────────────────────────────────────────────────────────────
    const geminiMessages = [
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    // ────────────────────────────────────────────────────────────────
    // STEP 7: Generate Response
    // ────────────────────────────────────────────────────────────────
    let reply;

    if (crisisOverride) {
      // Critical crisis: use crisis-specific response
      reply = crisisOverride;
      console.log("[chat] Using crisis override for critical risk");
    } else if (process.env.GEMINI_API_KEY) {
      // Generate response via Gemini with graceful fallback
      try {
        reply = await callGemini(systemPrompt, geminiMessages);
      } catch (err) {
        console.error("[chat] Gemini API failed:", err.message);
        console.warn("[chat] Falling back to knowledge base answer due to Gemini error");
        reply = kbFallback(message, relevant, emotionResult);
      }
    } else {
      // Fallback to KB when no API key is configured
      console.warn("[chat] GEMINI_API_KEY not set — using KB fallback");
      reply = kbFallback(message, relevant, emotionResult);
    }

    // ────────────────────────────────────────────────────────────────
    // STEP 8: Safety Filtering
    // ────────────────────────────────────────────────────────────────
    const safetyFiltered = safetyFilteringService.filterResponse(reply, riskLevel);
    const finalReply = safetyFiltered.filtered;

    // ────────────────────────────────────────────────────────────────
    // STEP 9: Format Response with Sentiment First
    // ────────────────────────────────────────────────────────────────
    const sentimentDisplay = `**Sentiment Analysis:** ${emotionResult.primary} (Confidence: ${(emotionResult.confidence * 100).toFixed(1)}%)\n\n`;
    const formattedReply = crisisOverride ? finalReply : sentimentDisplay + finalReply;

    // ────────────────────────────────────────────────────────────────
    // STEP 10: Save assistant response
    // ────────────────────────────────────────────────────────────────
    let assistantMessage = null;
    try {
      assistantMessage = await ChatMessage.create({
        userId,
        role: "assistant",
        content: formattedReply,
        contextUsed: relevant.map((e) => e.topic),
        model: crisisOverride ? "crisis-override" : "gemini-2.5-flash",
        safety: {
          overridden: safetyFiltered.wasFiltered || !!crisisOverride,
          overrideReason: safetyFiltered.reason || crisisOverride ? "Crisis response" : null,
        },
        sessionId,
        conversationIndex: messageIndex + 1,
      });
    } catch (dbErr) {
      console.warn("[chat] Could not save assistant message:", dbErr.message);
    }

    // ────────────────────────────────────────────────────────────────
    // STEP 11: Prepare response with rich metadata
    // ────────────────────────────────────────────────────────────────
    const response = {
      reply: formattedReply,
      sessionId,
      metadata: {
        emotion: emotionResult,
        riskLevel,
        crisisFlags: crisisResult.flags,
        contextUsed: relevant.map((e) => e.topic),
        safetyFiltered: safetyFiltered.wasFiltered,
        conversationPhase,
      },
    };

    // ────────────────────────────────────────────────────────────────
    // STEP 12: Log if high-risk for admin review
    // ────────────────────────────────────────────────────────────────
    if (riskLevel === "critical" || riskLevel === "high") {
      console.warn("[chat] ⚠️ HIGH-RISK MESSAGE LOGGED FOR REVIEW");
      console.warn(`  User: ${userId}`);
      console.warn(`  Risk Level: ${riskLevel}`);
      console.warn(`  Flags: ${crisisResult.flags.join(", ")}`);
      // In production, send to admin dashboard/alerts
    }

    res.json(response);
  } catch (err) {
    console.error("[chat] error:", err.message);
    res.status(500).json({
      message: "Failed to get a response. Please try again.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

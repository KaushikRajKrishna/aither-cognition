import { knowledgeBase } from "../data/knowledgeBase.js";

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
    .slice(0, 2)
    .map((s) => s.entry);
}

// ── 2. Call Claude API (raw fetch, no SDK needed) ────────────────────────────
async function callClaude(systemPrompt, messages) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API returned ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// ── 3. KB-only fallback (no API key) ─────────────────────────────────────────
function kbFallback(relevant) {
  if (relevant.length === 0) {
    return `Thank you for reaching out. I'm here to listen and support you.\n\nCould you share more about what you're going through? I can offer guidance on topics like anxiety, depression, stress, sleep, relationships, grief, and more.\n\n*Note: I'm an AI support assistant — not a replacement for professional mental health care. If you're in crisis, please contact a helpline immediately.*`;
  }
  const top = relevant[0];
  return `Here's some information about **${top.topic}** that might help:\n\n${top.content}\n\n---\n*For personalised support, speaking with a mental health professional is always recommended. In a crisis, please call a helpline right away.*`;
}

// ── POST /api/chat ────────────────────────────────────────────────────────────
export const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Step 1 — Search domain data
    const relevant = searchKB(message);
    const context = relevant
      .map((e) => `[${e.topic.toUpperCase()}]\n${e.content}`)
      .join("\n\n");

    // Step 2 — Build system prompt with context
    const systemPrompt = `You are Aither, a compassionate AI mental health support assistant for the Aither Cognition platform.

Your role:
- Provide empathetic, evidence-based emotional support
- Validate the user's feelings before offering advice
- Keep responses warm, concise, and conversational (2–4 paragraphs)
- Always encourage professional help for serious or clinical issues
- For crisis or suicidal content: immediately provide relevant helpline numbers
- You are a support tool — NOT a replacement for professional therapy

${context ? `RELEVANT KNOWLEDGE BASE CONTEXT (use this to inform your response):\n${context}` : ""}`;

    // Step 3 — Build message history (last 10 turns to stay within token limits)
    const claudeMessages = [
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    let reply;

    if (process.env.ANTHROPIC_API_KEY) {
      // Step 4a — Generate answer via Claude
      reply = await callClaude(systemPrompt, claudeMessages);
    } else {
      // Step 4b — KB-only fallback
      console.warn("[chat] ANTHROPIC_API_KEY not set — using KB fallback");
      reply = kbFallback(relevant);
    }

    res.json({ reply, contextUsed: relevant.map((e) => e.topic) });
  } catch (err) {
    console.error("[chat] error:", err.message);
    res.status(500).json({ message: "Failed to get a response. Please try again." });
  }
};

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, User, Loader2, AlertCircle } from "lucide-react";
import { chatApi, ChatMessage } from "@/lib/api";

interface ChatBotProps {
  onClose: () => void;
}

interface MessageWithMetadata extends ChatMessage {
  metadata?: {
    emotion?: { primary: string; confidence: number };
    riskLevel?: string;
  };
}

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I'm Aither, your mental health support companion. 💙\n\nI'm here to listen and help. You can talk to me about anything — anxiety, stress, relationships, sleep, or just how you're feeling today.\n\nWhat's on your mind?",
};

export default function ChatBot({ onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<MessageWithMetadata[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string>(() => `session_${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: MessageWithMetadata = { role: "user", content: text };
    const history = messages.filter((m) => m.role !== "assistant" || m !== WELCOME);

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await chatApi.send(text, [...history, userMsg], sessionId);
      const { reply, metadata } = response;

      // Track if there's a crisis risk
      const hasCrisisRisk = metadata?.riskLevel === "critical" || metadata?.riskLevel === "high";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          metadata: {
            emotion: metadata?.emotion,
            riskLevel: metadata?.riskLevel,
          },
        },
      ]);

      // If crisis detected, show visual warning
      if (hasCrisisRisk) {
        console.warn(`[ChatBot] Crisis risk detected: ${metadata?.riskLevel}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Check if any message has crisis risk
  const hasCrisisContent = messages.some(
    (m) => m.metadata?.riskLevel === "critical" || m.metadata?.riskLevel === "high"
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`flex flex-col w-full max-w-lg h-[85vh] max-h-[700px] glass-card border rounded-2xl overflow-hidden shadow-2xl ${
          hasCrisisContent ? "border-destructive/50" : "border-glass-border"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b bg-card/80 ${
          hasCrisisContent ? "border-destructive/30" : "border-glass-border"
        }`}>
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Aither</p>
            <p className="text-xs text-muted-foreground">Mental Health Support</p>
          </div>
          {hasCrisisContent && (
            <div className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
              <AlertCircle className="h-3 w-3" />
              <span>Crisis Support Active</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full mt-1 ${
                    msg.role === "user"
                      ? "bg-primary/20"
                      : "bg-secondary/50"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4 text-primary" />
                  ) : (
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : `rounded-tl-sm border ${
                          msg.metadata?.riskLevel === "critical"
                            ? "bg-destructive/10 border-destructive/30"
                            : msg.metadata?.riskLevel === "high"
                              ? "bg-orange-500/10 border-orange-500/30"
                              : "bg-secondary/60 border-glass-border"
                        } text-foreground`
                  }`}
                >
                  {msg.content}
                  {msg.metadata?.emotion && (
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-current border-opacity-20">
                      Emotion: {msg.metadata.emotion.primary} ({Math.round(msg.metadata.emotion.confidence * 100)}% confidence)
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 items-center"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-secondary/50">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="bg-secondary/60 border border-glass-border rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive text-center px-4">{error}</p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className={`border-t px-4 py-3 bg-card/60 ${
          hasCrisisContent ? "border-destructive/30" : "border-glass-border"
        }`}>
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share what's on your mind…"
              rows={1}
              className="flex-1 resize-none bg-secondary/40 border border-glass-border rounded-xl px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[40px] max-h-[120px] overflow-y-auto"
              style={{ height: "auto" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="glow-button p-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Aither is an AI and not a substitute for professional mental health care.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

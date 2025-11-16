const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 4000;

// In-memory store (no DB)
const sessions = {};

/**
 * Load mock data from file
 */
function loadTable() {
  const file = path.join(__dirname, "mockData.json");
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load mockData.json:", err);
    // fallback sample
    return {
      answerText: "Fallback sample answer",
      table: {
        columns: ["Col1", "Col2"],
        rows: [["A", "B"], ["C", "D"]]
      },
      description: "Fallback description"
    };
  }
}

/**
 * Create new session
 * POST /api/sessions
 * body: { title?, firstQuestion? }
 */
app.post("/api/sessions", (req, res) => {
  const id = uuidv4();
  const { title, firstQuestion } = req.body || {};
  const createdAt = new Date().toISOString();

  const messages = [];

  // If firstQuestion is provided, store user's message immediately
  if (firstQuestion) {
    messages.push({
      id: uuidv4(),
      role: "user",
      text: firstQuestion,
      createdAt
    });
  }

  sessions[id] = {
    id,
    title: title || `Session ${Object.keys(sessions).length + 1}`,
    createdAt,
    messages
  };

  return res.json({ id, title: sessions[id].title });
});

/**
 * Send message to session (user asks a question)
 * POST /api/sessions/:id/messages
 * body: { question }
 */
app.post("/api/sessions/:id/messages", (req, res) => {
  const sessionId = req.params.id;
  const { question } = req.body || {};

  if (!sessions[sessionId]) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (!question || !question.trim()) {
    return res.status(400).json({ error: "Question is required" });
  }

  const createdAt = new Date().toISOString();
  const userMsg = {
    id: uuidv4(),
    role: "user",
    text: question,
    createdAt
  };

  // Load mock answer
  const mock = loadTable(); // returns { answerText, table, description }

  const assistantMsg = {
    id: uuidv4(),
    role: "assistant",
    answerText: mock.answerText || "",
    table: mock.table || { columns: [], rows: [] },
    description: mock.description || "",
    createdAt,
    feedback: null
  };

  sessions[sessionId].messages.push(userMsg, assistantMsg);

  return res.json({ assistant: assistantMsg });
});

/**
 * Get list of sessions
 * GET /api/sessions
 */
app.get("/api/sessions", (req, res) => {
  const list = Object.values(sessions).map((s) => ({
    id: s.id,
    title: s.title,
    createdAt: s.createdAt,
    messageCount: s.messages.length
  }));
  // most-recent-first
  list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  return res.json({ sessions: list });
});

/**
 * Get specific session
 * GET /api/sessions/:id
 */
app.get("/api/sessions/:id", (req, res) => {
  const s = sessions[req.params.id];
  if (!s) return res.status(404).json({ error: "Session not found" });
  return res.json({ session: s });
});

/**
 * Submit feedback for a message
 * POST /api/feedback
 * body: { sessionId, messageId, feedback } // feedback: 'like' | 'dislike' | null
 */
app.post("/api/feedback", (req, res) => {
  const { sessionId, messageId, feedback } = req.body || {};

  if (!sessions[sessionId]) {
    return res.status(404).json({ error: "Session not found" });
  }

  const session = sessions[sessionId];
  const msg = session.messages.find((m) => m.id === messageId);

  if (!msg) {
    return res.status(404).json({ error: "Message not found" });
  }

  msg.feedback = feedback || null;
  return res.json({ success: true, message: "Feedback saved" });
});

/**
 * OPTIONAL: delete session
 * DELETE /api/sessions/:id
 */
app.delete("/api/sessions/:id", (req, res) => {
  const id = req.params.id;
  if (!sessions[id]) return res.status(404).json({ error: "Session not found" });
  delete sessions[id];
  return res.json({ success: true });
});

/**
 * Health
 */
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

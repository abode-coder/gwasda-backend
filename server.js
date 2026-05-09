const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// In-memory stores (good enough for now)
// sessions[code] = { userId, pluginConnected, prompt, luaCode, promptReady }
const sessions = {};

// ─── HELPERS ────────────────────────────────────────────────────────────────

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getUserIdFromToken(req) {
  // Supabase JWT — just decode the payload (no verify needed, backend trusts Supabase)
  try {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return payload.sub; // Supabase user ID
  } catch {
    return null;
  }
}

// ─── WEBSITE ENDPOINTS ───────────────────────────────────────────────────────

// Website calls this to get a session code
app.post("/session/create", (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  // Invalidate old sessions for this user
  for (const code in sessions) {
    if (sessions[code].userId === userId) delete sessions[code];
  }

  const code = generateCode();
  sessions[code] = {
    userId,
    pluginConnected: false,
    prompt: null,
    luaCode: null,
    promptReady: false,
  };

  // Auto-expire after 10 minutes
  setTimeout(() => { delete sessions[code]; }, 10 * 60 * 1000);

  res.json({ code });
});

// Website polls this to check if plugin connected
app.get("/session/status", (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const session = Object.values(sessions).find(s => s.userId === userId);
  if (!session) return res.json({ connected: false });

  res.json({ connected: session.pluginConnected });
});

// Website sends the prompt
app.post("/build", async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "No prompt" });

  const session = Object.values(sessions).find(s => s.userId === userId);
  if (!session) return res.status(400).json({ error: "No active session. Connect the plugin first." });
  if (!session.pluginConnected) return res.status(400).json({ error: "Plugin not connected yet." });

  // Call Gemini to generate Lua
  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert Roblox Studio Lua scripter. 
The user wants you to build something in Roblox Studio using Lua code.
Write ONLY valid Lua code that uses the Roblox API (game, workspace, Instance.new, etc).
Do NOT include any explanation, markdown, or code fences — just raw Lua code.
The code will be executed directly inside Roblox Studio via loadstring().
Make sure the code actually creates/builds/scripts what the user asked for.

User request: ${prompt}`
            }]
          }]
        })
      }
    );

    const geminiData = await geminiRes.json();
    const luaCode = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!luaCode) return res.status(500).json({ error: "AI did not return code" });

    // Store for plugin to pick up
    session.prompt = prompt;
    session.luaCode = luaCode.trim();
    session.promptReady = true;

    res.json({ success: true });
  } catch (e) {
    console.error("Gemini error:", e);
    res.status(500).json({ error: "AI request failed" });
  }
});

// ─── PLUGIN ENDPOINTS ────────────────────────────────────────────────────────

// Plugin connects with a code
app.post("/plugin/connect", (req, res) => {
  const { code } = req.body;
  if (!code || !sessions[code]) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  sessions[code].pluginConnected = true;
  res.json({ success: true, message: "Connected!" });
});

// Plugin polls for new prompts (long-polls every 3s from Lua)
app.get("/plugin/poll", (req, res) => {
  const { code } = req.query;
  if (!code || !sessions[code]) {
    return res.status(400).json({ error: "Invalid session" });
  }

  const session = sessions[code];

  if (session.promptReady && session.luaCode) {
    const luaCode = session.luaCode;
    // Clear so it doesn't get picked up twice
    session.promptReady = false;
    session.luaCode = null;
    session.prompt = null;
    return res.json({ ready: true, luaCode });
  }

  res.json({ ready: false });
});

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "gwasda backend running" }));

app.listen(PORT, () => console.log(`gwasda backend running on port ${PORT}`));

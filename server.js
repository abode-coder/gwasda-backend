const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PLUGIN_SECRET = process.env.PLUGIN_SECRET;

// Store pending build jobs
const jobs = {};

function generateSessionId() {
  return Math.random().toString(36).substring(2, 12).toUpperCase();
}

// Website hits this to submit a build prompt
app.post("/build", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "No prompt provided" });

  const sessionId = generateSessionId();
  jobs[sessionId] = { prompt, status: "pending", result: null };

  res.json({ sessionId });

  // Call Gemini API in background
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a Roblox Studio building and scripting AI.
When given a prompt, respond with ONLY a valid Lua script that runs as a Roblox Studio plugin script.
Use game.Workspace to place parts. Use Instance.new() to create parts and scripts.
Always set Parent last. Center builds around Vector3.new(0, 0, 0).
Never explain anything. Never use markdown. Only output raw Lua code.

Build this in Roblox Studio using Lua: ${prompt}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const luaCode = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!luaCode) throw new Error("No code returned from Gemini");

    jobs[sessionId].status = "ready";
    jobs[sessionId].result = luaCode;
  } catch (err) {
    jobs[sessionId].status = "error";
    jobs[sessionId].result = "-- Error generating code: " + err.message;
  }
});

// Plugin polls this to check if a job is ready
app.get("/poll/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const secret = req.headers["x-plugin-secret"];

  if (secret !== PLUGIN_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const job = jobs[sessionId];
  if (!job) return res.status(404).json({ error: "Session not found" });

  if (job.status === "pending") {
    return res.json({ status: "pending" });
  }

  // Clean up after delivering
  const result = { status: job.status, code: job.result };
  delete jobs[sessionId];
  res.json(result);
});

// Health check
app.get("/", (req, res) => res.send("gwasda.gg backend is running!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

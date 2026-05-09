<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>gwasda.gg — AI Roblox Builder</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0a0a0a;
      --surface: #111;
      --border: #222;
      --green: #00ff88;
      --green-dim: #00ff8830;
      --red: #ff3b3b;
      --text: #f0f0f0;
      --muted: #555;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Space Mono', monospace;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow-x: hidden;
    }

    /* grid background */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
      z-index: 0;
    }

    .container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 520px;
    }

    .logo {
      font-family: 'Syne', sans-serif;
      font-size: 3rem;
      font-weight: 800;
      color: var(--green);
      letter-spacing: -2px;
      text-align: center;
      margin-bottom: 4px;
      text-shadow: 0 0 40px rgba(0,255,136,0.4);
    }

    .tagline {
      text-align: center;
      color: var(--muted);
      font-size: 0.75rem;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 48px;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 32px;
      margin-bottom: 16px;
    }

    .card-title {
      font-size: 0.7rem;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 20px;
    }

    input[type="email"],
    input[type="password"],
    textarea {
      width: 100%;
      background: #0a0a0a;
      border: 1px solid var(--border);
      border-radius: 2px;
      color: var(--text);
      font-family: 'Space Mono', monospace;
      font-size: 0.85rem;
      padding: 12px 14px;
      outline: none;
      transition: border-color 0.2s;
      margin-bottom: 12px;
    }

    input:focus, textarea:focus {
      border-color: var(--green);
    }

    textarea {
      resize: vertical;
      min-height: 100px;
    }

    .btn {
      width: 100%;
      padding: 14px;
      background: var(--green);
      color: #000;
      border: none;
      border-radius: 2px;
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 1rem;
      letter-spacing: 1px;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
    }

    .btn:hover { opacity: 0.85; }
    .btn:active { transform: scale(0.98); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-outline {
      background: transparent;
      color: var(--green);
      border: 1px solid var(--green);
      margin-top: 10px;
    }

    .status-box {
      border: 1px solid var(--border);
      border-radius: 2px;
      padding: 14px;
      font-size: 0.8rem;
      margin-top: 16px;
      display: none;
      align-items: center;
      gap: 10px;
    }

    .status-box.show { display: flex; }
    .status-box.success { border-color: var(--green); color: var(--green); background: var(--green-dim); }
    .status-box.error { border-color: var(--red); color: var(--red); background: #ff3b3b15; }
    .status-box.pending { border-color: #555; color: #999; }

    .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: currentColor;
      flex-shrink: 0;
    }

    .dot.pulse {
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }

    .switch-link {
      text-align: center;
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 16px;
      cursor: pointer;
    }

    .switch-link span {
      color: var(--green);
      text-decoration: underline;
      cursor: pointer;
    }

    .user-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
      font-size: 0.75rem;
      color: var(--muted);
    }

    .user-bar strong { color: var(--text); }
    .logout-btn {
      background: none;
      border: none;
      color: var(--red);
      font-family: 'Space Mono', monospace;
      font-size: 0.75rem;
      cursor: pointer;
      text-decoration: underline;
    }

    #auth-section, #app-section { display: none; }
    #auth-section.show, #app-section.show { display: block; }

    .hidden { display: none !important; }

    .install-note {
      text-align: center;
      font-size: 0.7rem;
      color: var(--muted);
      letter-spacing: 1px;
      line-height: 1.8;
    }

    .install-note a {
      color: var(--green);
    }
  </style>
</head>
<body>
<div class="container">
  <div class="logo">gwasda.gg</div>
  <div class="tagline">AI-powered Roblox Studio builder</div>

  <!-- AUTH SECTION -->
  <div id="auth-section" class="show">
    <div class="card">
      <div class="card-title" id="auth-mode-label">Login</div>

      <input type="email" id="email" placeholder="email@example.com" />
      <input type="password" id="password" placeholder="password" />

      <button class="btn" id="auth-btn" onclick="handleAuth()">LOGIN</button>
      <button class="btn btn-outline" id="toggle-mode-btn" onclick="toggleMode()">CREATE ACCOUNT</button>

      <div class="status-box" id="auth-status">
        <div class="dot"></div>
        <span id="auth-status-text"></span>
      </div>
    </div>
    <div class="switch-link" onclick="toggleMode()">
      <span id="switch-text">Don't have an account? Sign up</span>
    </div>
  </div>

  <!-- APP SECTION -->
  <div id="app-section">
    <div class="card">
      <div class="user-bar">
        <div>logged in as <strong id="user-email"></strong></div>
        <button class="logout-btn" onclick="logout()">logout</button>
      </div>

      <div class="card-title">What should I build?</div>
      <textarea id="prompt" placeholder="e.g. build a medieval castle with a working drawbridge..."></textarea>
      <button class="btn" id="build-btn" onclick="sendBuild()">BUILD IN STUDIO</button>

      <div class="status-box" id="build-status">
        <div class="dot" id="build-dot"></div>
        <span id="build-status-text"></span>
      </div>
    </div>

    <div class="install-note">
      make sure the <a href="#">gwasda.gg plugin</a> is installed &amp; running in roblox studio
    </div>
  </div>
</div>

<script>
  // ---- CONFIG ----
  const SUPABASE_URL = "YOUR_SUPABASE_URL"; // e.g. https://xxxx.supabase.co
  const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
  const BACKEND_URL = "YOUR_RAILWAY_URL"; // e.g. https://gwasda-backend-production.up.railway.app

  let isSignup = false;
  let userToken = null;
  let userEmail = null;

  // Check if already logged in
  window.onload = () => {
    const saved = localStorage.getItem("gwasda_token");
    const savedEmail = localStorage.getItem("gwasda_email");
    if (saved) {
      userToken = saved;
      userEmail = savedEmail;
      showApp();
    }
  };

  function toggleMode() {
    isSignup = !isSignup;
    document.getElementById("auth-mode-label").textContent = isSignup ? "Sign Up" : "Login";
    document.getElementById("auth-btn").textContent = isSignup ? "SIGN UP" : "LOGIN";
    document.getElementById("toggle-mode-btn").textContent = isSignup ? "BACK TO LOGIN" : "CREATE ACCOUNT";
    document.getElementById("switch-text").textContent = isSignup ? "Already have an account? Login" : "Don't have an account? Sign up";
  }

  async function handleAuth() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const btn = document.getElementById("auth-btn");

    if (!email || !password) return showAuthStatus("Fill in all fields", "error");

    btn.disabled = true;
    showAuthStatus("Please wait...", "pending");

    const endpoint = isSignup ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password";

    try {
      const res = await fetch(SUPABASE_URL + endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.access_token) {
        userToken = data.access_token;
        userEmail = email;
        localStorage.setItem("gwasda_token", userToken);
        localStorage.setItem("gwasda_email", userEmail);
        showApp();
      } else if (isSignup && data.id) {
        showAuthStatus("Account created! Please check your email to confirm, then login.", "success");
      } else {
        showAuthStatus(data.error_description || data.msg || "Something went wrong", "error");
      }
    } catch (e) {
      showAuthStatus("Connection error", "error");
    }

    btn.disabled = false;
  }

  function showApp() {
    document.getElementById("auth-section").classList.remove("show");
    document.getElementById("app-section").classList.add("show");
    document.getElementById("user-email").textContent = userEmail;
  }

  function logout() {
    localStorage.removeItem("gwasda_token");
    localStorage.removeItem("gwasda_email");
    userToken = null;
    document.getElementById("app-section").classList.remove("show");
    document.getElementById("auth-section").classList.add("show");
  }

  async function sendBuild() {
    const prompt = document.getElementById("prompt").value.trim();
    const btn = document.getElementById("build-btn");

    if (!prompt) return showBuildStatus("Enter a prompt first!", "error");

    btn.disabled = true;
    showBuildStatus("Sending to AI...", "pending", true);

    try {
      const res = await fetch(BACKEND_URL + "/build", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + userToken
        },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();

      if (data.success) {
        showBuildStatus("Building in Studio... check Roblox!", "success", false);
      } else {
        showBuildStatus(data.error || "Something went wrong", "error");
      }
    } catch (e) {
      showBuildStatus("Connection error", "error");
    }

    btn.disabled = false;
  }

  function showAuthStatus(msg, type) {
    const box = document.getElementById("auth-status");
    const text = document.getElementById("auth-status-text");
    box.className = "status-box show " + type;
    text.textContent = msg;
  }

  function showBuildStatus(msg, type, pulse) {
    const box = document.getElementById("build-status");
    const text = document.getElementById("build-status-text");
    const dot = document.getElementById("build-dot");
    box.className = "status-box show " + type;
    text.textContent = msg;
    dot.className = "dot" + (pulse ? " pulse" : "");
  }
</script>
</body>
</html>

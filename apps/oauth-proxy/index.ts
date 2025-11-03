// OAuth Proxy Server for Tauri and Preview Environments
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS properly
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "tauri://localhost",
  "http://localhost:1420",
  "http://localhost:3001",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // In production, strictly check origins
      if (process.env.NODE_ENV === "production") {
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      } else {
        // Development: allow all
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Store active sessions (Note: In production, use Redis or similar)
const sessions = new Map<string, any>();

// Health check endpoint
app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// Initiate OAuth flow
app.post("/auth/init", async (req: express.Request, res: express.Response) => {
  try {
    console.log("Received OAuth init request:", req.body);
    const { provider, callbackUrl } = req.body;

    if (!provider) {
      return res.status(400).json({ error: "Provider is required" });
    }

    const sessionId = Math.random().toString(36).substring(2, 15);

    sessions.set(sessionId, {
      provider,
      callbackUrl: callbackUrl || "myapp://callback",
      createdAt: Date.now(),
    });

    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const proxyUrl = process.env.PROXY_URL || `http://localhost:${PORT}`;

    // Important: Use the proxy's /auth/callback endpoint
    const authUrl = `${nextAuthUrl}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(
      `${proxyUrl}/auth/callback?session=${sessionId}`
    )}`;

    console.log("Generated auth URL:", authUrl);
    console.log("Proxy URL:", proxyUrl);
    console.log("NextAuth URL:", nextAuthUrl);

    res.json({
      authUrl,
      sessionId,
    });
  } catch (error) {
    console.error("Error in /auth/init:", error);
    res.status(500).json({ error: "Failed to initialize OAuth flow" });
  }
});

// Handle OAuth callback from NextAuth
app.get(
  "/auth/callback",
  async (req: express.Request, res: express.Response) => {
    try {
      const { session: sessionId } = req.query;

      console.log("OAuth callback received, session ID:", sessionId);

      const cookies = req.headers.cookie || "";
      console.log("Cookies received:", cookies ? "yes" : "no");

      let sessionToken = null;
      // Support both cookie names: non-secure and secure
      const nonSecureMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
      const secureMatch = cookies.match(
        /__Secure-next-auth\.session-token=([^;]+)/
      );
      if (secureMatch) {
        sessionToken = secureMatch[1];
        console.log("Extracted __Secure-next-auth.session-token");
      } else if (nonSecureMatch) {
        sessionToken = nonSecureMatch[1];
        console.log("Extracted next-auth.session-token");
      } else {
        console.warn("No NextAuth session token found in cookies");
      }

      if (!sessionId || typeof sessionId !== "string") {
        console.error("No session ID provided");
        return res.status(400).send("No session ID provided");
      }

      const session = sessions.get(sessionId);

      if (!session) {
        console.error("Session not found:", sessionId);
        return res.status(404).send("Session not found or expired");
      }

      // Mark session as callback received
      session.callbackReceived = true;
      session.callbackReceivedAt = Date.now();
      session.sessionToken = sessionToken;

      const nextAuthUrl = process.env.NEXTAUTH_URL;
      const callbackUrl = session.callbackUrl || "myapp://callback";

      // Return HTML that handles both web and Tauri cases
      res.send(`
<!DOCTYPE html>
<html>
  <head>
    <title>Authentication Complete</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .container {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        text-align: center;
        max-width: 400px;
      }
      .spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .success { color: #10b981; }
      .error { color: #ef4444; }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Authentication Successful!</h2>
      <div class="spinner"></div>
      <p id="status">Retrieving session...</p>
    </div>
    <script>
      const sessionId = ${JSON.stringify(sessionId)};
      const nextAuthUrl = ${JSON.stringify(nextAuthUrl)};
      const callbackUrl = ${JSON.stringify(callbackUrl)};
      const sessionToken = ${JSON.stringify(sessionToken)};
      const statusEl = document.getElementById('status');
      
      async function completeAuth() {
        try {
          console.log('Fetching session from NextAuth...');
          
          const response = await fetch(nextAuthUrl + '/api/auth/session', {
            method: 'GET',
            credentials: 'include',
            mode: 'cors',
            headers: {
              // Send both cookie names to maximize compatibility
              'Cookie': sessionToken 
                ? '__Secure-next-auth.session-token=' + sessionToken + '; next-auth.session-token=' + sessionToken 
                : ''
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch session: ' + response.status);
          }
          
          const session = await response.json();
          console.log('Session retrieved:', session);
          
          if (!session || !session.user) {
            throw new Error('Invalid session data');
          }
          
          statusEl.textContent = 'Redirecting to app...';
          
          // Store token for polling endpoint
          const token = sessionToken || sessionId;
          
          // Try deep link first (for Tauri app)
          const deepLinkUrl = callbackUrl + 
            '?token=' + encodeURIComponent(token) + 
            '&sessionId=' + encodeURIComponent(sessionId) +
            '&email=' + encodeURIComponent(session.user.email || '') +
            '&name=' + encodeURIComponent(session.user.name || '');
          
          console.log('Attempting deep link:', deepLinkUrl);
          window.location.href = deepLinkUrl;
          
          // Fallback for web browsers (show instructions)
          setTimeout(() => {
            statusEl.innerHTML = 
              '<div class="success">' +
              '<h3>✓ Authentication Complete</h3>' +
              '<p>Please return to the application.</p>' +
              '<p style="font-size: 0.9em; color: #666;">If the app did not open automatically, please close this window.</p>' +
              '</div>';
          }, 2000);
          
        } catch (error) {
          console.error('Error:', error);
          statusEl.innerHTML = 
            '<div class="error">' +
            '<h3>Error</h3>' +
            '<p>' + error.message + '</p>' +
            '<p style="font-size: 0.9em;">Please close this window and try again.</p>' +
            '</div>';
        }
      }
      
      // Wait a bit for cookies to be set
      setTimeout(completeAuth, 1000);
    </script>
  </body>
</html>
    `);
    } catch (error) {
      console.error("Error in /auth/callback:", error);
      res
        .status(500)
        .send("Internal server error: " + (error as Error).message);
    }
  }
);

// Polling endpoint - allows Tauri app to check if auth is complete
app.get(
  "/auth/status/:sessionId",
  async (req: express.Request, res: express.Response) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }

      const session = sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found or expired" });
      }

      if (session.callbackReceived && session.sessionToken) {
        // Auth complete, return token
        return res.json({
          status: "complete",
          token: session.sessionToken,
          sessionId: sessionId,
        });
      }

      // Still waiting
      res.json({ status: "pending" });
    } catch (error) {
      console.error("Error in /auth/status:", error);
      res.status(500).json({ error: "Failed to check auth status" });
    }
  }
);

// Session validation endpoint (MUST BE BEFORE THE CATCH-ALL /api MIDDLEWARE)
app.post(
  "/api/session",
  async (req: express.Request, res: express.Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      console.log("Validating session...");

      const nextAuthUrl = process.env.NEXTAUTH_URL;
      const targetUrl = `${nextAuthUrl}/api/auth/session`;

      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Send both cookie names to cover prod (secure) and dev
          Cookie: `__Secure-next-auth.session-token=${token}; next-auth.session-token=${token}`,
        },
      });

      if (!response.ok) {
        console.error("Session validation failed:", response.status);
        return res
          .status(response.status)
          .json({ error: "Session validation failed" });
      }

      const sessionData = await response.json();

      if (!sessionData || !(sessionData as any).user) {
        console.error("Invalid session data");
        return res.status(401).json({ error: "Invalid session" });
      }

      console.log(
        "Session validated for user:",
        (sessionData as any).user.email
      );
      res.json(sessionData);
    } catch (error) {
      console.error("Session validation error:", error);
      res.status(500).json({ error: "Session validation failed" });
    }
  }
);

// Proxy authenticated requests (THIS MUST BE LAST)
app.use("/api", async (req: express.Request, res: express.Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const targetPath = req.originalUrl || req.url;
  const targetUrl = `${nextAuthUrl}${targetPath}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Cookie: `__Secure-next-auth.session-token=${token}; next-auth.session-token=${token}`,
      },
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

// Clean up expired sessions
setInterval(() => {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes

  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > maxAge) {
      console.log("Cleaning up expired session:", id);
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

app.listen(PORT, () => {
  console.log(`OAuth proxy server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`NextAuth URL: ${process.env.NEXTAUTH_URL}`);
  console.log(`Proxy URL: ${process.env.PROXY_URL}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
});

// OAuth Proxy Server for Tauri and Preview Environments
import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS
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
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for development
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Store active sessions
interface SessionData {
  provider: string;
  callbackUrl: string;
  createdAt: number;
  callbackReceived?: boolean;
  callbackReceivedAt?: number;
}

const sessions = new Map<string, SessionData>();

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initiate OAuth flow
app.post("/auth/init", async (req: Request, res: Response) => {
  try {
    console.log("Received OAuth init request:", req.body);
    const { provider, callbackUrl } = req.body;

    if (!provider) {
      return res.status(400).json({ error: "Provider is required" });
    }

    const sessionId = Math.random().toString(36).substring(2, 15);

    sessions.set(sessionId, {
      provider,
      callbackUrl,
      createdAt: Date.now(),
    });

    const nextAuthUrl = process.env.NEXTAUTH_URL;
    // Use Vercel URL if available, otherwise fall back to PROXY_URL or localhost
    const vercelUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null;
    const proxyUrl =
      process.env.PROXY_URL || vercelUrl || `http://localhost:${PORT}`;

    console.log("Proxy configuration:", {
      nextAuthUrl,
      proxyUrl,
      vercelUrl,
      envProxyUrl: process.env.PROXY_URL,
      port: PORT,
    });

    const authUrl = `${nextAuthUrl}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(
      `${proxyUrl}/auth/callback?session=${sessionId}`
    )}`;

    console.log("Generated auth URL:", authUrl);

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
app.get("/auth/callback", async (req: Request, res: Response) => {
  try {
    const { session: sessionId } = req.query;

    console.log("OAuth callback received, session ID:", sessionId);

    const cookies = req.headers.cookie || "";
    console.log("Cookies received:", cookies.substring(0, 100) + "...");

    let sessionToken = null;
    // Try multiple cookie name patterns
    const sessionTokenMatch =
      cookies.match(/next-auth\.session-token=([^;]+)/) ||
      cookies.match(/__Secure-next-auth\.session-token=([^;]+)/) ||
      cookies.match(/__Host-next-auth\.session-token=([^;]+)/);

    if (sessionTokenMatch) {
      sessionToken = sessionTokenMatch[1];
      console.log(
        "Extracted NextAuth session token (length:",
        sessionToken && sessionToken.length,
        ")"
      );
    } else {
      console.warn("No NextAuth session token found in cookies");
    }

    if (!sessionId) {
      console.error("No session ID provided");
      return res.status(400).send("No session ID provided");
    }

    const session = sessions.get(sessionId as string);

    if (session) {
      session.callbackReceived = true;
      session.callbackReceivedAt = Date.now();
    }

    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const callbackUrl = session?.callbackUrl || "myapp://callback";

    console.log("Callback handler config:", {
      nextAuthUrl,
      callbackUrl,
      hasCookies: !!cookies,
      cookieCount: cookies ? cookies.split(";").length : 0,
    });

    if (!nextAuthUrl) {
      console.error("NEXTAUTH_URL environment variable is not set!");
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Configuration Error</title></head>
          <body>
            <h2>Configuration Error</h2>
            <p>NEXTAUTH_URL environment variable is not set in the proxy server.</p>
            <p>Please configure it in your Vercel environment variables.</p>
          </body>
        </html>
      `);
    }

    // Fetch session server-side to avoid CORS issues
    let sessionData: { user?: { email?: string; name?: string } } | null = null;
    let fetchError: string | null = null;

    if (cookies) {
      try {
        const sessionUrl = `${nextAuthUrl}/api/auth/session`;
        console.log("Fetching session from NextAuth server-side...", {
          url: sessionUrl,
          cookieLength: cookies.length,
          cookiePreview: cookies.substring(0, 200),
        });

        const sessionResponse = await fetch(sessionUrl, {
          method: "GET",
          headers: {
            Cookie: cookies, // Forward all cookies to NextAuth
            "Content-Type": "application/json",
            "User-Agent": "oauth-proxy/1.0",
          },
        });

        console.log("Session fetch response:", {
          status: sessionResponse.status,
          statusText: sessionResponse.statusText,
          headers: Object.fromEntries(sessionResponse.headers.entries()),
        });

        if (sessionResponse.ok) {
          sessionData = (await sessionResponse.json()) as {
            user?: { email?: string; name?: string };
          };
          console.log("Session retrieved server-side:", {
            hasUser: !!sessionData?.user,
            userEmail: sessionData?.user?.email,
          });
        } else {
          const errorText = await sessionResponse
            .text()
            .catch(() => "Unknown error");
          console.warn("Failed to fetch session:", {
            status: sessionResponse.status,
            statusText: sessionResponse.statusText,
            errorText: errorText.substring(0, 500),
          });
          fetchError = `Failed to fetch session: ${sessionResponse.status} ${
            sessionResponse.statusText
          }. ${errorText.substring(0, 200)}`;
        }
      } catch (err) {
        console.error("Error fetching session server-side:", {
          error: err,
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          nextAuthUrl,
        });
        fetchError = `Fetch error: ${
          err instanceof Error ? err.message : String(err)
        }. Make sure NEXTAUTH_URL is set correctly and the NextAuth server is accessible.`;
      }
    } else {
      fetchError =
        "No cookies received in callback. This might indicate the OAuth flow didn't complete properly.";
      console.warn("No cookies in callback request");
    }

    // If we have session data, extract the token from cookies for the deep link
    if (!sessionToken && sessionData?.user) {
      // Try to get token from cookie header again
      const allCookies = cookies.split(";");
      for (const cookie of allCookies) {
        const trimmed = cookie.trim();
        if (
          trimmed.startsWith("next-auth.session-token=") ||
          trimmed.startsWith("__Secure-next-auth.session-token=") ||
          trimmed.startsWith("__Host-next-auth.session-token=")
        ) {
          sessionToken = trimmed.split("=").slice(1).join("=");
          break;
        }
      }
    }

    // Build the deep link URL
    const token = sessionToken || (sessionId as string);
    const email = sessionData?.user?.email || "";
    const name = sessionData?.user?.name || "";

    const deepLinkUrl = `${callbackUrl}?token=${encodeURIComponent(
      token
    )}&sessionId=${encodeURIComponent(
      sessionId as string
    )}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;

    // Send HTML page that redirects immediately or shows error
    if (sessionData?.user) {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Complete</title>
            <meta charset="UTF-8">
            <meta http-equiv="refresh" content="1;url=${deepLinkUrl}">
          </head>
          <body>
            <h2>Authentication Successful!</h2>
            <p>Redirecting to app...</p>
            <script>
              const redirectKey = 'oauth_redirected_${sessionId}';
              if (sessionStorage.getItem(redirectKey)) {
                console.log('Already redirected');
              } else {
                sessionStorage.setItem(redirectKey, 'true');
                console.log('Redirecting to:', ${JSON.stringify(callbackUrl)});
                window.location.href = ${JSON.stringify(deepLinkUrl)};
              }
              
              setTimeout(() => {
                document.body.innerHTML = '<h2>Please return to the app</h2>';
              }, 2000);
            </script>
          </body>
        </html>
      `);
    } else {
      // Even if we can't get session, we can still try to redirect with the session token
      // This allows the Tauri app to validate the token later
      if (sessionToken || sessionId) {
        console.log(
          "No session data, but have token/sessionId. Redirecting with available data..."
        );
        const fallbackDeepLinkUrl = `${callbackUrl}?token=${encodeURIComponent(
          sessionToken || (sessionId as string)
        )}&sessionId=${encodeURIComponent(sessionId as string)}`;

        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Processing</title>
              <meta charset="UTF-8">
              <meta http-equiv="refresh" content="2;url=${fallbackDeepLinkUrl}">
            </head>
            <body>
              <h2>Processing Authentication...</h2>
              <p>Redirecting to app. If you see an error, please try logging in again.</p>
              ${
                fetchError
                  ? `<p style="color: red; font-size: 12px;">Error: ${fetchError}</p>`
                  : ""
              }
              <script>
                setTimeout(() => {
                  window.location.href = ${JSON.stringify(fallbackDeepLinkUrl)};
                }, 1000);
              </script>
            </body>
          </html>
        `);
      } else {
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Error</title>
              <meta charset="UTF-8">
            </head>
            <body>
              <h2>Authentication Error</h2>
              <p>${
                fetchError ||
                "Failed to retrieve session. Please try logging in again."
              }</p>
              <p><strong>Debug info:</strong></p>
              <ul>
                <li>Session ID: ${sessionId || "None"}</li>
                <li>Has cookies: ${cookies ? "Yes" : "No"}</li>
                <li>NextAuth URL: ${nextAuthUrl || "Not set"}</li>
              </ul>
              <p>If this persists, please close this window and try again.</p>
              <p><small>Check the Vercel logs for more details.</small></p>
            </body>
          </html>
        `);
      }
    }
  } catch (error) {
    console.error("Error in /auth/callback:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).send("Internal server error: " + errorMessage);
  }
});

// Session validation endpoint (MUST BE BEFORE THE CATCH-ALL /api MIDDLEWARE)
app.post("/api/session", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    console.log("Validating session, token length:", token.length);

    const nextAuthUrl = process.env.NEXTAUTH_URL;

    if (!nextAuthUrl) {
      console.error("NEXTAUTH_URL environment variable is not set!");
      return res.status(500).json({
        error:
          "Server configuration error: NEXTAUTH_URL is not set. Please set it in Vercel environment variables to your NextAuth app URL (e.g., https://your-app.vercel.app)",
      });
    }

    // Check if NEXTAUTH_URL is localhost (won't work on Vercel)
    if (
      nextAuthUrl.includes("localhost") ||
      nextAuthUrl.includes("127.0.0.1")
    ) {
      console.error(
        "NEXTAUTH_URL is set to localhost, which won't work on Vercel:",
        nextAuthUrl
      );
      return res.status(500).json({
        error: `Server configuration error: NEXTAUTH_URL is set to "${nextAuthUrl}" which is a localhost URL. On Vercel, this must be set to your production NextAuth app URL (e.g., https://your-app.vercel.app). Please update the NEXTAUTH_URL environment variable in Vercel.`,
      });
    }

    const targetUrl = `${nextAuthUrl}/api/auth/session`;
    console.log("Fetching session from:", targetUrl);

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=${token}`,
          "User-Agent": "oauth-proxy/1.0",
        },
      });

      console.log("Session validation response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Session validation failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500),
        });
        return res.status(response.status).json({
          error: `Session validation failed: ${response.status} ${response.statusText}`,
          details: errorText.substring(0, 200),
        });
      }

      const sessionData = (await response.json()) as {
        user?: { email?: string; name?: string };
      };

      if (!sessionData || !sessionData.user) {
        console.error("Invalid session data:", sessionData);
        return res
          .status(401)
          .json({ error: "Invalid session: no user data found" });
      }

      console.log("Session validated for user:", sessionData.user.email);
      res.json(sessionData);
    } catch (fetchError) {
      console.error("Session validation fetch error:", {
        error: fetchError,
        message:
          fetchError instanceof Error ? fetchError.message : String(fetchError),
        nextAuthUrl,
        targetUrl,
      });

      const errorMessage =
        fetchError instanceof Error ? fetchError.message : String(fetchError);

      // Provide helpful error message for connection errors
      if (
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("ENOTFOUND")
      ) {
        return res.status(500).json({
          error: `Cannot connect to NextAuth server at ${nextAuthUrl}. Please verify that NEXTAUTH_URL is set to the correct production URL of your NextAuth application.`,
          details: errorMessage,
        });
      }

      return res.status(500).json({
        error: "Session validation failed",
        details: errorMessage,
      });
    }
  } catch (error) {
    console.error("Session validation error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: "Session validation failed",
      details: errorMessage,
    });
  }
});

// Proxy authenticated requests (THIS MUST BE LAST)
app.use("/api", async (req: Request, res: Response) => {
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
        Cookie: `next-auth.session-token=${token}`,
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
  const maxAge = 10 * 60 * 1000;

  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > maxAge) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`OAuth proxy server running on port ${PORT}`);
  console.log(`NextAuth URL: ${process.env.NEXTAUTH_URL}`);
});

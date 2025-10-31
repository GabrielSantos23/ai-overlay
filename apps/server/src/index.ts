import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@tauri-ai-overlay/api/context";
import { appRouter } from "@tauri-ai-overlay/api/routers/index";
import { createChatStream } from "@tauri-ai-overlay/api/chat-utils";
import { auth } from "@tauri-ai-overlay/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Add error handling for missing environment variables
const requiredEnvVars = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:", missingEnvVars);
}

const app = new Hono();

app.use(logger());

// Updated CORS configuration for Tauri
const allowedOrigins = [
  "http://localhost:3001",
  "http://tauri.localhost",
  "https://tauri.localhost",
  "tauri://localhost",
  "http://localhost:1420", // Tauri dev server default port
  ...(process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== "*"
    ? [process.env.CORS_ORIGIN]
    : []),
];

// Headers that better-auth-tauri needs
const tauriAuthHeaders = [
  "Content-Type",
  "Authorization",
  "Cookie",
  "platform", // Required by better-auth-tauri
  "x-better-auth-tauri", // Additional header that might be used
];

app.use(
  "/*",
  cors({
    origin: (origin) => {
      console.log(`[CORS] Request from origin: ${origin}`);
      console.log(`[CORS] Allowed origins:`, allowedOrigins);

      // Allow requests with no origin (like curl, Postman)
      if (!origin) {
        console.log(`[CORS] No origin, allowing`);
        return null;
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log(`[CORS] Origin ${origin} is in allowed list`);
        return origin;
      }

      // Fallback for development - allow any localhost
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.startsWith("tauri://") // Allow tauri:// protocol
      ) {
        console.log(`[CORS] Origin ${origin} matches localhost/tauri pattern`);
        return origin;
      }

      // If CORS_ORIGIN is wildcard, allow all (not recommended for production)
      if (process.env.CORS_ORIGIN === "*") {
        console.log(`[CORS] Wildcard CORS_ORIGIN, allowing ${origin}`);
        return origin;
      }

      console.log(`[CORS] Origin ${origin} not allowed`);
      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: tauriAuthHeaders,
    credentials: true,
    exposeHeaders: ["X-Conversation-Id", "X-Model-Used"],
  })
);

// Apply CORS specifically to auth routes with Tauri support
app.use(
  "/api/auth/*",
  cors({
    origin: (origin) => {
      console.log(`[CORS-AUTH] Request from origin: ${origin}`);
      console.log(`[CORS-AUTH] Allowed origins:`, allowedOrigins);

      // Allow requests with no origin (like curl, Postman)
      if (!origin) {
        console.log(`[CORS-AUTH] No origin, allowing`);
        return null;
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log(`[CORS-AUTH] Origin ${origin} is in allowed list`);
        return origin;
      }

      // Fallback for development - allow any localhost and tauri
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.startsWith("tauri://")
      ) {
        console.log(
          `[CORS-AUTH] Origin ${origin} matches localhost/tauri pattern`
        );
        return origin;
      }

      // If CORS_ORIGIN is wildcard, allow all (not recommended for production)
      if (process.env.CORS_ORIGIN === "*") {
        console.log(`[CORS-AUTH] Wildcard CORS_ORIGIN, allowing ${origin}`);
        return origin;
      }

      console.log(`[CORS-AUTH] Origin ${origin} not allowed`);
      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: tauriAuthHeaders, // Include platform header
    credentials: true,
    exposeHeaders: ["X-Conversation-Id", "X-Model-Used"],
  })
);

// Custom handler for social sign-in with disableRedirect for Tauri apps
app.post("/api/auth/sign-in/social", async (c) => {
  try {
    const body = await c.req.json();
    const { provider, callbackURL, errorCallbackURL, newUserCallbackURL } =
      body;

    if (!provider) {
      return c.json({ error: { message: "Provider is required" } }, 400);
    }

    // Log Tauri-specific headers for debugging
    const platform = c.req.header("platform");
    const isTauriRequest = c.req.header("x-better-auth-tauri");
    console.log(`[AUTH] Platform header:`, platform);
    console.log(`[AUTH] Is Tauri request:`, isTauriRequest);
    console.log(
      `[AUTH] Social sign-in request for provider: ${provider} from origin: ${c.req.header(
        "origin"
      )}`
    );

    // IMPORTANT for external-browser flows (Tauri):
    // Opening Google's URL directly in the system browser will miss the
    // state cookie set by the server, causing `state_mismatch`.
    // Instead, return the server-side initiator URL so the external browser
    // hits our server first (sets state cookie), then redirects to Google.
    const baseUrl = process.env.BASE_URL || "https://server.bangg.xyz";
    const url = new URL(`${baseUrl}/api/auth/sign-in/${provider}`);
    if (callbackURL) url.searchParams.set("callbackURL", callbackURL);
    if (errorCallbackURL)
      url.searchParams.set("errorCallbackURL", errorCallbackURL);
    if (newUserCallbackURL)
      url.searchParams.set("newUserCallbackURL", newUserCallbackURL);

    console.log(`[AUTH] Returning initiator URL for provider: ${provider}`);
    return c.json({ url: url.toString() });

    // (We no longer call the server API directly here to avoid cross-context cookie issues.)
  } catch (error) {
    console.error("[AUTH] Error in social sign-in handler:", error);
    return c.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Internal server error",
        },
      },
      500
    );
  }
});

// Better Auth handles all other auth routes including /api/auth/callback/google
// The custom callback handler was removed to let Better Auth process OAuth callbacks properly
app.on(["POST", "GET"], "/api/auth/*", async (c) => {
  console.log(
    `[AUTH] Handling auth request from origin: ${c.req.header("origin")}`
  );
  const response = await auth.handler(c.req.raw);
  console.log(`[AUTH] Response status: ${response.status}`);
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  console.log(`[AUTH] Response headers:`, headers);
  return response;
});

// Intermediate callback route for deep link back to the app
app.get("/auth/callback", async (c) => {
  const params = new URLSearchParams(c.req.query());
  const deepLink = `ai-overlay://auth/callback?${params.toString()}`;

  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Autenticação</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          text-align: center;
          background: white;
          padding: 3rem;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 400px;
        }
        h1 { color: #333; margin: 0 0 1rem; }
        p { color: #666; margin: 0 0 2rem; }
        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s;
        }
        button:hover { background: #5568d3; }
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="spinner"></div>
        <h1>✓ Autenticação bem-sucedida!</h1>
        <p>Retornando para o aplicativo...</p>
        <button onclick="openApp()">Abrir aplicativo</button>
      </div>

      <script>
        function openApp() {
          const deepLink = "${deepLink}";
          window.location.href = deepLink;
          setTimeout(() => window.close(), 2000);
        }

        // Tenta abrir automaticamente após 500ms
        setTimeout(openApp, 500);
      </script>
    </body>
    </html>
  `);
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: async (_opts, honoCtx) => {
      return await createContext({ context: honoCtx });
    },
  })
);

app.post("/ai", async (c) => {
  const startTime = Date.now();
  try {
    // Check for missing environment variables
    if (missingEnvVars.length > 0) {
      return c.json(
        {
          error: "Server configuration error",
          details: `Missing environment variables: ${missingEnvVars.join(
            ", "
          )}`,
        },
        500
      );
    }

    const body = await c.req.json();
    const uiMessages = body.messages || [];
    const conversationId = body.conversationId;

    // Derive user from session headers instead of trusting body
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const userId = session?.user?.id;

    console.log(`[AI] Starting request with ${uiMessages.length} messages`);
    console.log(`[AI] ConversationId from body:`, conversationId);
    console.log(`[AI] UserId:`, userId);

    // Validate required fields
    if (!userId) {
      return c.json({ error: "User authentication required" }, 401);
    }

    // Use shared utility for chat stream
    const {
      result,
      conversationId: convId,
      modelName,
    } = await createChatStream({
      userId,
      uiMessages,
      conversationId,
      onFinish: async ({ conversationId }) => {
        console.log(
          `[AI] Stored assistant response in conversation ${conversationId} (${
            Date.now() - startTime
          }ms total)`
        );
      },
    });

    console.log(
      `[AI] Returning stream response (${Date.now() - startTime}ms to start)`
    );

    // Return stream with conversation ID in headers
    const response = result.toUIMessageStreamResponse();
    response.headers.set("X-Conversation-Id", convId);
    response.headers.set("X-Model-Used", modelName);

    return response;
  } catch (error) {
    console.error("AI endpoint error:", error);
    return c.json(
      {
        error: "AI request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

app.get("/", (c) => {
  return c.text("OK");
});

app.get("/health", (c) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasAuthSecret: !!process.env.BETTER_AUTH_SECRET,
      hasGoogleApiKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasTavilyApiKey: !!process.env.TAVILY_API_KEY,
      corsOrigin: process.env.CORS_ORIGIN || "not set",
      allowedOrigins: allowedOrigins,
    },
    missingEnvVars: missingEnvVars,
  };

  return c.json(health);
});

// Export for Vercel
export default {
  fetch: app.fetch.bind(app),
};

// Configure Bun server with increased timeout for AI requests (for local development only)
if (process.env.NODE_ENV !== "production" && typeof Bun !== "undefined") {
  const port = Number(process.env.PORT) || 3000;
  Bun.serve({
    port,
    fetch: app.fetch,
    idleTimeout: 60, // Increase to 60 seconds for AI requests
  });
  console.log(`🚀 Server running on http://localhost:${port}`);
}

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
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:", missingEnvVars);
}

const app = new Hono();

app.use(logger());

app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

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
      hasTavilyApiKey: !!process.env.TAVILY_API_KEY,
      corsOrigin: process.env.CORS_ORIGIN || "not set",
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
}

// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { UserService } from "@/services/user.service";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!account || !user.email) {
          console.error("[NextAuth] Missing account or email");
          return false;
        }

        console.log("[NextAuth] Sign in callback:", {
          provider: account.provider,
          email: user.email,
        });

        // Find or create user in database
        const dbUser = await UserService.findOrCreateFromOAuth({
          email: user.email,
          name: user.name || undefined,
          image: user.image || undefined,
          provider: account.provider,
          providerId: account.providerAccountId,
        });

        console.log("[NextAuth] User saved to database:", dbUser.id);

        // Attach database user ID to the user object
        user.id = dbUser.id;

        return true;
      } catch (error) {
        console.error("[NextAuth] Error in signIn callback:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      const proxyUrl =
        process.env.PROXY_CALLBACK_URL || "http://localhost:3000/auth/callback";

      console.log(
        "NextAuth redirect callback - URL:",
        url,
        "BaseURL:",
        baseUrl,
        "Proxy URL:",
        proxyUrl
      );

      if (process.env.NODE_ENV === "development") {
        if (url.startsWith("http://") || url.startsWith("https://")) {
          console.log("Development mode: Allowing HTTP/HTTPS URL:", url);
          return url;
        }
      }

      if (url.startsWith("http://") || url.startsWith("https://")) {
        if (url.startsWith(proxyUrl) || url.includes(proxyUrl)) {
          console.log("Allowing proxy callback URL:", url);
          return url;
        }

        try {
          const urlObj = new URL(url);
          const baseUrlObj = new URL(baseUrl);
          if (urlObj.origin === baseUrlObj.origin) {
            console.log("Allowing same-origin URL:", url);
            return url;
          }
        } catch (e) {
          // Invalid URL
        }
      }

      if (url.startsWith("/")) {
        const fullUrl = `${baseUrl}${url}`;
        console.log("Allowing relative URL (converted to):", fullUrl);
        return fullUrl;
      }

      if (process.env.NODE_ENV === "development") {
        if (url.includes("localhost") || url.includes("127.0.0.1")) {
          console.log("Allowing localhost URL in development:", url);
          return url;
        }
      }

      console.log("Redirecting to base URL:", baseUrl);
      return baseUrl;
    },
    async jwt({ token, account, profile, user }) {
      // Persist OAuth data and user ID to token
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.providerId = account.providerAccountId;
      }

      // Add user ID from database
      if (user?.id) {
        token.userId = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;
      session.userId = token.userId as string;

      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

// Add CORS headers to allow proxy server to fetch session
function addCorsHeaders(response: Response, origin?: string | null): Response {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  // List of allowed origins (your proxy servers)
  const allowedOrigins = [
    "https://proxy.bangg.xyz",
    "http://localhost:3000",
    "http://localhost:3001",
  ];

  // Check if origin is allowed
  if (origin && allowedOrigins.some((allowed) => origin.includes(allowed))) {
    newResponse.headers.set("Access-Control-Allow-Origin", origin);
    newResponse.headers.set("Access-Control-Allow-Credentials", "true");
    newResponse.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS"
    );
    newResponse.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Cookie"
    );
  } else if (origin?.includes("localhost") || origin?.includes("127.0.0.1")) {
    // Always allow localhost for development
    newResponse.headers.set("Access-Control-Allow-Origin", origin);
    newResponse.headers.set("Access-Control-Allow-Credentials", "true");
    newResponse.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS"
    );
    newResponse.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Cookie"
    );
  }

  return newResponse;
}

async function corsHandler(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const origin = req.headers.get("origin");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return addCorsHeaders(new Response(null, { status: 204 }), origin);
  }

  const response = await handler(req, context);
  return addCorsHeaders(response, origin);
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");

  const allowedOrigins = [
    "https://proxy.bangg.xyz",
    "http://localhost:3000",
    "http://localhost:3001",
  ];

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
  };

  if (
    origin &&
    (allowedOrigins.some((allowed) => origin.includes(allowed)) ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1"))
  ) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}

export { corsHandler as GET, corsHandler as POST };

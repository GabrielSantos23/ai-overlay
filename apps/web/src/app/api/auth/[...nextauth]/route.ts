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
  // trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

async function corsHandler(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const response = await handler(req, context);

  const origin = req.headers.get("origin");
  if (
    origin &&
    (origin.includes("localhost:3000") || origin.includes("localhost:1420"))
  ) {
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    newResponse.headers.set("Access-Control-Allow-Origin", origin);
    newResponse.headers.set("Access-Control-Allow-Credentials", "true");
    newResponse.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS"
    );
    newResponse.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    return newResponse;
  }

  return response;
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": req.headers.get("origin") || "*",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export { corsHandler as GET, corsHandler as POST };

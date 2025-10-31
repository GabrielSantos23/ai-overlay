import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@tauri-ai-overlay/db";
import * as schema from "@tauri-ai-overlay/db/schema/auth";
import { tauri } from "@daveyplate/better-auth-tauri/plugin";
export const auth = betterAuth<BetterAuthOptions>({
  database: drizzleAdapter(db, {
    provider: "pg",

    schema: schema,
  }),

  baseURL: process.env.BASE_URL || "https://server.bangg.xyz",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI:
        process.env.NODE_ENV === "production"
          ? "https://server.bangg.xyz/api/auth/callback/google"
          : "http://localhost:3000/api/auth/callback/google",
    },
  },
  plugins: [
    tauri({
      scheme: "Bangg",
      callbackURL: "/main", // Optional: Where to redirect after auth (default: "/")
      successText: "Authentication successful! You can close this window.", // Optional
      successURL: "/auth/success", // Optional: Custom success page URL that will receive a ?redirectTo search parameter
      debugLogs: false, // Optional: Enable debug logs
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: [
    "http://localhost:3001",
    "http://tauri.localhost",
    "https://tauri.localhost",
    ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
  ],
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      // In development, allow cookies over http://localhost
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  },
});

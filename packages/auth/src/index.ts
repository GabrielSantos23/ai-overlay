import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "../../db/src";
import * as schema from "../../db/src/schema/auth";
// Email/password auth is not directly natively supported in NextAuth; use community solutions if needed

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // The callback URL is handled automatically by NextAuth
    }),
    // For email/password, see: https://next-auth.js.org/providers/credentials
    // Or use third-party community adapters/providers
    // Example (disabled):
    // CredentialsProvider({
    //   // ...implementation
    // }),
  ],
  adapter: DrizzleAdapter(db as any, { schema }),
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },
  // You might want to restrict origins using CORS at the API/server layer
  // callbacks, pages, events, etc. may go here as needed
};

// This export is for use in Next.js API route (e.g. /pages/api/auth/[...nextauth].ts)
// But you may also instantiate it elsewhere in a custom handler.
export default NextAuth(authOptions);

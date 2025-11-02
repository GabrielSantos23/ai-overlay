import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/src/index";

export async function createContext(opts: FetchCreateContextFnOptions) {
  // Get the session from NextAuth using the request headers
  // For Next.js App Router, we need to pass the request headers to getServerSession
  const session = await getServerSession({
    req: opts.req,
    ...authOptions,
  });
  return { session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

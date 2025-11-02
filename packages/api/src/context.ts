// @packages/api/src/context.ts
import type { Session } from "next-auth";

export type Context = {
  session: Session | null;
};

/**
 * Create context for tRPC.
 * The session is injected from the caller (Next.js app).
 */
export function createContext(session: Session | null = null): Context {
  return { session };
}

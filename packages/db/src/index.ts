import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
neonConfig.poolQueryViaFetch = true;

const sql = neon(process.env.DATABASE_URL || "");
export const db = drizzle(sql);

// Re-export query helpers to ensure a single drizzle-orm instance across packages
export { eq, desc, asc, and } from "drizzle-orm";

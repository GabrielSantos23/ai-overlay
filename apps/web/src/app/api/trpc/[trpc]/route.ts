import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextRequest } from "next/server";
import { appRouter } from "../../../../../../../packages/api/src";
import { createContext } from "../../../../../../../packages/api/src/context";

function handler(req: NextRequest) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });
}
export { handler as GET, handler as POST };

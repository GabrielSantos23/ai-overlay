import { protectedProcedure, publicProcedure, router } from "../index";
import { conversationsRouter } from "./conversations";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),

  conversations: conversationsRouter,
});

export type AppRouter = typeof appRouter;

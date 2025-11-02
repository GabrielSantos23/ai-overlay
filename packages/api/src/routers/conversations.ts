import { protectedProcedure, router } from "../index";
import { db, eq, desc, asc, and } from "../../../db/src";
import { conversation, message } from "../../../db/src/schema/auth";
import { z } from "zod";
import { generateSummary } from "../ai-utils";

export const conversationsRouter = router({
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user?.name as string;
    const conversationsList = await db
      .select({
        id: conversation.id,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
        createdAt: conversation.createdAt,
      })
      .from(conversation)
      .where(eq(conversation.userId, userId))
      .orderBy(desc(conversation.updatedAt));

    return conversationsList;
  }),

  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1, "Conversation ID is required."),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.session?.user?.name) {
        throw new Error("User not authenticated");
      }
      const userId = ctx.session?.user?.name as string;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const existingConversation = await db
        .select({ id: conversation.id })
        .from(conversation)
        .where(
          and(
            eq(conversation.id, input.conversationId),
            eq(conversation.userId, userId)
          )
        )
        .limit(1);

      if (existingConversation.length === 0) {
        throw new Error("Conversation not found or access denied.");
      }

      const messagesList = await db
        .select()
        .from(message)
        .where(eq(message.conversationId, input.conversationId))
        .orderBy(asc(message.createdAt));

      return messagesList;
    }),

  generateConversationSummary: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1, "Conversation ID is required."),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.name as string;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const existingConversation = await db
        .select({ id: conversation.id })
        .from(conversation)
        .where(
          and(
            eq(conversation.id, input.conversationId),
            eq(conversation.userId, userId)
          )
        )
        .limit(1);

      if (existingConversation.length === 0) {
        throw new Error("Conversation not found or access denied.");
      }

      const messagesList = await db
        .select()
        .from(message)
        .where(eq(message.conversationId, input.conversationId))
        .orderBy(asc(message.createdAt));

      const simpleMessages = messagesList
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

      const summary = await generateSummary(simpleMessages);

      await db
        .update(conversation)
        .set({
          title: summary.title,
          updatedAt: new Date(),
        })
        .where(eq(conversation.id, input.conversationId));

      return summary;
    }),

  // Conversation actions
  deleteConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1, "Conversation ID is required."),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.name as string;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Verify the conversation belongs to the user
      const existingConversation = await db
        .select({ id: conversation.id })
        .from(conversation)
        .where(
          and(
            eq(conversation.id, input.conversationId),
            eq(conversation.userId, userId)
          )
        )
        .limit(1);

      if (existingConversation.length === 0) {
        throw new Error("Conversation not found or access denied.");
      }

      // Delete the conversation (messages will be deleted due to cascade)
      await db
        .delete(conversation)
        .where(eq(conversation.id, input.conversationId));

      return { success: true, message: "Conversation deleted successfully." };
    }),

  editConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1, "Conversation ID is required."),
        title: z.string().min(1, "Title is required."),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.name as string;

      // Verify the conversation belongs to the user
      const existingConversation = await db
        .select({ id: conversation.id })
        .from(conversation)
        .where(
          and(
            eq(conversation.id, input.conversationId),
            eq(conversation.userId, userId)
          )
        )
        .limit(1);

      if (existingConversation.length === 0) {
        throw new Error("Conversation not found or access denied.");
      }

      // Update the conversation title
      await db
        .update(conversation)
        .set({
          title: input.title,
          updatedAt: new Date(),
        })
        .where(eq(conversation.id, input.conversationId));

      return { success: true, message: "Conversation updated successfully." };
    }),

  regenerateMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1, "Conversation ID is required."),
        messageId: z.string().min(1, "Message ID is required."),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.name as string;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Verify the conversation belongs to the user
      const existingConversation = await db
        .select({ id: conversation.id })
        .from(conversation)
        .where(
          and(
            eq(conversation.id, input.conversationId),
            eq(conversation.userId, userId)
          )
        )
        .limit(1);

      if (existingConversation.length === 0) {
        throw new Error("Conversation not found or access denied.");
      }

      // TODO: Implement message regeneration logic
      // This would involve:
      // 1. Finding the message to regenerate
      // 2. Getting the conversation context up to that point
      // 3. Calling the AI service to regenerate the response
      // 4. Updating the message content in the database

      return {
        success: true,
        message: "Message regeneration placeholder - not yet implemented.",
      };
    }),

  copyConversationLink: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1, "Conversation ID is required."),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.name as string;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Verify the conversation belongs to the user
      const existingConversation = await db
        .select({ id: conversation.id })
        .from(conversation)
        .where(
          and(
            eq(conversation.id, input.conversationId),
            eq(conversation.userId, userId)
          )
        )
        .limit(1);

      if (existingConversation.length === 0) {
        throw new Error("Conversation not found or access denied.");
      }

      // TODO: Implement conversation link generation
      // This would involve:
      // 1. Generating a shareable link for the conversation
      // 2. Possibly creating a temporary access token
      // 3. Returning the shareable URL

      return {
        success: true,
        link: `https://app.example.com/chat/${input.conversationId}`, // Placeholder URL
        message: "Conversation link placeholder - not yet implemented.",
      };
    }),
});

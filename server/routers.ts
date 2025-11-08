import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Prompt Templates
  promptTemplates: router({
    list: publicProcedure.query(async () => {
      const { getActivePromptTemplates } = await import("./db");
      return getActivePromptTemplates();
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const { getPromptTemplateById } = await import("./db");
      return getPromptTemplateById(input.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          content: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可以创建模板" });
        }
        const { createPromptTemplate } = await import("./db");
        return createPromptTemplate({ ...input, createdBy: ctx.user.id });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          content: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可以编辑模板" });
        }
        const { id, ...data } = input;
        const { updatePromptTemplate } = await import("./db");
        return updatePromptTemplate(id, data);
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可以删除模板" });
      }
      const { deletePromptTemplate } = await import("./db");
      return deletePromptTemplate(input.id);
    }),
  }),

  // Conversations
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserConversations } = await import("./db");
      return getUserConversations(ctx.user.id);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const { getConversationById } = await import("./db");
      const conversation = await getConversationById(input.id);
      if (!conversation || conversation.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return conversation;
    }),
    create: protectedProcedure
      .input(
        z.object({
          templateId: z.number().optional(),
          title: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { createConversation } = await import("./db");
        return createConversation({ ...input, userId: ctx.user.id });
      }),
  }),

  // Messages
  messages: router({
    list: protectedProcedure.input(z.object({ conversationId: z.number() })).query(async ({ input, ctx }) => {
      const { getConversationById, getConversationMessages } = await import("./db");
      const conversation = await getConversationById(input.conversationId);
      if (!conversation || conversation.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getConversationMessages(input.conversationId);
    }),
    send: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          content: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { getConversationById, getConversationMessages, createMessage, getPromptTemplateById } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");
        
        const conversation = await getConversationById(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Save user message
        await createMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.content,
        });

        // Get conversation history
        const history = await getConversationMessages(input.conversationId);
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

        // Add system prompt if template exists
        if (conversation.templateId) {
          const template = await getPromptTemplateById(conversation.templateId);
          if (template) {
            messages.push({ role: "system", content: template.content });
          }
        }

        // Add conversation history
        history.forEach((msg) => {
          if (msg.role !== "system") {
            messages.push({ role: msg.role as "user" | "assistant", content: msg.content });
          }
        });

        // Call LLM
        const response = await invokeLLM({ messages });
        const content = response.choices[0].message.content;
        const assistantMessage = typeof content === 'string' ? content : "抱歉，我无法回答。";

        // Save assistant message
        await createMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: assistantMessage,
        });

        return { content: assistantMessage };
      }),
  }),
});

export type AppRouter = typeof appRouter;

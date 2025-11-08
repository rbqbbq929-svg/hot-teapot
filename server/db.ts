import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Prompt Templates
export async function getActivePromptTemplates() {
  const db = await getDb();
  if (!db) return [];
  const { promptTemplates } = await import("../drizzle/schema");
  return db.select().from(promptTemplates).where(eq(promptTemplates.isActive, 1));
}

export async function getPromptTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { promptTemplates } = await import("../drizzle/schema");
  const result = await db.select().from(promptTemplates).where(eq(promptTemplates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPromptTemplate(data: { title: string; description?: string; content: string; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { promptTemplates } = await import("../drizzle/schema");
  const result = await db.insert(promptTemplates).values(data);
  return result;
}

export async function updatePromptTemplate(id: number, data: { title?: string; description?: string; content?: string; isActive?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { promptTemplates } = await import("../drizzle/schema");
  await db.update(promptTemplates).set(data).where(eq(promptTemplates.id, id));
}

export async function deletePromptTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { promptTemplates } = await import("../drizzle/schema");
  await db.update(promptTemplates).set({ isActive: 0 }).where(eq(promptTemplates.id, id));
}

// Conversations
export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { conversations } = await import("../drizzle/schema");
  return db.select().from(conversations).where(eq(conversations.userId, userId));
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { conversations } = await import("../drizzle/schema");
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createConversation(data: { userId: number; templateId?: number; title: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { conversations } = await import("../drizzle/schema");
  const result = await db.insert(conversations).values(data);
  return result;
}

// Messages
export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  const { messages } = await import("../drizzle/schema");
  return db.select().from(messages).where(eq(messages.conversationId, conversationId));
}

export async function createMessage(data: { conversationId: number; role: "user" | "assistant" | "system"; content: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { messages } = await import("../drizzle/schema");
  const result = await db.insert(messages).values(data);
  return result;
}

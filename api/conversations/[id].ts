import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc } from 'drizzle-orm';
import { conversations, messages } from '../../src/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  try {
    // GET - Get single conversation with messages
    if (req.method === 'GET') {
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id));

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(messages.timestamp);

      return res.status(200).json({
        ...conversation,
        messages: conversationMessages,
      });
    }

    // PATCH - Update conversation (star, archive, rename)
    if (req.method === 'PATCH') {
      const updates: Record<string, any> = {};
      const { title, isStarred, isArchived, category } = req.body;

      if (title !== undefined) updates.title = title;
      if (isStarred !== undefined) updates.isStarred = isStarred;
      if (isArchived !== undefined) updates.isArchived = isArchived;
      if (category !== undefined) updates.category = category;

      updates.updatedAt = new Date();

      const [updated] = await db
        .update(conversations)
        .set(updates)
        .where(eq(conversations.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      return res.status(200).json(updated);
    }

    // DELETE - Delete conversation (cascades to messages)
    if (req.method === 'DELETE') {
      const [deleted] = await db
        .delete(conversations)
        .where(eq(conversations.id, id))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

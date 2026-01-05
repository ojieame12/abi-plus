import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { messages, conversations } from '../../src/db/schema.js';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // POST - Add message to conversation
    if (req.method === 'POST') {
      const { conversationId, role, content, metadata } = req.body;

      if (!conversationId || !role || !content) {
        return res.status(400).json({
          error: 'conversationId, role, and content are required'
        });
      }

      // Validate conversation exists
      const [conversation] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.id, conversationId));

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Insert message
      const [newMessage] = await db
        .insert(messages)
        .values({
          conversationId,
          role,
          content,
          metadata: metadata || null,
        })
        .returning();

      // Update conversation's updatedAt
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));

      return res.status(201).json(newMessage);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc, and } from 'drizzle-orm';
import { conversations, messages } from '../../src/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - List conversations
    if (req.method === 'GET') {
      const { visitorId, includeArchived } = req.query;

      if (!visitorId) {
        return res.status(400).json({ error: 'visitorId is required' });
      }

      const conditions = [eq(conversations.visitorId, visitorId as string)];

      if (includeArchived !== 'true') {
        conditions.push(eq(conversations.isArchived, false));
      }

      const result = await db
        .select()
        .from(conversations)
        .where(and(...conditions))
        .orderBy(desc(conversations.updatedAt));

      return res.status(200).json(result);
    }

    // POST - Create conversation
    if (req.method === 'POST') {
      const { visitorId, title, category = 'general' } = req.body;

      if (!visitorId || !title) {
        return res.status(400).json({ error: 'visitorId and title are required' });
      }

      const [newConversation] = await db
        .insert(conversations)
        .values({
          visitorId,
          title,
          category,
        })
        .returning();

      return res.status(201).json(newConversation);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

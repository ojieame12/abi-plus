// Supplier Portfolio API - Get supplier data for AI responses
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {
  getPortfolioSummary,
  getAllSuppliers,
  getSupplierByName,
  getHighRiskSuppliers,
  getRecentRiskChanges,
  searchSuppliers,
  type Supplier,
  type RiskPortfolio,
  type RiskChange,
} from '../../src/services/supplierService.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

export interface PortfolioDataResponse {
  portfolio: RiskPortfolio;
  suppliers: Supplier[];
  highRiskSuppliers: Supplier[];
  riskChanges: RiskChange[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();

  try {
    const { action, query, filters } = req.method === 'POST'
      ? req.body
      : req.query;

    switch (action) {
      case 'portfolio': {
        // Get full portfolio data for AI context
        const [portfolio, suppliers, highRiskSuppliers, riskChanges] = await Promise.all([
          getPortfolioSummary(db),
          getAllSuppliers(db),
          getHighRiskSuppliers(db),
          getRecentRiskChanges(db, 10),
        ]);

        return res.status(200).json({
          portfolio,
          suppliers,
          highRiskSuppliers,
          riskChanges,
        } as PortfolioDataResponse);
      }

      case 'search': {
        // Search for a specific supplier
        const searchQuery = Array.isArray(query) ? query[0] : query;
        if (!searchQuery) {
          return res.status(400).json({ error: 'Query parameter required' });
        }

        const supplier = await getSupplierByName(db, searchQuery);
        if (!supplier) {
          // Try fuzzy search
          const results = await searchSuppliers(db, searchQuery, 5);
          return res.status(200).json({ suppliers: results, found: results.length > 0 });
        }

        return res.status(200).json({ supplier, found: true });
      }

      case 'filter': {
        // Get filtered suppliers
        const parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
        const suppliers = await getAllSuppliers(db, parsedFilters);
        return res.status(200).json({ suppliers, count: suppliers.length });
      }

      case 'changes': {
        // Get recent risk changes
        const changes = await getRecentRiskChanges(db, 10);
        return res.status(200).json({ riskChanges: changes });
      }

      default: {
        // Default: return summary
        const portfolio = await getPortfolioSummary(db);
        return res.status(200).json({ portfolio });
      }
    }
  } catch (error) {
    console.error('Supplier API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

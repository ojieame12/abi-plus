// Re-export common data types for convenience
export type { Supplier, RiskChange, RiskLevel, TrendDirection, SupplierRiskScore } from './supplier';

// Portfolio type for risk distribution
export interface Portfolio {
  totalSuppliers: number;
  totalSpend: number;
  spendFormatted: string;
  avgRiskScore: number;
  distribution: {
    high: number;
    mediumHigh: number;
    medium: number;
    low: number;
    unrated: number;
  };
}

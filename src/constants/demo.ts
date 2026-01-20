// Demo Mode Constants
// Stable IDs matching scripts/seed-demo.ts

export const DEMO_IDS = {
  company: '550e8400-e29b-41d4-a716-446655440001',

  users: {
    admin: '550e8400-e29b-41d4-a716-446655440010',
    approver: '550e8400-e29b-41d4-a716-446655440011',
    member: '550e8400-e29b-41d4-a716-446655440012',
  },

  teams: {
    directMaterials: '550e8400-e29b-41d4-a716-446655440020',
    indirectProcurement: '550e8400-e29b-41d4-a716-446655440021',
  },

  creditAccount: '550e8400-e29b-41d4-a716-446655440030',
} as const;

// All demo personas are in Direct Materials team
// This is the default team for upgrade requests
export const DEMO_DEFAULT_TEAM_ID = DEMO_IDS.teams.directMaterials;
export const DEMO_COMPANY_ID = DEMO_IDS.company;

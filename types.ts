
export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface UserAuth {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

export type GoalMode = 'daily' | 'monthly' | 'fixed';

export interface DashboardGoals {
  amountSpent: { value: number; mode: GoalMode };
  leads: { value: number; mode: GoalMode };
  cpl: { value: number; mode: GoalMode };
  ctr: { value: number; mode: GoalMode };
  cpm: { value: number; mode: GoalMode };
  frequency: { value: number; mode: GoalMode };
}

export interface ClientData {
  projectName: string;
  totalUnits: number;
  vgv: number;
  weeksOperation: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  color: string;
}

export interface ClientLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessTitle: string;
  pipeline: string;
  stage: string;
  date: string;
}

export interface CreativePlayback {
  adName: string;
  views3s: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  p100: number;
  retentionRate: number;
  date?: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  revenuePerUnitManaged: number;
  unitsSoldPerWeek: number;
  preLaunchSoldRatio: number; 
  conversionRateLeadToSale: number; 
  qualifiedLeadRatio: number; 
  cac: number; 
  totalUnitsSold: number;
  totalLeads: number;
  totalSpend: number;
  marketingMetrics: {
    cpm: number;
    ctr: number;
    cpc: number;
    frequency: number;
    cpl: number;
    reach: number;
    impressions: number;
    clicks: number;
    landingPageConvRate: number;
  };
  salesMetrics: {
    avgResponseTime: string; 
    totalBilling: number;
    generalConvRate: number;
  };
}

export interface DashboardData {
  metrics: DashboardMetrics;
  clientInfo: ClientData;
  salesTrend: { date: string; value: number }[];
  funnelData: FunnelStage[];
  leadsList: ClientLead[];
  adsTrend: { date: string; spend: number; leads: number }[];
  creativePlayback: CreativePlayback[];
  dataSource: 'supabase' | 'fallback';
  rawSample?: any[]; 
  fetchedTables?: string[];
  rawDataByTable?: Record<string, any[]>;
}

export interface Company {
  ticker: string;
  name: string;
  sector: string;
  market_cap_category: string;
  price: number;
  change_pct: number;
  volume: number;
  avg_volume_20d: number;
}

export interface Announcement {
  id: number;
  ticker: string;
  category: string;
  headline: string;
  raw_text?: string;
  ai_summary?: string;
  materiality_score: number;
  enrichment_json?: string;
  source_url?: string;
  filed_at: string;
}

export interface FeedItem {
  announcement: Announcement;
  priority_level: 'must-see' | 'worth-knowing' | 'routine';
}

export interface AlertTriggered {
  id: number;
  ticker: string;
  rule_type: string;
  message: string;
  payload_json?: string;
  triggered_at: string;
  is_read: boolean;
}

export interface ResearchOutput {
  ticker: string;
  module: string;
  model_used: string;
  title: string;
  summary: string;
  structured_data?: any;
  sources: string[];
  generated_at: string;
}

export interface InvestorPersonality {
  archetype: string;
  tagline: string;
  description: string;
  key_traits: string[];
  feed_focus: string;
  risk_profile: string;
  priority_categories: string[];
}

export interface UserProfile {
  email: string;
  name: string;
  avatar?: string;
  age?: number;
  is_age_verified?: boolean;
  investor_type?: 'Long-Term Investor' | 'Regular Investor' | 'Short-Term Risk-Taker' | string;
  portfolio_stocks?: string[];
  personality?: InvestorPersonality;
  is_onboarded: boolean;
  oauth_token?: string;
  created_at?: string;
}



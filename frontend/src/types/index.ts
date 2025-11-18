export interface User {
  id: string;
  email: string;
  subscription_plan: 'starter' | 'pro' | 'agency' | 'enterprise';
}

export interface Audit {
  id: string;
  user_id: string;
  domain: string;
  url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  health_score: number;
  total_pages_crawled: number;
  critical_issues_count: number;
  warnings_count: number;
  notices_count: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Issue {
  id: string;
  audit_id: string;
  issue_type: string;
  severity: 'critical' | 'warning' | 'notice';
  title: string;
  description: string;
  affected_pages: string[];
  affected_count: number;
  recommendation: string;
  status: 'unresolved' | 'resolved' | 'ignored';
  created_at: string;
}

export interface Recommendation {
  id: string;
  issue_id: string;
  title: string;
  description: string;
  effort_level: 'easy' | 'medium' | 'hard';
  impact_level: 'high' | 'medium' | 'low';
  fix_guide: string;
  external_resources: string[];
}

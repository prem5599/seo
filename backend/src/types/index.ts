export interface User {
  id: string;
  email: string;
  password_hash: string;
  subscription_plan: 'starter' | 'pro' | 'agency' | 'enterprise';
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface Issue {
  id: string;
  audit_id: string;
  issue_type: string;
  severity: 'critical' | 'warning' | 'notice';
  affected_pages: string[];
  recommendation: string;
  status: 'unresolved' | 'resolved';
  created_at: Date;
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

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'starter' | 'pro' | 'agency' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  stripe_subscription_id?: string;
  current_period_end: Date;
  auto_renew: boolean;
}

export interface AuthRequest extends Request {
  user?: User;
}

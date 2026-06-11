export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  is_verified?: number | boolean;
  status?: 'active' | 'pending' | 'suspended' | 'blocked';
  current_balance?: string;
  total_earned?: string;
  ads_watched_count?: number;
}

export interface Ad {
  id: number;
  title: string;
  description?: string;
  ad_type: 'image' | 'video';
  content_url?: string;
  thumbnail_url?: string | null;
  budget: string;
  spent_amount: string;
  actual_views: number;
  status: 'active' | 'paused' | 'completed' | 'draft';
}

export interface DashboardStats {
  totalUsers: number;
  activeAds: number;
  totalRevenue: string;
  adViewsToday: number;
  recentAds: Ad[];
}

export interface SystemSettings {
  minimum_withdrawal?: string;
  cost_per_view?: string;
  referral_bonus?: string;
}

export interface ViewAdType {
  user_id: number;
  campaign_id?: number;
  view_duration: number;
  full_duration: number;
  completion_percentage: number;
  device_type: 'mobile' | 'desktop';
  ip_address: string;
  is_completed: boolean;
}
export interface Analytics {
  stats: {
    totalViews: number;
    activeUsers: number;
    revenueGenerated: string;
    avgCTR: string;
  };
  weeklyEngagement: {
    date: string;
    day: string;
    total_views: number;
    active_users: number;
  }[];
  topAds?: {
    title: string;
    views: number;
    ctr: string;
    revenue: string;
  }[];
  recentAds: Ad[];
  revenueBreakdown: {
    revenueFromFacilities: string;
    paidToUsers: number;
    netProfit: number;
  };
}
interface MetricItem {
  label: string;
  value: string;
}

export interface KeyMetrics {
  overview: MetricItem[];
  revenue: MetricItem[];
  'user-activity': MetricItem[];
  'ad-performance': MetricItem[];
  financial: MetricItem[];
}

export interface Report {
  id: number;
  report_name: string;
  report_type: string;
  file_path: string;
  file_size: number;
  status: 'pending' | 'completed' | 'failed';
  parameters: Record<string, any>;
  date_range_start: string;
  date_range_end: string;
  generated_by: number;
  generated_at: string;
}
export type PaymentMethod = 'esewa' | 'khalti' | 'bank_transfer' | 'digital_wallet';

export interface Payment {
  id: number;
  transaction_id: string;
  user_id: number;
  type: 'revenue' | 'payout';
  amount: string;
  currency: string;
  payment_method: PaymentMethod;
  payment_reference: string | null;
  status: 'completed' | 'pending' | 'failed';
  description: string | null;
  created_at: string;
}

export interface Referral {
  id: number;
  earned_amount: number;
  created_at: string;
  new_user: User;
}
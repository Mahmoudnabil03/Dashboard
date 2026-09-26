-- SocialHub D1 (SQLite) schema
-- Apply with:
--   npx wrangler d1 execute aqarx-db --remote --file=./schema.sql
-- SQLite notes vs Postgres:
--   SERIAL            -> INTEGER PRIMARY KEY AUTOINCREMENT
--   JSONB             -> TEXT (store JSON.stringify'd values)
--   TEXT[]            -> TEXT (store JSON arrays)
--   BOOLEAN           -> INTEGER (0/1)
--   NUMERIC/REAL      -> REAL
--   TIMESTAMP default -> TEXT DEFAULT CURRENT_TIMESTAMP

CREATE TABLE IF NOT EXISTS dashboard_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  email_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_workspaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  business_category TEXT,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  country TEXT,
  target_audience TEXT,
  marketing_objective TEXT,
  brand_voice TEXT,
  brand_colors TEXT,
  brand_keywords TEXT,
  brand_avoid_words TEXT,
  preferred_language TEXT DEFAULT 'en',
  content_style TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_workspace_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'member',
  permissions TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS dashboard_social_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER,
  platform TEXT NOT NULL,
  username TEXT,
  access_token TEXT,
  refresh_token TEXT,
  account_data TEXT,
  token_expires_at TEXT,
  status TEXT DEFAULT 'connected',
  last_sync_at TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workspace_id, platform)
);

CREATE TABLE IF NOT EXISTS dashboard_properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER,
  title TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  price REAL,
  bedrooms INTEGER,
  bathrooms REAL,
  sqft INTEGER,
  property_type TEXT DEFAULT 'house',
  status TEXT DEFAULT 'available',
  description TEXT,
  features TEXT,
  image_urls TEXT,
  listing_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER,
  account_id INTEGER,
  property_id INTEGER,
  content TEXT,
  media_urls TEXT,
  scheduled_time TEXT,
  status TEXT DEFAULT 'draft',
  platform TEXT,
  post_id TEXT,
  metrics TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  workspace_id INTEGER,
  comment_id TEXT,
  content TEXT,
  author TEXT,
  replied INTEGER DEFAULT 0,
  ai_response TEXT,
  assignee TEXT,
  ticket_status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER,
  property_id INTEGER,
  comment_id INTEGER,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT DEFAULT 'manual',
  platform TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_ai_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER,
  name TEXT,
  description TEXT,
  config TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_ai_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER,
  task_type TEXT,
  input_data TEXT,
  output_data TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

-- Tracking/Pixel Integrations
CREATE TABLE IF NOT EXISTS dashboard_tracking_integrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  name TEXT,
  pixel_id TEXT,
  access_token TEXT,
  api_key TEXT,
  api_secret TEXT,
  config TEXT,
  status TEXT DEFAULT 'disconnected',
  last_event_at TEXT,
  event_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workspace_id, provider)
);

-- Tracking Events
CREATE TABLE IF NOT EXISTS dashboard_tracking_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  integration_id INTEGER,
  event_name TEXT NOT NULL,
  event_data TEXT,
  event_time TEXT,
  processed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Website connections
CREATE TABLE IF NOT EXISTS dashboard_websites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  name TEXT,
  verification_status TEXT DEFAULT 'pending',
  tracking_status TEXT DEFAULT 'inactive',
  last_scan_at TEXT,
  health_status TEXT,
  analytics_data TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns
CREATE TABLE IF NOT EXISTS dashboard_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  objective TEXT,
  platform TEXT,
  status TEXT DEFAULT 'draft',
  budget REAL,
  start_date TEXT,
  end_date TEXT,
  audience TEXT,
  creative TEXT,
  copy TEXT,
  landing_page TEXT,
  tracking TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Metrics
CREATE TABLE IF NOT EXISTS dashboard_campaign_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  workspace_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  spend REAL DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr REAL DEFAULT 0,
  cpc REAL DEFAULT 0,
  cpm REAL DEFAULT 0,
  leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost_per_conversion REAL DEFAULT 0,
  revenue REAL DEFAULT 0,
  roas REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (campaign_id, date)
);

-- Content Ideas/Items
CREATE TABLE IF NOT EXISTS dashboard_content_ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  platform TEXT,
  content_type TEXT,
  topic TEXT,
  hook TEXT,
  format TEXT,
  caption TEXT,
  creative TEXT,
  cta TEXT,
  status TEXT DEFAULT 'idea',
  scheduled_date TEXT,
  notes TEXT,
  ai_generated INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Reports
CREATE TABLE IF NOT EXISTS dashboard_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  name TEXT,
  date_range_start TEXT,
  date_range_end TEXT,
  platforms TEXT,
  metrics TEXT,
  charts TEXT,
  ai_summary TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'generating',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS dashboard_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  user_id INTEGER,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS dashboard_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  user_id INTEGER,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Subscription/Billing
CREATE TABLE IF NOT EXISTS dashboard_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dashboard_workspaces_user ON dashboard_workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_properties_workspace ON dashboard_properties(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_posts_workspace ON dashboard_posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_leads_workspace ON dashboard_leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_comments_workspace ON dashboard_comments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_social_accounts_workspace ON dashboard_social_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_tracking_integrations_workspace ON dashboard_tracking_integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_tracking_events_workspace ON dashboard_tracking_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_tracking_events_time ON dashboard_tracking_events(event_time);
CREATE INDEX IF NOT EXISTS idx_dashboard_campaigns_workspace ON dashboard_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_content_ideas_workspace ON dashboard_content_ideas(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_notifications_workspace ON dashboard_notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_audit_logs_workspace ON dashboard_audit_logs(workspace_id);

-- Auth hardening (email verification, password reset, rate limiting)
CREATE TABLE IF NOT EXISTS dashboard_email_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_rate_events (
  ip TEXT NOT NULL,
  route TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_tokens_token ON dashboard_email_tokens(token);
CREATE INDEX IF NOT EXISTS idx_rate_events_ip_route ON dashboard_rate_events(ip, route, created_at);

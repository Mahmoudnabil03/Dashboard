-- EstateHub D1 (SQLite) schema
-- Apply with:
--   npx wrangler d1 execute aqarx-db --remote --file=./schema.sql
-- SQLite notes vs Postgres:
--   SERIAL            -> INTEGER PRIMARY KEY AUTOINCREMENT
--   JSONB             -> TEXT (store JSON.stringify'd values)
--   TEXT[]            -> TEXT (store JSON arrays)
--   BOOLEAN           -> INTEGER (0/1)
--   NUMERIC/REAL      -> REAL
--   TIMESTAMP default -> TEXT DEFAULT CURRENT_TIMESTAMP

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  platform TEXT NOT NULL,
  username TEXT,
  access_token TEXT,
  refresh_token TEXT,
  account_data TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, platform)
);

CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
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

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
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

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  user_id INTEGER,
  comment_id TEXT,
  content TEXT,
  author TEXT,
  replied INTEGER DEFAULT 0,
  ai_response TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
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

CREATE TABLE IF NOT EXISTS ai_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT,
  description TEXT,
  config TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER,
  task_type TEXT,
  input_data TEXT,
  output_data TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_properties_user ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

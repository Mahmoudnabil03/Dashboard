// Run this SQL to update your database schema
const migrationSQL = `
-- Add unique constraint for user_id and platform
ALTER TABLE social_accounts 
ADD CONSTRAINT unique_user_platform UNIQUE (user_id, platform);

-- Add index for faster lookups
CREATE INDEX idx_social_accounts_user_platform 
ON social_accounts(user_id, platform);

-- Add token expiry tracking
ALTER TABLE social_accounts 
ADD COLUMN token_expires_at TIMESTAMP;

-- Add last_sync field
ALTER TABLE social_accounts 
ADD COLUMN last_sync TIMESTAMP;
`;
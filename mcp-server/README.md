# SocialHub MCP Server

MCP (Model Context Protocol) server for SocialHub - enables AI assistants to manage social media, analytics, tracking, campaigns, and content.

## Features

- **Authentication**: Login, workspace management
- **Social Accounts**: Connect/disconnect Twitter, Instagram, Facebook, LinkedIn, TikTok, WhatsApp
- **Posts**: Create, list, delete scheduled posts
- **Analytics**: Get performance metrics across platforms
- **Tracking Integrations**: Manage pixels, CAPI, GA4, GTM, TikTok Pixel, LinkedIn Insight Tag, Snapchat Pixel, Pinterest Tag
- **Websites**: Add, verify, scan websites for analytics
- **AI Agent**: Manage agents, generate content, get replies, content suggestions
- **Campaigns**: Full CRUD + metrics tracking
- **Content Ideas**: Content calendar with statuses, bulk operations
- **Leads**: Lead pipeline management
- **Comments/Inbox**: Unified inbox, reply to comments

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

Set environment variables:

```bash
export SOCIALHUB_API_URL=https://dashboard.mahmoudnabil03.workers.dev
export SOCIALHUB_API_TOKEN=your-jwt-token-here
```

## Usage with Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "socialhub": {
      "command": "node",
      "args": ["/path/to/social-media-dashboard/mcp-server/dist/index.js"],
      "env": {
        "SOCIALHUB_API_URL": "https://dashboard.mahmoudnabil03.workers.dev",
        "SOCIALHUB_API_TOKEN": "your-jwt-token"
      }
    }
  }
}
```

## Available Tools

### Auth & Workspace
- `socialhub_login` - Login and get JWT token
- `socialhub_get_workspace` - Get current workspace info
- `socialhub_update_workspace` - Update workspace settings

### Social Accounts
- `socialhub_list_accounts` - List connected accounts
- `socialhub_connect_account` - Initiate OAuth (platform: twitter|instagram|facebook|linkedin|tiktok|whatsapp)
- `socialhub_disconnect_account` - Disconnect account

### Posts
- `socialhub_list_posts` - List all posts
- `socialhub_create_post` - Create post (content, platform, scheduled_time, account_id, property_id)
- `socialhub_delete_post` - Delete post

### Analytics
- `socialhub_get_analytics` - Get analytics (period: 7|30|90|all)

### Tracking Integrations
- `socialhub_list_tracking` - List all tracking integrations
- `socialhub_add_tracking` - Add tracking (provider, pixel_id, access_token, api_key, api_secret, config)
- `socialhub_test_tracking` - Test integration connection
- `socialhub_delete_tracking` - Delete integration
- `socialhub_get_tracking_events` - Get recent events
- `socialhub_get_tracking_stats` - Get stats (days)

### Websites
- `socialhub_list_websites` - List websites
- `socialhub_add_website` - Add website (url, name)
- `socialhub_verify_website` - Verify ownership
- `socialhub_scan_website` - Scan for analytics

### AI Agent
- `socialhub_list_ai_agents` - List agents
- `socialhub_create_ai_agent` - Create agent (name, description, config)
- `socialhub_generate_content` - Generate content (topic, tone, platform)
- `socialhub_ai_reply` - Generate reply (comment, context, agentId)
- `socialhub_ai_suggestions` - Get suggestions (platform, topic, targetAudience)

### Campaigns
- `socialhub_list_campaigns` - List campaigns
- `socialhub_get_campaign` - Get campaign by ID
- `socialhub_create_campaign` - Create campaign
- `socialhub_update_campaign` - Update campaign
- `socialhub_delete_campaign` - Delete campaign
- `socialhub_get_campaign_metrics` - Get metrics
- `socialhub_add_campaign_metrics` - Add metrics (date, spend, reach, impressions, clicks, etc.)

### Content Ideas
- `socialhub_list_content` - List content (status, platform filters)
- `socialhub_get_content` - Get content by ID
- `socialhub_create_content` - Create content idea
- `socialhub_update_content` - Update content
- `socialhub_delete_content` - Delete content
- `socialhub_bulk_update_content_status` - Bulk update status

### Leads
- `socialhub_list_leads` - List leads (status filter)
- `socialhub_create_lead` - Create lead

### Comments/Inbox
- `socialhub_list_comments` - List unified inbox
- `socialhub_reply_comment` - Reply to comment

## Resources

- `socialhub://workspace` - Current workspace
- `socialhub://accounts` - Social accounts
- `socialhub://posts` - Posts
- `socialhub://analytics` - Analytics
- `socialhub://tracking` - Tracking integrations
- `socialhub://websites` - Websites
- `socialhub://ai-agents` - AI agents
- `socialhub://campaigns` - Campaigns
- `socialhub://content` - Content ideas
- `socialhub://leads` - Leads
- `socialhub://inbox` - Unified inbox

## Example Usage

```
User: "Create a campaign for our new product launch on Instagram with $5000 budget"
Assistant: [uses socialhub_create_campaign tool]

User: "Show me all Meta Pixel tracking integrations"
Assistant: [uses socialhub_list_tracking tool, filters for meta_pixel]

User: "Generate 5 content ideas for Instagram Reels about fitness"
Assistant: [uses socialhub_ai_suggestions tool]

User: "Add Meta Pixel ID 123456789 with access token"
Assistant: [uses socialhub_add_tracking tool with provider: meta_pixel]
```
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const axios_1 = __importDefault(require("axios"));
const BASE_URL = process.env.SOCIALHUB_API_URL || 'https://dashboard.mahmoudnabil03.workers.dev';
const API_TOKEN = process.env.SOCIALHUB_API_TOKEN;
class SocialHubClient {
    client;
    constructor() {
        this.client = axios_1.default.create({
            baseURL: `${BASE_URL}/api`,
            headers: {
                'Content-Type': 'application/json',
                ...(API_TOKEN && { Authorization: `Bearer ${API_TOKEN}` }),
            },
        });
        this.client.interceptors.response.use((response) => response.data, (error) => {
            throw new Error(error.response?.data?.error || error.message);
        });
    }
    async get(path, params) {
        return this.client.get(path, { params });
    }
    async post(path, data) {
        return this.client.post(path, data);
    }
    async put(path, data) {
        return this.client.put(path, data);
    }
    async patch(path, data) {
        return this.client.patch(path, data);
    }
    async delete(path) {
        return this.client.delete(path);
    }
}
const socialHub = new SocialHubClient();
const server = new index_js_1.Server({
    name: 'socialhub',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: [
        // Auth & Workspace
        {
            name: 'socialhub_login',
            description: 'Login to SocialHub and get auth token',
            inputSchema: {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                },
                required: ['email', 'password'],
            },
        },
        {
            name: 'socialhub_get_workspace',
            description: 'Get current workspace info',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'socialhub_update_workspace',
            description: 'Update workspace settings',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    business_category: { type: 'string' },
                    website: { type: 'string', format: 'uri' },
                    description: { type: 'string' },
                    timezone: { type: 'string' },
                    country: { type: 'string' },
                    target_audience: { type: 'string' },
                    marketing_objective: { type: 'string' },
                    brand_voice: { type: 'string' },
                    brand_colors: { type: 'string' },
                    brand_keywords: { type: 'string' },
                    brand_avoid_words: { type: 'string' },
                    preferred_language: { type: 'string' },
                    content_style: { type: 'string' },
                },
            },
        },
        // Social Accounts
        {
            name: 'socialhub_list_accounts',
            description: 'List all connected social accounts',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'socialhub_connect_account',
            description: 'Initiate OAuth connection for a platform',
            inputSchema: {
                type: 'object',
                properties: {
                    platform: { type: 'string', enum: ['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'whatsapp'] },
                },
                required: ['platform'],
            },
        },
        {
            name: 'socialhub_disconnect_account',
            description: 'Disconnect a social account',
            inputSchema: {
                type: 'object',
                properties: {
                    accountId: { type: 'number' },
                },
                required: ['accountId'],
            },
        },
        // Posts
        {
            name: 'socialhub_list_posts',
            description: 'List all posts',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'socialhub_create_post',
            description: 'Create a new post',
            inputSchema: {
                type: 'object',
                properties: {
                    content: { type: 'string' },
                    platform: { type: 'string', enum: ['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'whatsapp'] },
                    scheduled_time: { type: 'string', format: 'date-time' },
                    account_id: { type: 'number' },
                    property_id: { type: 'number' },
                },
                required: ['content', 'platform'],
            },
        },
        {
            name: 'socialhub_delete_post',
            description: 'Delete a post',
            inputSchema: {
                type: 'object',
                properties: {
                    postId: { type: 'number' },
                },
                required: ['postId'],
            },
        },
        // Analytics
        {
            name: 'socialhub_get_analytics',
            description: 'Get analytics overview',
            inputSchema: {
                type: 'object',
                properties: {
                    period: { type: 'string', enum: ['7', '30', '90', 'all'] },
                },
            },
        },
        // Tracking Integrations
        {
            name: 'socialhub_list_tracking',
            description: 'List all tracking integrations (pixels, CAPI, GA, etc.)',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'socialhub_add_tracking',
            description: 'Add or update a tracking integration',
            inputSchema: {
                type: 'object',
                properties: {
                    provider: { type: 'string', enum: ['meta_pixel', 'meta_capi', 'google_analytics', 'google_tag_manager', 'tiktok_pixel', 'linkedin_insight_tag', 'snapchat_pixel', 'pinterest_tag'] },
                    name: { type: 'string' },
                    pixel_id: { type: 'string' },
                    access_token: { type: 'string' },
                    api_key: { type: 'string' },
                    api_secret: { type: 'string' },
                    config: { type: 'object' },
                },
                required: ['provider'],
            },
        },
        {
            name: 'socialhub_test_tracking',
            description: 'Test a tracking integration connection',
            inputSchema: {
                type: 'object',
                properties: {
                    integrationId: { type: 'number' },
                },
                required: ['integrationId'],
            },
        },
        {
            name: 'socialhub_delete_tracking',
            description: 'Delete a tracking integration',
            inputSchema: {
                type: 'object',
                properties: {
                    integrationId: { type: 'number' },
                },
                required: ['integrationId'],
            },
        },
        {
            name: 'socialhub_get_tracking_events',
            description: 'Get recent tracking events',
            inputSchema: {
                type: 'object',
                properties: {
                    integration_id: { type: 'number' },
                    limit: { type: 'number', default: 100 },
                },
            },
        },
        {
            name: 'socialhub_get_tracking_stats',
            description: 'Get tracking statistics',
            inputSchema: {
                type: 'object',
                properties: {
                    days: { type: 'number', default: 7 },
                },
            },
        },
        // Websites
        {
            name: 'socialhub_list_websites',
            description: 'List all connected websites',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'socialhub_add_website',
            description: 'Add a website',
            inputSchema: {
                type: 'object',
                properties: {
                    url: { type: 'string', format: 'uri' },
                    name: { type: 'string' },
                },
                required: ['url'],
            },
        },
        {
            name: 'socialhub_verify_website',
            description: 'Verify website ownership',
            inputSchema: {
                type: 'object',
                properties: {
                    websiteId: { type: 'number' },
                },
                required: ['websiteId'],
            },
        },
        {
            name: 'socialhub_scan_website',
            description: 'Scan website for analytics',
            inputSchema: {
                type: 'object',
                properties: {
                    websiteId: { type: 'number' },
                },
                required: ['websiteId'],
            },
        },
        // AI Agent
        {
            name: 'socialhub_list_ai_agents',
            description: 'List all AI agents',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'socialhub_create_ai_agent',
            description: 'Create a new AI agent',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    config: {
                        type: 'object',
                        properties: {
                            tone: { type: 'string', enum: ['professional', 'casual', 'friendly', 'witty', 'authoritative'] },
                            language: { type: 'string' },
                            autoReply: { type: 'boolean' },
                            contentGeneration: { type: 'boolean' },
                        },
                        required: ['tone'],
                    },
                },
                required: ['name', 'config'],
            },
        },
        {
            name: 'socialhub_generate_content',
            description: 'Generate social media content with AI',
            inputSchema: {
                type: 'object',
                properties: {
                    topic: { type: 'string' },
                    tone: { type: 'string' },
                    platform: { type: 'string' },
                },
                required: ['topic', 'tone', 'platform'],
            },
        },
        {
            name: 'socialhub_ai_reply',
            description: 'Generate AI reply for comment/chat',
            inputSchema: {
                type: 'object',
                properties: {
                    comment: { type: 'string' },
                    context: { type: 'string' },
                    agentId: { type: 'number' },
                },
                required: ['comment'],
            },
        },
        {
            name: 'socialhub_ai_suggestions',
            description: 'Get AI content suggestions',
            inputSchema: {
                type: 'object',
                properties: {
                    platform: { type: 'string' },
                    topic: { type: 'string' },
                    targetAudience: { type: 'string' },
                },
                required: ['platform', 'topic'],
            },
        },
        // Campaigns
        {
            name: 'socialhub_list_campaigns',
            description: 'List all campaigns',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'socialhub_get_campaign',
            description: 'Get a single campaign by ID',
            inputSchema: {
                type: 'object',
                properties: {
                    campaignId: { type: 'number' },
                },
                required: ['campaignId'],
            },
        },
        {
            name: 'socialhub_create_campaign',
            description: 'Create a new campaign',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    objective: { type: 'string' },
                    platform: { type: 'string' },
                    budget: { type: 'number' },
                    start_date: { type: 'string', format: 'date' },
                    end_date: { type: 'string', format: 'date' },
                    audience: { type: 'string' },
                    creative: { type: 'string' },
                    copy: { type: 'string' },
                    landing_page: { type: 'string' },
                    tracking: { type: 'string' },
                    notes: { type: 'string' },
                },
                required: ['name'],
            },
        },
        {
            name: 'socialhub_update_campaign',
            description: 'Update a campaign',
            inputSchema: {
                type: 'object',
                properties: {
                    campaignId: { type: 'number' },
                    name: { type: 'string' },
                    objective: { type: 'string' },
                    platform: { type: 'string' },
                    budget: { type: 'number' },
                    start_date: { type: 'string', format: 'date' },
                    end_date: { type: 'string', format: 'date' },
                    audience: { type: 'string' },
                    creative: { type: 'string' },
                    copy: { type: 'string' },
                    landing_page: { type: 'string' },
                    tracking: { type: 'string' },
                    notes: { type: 'string' },
                    status: { type: 'string', enum: ['draft', 'planned', 'active', 'paused', 'completed', 'archived'] },
                },
                required: ['campaignId'],
            },
        },
        {
            name: 'socialhub_delete_campaign',
            description: 'Delete a campaign',
            inputSchema: {
                type: 'object',
                properties: {
                    campaignId: { type: 'number' },
                },
                required: ['campaignId'],
            },
        },
        {
            name: 'socialhub_get_campaign_metrics',
            description: 'Get campaign metrics',
            inputSchema: {
                type: 'object',
                properties: {
                    campaignId: { type: 'number' },
                },
                required: ['campaignId'],
            },
        },
        {
            name: 'socialhub_add_campaign_metrics',
            description: 'Add or update campaign metrics for a date',
            inputSchema: {
                type: 'object',
                properties: {
                    campaignId: { type: 'number' },
                    date: { type: 'string', format: 'date' },
                    spend: { type: 'number' },
                    reach: { type: 'number' },
                    impressions: { type: 'number' },
                    clicks: { type: 'number' },
                    ctr: { type: 'number' },
                    cpc: { type: 'number' },
                    cpm: { type: 'number' },
                    leads: { type: 'number' },
                    conversions: { type: 'number' },
                    cost_per_conversion: { type: 'number' },
                    revenue: { type: 'number' },
                    roas: { type: 'number' },
                },
                required: ['campaignId', 'date'],
            },
        },
        // Content Ideas
        {
            name: 'socialhub_list_content',
            description: 'List all content ideas',
            inputSchema: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['idea', 'draft', 'ready', 'scheduled', 'published'] },
                    platform: { type: 'string' },
                },
            },
        },
        {
            name: 'socialhub_get_content',
            description: 'Get a single content idea by ID',
            inputSchema: {
                type: 'object',
                properties: {
                    contentId: { type: 'number' },
                },
                required: ['contentId'],
            },
        },
        {
            name: 'socialhub_create_content',
            description: 'Create a new content idea',
            inputSchema: {
                type: 'object',
                properties: {
                    platform: { type: 'string' },
                    content_type: { type: 'string' },
                    topic: { type: 'string' },
                    hook: { type: 'string' },
                    format: { type: 'string' },
                    caption: { type: 'string' },
                    creative: { type: 'string' },
                    cta: { type: 'string' },
                    status: { type: 'string', enum: ['idea', 'draft', 'ready', 'scheduled', 'published'] },
                    scheduled_date: { type: 'string', format: 'date-time' },
                    notes: { type: 'string' },
                    ai_generated: { type: 'boolean' },
                },
            },
        },
        {
            name: 'socialhub_update_content',
            description: 'Update a content idea',
            inputSchema: {
                type: 'object',
                properties: {
                    contentId: { type: 'number' },
                    platform: { type: 'string' },
                    content_type: { type: 'string' },
                    topic: { type: 'string' },
                    hook: { type: 'string' },
                    format: { type: 'string' },
                    caption: { type: 'string' },
                    creative: { type: 'string' },
                    cta: { type: 'string' },
                    status: { type: 'string', enum: ['idea', 'draft', 'ready', 'scheduled', 'published'] },
                    scheduled_date: { type: 'string', format: 'date-time' },
                    notes: { type: 'string' },
                    ai_generated: { type: 'boolean' },
                },
                required: ['contentId'],
            },
        },
        {
            name: 'socialhub_delete_content',
            description: 'Delete a content idea',
            inputSchema: {
                type: 'object',
                properties: {
                    contentId: { type: 'number' },
                },
                required: ['contentId'],
            },
        },
        {
            name: 'socialhub_bulk_update_content_status',
            description: 'Bulk update content ideas status',
            inputSchema: {
                type: 'object',
                properties: {
                    ids: { type: 'array', items: { type: 'number' } },
                    status: { type: 'string', enum: ['idea', 'draft', 'ready', 'scheduled', 'published'] },
                },
                required: ['ids', 'status'],
            },
        },
        // Leads
        {
            name: 'socialhub_list_leads',
            description: 'List all leads',
            inputSchema: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'closed', 'lost'] },
                },
            },
        },
        {
            name: 'socialhub_create_lead',
            description: 'Create a new lead',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    platform: { type: 'string' },
                    message: { type: 'string' },
                    property_id: { type: 'number' },
                    status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'closed', 'lost'] },
                    notes: { type: 'string' },
                },
                required: ['name'],
            },
        },
        // Comments/Inbox
        {
            name: 'socialhub_list_comments',
            description: 'List all comments (unified inbox)',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'socialhub_reply_comment',
            description: 'Reply to a comment',
            inputSchema: {
                type: 'object',
                properties: {
                    commentId: { type: 'number' },
                    reply: { type: 'string' },
                },
                required: ['commentId', 'reply'],
            },
        },
    ],
}));
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = args ?? {};
    try {
        let result;
        switch (name) {
            // Auth & Workspace
            case 'socialhub_login': {
                result = await socialHub.post('/auth/login', a);
                break;
            }
            case 'socialhub_get_workspace': {
                result = await socialHub.get('/workspace/current');
                break;
            }
            case 'socialhub_update_workspace': {
                result = await socialHub.put('/workspace/current', a);
                break;
            }
            // Social Accounts
            case 'socialhub_list_accounts': {
                result = await socialHub.get('/social/accounts');
                break;
            }
            case 'socialhub_connect_account': {
                result = await socialHub.get(`/social/${a.platform}/auth`);
                break;
            }
            case 'socialhub_disconnect_account': {
                result = await socialHub.delete(`/social/accounts/${a.accountId}`);
                break;
            }
            // Posts
            case 'socialhub_list_posts': {
                result = await socialHub.get('/posts');
                break;
            }
            case 'socialhub_create_post': {
                result = await socialHub.post('/posts', a);
                break;
            }
            case 'socialhub_delete_post': {
                result = await socialHub.delete(`/posts/${a.postId}`);
                break;
            }
            // Analytics
            case 'socialhub_get_analytics': {
                result = await socialHub.get('/analytics', { period: a.period || '30' });
                break;
            }
            // Tracking
            case 'socialhub_list_tracking': {
                result = await socialHub.get('/tracking/integrations');
                break;
            }
            case 'socialhub_add_tracking': {
                result = await socialHub.post('/tracking/integrations', a);
                break;
            }
            case 'socialhub_test_tracking': {
                result = await socialHub.post(`/tracking/integrations/${a.integrationId}/test`);
                break;
            }
            case 'socialhub_delete_tracking': {
                result = await socialHub.delete(`/tracking/integrations/${a.integrationId}`);
                break;
            }
            case 'socialhub_get_tracking_events': {
                result = await socialHub.get('/tracking/events', {
                    integration_id: a.integration_id,
                    limit: a.limit || 100
                });
                break;
            }
            case 'socialhub_get_tracking_stats': {
                result = await socialHub.get('/tracking/events/stats', { days: a.days || 7 });
                break;
            }
            // Websites
            case 'socialhub_list_websites': {
                result = await socialHub.get('/websites');
                break;
            }
            case 'socialhub_add_website': {
                result = await socialHub.post('/websites', a);
                break;
            }
            case 'socialhub_verify_website': {
                result = await socialHub.post(`/websites/${a.websiteId}/verify`);
                break;
            }
            case 'socialhub_scan_website': {
                result = await socialHub.post(`/websites/${a.websiteId}/scan`);
                break;
            }
            // AI Agent
            case 'socialhub_list_ai_agents': {
                result = await socialHub.get('/ai/agents');
                break;
            }
            case 'socialhub_create_ai_agent': {
                result = await socialHub.post('/ai/agents', a);
                break;
            }
            case 'socialhub_generate_content': {
                result = await socialHub.post('/ai/generate-content', a);
                break;
            }
            case 'socialhub_ai_reply': {
                result = await socialHub.post('/ai/reply-comment', a);
                break;
            }
            case 'socialhub_ai_suggestions': {
                result = await socialHub.post('/ai/suggestions', a);
                break;
            }
            // Campaigns
            case 'socialhub_list_campaigns': {
                result = await socialHub.get('/campaigns');
                break;
            }
            case 'socialhub_get_campaign': {
                result = await socialHub.get(`/campaigns/${a.campaignId}`);
                break;
            }
            case 'socialhub_create_campaign': {
                result = await socialHub.post('/campaigns', a);
                break;
            }
            case 'socialhub_update_campaign': {
                const { campaignId, ...data } = a;
                result = await socialHub.put(`/campaigns/${campaignId}`, data);
                break;
            }
            case 'socialhub_delete_campaign': {
                result = await socialHub.delete(`/campaigns/${a.campaignId}`);
                break;
            }
            case 'socialhub_get_campaign_metrics': {
                result = await socialHub.get(`/campaigns/${a.campaignId}/metrics`);
                break;
            }
            case 'socialhub_add_campaign_metrics': {
                const { campaignId, ...data } = a;
                result = await socialHub.post(`/campaigns/${campaignId}/metrics`, data);
                break;
            }
            // Content Ideas
            case 'socialhub_list_content': {
                result = await socialHub.get('/content', { status: a.status, platform: a.platform });
                break;
            }
            case 'socialhub_get_content': {
                result = await socialHub.get(`/content/${a.contentId}`);
                break;
            }
            case 'socialhub_create_content': {
                result = await socialHub.post('/content', a);
                break;
            }
            case 'socialhub_update_content': {
                const { contentId, ...data } = a;
                result = await socialHub.put(`/content/${contentId}`, data);
                break;
            }
            case 'socialhub_delete_content': {
                result = await socialHub.delete(`/content/${a.contentId}`);
                break;
            }
            case 'socialhub_bulk_update_content_status': {
                result = await socialHub.patch('/content/bulk/status', a);
                break;
            }
            // Leads
            case 'socialhub_list_leads': {
                result = await socialHub.get('/leads', { status: a.status });
                break;
            }
            case 'socialhub_create_lead': {
                result = await socialHub.post('/leads', a);
                break;
            }
            // Comments
            case 'socialhub_list_comments': {
                result = await socialHub.get('/social/inbox');
                break;
            }
            case 'socialhub_reply_comment': {
                result = await socialHub.post('/social/comments/reply', a);
                break;
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
    }
    catch (error) {
        return {
            content: [{ type: 'text', text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});
server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => ({
    resources: [
        { uri: 'socialhub://workspace', name: 'Current Workspace', mimeType: 'application/json' },
        { uri: 'socialhub://accounts', name: 'Social Accounts', mimeType: 'application/json' },
        { uri: 'socialhub://posts', name: 'Posts', mimeType: 'application/json' },
        { uri: 'socialhub://analytics', name: 'Analytics', mimeType: 'application/json' },
        { uri: 'socialhub://tracking', name: 'Tracking Integrations', mimeType: 'application/json' },
        { uri: 'socialhub://websites', name: 'Websites', mimeType: 'application/json' },
        { uri: 'socialhub://ai-agents', name: 'AI Agents', mimeType: 'application/json' },
        { uri: 'socialhub://campaigns', name: 'Campaigns', mimeType: 'application/json' },
        { uri: 'socialhub://content', name: 'Content Ideas', mimeType: 'application/json' },
        { uri: 'socialhub://leads', name: 'Leads', mimeType: 'application/json' },
        { uri: 'socialhub://inbox', name: 'Unified Inbox', mimeType: 'application/json' },
    ],
}));
server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    let data;
    try {
        switch (uri) {
            case 'socialhub://workspace':
                data = await socialHub.get('/workspace/current');
                break;
            case 'socialhub://accounts':
                data = await socialHub.get('/social/accounts');
                break;
            case 'socialhub://posts':
                data = await socialHub.get('/posts');
                break;
            case 'socialhub://analytics':
                data = await socialHub.get('/analytics');
                break;
            case 'socialhub://tracking':
                data = await socialHub.get('/tracking/integrations');
                break;
            case 'socialhub://websites':
                data = await socialHub.get('/websites');
                break;
            case 'socialhub://ai-agents':
                data = await socialHub.get('/ai/agents');
                break;
            case 'socialhub://campaigns':
                data = await socialHub.get('/campaigns');
                break;
            case 'socialhub://content':
                data = await socialHub.get('/content');
                break;
            case 'socialhub://leads':
                data = await socialHub.get('/leads');
                break;
            case 'socialhub://inbox':
                data = await socialHub.get('/social/inbox');
                break;
            default:
                throw new Error(`Unknown resource: ${uri}`);
        }
        return {
            contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }],
        };
    }
    catch (error) {
        return {
            contents: [{ uri, mimeType: 'text/plain', text: `Error: ${error.message}` }],
        };
    }
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('SocialHub MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
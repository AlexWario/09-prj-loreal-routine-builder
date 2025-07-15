# Cloudflare Worker Deployment Guide

## 📋 Prerequisites

1. **Cloudflare Account**: Sign up at https://dash.cloudflare.com
2. **OpenAI API Key**: Get from https://platform.openai.com/api-keys
3. **Bing Search API Key** (Optional): Get from Azure Cognitive Services
4. **Wrangler CLI**: Install with `npm install -g wrangler`

## 🚀 Deployment Steps

### 1. Setup Cloudflare Worker

```bash
# Login to Cloudflare
wrangler login

# Create new worker project
wrangler init loreal-routine-builder-api

# Copy the cloudflare-worker.js content to src/index.js
```

### 2. Configure wrangler.toml

```toml
name = "loreal-routine-builder-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

[env.production]
name = "loreal-routine-builder-api"

# Add environment variables
[[env.production.vars]]
ENVIRONMENT = "production"
```

### 3. Set Environment Variables

```bash
# Set OpenAI API Key (required)
wrangler secret put OPENAI_API_KEY

# Set Bing Search API Key (optional, for real web search)
wrangler secret put BING_SEARCH_API_KEY
```

### 4. Deploy Worker

```bash
# Deploy to Cloudflare
wrangler deploy

# Your worker will be available at:
# https://loreal-routine-builder-api.your-subdomain.workers.dev
```

### 5. Update Client Code

1. Copy `worker-client.js` functions to your `script.js`
2. Update the `WORKER_URL` variable with your worker URL
3. Replace the existing `callOpenAI` function

```javascript
// Update this line in worker-client.js
const WORKER_URL =
  "https://loreal-routine-builder-api.your-subdomain.workers.dev";
```

## 🔧 Configuration Options

### Environment Variables

| Variable              | Required | Description                         |
| --------------------- | -------- | ----------------------------------- |
| `OPENAI_API_KEY`      | Yes      | Your OpenAI API key                 |
| `BING_SEARCH_API_KEY` | No       | Bing Search API for real web search |

### API Endpoints

| Endpoint      | Method | Description                                      |
| ------------- | ------ | ------------------------------------------------ |
| `/api/chat`   | POST   | OpenAI chat completions with optional web search |
| `/api/search` | POST   | Direct web search                                |
| `/health`     | GET    | Health check                                     |

## 🔒 Security Features

- ✅ **API Key Security**: Keys stored securely in Cloudflare
- ✅ **CORS Support**: Proper CORS headers for browser requests
- ✅ **Rate Limiting**: Basic rate limiting implementation
- ✅ **Error Handling**: Comprehensive error management

## 📱 Client Integration

### Replace OpenAI Function

```javascript
// OLD (direct API call)
const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify({...})
});

// NEW (via Cloudflare Worker)
const response = await fetch(`${WORKER_URL}/api/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: messages,
    enableWebSearch: true,
    userQuery: userPrompt
  })
});
```

### Initialize Worker Connection

```javascript
document.addEventListener("DOMContentLoaded", async function () {
  // ... existing code ...

  // Initialize worker connection
  await initializeWorker();
});
```

## 🌐 Web Search Configuration

### Option 1: Bing Search API (Recommended)

1. Go to https://azure.microsoft.com/en-us/services/cognitive-services/bing-web-search-api/
2. Create a new resource
3. Get your API key
4. Set as `BING_SEARCH_API_KEY` environment variable

### Option 2: Google Custom Search

Modify the `performWebSearch` function in `cloudflare-worker.js` to use Google Custom Search API:

```javascript
// Replace Bing API section with Google Custom Search
const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${
  env.GOOGLE_API_KEY
}&cx=${env.SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}`;
```

### Option 3: Use Fallback (No API Required)

The worker includes intelligent fallback responses when no search API is configured.

## 📊 Monitoring & Analytics

### Cloudflare Analytics

- View requests, errors, and performance in Cloudflare dashboard
- Monitor API usage and costs
- Set up alerts for errors or high usage

### Custom Logging

```javascript
// Add to worker for custom logging
console.log("Chat request:", {
  userQuery,
  timestamp: new Date().toISOString(),
});
```

## 🚀 Advanced Features

### Custom Domain

```bash
# Add custom domain in Cloudflare dashboard
# Update WORKER_URL to your custom domain
const WORKER_URL = 'https://api.your-domain.com';
```

### Caching

```javascript
// Add caching for frequent requests
const cache = caches.default;
const cacheKey = new Request(url.toString(), request);
let response = await cache.match(cacheKey);

if (!response) {
  response = await handleRequest();
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
}
```

### Authentication

```javascript
// Add API key authentication
const apiKey = request.headers.get("X-API-Key");
if (apiKey !== env.CLIENT_API_KEY) {
  return new Response("Unauthorized", { status: 401 });
}
```

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS headers are properly set
2. **API Key Issues**: Verify environment variables are set correctly
3. **Rate Limiting**: Implement proper rate limiting for production
4. **Timeout Errors**: OpenAI calls may timeout; implement retry logic

### Testing

```bash
# Test worker locally
wrangler dev

# Test endpoints
curl https://your-worker.workers.dev/health
curl -X POST https://your-worker.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

## 💰 Cost Considerations

- **Cloudflare Workers**: Free tier includes 100,000 requests/day
- **OpenAI API**: Pay per token usage
- **Bing Search API**: Free tier includes 1,000 searches/month
- **Total Cost**: Typically under $10/month for moderate usage

## 🎯 Benefits

✅ **Security**: API keys never exposed to client  
✅ **Performance**: Edge computing for faster responses  
✅ **Scalability**: Handles traffic spikes automatically  
✅ **Reliability**: Built-in redundancy and failover  
✅ **Cost-Effective**: Pay only for what you use  
✅ **Global**: Fast responses worldwide

Your L'Oréal routine builder is now enterprise-ready! 🌟

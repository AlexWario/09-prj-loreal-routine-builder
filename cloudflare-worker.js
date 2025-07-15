/**
 * Cloudflare Worker for L'Oréal Routine Builder
 * Handles OpenAI API calls with web search capabilities
 * Keeps API keys secure and provides CORS support
 */

// Environment variables (set these in Cloudflare Worker settings)
// OPENAI_API_KEY - Your OpenAI API key
// BING_SEARCH_API_KEY - Your Bing Search API key (optional)

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return handleCORS();
    }

    const url = new URL(request.url);

    // Route requests
    if (url.pathname === "/api/chat") {
      return handleChatRequest(request, env);
    } else if (url.pathname === "/api/search") {
      return handleSearchRequest(request, env);
    } else if (url.pathname === "/health") {
      return new Response("OK", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  },
};

/**
 * Handle CORS preflight and add headers
 */
function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/**
 * Add CORS headers to response
 */
function addCORSHeaders(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

/**
 * Handle chat requests to OpenAI
 */
async function handleChatRequest(request, env) {
  try {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Check if OpenAI API key is available
    if (!env.OPENAI_API_KEY) {
      return addCORSHeaders(
        new Response(
          JSON.stringify({ error: "OpenAI API key not configured" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    const body = await request.json();
    const { messages, enableWebSearch = false, userQuery = "" } = body;

    let enhancedMessages = [...messages];

    // If web search is enabled, perform search and add results
    if (enableWebSearch && userQuery) {
      try {
        const searchResults = await performWebSearch(userQuery, env);

        // Add search results as a system message
        enhancedMessages.push({
          role: "system",
          content: `Current web search results for "${userQuery}":\n\n${searchResults}\n\nPlease incorporate this current information into your response and cite sources when applicable.`,
        });
      } catch (searchError) {
        console.error("Web search failed:", searchError);
        // Continue without search results
      }
    }

    // Call OpenAI API
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: enhancedMessages,
          max_tokens: 1500,
          temperature: 0.7,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || "Unknown error"}`
      );
    }

    const data = await openaiResponse.json();

    return addCORSHeaders(
      new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      })
    );
  } catch (error) {
    console.error("Chat request error:", error);
    return addCORSHeaders(
      new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
  }
}

/**
 * Handle direct search requests
 */
async function handleSearchRequest(request, env) {
  try {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { query } = await request.json();

    if (!query) {
      return addCORSHeaders(
        new Response(JSON.stringify({ error: "Query parameter required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    const searchResults = await performWebSearch(query, env);

    return addCORSHeaders(
      new Response(JSON.stringify({ results: searchResults }), {
        headers: { "Content-Type": "application/json" },
      })
    );
  } catch (error) {
    console.error("Search request error:", error);
    return addCORSHeaders(
      new Response(
        JSON.stringify({
          error: "Search failed",
          message: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
  }
}

/**
 * Perform web search using Bing Search API
 */
async function performWebSearch(query, env) {
  // If Bing API key is available, use real search
  if (env.BING_SEARCH_API_KEY) {
    try {
      const searchQuery = `L'Oréal ${query} beauty skincare cosmetics`;
      const searchUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(
        searchQuery
      )}&count=5&mkt=en-US`;

      const response = await fetch(searchUrl, {
        headers: {
          "Ocp-Apim-Subscription-Key": env.BING_SEARCH_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Bing API error: ${response.status}`);
      }

      const data = await response.json();

      // Format search results
      let formattedResults = `🔍 **Current search results for "${query}":**\n\n`;

      if (data.webPages && data.webPages.value) {
        data.webPages.value.slice(0, 3).forEach((result, index) => {
          formattedResults += `${index + 1}. **${result.name}**\n`;
          formattedResults += `   ${result.snippet}\n`;
          formattedResults += `   🔗 Source: ${result.url}\n\n`;
        });
      }

      return formattedResults;
    } catch (error) {
      console.error("Bing search error:", error);
      return getFallbackSearchResults(query);
    }
  } else {
    // Use fallback search results
    return getFallbackSearchResults(query);
  }
}

/**
 * Fallback search results when no API is available
 */
function getFallbackSearchResults(query) {
  const currentDate = new Date().toLocaleDateString();

  return `🔍 **Simulated search results for "${query}" (${currentDate}):**

1. **L'Oréal Official Product Information**
   Current L'Oréal products continue to innovate with advanced formulations including hyaluronic acid, retinol, and vitamin C technologies. Recent launches focus on sustainable packaging and clean beauty ingredients.
   🔗 Source: https://www.loreal.com

2. **Beauty Industry Trends 2025**
   Latest trends include personalized skincare routines, K-beauty influences, and emphasis on barrier repair ingredients. L'Oréal's Revitalift and Youth Code lines remain top-rated by dermatologists.
   🔗 Source: Beauty industry reports

3. **Current Product Reviews**
   Recent consumer reviews highlight the effectiveness of L'Oréal's anti-aging serums and moisturizers. Key ingredients like niacinamide and ceramides show proven results in clinical studies.
   🔗 Source: Beauty review platforms

4. **Professional Recommendations**
   Dermatologists recommend L'Oréal products for their evidence-based formulations and accessibility. Current focus on barrier repair and gentle active ingredients.
   🔗 Source: Dermatology associations

*Note: For real-time search results, configure BING_SEARCH_API_KEY in your Cloudflare Worker environment variables.*`;
}

/**
 * Rate limiting (basic implementation)
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  isRateLimited(ip) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 30; // 30 requests per minute

    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }

    const requests = this.requests.get(ip);
    const recentRequests = requests.filter((time) => now - time < windowMs);

    this.requests.set(ip, recentRequests);

    if (recentRequests.length >= maxRequests) {
      return true;
    }

    recentRequests.push(now);
    return false;
  }
}

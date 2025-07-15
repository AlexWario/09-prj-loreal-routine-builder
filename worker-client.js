/**
 * Client-side API functions for Cloudflare Worker integration
 * Replace the OpenAI functions in script.js with these
 */

// Your Cloudflare Worker URL
const WORKER_URL = "https://kingvon.alexwario127.workers.dev";

/* Call Cloudflare Worker instead of OpenAI directly */
async function callOpenAI(
  systemPrompt,
  userPrompt,
  includeHistory = false,
  enableWebSearch = false
) {
  try {
    // Build messages array
    let messages = [];

    // Add system prompt with web search instruction if enabled
    if (systemPrompt) {
      let enhancedSystemPrompt = systemPrompt;
      if (enableWebSearch) {
        enhancedSystemPrompt +=
          "\n\nIMPORTANT: When discussing L'Oréal products, beauty trends, or skincare advice, please search for current information and include recent findings, product launches, reviews, or trends. Always cite your sources with links when providing current information.";
      }
      messages.push({ role: "system", content: enhancedSystemPrompt });
    }

    // Include conversation history if requested
    if (includeHistory && conversationHistory.length > 0) {
      messages = messages.concat(conversationHistory);
    }

    // Add current user prompt
    messages.push({ role: "user", content: userPrompt });

    // Call Cloudflare Worker
    const response = await fetch(`${WORKER_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
        enableWebSearch: enableWebSearch,
        userQuery: userPrompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Worker API error: ${errorData.error || "Unknown error"}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "API Error");
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Worker API error:", error);

    // Fallback to basic response if worker fails
    if (enableWebSearch) {
      return `I'm having trouble accessing current information right now, but I can still help with general L'Oréal beauty advice! 

For the latest product information and reviews, I recommend:
• Visiting the official L'Oréal website: https://www.loreal.com
• Checking recent beauty publications and reviews
• Consulting with a dermatologist for personalized advice

How else can I help you with your beauty routine?`;
    } else {
      throw error; // Re-throw non-search errors
    }
  }
}

/* Direct web search function (optional) */
async function performDirectWebSearch(query) {
  try {
    const response = await fetch(`${WORKER_URL}/api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Direct search error:", error);
    return `Unable to perform web search at this time. Please try again later.`;
  }
}

/* Health check function to verify worker is running */
async function checkWorkerHealth() {
  try {
    const response = await fetch(`${WORKER_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error("Worker health check failed:", error);
    return false;
  }
}

/* Initialize worker connection */
async function initializeWorker() {
  const isHealthy = await checkWorkerHealth();

  if (isHealthy) {
    console.log("✅ Cloudflare Worker is running");

    // Show status in chat if worker is available
    setTimeout(() => {
      addMessageToChat(
        "system",
        "🌐 Connected to cloud AI service with web search capabilities!"
      );
    }, 2000);
  } else {
    console.warn("⚠️ Cloudflare Worker unavailable, using fallback mode");

    // Show fallback message
    setTimeout(() => {
      addMessageToChat(
        "system",
        "⚠️ Running in offline mode. Some features may be limited."
      );
    }, 2000);
  }

  return isHealthy;
}

/*
 * Instructions for integration:
 *
 * 1. Replace the existing callOpenAI function in script.js with the one above
 * 2. Update WORKER_URL with your actual Cloudflare Worker URL
 * 3. Add initializeWorker() call to your DOMContentLoaded event
 * 4. Deploy the cloudflare-worker.js to Cloudflare Workers
 * 5. Set environment variables in Cloudflare Workers dashboard:
 *    - OPENAI_API_KEY: Your OpenAI API key
 *    - BING_SEARCH_API_KEY: Your Bing Search API key (optional)
 */

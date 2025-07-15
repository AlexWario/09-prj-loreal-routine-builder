/**
 * Test script for Cloudflare Worker endpoints
 * Run this in the browser console to test your worker
 */

const WORKER_URL = "https://kingvon.alexwario127.workers.dev";

async function testWorkerHealth() {
  try {
    console.log("🔍 Testing worker health endpoint...");
    const response = await fetch(`${WORKER_URL}/health`);
    const text = await response.text();
    console.log("✅ Health response:", text);
    return response.ok;
  } catch (error) {
    console.error("❌ Health test failed:", error);
    return false;
  }
}

async function testWorkerChat() {
  try {
    console.log("🔍 Testing worker chat endpoint...");
    const response = await fetch(`${WORKER_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a helpful L'Oréal beauty assistant.",
          },
          {
            role: "user",
            content: "Hello, can you help me with skincare?",
          },
        ],
        enableWebSearch: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Chat endpoint error:", response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log("✅ Chat response:", data);
    return true;
  } catch (error) {
    console.error("❌ Chat test failed:", error);
    return false;
  }
}

async function testWorker() {
  console.log("🚀 Testing Cloudflare Worker:", WORKER_URL);

  const healthOk = await testWorkerHealth();

  if (healthOk) {
    await testWorkerChat();
  } else {
    console.log("⚠️  Worker may not be deployed with the correct code yet");
    console.log(
      "📝 Please make sure you've deployed the cloudflare-worker.js code to your worker"
    );
  }
}

// Run the test
testWorker();

/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const productSearch = document.getElementById("productSearch");
const clearSearchBtn = document.getElementById("clearSearch");
const languageToggle = document.getElementById("languageToggle");

/* Global variables for managing selected products and filters */
let allProducts = [];
let selectedProducts = [];
let conversationHistory = [];
let generatedRoutine = null;
let currentCategory = "";
let currentSearchTerm = "";
let isRTL = false;

/* LocalStorage keys */
const STORAGE_KEYS = {
  SELECTED_PRODUCTS: "loreal_selected_products",
  CONVERSATION_HISTORY: "loreal_conversation_history",
  GENERATED_ROUTINE: "loreal_generated_routine",
};

/* Save selected products to localStorage */
function saveSelectedProducts() {
  try {
    localStorage.setItem(
      STORAGE_KEYS.SELECTED_PRODUCTS,
      JSON.stringify(selectedProducts)
    );
  } catch (error) {
    console.warn("Could not save selected products to localStorage:", error);
  }
}

/* Load selected products from localStorage */
function loadSelectedProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_PRODUCTS);
    if (saved) {
      selectedProducts = JSON.parse(saved);
      console.log(
        `Loaded ${selectedProducts.length} products from localStorage`
      );
    }
  } catch (error) {
    console.warn("Could not load selected products from localStorage:", error);
    selectedProducts = [];
  }
}

/* Save conversation history to localStorage */
function saveConversationData() {
  try {
    localStorage.setItem(
      STORAGE_KEYS.CONVERSATION_HISTORY,
      JSON.stringify(conversationHistory)
    );
    localStorage.setItem(STORAGE_KEYS.GENERATED_ROUTINE, generatedRoutine);
  } catch (error) {
    console.warn("Could not save conversation data to localStorage:", error);
  }
}

/* Load conversation history from localStorage */
function loadConversationData() {
  try {
    const savedHistory = localStorage.getItem(
      STORAGE_KEYS.CONVERSATION_HISTORY
    );
    const savedRoutine = localStorage.getItem(STORAGE_KEYS.GENERATED_ROUTINE);

    if (savedHistory) {
      conversationHistory = JSON.parse(savedHistory);
    }
    if (savedRoutine && savedRoutine !== "null") {
      generatedRoutine = savedRoutine;
    }
  } catch (error) {
    console.warn("Could not load conversation data from localStorage:", error);
    conversationHistory = [];
    generatedRoutine = null;
  }
}

/* Clear all stored data */
function clearAllStoredData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.SELECTED_PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CONVERSATION_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.GENERATED_ROUTINE);
    console.log("Cleared all stored data");
  } catch (error) {
    console.warn("Could not clear stored data:", error);
  }
}

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    ✨ Select a category above to discover amazing L'Oréal products
  </div>
`;

/* Update the selected products display */
function updateSelectedProductsDisplay() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <div class="empty-selection">
        <p>No products selected yet. Click on products above to add them to your routine! 💄</p>
      </div>
    `;
    return;
  }

  const clearAllButton = `
    <div class="selected-products-header">
      <span class="selected-count">${selectedProducts.length} product${
    selectedProducts.length !== 1 ? "s" : ""
  } selected</span>
      <button class="clear-all-btn" onclick="clearAllSelections()" title="Clear all selections">
        <i class="fa-solid fa-trash"></i> Clear All
      </button>
    </div>
  `;

  const productsHtml = selectedProducts
    .map(
      (product) => `
      <div class="selected-product-item" data-product-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <div class="selected-product-info">
          <h4>${product.name}</h4>
          <p>${product.brand}</p>
        </div>
        <button class="remove-product-btn" onclick="removeFromSelection(${product.id})" title="Remove from selection">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `
    )
    .join("");

  selectedProductsList.innerHTML = clearAllButton + productsHtml;
}

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products; // Store all products globally
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      const isSelected = selectedProducts.some((p) => p.id === product.id);
      return `
    <div class="product-card ${
      isSelected ? "selected" : ""
    }" data-product-id="${product.id}" onclick="toggleProductSelection(${
        product.id
      })">
      <img src="${product.image}" alt="${product.name}" loading="lazy">
      <div class="product-info" data-brand="${product.brand}">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button class="show-description-btn" onclick="toggleDescription(event, ${
          product.id
        })" title="Show description">
          <i class="fa-solid fa-info-circle"></i>
        </button>
      </div>
      <div class="product-description" id="desc-${product.id}">
        <p>${product.description}</p>
        <button class="close-description-btn" onclick="hideDescription(${
          product.id
        })">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <div class="selection-indicator">
        <i class="fa-solid fa-check"></i>
      </div>
    </div>
  `;
    })
    .join("");
}

/* Handle product selection toggle */
function toggleProductSelection(productId) {
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  const existingIndex = selectedProducts.findIndex((p) => p.id === productId);

  if (existingIndex > -1) {
    // Remove from selection
    selectedProducts.splice(existingIndex, 1);
  } else {
    // Add to selection
    selectedProducts.push(product);
  }

  // Update the visual state of the product card
  const productCard = document.querySelector(
    `[data-product-id="${productId}"]`
  );
  if (productCard) {
    productCard.classList.toggle("selected");
  }

  // Save to localStorage and update display
  saveSelectedProducts();
  updateSelectedProductsDisplay();
}

/* Remove product from selection */
function removeFromSelection(productId) {
  const index = selectedProducts.findIndex((p) => p.id === productId);
  if (index > -1) {
    selectedProducts.splice(index, 1);

    // Save to localStorage and update display
    saveSelectedProducts();
    updateSelectedProductsDisplay();

    // Update the visual state in the grid if visible
    const productCard = document.querySelector(
      `[data-product-id="${productId}"]`
    );
    if (productCard) {
      productCard.classList.remove("selected");
    }
  }
}

/* Show/hide product description */
function toggleDescription(event, productId) {
  event.stopPropagation(); // Prevent triggering product selection
  const description = document.getElementById(`desc-${productId}`);
  const btn = event.currentTarget;

  if (description.classList.contains("visible")) {
    hideDescription(productId);
  } else {
    // Hide all other descriptions first
    document
      .querySelectorAll(".product-description.visible")
      .forEach((desc) => {
        desc.classList.remove("visible");
      });

    description.classList.add("visible");
    btn.innerHTML = '<i class="fa-solid fa-times"></i>';
  }
}

/* Hide product description */
function hideDescription(productId) {
  const description = document.getElementById(`desc-${productId}`);
  const productCard = description.closest(".product-card");
  const btn = productCard.querySelector(".show-description-btn");

  description.classList.remove("visible");
  btn.innerHTML = '<i class="fa-solid fa-info-circle"></i>';
}

/* Filter products based on category and search term */
function filterProducts() {
  if (!allProducts.length) return [];

  let filteredProducts = allProducts;

  // Filter by category
  if (currentCategory) {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === currentCategory
    );
  }

  // Filter by search term
  if (currentSearchTerm) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        product.description
          .toLowerCase()
          .includes(currentSearchTerm.toLowerCase())
    );
  }

  return filteredProducts;
}

/* Display filtered products with loading state */
function displayFilteredProducts() {
  const filteredProducts = filterProducts();

  if (currentCategory || currentSearchTerm) {
    const filterText = currentCategory
      ? `${currentCategory} products`
      : `"${currentSearchTerm}"`;

    productsContainer.innerHTML = `
      <div class="placeholder-message loading">
        🔄 Loading ${filterText}...
      </div>
    `;

    setTimeout(() => {
      if (filteredProducts.length === 0) {
        productsContainer.innerHTML = `
          <div class="placeholder-message">
            😔 No products found${
              currentSearchTerm ? ` for "${currentSearchTerm}"` : ""
            }
            <br><small>Try adjusting your search or selecting a different category</small>
          </div>
        `;
      } else {
        displayProducts(filteredProducts);
      }
      updateSelectedProductsDisplay();
    }, 300);
  } else {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        ✨ Select a category above to discover amazing L'Oréal products
      </div>
    `;
  }
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  currentCategory = e.target.value;
  displayFilteredProducts();
});

/* Product search functionality */
productSearch.addEventListener("input", (e) => {
  currentSearchTerm = e.target.value.trim();

  // Show/hide clear button
  clearSearchBtn.style.display = currentSearchTerm ? "flex" : "none";

  // Only filter if we have products loaded
  if (allProducts.length > 0) {
    displayFilteredProducts();
  }
});

/* Clear search functionality */
clearSearchBtn.addEventListener("click", () => {
  productSearch.value = "";
  currentSearchTerm = "";
  clearSearchBtn.style.display = "none";

  // Refresh display
  if (allProducts.length > 0) {
    displayFilteredProducts();
  }
});

/* Chat form submission handler with OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput");
  const userMessage = userInput.value.trim();

  if (userMessage) {
    // Add user message to chat
    addMessageToChat("user", userMessage);

    // Clear input immediately for better UX
    userInput.value = "";

    // Show typing indicator
    const typingIndicator = `
      <div id="typing-indicator" style="margin-bottom: 16px; padding: 16px; background: #f8f9fa; border-radius: 12px; margin-right: 10%; border-left: 4px solid #ff003b;">
        <strong>L'Oréal AI:</strong> <i class="fa-solid fa-ellipsis"></i> Thinking...
      </div>
    `;
    chatWindow.innerHTML += typingIndicator;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
      // Determine the context for the AI
      let systemPrompt;
      let includeHistory = false;

      if (generatedRoutine) {
        // User has a generated routine, enable follow-up questions
        systemPrompt = `You are a professional beauty advisor for L'Oréal. The user has a personalized routine that you've already created. Answer questions about beauty, skincare, haircare, makeup, fragrance, and routine-related topics. Keep responses helpful, professional, and relevant to beauty and personal care. Reference their routine when relevant.`;
        includeHistory = true;
      } else {
        // No routine generated yet, general beauty advice
        systemPrompt = `You are a professional beauty advisor for L'Oréal. Provide helpful advice about beauty, skincare, haircare, makeup, fragrance, and personal care. Keep responses warm, professional, and informative. If the user asks about creating a routine, suggest they select products first and use the "Generate Routine" button.`;
      }

      // Get AI response with web search enabled
      const aiResponse = await callOpenAI(
        systemPrompt,
        userMessage,
        includeHistory,
        true // Enable web search for current information
      );

      // Remove typing indicator
      const typingElement = document.getElementById("typing-indicator");
      if (typingElement) {
        typingElement.remove();
      }

      // Add AI response to chat
      addMessageToChat("assistant", aiResponse);

      // Add to conversation history
      conversationHistory.push({ role: "user", content: userMessage });
      conversationHistory.push({ role: "assistant", content: aiResponse });

      // Limit conversation history to last 10 exchanges to prevent token overflow
      if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
      }

      // Save conversation data to localStorage
      saveConversationData();
    } catch (error) {
      console.error("Error getting AI response:", error);

      // Remove typing indicator
      const typingElement = document.getElementById("typing-indicator");
      if (typingElement) {
        typingElement.remove();
      }

      // Show error message
      addMessageToChat(
        "system",
        "Sorry, I'm having trouble responding right now. Please check your OpenAI API configuration. 🔧"
      );
    }
  }
});

/* RTL Language Toggle */
languageToggle.addEventListener("click", () => {
  isRTL = !isRTL;
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
  document.documentElement.lang = isRTL ? "ar" : "en";

  // Update button text
  const languageText = document.getElementById("languageText");
  languageText.textContent = isRTL ? "EN" : "عربي";

  // Save RTL preference
  localStorage.setItem("loreal_rtl_mode", isRTL);

  // Update chat placeholder if RTL
  updateChatPlaceholder();
});

/* Update chat input placeholder for RTL */
function updateChatPlaceholder() {
  const chatInput = document.getElementById("userInput");
  if (isRTL) {
    chatInput.placeholder =
      "💬 اسألني عن المنتجات أو الروتينات أو نصائح الجمال...";
    chatInput.style.textAlign = "right";
  } else {
    chatInput.placeholder =
      "💬 Ask me about products, routines, or beauty tips...";
    chatInput.style.textAlign = "left";
  }
}

/* Load RTL preference */
function loadRTLPreference() {
  const savedRTL = localStorage.getItem("loreal_rtl_mode");
  if (savedRTL === "true") {
    isRTL = true;
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
    document.getElementById("languageText").textContent = "EN";
    updateChatPlaceholder();
  }
}

/* Initialize the selected products display on page load */
document.addEventListener("DOMContentLoaded", function () {
  // Load saved data from localStorage
  loadSelectedProducts();
  loadConversationData();
  loadRTLPreference();

  // Update displays with loaded data
  updateSelectedProductsDisplay();

  // Add event listener for the generate routine button
  const generateRoutineBtn = document.getElementById("generateRoutine");
  if (generateRoutineBtn) {
    generateRoutineBtn.addEventListener("click", generatePersonalizedRoutine);
  }

  // Initialize chat with welcome message
  initializeChat();

  // Show a welcome back message if there are saved products
  if (selectedProducts.length > 0) {
    setTimeout(() => {
      addMessageToChat(
        "system",
        `👋 Welcome back! I found ${selectedProducts.length} product${
          selectedProducts.length !== 1 ? "s" : ""
        } in your saved selection.`
      );
    }, 1000);
  }
});

/* Initialize chat with welcome message */
function initializeChat() {
  chatWindow.innerHTML = "";
  addMessageToChat(
    "assistant",
    "👋 Welcome to your L'Oréal Beauty Advisor! I'm here to help you create the perfect beauty routine.\n\n🌟 **Here's how to get started:**\n1. Select a category above to browse products\n2. Click on products you'd like to include in your routine\n3. Use the 'Generate My Custom Routine' button to create your personalized routine\n4. Ask me any follow-up questions about beauty, skincare, or your routine!\n\nWhat would you like to know about today?"
  );
}

/* Generate personalized routine using OpenAI */
async function generatePersonalizedRoutine() {
  if (selectedProducts.length === 0) {
    addMessageToChat(
      "system",
      "Please select at least one product before generating a routine! 💄"
    );
    return;
  }

  // Show loading state
  const generateBtn = document.getElementById("generateRoutine");
  const originalText = generateBtn.innerHTML;
  generateBtn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> Generating Routine...';
  generateBtn.disabled = true;

  try {
    // Prepare the product data for the AI
    const productData = selectedProducts.map((product) => ({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
    }));

    // Create the system prompt for routine generation
    const systemPrompt = `You are a professional beauty advisor for L'Oréal. Create a personalized beauty routine using the selected products. Be specific about application order, timing, and tips. Keep your response warm, professional, and helpful.`;

    const userPrompt = `Please create a personalized routine using these L'Oréal products: ${JSON.stringify(
      productData,
      null,
      2
    )}

Please provide:
1. A step-by-step routine with proper order of application
2. Timing recommendations (morning/evening)
3. Professional tips for best results
4. Any important considerations or warnings

Format your response in a clear, easy-to-follow manner.`;

    // Call OpenAI API
    const routine = await callOpenAI(systemPrompt, userPrompt);

    // Store the generated routine for context
    generatedRoutine = routine;

    // Add the routine to conversation history
    conversationHistory.push({
      role: "system",
      content: `Generated routine for products: ${productData
        .map((p) => p.name)
        .join(", ")}`,
    });
    conversationHistory.push({
      role: "assistant",
      content: routine,
    });

    // Save conversation data to localStorage
    saveConversationData();

    // Display the routine in the chat
    addMessageToChat("assistant", routine);

    // Add follow-up prompt
    addMessageToChat(
      "system",
      "💬 Feel free to ask me any questions about your routine, skincare tips, or beauty advice!"
    );
  } catch (error) {
    console.error("Error generating routine:", error);
    addMessageToChat(
      "system",
      "Sorry, I couldn't generate your routine right now. Please make sure your OpenAI API key is configured correctly. 🔧"
    );
  } finally {
    // Restore button state
    generateBtn.innerHTML = originalText;
    generateBtn.disabled = false;
  }
}

/* Call Cloudflare Worker instead of OpenAI directly */
async function callOpenAI(
  systemPrompt,
  userPrompt,
  includeHistory = false,
  enableWebSearch = false
) {
  // Your Cloudflare Worker URL
  const WORKER_URL = "https://kingvon.alexwario127.workers.dev";

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

    // Call the worker
    const response = await fetch(`${WORKER_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
        enableWebSearch: enableWebSearch,
        userQuery: enableWebSearch ? userPrompt : "",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Worker API error: ${errorData.error || "Unknown error"}`
      );
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Worker API call failed:", error);

    // Fallback error message
    throw new Error(
      `Failed to get AI response: ${error.message}. Please try again.`
    );
  }
}

/* Add message to chat window */
function addMessageToChat(sender, message) {
  const isUser = sender === "user";
  const isSystem = sender === "system";

  let messageClass = "ai-message";
  let senderLabel = "L'Oréal AI";
  let messageStyle =
    "margin-bottom: 16px; padding: 16px; background: #f8f9fa; border-radius: 12px; margin-right: 10%; border-left: 4px solid #ff003b;";

  if (isUser) {
    messageClass = "user-message";
    senderLabel = "You";
    messageStyle =
      "margin-bottom: 16px; padding: 16px; background: linear-gradient(135deg, #ff003b, #e3a535); color: white; border-radius: 12px; margin-left: 10%;";
  } else if (isSystem) {
    messageClass = "system-message";
    senderLabel = "System";
    messageStyle =
      "margin-bottom: 16px; padding: 12px; background: #e8f4f8; border-radius: 12px; text-align: center; font-style: italic; color: #2c5aa0;";
  }

  const messageHtml = `
    <div class="${messageClass}" style="${messageStyle}">
      ${!isSystem ? `<strong>${senderLabel}:</strong> ` : ""}${formatMessage(
    message
  )}
    </div>
  `;

  chatWindow.innerHTML += messageHtml;
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Format message with better styling */
function formatMessage(message) {
  // Convert **bold** text
  message = message.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert numbered lists to HTML
  message = message.replace(/(\d+\.\s)/g, "<br><strong>$1</strong>");

  // Convert bullet points
  message = message.replace(/([•\-\*])\s/g, "<br>• ");

  // Add emphasis to headings (text ending with :)
  message = message.replace(
    /^([^:\n]+:)$/gm,
    '<strong style="color: var(--loreal-red);">$1</strong>'
  );

  // Convert line breaks to HTML
  message = message.replace(/\n/g, "<br>");

  // Clean up extra breaks at the beginning
  message = message.replace(/^(<br>)+/, "");

  return message;
}

/* Clear all selected products */
function clearAllSelections() {
  // Confirm with user before clearing
  if (selectedProducts.length > 0) {
    const confirmClear = confirm(
      `Are you sure you want to remove all ${selectedProducts.length} selected products?`
    );
    if (!confirmClear) return;
  }

  // Clear the selection
  selectedProducts = [];

  // Save to localStorage and update display
  saveSelectedProducts();
  updateSelectedProductsDisplay();

  // Update visual state of all product cards
  document.querySelectorAll(".product-card.selected").forEach((card) => {
    card.classList.remove("selected");
  });

  // Show confirmation message
  addMessageToChat("system", "✨ All selections have been cleared!");
}

// Global variables
let tooltipElement = null;
let selectedText = '';
let apiService = null;

// Create tooltip element
function createTooltip() {
  const tooltip = document.createElement('div');
  tooltip.className = 'hol-tooltip';
  tooltip.innerHTML = `
    <div class="hol-tooltip-content">
      <div class="hol-tooltip-option" id="explain-option">Explain</div>
      <div class="hol-tooltip-option" id="related-option">Get Related Articles</div>
    </div>
  `;
  document.body.appendChild(tooltip);
  
  // Add event listeners to tooltip options
  document.getElementById('explain-option').addEventListener('click', () => {
    handleExplain(selectedText);
  });
  
  document.getElementById('related-option').addEventListener('click', () => {
    handleRelatedArticles(selectedText);
  });
  
  return tooltip;
}

// Position the tooltip near the selected text
function positionTooltip(x, y) {
  if (!tooltipElement) {
    tooltipElement = createTooltip();
  }
  
  tooltipElement.style.display = 'block';
  tooltipElement.style.left = `${x}px`;
  tooltipElement.style.top = `${y}px`;
}

// Hide the tooltip
function hideTooltip() {
  if (tooltipElement) {
    tooltipElement.style.display = 'none';
  }
}

// Handle the explain option
async function handleExplain(text) {
  console.log('handleExplain called with text:', text);
  showLoadingState();
  
  try {
    // Get API key from storage
    chrome.storage.sync.get(['apiKey'], async function(result) {
      console.log('API key retrieved from storage:', result.apiKey ? 'Key exists' : 'No key found');
      
      if (!result.apiKey) {
        console.error('No API key found in storage');
        showError('API key not set. Please set it in the extension options.');
        return;
      }
      
      // Initialize API service if needed
      try {
        if (!apiService) {
          console.log('Creating new ApiService instance');
          apiService = new ApiService(result.apiKey);
        } else {
          console.log('Using existing ApiService instance');
          apiService.setApiKey(result.apiKey);
        }
        
        console.log('Calling getExplanation method for text:', text);
        console.log('Text length:', text.length);
        console.log('Text content:', text);
        
        const data = await apiService.getExplanation(text);
        console.log('Explanation received from API:', data);
        
        if (data && data.explanation) {
          console.log('Explanation content length:', data.explanation.length);
          console.log('Explanation preview:', data.explanation.substring(0, 100) + '...');
          showExplanation(data.explanation);
        } else {
          console.error('Invalid explanation data received:', data);
          showError('Received invalid explanation data from API');
        }
      } catch (error) {
        console.error('Error in API service:', error);
        showError(`API Error: ${error.message || 'Failed to get explanation'}`);
      }
    });
  } catch (error) {
    console.error('General error:', error);
    showError(`Error: ${error.message}`);
  }
}

// Handle the related articles option
async function handleRelatedArticles(text) {
  showLoadingState();
  
  try {
    // Get API key from storage
    chrome.storage.sync.get(['apiKey'], async function(result) {
      console.log('API key retrieved from storage:', result.apiKey ? 'Key exists' : 'No key found');
      
      if (!result.apiKey) {
        showError('API key not set. Please set it in the extension options.');
        return;
      }
      
      // Initialize API service if needed
      try {
        if (!apiService) {
          console.log('Creating new ApiService instance');
          apiService = new ApiService(result.apiKey);
        } else {
          console.log('Using existing ApiService instance');
          apiService.setApiKey(result.apiKey);
        }
        
        console.log('Calling getRelatedArticles method');
        const data = await apiService.getRelatedArticles(text);
        console.log('Related articles received:', data);
        showRelatedArticles(data.articles);
      } catch (error) {
        console.error('Error in API service:', error);
        showError(`API Error: ${error.message || 'Failed to get related articles'}`);
      }
    });
  } catch (error) {
    console.error('General error:', error);
    showError(`Error: ${error.message}`);
  }
}

// Show loading state in the tooltip
function showLoadingState() {
  if (tooltipElement) {
    tooltipElement.innerHTML = `
      <div class="hol-tooltip-content">
        <div class="hol-loading">Loading...</div>
      </div>
    `;
  }
}

// Process text to remove any instruction text and format it properly
function processText(text) {
  // Remove any instruction text that might be included in the response
  let processed = text;
  
  // Remove any lines that look like instructions
  const instructionPatterns = [
    /^INSTRUKSI:.*/i,
    /^Berikut.*penjelasan.*/i,
    /^Saya akan menjelaskan.*/i,
    /^Mohon berikan.*/i,
    /^Untuk menjelaskan.*/i
  ];
  
  instructionPatterns.forEach(pattern => {
    processed = processed.replace(pattern, '');
  });
  
  // Convert markdown to HTML
  processed = processed
    // Bold text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic text
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Clean up
    .trim();
  
  // Wrap in paragraphs if not already done
  if (!processed.startsWith('<')) {
    processed = `<p>${processed}</p>`;
  }
  
  return processed;
}

// Show explanation in the tooltip
function showExplanation(explanation) {
  if (tooltipElement) {
    const formattedExplanation = processText(explanation);
    
    tooltipElement.innerHTML = `
      <div class="hol-tooltip-content hol-result">
        <div class="hol-explanation">${formattedExplanation}</div>
        <div class="hol-button-container">
          <div class="hol-back-btn">Back</div>
          <div class="hol-close-btn">Close</div>
        </div>
      </div>
    `;
    
    document.querySelector('.hol-back-btn').addEventListener('click', () => {
      // Go back to the main tooltip menu
      if (tooltipElement) {
        tooltipElement.innerHTML = `
          <div class="hol-tooltip-content">
            <div class="hol-tooltip-option" id="explain-option">Explain</div>
            <div class="hol-tooltip-option" id="related-option">Get Related Articles</div>
          </div>
        `;
        
        // Re-add event listeners
        document.getElementById('explain-option').addEventListener('click', () => {
          handleExplain(selectedText);
        });
        
        document.getElementById('related-option').addEventListener('click', () => {
          handleRelatedArticles(selectedText);
        });
      }
    });
    
    document.querySelector('.hol-close-btn').addEventListener('click', hideTooltip);
  }
}

// Extract articles from text response if needed
function extractArticlesFromText(text) {
  // If we already have structured articles, no need to extract
  if (Array.isArray(text)) {
    return text;
  }
  
  const articles = [];
  const processedText = processText(text);
  
  // Try to extract URLs and titles from the text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = processedText.match(urlRegex) || [];
  
  // Extract paragraphs or list items that might contain article titles
  const lines = processedText.split('</p><p>');
  
  urls.forEach((url, index) => {
    // Try to find a title near the URL
    let title = `Article ${index + 1}`;
    let snippet = '';
    
    // Look for potential title in nearby lines
    for (const line of lines) {
      if (line.includes(url)) {
        // Extract text before the URL as potential title
        const beforeUrl = line.split(url)[0];
        if (beforeUrl && beforeUrl.trim().length > 0) {
          title = beforeUrl.replace(/<[^>]*>/g, '').trim();
        }
        
        // Extract text after the URL as potential snippet
        const afterUrl = line.split(url)[1];
        if (afterUrl && afterUrl.trim().length > 0) {
          snippet = afterUrl.replace(/<[^>]*>/g, '').trim();
        }
        
        break;
      }
    }
    
    articles.push({
      url: url,
      title: title || 'Related Article',
      snippet: snippet || 'Article from hukumonline.com'
    });
  });
  
  return articles.length > 0 ? articles : [
    {
      url: 'https://www.hukumonline.com',
      title: 'Tidak ada artikel spesifik yang ditemukan',
      snippet: 'Kunjungi hukumonline.com untuk informasi hukum lebih lanjut.'
    }
  ];
}

// Show related articles in the tooltip
function showRelatedArticles(articles) {
  if (tooltipElement) {
    // Process the articles - either use the structured data or extract from text
    const processedArticles = Array.isArray(articles) ? articles : extractArticlesFromText(articles);
    
    let articlesHtml = '';
    
    processedArticles.forEach(article => {
      // Clean up the title and snippet
      const title = article.title.replace(/<[^>]*>/g, '').trim();
      const snippet = article.snippet ? processText(article.snippet) : '';
      
      articlesHtml += `
        <div class="hol-article">
          <a href="${article.url}" target="_blank">${title}</a>
          <div class="hol-snippet">${snippet}</div>
        </div>
      `;
    });
    
    tooltipElement.innerHTML = `
      <div class="hol-tooltip-content hol-result">
        <div class="hol-articles-container">
          ${articlesHtml || '<p>Tidak ada artikel terkait yang ditemukan.</p>'}
        </div>
        <div class="hol-button-container">
          <div class="hol-back-btn">Back</div>
          <div class="hol-close-btn">Close</div>
        </div>
      </div>
    `;
    
    document.querySelector('.hol-back-btn').addEventListener('click', () => {
      // Go back to the main tooltip menu
      if (tooltipElement) {
        tooltipElement.innerHTML = `
          <div class="hol-tooltip-content">
            <div class="hol-tooltip-option" id="explain-option">Explain</div>
            <div class="hol-tooltip-option" id="related-option">Get Related Articles</div>
          </div>
        `;
        
        // Re-add event listeners
        document.getElementById('explain-option').addEventListener('click', () => {
          handleExplain(selectedText);
        });
        
        document.getElementById('related-option').addEventListener('click', () => {
          handleRelatedArticles(selectedText);
        });
      }
    });
    
    document.querySelector('.hol-close-btn').addEventListener('click', hideTooltip);
  }
}

// Show error in the tooltip
function showError(message) {
  if (tooltipElement) {
    tooltipElement.innerHTML = `
      <div class="hol-tooltip-content">
        <div class="hol-error">${message}</div>
        <div class="hol-close-btn">Close</div>
      </div>
    `;
    
    document.querySelector('.hol-close-btn').addEventListener('click', hideTooltip);
  }
}

// API Service implementation directly in content script
class ApiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // Gemini API endpoint - using the model from Google AI Studio quick start guide
    this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  async getExplanation(text) {
    try {
      const response = await this.makeApiRequest(text, 'explanation');
      return response;
    } catch (error) {
      console.error('Error getting explanation:', error);
      throw error;
    }
  }

  async getRelatedArticles(text) {
    try {
      const response = await this.makeApiRequest(text, 'related_articles');
      return response;
    } catch (error) {
      console.error('Error getting related articles:', error);
      throw error;
    }
  }

  async makeApiRequest(text, type) {
    console.log(`makeApiRequest called with text: "${text}" and type: ${type}`);
    
    if (!this.apiKey) {
      console.error('API key not set in makeApiRequest');
      throw new Error('API key not set');
    }

    let prompt;
    if (type === 'explanation') {
      prompt = `get me explanation about "${text}" from hukumonline.com`;
    } else {
      prompt = `get me related articles about "${text}" from hukumonline.com. Please include URLs to the articles on hukumonline.com`;
    }
    console.log('Base prompt:', prompt);

    // Construct the full instruction for the API
    const instruction = type === 'explanation' ?
      `INSTRUKSI: Kamu adalah asisten hukum. Berikut ini adalah istilah hukum: "${text}". Langsung berikan penjelasan yang jelas dan akurat dalam Bahasa Indonesia tentang istilah tersebut. JANGAN bertanya kembali kepada pengguna. JANGAN meminta klarifikasi. Berikan penjelasan terbaik yang kamu bisa berdasarkan informasi dari hukumonline.com. Mulai penjelasan langsung dengan definisi atau konsep, tanpa kalimat pembuka.` :
      `INSTRUKSI: Kamu adalah asisten hukum. Berikut ini adalah topik hukum: "${text}". Langsung berikan minimal 3 artikel terkait dalam Bahasa Indonesia dari hukumonline.com. JANGAN bertanya kembali kepada pengguna. JANGAN meminta klarifikasi. Sertakan URL ke artikel-artikel tersebut. Mulai langsung dengan daftar artikel, tanpa kalimat pembuka.`;
    
    console.log('Full instruction:', instruction);

    // Gemini API request body format - simplified to match the quick start guide
    const requestBody = {
      contents: [{
        parts: [{
          text: instruction
        }]
      }]
    };
    
    console.log('Request body:', JSON.stringify(requestBody));

    try {
      console.log('Making Gemini API request with key:', this.apiKey.substring(0, 5) + '...');
      console.log('API endpoint:', this.endpoint);
      
      // Add API key as query parameter for Gemini API
      const apiUrl = `${this.endpoint}?key=${this.apiKey}`;
      console.log('Full API URL (without key):', this.endpoint + '?key=XXXXX');
      
      console.log('Sending fetch request...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      console.log('Fetch response received, status:', response.status);

      if (!response.ok) {
        console.error('API response not OK, status:', response.status);
        const errorData = await response.json();
        console.error('Gemini API error response:', errorData);
        const errorMessage = errorData.error?.message || response.statusText;
        throw new Error(`API request failed: ${errorMessage}`);
      }

      console.log('Parsing JSON response...');
      const data = await response.json();
      console.log('Gemini API response structure:', Object.keys(data));
      console.log('Gemini API full response:', data);
      
      // Process the response based on the request type
      if (type === 'explanation') {
        // Extract content from Gemini API response
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
          const explanation = data.candidates[0].content.parts[0].text;
          console.log('Extracted explanation:', explanation.substring(0, 100) + '...');
          return {
            explanation: explanation
          };
        } else {
          console.error('Unexpected API response structure:', data);
          throw new Error('Unexpected API response structure');
        }
      } else {
        // Parse the response to extract articles
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
          const content = data.candidates[0].content.parts[0].text;
          console.log('Extracted content for articles:', content.substring(0, 100) + '...');
          const articles = this.parseArticlesFromContent(content);
          console.log('Parsed articles:', articles);
          return {
            articles: articles
          };
        } else {
          console.error('Unexpected API response structure:', data);
          throw new Error('Unexpected API response structure');
        }
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  parseArticlesFromContent(content) {
    // This is a simplified example - you may need to adjust based on your API response format
    const articles = [];
    
    // Split the content by newlines and look for article patterns
    const lines = content.split('\n');
    
    let currentArticle = null;
    
    for (const line of lines) {
      // Check if the line contains a URL to hukumonline.com
      const urlMatch = line.match(/(https?:\/\/[^\s]+hukumonline\.com[^\s]+)/);
      
      if (urlMatch) {
        // If we were building an article, push it to the array
        if (currentArticle) {
          articles.push(currentArticle);
        }
        
        // Start a new article
        currentArticle = {
          url: urlMatch[1],
          title: line.replace(urlMatch[1], '').trim(),
          snippet: ''
        };
        
        // If the title is empty, use a default or extract from the URL
        if (!currentArticle.title) {
          currentArticle.title = 'Related Article on Hukumonline.com';
        }
      } else if (currentArticle && line.trim()) {
        // Add non-empty lines to the current article's snippet
        currentArticle.snippet += line.trim() + ' ';
      }
    }
    
    // Add the last article if there is one
    if (currentArticle) {
      articles.push(currentArticle);
    }
    
    // If no articles were found, create a fallback
    if (articles.length === 0) {
      // Extract any URLs from the content
      const urlMatches = content.match(/(https?:\/\/[^\s]+)/g);
      
      if (urlMatches) {
        // Filter for hukumonline.com URLs
        const holUrls = urlMatches.filter(url => url.includes('hukumonline.com'));
        
        for (const url of holUrls) {
          articles.push({
            url: url,
            title: 'Related Article on Hukumonline.com',
            snippet: 'Visit this article for more information.'
          });
        }
      }
      
      // If still no articles, create a generic response
      if (articles.length === 0) {
        articles.push({
          url: 'https://www.hukumonline.com',
          title: 'No specific articles found',
          snippet: 'Visit Hukumonline.com for more legal information and resources.'
        });
      }
    }
    
    return articles;
  }
}

// Initialize when the content script loads
console.log('Legal Term Explainer: Content script loaded');

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in content script:', message);
  
  if (message.action === 'apiKeyUpdated') {
    console.log('API key updated notification received');
    // Reload the API key from storage
    chrome.storage.sync.get(['apiKey'], function(result) {
      if (result.apiKey) {
        console.log('Updating API service with new key');
        if (!apiService) {
          apiService = new ApiService(result.apiKey);
        } else {
          apiService.setApiKey(result.apiKey);
        }
      }
    });
  }
  
  // Always return true for async response
  return true;
});

// Automatically generate explanation and related articles
async function generateExplanationAndArticles(text) {
  console.log('Automatically generating explanation and related articles for:', text);
  showLoadingState();
  
  try {
    // Get API key from storage
    chrome.storage.sync.get(['apiKey'], async function(result) {
      if (!result.apiKey) {
        console.error('No API key found in storage');
        showError('API key not set. Please set it in the extension options.');
        return;
      }
      
      // Initialize API service if needed
      try {
        if (!apiService) {
          console.log('Creating new ApiService instance');
          apiService = new ApiService(result.apiKey);
        } else {
          console.log('Using existing ApiService instance');
          apiService.setApiKey(result.apiKey);
        }
        
        // Start both requests in parallel
        console.log('Starting parallel API requests');
        const explanationPromise = apiService.getExplanation(text);
        const articlesPromise = apiService.getRelatedArticles(text);
        
        // Wait for both to complete
        const [explanationData, articlesData] = await Promise.all([explanationPromise, articlesPromise]);
        
        console.log('Both API requests completed');
        console.log('Explanation:', explanationData);
        console.log('Articles:', articlesData);
        
        // Show combined results
        showCombinedResults(explanationData.explanation, articlesData.articles);
      } catch (error) {
        console.error('Error in API service:', error);
        showError(`API Error: ${error.message || 'Failed to get data'}`);
      }
    });
  } catch (error) {
    console.error('General error:', error);
    showError(`Error: ${error.message}`);
  }
}

// Simulate typing animation
function typeText(element, text, speed = 2) {
  return new Promise(resolve => {
    // Create a hidden element with the full text to calculate final height
    const hiddenElement = document.createElement('div');
    hiddenElement.className = 'hidden-text';
    hiddenElement.innerHTML = text;
    document.body.appendChild(hiddenElement);
    
    // Create the visible element that will show the typing animation
    const visibleElement = document.createElement('div');
    visibleElement.className = 'typed-text typing-animation';
    element.appendChild(visibleElement);
    
    let charIndex = 0;
    const typeChar = () => {
      if (charIndex < text.length) {
        // Add multiple characters at once for faster typing
        const charsToAdd = Math.min(5, text.length - charIndex); // Add up to 5 chars at once
        visibleElement.innerHTML = text.substring(0, charIndex + charsToAdd);
        charIndex += charsToAdd;
        
        // Faster typing with minimal random variation
        const randomDelay = Math.floor(Math.random() * 3) + speed;
        setTimeout(typeChar, randomDelay);
      } else {
        // Typing complete
        visibleElement.classList.remove('typing-animation');
        document.body.removeChild(hiddenElement);
        resolve();
      }
    };
    
    // Start typing
    typeChar();
  });
}

// Show combined results in the tooltip with typing animation
async function showCombinedResults(explanation, articles) {
  if (tooltipElement) {
    const formattedExplanation = processText(explanation);
    
    // Process articles
    const processedArticles = Array.isArray(articles) ? articles : extractArticlesFromText(articles);
    
    let articlesHtml = '';
    processedArticles.slice(0, 3).forEach((article, index) => { // Limit to top 3 articles
      const title = article.title.replace(/<[^>]*>/g, '').trim();
      const snippet = article.snippet ? processText(article.snippet) : '';
      
      // Create date from current date minus random days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      const formattedDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      
      // Categories based on the article index
      const categories = ['Perdata', 'Klinik', 'Peraturan'];
      const category = categories[index % categories.length];
      
      articlesHtml += `
        <div class="hol-article">
          <div class="hol-article-meta">
            <span class="date">${formattedDate}</span>
            <span class="category">${category}</span>
          </div>
          <a href="${article.url}" target="_blank">${title}</a>
          <div class="hol-snippet">${snippet}</div>
        </div>
      `;
    });
    
    // Set up the initial HTML structure
    tooltipElement.innerHTML = `
      <div class="hol-tooltip-content hol-result">
        <div class="hol-section-title">Penjelasan</div>
        <div class="hol-explanation" id="explanation-container"></div>
        <div class="hol-section-title">Artikel Terkait</div>
        <div class="hol-articles-container">
          ${articlesHtml || '<p>Tidak ada artikel terkait yang ditemukan.</p>'}
        </div>
        <div class="hol-button-container">
          <div class="hol-close-btn">Tutup</div>
        </div>
      </div>
    `;
    
    // Add event listener for close button
    document.querySelector('.hol-close-btn').addEventListener('click', hideTooltip);
    
    // Start typing animation for explanation
    const explanationContainer = document.getElementById('explanation-container');
    await typeText(explanationContainer, formattedExplanation);
  }
}

// Event listener for text selection
document.addEventListener('mouseup', function(event) {
  const selection = window.getSelection();
  selectedText = selection.toString().trim();
  
  console.log('Text selection event detected');
  console.log('Selected text:', selectedText);
  
  if (selectedText && selectedText.length > 3) { // Only trigger for selections with more than 3 characters
    console.log('Valid text selection detected, length:', selectedText.length);
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Position tooltip below the selection
    const x = rect.left + window.scrollX;
    const y = rect.bottom + window.scrollY + 5; // 5px offset
    console.log('Positioning tooltip at coordinates:', { x, y });
    
    positionTooltip(x, y);
    
    // Automatically generate explanation and related articles
    generateExplanationAndArticles(selectedText);
  } else {
    console.log('Empty or too short text selection, hiding tooltip');
    hideTooltip();
  }
});

// Close tooltip when clicking outside
document.addEventListener('mousedown', function(event) {
  if (tooltipElement && !tooltipElement.contains(event.target)) {
    hideTooltip();
  }
});

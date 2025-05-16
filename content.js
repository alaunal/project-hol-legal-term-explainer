// Global variables
let tooltipElement = null;
let selectedText = '';
let apiService = null;

// Add global cache object
let responseCache = {};

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
  
  if (tooltipElement) {
    // Show confirmation dialog
    tooltipElement.innerHTML = `
      <div class="hol-tooltip-content">
        <div class="hol-confirmation">
          <div class="hol-confirmation-text">Dapatkan penjelasan untuk "${text.length > 30 ? text.substring(0, 30) + '...' : text}"?</div>
          <div class="hol-button-container">
            <div class="hol-confirm-btn" id="explain-confirm-btn">Ya, Jelaskan</div>
            <div class="hol-cancel-btn" id="explain-cancel-btn">Batal</div>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners for confirmation buttons with specific IDs
    document.getElementById('explain-confirm-btn').addEventListener('click', async (event) => {
      event.preventDefault(); // Prevent any default actions
      event.stopPropagation(); // Stop event propagation
      console.log('Explanation confirmation clicked');
      
      try {
        await fetchExplanation(text);
      } catch (error) {
        console.error('Error after confirmation:', error);
        // Error handling is done in fetchExplanation
      }
    });
    
    document.getElementById('explain-cancel-btn').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log('Explanation request cancelled by user');
      
      // Go back to main menu
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
  }
}

// Fetch explanation after confirmation
async function fetchExplanation(text) {
  console.log('fetchExplanation started for:', text);
  try {
    showLoadingState();
    
    // Get API key from storage
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['apiKey'], async function(result) {
        console.log('API key retrieved from storage:', result.apiKey ? 'Key exists' : 'No key found');
        
        if (!result.apiKey) {
          console.error('No API key found in storage');
          showError('API key not set. Please set it in the extension options.');
          reject('No API key found');
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
            resolve();
          } else {
            console.error('Invalid explanation data received:', data);
            showError('Received invalid explanation data from API');
            reject('Invalid explanation data');
          }
        } catch (error) {
          console.error('Error in API service:', error);
          showError(`API Error: ${error.message || 'Failed to get explanation'}`);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('General error in fetchExplanation:', error);
    showError(`Error: ${error.message}`);
    return Promise.reject(error);
  }
}

// Handle the related articles option
async function handleRelatedArticles(text) {
  console.log('handleRelatedArticles called with text:', text);
  
  if (tooltipElement) {
    // Show confirmation dialog
    tooltipElement.innerHTML = `
      <div class="hol-tooltip-content">
        <div class="hol-confirmation">
          <div class="hol-confirmation-text">Cari artikel terkait "${text.length > 30 ? text.substring(0, 30) + '...' : text}"?</div>
          <div class="hol-button-container">
            <div class="hol-confirm-btn" id="articles-confirm-btn">Ya, Cari</div>
            <div class="hol-cancel-btn" id="articles-cancel-btn">Batal</div>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners for confirmation buttons
    document.getElementById('articles-confirm-btn').addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log('Articles confirmation clicked');
      
      try {
        await fetchRelatedArticles(text);
      } catch (error) {
        console.error('Error after articles confirmation:', error);
        // Error handling is done in fetchRelatedArticles
      }
    });
    
    document.getElementById('articles-cancel-btn').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log('Articles request cancelled by user');
      
      // Go back to main menu
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
  }
}

// Fetch related articles after confirmation
async function fetchRelatedArticles(text) {
  console.log('fetchRelatedArticles started for:', text);
  try {
    showLoadingState();
    
    // Get API key from storage
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['apiKey'], async function(result) {
        console.log('API key retrieved from storage:', result.apiKey ? 'Key exists' : 'No key found');
        
        if (!result.apiKey) {
          console.error('No API key found in storage');
          showError('API key not set. Please set it in the extension options.');
          reject('No API key found');
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
          resolve();
        } catch (error) {
          console.error('Error in API service:', error);
          showError(`API Error: ${error.message || 'Failed to get related articles'}`);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('General error in fetchRelatedArticles:', error);
    showError(`Error: ${error.message}`);
    return Promise.reject(error);
  }
}

// Show loading state in the tooltip
function showLoadingState() {
  if (tooltipElement) {
    tooltipElement.innerHTML = `
      <div class="hol-tooltip-content">
        <div class="hol-loading">
          <div class="hol-spinner"></div>
          <div class="hol-loading-text">Loading...</div>
        </div>
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
        <div class="hol-section-title hol-section-title-with-copy">
          Penjelasan
          <div class="hol-copy-btn-small" title="Copy explanation">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#13294b">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          </div>
        </div>
        <div class="hol-explanation">${formattedExplanation}</div>
        <div class="hol-button-container">
          <div class="hol-back-btn">Back</div>
          <div class="hol-close-btn">Close</div>
        </div>
      </div>
    `;
    
    document.querySelector('.hol-copy-btn-small').addEventListener('click', () => {
      copyToClipboard(explanation);
    });
    
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

// Load cache from localStorage on startup
function loadCache() {
  try {
    const cachedData = localStorage.getItem('holResponseCache');
    if (cachedData) {
      responseCache = JSON.parse(cachedData);
      
      // Clean expired cache entries
      const now = Date.now();
      Object.keys(responseCache).forEach(key => {
        if (responseCache[key].expiry < now) {
          delete responseCache[key];
        }
      });
      
      console.log('Cache loaded with', Object.keys(responseCache).length, 'valid entries');
      localStorage.setItem('holResponseCache', JSON.stringify(responseCache));
    }
  } catch (error) {
    console.error('Error loading cache:', error);
    responseCache = {};
  }
}

// Save cache to localStorage
function saveCache() {
  try {
    localStorage.setItem('holResponseCache', JSON.stringify(responseCache));
  } catch (error) {
    console.error('Error saving cache:', error);
  }
}

// Check cache for a response
function checkCache(text) {
  const cacheKey = text.toLowerCase().trim();
  const cachedResponse = responseCache[cacheKey];
  
  if (cachedResponse && cachedResponse.expiry > Date.now()) {
    console.log('Cache hit for:', text);
    return cachedResponse.data;
  }
  
  console.log('Cache miss for:', text);
  return null;
}

// Store response in cache
function storeInCache(text, data) {
  const cacheKey = text.toLowerCase().trim();
  // Cache expires in 24 hours
  const expiry = Date.now() + (24 * 60 * 60 * 1000);
  
  responseCache[cacheKey] = {
    data: data,
    expiry: expiry
  };
  
  saveCache();
  console.log('Stored in cache:', text);
}

// Show combined results in the tooltip with typing animation and regenerate button
async function showCombinedResults(explanation, articles, originalText) {
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
        <div class="hol-section-title hol-section-title-with-copy">
          Penjelasan
          <div class="hol-copy-btn-small" title="Copy explanation">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#13294b">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          </div>
        </div>
        <div class="hol-explanation" id="explanation-container"></div>
        <div class="hol-section-title">Artikel Terkait</div>
        <div class="hol-articles-container">
          ${articlesHtml || '<p>Tidak ada artikel terkait yang ditemukan.</p>'}
        </div>
        <div class="hol-button-container">
          <div class="hol-regenerate-btn" id="regenerate-btn">Regenerate</div>
          <div class="hol-close-btn">Tutup</div>
        </div>
      </div>
    `;
    
    // Add event listener for close button
    document.querySelector('.hol-close-btn').addEventListener('click', hideTooltip);
    
    // Add event listener for regenerate button
    document.getElementById('regenerate-btn').addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Regenerate button clicked for:', originalText);
      fetchCombinedData(originalText, true); // Bypass cache
    });
    
    // Add event listener for copy button
    document.querySelector('.hol-copy-btn-small').addEventListener('click', () => {
      copyToClipboard(explanation);
    });
    
    // Start typing animation for explanation
    const explanationContainer = document.getElementById('explanation-container');
    await typeText(explanationContainer, formattedExplanation);
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
  
  // Check if there are bullet points with article titles
  const bulletItemRegex = /<li>(.*?)<\/li>/g;
  let match;
  let bulletItems = [];
  
  while ((match = bulletItemRegex.exec(processedText)) !== null) {
    bulletItems.push(match[1].trim());
  }
  
  // If we have bullet items, use them as article titles
  if (bulletItems.length > 0 && urls.length > 0) {
    // Match bullet items with URLs, using the minimum length of both arrays
    const count = Math.min(bulletItems.length, urls.length);
    
    for (let i = 0; i < count; i++) {
      const title = bulletItems[i].replace(/<[^>]*>/g, '').trim();
      
      articles.push({
        url: urls[i],
        title: title || 'Related Article',
        snippet: 'Article from hukumonline.com'
      });
    }
  } 
  // Otherwise fall back to previous extraction method
  else {
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
  }
  
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
    
    processedArticles.forEach((article, index) => {
      // Clean up the title and snippet
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
    
    tooltipElement.innerHTML = `
      <div class="hol-tooltip-content hol-result">
        <div class="hol-section-title">Artikel Terkait</div>
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
      `INSTRUKSI: Kamu adalah asisten hukum. Berikut ini adalah topik hukum: "${text}". Langsung berikan minimal 3 artikel terkait dalam Bahasa Indonesia dari hukumonline.com. JANGAN bertanya kembali kepada pengguna. JANGAN meminta klarifikasi. Format jawaban harus dalam bentuk bullet points dengan tanda • (bulatan) di awal setiap artikel, diikuti dengan judul artikel, lalu URL yang lengkap. Contoh:
      
• Judul Artikel Pertama https://www.hukumonline.com/artikel1
• Judul Artikel Kedua https://www.hukumonline.com/artikel2
• Judul Artikel Ketiga https://www.hukumonline.com/artikel3

PENTING: Setiap artikel HARUS memiliki URL lengkap dari hukumonline.com dan jangan letakkan URL dalam tanda kurung. Mulai langsung dengan daftar artikel, tanpa kalimat pembuka.`;
    
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
    const articles = [];
    
    // Split the content by bullet points/list items
    const bulletItems = content.split(/•|\*|-/).filter(item => item.trim().length > 0);
    
    for (const item of bulletItems) {
      const trimmedItem = item.trim();
      
      // Extract URL
      const urlMatch = trimmedItem.match(/(https?:\/\/[^\s\)]+)/);
      const url = urlMatch ? urlMatch[1] : 'https://www.hukumonline.com';
      
      // Extract title
      let title = trimmedItem;
      if (urlMatch) {
        // Remove the URL from the title
        title = trimmedItem.replace(urlMatch[0], '').trim();
      }
      
      // Clean up the title (remove leading/trailing punctuation)
      title = title.replace(/^[\s\[\]:;,.]+|[\s\[\]:;,.]+$/g, '');
      
      if (title && url) {
        articles.push({
          url,
          title: title || 'Article on Hukumonline',
          snippet: 'Article from hukumonline.com'
        });
      }
    }
    
    // If no articles were extracted or the extraction failed, create a fallback
    if (articles.length === 0) {
      articles.push({
        url: 'https://www.hukumonline.com',
        title: 'Tidak ada artikel spesifik yang ditemukan',
        snippet: 'Kunjungi hukumonline.com untuk informasi hukum lebih lanjut.'
      });
    }
    
    return articles;
  }
}

// Initialize when the content script loads
console.log('Legal Term Explainer: Content script loaded');
loadCache(); // Load cache on startup

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
  console.log('Showing confirmation for:', text);
  
  if (tooltipElement) {
    // Show confirmation dialog first
    tooltipElement.innerHTML = `
      <div class="hol-tooltip-content">
        <div class="hol-confirmation">
          <div class="hol-confirmation-text">Dapatkan penjelasan untuk "${text.length > 30 ? text.substring(0, 30) + '...' : text}"?</div>
          <div class="hol-button-container">
            <div class="hol-confirm-btn" id="auto-confirm-btn">Ya, Jelaskan</div>
            <div class="hol-cancel-btn" id="auto-cancel-btn">Batal</div>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners for confirmation buttons
    document.getElementById('auto-confirm-btn').addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log('Auto confirmation clicked');
      
      try {
        await processConfirmedRequest(text);
      } catch (error) {
        console.error('Error after auto confirmation:', error);
        // Error handling is done in processConfirmedRequest
      }
    });
    
    document.getElementById('auto-cancel-btn').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log('Request cancelled by user');
      hideTooltip();
    });
  }
}

// Process the confirmed request
async function processConfirmedRequest(text) {
  console.log('Processing confirmed request for:', text);
  try {
    showLoadingState();
    
    // Get API key from storage
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['apiKey'], async function(result) {
        if (!result.apiKey) {
          console.error('No API key found in storage');
          showError('API key not set. Please set it in the extension options.');
          reject('No API key found');
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
          showCombinedResults(explanationData.explanation, articlesData.articles, text);
          resolve();
        } catch (error) {
          console.error('Error in API service:', error);
          showError(`API Error: ${error.message || 'Failed to get data'}`);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('General error in processConfirmedRequest:', error);
    showError(`Error: ${error.message}`);
    return Promise.reject(error);
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

// Function to copy text to clipboard
function copyToClipboard(text) {
  // Use modern Clipboard API if available
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showCopyFeedback('Copied to clipboard!');
        return true;
      })
      .catch(err => {
        console.error('Failed to copy text using Clipboard API: ', err);
        // Fall back to execCommand method
        return fallbackCopyToClipboard(text);
      });
  } else {
    // Use fallback for browsers that don't support Clipboard API
    return fallbackCopyToClipboard(text);
  }
}

// Fallback copy method using execCommand
function fallbackCopyToClipboard(text) {
  // Create a temporary textarea element
  const textarea = document.createElement('textarea');
  textarea.value = text;
  
  // Make the textarea out of viewport
  textarea.style.position = 'fixed';
  textarea.style.left = '-999999px';
  textarea.style.top = '-999999px';
  
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  
  let success = false;
  try {
    // Execute the copy command
    success = document.execCommand('copy');
    if (success) {
      showCopyFeedback('Copied to clipboard!');
    } else {
      showCopyFeedback('Failed to copy text', false);
    }
  } catch (err) {
    console.error('Failed to copy text using execCommand: ', err);
    showCopyFeedback('Failed to copy text', false);
    success = false;
  }
  
  // Remove the textarea
  document.body.removeChild(textarea);
  
  return success;
}

// Show temporary feedback when something is copied
function showCopyFeedback(message, isSuccess = true) {
  // Create feedback element
  const feedbackEl = document.createElement('div');
  feedbackEl.className = `hol-copy-feedback ${isSuccess ? 'success' : 'error'}`;
  feedbackEl.textContent = message;
  
  // Position the feedback centered in the tooltip
  if (tooltipElement) {
    tooltipElement.appendChild(feedbackEl);
    
    // Remove after 2 seconds
    setTimeout(() => {
      if (feedbackEl.parentNode === tooltipElement) {
        tooltipElement.removeChild(feedbackEl);
      }
    }, 2000);
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
    
    // Check cache first
    const cachedData = checkCache(selectedText);
    if (cachedData) {
      console.log('Cache hit, loading directly without confirmation');
      // If data is already in cache, show it directly without confirmation
      showCombinedResults(
        cachedData.explanation, 
        cachedData.articles, 
        selectedText
      );
    } else {
      // If not in cache, show confirmation dialog
      console.log('Cache miss, showing confirmation dialog');
      showDirectConfirmation(selectedText);
    }
  } else {
    console.log('Empty or too short text selection, hiding tooltip');
    hideTooltip();
  }
});

// Show direct confirmation for combined action
function showDirectConfirmation(text) {
  if (!tooltipElement) return;
  
  // Show confirmation directly
  tooltipElement.innerHTML = `
    <div class="hol-tooltip-content">
      <div class="hol-confirmation">
        <div class="hol-confirmation-text">Dapatkan penjelasan untuk "${text.length > 30 ? text.substring(0, 30) + '...' : text}"?</div>
        <div class="hol-button-container">
          <div class="hol-confirm-btn" id="direct-combined-confirm">Ya, Jelaskan</div>
          <div class="hol-cancel-btn" id="direct-combined-cancel">Batal</div>
        </div>
      </div>
    </div>
  `;
  
  tooltipElement.style.display = 'block'; // Ensure tooltip remains visible
  
  // Set up event handlers
  document.getElementById('direct-combined-confirm').onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Direct combined confirm clicked');
    
    fetchCombinedData(text, false);
  };
  
  document.getElementById('direct-combined-cancel').onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    hideTooltip();
  };
}

// Simplified loading state function
function showDirectLoadingState() {
  if (!tooltipElement) return;
  
  tooltipElement.innerHTML = `
    <div class="hol-tooltip-content">
      <div class="hol-loading">
        <div class="hol-spinner"></div>
        <div class="hol-loading-text">Loading...</div>
      </div>
    </div>
  `;
  
  tooltipElement.style.display = 'block'; // Ensure tooltip remains visible
}

// Close tooltip when clicking outside
document.addEventListener('mousedown', function(event) {
  if (tooltipElement && !tooltipElement.contains(event.target)) {
    hideTooltip();
  }
});

// Fetch combined data (with cache option)
async function fetchCombinedData(text, bypassCache = false) {
  // Check cache first (if not bypassing)
  if (!bypassCache) {
    const cachedData = checkCache(text);
    if (cachedData) {
      showCombinedResults(
        cachedData.explanation, 
        cachedData.articles, 
        text
      );
      return;
    }
  }
  
  // Show loading state if no cache hit
  showDirectLoadingState();
  
  // Get API key directly
  chrome.storage.sync.get(['apiKey'], function(result) {
    if (!result.apiKey) {
      showError('API key not set. Please set it in the extension options.');
      return;
    }
    
    // Initialize API
    if (!apiService) {
      apiService = new ApiService(result.apiKey);
    } else {
      apiService.setApiKey(result.apiKey);
    }
    
    // Call both APIs in parallel
    console.log('Starting parallel API requests');
    Promise.all([
      apiService.getExplanation(text),
      apiService.getRelatedArticles(text)
    ])
    .then(([explanationData, articlesData]) => {
      console.log('Both API requests completed');
      if (explanationData && explanationData.explanation && articlesData && articlesData.articles) {
        // Store in cache
        const combinedData = {
          explanation: explanationData.explanation,
          articles: articlesData.articles
        };
        
        if (!bypassCache) {
          storeInCache(text, combinedData);
        }
        
        showCombinedResults(
          explanationData.explanation, 
          articlesData.articles,
          text
        );
      } else {
        showError('Received invalid data from API');
      }
    })
    .catch(error => {
      console.error('API error:', error);
      showError(`API Error: ${error.message || 'Failed to get data'}`);
    });
  });
}

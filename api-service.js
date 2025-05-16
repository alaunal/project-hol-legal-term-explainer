/**
 * API Service for Legal Term Explainer
 * Handles communication with the AI API
 */

class ApiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // Default endpoint - replace with your actual API endpoint
    this.endpoint = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Set the API key
   * @param {string} apiKey - The API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Get an explanation for the selected text
   * @param {string} text - The text to explain
   * @returns {Promise} - Promise with the explanation
   */
  async getExplanation(text) {
    try {
      const response = await this.makeApiRequest(text, 'explanation');
      return response;
    } catch (error) {
      console.error('Error getting explanation:', error);
      throw error;
    }
  }

  /**
   * Get related articles for the selected text
   * @param {string} text - The text to find related articles for
   * @returns {Promise} - Promise with the related articles
   */
  async getRelatedArticles(text) {
    try {
      const response = await this.makeApiRequest(text, 'related_articles');
      return response;
    } catch (error) {
      console.error('Error getting related articles:', error);
      throw error;
    }
  }

  /**
   * Make an API request
   * @param {string} text - The text to process
   * @param {string} type - The type of request ('explanation' or 'related_articles')
   * @returns {Promise} - Promise with the API response
   */
  async makeApiRequest(text, type) {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }

    let prompt;
    if (type === 'explanation') {
      prompt = `get me explanation about "${text}" from hukumonline.com`;
    } else {
      prompt = `get me related articles about "${text}" from hukumonline.com`;
    }

    const requestBody = {
      model: "gpt-3.5-turbo", // Or your preferred model
      messages: [
        {
          role: "system",
          content: "You are a helpful legal assistant that provides explanations and related articles from hukumonline.com."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      // Process the response based on the request type
      if (type === 'explanation') {
        return {
          explanation: data.choices[0].message.content
        };
      } else {
        // Parse the response to extract articles
        // This is a simplified example - you may need to adjust based on your API response
        const content = data.choices[0].message.content;
        
        // Simple parsing logic - in a real implementation, you might want to use a more robust approach
        const articles = this.parseArticlesFromContent(content);
        
        return {
          articles: articles
        };
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Parse articles from the API response content
   * @param {string} content - The content from the API response
   * @returns {Array} - Array of article objects
   */
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

// Export the ApiService class
if (typeof module !== 'undefined') {
  module.exports = ApiService;
}

document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('api-key');
  const saveButton = document.getElementById('save-btn');
  const statusDiv = document.getElementById('status');
  
  // Load saved API key
  chrome.storage.sync.get(['apiKey'], function(result) {
    if (result.apiKey) {
      // Mask the API key for display
      const maskedKey = result.apiKey.substring(0, 5) + '...' + result.apiKey.substring(result.apiKey.length - 4);
      apiKeyInput.value = result.apiKey;
      showStatus(`API key loaded: ${maskedKey}`, 'success');
      console.log('API key loaded from storage');
    } else {
      console.log('No API key found in storage');
    }
  });
  
  // Save API key
  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter a valid API key', 'error');
      return;
    }
    
    // Basic validation for API key format
    if (!validateApiKey(apiKey)) {
      showStatus('API key format appears invalid. Please check your key.', 'error');
      return;
    }
    
    chrome.storage.sync.set({ apiKey: apiKey }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving API key:', chrome.runtime.lastError);
        showStatus('Error saving API key: ' + chrome.runtime.lastError.message, 'error');
      } else {
        const maskedKey = apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 4);
        showStatus(`API key saved successfully: ${maskedKey}`, 'success');
        console.log('API key saved to storage');
        
        // Notify any open tabs that the API key has been updated
        chrome.tabs.query({}, function(tabs) {
          tabs.forEach(function(tab) {
            chrome.tabs.sendMessage(tab.id, { action: 'apiKeyUpdated' })
              .catch(error => console.log('Tab not ready for message:', error));
          });
        });
      }
    });
  });
  
  // Basic validation for API key format
  function validateApiKey(key) {
    // Google API keys are typically 39 characters
    if (key.length < 20) {
      return false;
    }
    
    // Google API keys often contain only alphanumeric characters and dashes
    const validGoogleKeyPattern = /^[A-Za-z0-9_-]+$/;
    if (!validGoogleKeyPattern.test(key)) {
      console.warn('API key contains unusual characters for a Google API key');
    }
    
    return true;
  }
  
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    // Hide the status message after 5 seconds
    setTimeout(function() {
      statusDiv.className = 'status hidden';
    }, 5000);
  }
});

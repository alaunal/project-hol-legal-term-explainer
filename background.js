// Initialize extension when installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('Legal Term Explainer extension installed');
  
  // Create context menu items
  chrome.contextMenus.create({
    id: 'explain',
    title: 'Explain this term',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'related',
    title: 'Find related articles',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'explain') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'explain',
      text: info.selectionText
    });
  } else if (info.menuItemId === 'related') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'related',
      text: info.selectionText
    });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getApiKey') {
    chrome.storage.sync.get(['apiKey'], function(result) {
      sendResponse({ apiKey: result.apiKey || '' });
    });
    return true; // Required for async sendResponse
  }
});

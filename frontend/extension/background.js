// Clippy Notes Extension - Background Service Worker

const API_BASE_URL = 'http://localhost:8000';

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveToClippy',
    title: 'Save to Clippy Notes',
    contexts: ['selection']
  });
  
  console.log('Clippy Notes extension installed!');
});

// Handle context menu click - saves to MongoDB API
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'saveToClippy' && info.selectionText) {
    try {
      // Save to MongoDB API
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: info.selectionText,
          subject: 'Web Capture',
          sourceUrl: info.pageUrl || tab.url
        })
      });
      
      if (!response.ok) throw new Error('Failed to save note');
      
      // Show success badge
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#107c10' });
      
      // Clear badge after 2 seconds
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
      }, 2000);
      
      // Show notification
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/clippy-48.png',
          title: 'Note Saved!',
          message: `"${info.selectionText.substring(0, 50)}..." saved to Clippy Notes`
        });
      }
    } catch (error) {
      console.error('Error saving note from context menu:', error);
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#d13438' });
      
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
      }, 2000);
    }
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveNote') {
    saveNoteToAPI(request.note)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'getNotes') {
    getNotesFromAPI(request.subject)
      .then(notes => sendResponse({ notes }))
      .catch(error => sendResponse({ notes: [], error: error.message }));
    return true;
  }
  
  if (request.action === 'deleteNote') {
    deleteNoteFromAPI(request.noteId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// API Functions
async function saveNoteToAPI(note) {
  const response = await fetch(`${API_BASE_URL}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: note.content,
      subject: note.subject || 'Other',
      sourceUrl: note.source?.url || ''
    })
  });
  
  if (!response.ok) throw new Error('Failed to save note');
  return response.json();
}

async function getNotesFromAPI(subject) {
  const url = subject ? `${API_BASE_URL}/notes?subject=${encodeURIComponent(subject)}` : `${API_BASE_URL}/notes`;
  const response = await fetch(url);
  
  if (!response.ok) throw new Error('Failed to fetch notes');
  return response.json();
}

async function deleteNoteFromAPI(noteId) {
  const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) throw new Error('Failed to delete note');
  return response.json();
}

// Handle keyboard shortcuts (if defined in manifest)
chrome.commands?.onCommand?.addListener((command) => {
  if (command === 'quick-save') {
    // Trigger quick save
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: triggerQuickSave
          });
        } catch (error) {
          console.error('Error triggering quick save:', error);
        }
      }
    });
  }
});

function triggerQuickSave() {
  const selection = window.getSelection().toString().trim();
  if (selection) {
    chrome.runtime.sendMessage({
      action: 'saveNote',
      note: {
        content: selection,
        subject: 'Quick Save',
        source: {
          url: window.location.href,
          title: document.title
        }
      }
    });
  }
}

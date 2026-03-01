// Clippy Notes Extension - Popup Script
// Now saves to MongoDB via LearnLens backend API

// API Configuration - Update this to your backend URL
const API_BASE_URL = "http://localhost:8000"; // Change to your production URL when deploying

// DOM Elements
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");
const selectionInfo = document.getElementById("selection-info");
const subjectSelect = document.getElementById("subject-select");
const noteInput = document.getElementById("note-input");
const tagsInput = document.getElementById("tags-input");
const getSelectionBtn = document.getElementById("get-selection-btn");
const saveNoteBtn = document.getElementById("save-note-btn");
const saveStatus = document.getElementById("save-status");
const notesList = document.getElementById("notes-list");
const searchInput = document.getElementById("search-input");
const filterSubject = document.getElementById("filter-subject");
const exportBtn = document.getElementById("export-btn");
const clearBtn = document.getElementById("clear-btn");
const clippySpeech = document.getElementById("clippy-speech");

// Clippy messages
const clippyMessages = [
  "Hi! I'm Clippy, your study companion! 📚",
  "Select text on any webpage to capture it! ✨",
  "Your notes sync to the cloud! ☁️",
  "Pro tip: Use tags to organize your notes! 🏷️",
  "Great job taking notes! Keep it up! 🌟",
  "Need help? Just hover over me! 💡",
];

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadNotes();
  rotateClippyMessage();
  checkForSelection();
});

// Tab Navigation
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetTab = tab.dataset.tab;

    tabs.forEach((t) => t.classList.remove("active"));
    tabContents.forEach((tc) => tc.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(`${targetTab}-tab`).classList.add("active");

    if (targetTab === "notes") {
      loadNotes();
    }
  });
});

// Get Selection from Page
getSelectionBtn.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const selection = window.getSelection().toString().trim();
        return {
          text: selection,
          url: window.location.href,
          title: document.title,
        };
      },
    });

    if (result && result[0] && result[0].result.text) {
      const { text, url, title } = result[0].result;
      updateSelectionInfo(text, url, title);
      noteInput.value = text;
      showClippyMessage("Got it! I captured your selection! ✅");
    } else {
      showClippyMessage("Please select some text on the page first! 👆");
      selectionInfo.innerHTML =
        '<p class="empty-state">No text selected. Please select text on the page.</p>';
      selectionInfo.classList.remove("has-selection");
    }
  } catch (error) {
    console.error("Error getting selection:", error);
    showClippyMessage(
      "Oops! Couldn't get selection. Try refreshing the page. 🔄",
    );
  }
});

// Update Selection Info Display
function updateSelectionInfo(text, url, title) {
  const truncatedText =
    text.length > 150 ? text.substring(0, 150) + "..." : text;
  selectionInfo.innerHTML = `
    <p class="selection-text">"${truncatedText}"</p>
    <p class="selection-source">From: ${title || url}</p>
  `;
  selectionInfo.classList.add("has-selection");
}

// Save Note to MongoDB via API
saveNoteBtn.addEventListener("click", async () => {
  const content = noteInput.value.trim();
  const subject = subjectSelect.value;
  const tags = tagsInput.value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t);

  if (!content) {
    showStatus("error", "Please enter some content for your note.");
    return;
  }

  const note = {
    content,
    subject,
    tags,
    timestamp: new Date().toISOString(),
    source: {
      url: await getCurrentTabUrl(),
      title: await getCurrentTabTitle(),
    },
  };

  try {
    // Save to MongoDB via API
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(note),
    });

    if (!response.ok) {
      throw new Error("Failed to save note to server");
    }

    const data = await response.json();

    // Also save to local storage as backup
    const { notes = [] } = await chrome.storage.local.get("notes");
    notes.unshift({ ...note, id: data.note?.id || Date.now() });
    await chrome.storage.local.set({ notes });

    showStatus("success", "Note saved to cloud! ☁️");
    showClippyMessage("Note saved! You're doing great! 🌟");

    // Clear form
    noteInput.value = "";
    tagsInput.value = "";
    selectionInfo.innerHTML =
      '<p class="empty-state">👆 Select text on any webpage, then click "Get Selection"</p>';
    selectionInfo.classList.remove("has-selection");
  } catch (error) {
    console.error("Error saving note:", error);

    // Fallback: save to local storage only
    try {
      const { notes = [] } = await chrome.storage.local.get("notes");
      notes.unshift({ ...note, id: Date.now() });
      await chrome.storage.local.set({ notes });
      showStatus("success", "Note saved locally (offline mode)");
    } catch (localError) {
      showStatus("error", "Failed to save note. Please try again.");
    }
  }
});

// Load and Display Notes from MongoDB
async function loadNotes() {
  try {
    const searchTerm = searchInput?.value?.toLowerCase() || "";
    const filterValue = filterSubject?.value || "all";

    // Build query params
    const params = new URLSearchParams();
    if (filterValue !== "all") params.append("subject", filterValue);
    if (searchTerm) params.append("search", searchTerm);

    // Try to fetch from API
    let notes = [];
    try {
      const response = await fetch(
        `${API_BASE_URL}/notes?${params.toString()}`,
      );
      if (response.ok) {
        const data = await response.json();
        notes = data.notes || [];
      }
    } catch (apiError) {
      console.log("API not available, using local storage");
      // Fallback to local storage
      const { notes: localNotes = [] } =
        await chrome.storage.local.get("notes");
      notes = localNotes;

      // Apply filters locally
      if (searchTerm) {
        notes = notes.filter(
          (note) =>
            note.content.toLowerCase().includes(searchTerm) ||
            note.tags?.some((tag) => tag.toLowerCase().includes(searchTerm)),
        );
      }
      if (filterValue !== "all") {
        notes = notes.filter((note) => note.subject === filterValue);
      }
    }

    renderNotes(notes);
  } catch (error) {
    console.error("Error loading notes:", error);
    renderNotes([]);
  }
}

// Render Notes List
function renderNotes(notes) {
  if (!notesList) return;

  if (notes.length === 0) {
    notesList.innerHTML =
      '<p class="empty-state">📝 No notes found. Start by adding your first note!</p>';
    return;
  }

  notesList.innerHTML = notes
    .map(
      (note) => `
    <div class="note-card" data-id="${note.id}">
      <button class="note-delete" onclick="deleteNote('${note.id}')">✕</button>
      <div class="note-subject">${note.subject || "Other"}</div>
      <div class="note-content">${truncateText(note.content, 120)}</div>
      <div class="note-meta">
        <div class="note-tags">
          ${(note.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("")}
        </div>
        <span class="note-date">${formatDate(note.timestamp)}</span>
      </div>
    </div>
  `,
    )
    .join("");
}

// Delete Note from MongoDB
window.deleteNote = async function (noteId) {
  try {
    // Delete from API
    try {
      await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: "DELETE",
      });
    } catch (apiError) {
      console.log("API delete failed, removing locally");
    }

    // Also remove from local storage
    const { notes = [] } = await chrome.storage.local.get("notes");
    const updatedNotes = notes.filter(
      (note) => note.id !== noteId && String(note.id) !== noteId,
    );
    await chrome.storage.local.set({ notes: updatedNotes });

    loadNotes();
    showClippyMessage("Note deleted! 🗑️");
  } catch (error) {
    console.error("Error deleting note:", error);
  }
};

// Export Notes
exportBtn?.addEventListener("click", async () => {
  try {
    // Fetch all notes from API
    let notes = [];
    try {
      const response = await fetch(`${API_BASE_URL}/notes`);
      if (response.ok) {
        const data = await response.json();
        notes = data.notes || [];
      }
    } catch (apiError) {
      const { notes: localNotes = [] } =
        await chrome.storage.local.get("notes");
      notes = localNotes;
    }

    if (notes.length === 0) {
      showClippyMessage("No notes to export yet! 📝");
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      noteCount: notes.length,
      notes: notes,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `clippy-notes-${new Date().toISOString().split("T")[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showClippyMessage("Notes exported! Check your downloads! 📤");
  } catch (error) {
    console.error("Error exporting notes:", error);
  }
});

// Clear All Notes
clearBtn?.addEventListener("click", async () => {
  if (
    confirm("Are you sure you want to delete ALL notes? This cannot be undone!")
  ) {
    try {
      // Clear from API
      try {
        await fetch(`${API_BASE_URL}/notes`, {
          method: "DELETE",
        });
      } catch (apiError) {
        console.log("API clear failed");
      }

      // Clear local storage
      await chrome.storage.local.set({ notes: [] });
      loadNotes();
      showClippyMessage("All notes cleared! Fresh start! 🌱");
    } catch (error) {
      console.error("Error clearing notes:", error);
    }
  }
});

// Search and Filter
searchInput?.addEventListener("input", loadNotes);
filterSubject?.addEventListener("change", loadNotes);

// Utility Functions
function showStatus(type, message) {
  if (!saveStatus) return;
  saveStatus.className = `status ${type}`;
  saveStatus.textContent = message;
  setTimeout(() => {
    saveStatus.className = "status";
  }, 3000);
}

function showClippyMessage(message) {
  if (!clippySpeech) return;
  clippySpeech.textContent = message;
  clippySpeech.style.display = "block";
  setTimeout(() => {
    clippySpeech.style.display = "";
  }, 3000);
}

function rotateClippyMessage() {
  let index = 0;
  setInterval(() => {
    if (clippySpeech) {
      clippySpeech.textContent = clippyMessages[index];
      index = (index + 1) % clippyMessages.length;
    }
  }, 10000);
}

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getCurrentTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab?.url || "";
  } catch {
    return "";
  }
}

async function getCurrentTabTitle() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab?.title || "";
  } catch {
    return "";
  }
}

async function checkForSelection() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://")
    ) {
      showClippyMessage(
        "Can't capture from browser pages. Try a regular website! 🌐",
      );
      return;
    }
  } catch (error) {
    console.error("Error checking selection:", error);
  }
}

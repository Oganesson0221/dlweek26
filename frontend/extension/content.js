// Clippy Notes Extension - Content Script
// This script runs on all web pages and enables text selection capture

(function () {
  "use strict";

  const API_BASE_URL = "https://coursepilot-qyw8.onrender.com";

  // Create floating save button
  let floatingBtn = null;
  let selectedText = "";
  let selectionRect = null;

  // Create the floating button element
  function createFloatingButton() {
    if (floatingBtn) return;

    floatingBtn = document.createElement("div");
    floatingBtn.id = "clippy-floating-btn";
    floatingBtn.innerHTML = `
      <img src="${chrome.runtime.getURL("icons/clippy-32.png")}" alt="Save to Clippy" />
      <span>Save Note</span>
    `;
    floatingBtn.style.cssText = `
      position: fixed;
      z-index: 999999;
      display: none;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: linear-gradient(135deg, #0078d4, #50a0e0);
      color: white;
      border-radius: 20px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 120, 212, 0.25);
      transition: all 0.2s ease;
      user-select: none;
    `;

    floatingBtn.querySelector("img").style.cssText = `
      width: 20px;
      height: 20px;
    `;

    floatingBtn.addEventListener("mouseenter", () => {
      floatingBtn.style.transform = "scale(1.05)";
      floatingBtn.style.boxShadow = "0 4px 12px rgba(0, 120, 212, 0.35)";
    });

    floatingBtn.addEventListener("mouseleave", () => {
      floatingBtn.style.transform = "scale(1)";
      floatingBtn.style.boxShadow = "0 2px 8px rgba(0, 120, 212, 0.25)";
    });

    floatingBtn.addEventListener("click", handleSaveClick);

    document.body.appendChild(floatingBtn);
  }

  // Handle text selection
  document.addEventListener("mouseup", (e) => {
    // Ignore clicks on our button
    if (e.target.closest("#clippy-floating-btn")) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text && text.length > 3) {
        selectedText = text;
        const range = selection.getRangeAt(0);
        selectionRect = range.getBoundingClientRect();
        showFloatingButton();
      } else {
        hideFloatingButton();
      }
    }, 10);
  });

  // Hide button on scroll or click elsewhere
  document.addEventListener("mousedown", (e) => {
    if (!e.target.closest("#clippy-floating-btn")) {
      hideFloatingButton();
    }
  });

  // Show floating button near selection
  function showFloatingButton() {
    createFloatingButton();

    // Position the button above the selection
    const btnWidth = 120;
    const btnHeight = 36;
    let left = selectionRect.left + selectionRect.width / 2 - btnWidth / 2;
    let top = selectionRect.top - btnHeight - 10;

    // Ensure button stays within viewport
    left = Math.max(10, Math.min(left, window.innerWidth - btnWidth - 10));
    if (top < 10) {
      top = selectionRect.bottom + 10;
    }

    floatingBtn.style.left = `${left}px`;
    floatingBtn.style.top = `${top}px`;
    floatingBtn.style.display = "flex";

    // Animate in
    floatingBtn.style.opacity = "0";
    floatingBtn.style.transform = "translateY(10px)";

    requestAnimationFrame(() => {
      floatingBtn.style.opacity = "1";
      floatingBtn.style.transform = "translateY(0)";
    });
  }

  // Hide floating button
  function hideFloatingButton() {
    if (floatingBtn) {
      floatingBtn.style.display = "none";
    }
    selectedText = "";
  }

  // Handle save button click - saves directly to MongoDB API
  async function handleSaveClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedText) return;

    // Show saving state
    const originalContent = floatingBtn.innerHTML;
    floatingBtn.innerHTML = "<span>Saving...</span>";
    floatingBtn.style.background = "linear-gradient(135deg, #50a0e0, #0078d4)";

    try {
      // Save directly to MongoDB API
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: selectedText,
          subject: "Web Capture",
          sourceUrl: window.location.href,
        }),
      });

      if (!response.ok) throw new Error("Failed to save note");

      // Show success
      floatingBtn.innerHTML = "<span>✓ Saved!</span>";
      floatingBtn.style.background =
        "linear-gradient(135deg, #107c10, #16a34a)";
      showNotification("Note saved to Clippy! 📝");
    } catch (error) {
      console.error("Error saving note:", error);
      floatingBtn.innerHTML = "<span>❌ Error</span>";
      floatingBtn.style.background =
        "linear-gradient(135deg, #d13438, #ef4444)";
      showNotification(
        "Failed to save note. Make sure the backend is running.",
      );
    }

    // Reset and hide button after delay
    setTimeout(() => {
      floatingBtn.innerHTML = originalContent;
      floatingBtn.style.background =
        "linear-gradient(135deg, #0078d4, #50a0e0)";
      hideFloatingButton();
    }, 1500);
  }

  // Show toast notification
  function showNotification(message) {
    const toast = document.createElement("div");
    toast.id = "clippy-toast";
    toast.innerHTML = `
      <img src="${chrome.runtime.getURL("icons/clippy-32.png")}" alt="Clippy" />
      <span>${message}</span>
    `;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      background: #ffffff;
      color: #323130;
      border-radius: 8px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      border: 1px solid #e1dfdd;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
    `;

    toast.querySelector("img").style.cssText = `
      width: 24px;
      height: 24px;
    `;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    // Remove after delay
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Clean up on page unload
  window.addEventListener("beforeunload", () => {
    if (floatingBtn) floatingBtn.remove();
  });

  console.log("Clippy Notes content script loaded!");
})();

// Configuration
const HF_TOKEN = "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";
const API_URL = "https://router.huggingface.co/fal-ai/fal-ai/z-image/turbo";
const MAX_HISTORY = 5;

// Elements
const promptInput = document.getElementById("prompt-input");
const generateBtn = document.getElementById("generate-btn");
const surpriseBtn = document.getElementById("surprise-btn");
const historyList = document.getElementById("history-list");
const loadingState = document.getElementById("loading-state");
const imageState = document.getElementById("image-state");
const emptyState = document.getElementById("empty-state");
const generatedImage = document.getElementById("generated-image");
const downloadBtn = document.getElementById("download-btn");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");

// State
let history = JSON.parse(localStorage.getItem("imgGenHistory")) || [];

// Surprise prompts
const surprisePrompts = [
  "A futuristic cyberpunk city at night with neon lights reflecting in puddles, digital art",
  "A majestic griffin soaring through fluffy pink clouds during sunset, fantasy illustration",
  "A cozy hobbit hole interior with a crackling fireplace and old books, cinematic lighting",
  "A macro shot of a bioluminescent mushroom in a dark magical forest",
  "A hyper-realistic portrait of an astronaut floating in a nebula, highly detailed",
  "An ancient temple overgrown with glowing vines in the middle of a dense jungle",
  "A steampunk robotic owl sitting on a brass branch, intricate clockwork details"
];

// Initialization
function init() {
  renderHistory();

  generateBtn.addEventListener("click", handleGenerate);
  surpriseBtn.addEventListener("click", handleSurprise);
  downloadBtn.addEventListener("click", handleDownload);
  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  });
}

// API Call
async function query(data) {
  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("API Error Response:", errText);
    
    let errMsg = `API Error (${response.status})`;
    try {
        const errObj = JSON.parse(errText);
        let detailedError = errObj.error || errObj.message || errObj;
        if (typeof detailedError === 'object') {
            detailedError = JSON.stringify(detailedError);
        }
        errMsg = `API Error: ${detailedError}`;
    } catch (e) {
        errMsg = `API Error: ${errText}`;
    }
    
    throw new Error(errMsg);
  }

  const result = await response.json();
  if (result && result.images && result.images.length > 0) {
      return result.images[0].url;
  } else {
      throw new Error("API didn't return an image URL.");
  }
}

// Event Handlers
async function handleGenerate() {
  const prompt = promptInput.value.trim();

  if (!prompt) {
    showToast("Please enter a prompt first!");
    return;
  }

  // Update UI
  setLoadingState(true);

  try {
    const payload = {
      prompt: prompt
    };

    const imageUrl = await query(payload);

    displayImage(imageUrl);
    addToHistory(prompt);

  } catch (error) {
    console.error("Generation failed:", error);
    showToast(error.message || "Failed to generate image. Please try again.");
    setLoadingState(false);
  }
}

function handleSurprise() {
  const randomIndex = Math.floor(Math.random() * surprisePrompts.length);
  const prompt = surprisePrompts[randomIndex];

  promptInput.value = prompt;
  // trigger animation
  promptInput.style.transform = "scale(0.98)";
  setTimeout(() => promptInput.style.transform = "scale(1)", 150);
}

function handleDownload() {
  const imgSrc = generatedImage.src;
  if (!imgSrc) return;

  fetch(imgSrc)
    .then(res => res.blob())
    .then(blob => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const safeName = promptInput.value.trim().substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'generated';
      link.download = `ai_image_${safeName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(err => {
      console.error("Download error:", err);
      showToast("Failed to download automatically. Right-click the image and save.");
    });
}

// UI Helpers
function setLoadingState(isLoading) {
  generateBtn.disabled = isLoading;

  if (isLoading) {
    emptyState.classList.add("hidden");
    imageState.classList.add("hidden");
    loadingState.classList.remove("hidden");
    generateBtn.innerHTML = "Generating...";
  } else {
    loadingState.classList.add("hidden");
    generateBtn.innerHTML = "Generate";
  }
}

function displayImage(url) {
  generatedImage.src = url;

  // Wait for image to load to apply smooth transition
  generatedImage.onload = () => {
    loadingState.classList.add("hidden");
    imageState.classList.remove("hidden");
    generateBtn.disabled = false;
    generateBtn.innerHTML = "Generate";

    // Scroll to image on mobile
    if (window.innerWidth <= 900) {
      imageState.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  generatedImage.onerror = () => {
    loadingState.classList.add("hidden");
    showToast("Error: The image failed to load. API might have returned invalid data.");
    generateBtn.disabled = false;
    generateBtn.innerHTML = "Generate";
  };
}

function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// History Management
function addToHistory(prompt) {
  // Remove if exists
  history = history.filter(p => p !== prompt);
  // Add to beginning
  history.unshift(prompt);
  // Keep only max items
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY);
  }

  localStorage.setItem("imgGenHistory", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";

  if (history.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.style.color = "var(--text-muted)";
    emptyLi.style.fontSize = "0.9rem";
    emptyLi.textContent = "No recent prompts";
    historyList.appendChild(emptyLi);
    return;
  }

  history.forEach(prompt => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.textContent = prompt;
    li.title = "Click to use this prompt";

    li.addEventListener("click", () => {
      promptInput.value = prompt;
      promptInput.focus();
    });

    historyList.appendChild(li);
  });
}

// Run
init();

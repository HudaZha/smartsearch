// ===== Wikipedia Text Search =====
export async function searchByText() {
  const queryInput = document.getElementById("searchInput").value.trim();
  if (!queryInput) return alert("Please enter a search term.");

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "<p>Loading...</p>";

  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(queryInput)}`);
    if (!response.ok) throw new Error("No summary");

    const data = await response.json();
    const result = {
      title: data.title,
      snippet: data.extract,
      link: data.content_urls.desktop.page
    };

    resultDiv.innerHTML = `<h2>${result.title}</h2><p>${result.snippet}</p><a href="${result.link}" target="_blank">Read more on Wikipedia</a>`;
    window.saveSearchToDB(queryInput, [result]);
  } catch {
    resultDiv.innerHTML = `<p>No summary found</p><a href="https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(queryInput)}" target="_blank">Search on Wikipedia</a>`;
    window.saveSearchToDB(queryInput, [{ title: "No result found", snippet: "", link: "" }]);
  }
}

// ===== Repeat search from history =====
export function repeatSearch(query) {
  document.getElementById("searchInput").value = query;
  searchByText();
}

// ===== Image Search using MobileNet =====
let classifier;

window.addEventListener("DOMContentLoaded", async () => {
  showPopup("Loading MobileNet...", "⏳");

  classifier = await ml5.imageClassifier("MobileNet");
  showPopup("MobileNet loaded ✅", "✅", 1500);

  window.showSearchHistory();
});

export async function searchByImage() {
  const input = document.getElementById("imageInput");
  if (!input.files[0]) return alert("Upload an image");

  if (!classifier) return showPopup("Model not loaded", "⏳");

  const reader = new FileReader();
  reader.onload = async () => {
    const img = new Image();
    img.src = reader.result;
    img.onload = async () => {
      const results = await classifier.classify(img);
      if (!results || results.length === 0) {
        handleUnrecognizedImage();
        return;
      }
      const top = results[0];
      if (!top.label || top.confidence < 0.3) {
        handleUnrecognizedImage();
        return;
      }
      document.getElementById("searchInput").value = top.label;
      showPopup(`Identified as "${top.label}" (${(top.confidence*100).toFixed(0)}%)`, "✅");
      searchByText();
    };
  };
  reader.readAsDataURL(input.files[0]);
}

// ===== Handle unrecognized image =====
function handleUnrecognizedImage() {
  document.getElementById("result").innerHTML = `<p>No result found for this image</p>`;
  showPopup("No relevant result found", "❌");
  window.saveSearchToDB("Unrecognized Image", [{ title: "No result", snippet: "", link: "" }]);
}

// ===== Popup modal =====
export function showPopup(message, emoji="🖼️", timeout=0) {
  const modal = document.getElementById("popupModal");
  document.getElementById("popupText").innerText = message;
  document.getElementById("popupImage").innerText = emoji;
  modal.classList.remove("hidden");
  if (timeout>0) setTimeout(closePopup, timeout);
}

export function closePopup() {
  document.getElementById("popupModal").classList.add("hidden");
}

// ===== Make functions global for buttons =====
window.searchByText = searchByText;
window.searchByImage = searchByImage;
window.closePopup = closePopup;
window.repeatSearch = repeatSearch;

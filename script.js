// ===== Import Firestore functions =====
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ===== Save search to Firestore =====
async function saveSearchToDB(queryText, results) {
  try {
    const db = window.db;
    if (!db) return console.error("Firestore not initialized!");

    await addDoc(collection(db, "searches"), {
      query: queryText,
      results,
      timestamp: serverTimestamp()
    });

    console.log("✅ Search saved:", queryText);
    showSearchHistory();
  } catch (err) {
    console.error("❌ Failed to save search:", err);
  }
}

// ===== Show last 5 searches =====
async function showSearchHistory() {
  const db = window.db;
  if (!db) return;

  try {
    const q = query(collection(db, "searches"), orderBy("timestamp", "desc"), limit(5));
    const snapshot = await getDocs(q);

    let html = "<h3>Recent Searches</h3><ul>";
    snapshot.forEach(doc => {
      const data = doc.data();
      html += `<li onclick="repeatSearch('${data.query}')">${data.query}</li>`;
    });
    html += "</ul>";

    document.getElementById("searchHistory").innerHTML = html;
  } catch (err) {
    console.error("❌ Error loading history:", err);
  }
}

// ===== Wikipedia Text Search =====
export function searchByText() {
  const queryInput = document.getElementById("searchInput").value.trim();
  if (!queryInput) return alert("Please enter a search term.");

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "<p>Loading...</p>";

  fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(queryInput)}`)
    .then(res => res.ok ? res.json() : Promise.reject("No summary"))
    .then(data => {
      const result = {
        title: data.title,
        snippet: data.extract,
        link: data.content_urls.desktop.page
      };

      resultDiv.innerHTML = `<h2>${result.title}</h2><p>${result.snippet}</p><a href="${result.link}" target="_blank">Read more on Wikipedia</a>`;
      saveSearchToDB(queryInput, [result]);
    })
    .catch(() => {
      resultDiv.innerHTML = `<p>No summary found</p><a href="https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(queryInput)}" target="_blank">Search on Wikipedia</a>`;
      saveSearchToDB(queryInput, [{ title: "No result found", snippet: "", link: "" }]);
    });
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

  showSearchHistory();
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
  saveSearchToDB("Unrecognized Image", [{ title: "No result", snippet: "", link: "" }]);
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


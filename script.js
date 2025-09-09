// ===== Firestore search functions =====
async function saveSearchToDB(query, results) {
  try {
    const { collection, addDoc, serverTimestamp } = window.fsImports;
    const db = window.db;
    if (!db) {
      console.error("❌ Firestore not initialized");
      return;
    }

    await addDoc(collection(db, "searches"), {
      query,
      results,
      timestamp: serverTimestamp()
    });

    console.log("✅ Saved search to Firestore:", query);
    showSearchHistory();
  } catch (err) {
    console.error("❌ Error saving to Firestore:", err);
  }
}

async function showSearchHistory() {
  try {
    const { collection, getDocs, query, orderBy, limit } = window.fsImports;
    const db = window.db;

    const q = query(collection(db, "searches"), orderBy("timestamp", "desc"), limit(5));
    const snapshot = await getDocs(q);

    let historyHTML = "<h3>Recent Searches</h3><ul>";
    snapshot.forEach((doc) => {
      const data = doc.data();
      historyHTML += `<li onclick="repeatSearch('${data.query}')">${data.query}</li>`;
    });
    historyHTML += "</ul>";

    document.getElementById("searchHistory").innerHTML = historyHTML;
  } catch (err) {
    console.error("❌ Error fetching history:", err);
  }
}

// ===== Text search =====
function searchByText() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return alert("Please enter a search term.");

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "<p>Loading...</p>";

  fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)
    .then(response => {
      if (!response.ok) throw new Error("No summary found.");
      return response.json();
    })
    .then(data => {
      const result = {
        title: data.title,
        snippet: data.extract,
        link: data.content_urls.desktop.page
      };

      resultDiv.innerHTML = `
        <h2>${result.title}</h2>
        <p>${result.snippet}</p>
        <a href="${result.link}" target="_blank">Read more on Wikipedia</a>
      `;

      saveSearchToDB(query, [result]);
      showSearchHistory();
    })
    .catch(() => {
      resultDiv.innerHTML = `
        <p>No direct Wikipedia summary found.</p>
        <a href="https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}" target="_blank">
          Search "${query}" on Wikipedia
        </a>
      `;

      saveSearchToDB(query, [{ title: "No result found", snippet: "", link: "" }]);
      showSearchHistory();
    });
}

// ===== Image search with MobileNet =====
let classifier;

window.addEventListener("DOMContentLoaded", () => {
  showPopup("Loading MobileNet model...", "⏳");

  ml5.imageClassifier("MobileNet")
    .then(model => {
      classifier = model;
      console.log("✅ MobileNet preloaded and ready");
      showPopup("MobileNet loaded successfully", "✅", 2000);
    })
    .catch(err => {
      console.error("❌ MobileNet preload error:", err);
      showPopup("Failed to load MobileNet", "❌", 3000);
    });

  const imageInput = document.getElementById("imageInput");
  if (imageInput) {
    imageInput.addEventListener("change", searchByImage);
  }

  showSearchHistory();
});

function searchByImage() {
  const input = document.getElementById("imageInput");
  if (!input || !input.files || !input.files[0]) {
    alert("Please upload an image.");
    return;
  }

  if (!classifier) {
    showPopup("Model not loaded yet. Please wait.", "⏳");
    return;
  }

  showPopup("Analyzing image...", "🔎");

  const reader = new FileReader();
  reader.onload = function () {
    const img = new Image();
    img.src = reader.result;

    img.onload = function () {
      classifier.classify(img)
        .then(results => {
          if (!results || results.length === 0) {
            handleUnrecognizedImage();
            return;
          }

          const top = results[0];
          const label = top.label || "";
          const confidence = top.confidence || 0;

          if (!label || confidence < 0.3) {
            handleUnrecognizedImage();
            return;
          }

          document.getElementById("searchInput").value = label;
          showPopup(`Identified as "${label}" (${(confidence * 100).toFixed(0)}%)`, "✅");

          searchByText();
        })
        .catch(err => {
          console.error("❌ Classification error:", err);
          handleUnrecognizedImage();
        });
    };

    img.onerror = function (e) {
      console.error("❌ Image failed to load:", e);
      handleUnrecognizedImage();
    };
  };

  reader.onerror = function (e) {
    console.error("❌ FileReader error:", e);
    showPopup("Image upload failed", "❌");
  };

  reader.readAsDataURL(input.files[0]);
}

function handleUnrecognizedImage() {
  document.getElementById("result").innerHTML = `<p>No relevant result found for this image.</p>`;
  showPopup("No relevant result found", "❌");

  saveSearchToDB("Unrecognized Image", [{ title: "No result found", snippet: "", link: "" }]);
  showSearchHistory();
}

// ===== Popup modal =====
function showPopup(message, emoji = "🖼️", timeout = 0) {
  const modal = document.getElementById("popupModal");
  document.getElementById("popupText").innerText = message;
  document.getElementById("popupImage").innerText = emoji;
  modal.classList.remove("hidden");
  if (timeout > 0) setTimeout(closePopup, timeout);
}

function closePopup() {
  document.getElementById("popupModal").classList.add("hidden");
}

// ===== Make global for buttons =====
window.searchByText = searchByText;
window.searchByImage = searchByImage;
window.closePopup = closePopup;
window.repeatSearch = repeatSearch;

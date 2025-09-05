// === SEARCH FUNCTIONS WITH FIRESTORE ===

// Save search result into Firestore
async function saveSearchToDB(query, results) {
  try {
    const db = window.db; // from index.html
    if (!db) {
      console.error("❌ Firestore not initialized");
      return;
    }

    const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js");

    await addDoc(collection(db, "searches"), {
      query,
      results,
      timestamp: serverTimestamp()
    });

    console.log("✅ Saved search to Firestore:", query);
  } catch (err) {
    console.error("❌ Error saving to Firestore:", err);
  }
}

// Fetch last 5 searches from Firestore
async function showSearchHistory() {
  try {
    const db = window.db;
    const { collection, getDocs, query, orderBy, limit } = await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js");

    const q = query(collection(db, "searches"), orderBy("timestamp", "desc"), limit(5));
    const querySnapshot = await getDocs(q);

    let historyHTML = "<h3>Recent Searches</h3><ul>";
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      historyHTML += `<li onclick="repeatSearch('${data.query}')">${data.query}</li>`;
    });
    historyHTML += "</ul>";

    document.getElementById("searchHistory").innerHTML = historyHTML;
  } catch (err) {
    console.error("❌ Error fetching history:", err);
  }
}

// Perform text search
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

      // Save to Firestore
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

// Perform image search
function searchByImage() {
  const input = document.getElementById("imageInput");
  if (!input.files[0]) return alert("Please upload an image.");

  showPopup("Uploading image...", "📤");

  const reader = new FileReader();
  reader.onload = function () {
    showPopup("Analyzing image...", "🔎");

    const img = new Image();
    img.src = reader.result;
    img.onload = function () {
      const model = ml5.imageClassifier("MobileNet", () => {
        model.classify(img, (err, results) => {
          if (err || !results || results.length === 0) {
            handleUnrecognizedImage();
            return;
          }

          const label = results[0].label || "";
          const confidence = results[0].confidence || 0;

          // If no label or confidence is too low (<30%)
          if (!label || confidence < 0.3) {
            handleUnrecognizedImage();
            return;
          }

          // ✅ Valid label → Continue with text search
          document.getElementById("searchInput").value = label;
          showPopup(`Identified as "${label}"`, "✅");
          searchByText();
        });
      });
    };
  };
  reader.readAsDataURL(input.files[0]);
}

// Handle unrecognized images
function handleUnrecognizedImage() {
  document.getElementById("result").innerHTML = `<p>No relevant result found for this image.</p>`;
  showPopup("No relevant result found", "❌");

  // Save as "Unrecognized Image" to Firestore
  saveSearchToDB("Unrecognized Image", [{ title: "No result found", snippet: "", link: "" }]);
  showSearchHistory();
}

// Repeat a search from history
function repeatSearch(query) {
  document.getElementById("searchInput").value = query;
  searchByText();
}

// Popup modal
function showPopup(message, emoji = "🖼️") {
  const modal = document.getElementById("popupModal");
  document.getElementById("popupText").innerText = message;
  document.getElementById("popupImage").innerText = emoji;
  modal.classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popupModal").classList.add("hidden");
}

// Load history on startup
window.onload = showSearchHistory;


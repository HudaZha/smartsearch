// === FIRESTORE SEARCH FUNCTIONS ===
async function saveSearchToDB(query, results) {
  try {
    const db = window.db;
    const user = window.auth.currentUser;
    if (!user) return;

    const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js");

    await addDoc(collection(db, "users", user.uid, "searches"), {
      query,
      results,
      timestamp: serverTimestamp()
    });
    console.log("✅ Saved search for user:", user.email);
  } catch (err) {
    console.error("❌ Error saving to Firestore:", err);
  }
}

async function showSearchHistory() {
  try {
    const db = window.db;
    const user = window.auth.currentUser;
    if (!user) return;

    const { collection, getDocs, query, orderBy, limit } = await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js");

    const q = query(collection(db, "users", user.uid, "searches"), orderBy("timestamp", "desc"), limit(5));
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

// === SEARCH FUNCTIONS ===
function searchByText() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return showPopup("Please enter a search term", "⚠️");

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
      resultDiv.innerHTML = `<p>No summary found for "${query}".</p>`;
    });
}

function searchByImage() {
  const input = document.getElementById("imageInput");
  if (!input.files[0]) return showPopup("Please upload an image", "⚠️");

  showPopup("Uploading image...", "📤");

  const reader = new FileReader();
  reader.onload = function () {
    showPopup("Searching with image...", "🔎");
    const img = new Image();
    img.src = reader.result;
    img.onload = function () {
      const model = ml5.imageClassifier("MobileNet", () => {
        model.classify(img, (err, results) => {
          if (err || !results || results.length === 0) {
            document.getElementById("result").innerHTML = `<p>Image recognition failed.</p>`;
            showPopup("Image not recognized", "❌");
            return;
          }

          const label = results[0].label;
          document.getElementById("searchInput").value = label;
          showPopup(`Identified as "${label}"`, "✅");
          searchByText();
        });
      });
    };
  };
  reader.readAsDataURL(input.files[0]);
}

function repeatSearch(query) {
  document.getElementById("searchInput").value = query;
  searchByText();
}

// === POPUP ===
function showPopup(message, emoji = "ℹ️") {
  const modal = document.getElementById("popupModal");
  document.getElementById("popupText").innerText = message;
  document.getElementById("popupImage").innerText = emoji;
  modal.classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popupModal").classList.add("hidden");
}

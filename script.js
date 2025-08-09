// ===== CONFIG =====
const backendURL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000" // Local dev
    : "https://<your-backend>.onrender.com"; // Replace with your Render backend URL

// ===== Search by Text =====
function searchByText() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return alert("Please enter a search term.");

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "<p>Loading...</p>";

  saveSearchHistory(query);

  fetch(`${backendURL}/search?query=${encodeURIComponent(query)}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        resultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
        return;
      }
      if (!data.results || data.results.length === 0) {
        resultDiv.innerHTML = `<p>No results found.</p>`;
        return;
      }

      // Show multiple search results like Google
      resultDiv.innerHTML = data.results
        .map(
          (item) => `
          <div class="search-result">
            <a href="${item.link}" target="_blank"><h3>${item.title}</h3></a>
            <p>${item.snippet}</p>
          </div>
        `
        )
        .join("");

      showSearchHistory();
    })
    .catch((err) => {
      console.error(err);
      resultDiv.innerHTML = `<p>Something went wrong while fetching results.</p>`;
    });
}

// ===== Search by Image =====
function searchByImage() {
  const input = document.getElementById("imageInput");
  if (!input.files[0]) return alert("Please upload an image.");

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

// ===== Search History =====
function saveSearchHistory(query) {
  let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  if (!history.includes(query)) {
    history.unshift(query);
    history = history.slice(0, 5);
    localStorage.setItem("searchHistory", JSON.stringify(history));
  }
}

function showSearchHistory() {
  const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  const historyHTML = history
    .map((item) => `<li onclick="repeatSearch('${item}')">${item}</li>`)
    .join("");
  document.getElementById("searchHistory").innerHTML = `<h3>Recent Searches</h3><ul>${historyHTML}</ul>`;
}

function repeatSearch(query) {
  document.getElementById("searchInput").value = query;
  searchByText();
}

window.onload = showSearchHistory;

// ===== Popup Handling =====
function showPopup(message, emoji = "🖼️") {
  const modal = document.getElementById("popupModal");
  document.getElementById("popupText").innerText = message;
  document.getElementById("popupImage").innerText = emoji;
  modal.classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popupModal").classList.add("hidden");
}


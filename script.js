// Backend URL from Render deployment
const backendURL = "https://<YOUR_BACKEND_ON_RENDER>.onrender.com"; // Replace with actual Render backend URL

function searchByText() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return alert("Please enter a search term.");

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "<p>Loading...</p>";

  saveSearchHistory(query);

  fetch(`${backendURL}/search?query=${encodeURIComponent(query)}`)
    .then(res => {
      if (!res.ok) throw new Error("Error fetching search results");
      return res.json();
    })
    .then(data => {
      const results = data.results || [];
      if (results.length === 0) {
        resultDiv.innerHTML = `<p>No results found.</p>`;
        return;
      }

      let html = `<h3>Search Results for "${query}"</h3><ul>`;
      results.forEach(r => {
        html += `
          <li>
            <a href="${r.link}" target="_blank" rel="noopener noreferrer">${r.title}</a>
            <small>${r.snippet || ""}</small>
          </li>
        `;
      });
      html += `</ul>`;
      resultDiv.innerHTML = html;

      showSearchHistory();
    })
    .catch(err => {
      console.error(err);
      resultDiv.innerHTML = `<p>Failed to fetch results. Check backend connection.</p>`;
    });
}

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

          // Run backend text search with identified label
          searchByText();
        });
      });
    };
  };
  reader.readAsDataURL(input.files[0]);
}

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
  if (history.length === 0) {
    document.getElementById("searchHistory").innerHTML = "";
    return;
  }

  const historyHTML = history.map(item => `<li onclick="repeatSearch('${item}')">${item}</li>`).join("");
  document.getElementById("searchHistory").innerHTML = `<h3>Recent Searches</h3><ul>${historyHTML}</ul>`;
}

function repeatSearch(query) {
  document.getElementById("searchInput").value = query;
  searchByText();
}

window.onload = showSearchHistory;

function showPopup(message, emoji = "🖼️") {
  const modal = document.getElementById("popupModal");
  document.getElementById("popupText").innerText = message;
  document.getElementById("popupImage").innerText = emoji;
  modal.classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popupModal").classList.add("hidden");
}

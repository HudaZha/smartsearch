function searchByText() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return alert("Please enter a search term.");

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "<p>Loading...</p>";

  saveSearchHistory(query);

  const adjustedQuery = query;

  fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(adjustedQuery)}`)
    .then(response => {
      if (!response.ok) throw new Error("No summary found.");
      return response.json();
    })
    .then(data => {
      resultDiv.innerHTML = `
        <h2>${data.title}</h2>
        <p>${data.extract}</p>
        <a href="${data.content_urls.desktop.page}" target="_blank">Read more on Wikipedia</a>
      `;
      showSearchHistory();
    })
    .catch(error => {
      resultDiv.innerHTML = `
        <p>No direct Wikipedia summary found.</p>
        <a href="https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}" target="_blank">
          Search "${query}" on Wikipedia
        </a>
      `;
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

          // Run text search with identified label
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

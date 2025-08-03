
function searchByText() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return alert("Please enter a search term.");

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "<p>Loading...</p>";

  saveSearchHistory(query);

  fetch(\`https://en.wikipedia.org/api/rest_v1/page/summary/\${encodeURIComponent(query)}\`)
    .then(response => {
      if (!response.ok) throw new Error("No summary found.");
      return response.json();
    })
    .then(data => {
      resultDiv.innerHTML = \`
        <h2>\${data.title}</h2>
        <p>\${data.extract}</p>
        <a href="\${data.content_urls.desktop.page}" target="_blank">Read more on Wikipedia</a>
      \`;
      showSearchHistory();
    })
    .catch(error => {
      resultDiv.innerHTML = \`<p>Error: \${error.message}</p>\`;
    });
}

function searchByImage() {
  const input = document.getElementById("imageInput");
  if (!input.files[0]) return alert("Please upload an image.");

  showPopup("Uploading image...", "📤");

  const reader = new FileReader();
  reader.onload = function () {
    showPopup("Searching with image...", "🔎");

    setTimeout(() => {
      document.getElementById("result").innerHTML = \`
        <p>Image search feature is coming soon.</p>
        <a href="https://images.google.com" target="_blank">Open Google Images</a>
      \`;
      showPopup("Search Complete!", "✅");
    }, 1500);
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
  const historyHTML = history.map(item => \`<li onclick="repeatSearch('\${item}')">\${item}</li>\`).join("");
  document.getElementById("searchHistory").innerHTML = \`<h3>Recent Searches</h3><ul>\${historyHTML}</ul>\`;
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

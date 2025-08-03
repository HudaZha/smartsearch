function searchByText() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return alert("Please enter a search term.");

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "<p>Loading...</p>";

  saveSearchHistory(query);

  fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)
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
      resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    });
}

async function searchByImage() {
  const input = document.getElementById("imageInput");
  if (!input.files[0]) return alert("Please upload an image.");

  showPopup("Classifying image...", "🤖");

  const reader = new FileReader();
  const img = new Image();

  reader.onload = async function (e) {
    img.src = e.target.result;
    img.onload = async () => {
      const model = await mobilenet.load();
      const predictions = await model.classify(img);
      const label = predictions[0]?.className || "Unknown";

      showPopup(`Image recognized as: ${label}`, "✅");
      document.getElementById("searchInput").value = label;
      searchByText();
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

function showPopup(message, emoji = "🖼️") {
  const modal = document.getElementById("popupModal");
  document.getElementById("popupText").innerText = message;
  document.getElementById("popupImage").innerText = emoji;
  modal.classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popupModal").classList.add("hidden");
}

window.onload = function () {
  showSearchHistory();
  document.getElementById("textSearchBtn").addEventListener("click", searchByText);
  document.getElementById("imageSearchBtn").addEventListener("click", searchByImage);
  document.getElementById("popupOkBtn").addEventListener("click", closePopup);
};

// =======================
// Save search to Firestore
// =======================
async function saveSearchData(searchType, value) {
  try {
    await window.db.collection("searchHistory").add({
      type: searchType,
      query: value,
      timestamp: new Date()
    });
    console.log("Search saved successfully!");
    loadSearchHistory(); 
  } catch (error) {
    console.error("Error saving search: ", error);
  }
}

// =======================
// Text Search
// =======================
function searchByText() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return alert("Enter a search term");

  document.getElementById("result").innerText = `Searching for: ${query}`;
  saveSearchData("text", query);
  showPopup(`Text Search: "${query}"`);
}

// =======================
// Image Search
// =======================
function searchByImage() {
  const fileInput = document.getElementById("imageInput");
  if (!fileInput.files[0]) return alert("Select an image first");

  const fileName = fileInput.files[0].name;
  document.getElementById("result").innerText = `Searching by image: ${fileName}`;
  saveSearchData("image", fileName);
  showPopup(`Image Search: "${fileName}"`, true);
}

// =======================
// Show Modal Pop-up
// =======================
function showPopup(text, isImage = false) {
  const modal = document.getElementById("popupModal");
  const popupText = document.getElementById("popupText");
  const popupImage = document.getElementById("popupImage");

  popupText.innerText = text;
  popupImage.textContent = isImage ? "🖼️" : "🔍";

  modal.classList.remove("hidden");
}

// =======================
// Close Modal
// =======================
function closePopup() {
  document.getElementById("popupModal").classList.add("hidden");
}

// =======================
// Load Search History
// =======================
async function loadSearchHistory() {
  const historyDiv = document.getElementById("searchHistory");
  historyDiv.innerHTML = "<h3>Search History:</h3><ul></ul>";
  const ul = historyDiv.querySelector("ul");

  try {
    const snapshot = await window.db.collection("searchHistory")
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement("li");
      li.textContent = `${data.type.toUpperCase()}: ${data.query}`;
      li.onclick = () => {
        if (data.type === "text") {
          document.getElementById("searchInput").value = data.query;
          searchByText();
        } else {
          alert("Cannot re-run image search from history.");
        }
      };
      ul.appendChild(li);
    });
  } catch (error) {
    console.error("Error loading search history:", error);
  }
}

// Load history on page load
window.onload = loadSearchHistory;

// Make functions global so buttons can access
window.searchByText = searchByText;
window.searchByImage = searchByImage;
window.closePopup = closePopup;


// ✅ Firestore functions (using window.db from HTML)
import { collection, addDoc, getDocs, orderBy, query as firestoreQuery, limit } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// =======================
// Save search to Firestore
// =======================
async function saveSearchData(searchType, value) {
  try {
    await addDoc(collection(window.db, "searchHistory"), {
      type: searchType,   // "text" or "image"
      query: value,
      timestamp: new Date()
    });
    console.log("Search saved successfully!");
    loadSearchHistory(); // update history immediately
  } catch (error) {
    console.error("Error saving search: ", error);
  }
}

// =======================
// Text Search
// =======================
window.searchByText = function () {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return alert("Enter a search term");

  // Display in result div
  document.getElementById("result").innerText = `Searching for: ${query}`;

  // Save to Firestore
  saveSearchData("text", query);

  // Show pop-up modal
  showPopup(`Text Search: "${query}"`);
}

// =======================
// Image Search
// =======================
window.searchByImage = function () {
  const fileInput = document.getElementById("imageInput");
  if (!fileInput.files[0]) return alert("Select an image first");

  const fileName = fileInput.files[0].name;

  // Display in result div
  document.getElementById("result").innerText = `Searching by image: ${fileName}`;

  // Save to Firestore
  saveSearchData("image", fileName);

  // Show pop-up modal
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

  if (isImage) {
    popupImage.textContent = "🖼️"; // Placeholder, you can display actual image if needed
  } else {
    popupImage.textContent = "🔍";
  }

  modal.classList.remove("hidden");
}

// =======================
// Close Modal
// =======================
window.closePopup = function () {
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
    // Fetch last 10 searches in descending order
    const q = firestoreQuery(
      collection(window.db, "searchHistory"),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement("li");
      li.textContent = `${data.type.toUpperCase()}: ${data.query}`;
      
      // Click on history item to re-search
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

// Load search history on page load
window.onload = loadSearchHistory;

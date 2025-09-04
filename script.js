// === Firebase Config ===
// Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "xxxxxx",
  appId: "xxxxxx"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// === Search by Text ===
function searchByText() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return alert("Please enter a search term.");

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "<p>Loading...</p>";

  // Fetch from Wikipedia
  fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      const results = [{
        title: data.title,
        snippet: data.extract,
        link: data.content_urls?.desktop?.page || "#"
      }];

      displayResults(results);

      // Save to Firestore
      db.collection("searches").doc(query.toLowerCase()).set({
        query: query.toLowerCase(),
        results,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        console.log("✅ Saved to Firestore");
        showSearchHistory();
      });
    })
    .catch(() => {
      resultDiv.innerHTML = "<p>No results found.</p>";
    });
}

// === Display Results ===
function displayResults(results) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = results.map(
    r => `<div class="search-result">
            <a href="${r.link}" target="_blank"><h3>${r.title}</h3></a>
            <p>${r.snippet}</p>
          </div>`
  ).join("<hr>");
}

// === Show Search History ===
function showSearchHistory() {
  db.collection("searches")
    .orderBy("timestamp", "desc")
    .limit(5)
    .get()
    .then(snapshot => {
      const historyHTML = snapshot.docs.map(
        doc => `<li onclick="repeatSearch('${doc.data().query}')">${doc.data().query}</li>`
      ).join("");
      document.getElementById("searchHistory").innerHTML = `<h3>Recent Searches</h3><ul>${historyHTML}</ul>`;
    });
}

function repeatSearch(query) {
  document.getElementById("searchInput").value = query;
  searchByText();
}

// === Image Search ===
function searchByImage() {
  const input = document.getElementById("imageInput");
  if (!input.files[0]) return alert("Please upload an image.");

  const reader = new FileReader();
  reader.onload = function () {
    const img = new Image();
    img.src = reader.result;
    img.onload = function () {
      const model = ml5.imageClassifier("MobileNet", () => {
        model.classify(img, (err, results) => {
          if (err || !results?.length) {
            document.getElementById("result").innerHTML = `<p>Image recognition failed.</p>`;
            return;
          }
          const label = results[0].label;
          document.getElementById("searchInput").value = label;
          searchByText();
        });
      });
    };
  };
  reader.readAsDataURL(input.files[0]);
}


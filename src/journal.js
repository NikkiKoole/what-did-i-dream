// src/journal.js
document.addEventListener("DOMContentLoaded", () => {
  const personaImageMap = {
    "Dr. Helga Stein": "images/circles/helga.jpg",
    "White Otter": "images/circles/otter.jpg",
    "Mrs. Clara Whitmore": "images/circles/whitmore.jpg",
    "Shaykh Zafir": "images/circles/zafir.jpg",
    Azure: "images/circles/azure.jpg",
    "Dr. Margaret Lang": "images/circles/lang.jpg",
    "Isidoro Marquez": "images/circles/marquez.jpg",
    "Brother Severinus": "images/circles/severinus.jpg",
    "Imam Yusuf ibn Kareem": "images/circles/yusuf.jpg",
    "Master Lin": "images/circles/lin.jpg",
    "Swami Pranava": "images/circles/pranava.jpg",
    "Roxy Mirage": "images/circles/roxy.jpg",
    "Dr. Lina Axon": "images/circles/axon.jpg",
    "Mother Rowan": "images/circles/rowan.jpg",
    Patchwork: "images/circles/patchwork.jpg",
  };

  let dreams = [];
  let currentDreamIndex = 0;

  const sidebar = document.getElementById("sidebar");
  const outputContainer = document.getElementById("output");
  const mobileSelector = document.getElementById("dreamSelector");
  const mobileSelectorWrapper = document.getElementById(
    "mobileSelectorWrapper",
  );

  function renderSidebar(dreamsData) {
    if (!sidebar) return;

    // Clear previous buttons (except the create button)
    sidebar.innerHTML = ""; // Clear completely first

    // Add 'Create New Entry' button
    const createButtonLink = document.createElement("a");
    createButtonLink.href = "/index.html#dream-input";
    createButtonLink.innerHTML = `
            <button id="create-new-dream-btn" class="sidebar-button create-button">
                + Create New Entry
            </button>
        `;
    sidebar.appendChild(createButtonLink);

    // Add dream buttons
    dreamsData.forEach((dream, index) => {
      const button = document.createElement("button");
      button.textContent = dream.dream_title;
      button.classList.add("sidebar-button"); // Add a common class if needed
      button.addEventListener("click", () => renderDream(index));
      sidebar.appendChild(button);
    });
  }

  function renderMobileSelector(dreamsData) {
    if (!mobileSelector) return;

    mobileSelector.innerHTML = dreamsData
      .map((d, i) => `<option value="${i}">${d.dream_title}</option>`)
      .join("");
    mobileSelector.value = currentDreamIndex;
  }

  function renderDream(index) {
    if (!outputContainer || index < 0 || index >= dreams.length) return;

    currentDreamIndex = index;
    const data = dreams[index];

    // --- Generate HTML for the selected dream ---
    outputContainer.innerHTML = `
            <div class="section">
                <h1>${data.dream_title}</h1>
            </div>

            <div class="section">
                <h2>Dream Echo</h2>
                <blockquote>${data.dream_echo}</blockquote>
            </div>

            <div class="section">
                <h2>Symbols</h2>
                <ul>${data.symbols.map((s) => `<li>${s}</li>`).join("")}</ul>
            </div>

            <div class="section">
                <h2>Interpretations</h2>
                ${data.persona_interpretations
                  .map(
                    (p) => `
                        <div class="persona-block">
                            <img class="persona-image" src="${personaImageMap[p.persona] || "images/placeholder.png"}" alt="${p.persona}" />
                            <h3>${p.persona}</h3>
                            <p>${p.interpretation}</p>
                        </div>
                    `,
                  )
                  .join("")}
            </div>

            <div class="section">
                <h2>Reflection Questions</h2>
                <ul>${data.reflection.map((r) => `<li>${r}</li>`).join("")}</ul>
            </div>

            <div class="section">
                <h2>Analysis</h2>
                ${data.analysis.map((p) => `<p>${p}</p>`).join("")}
            </div>

            <div class="section">
                <h2>Your Notes</h2>
                <textarea id="notes" placeholder="Write your thoughts, questions, or insights here..."></textarea>
            </div>
        `;

    // --- Restore and handle notes ---
    const notesField = document.getElementById("notes");
    if (notesField) {
      const storageKey = `dream-notes-${data.dream_title.replace(/\s+/g, "-")}`; // Sanitize key
      notesField.value = localStorage.getItem(storageKey) || "";
      notesField.addEventListener("input", () => {
        localStorage.setItem(storageKey, notesField.value);
      });
    }

    // --- Sync mobile selector ---
    if (mobileSelector) {
      mobileSelector.value = index;
    }

    // --- Highlight active sidebar button (Optional but good UX) ---
    if (sidebar) {
      const buttons = sidebar.querySelectorAll(
        "button:not(#create-new-dream-btn)",
      );
      buttons.forEach((btn, i) => {
        if (i === index) {
          btn.classList.add("active"); // Add an 'active' class for styling
        } else {
          btn.classList.remove("active");
        }
      });
    }
  }

  // --- Event Listener for Mobile Selector ---
  if (mobileSelector) {
    mobileSelector.addEventListener("change", (e) => {
      const newIndex = parseInt(e.target.value, 10);
      renderDream(newIndex);
    });
  }

  // --- Initial Data Fetch and Render ---
  fetch("./data.json") // Assuming data.json is in the same directory as journal.html
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      dreams = data; // Store fetched dreams
      if (dreams && dreams.length > 0) {
        renderSidebar(dreams);
        renderMobileSelector(dreams);
        renderDream(0); // Load the first dream by default
      } else {
        outputContainer.innerHTML = `<p class="section">No dream journal entries found.</p>`;
        if (sidebar) sidebar.innerHTML = ""; // Clear sidebar if no dreams
        if (mobileSelectorWrapper) mobileSelectorWrapper.style.display = "none"; // Hide selector if no dreams
      }
    })
    .catch((error) => {
      console.error("Error loading or processing dream data:", error);
      if (outputContainer) {
        outputContainer.innerHTML = `<p class="section error-message">Could not load dream journal entries. Please try again later.</p>`;
      }
      if (sidebar) sidebar.innerHTML = ""; // Clear sidebar on error
      if (mobileSelectorWrapper) mobileSelectorWrapper.style.display = "none"; // Hide selector on error
    });
}); // End DOMContentLoaded

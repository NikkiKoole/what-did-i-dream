/* ---------------- Imports & Setup ---------------- */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

/* ---------------- DOM References ---------------- */
const images = document.querySelectorAll(".lens-card img");
const buttons = document.querySelectorAll(".lens-filter button");
const cards = document.querySelectorAll(".lens-card");
//const checkboxes = document.querySelectorAll('input[name="lens"]');
const submitBtn = document.getElementById("submit-dream");
const dreamInput = document.getElementById("dream-input");
const signinModal = document.getElementById("signin-modal");
const banner = document.getElementById("free-token-banner");
const signInBtn = document.getElementById("signin-cta");

const userMenu = document.getElementById("user-menu");
const userDropdown = document.getElementById("user-dropdown");
const userAvatar = document.getElementById("user-avatar");
const userInitials = document.getElementById("user-initials");
const loginOption = document.getElementById("login-option");
const logoutOption = document.getElementById("logout-option");
const creditCountEl = document.getElementById("credit-count");

let isShrunk = false;

/* ---------------- UI & Auth ---------------- */
function updateUserUI(session) {
  if (session?.user) {
    const meta = session.user.user_metadata || {};
    const name = meta.name || meta.full_name || "dreamer";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // Avatar
    if (meta.avatar_url) {
      userAvatar.src = meta.avatar_url;
      userAvatar.style.display = "block";
      userInitials.style.display = "none";
    } else {
      userInitials.textContent = initials;
      userInitials.style.display = "block";
      userAvatar.style.display = "none";
    }

    loginOption.style.display = "none";
    logoutOption.style.display = "block";

    // Hello message
    const helloText = document.getElementById("hello-user");
    const nameSpan = document.getElementById("user-name");
    if (helloText && nameSpan) {
      nameSpan.textContent = name.split(" ")[0];
      helloText.style.display = "block";
    }

    // Fetch and display credits

    if (session?.user?.id) {
      setTimeout(() => fetchUserCredits(session.user.id), 200);
    }
  } else {
    userAvatar.src = "images/user-icon.svg";
    userAvatar.style.display = "block";
    userInitials.style.display = "none";
    loginOption.style.display = "block";
    logoutOption.style.display = "none";
    const helloText = document.getElementById("hello-user");
    if (helloText) helloText.style.display = "none";
  }
}

async function fetchUserCredits(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("credits", { head: false })
    .eq("id", userId)
    .maybeSingle();

  if (!error && data?.credits != null && creditCountEl) {
    creditCountEl.textContent = data.credits;
  } else {
    console.warn("Could not fetch user credits:", error);
  }
}

/* ---------------- Interactions ---------------- */
images.forEach((img) => {
  img.addEventListener("mousemove", (e) => {
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -10;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 10;
    img.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  });
  img.addEventListener("mouseleave", () => {
    img.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
  });
});

// filter lenses card
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.getAttribute("data-filter");
    buttons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    cards.forEach((card) => {
      const type = card.getAttribute("data-type");
      const match = filter === "all" || type === filter;
      card.style.transition = "opacity 0.3s ease";
      card.style.opacity = match ? "1" : "0";
      setTimeout(
        () => {
          card.style.display = match ? "block" : "none";
        },
        match ? 10 : 300,
      );
    });
  });
});

// cards.forEach((card) => {
//   card.addEventListener("click", () => {
//     card.classList.toggle("active");
//   });
// });
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.opacity = 1;
  setTimeout(() => {
    toast.style.opacity = 0;
  }, 2000);
}
cards.forEach((card) => {
  card.addEventListener("click", () => {
    const selectedCards = document.querySelectorAll(".lens-card.active");

    // If already active, allow deselection
    if (card.classList.contains("active")) {
      card.classList.remove("active");
      updateLensBar();
      return;
    }

    // If 3 are already selected, prevent and shake
    if (selectedCards.length >= 3) {
      card.classList.add("shake");

      // Optional: remove shake class after animation ends so it can replay
      setTimeout(() => {
        card.classList.remove("shake");
      }, 500); // Match your CSS animation duration

      // Optional: Show toast
      showToast("You can only select 3 lenses.");
      updateLensBar();
      return;
    }

    // Otherwise, allow selection
    card.classList.add("active");
    updateLensBar();
  });
});
function selectLenses(lensNames) {
  // First, clear all selections
  document.querySelectorAll(".lens-card.active").forEach((card) => {
    card.classList.remove("active");
  });

  // Then, select the ones provided
  lensNames.forEach((name) => {
    const card = document.querySelector(`.lens-card[data-name="${name}"]`);
    if (card) {
      card.classList.add("active");
    }
  });
}
submitBtn.addEventListener("click", () => {
  const input = dreamInput.value.trim();
  const selected = Array.from(checkboxes).filter((i) => i.checked);
  if (!input || selected.length === 0) {
    alert("Please enter a dream and choose at least one lens.");
    return;
  }
  signinModal.style.display = "flex";
});

window.closeModal = function () {
  signinModal.style.display = "none";
  alert("Thank you! Your dream is being interpreted.");
};

window.addEventListener("scroll", () => {
  const nav = document.querySelector(".navbar");
  const scrollY = window.scrollY;
  if (!isShrunk && scrollY > 150) {
    nav.classList.add("shrink");
    isShrunk = true;
  } else if (isShrunk && scrollY < 10) {
    nav.classList.remove("shrink");
    isShrunk = false;
  }
});

userMenu.addEventListener("click", () => {
  userDropdown.style.display =
    userDropdown.style.display === "block" ? "none" : "block";
});
document.addEventListener("click", (e) => {
  if (!userMenu.contains(e.target) && !userDropdown.contains(e.target)) {
    userDropdown.style.display = "none";
  }
});

/* ---------------- Auth State Init ---------------- */
(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  updateUserUI(session);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!session?.user && banner) banner.style.display = "block";

  supabase.auth.onAuthStateChange(async (_event, session) => {
    updateUserUI(session);

    if (session?.user) {
      const { id, email } = session.user;

      const { error } = await supabase.from("profiles").upsert(
        { id, email }, // Do not include credits here!
        { onConflict: "id" },
      );

      if (error) {
        console.warn("⚠️ Failed to upsert profile row:", error.message);
      } else {
        console.log("✅ User profile ensured");
      }
    }
  });
})();

/* ---------------- Auth Actions ---------------- */
loginOption.addEventListener("click", async () => {
  await supabase.auth.signInWithOAuth({ provider: "google" });
});

logoutOption.addEventListener("click", async () => {
  await supabase.auth.signOut();
  updateUserUI(null); // ensures logout UI updates correctly
  // Hide dropdown explicitly
  userDropdown.style.display = "none";

  // Hide credit count if present
  if (creditCountEl) creditCountEl.textContent = "";
});

/* ---------------- Dream Submission ---------------- */
submitBtn.addEventListener("click", async () => {
  const dreamText = dreamInput.value.trim();
  const lenses = Array.from(
    document.querySelectorAll('input[name="lens"]:checked'),
  ).map((cb) => cb.value);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return alert("You must be logged in to save your dream.");

  const { error } = await supabase
    .from("dreams")
    .insert([{ user_id: user.id, dream_text: dreamText, lenses }]);

  if (error) {
    console.error("Error saving dream:", error);
    alert("Something went wrong. Try again.");
  } else {
    alert("Your dream has been saved!");
    dreamInput.value = "";
    checkboxes.forEach((cb) => (cb.checked = false));
  }
});

/* ---------------- Stripe Checkout ---------------- */
document.getElementById("buy-10").addEventListener("click", async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch("/.netlify/functions/create-checkout", {
    method: "POST",
    body: JSON.stringify({ priceId: "price_1RH3rARXMCF7HbNeDG5a0icL" }),
    headers: {
      "Content-Type": "application/json",
      "x-user-email": session.user.email,
    },
  });

  const { url } = await res.json();
  window.location.href = url;
});

signInBtn?.addEventListener("click", async () => {
  await supabase.auth.signInWithOAuth({ provider: "google" });
});

document.getElementById("random-lenses").addEventListener("click", () => {
  const allCards = Array.from(document.querySelectorAll(".lens-card"));
  const shuffled = allCards.sort(() => 0.5 - Math.random());
  const randomThree = shuffled.slice(0, 3);

  // Clear current selections
  allCards.forEach((card) => card.classList.remove("active"));

  // Select the random three
  randomThree.forEach((card) => card.classList.add("active"));
  // showToast("Fate decided:");

  // Select the random three and collect names from <strong>
  const names = randomThree.map((card) => {
    const nameEl = card.querySelector("strong");
    return nameEl ? nameEl.textContent.trim() : "Unknown";
  });
  showToast("Fate decided: " + names.join(", "));

  // Update the floating lens bar
  updateLensBar();
});

function updateLensBar() {
  const lensBar = document.getElementById("selected-lenses-bar");
  const selectedCards = document.querySelectorAll(".lens-card.active");

  // Hide if nothing selected
  if (selectedCards.length === 0) {
    lensBar.classList.add("hidden");
    return;
  }

  // Build selected names from <strong>
  const lensTags = Array.from(selectedCards).map((card, index) => {
    const name = card.querySelector("strong")?.textContent.trim() || "Unknown";
    return `<span class="lens-tag" data-index="${index}">${name} <span class="remove-btn" data-index="${index}">✖</span></span>`;
  });

  lensBar.innerHTML = lensTags.join("");
  lensBar.classList.remove("hidden");

  // Hook up remove button
  lensBar.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.parentElement.textContent.trim().replace("✖", "");
      const matchingCard = Array.from(
        document.querySelectorAll(".lens-card"),
      ).find(
        (card) =>
          card.querySelector("strong")?.textContent.trim() === name.trim(),
      );
      console.log(name);
      if (matchingCard) {
        matchingCard.classList.remove("active");
        updateLensBar(); // refresh
      }
    });
  });
}

selectLenses(["helga", "otter", "whitmore"]);
updateLensBar();

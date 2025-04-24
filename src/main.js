/* Imports */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* Supabase client setup */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

/* DOM elements */
const images = document.querySelectorAll(".lens-card img");
const buttons = document.querySelectorAll(".lens-filter button");
const cards = document.querySelectorAll(".lens-card");
const checkboxes = document.querySelectorAll('input[name="lens"]');
const submitBtn = document.getElementById("submit-dream");
const signinModal = document.getElementById("signin-modal");
const banner = document.getElementById("free-token-banner");
const signInBtn = document.getElementById("signin-cta");

let isShrunk = false;

/* Utility: update user UI */
function updateUserUI(session) {
  const userMenu = document.getElementById("user-menu");
  const userDropdown = document.getElementById("user-dropdown");
  const userAvatar = document.getElementById("user-avatar");
  const userInitials = document.getElementById("user-initials");
  const loginOption = document.getElementById("login-option");
  const logoutOption = document.getElementById("logout-option");

  if (session?.user) {
    const meta = session.user.user_metadata || {};
    const name = meta.name || meta.full_name || "";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

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

    // Fetch and display user credits
    console.log(session);
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", session.user.id)
        .single();
      if (!error && data) {
        document.getElementById("credit-count").textContent = data.credits;
      }
    })();
  } else {
    userAvatar.src = "images/user-icon.svg";
    userAvatar.style.display = "block";
    userInitials.style.display = "none";
    loginOption.style.display = "block";
    logoutOption.style.display = "none";
  }

  const helloText = document.getElementById("hello-user");
  const nameSpan = document.getElementById("user-name");
  if (helloText && nameSpan && session?.user) {
    const meta = session.user.user_metadata || {};
    const name = meta.full_name || meta.name || "dreamer";
    nameSpan.textContent = name.split(" ")[0];
    helloText.style.display = "block";
  } else if (helloText) {
    helloText.style.display = "none";
  }
}

/* 3D hover effect on lens cards */
images.forEach((img) => {
  img.addEventListener("mousemove", (e) => {
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    img.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  });
  img.addEventListener("mouseleave", () => {
    img.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
  });
});

/* Filter cards by lens type */
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.getAttribute("data-filter");
    buttons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    cards.forEach((card) => {
      const type = card.getAttribute("data-type");
      if (filter === "all" || type === filter) {
        card.style.display = "block";
        card.style.opacity = "0";
        setTimeout(() => {
          card.style.transition = "opacity 0.3s ease";
          card.style.opacity = "1";
        }, 10);
      } else {
        card.style.transition = "opacity 0.3s ease";
        card.style.opacity = "0";
        setTimeout(() => {
          card.style.display = "none";
        }, 300);
      }
    });
  });
});

/* Limit lens selection to 3 */
checkboxes.forEach((cb) =>
  cb.addEventListener("change", () => {
    const checked = Array.from(checkboxes).filter((i) => i.checked);
    if (checked.length > 3) {
      cb.checked = false;
      alert("You can only select up to 3 lenses.");
    }
  }),
);

/* Submit dream: validation & modal */
submitBtn.addEventListener("click", () => {
  const input = document.getElementById("dream-input").value.trim();
  const selected = Array.from(checkboxes).filter((i) => i.checked);
  if (!input || selected.length === 0) {
    alert("Please enter a dream and choose at least one lens.");
    return;
  }
  signinModal.style.display = "flex";
});

/* Close modal callback */
function closeModal() {
  signinModal.style.display = "none";
  alert("Thank you! Your dream is being interpreted.");
}

/* Navbar shrink on scroll */
window.addEventListener("scroll", () => {
  const nav = document.querySelector(".navbar");
  const scroll = window.scrollY;
  if (!isShrunk && scroll > 150) {
    nav.classList.add("shrink");
    isShrunk = true;
  } else if (isShrunk && scroll < 10) {
    nav.classList.remove("shrink");
    isShrunk = false;
  }
});

/* Auth state & initial UI */
(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  updateUserUI(session);
  if (!session?.user && banner) banner.style.display = "block";
})();

/* Auth UI toggles */
const userMenu = document.getElementById("user-menu");
const userDropdown = document.getElementById("user-dropdown");
userMenu.addEventListener("click", () => {
  userDropdown.style.display =
    userDropdown.style.display === "block" ? "none" : "block";
});
document.addEventListener("click", (e) => {
  if (!userMenu.contains(e.target) && !userDropdown.contains(e.target)) {
    userDropdown.style.display = "none";
  }
});

/* Login/Logout */
const loginOption = document.getElementById("login-option");
const logoutOption = document.getElementById("logout-option");
loginOption.addEventListener("click", async () => {
  await supabase.auth.signInWithOAuth({ provider: "google" });
});
logoutOption.addEventListener("click", async () => {
  await supabase.auth.signOut();
  userDropdown.style.display = "none";
});

/* Save dream to database */
submitBtn.addEventListener("click", async () => {
  const dreamInput = document.getElementById("dream-input").value.trim();
  const selectedLenses = Array.from(
    document.querySelectorAll('input[name="lens"]:checked'),
  ).map((cb) => cb.value);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return alert("You must be logged in to save your dream.");

  const { error } = await supabase
    .from("dreams")
    .insert([
      { user_id: user.id, dream_text: dreamInput, lenses: selectedLenses },
    ]);
  if (error) {
    console.error("Error saving dream:", error);
    alert("Something went wrong. Try again.");
  } else {
    alert("Your dream has been saved!");
    document.getElementById("dream-input").value = "";
    checkboxes.forEach((cb) => (cb.checked = false));
  }
});

/* Purchase credits */
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

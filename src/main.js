document.addEventListener("DOMContentLoaded", () => {
  const images = document.querySelectorAll(".lens-card img");
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
});
document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".lens-filter button");
  const cards = document.querySelectorAll(".lens-card");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.getAttribute("data-filter");

      buttons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      cards.forEach((card) => {
        const type = card.getAttribute("data-type");
        if (filter === "all" || type === filter) {
          card.style.opacity = "0";
          card.style.display = "block";
          setTimeout(() => {
            card.style.opacity = "1";
            card.style.transition = "opacity 0.3s ease";
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
});
// Limit lens selection to 3
const checkboxes = document.querySelectorAll('input[name="lens"]');
checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    const checked = Array.from(checkboxes).filter((i) => i.checked);
    if (checked.length > 3) {
      checkbox.checked = false;
      alert("You can only select up to 3 lenses.");
    }
  });
});

// Submit behavior with modal trigger
document.getElementById("submit-dream").addEventListener("click", () => {
  const input = document.getElementById("dream-input").value.trim();
  const selected = Array.from(checkboxes).filter((i) => i.checked);
  if (!input || selected.length === 0) {
    alert("Please enter a dream and choose at least one lens.");
    return;
  }
  document.getElementById("signin-modal").style.display = "flex";
});

function closeModal() {
  document.getElementById("signin-modal").style.display = "none";
  alert("Thank you! Your dream is being interpreted.");
}

let isShrunk = false;

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
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// Elements
const userMenu = document.getElementById("user-menu");
const userDropdown = document.getElementById("user-dropdown");
const userAvatar = document.getElementById("user-avatar");
const userInitials = document.getElementById("user-initials");
const loginOption = document.getElementById("login-option");
const logoutOption = document.getElementById("logout-option");

// Auth UI toggle
userMenu.addEventListener("click", () => {
  userDropdown.style.display =
    userDropdown.style.display === "block" ? "none" : "block";
});

document.addEventListener("click", (e) => {
  if (!userMenu.contains(e.target) && !userDropdown.contains(e.target)) {
    userDropdown.style.display = "none";
  }
});

// Auth state
const {
  data: { session },
} = await supabase.auth.getSession();
updateUserUI(session);

supabase.auth.onAuthStateChange((_event, session) => {
  updateUserUI(session);
});

// Update user circle
function updateUserUI(session) {
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
  } else {
    userAvatar.src = "images/user-icon.svg";
    userAvatar.style.display = "block";
    userInitials.style.display = "none";
    loginOption.style.display = "block";
    logoutOption.style.display = "none";
  }
}

// Login
loginOption.addEventListener("click", async () => {
  await supabase.auth.signInWithOAuth({ provider: "google" });
});

// Logout
logoutOption.addEventListener("click", async () => {
  await supabase.auth.signOut();
  userDropdown.style.display = "none";
});

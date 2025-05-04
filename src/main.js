/* ---------------- Imports & Setup ---------------- */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

/* ---------------- DOM References ---------------- */
// General UI
const navbar = document.querySelector(".navbar");
const toast = document.getElementById("toast");
const banner = document.getElementById("free-token-banner"); // Free token banner
const signInBtn = document.getElementById("signin-cta"); // Banner sign-in button

// Hero / Dream Input
const dreamInput = document.getElementById("dream-input");
const submitBtn = document.getElementById("submit-dream");
const helloUserText = document.getElementById("hello-user");
const userNameSpan = document.getElementById("user-name");

// Lenses
const images = document.querySelectorAll(".lens-card img"); // Lens images for hover effect
const filterButtons = document.querySelectorAll(".lens-filter button"); // Lens type filter buttons
const lensCards = document.querySelectorAll(".lens-card"); // All lens cards
const selectedLensesBar = document.getElementById("selected-lenses-bar"); // Floating bar for selected lenses
const randomLensesBtn = document.getElementById("random-lenses"); // Random selection button

// User Menu / Auth
const userMenu = document.getElementById("user-menu"); // Circle icon
const userDropdown = document.getElementById("user-dropdown"); // Dropdown container
const userAvatar = document.getElementById("user-avatar"); // Img tag for avatar
const userInitials = document.getElementById("user-initials"); // Span for initials
const loginOption = document.getElementById("login-option"); // Sign In list item
const logoutOption = document.getElementById("logout-option"); // Sign Out list item
const creditCountEl = document.getElementById("credit-count"); // Credit display element
const tokenCountEl = document.getElementById("token-count"); // Credit/token display element
const journalNavItem = document.getElementById("journal-nav-item"); // Journal link in nav

// Pricing / Checkout
const buyButtons = document.querySelectorAll(".buy-token-button"); // All purchase buttons

// Modal (If still used, otherwise remove)
// const signinModal = document.getElementById("signin-modal");

/* ---------------- State Variables ---------------- */
let isNavbarShrunk = false;
let initialAuthCheckDone = false; // Flag to ensure initial auth logic runs only once

/* ---------------- UI Functions ---------------- */

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  // Ensure transition starts from opacity 0 iftoast was hidden quickly
  toast.style.transition = "none";
  toast.style.opacity = 0;
  // Force reflow/repaint
  toast.offsetHeight;
  // Apply transition and fade in
  toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  toast.classList.add("show"); // Add class to trigger transform etc.
  toast.style.opacity = 1;

  // Fade out after delay
  setTimeout(() => {
    toast.style.opacity = 0;
    toast.classList.remove("show");
  }, 2500); // Increased duration slightly
}

function updateUserUI(session) {
  const isLoggedIn = !!session?.user;

  if (isLoggedIn) {
    const user = session.user;
    const meta = user.user_metadata || {};
    const name = meta.name || meta.full_name || "dreamer";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // --- Update Avatar/Initials ---
    if (meta.avatar_url) {
      userAvatar.src = meta.avatar_url;
      userAvatar.style.display = "block";
      userInitials.style.display = "none";
    } else {
      userInitials.textContent = initials;
      userInitials.style.display = "block";
      userAvatar.style.display = "none";
    }

    // --- Update Dropdown Menu ---
    if (loginOption) loginOption.style.display = "none";
    if (logoutOption) logoutOption.style.display = "block";

    // --- Update Hello Message ---
    if (helloUserText && userNameSpan) {
      userNameSpan.textContent = name.split(" ")[0]; // Show first name
      helloUserText.style.display = "block"; // Or 'flex' etc. based on CSS
    }

    // --- Show Journal Link ---
    if (journalNavItem) {
      journalNavItem.style.display = "list-item"; // Or 'block'
    }

    // --- Fetch and Display Credits ---
    // Check element exists before fetching
    if (user.id && creditCountEl) {
      fetchUserCredits(user.id);
    } else if (creditCountEl) {
      // Hide credits if element exists but user ID doesn't (shouldn't happen here)
      creditCountEl.style.display = "none";
      tokenCountEl.style.display = "none";
    }

    // --- Hide Free Token Banner ---
    if (banner) {
      banner.style.display = "none";
    }
  } else {
    // --- Logged Out State ---

    // --- Update Avatar/Initials (Default) ---
    userAvatar.src = "images/user-icon.svg";
    userAvatar.style.display = "block";
    userInitials.style.display = "none";

    // --- Update Dropdown Menu ---
    if (loginOption) loginOption.style.display = "block"; // Or 'list-item'
    if (logoutOption) logoutOption.style.display = "none";

    // --- Hide Hello Message ---
    if (helloUserText) helloUserText.style.display = "none";

    // --- Hide Journal Link ---
    if (journalNavItem) {
      journalNavItem.style.display = "none";
    }

    // --- Hide Credits ---
    if (creditCountEl) {
      creditCountEl.textContent = ""; // Clear text
      creditCountEl.style.display = "none";
    }
    if (tokenCountEl) {
      tokenCountEl.textContent = ""; // Clear text
      tokenCountEl.style.display = "none";
    }

    // NOTE: Banner display logic is handled in the initial auth check
  }
}

async function fetchUserCredits(userId) {
  // Ensure element exists before proceeding
  if (!creditCountEl) {
    console.warn("Credit count element not found.");
    return;
  }
  if (!tokenCountEl) {
    console.warn("Token count element not found.");
    return;
  }

  try {
    const { data, error, status } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .maybeSingle(); // Use maybeSingle to handle potential null profile gracefully

    if (error && status !== 406) {
      // 406 is expected if row doesn't exist with maybeSingle
      throw error;
    }

    if (data?.credits != null) {
      creditCountEl.textContent = `${data.credits}`; // Add label for clarity
      creditCountEl.style.display = "inline-block"; // Or 'flex', 'block' etc.

      tokenCountEl.textContent = `${data.credits}`; // Add label for clarity
      tokenCountEl.style.display = "inline-block"; // Or 'flex', 'block' etc.
    } else {
      // Profile might exist but credits are null, or profile doesn't exist yet
      console.log(
        "User profile found, but credits are null or profile not yet created with credits.",
      );
      creditCountEl.textContent = "0"; // Display 0 if no credits found/profile missing
      creditCountEl.style.display = "inline-block";

      tokenCountEl.textContent = "0"; // Display 0 if no credits found/profile missing
      tokenCountEl.style.display = "inline-block";
    }
  } catch (error) {
    console.error("Error fetching user credits:", error);
    creditCountEl.textContent = ""; // Clear on error
    creditCountEl.style.display = "none"; // Hide on error

    tokenCountEl.textContent = ""; // Clear on error
    tokenCountEl.style.display = "none"; // Hide on error
  }
}

function updateLensBar() {
  if (!selectedLensesBar) return;

  const selectedCards = document.querySelectorAll(".lens-card.active");

  if (selectedCards.length === 0) {
    selectedLensesBar.classList.add("hidden");
    selectedLensesBar.innerHTML = ""; // Clear content
    return;
  }

  const lensTagsHTML = Array.from(selectedCards)
    .map((card) => {
      const name = card.dataset.name; // Use data-name for consistency
      const displayName =
        card.querySelector("strong")?.textContent.trim() || name || "Unknown";
      const imageSrc =
        card.querySelector("img")?.src || `images/circles/${name}.jpg`; // Fallback image path
      // Use data-name on the remove button for easier card finding
      return `
          <span class="lens-tag" data-name="${name}">
              <img class='lens-tag-img' src="${imageSrc}" alt="${displayName}">
              ${displayName}
              <span class="remove-btn" data-name="${name}" aria-label="Remove ${displayName}">✖</span>
          </span>`;
    })
    .join("");

  selectedLensesBar.innerHTML = lensTagsHTML;
  selectedLensesBar.classList.remove("hidden");

  // Re-attach event listeners for the new remove buttons
  selectedLensesBar.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent card click if bar overlaps
      const nameToRemove = btn.dataset.name;
      const cardToRemove = document.querySelector(
        `.lens-card[data-name="${nameToRemove}"]`,
      );
      if (cardToRemove) {
        cardToRemove.classList.remove("active");
        updateLensBar(); // Refresh the bar after removal
      }
    });
  });
}

// Helper to select initial/random lenses
function selectLensesByName(lensNames) {
  // Clear all existing selections first
  lensCards.forEach((card) => card.classList.remove("active"));

  // Select the ones provided by name
  lensNames.forEach((name) => {
    const card = document.querySelector(`.lens-card[data-name="${name}"]`);
    if (card) {
      card.classList.add("active");
    } else {
      console.warn(`Lens card with data-name="${name}" not found.`);
    }
  });
  // Update the UI bar after selection
  updateLensBar();
}

/* ---------------- Event Listeners & Interactions ---------------- */

// --- Lens Image Hover Effect ---
images.forEach((img) => {
  img.addEventListener("mousemove", (e) => {
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -10; // Less intense rotation
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 10;
    img.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`; // Add perspective
    img.style.transition = "transform 0.05s linear"; // Faster transition while moving
  });
  img.addEventListener("mouseleave", () => {
    img.style.transform =
      "perspective(500px) rotateX(0deg) rotateY(0deg) scale(1)";
    img.style.transition = "transform 0.3s ease"; // Slower transition on leave
  });
});

// --- Lens Type Filtering ---
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.getAttribute("data-filter");

    // Update active button state
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    // Filter cards (using opacity transition for smoothness)
    lensCards.forEach((card) => {
      const type = card.getAttribute("data-type");
      const shouldShow = filter === "all" || type === filter;

      // Apply opacity transition
      card.style.transition = "opacity 0.3s ease, transform 0.3s ease"; // Added transform
      card.style.opacity = shouldShow ? "1" : "0";
      card.style.transform = shouldShow ? "scale(1)" : "scale(0.95)"; // Slight scale effect

      // Use setTimeout to change display after opacity transition starts
      // This prevents jumpy behavior if display changes instantly
      if (shouldShow) {
        // If showing, remove display:none immediately or after a very short delay
        card.style.display = "flex"; // Assuming flex layout for cards
      } else {
        // If hiding, set display:none *after* the opacity transition duration
        setTimeout(() => {
          card.style.display = "none";
        }, 300); // Match CSS transition duration
      }
    });
  });
});

// --- Lens Card Selection ---
lensCards.forEach((card) => {
  card.addEventListener("click", () => {
    const isActive = card.classList.contains("active");
    const selectedCount = document.querySelectorAll(".lens-card.active").length;

    if (isActive) {
      // Allow deselection
      card.classList.remove("active");
    } else {
      // Check limit before selecting
      if (selectedCount >= 3) {
        showToast("You can select up to 3 lenses.");
        // Shake the card that was clicked
        card.classList.add("shake");
        setTimeout(() => card.classList.remove("shake"), 400); // Corresponds to CSS animation
        return; // Stop further processing
      } else {
        // Allow selection
        card.classList.add("active");
      }
    }
    // Update the floating bar display
    updateLensBar();
  });
});

// --- Random Lens Selection ---
if (randomLensesBtn) {
  randomLensesBtn.addEventListener("click", () => {
    const allLensNames = Array.from(lensCards).map((card) => card.dataset.name);
    // Shuffle the array
    for (let i = allLensNames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allLensNames[i], allLensNames[j]] = [allLensNames[j], allLensNames[i]]; // Swap
    }
    const randomThreeNames = allLensNames.slice(0, 3);
    selectLensesByName(randomThreeNames);
    showToast("Fate has chosen your lenses!");
  });
}

// --- Navbar Shrink on Scroll ---
window.addEventListener(
  "scroll",
  () => {
    if (!navbar) return;
    const scrollY = window.scrollY;
    if (!isNavbarShrunk && scrollY > 100) {
      // Adjust threshold as needed
      navbar.classList.add("shrink");
      isNavbarShrunk = true;
    } else if (isNavbarShrunk && scrollY < 50) {
      navbar.classList.remove("shrink");
      isNavbarShrunk = false;
    }
  },
  { passive: true },
); // Use passive listener for scroll performance

// --- User Dropdown Menu Toggle ---
if (userMenu) {
  userMenu.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent document click handler from closing immediately
    const isDisplayed = userDropdown.style.display === "block";
    userDropdown.style.display = isDisplayed ? "none" : "block";
  });
}

// --- Close Dropdown on Outside Click ---
document.addEventListener("click", (e) => {
  if (userDropdown && userDropdown.style.display === "block") {
    if (!userMenu.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.style.display = "none";
    }
  }
});

// --- Submit Dream ---
if (submitBtn) {
  submitBtn.addEventListener("click", async () => {
    const dreamText = dreamInput.value.trim();
    const selectedLensNames = Array.from(
      document.querySelectorAll(".lens-card.active"),
    ).map((card) => card.dataset.name);

    // --- Validation Checks ---
    if (!dreamText) {
      showToast("Please type a few lines about your dream.");
      dreamInput.focus();
      dreamInput.classList.add("shake"); // Shake effect on input
      setTimeout(() => dreamInput.classList.remove("shake"), 400);
      return;
    }
    if (selectedLensNames.length === 0) {
      showToast("Please select at least one lens.");
      // Maybe scroll to lenses or shake the lens section?
      const lensesSection = document.getElementById("lenses");
      if (lensesSection)
        lensesSection.scrollIntoView({ behavior: "smooth", block: "center" });
      selectedLensesBar.classList.add("shake"); // Shake the bar
      setTimeout(() => selectedLensesBar.classList.remove("shake"), 400);
      return;
    }

    // --- Check Login State ---
    const {
      data: { session },
    } = await supabase.auth.getSession(); // More efficient than getUser here
    if (!session?.user) {
      showToast("Please sign in to save and interpret your dream.");
      // Optionally shake login button or open login modal/redirect
      loginOption.parentElement.parentElement.style.display = "block"; // Show dropdown
      loginOption.classList.add("shake"); // Needs CSS for shake on li
      setTimeout(() => loginOption.classList.remove("shake"), 400);
      return;
    }

    // --- Check Credits (Client-side preliminary check) ---
    // Note: Final check MUST be server-side (in your interpretation function)
    const currentCreditsText = creditCountEl?.textContent || "0";
    const currentCredits = parseInt(currentCreditsText.replace(/\D/g, ""), 10); // Extract number

    if (isNaN(currentCredits) || currentCredits < 1) {
      showToast("You need at least 1 token to interpret a dream.");
      // Optionally shake credit count or redirect to pricing
      const pricingSection = document.getElementById("pricing");
      if (pricingSection)
        pricingSection.scrollIntoView({ behavior: "smooth", block: "center" });
      if (creditCountEl) {
        creditCountEl.classList.add("shake"); // Needs CSS for shake
        setTimeout(() => creditCountEl.classList.remove("shake"), 400);
      }
      return;
    }

    // --- Proceed with Saving/Interpretation (Placeholder) ---
    // IMPORTANT: This part should likely call your Netlify function
    // which handles saving, credit deduction (server-side!), and interpretation.
    console.log("Submitting dream for user:", session.user.id);
    console.log("Dream Text:", dreamText);
    console.log("Selected Lenses:", selectedLensNames);
    showToast("Interpreting your dream... ✨"); // Indicate processing

    // TODO: Replace with actual API call to your backend/Netlify function
    // Example:
    // try {
    //   submitBtn.disabled = true; // Prevent double clicks
    //   submitBtn.textContent = 'Interpreting...';
    //   const response = await fetch('/.netlify/functions/interpret-dream', {
    //      method: 'POST',
    //      headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${session.access_token}` // Pass token for auth
    //      },
    //      body: JSON.stringify({ dreamText, lenses: selectedLensNames })
    //   });
    //   if (!response.ok) {
    //      const errorData = await response.json();
    //      throw new Error(errorData.message || 'Interpretation failed');
    //   }
    //   const result = await response.json();
    //   showToast("Dream interpretation complete!");
    //   // Redirect to journal page with the new dream ID, or display results directly
    //   window.location.href = `/journal.html?dreamId=${result.dreamId}`;
    //   dreamInput.value = ""; // Clear input on success
    //   selectLensesByName([]); // Clear selected lenses
    // } catch (error) {
    //    console.error("Error submitting dream:", error);
    //    showToast(`Error: ${error.message}`);
    // } finally {
    //    submitBtn.disabled = false;
    //    submitBtn.textContent = 'Reveal my dream';
    // }

    // --- TEMPORARY: Simulate success and redirect to Journal (if exists) ---
    setTimeout(() => {
      showToast("Dream Saved! Redirecting...");
      // Save dream details to localStorage to be picked up by journal.js
      localStorage.setItem(
        "latestDream",
        JSON.stringify({
          dream_text: dreamText,
          lenses: selectedLensNames,
          // Add a timestamp or temporary ID if needed
          submittedAt: new Date().toISOString(),
        }),
      );
      // Clear form
      dreamInput.value = "";
      selectLensesByName([]); // Clear selected lenses
      // Redirect
      window.location.href = "/journal.html";
    }, 1500);
    //--------------------------------------------------------------------
  });
}
buyButtons.forEach((button) => {
  /* ---------------- Stripe Checkout ---------------- */
  button.addEventListener("click", async () => {
    const priceId = button.dataset.priceId;
    if (!priceId) {
      console.error("Button is missing data-price-id attribute.");
      alert("Something went wrong. Cannot proceed with purchase.");
      return;
    }

    // const {
    //   data: { session },
    // } = await supabase.auth.getSession();

    // const res = await fetch("/.netlify/functions/create-checkout", {
    //   method: "POST",
    //   body: JSON.stringify({ priceId }),
    //   headers: {
    //     "Content-Type": "application/json",
    //     "x-user-email": session.user.email,
    //   },
    // });

    // const { url } = await res.json();
    // window.location.href = url;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      // User is NOT logged in - trigger sign-in
      showToast("Please sign in to purchase tokens."); // Optional feedback
      await supabase.auth.signInWithOAuth({ provider: "google" });
      // Note: The page will redirect for OAuth. The purchase flow
      // would need to be re-initiated by the user after login.
      // A more advanced flow could store the intended purchase in
      // localStorage and resume after login, but this is simpler.
    } else {
      // User IS logged in - proceed to checkout
      try {
        const res = await fetch("/.netlify/functions/create-checkout", {
          method: "POST",
          body: JSON.stringify({ priceId: priceId }), // Use the dynamic priceId
          headers: {
            "Content-Type": "application/json",
            // Ensure the user email is correctly passed if needed by the function
            // You might need to adjust how the email is retrieved based on your function's needs
            "x-user-email": session.user.email, // Pass user email if needed by backend
            // Consider passing user ID too if your function uses it
            // "x-user-id": session.user.id
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.message ||
              `Checkout creation failed with status: ${res.status}`,
          );
        }

        const { url } = await res.json();
        if (url) {
          window.location.href = url; // Redirect to Stripe
        } else {
          throw new Error("Checkout URL not received from server.");
        }
      } catch (error) {
        console.error("Checkout Error:", error);
        showToast(`Error: ${error.message || "Could not initiate purchase."}`);
        alert(
          "Something went wrong initiating the purchase. Please try again.",
        );
      }
    }
  });
});

// --- Sign In Button (from Banner) ---
if (signInBtn) {
  signInBtn.addEventListener("click", async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  });
}

// --- Auth Action: Sign In (from Dropdown) ---
if (loginOption) {
  loginOption.addEventListener("click", async () => {
    userDropdown.style.display = "none"; // Close dropdown
    await supabase.auth.signInWithOAuth({ provider: "google" });
  });
}

// --- Auth Action: Sign Out (from Dropdown) ---
if (logoutOption) {
  logoutOption.addEventListener("click", async () => {
    userDropdown.style.display = "none"; // Close dropdown
    await supabase.auth.signOut();
    // UI update will be handled by onAuthStateChange
    showToast("You have been signed out.");
    // No need to call updateUserUI(null) here, listener handles it.
  });
}

/* ---------------- Auth State Initialization & Handling ---------------- */

// Function to handle the initial setup ONCE auth state is confirmed
const handleInitialAuthState = (session) => {
  if (initialAuthCheckDone) return; // Only run this logic once

  console.log("Handling initial auth state:", session);
  updateUserUI(session); // Update UI with the *confirmed* initial session

  // Show banner ONLY if the confirmed initial state is logged out
  if (!session?.user && banner) {
    banner.style.display = "flex"; // Use 'flex' or 'block' based on banner CSS
  } else if (banner) {
    banner.style.display = "none";
  }

  // Ensure profile exists in DB if user is logged in (best effort)
  if (session?.user) {
    const { id, email } = session.user;
    // Use .then() for non-blocking operation
    supabase
      .from("profiles")
      .upsert({ id, email }, { onConflict: "id" })
      .then(({ error }) => {
        if (error) {
          console.warn("⚠️ Initial profile upsert failed:", error.message);
        } else {
          console.log("✅ User profile ensured on initial load.");
        }
      });
  }

  initialAuthCheckDone = true; // Mark initial check complete
};

// --- Auth State Change Listener ---
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("Auth event:", event, session); // Log events for debugging

  // Handle the very first auth event received after page load
  if (!initialAuthCheckDone) {
    handleInitialAuthState(session);
  } else {
    // Handle subsequent changes (manual login/logout, token refresh etc.)
    updateUserUI(session);

    // Optional: Upsert profile again on explicit SIGNED_IN event
    // This can be useful if the initial upsert failed for some reason
    if (event === "SIGNED_IN" && session?.user) {
      const { id, email } = session.user;
      supabase
        .from("profiles")
        .upsert({ id, email }, { onConflict: "id" })
        .then(({ error }) => {
          if (error)
            console.warn("⚠️ Subsequent profile upsert failed:", error.message);
        });
    }
  }
});

/* ---------------- Initial Page Setup Calls ---------------- */

// Select default lenses on page load
selectLensesByName(["helga", "otter", "whitmore"]);
// No need to call updateUserUI here, onAuthStateChange handles it.
console.log("Main.js initialized.");

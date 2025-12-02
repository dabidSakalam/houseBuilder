// -----------------------------
// Login Script for HouseBuilder
// -----------------------------

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// Remove expired token on page load

// -----------------------------
// Redirect if already logged in
// -----------------------------
(function redirectIfLoggedIn() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const now = Math.floor(Date.now() / 1000);

    if (!decodedPayload.exp || decodedPayload.exp > now) {
      // User is logged in, redirect to home
      window.location.href = "home.html";
    } else {
      // Token expired, remove it
      localStorage.removeItem("authToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("isLoggedIn");
    }
  } catch (err) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isLoggedIn");
  }
})();


(function clearExpiredToken() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const now = Math.floor(Date.now() / 1000);
    if (decodedPayload.exp && decodedPayload.exp < now) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("isLoggedIn");
    }
  } catch (err) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
  }
})();

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showMessage("⚠️ Please fill in both fields.", "error");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/v1/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || "❌ Invalid login credentials.", "error");
      return;
    }

    showMessage("✅ Login successful! Redirecting...", "success");

    if (data.token) {
      localStorage.setItem("authToken", data.token);
      
      // ✅ Decode JWT token to get userId
      try {
        const payloadBase64 = data.token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        localStorage.setItem("userId", decodedPayload.user_id);
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }
    
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", email);

    setTimeout(() => {
      window.location.href = "home.html";
    }, 1500);
  } catch (err) {
    console.error(err);
    showMessage("⚠️ Unable to connect to server. Please try again.", "error");
  }
});

// -----------------------------
// Helper Function for Messages
// -----------------------------
function showMessage(message, type = "info") {
  let messageBox = document.querySelector(".popup-message");
  if (!messageBox) {
    messageBox = document.createElement("div");
    messageBox.classList.add("popup-message");
    document.body.appendChild(messageBox);
  }

  messageBox.textContent = message;
  messageBox.className = `popup-message ${type}`;
  messageBox.style.display = "block";

  setTimeout(() => {
    messageBox.classList.add("fade-out");
    setTimeout(() => (messageBox.style.display = "none"), 400);
  }, 2000);
}
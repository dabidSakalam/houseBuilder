// -----------------------------
// Register Script for HouseBuilder
// -----------------------------

const registerForm = document.getElementById("registerForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const messageBox = document.getElementById("messageBox");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  // -----------------------------
  // Basic validation
  // -----------------------------
  if (!name || !email || !password || !confirmPassword) {
    showMessage("⚠️ All fields are required.", "error");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("⚠️ Passwords do not match.", "error");
    return;
  }

  // -----------------------------
  // reCAPTCHA v2 validation
  // -----------------------------
  let recaptchaToken = "";
  try {
    if (typeof grecaptcha !== "undefined") {
      recaptchaToken = grecaptcha.getResponse();
    }
  } catch (err) {
    console.error("reCAPTCHA not available:", err);
  }

  if (!recaptchaToken) {
    showMessage("⚠️ Please complete the reCAPTCHA.", "error");
    return;
  }

  // -----------------------------
  // Submit to backend
  // -----------------------------
  try {
    const res = await fetch("http://localhost:3000/api/v1/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        recaptchaToken, // 👈 send token to backend
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || "❌ Registration failed.", "error");
      // Optionally reset reCAPTCHA on failure
      if (typeof grecaptcha !== "undefined") {
        grecaptcha.reset();
      }
      return;
    }

    showMessage(
      "✅ Registration successful! Redirecting to login...",
      "success"
    );

    // Reset reCAPTCHA and form on success
    if (typeof grecaptcha !== "undefined") {
      grecaptcha.reset();
    }
    registerForm.reset();

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } catch (err) {
    console.error(err);
    showMessage(
      "⚠️ Unable to connect to server. Please try again.",
      "error"
    );
    if (typeof grecaptcha !== "undefined") {
      grecaptcha.reset();
    }
  }
});

// -----------------------------
// Redirect if already logged in
// -----------------------------
(function redirectIfLoggedIn() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  try {
    const payloadBase64 = token.split(".")[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const now = Math.floor(Date.now() / 1000);

    if (!decodedPayload.exp || decodedPayload.exp > now) {
      // User is logged in, redirect to home
      window.location.href = "index.html";
    } else {
      // Token expired, remove it
      localStorage.removeItem("authToken");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("isLoggedIn");
    }
  } catch (err) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isLoggedIn");
  }
})();

// -----------------------------
// Helper function
// -----------------------------
function showMessage(message, type = "info") {
  messageBox.textContent = message;
  messageBox.className = `message-box ${type}`;
  messageBox.style.display = "block";

  setTimeout(() => {
    messageBox.style.display = "none";
  }, 3000);
}

const form = document.getElementById("resetPasswordForm");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const messageBox = document.getElementById("resetMessage"); // 👈 match HTML id

// Get token from query string
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

if (!token) {
  showMessage("Invalid reset link (missing token).", "error");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!token) return;

  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (!password || !confirmPassword) {
    return showMessage("Please fill in both password fields.", "error");
  }

  if (password !== confirmPassword) {
    return showMessage("Passwords do not match.", "error");
  }

  try {
    const res = await fetch("http://localhost:3000/api/v1/users/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return showMessage(data.message || "Could not reset password.", "error");
    }

    showMessage(data.message || "Password has been reset.", "success");

    setTimeout(() => {
      window.location.href = "./login.html";
    }, 2000);
  } catch (err) {
    console.error(err);
    showMessage("Server error. Please try again later.", "error");
  }
});

function showMessage(message, type) {
  if (!messageBox) return; // safety
  messageBox.textContent = message;
  messageBox.className = `reset-message ${type}`;
  messageBox.style.display = "block";

  setTimeout(() => {
    messageBox.style.display = "none";
  }, 4000);
}
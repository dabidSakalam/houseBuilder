const form = document.getElementById("forgotPasswordForm");
const emailInput = document.getElementById("email");
const messageBox = document.getElementById("messageBox");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  if (!email) {
    return showMessage("Please enter your email.", "error");
  }

  try {
    // ✅ FIXED: Changed from /api/users to /api/v1/users
    const res = await fetch("http://localhost:3000/api/v1/users/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned an error. Please check if the server is running.");
    }

    const data = await res.json();
    if (!res.ok) {
      return showMessage(data.message || "Something went wrong.", "error");
    }

    showMessage(data.message || "A reset link has been sent. Please check your email.", "success");
    emailInput.value = "";
  } catch (err) {
    console.error("Error:", err);
    showMessage("Could not send reset link. Please check if the server is running.", "error");
  }
});

function showMessage(message, type) {
  messageBox.textContent = message;
  messageBox.className = `message-box ${type}`;
  messageBox.style.display = "block";

  setTimeout(() => {
    messageBox.style.display = "none";
  }, 4000);
}
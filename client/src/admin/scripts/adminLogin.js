const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch('http://localhost:3000/api/v1/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      // Save JWT token
      localStorage.setItem('adminToken', data.token);
      window.location.href = './dashboard.html';
    } else {
      loginMessage.textContent = data.message;
    }
  } catch (err) {
    loginMessage.textContent = 'Server error. Try again.';
    console.error(err);
  }
});

// Optional: redirect if already logged in
if (localStorage.getItem('adminToken')) {
  window.location.href = './dashboard.html';
}

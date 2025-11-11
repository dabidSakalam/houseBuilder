// checkAdminLogin.js

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('adminToken');

  // If no token, redirect to login
  if (!token) {
    window.location.href = './adminLogin.html';
    return;
  }

  try {
    // Optional: verify token with backend
    const res = await fetch('http://localhost:3000/api/v1/admin/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      // Token invalid or expired
      localStorage.removeItem('adminToken');
      window.location.href = './adminLogin.html';
    }
    // Token valid, do nothing
  } catch (err) {
    console.error('Error verifying token:', err);
    localStorage.removeItem('adminToken');
    window.location.href = './adminLogin.html';
  }
});

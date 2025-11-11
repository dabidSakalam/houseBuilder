// users.js
const userTableBody = document.getElementById('userTableBody');
const searchInput = document.getElementById('searchUser');

const token = localStorage.getItem('adminToken');
if (!token) window.location.href = './adminLogin.html';

const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

let users = [];

// Fetch users from API
async function fetchUsers() {
  try {
    const res = await fetch('http://localhost:3000/api/v1/admin/users', { headers });
    if (!res.ok) throw new Error('Failed to fetch users');
    users = await res.json();
    renderUsers(users);
  } catch (err) {
    console.error(err);
    alert('Error loading users');
  }
}

// Render users in table
function renderUsers(list) {
  userTableBody.innerHTML = '';
  list.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${user.user_id}</td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${new Date(user.created_at).toLocaleDateString()}</td>
    `;
    userTableBody.appendChild(tr);
  });
}

// Search users
searchInput.addEventListener('input', () => {
  const term = searchInput.value.toLowerCase();
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
  );
  renderUsers(filtered);
});

// Initial fetch
fetchUsers();

const token = localStorage.getItem('adminToken');
if (!token) window.location.href = './adminLogin.html';
const headers = { 'Authorization': `Bearer ${token}` };

// ----------------- Metrics -----------------
async function loadMetrics() {
  try {
    const res = await fetch('http://localhost:3000/api/v1/admin/dashboard/metrics', { headers });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    const data = await res.json();

    document.getElementById('totalUsers').textContent = data.totalUsers;
    document.getElementById('totalAdmins').textContent = data.totalAdmins;
    document.getElementById('totalModels').textContent = data.totalModels;
    document.getElementById('totalEstimates').textContent = data.totalEstimates;
    document.getElementById('pendingEstimates').textContent = data.pendingEstimates;
    document.getElementById('completedEstimates').textContent = data.completedEstimates;
  } catch (err) {
    console.error(err);
  }
}

// ----------------- Charts -----------------
async function loadChart(url, canvasId, type='bar', colors=[]) {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to fetch chart data');
    const data = await res.json();

    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
      type,
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: type === 'bar' ? 'Count' : '',
          data: Object.values(data),
          backgroundColor: colors.length ? colors : '#00aaff'
        }]
      },
      options: { responsive: true, plugins: { legend: { display: type === 'doughnut' } }, scales: { y: { beginAtZero: true } } }
    });
  } catch (err) { console.error(err); }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('adminToken');
  window.location.href = './adminLogin.html';
});

// ----------------- Init -----------------
loadMetrics();
loadChart('http://localhost:3000/api/v1/admin/dashboard/estimates-by-city', 'cityChart', 'bar');
loadChart('http://localhost:3000/api/v1/admin/dashboard/models-by-style', 'styleChart', 'doughnut', ['#00aaff','#ffaa00','#ff4d4d','#28a745']);
loadChart('http://localhost:3000/api/v1/admin/dashboard/top-features', 'featureChart', 'bar', ['#ff6384','#36a2eb','#ffcd56','#4bc0c0','#9966ff']);

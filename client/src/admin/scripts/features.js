const featureTableBody = document.getElementById('featureTableBody');
const searchInput = document.getElementById('searchFeature');
const addFeatureBtn = document.getElementById('addFeatureBtn');

const featureModal = document.getElementById('featureModal');
const modalTitle = document.getElementById('modalTitle');
const featureForm = document.getElementById('featureForm');
const featureNameInput = document.getElementById('featureName');
const modalSubmitBtn = document.getElementById('modalSubmitBtn');
const closeBtn = document.querySelector('.close-btn');

let featureList = [];
let editingFeatureId = null;

// Fetch features
async function fetchFeatures() {
  const res = await fetch('http://localhost:3000/api/v1/admin/features');
  featureList = await res.json();
  renderFeatures(featureList);
}

// Render table
function renderFeatures(list) {
  featureTableBody.innerHTML = '';
  list.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>
        <div class="action-buttons">
          <button class="feature-action-btn edit-btn" data-id="${item.feature_id}">Edit</button>
          <button class="feature-action-btn delete-btn" data-id="${item.feature_id}">Delete</button>
        </div>
      </td>
    `;
    featureTableBody.appendChild(tr);
  });
}


// Search
searchInput.addEventListener('input', () => {
  const term = searchInput.value.toLowerCase();
  const filtered = featureList.filter(f => f.name.toLowerCase().includes(term));
  renderFeatures(filtered);
});

// Open modal for Add
addFeatureBtn.addEventListener('click', () => {
  modalTitle.textContent = 'Add Feature';
  featureNameInput.value = '';
  editingFeatureId = null;
  featureModal.style.display = 'block';
});

// Close modal
closeBtn.addEventListener('click', () => {
  featureModal.style.display = 'none';
});

// Submit modal form
featureForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = featureNameInput.value.trim();
  if (!name) return;

  const payload = { name };

  if (editingFeatureId) {
    // Edit feature
    await fetch(`http://localhost:3000/api/v1/admin/features/${editingFeatureId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } else {
    // Add new feature
    await fetch('http://localhost:3000/api/v1/admin/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  featureModal.style.display = 'none';
  fetchFeatures();
});

// Edit/Delete buttons
featureTableBody.addEventListener('click', async (e) => {
  const id = e.target.dataset.id;
  const feature = featureList.find(f => f.feature_id == id);

  if (e.target.classList.contains('edit-btn')) {
    modalTitle.textContent = 'Edit Feature';
    featureNameInput.value = feature.name;
    editingFeatureId = id;
    featureModal.style.display = 'block';
  } else if (e.target.classList.contains('delete-btn')) {
    if (!confirm(`Delete ${feature.name}?`)) return;
    await fetch(`http://localhost:3000/api/v1/admin/features/${id}`, { method: 'DELETE' });
    fetchFeatures();
  }
});

// Close modal when clicking outside content
window.addEventListener('click', (e) => {
  if (e.target == featureModal) featureModal.style.display = 'none';
});

// Initial fetch
fetchFeatures();

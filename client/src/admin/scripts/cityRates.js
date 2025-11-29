const rateTableBody = document.getElementById('rateTableBody');
const searchInput = document.getElementById('searchCity');
const addCityBtn = document.getElementById('addCityBtn');

let cityList = [];

// ===== Fetch cities from DB =====
async function fetchCities() {
  const res = await fetch('http://localhost:3000/api/v1/cityRates');
  const data = await res.json();
  cityList = data;
  renderRates(cityList);
}

// ===== Render Table =====
function renderRates(list) {
  rateTableBody.innerHTML = '';
  list.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.city}</td>
      <td>
        <button class="edit-btn" data-id="${item.id}" data-city="${item.city}">Edit</button>
        <button class="delete-btn" data-id="${item.id}" data-city="${item.city}">Delete</button>
      </td>
    `;
    rateTableBody.appendChild(tr);
  });
}

// ===== Search =====
searchInput.addEventListener('input', () => {
  const term = searchInput.value.toLowerCase();
  const filtered = cityList.filter(c => c.city.toLowerCase().includes(term));
  renderRates(filtered);
});

// ===== Modal Setup =====
const modal = document.createElement('div');
modal.className = 'modal hidden';
modal.innerHTML = `
  <div class="modal-content">
    <h2 id="modalTitle">Add City</h2>
    <form id="cityForm">
      <input type="hidden" id="cityId">
      <label>City Name</label>
      <input type="text" id="cityName" required>
      <div class="modal-actions">
        <button type="submit">Save</button>
        <button type="button" id="closeModal">Cancel</button>
      </div>
    </form>
  </div>
`;
document.body.appendChild(modal);

const cityForm = modal.querySelector('#cityForm');
const closeModalBtn = modal.querySelector('#closeModal');

function openModal(title, city = '', id = '') {
  modal.classList.remove('hidden');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('cityName').value = city;
  document.getElementById('cityId').value = id;
}
function closeModal() { modal.classList.add('hidden'); }
closeModalBtn.addEventListener('click', closeModal);

// ===== Add Button =====
addCityBtn.addEventListener('click', () => openModal('Add City'));

// ===== Handle Form Submit =====
cityForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('cityId').value;
  const city = document.getElementById('cityName').value.trim();

  if (!city) return alert('Fill all fields');

  const payload = { city };
  const method = id ? 'PUT' : 'POST';
  const url = id
    ? `http://localhost:3000/api/v1/cityRates/${id}`
    : 'http://localhost:3000/api/v1/cityRates';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  alert(data.message);
  closeModal();
  fetchCities();
});

// ===== Edit/Delete =====
rateTableBody.addEventListener('click', async (e) => {
  const id = e.target.dataset.id;
  const city = e.target.dataset.city;

  if (e.target.classList.contains('edit-btn')) {
    openModal(`Edit ${city}`, city, id);
  } else if (e.target.classList.contains('delete-btn')) {
    if (confirm(`Delete ${city}?`)) {
      const res = await fetch(`http://localhost:3000/api/v1/cityRates/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      alert(data.message);
      fetchCities();
    }
  }
});

// ===== Init =====
fetchCities();

const tableBody = document.getElementById('estimateTableBody');
const API_URL = 'http://localhost:3000/api/v1/admin/adminEstimates';
const token = localStorage.getItem('adminToken');

// ===== FETCH ALL ESTIMATES =====
async function fetchEstimates() {
  try {
    const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to fetch estimates');
    const data = await res.json();
    renderTable(data);
  } catch (err) {
    console.error(err);
  }
}

// ===== RENDER TABLE =====
function renderTable(estimates) {
  tableBody.innerHTML = '';
  estimates.forEach(est => {
    const featuresList = est.featureNames?.join(', ') || '';
    const styleName = est.style || 'N/A';
    const assumed = est.assumed_date ? new Date(est.assumed_date).toLocaleDateString() : '';
    const completed = est.complete_date ? new Date(est.complete_date).toLocaleDateString() : '';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${est.client_name}</td>
      <td>${est.bedrooms}</td>
      <td>${est.bathrooms}</td>
      <td>${styleName}</td>
      <td>${est.unit_size}</td>
      <td>${est.model_floors}</td>
      <td>${featuresList}</td>
      <td>${est.city}</td>
      <td>${est.status}</td>
      <td>${assumed}</td>
      <td>${completed}</td>
      <td>₱${Number(est.total).toLocaleString()}</td>
      <td>
        <button class="edit-btn" data-id="${est.estimate_id}">Edit</button>
        <button class="delete-btn" data-id="${est.estimate_id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
  attachRowActions();
}

// ===== EDIT / DELETE BUTTONS =====
function attachRowActions() {
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.target.dataset.id;
      if (!confirm('Delete this estimate?')) return;
      await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchEstimates();
    });
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => openEditModal(e.target.dataset.id));
  });
}

// ===== MODAL LOGIC =====
const modal = document.createElement('div');
modal.id = 'editModal';
document.body.appendChild(modal);

async function openEditModal(id) {
  try {
    const [estRes, citiesRes] = await Promise.all([
      fetch(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/cities/rates`, { headers: { Authorization: `Bearer ${token}` } })
    ]);

    if (!estRes.ok || !citiesRes.ok) throw new Error('Failed to fetch data');

    const est = await estRes.json();
    const cities = await citiesRes.json();
    const selectedFeatureIds = Array.isArray(est.features) ? est.features : [];

    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Edit Estimate</h2>
        <label>Bedrooms:
          <input type="number" id="modalBedrooms" value="${est.bedrooms || 0}" min="1" max="4">
        </label>
        <label>Bathrooms:
          <input type="number" id="modalBathrooms" value="${est.bathrooms || 0}" min="1" max="4">
        </label>
        <label>Style:
          <select id="modalStyle">
            ${est.allStyles.map(s => `<option value="${s.name}" ${est.style === s.name ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
        </label>
        <label>Unit Size (sqm):
          <input type="number" id="modalUnit" value="${est.unit_size || 0}">
        </label>
        <label>Floors:
          <select id="modalFloors">
            <option value="1" ${est.model_floors == 1 ? 'selected' : ''}>1</option>
            <option value="2" ${est.model_floors == 2 ? 'selected' : ''}>2</option>
            <option value="3" ${est.model_floors == 3 ? 'selected' : ''}>3</option>
            <option value="4" ${est.model_floors == 4 ? 'selected' : ''}>4</option>
          </select>
        </label>
        <label>City:
          <select id="modalCity">
            ${cities.map(c => `<option value="${c.city}" ${est.city === c.city ? 'selected' : ''}>${c.city}</option>`).join('')}
          </select>
        </label>
        <fieldset>
          <legend>Features:</legend>
          ${est.allFeatures.map(f => `
            <label class="modalFeatureContainer">
              <input type="checkbox" class="modalFeature" value="${f.feature_id}" ${selectedFeatureIds.includes(f.feature_id) ? 'checked' : ''}>
              <p>${f.name}</p>
            </label>
          `).join('')}
        </fieldset>
        <label>Status:
          <select id="modalStatus">
            <option value="In Progress" ${est.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Completed" ${est.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </label>
        <label>Assumed Date:
          <input type="date" id="modalAssumedDate" value="${est.assumed_date ? new Date(est.assumed_date).toISOString().split('T')[0] : ''}">
        </label>
        <p id="modalTotal">₱0</p>
        <div class="modal-buttons">
          <button id="saveBtn">Save</button>
          <button id="closeModalBtn">Close</button>
        </div>
      </div>
    `;

    const closeBtn = document.getElementById('closeModalBtn');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');

    const recalcTotal = () => {
      const updatedBedrooms = parseInt(document.getElementById('modalBedrooms').value);
      const updatedBathrooms = parseInt(document.getElementById('modalBathrooms').value);
      const updatedUnit = parseInt(document.getElementById('modalUnit').value);
      const updatedFloors = parseInt(document.getElementById('modalFloors').value);
      const styleName = document.getElementById('modalStyle').value;
      const updatedCity = document.getElementById('modalCity').value;
      const updatedFeatures = Array.from(document.querySelectorAll('.modalFeature:checked')).map(cb => parseInt(cb.value));

      const bedroomPrice = parseFloat(est.allBedrooms.find(b => b.count === updatedBedrooms)?.price || 0);
      const bathroomPrice = parseFloat(est.allBathrooms.find(b => b.count === updatedBathrooms)?.price || 0);
      const floorPrice = parseFloat(est.allFloors.find(f => f.floor_id === updatedFloors)?.price || 0);
      const stylePrice = parseFloat(est.allStyles.find(s => s.name === styleName)?.price || 0);
      const featuresPrice = est.allFeatures.filter(f => updatedFeatures.includes(f.feature_id))
                                           .reduce((a,b) => a + parseFloat(b.price), 0);
      const cityRate = parseFloat(cities.find(c => c.city === updatedCity)?.rate || 0);

      const total = (updatedUnit * cityRate) + bedroomPrice + bathroomPrice + floorPrice + stylePrice + featuresPrice;
      document.getElementById('modalTotal').innerText = `₱${total.toLocaleString()}`;
    };

    ['modalCity', 'modalBedrooms', 'modalBathrooms', 'modalUnit', 'modalFloors', 'modalStyle']
      .forEach(id => document.getElementById(id).addEventListener('input', recalcTotal));
    document.querySelectorAll('.modalFeature').forEach(cb => cb.addEventListener('change', recalcTotal));

    recalcTotal();

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.addEventListener('click', async () => {
      const updatedFeatures = Array.from(document.querySelectorAll('.modalFeature:checked')).map(cb => parseInt(cb.value));
      const updatedBedrooms = parseInt(document.getElementById('modalBedrooms').value);
      const updatedBathrooms = parseInt(document.getElementById('modalBathrooms').value);
      const updatedFloors = parseInt(document.getElementById('modalFloors').value);
      const updatedUnit = parseInt(document.getElementById('modalUnit').value);
      const updatedCity = document.getElementById('modalCity').value;
      const styleName = document.getElementById('modalStyle').value;
      const updatedStatus = document.getElementById('modalStatus').value;
      const updatedAssumedDate = document.getElementById('modalAssumedDate').value;

      const bedroomPrice = parseFloat(est.allBedrooms.find(b => b.count === updatedBedrooms)?.price || 0);
      const bathroomPrice = parseFloat(est.allBathrooms.find(b => b.count === updatedBathrooms)?.price || 0);
      const floorPrice = parseFloat(est.allFloors.find(f => f.floor_id === updatedFloors)?.price || 0);
      const stylePrice = parseFloat(est.allStyles.find(s => s.name === styleName)?.price || 0);
      const featuresPrice = est.allFeatures.filter(f => updatedFeatures.includes(f.feature_id))
                                           .reduce((a,b) => a + parseFloat(b.price), 0);
      const cityRate = parseFloat(cities.find(c => c.city === updatedCity)?.rate || 0);
      const total = (updatedUnit * cityRate) + bedroomPrice + bathroomPrice + floorPrice + stylePrice + featuresPrice;

      const updated = {
        bedrooms: updatedBedrooms,
        bathrooms: updatedBathrooms,
        floors: updatedFloors,
        unit_size: updatedUnit,
        city: updatedCity,
        style: styleName, // send name instead of ID
        features: updatedFeatures,
        model_id: est.model_id,
        total,
        status: updatedStatus,
        assumed_date: updatedAssumedDate
      };

      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updated)
      });

      modal.style.display = 'none';
      fetchEstimates();
    });

  } catch (err) {
    console.error(err);
  }
}

// ===== INITIAL LOAD =====
fetchEstimates();

// ===== CONFIG =====
const API_URL = 'http://localhost:3000/api/v1/models';

const modelTableBody = document.getElementById('modelTableBody');
const searchInput = document.getElementById('searchModel');
const addModelBtn = document.getElementById('addModelBtn');

// ===== MODAL SETUP =====
const modal = document.createElement('div');
modal.className = 'modal';
modal.style.display = 'none';
document.body.appendChild(modal);

const modalContent = document.createElement('div');
modalContent.className = 'modal-content';
modal.appendChild(modalContent);

// Close modal on background click
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

// ===== DATA STATE =====
let models = [];

// ===== FETCH MODELS =====
async function fetchModels() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to fetch models');
    models = await res.json();
    renderModels(models);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// ===== RENDER TABLE =====
function renderModels(list) {
  modelTableBody.innerHTML = '';

  list.forEach((model) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${model.model_id}</td>
      <td>${model.name}</td>
      <td>${model.category}</td>
      <td>${model.floors}</td>
      <td>
        <button 
          class="model-action-btn preview-btn" 
          data-src="${model.file_path}" 
          data-name="${model.name}"
        >
          Preview
        </button>
      </td>
      <td>${model.status}</td>
      <td>
        <div class="action-buttons">
          <button 
            class="model-action-btn edit-btn" 
            data-id="${model.model_id}"
          >
            Edit
          </button>
          <button 
            class="model-action-btn delete-btn" 
            data-id="${model.model_id}"
          >
            Delete
          </button>
        </div>
      </td>
    `;

    modelTableBody.appendChild(tr);
  });
}

// ===== TABLE CLICK HANDLERS (Preview / Edit / Delete) =====
modelTableBody.addEventListener('click', (e) => {
  const target = e.target;

  // Preview
  if (target.classList.contains('preview-btn')) {
    const src = target.dataset.src;
    const name = target.dataset.name;

    modalContent.innerHTML = `
      <h2>${name}</h2>
      <model-viewer 
        src="${src}" 
        alt="${name}" 
        camera-controls 
        auto-rotate
        style="width: 100%; height: 400px; border-radius: 12px; margin-bottom: 16px;"
      ></model-viewer>
      <div class="modal-actions">
        <button type="button" class="close-btn">Close</button>
      </div>
    `;

    modal.style.display = 'flex';

    modalContent.querySelector('.close-btn').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    return;
  }

  const id = target.dataset.id;
  if (!id) return;

  // Edit
  if (target.classList.contains('edit-btn')) {
    const model = models.find((m) => m.model_id == id);
    if (model) showModelForm(model);
    return;
  }

  // Delete
  if (target.classList.contains('delete-btn')) {
    const model = models.find((m) => m.model_id == id);
    const name = model ? model.name : 'this model';

    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('Delete failed');
        return res.json();
      })
      .then(() => fetchModels())
      .catch((err) => {
        console.error(err);
        alert(err.message || 'Delete failed');
      });
  }
});

// ===== SEARCH (header input) =====
if (searchInput) {
  searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase();
    const filtered = models.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.category || '').toLowerCase().includes(term)
    );
    renderModels(filtered);
  });
}

// ===== ADD / EDIT FORM MODAL =====
function showModelForm(model = null) {
  const categories = ['Modern', 'Traditional', 'Mediterranean', 'Minimalist'];
  const floors = [1, 2, 3, 4];

  modalContent.innerHTML = `
    <h2>${model ? 'Edit' : 'Add'} Model</h2>
    <form id="modelForm">
      <label>Name</label>
      <input 
        type="text" 
        name="name" 
        value="${model ? model.name : ''}" 
        required
      >

      <label>Category</label>
      <select name="category" required>
        ${categories
          .map(
            (cat) => `
          <option value="${cat}" ${
              model && model.category === cat ? 'selected' : ''
            }>${cat}</option>`
          )
          .join('')}
      </select>

      <label>Floors</label>
      <select name="floors" required>
        ${floors
          .map(
            (f) => `
          <option value="${f}" ${
              model && Number(model.floors) === f ? 'selected' : ''
            }>${f}</option>`
          )
          .join('')}
      </select>

      <label>Status</label>
      <select name="status">
        <option value="Available" ${
          model && model.status === 'Available' ? 'selected' : ''
        }>Available</option>
        <option value="Unavailable" ${
          model && model.status === 'Unavailable' ? 'selected' : ''
        }>Unavailable</option>
      </select>

      ${
        model && model.file_path
          ? `
        <label>Current Model Preview</label>
        <model-viewer
          src="${model.file_path}"
          alt="${model.name}"
          camera-controls
          auto-rotate
          style="width:100%; height:300px; border-radius:8px; margin-bottom:10px;"
        ></model-viewer>
      `
          : ''
      }

      <label>GLB File ${model ? '(leave empty to keep current)' : ''}</label>
      <input type="file" name="file" accept=".glb">

      <div class="modal-actions">
        <button type="submit" class="save-btn">
          ${model ? 'Update' : 'Add'}
        </button>
        <button type="button" class="close-btn">Cancel</button>
      </div>
    </form>
  `;

  modal.style.display = 'flex';

  // Close button
  modalContent.querySelector('.close-btn').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  const form = document.getElementById('modelForm');
  const submitBtn = form.querySelector('.save-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const url = model ? `${API_URL}/${model.model_id}` : API_URL;
    const method = model ? 'PUT' : 'POST';

    // Show loading state
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = model ? 'Updating...' : 'Adding...';

    try {
      const res = await fetch(url, { method, body: formData });
      if (!res.ok) {
        let err;
        try {
          err = await res.json();
        } catch {
          err = {};
        }
        throw new Error(err.message || 'Something went wrong');
      }

      await fetchModels();
      modal.style.display = 'none';
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Add model button
if (addModelBtn) {
  addModelBtn.addEventListener('click', () => showModelForm());
}

// ===== INITIAL LOAD =====
fetchModels();

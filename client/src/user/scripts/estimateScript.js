// ===== ELEMENTS =====
const estimateBtn = document.getElementById('estimateBtn');
const sendBtn = document.querySelector('.estimate-box .btn-primary');

const bedrooms = document.getElementById('bedrooms');
const bathrooms = document.getElementById('bathrooms');
const style = document.getElementById('style');
const unit = document.getElementById('unit');
const floors = document.getElementById('floors');
const city = document.getElementById('city');
const featuresContainer = document.getElementById('featuresContainer');
const featureCheckboxes = () => document.querySelectorAll('#featuresContainer input[type="checkbox"]');

const nav = document.querySelector('nav');
const userIcon = document.getElementById('userIcon');
const userDropdown = document.getElementById('userDropdown');
const designBox = document.querySelector('.design-box');
const projectSummaryElement = document.querySelector('.projectSummary');

// ===== SPAM PREVENTION STATE =====
let isSubmitting = false;
let lastSubmissionTime = 0;
const COOLDOWN_PERIOD = 5000; // 5 seconds cooldown between submissions

// ===== LOGIN CHECK =====
function isLoggedIn() {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return !(payload.exp && payload.exp < Math.floor(Date.now() / 1000));
  } catch {
    localStorage.clear();
    return false;
  }
}

function getUserIdFromToken() {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id || payload.userid || null;
  } catch {
    return null;
  }
}

// ===== NAVBAR LOGIC =====
(function handleNavbar() {
  if (!isLoggedIn()) {
    const loginBtn = document.createElement('button');
    loginBtn.textContent = 'Login';
    loginBtn.className = 'btn-primary';
    loginBtn.addEventListener('click', () => window.location.href = 'login.html');
    if (userIcon) userIcon.style.display = 'none';
    if (userDropdown) userDropdown.style.display = 'none';
    nav.appendChild(loginBtn);
  } else {
    const userMenu = document.querySelector('.user-menu');
    if (userIcon) userIcon.style.display = 'block';
    userIcon.addEventListener('click', e => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });
    document.addEventListener('click', e => {
      if (!userMenu.contains(e.target)) userDropdown.classList.remove('show');
    });
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      location.reload();
    });
  }
})();

// ===== REAL-TIME VALIDATION =====
function attachRealtimeValidation(input, min, max, message) {
  let popup = input.parentElement.querySelector('.popup-message');
  if (!popup) {
    popup = document.createElement('div');
    popup.className = 'popup-message info';
    input.parentElement.insertBefore(popup, input);
  }
  input.addEventListener('input', () => {
    const value = parseFloat(input.value);
    if (isNaN(value) || value < min || value > max) {
      popup.textContent = message;
      popup.classList.add('show');
      input.classList.add('input-error');
    } else {
      popup.classList.remove('show');
      input.classList.remove('input-error');
    }
  });
}

attachRealtimeValidation(bedrooms, 1, 6, 'Bedrooms must be between 1 and 6.');
attachRealtimeValidation(bathrooms, 1, 6, 'Bathrooms must be between 1 and 6.');
attachRealtimeValidation(unit, 60, 1200, 'Unit size must be 60–1200 sqm.');

function validateInputs() {
  const inputs = [bedrooms, bathrooms, style, unit, floors, city];
  let allFilled = true;
  inputs.forEach(input => {
    input.classList.remove('input-error', 'shake');
    if (!input.value || input.value === '') {
      input.classList.add('input-error', 'shake');
      allFilled = false;
      setTimeout(() => input.classList.remove('shake'), 400);
    }
  });
  return allFilled;
}

function validateConstraints() {
  let valid = true;
  const b = parseInt(bedrooms.value, 10);
  const ba = parseInt(bathrooms.value, 10);
  const u = parseFloat(unit.value);

  if (isNaN(b) || b < 1 || b > 6) { bedrooms.classList.add('input-error'); valid = false; } 
  else bedrooms.classList.remove('input-error');

  if (isNaN(ba) || ba < 1 || ba > 6) { bathrooms.classList.add('input-error'); valid = false; } 
  else bathrooms.classList.remove('input-error');

  if (isNaN(u) || u < 60 || u > 1200) { unit.classList.add('input-error'); valid = false; } 
  else unit.classList.remove('input-error');

  if (!city.value) { city.classList.add('input-error'); valid = false; } else city.classList.remove('input-error');
  return valid;
}

// ===== FETCH DYNAMIC OPTIONS =====
async function fetchDynamicOptions() {
  try {
    // Floors
    const floorRes = await fetch('http://localhost:3000/api/v1/estimates/getFloors');
    if (floorRes.ok) {
      const floorsData = await floorRes.json();
      floors.innerHTML = '';
      floorsData.forEach(f => {
        const option = document.createElement('option');
        option.value = f.name;
        option.textContent = f.name;
        floors.appendChild(option);
      });
    }

    // Features
    const featureRes = await fetch('http://localhost:3000/api/v1/admin/features');
    if (featureRes.ok) {
      const featuresData = await featureRes.json();
      featuresContainer.innerHTML = '<p>Features</p>';
      featuresData.forEach(f => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" class="feature-checkbox" data-id="${f.feature_id}" /> ${f.name}`;
        featuresContainer.appendChild(label);
      });
    }

    // Cities
    const cityRes = await fetch('http://localhost:3000/api/v1/estimates/cityRates');
    if (cityRes.ok) {
      const citiesData = await cityRes.json();
      city.innerHTML = '<option selected disabled value="">Select City</option>';
      citiesData.forEach(c => {
        const option = document.createElement('option');
        option.value = c.city;
        option.textContent = c.city;
        city.appendChild(option);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

// ===== DESIGN BOX PREVIEW =====
const floorNameToDb = {
  "Bungalow (1 Floor)": "1",
  "Two-Storey": "2",
  "Three-Storey": "3",
  "High-Rise": "4"
};

async function updateModelPreview() {
  const selectedStyle = style.value.trim();
  const selectedFloor = floors.value.trim();
  if (!selectedStyle || !selectedFloor) return;

  const dbFloor = floorNameToDb[selectedFloor] || selectedFloor;

  try {
    const res = await fetch(
      `http://localhost:3000/api/v1/estimates/getModelLink?style=${encodeURIComponent(selectedStyle)}&floors=${encodeURIComponent(dbFloor)}`
    );
    if (!res.ok) throw new Error('Failed to fetch model');

    const model = await res.json();
    if (!model || !model.file_path) return;

    designBox.innerHTML = `
      <model-viewer src="${model.file_path}" alt="${model.name}" camera-controls auto-rotate style="width:100%; height:100%; border-radius:12px;"></model-viewer>
    `;
  } catch (err) {
    console.error(err);
    designBox.innerHTML = `<p style="color:red;">Model preview unavailable</p>`;
  }
}

style.addEventListener('change', updateModelPreview);
floors.addEventListener('change', updateModelPreview);

// ===== LOGIN PROMPT =====
function showLoginMessage() {
  let message = document.querySelector('.login-message');
  if (!message) {
    message = document.createElement('div');
    message.className = 'login-message';
    message.innerHTML = `
      <div class="login-message-box">
        <p>🔒 Please log in to view project summary.</p>
        <a href="login.html" class="btn-primary">Go to Login</a>
      </div>
    `;
    document.body.appendChild(message);
  }
  message.classList.add('show');
  setTimeout(() => message.classList.remove('show'), 2500);
}

// ===== CLEAR FORM =====
function clearForm() {
  bedrooms.value = '';
  bathrooms.value = '';
  style.selectedIndex = 0;
  unit.value = '';
  floors.selectedIndex = 0;
  city.selectedIndex = 0;
  
  Array.from(featureCheckboxes()).forEach(cb => cb.checked = false);
  projectSummaryElement.innerHTML = '';
  
  [bedrooms, bathrooms, style, unit, floors, city].forEach(input => {
    input.classList.remove('input-error', 'shake');
  });
  
  updateModelPreview();
}

// ===== GET PROJECT SUMMARY =====
async function getProjectSummary() {
  const res = await fetch('http://localhost:3000/api/v1/estimates/getProjectSummary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bedrooms: bedrooms.value,
      bathrooms: bathrooms.value,
      style: style.value,
      unit: unit.value,
      floors: floors.value,
      city: city.value,
      features: Array.from(featureCheckboxes())
        .filter(cb => cb.checked)
        .map(cb => Number(cb.dataset.id))
    })
  });

  if (!res.ok) {
    console.error("Failed to fetch project summary:", res.status);
    projectSummaryElement.innerHTML = `<p style="color:red;">Failed to load summary</p>`;
    return;
  }

  const data = await res.json();

  const detailsHTML = data.summary
    .map(item => `<div class="estimate-row"><span class="estimate-label">${item.label}</span></div>`)
    .join('');

  projectSummaryElement.innerHTML = `<div class="estimate-details">${detailsHTML}</div>`;
}

// ===== ESTIMATE BUTTON =====
estimateBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  if (!isLoggedIn()) { showLoginMessage(); return; }
  if (!validateInputs() || !validateConstraints()) return;

  await getProjectSummary();
});

// ===== SEND TO CONTRACTOR BUTTON - OPENS MODAL ONLY =====
sendBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  
  // Check if logged in
  if (!isLoggedIn()) { 
    showLoginMessage(); 
    return; 
  }
  
  // Validate form first
  if (!validateInputs() || !validateConstraints()) {
    alert('⚠️ Please fill in all required fields correctly before proceeding.');
    return;
  }
  
  // Check cooldown to prevent spam
  const now = Date.now();
  const timeSinceLastSubmit = now - lastSubmissionTime;
  if (timeSinceLastSubmit < COOLDOWN_PERIOD) {
    const remainingSeconds = Math.ceil((COOLDOWN_PERIOD - timeSinceLastSubmit) / 1000);
    alert(`⏰ Please wait ${remainingSeconds} seconds before submitting another inquiry.`);
    return;
  }

  // Generate project summary first
  await getProjectSummary();

  // ✅ ONLY OPEN MODAL - DO NOT SUBMIT YET
  if (typeof openInquiryModal === 'function') {
    openInquiryModal();
  } else {
    console.error('❌ openInquiryModal function not found!');
    alert('⚠️ Modal is not loaded. Please refresh the page.');
  }
});

// ===== EXPOSE FUNCTION FOR MODAL TO GET FORM DATA =====
window.getInquiryFormData = function() {
  const styleMap = { 
    "Modern / Contemporary": "Modern", 
    Traditional: "Traditional", 
    Mediterranean: "Mediterranean", 
    Minimalist: "Minimalist" 
  };
  
  const floorNameToCount = { 
    "Bungalow (1 Floor)": 1, 
    "Two-Storey": 2, 
    "Three-Storey": 3, 
    "High-Rise (4+ Floors)": 4 
  };

  return {
    userid: getUserIdFromToken(),
    bedrooms: parseInt(bedrooms.value, 10),
    bathrooms: parseInt(bathrooms.value, 10),
    style: styleMap[style.value] || style.value,
    floors: floorNameToCount[floors.value] || 1,
    unit_size: parseFloat(unit.value),
    city: city.value,
    features: Array.from(featureCheckboxes())
      .filter(cb => cb.checked)
      .map(cb => Number(cb.dataset.id))
      .filter(Boolean)
  };
};

// ===== SUCCESS CALLBACK FROM MODAL =====
window.onInquirySuccess = function() {
  lastSubmissionTime = Date.now();
  clearForm();
  alert('Thank you! Please check your Profile to see your inquiries status.');
};

// ===== CHECK IF CURRENTLY SUBMITTING =====
window.isCurrentlySubmitting = function() {
  return isSubmitting;
};

window.setSubmittingState = function(state) {
  isSubmitting = state;
};

// ===== INITIAL LOAD =====
fetchDynamicOptions();
updateModelPreview();
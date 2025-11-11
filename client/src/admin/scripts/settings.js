// Grab elements
const appName = document.getElementById('appName');
const adminEmail = document.getElementById('adminEmail');
const currency = document.getElementById('currency');
const unitSize = document.getElementById('unitSize');
const saveBtn = document.getElementById('saveSettingsBtn');
const saveMessage = document.getElementById('saveMessage');

// Load saved settings
function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
  appName.value = settings.appName || '';
  adminEmail.value = settings.adminEmail || '';
  currency.value = settings.currency || 'PHP';
  unitSize.value = settings.unitSize || '';
}

// Save settings
function saveSettings() {
  const settings = {
    appName: appName.value,
    adminEmail: adminEmail.value,
    currency: currency.value,
    unitSize: unitSize.value
  };
  localStorage.setItem('appSettings', JSON.stringify(settings));
  saveMessage.textContent = "Settings saved successfully!";
  setTimeout(() => saveMessage.textContent = '', 3000);
}

// Event
saveBtn.addEventListener('click', saveSettings);

// Initialize
loadSettings();

const API_BASE = 'http://localhost:3000/api/v1/users';

// ===== AUTH BASIC CHECK =====
const authToken = localStorage.getItem('authToken');
if (!authToken) {
  alert('Please login first');
  window.location.href = './index.html';
}

const userId = localStorage.getItem('userId');
console.log('User ID from localStorage:', userId);
console.log('Auth Token exists:', !!authToken);

if (!userId) {
  alert('User ID not found. Please login again.');
  localStorage.clear();
  window.location.href = './index.html';
}

// ===== USER MENU DROPDOWN =====
const userMenu = document.getElementById('userMenu');
const userIcon = document.getElementById('userIcon');
const userDropdown = document.getElementById('userDropdown');

if (userIcon && userDropdown && userMenu) {
  userIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target)) {
      userDropdown.classList.remove('show');
    }
  });
}

// ===== LOGOUT =====
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = './index.html';
});

// ===== FETCH USER PROFILE =====
async function fetchUserProfile() {
  try {
    console.log('Fetching profile for user:', userId);

    const response = await fetch(`${API_BASE}/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    console.log('Profile response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch profile');
    }

    const data = await response.json();
    console.log('Profile data:', data);

    document.getElementById('userEmail').textContent = data.email;
    document.getElementById('userName').textContent = data.name;
    document.getElementById('memberSince').textContent = new Date(
      data.created_at
    ).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    document.getElementById('userEmail').textContent = 'Error: ' + error.message;
    document.getElementById('userName').textContent = 'Error loading data';
    document.getElementById('memberSince').textContent = 'Error loading data';
  }
}

// ===== FETCH INQUIRY HISTORY (WITH STATUS VARIANTS) =====
async function fetchInquiryHistory() {
  const container = document.getElementById('historyContainer');

  try {
    console.log('Fetching inquiries for user:', userId);

    const response = await fetch(`${API_BASE}/inquiries/${userId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    console.log('Inquiries response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    console.log('Response text:', text);

    if (!text) {
      throw new Error('Empty response from server');
    }

    const inquiries = JSON.parse(text);
    console.log('Inquiries data:', inquiries);

    if (!Array.isArray(inquiries) || inquiries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>🔭 No inquiries yet</p>
          <a href="./home.html">Start Your First Project</a>
        </div>
      `;
      return;
    }

    container.innerHTML = inquiries
      .map((inquiry) => {
        const features = inquiry.features || [];
        const status = inquiry.status || 'pending';

        const date = new Date(inquiry.created_at).toLocaleDateString(
          'en-US',
          {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }
        );

        // Status badge
        let statusClass = 'pending';
        let statusText = 'Pending Review';
        let statusIcon = '⏳';

        if (status === 'accepted') {
          statusClass = 'accepted';
          statusText = 'Accepted';
          statusIcon = '✅';
        } else if (status === 'completed') {
          statusClass = 'completed';
          statusText = 'Completed';
          statusIcon = '🎉';
        } else if (status === 'cancelled') {
          statusClass = 'cancelled';
          statusText = 'Cancelled';
          statusIcon = '❌';
        }

        // Actions by status
        let actionButtons = '';
        if (status === 'pending') {
          actionButtons = `
            <button class="view-details-btn" onclick="viewInquiryDetails(${inquiry.inquiry_id})">
              𝒊 View Full Details
            </button>
            <button class="cancel-btn" onclick="cancelInquiry(${inquiry.inquiry_id})">
              ❌ Cancel Project
            </button>
          `;
        } else if (status === 'accepted') {
          actionButtons = `
            <button class="view-details-btn" onclick="viewInquiryDetails(${inquiry.inquiry_id})">
              𝒊 View Full Details
            </button>
            <button class="inbox-btn" onclick="goToInbox(${inquiry.inquiry_id})">
              💬 Go to Inbox
            </button>
            <p class="cancel-disabled">Cannot cancel accepted projects</p>
          `;
        } else if (status === 'completed') {
          actionButtons = `
            <button class="view-details-btn" onclick="viewInquiryDetails(${inquiry.inquiry_id})">
              𝒊 View Full Details
            </button>
            <button class="inbox-btn" onclick="goToInbox(${inquiry.inquiry_id})">
              💬 View Messages
            </button>
            <p class="completed-message">✨ Project has been completed!</p>
          `;
        } else if (status === 'cancelled') {
          actionButtons = `
            <button class="view-details-btn" onclick="viewInquiryDetails(${inquiry.inquiry_id})">
              𝒊 View Full Details
            </button>
          `;
        }

        return `
          <div class="inquiry-card ${status}">
            <div class="inquiry-header">
              <span class="inquiry-date">📅 ${date}</span>
              <span class="inquiry-status ${statusClass}">
                ${statusIcon} ${statusText}
              </span>
            </div>
            <div class="inquiry-details">
              <div class="inquiry-item"><strong>🎨 Style:</strong> ${inquiry.style || 'N/A'}</div>
              <div class="inquiry-item"><strong>🛏️ Bedrooms:</strong> ${inquiry.bedrooms || 'N/A'}</div>
              <div class="inquiry-item"><strong>🛁 Bathrooms:</strong> ${inquiry.bathrooms || 'N/A'}</div>
              <div class="inquiry-item"><strong>🏢 Floors:</strong> ${inquiry.floors || 'N/A'}</div>
              <div class="inquiry-item"><strong>📐 Unit Size:</strong> ${inquiry.unit_size || 'N/A'} sqm</div>
              <div class="inquiry-item"><strong>📍 Location:</strong> ${inquiry.city || 'N/A'}</div>
              ${
                features.length > 0
                  ? `
                <div class="inquiry-features">
                  <strong>✨ Features:</strong><br>
                  ${features
                    .map((f) => `<span class="feature-tag">${f}</span>`)
                    .join('')}
                </div>
              `
                  : ''
              }
            </div>
            <div class="inquiry-actions">
              ${actionButtons}
            </div>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    container.innerHTML = `<div class="loading">❌ Error: ${error.message}</div>`;
  }
}

// ===== VIEW INQUIRY DETAILS (IFRAME MODAL) =====
function viewInquiryDetails(inquiryId) {
  console.log('🔍 Attempting to view inquiry:', inquiryId);

  const iframe = document.getElementById('detailsModalFrame');

  if (!iframe) {
    console.error('❌ Iframe not found in DOM');
    alert('Modal not found. Please refresh the page.');
    return;
  }

  const tryOpenModal = (attempt = 1, maxAttempts = 10) => {
    console.log(`⏳ Attempt ${attempt}/${maxAttempts} to open modal...`);

    if (!iframe.contentWindow) {
      if (attempt < maxAttempts) {
        setTimeout(() => tryOpenModal(attempt + 1, maxAttempts), 300);
      } else {
        alert('Unable to load modal. Please refresh the page.');
      }
      return;
    }

    const modalFunction = iframe.contentWindow.openDetailsModal;

    if (typeof modalFunction === 'function') {
      // Reset any previous state
      const modalOverlay =
        iframe.contentWindow.document.getElementById('detailsModal');
      if (modalOverlay) {
        modalOverlay.classList.remove('active');
      }

      // Show iframe
      iframe.style.display = 'block';

      // Call modal
      setTimeout(() => {
        try {
          modalFunction(inquiryId);
        } catch (error) {
          console.error('❌ Error calling openDetailsModal:', error);
          alert('Error opening modal: ' + error.message);
        }
      }, 100);
    } else if (attempt < maxAttempts) {
      setTimeout(() => tryOpenModal(attempt + 1, maxAttempts), 300);
    } else {
      console.error('❌ openDetailsModal not found');
      alert('Unable to load modal. Please refresh the page and try again.');
    }
  };

  if (iframe.contentWindow && iframe.contentWindow.document.readyState === 'complete') {
    tryOpenModal();
  } else {
    iframe.onload = () => {
      setTimeout(() => tryOpenModal(), 400);
    };
  }
}

window.viewInquiryDetails = viewInquiryDetails;

// Preload iframe for logging/debug (optional)
window.addEventListener('DOMContentLoaded', () => {
  const iframe = document.getElementById('detailsModalFrame');
  if (iframe) {
    iframe.onload = () => {
      console.log('✅ Details modal iframe loaded!', iframe.src);
    };
  }
});

// ===== CANCEL INQUIRY =====
async function cancelInquiry(inquiryId) {
  console.log('🔍 Attempting to cancel inquiry:', inquiryId);

  if (!confirm('Are you sure you want to cancel this project inquiry?')) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}/inquiries/${inquiryId}/cancel`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error response:', error);
      throw new Error(error.message || 'Failed to cancel inquiry');
    }

    const result = await response.json();
    console.log('✅ Success response:', result);
    alert('✅ ' + result.message);

    fetchInquiryHistory();
  } catch (error) {
    console.error('Error cancelling inquiry:', error);
    alert('❌ Error: ' + error.message);
  }
}

function goToInbox(inquiryId) {
  window.location.href = `./inbox.html?inquiry=${inquiryId}`;
}

window.cancelInquiry = cancelInquiry;
window.goToInbox = goToInbox;

// ===== DARK MODE / THEME TOGGLE (same key as home) =====
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeToggleIcon = document.getElementById('themeToggleIcon');
const THEME_KEY = 'hb_theme';

function updateThemeToggleIcon() {
  if (!themeToggleIcon) return;
  const isDark = document.body.classList.contains('dark-mode');
  themeToggleIcon.textContent = isDark ? '☀️' : '🌙';
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  updateThemeToggleIcon();
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-mode');
      const nextTheme = isDark ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  }
});

// ===== INITIAL LOAD =====
fetchUserProfile();
fetchInquiryHistory();

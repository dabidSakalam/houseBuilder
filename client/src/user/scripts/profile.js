const API_BASE = 'http://localhost:3000/api/v1/users';

// Get user from localStorage
const authToken = localStorage.getItem('authToken');
if (!authToken) {
  alert('Please login first');
  window.location.href = './index.html';
}

const userId = localStorage.getItem('userId');

// Debug: Check if userId exists
console.log('User ID from localStorage:', userId);
console.log('Auth Token exists:', !!authToken);

if (!userId) {
  alert('User ID not found. Please login again.');
  localStorage.clear();
  window.location.href = './index.html';
}

// Logout functionality
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = './index.html';
});

// ✅ Fetch user profile
async function fetchUserProfile() {
  try {
    console.log('Fetching profile for user:', userId);

    const response = await fetch(`${API_BASE}/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
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
    document.getElementById('memberSince').textContent = new Date(data.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    document.getElementById('userEmail').textContent = 'Error: ' + error.message;
    document.getElementById('userName').textContent = 'Error loading data';
    document.getElementById('memberSince').textContent = 'Error loading data';
  }
}

// ===== Fetch inquiry history (UPDATED WITH COMPLETED STATUS) =====
async function fetchInquiryHistory() {
  const container = document.getElementById('historyContainer');

  try {
    console.log('Fetching inquiries for user:', userId);

    const response = await fetch(`${API_BASE}/inquiries/${userId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
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

    container.innerHTML = inquiries.map(inquiry => {
      const features = inquiry.features || [];
      const status = inquiry.status || 'pending';

      const date = new Date(inquiry.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // ✅ UPDATED: Status badge styling with COMPLETED status
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

      // ✅ UPDATED: Action buttons based on status (INCLUDING COMPLETED)
      let actionButtons = '';
      if (status === 'pending') {
        actionButtons = `
          <button class="view-details-btn" onclick="viewInquiryDetails(${inquiry.inquiry_id})">
            👁️ View Full Details
          </button>
          <button class="cancel-btn" onclick="cancelInquiry(${inquiry.inquiry_id})">
            ❌ Cancel Project
          </button>
        `;
      } else if (status === 'accepted') {
        actionButtons = `
          <button class="view-details-btn" onclick="viewInquiryDetails(${inquiry.inquiry_id})">
            👁️ View Full Details
          </button>
          <button class="inbox-btn" onclick="goToInbox(${inquiry.inquiry_id})">
            💬 Go to Inbox
          </button>
          <p class="cancel-disabled">Cannot cancel accepted projects</p>
        `;
      } else if (status === 'completed') {
        // ✅ NEW: Completed status actions
        actionButtons = `
          <button class="view-details-btn" onclick="viewInquiryDetails(${inquiry.inquiry_id})">
            👁️ View Full Details
          </button>
          <button class="inbox-btn" onclick="goToInbox(${inquiry.inquiry_id})">
            💬 View Messages
          </button>
          <p class="completed-message">✨ Project has been completed!</p>
        `;
      } else if (status === 'cancelled') {
        actionButtons = `
          <button class="view-details-btn" onclick="viewInquiryDetails(${inquiry.inquiry_id})">
            👁️ View Full Details
          </button>
        `;
      }

      return `
        <div class="inquiry-card ${status}">
          <div class="inquiry-header">
            <span class="inquiry-date">📅 ${date}</span>
            <span class="inquiry-status ${statusClass}">${statusIcon} ${statusText}</span>
          </div>
          <div class="inquiry-details">
            <div class="inquiry-item"><strong>🎨 Style:</strong> ${inquiry.style || 'N/A'}</div>
            <div class="inquiry-item"><strong>🛏️ Bedrooms:</strong> ${inquiry.bedrooms || 'N/A'}</div>
            <div class="inquiry-item"><strong>🛁 Bathrooms:</strong> ${inquiry.bathrooms || 'N/A'}</div>
            <div class="inquiry-item"><strong>🏢 Floors:</strong> ${inquiry.floors || 'N/A'}</div>
            <div class="inquiry-item"><strong>📐 Unit Size:</strong> ${inquiry.unit_size || 'N/A'} sqm</div>
            <div class="inquiry-item"><strong>📍 Location:</strong> ${inquiry.city || 'N/A'}</div>
            ${features.length > 0 ? `
              <div class="inquiry-features">
                <strong>✨ Features:</strong><br>
                ${features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="inquiry-actions">
            ${actionButtons}
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error fetching inquiries:', error);
    container.innerHTML = `<div class="loading">❌ Error: ${error.message}</div>`;
  }
}

// ===== View Inquiry Details (FIXED VERSION) =====
function viewInquiryDetails(inquiryId) {
  console.log('🔍 Attempting to view inquiry:', inquiryId);
  
  const iframe = document.getElementById('detailsModalFrame');
  
  if (!iframe) {
    console.error('❌ Iframe not found in DOM');
    alert('Modal not found. Please refresh the page.');
    return;
  }

  console.log('✅ Iframe found');

  const tryOpenModal = (attempt = 1, maxAttempts = 10) => {
    console.log(`⏳ Attempt ${attempt}/${maxAttempts} to open modal...`);
    
    if (!iframe.contentWindow) {
      console.error('❌ Iframe contentWindow not available');
      if (attempt < maxAttempts) {
        setTimeout(() => tryOpenModal(attempt + 1, maxAttempts), 300);
      } else {
        alert('Unable to load modal. Please refresh the page.');
      }
      return;
    }

    const modalFunction = iframe.contentWindow.openDetailsModal;
    console.log('Function check:', typeof modalFunction);

    if (typeof modalFunction === 'function') {
      console.log('✅ Function found! Opening modal...');
      
      // ✅ FIRST: Reset any existing modal state
      const modalOverlay = iframe.contentWindow.document.getElementById('detailsModal');
      if (modalOverlay) {
        modalOverlay.classList.remove('active');
        console.log('🔄 Reset modal state');
      }
      
      // ✅ THEN: Show iframe
      iframe.style.display = 'block';
      
      // ✅ FINALLY: Open modal with delay to ensure DOM is ready
      setTimeout(() => {
        try {
          modalFunction(inquiryId);
          console.log('✅ Modal opened successfully');
        } catch (error) {
          console.error('❌ Error calling function:', error);
          alert('Error opening modal: ' + error.message);
        }
      }, 100);
      
    } else if (attempt < maxAttempts) {
      console.log(`⏳ Function not ready yet (attempt ${attempt}), retrying...`);
      setTimeout(() => tryOpenModal(attempt + 1, maxAttempts), 300);
    } else {
      console.error('❌ Function not found after all attempts');
      alert('Unable to load modal. Please refresh the page and try again.');
    }
  };

  // Wait a bit for iframe to be ready
  if (iframe.contentWindow && iframe.contentWindow.document.readyState === 'complete') {
    console.log('✅ Iframe already loaded');
    tryOpenModal();
  } else {
    console.log('⏳ Waiting for iframe to load...');
    iframe.onload = () => {
      console.log('✅ Iframe onload fired');
      setTimeout(() => tryOpenModal(), 500);
    };
  }
}

// Make function globally accessible
window.viewInquiryDetails = viewInquiryDetails;

// ===== Pre-load iframe when page loads =====
window.addEventListener('DOMContentLoaded', () => {
  console.log('📦 DOMContentLoaded - Looking for iframe...');
  const iframe = document.getElementById('detailsModalFrame');
  if (iframe) {
    console.log('✅ Iframe found, waiting for load...');
    
    iframe.onload = () => {
      console.log('✅ Details modal iframe loaded!');
      console.log('Iframe src:', iframe.src);
      console.log('ContentWindow available:', !!iframe.contentWindow);
      
      setTimeout(() => {
        if (iframe.contentWindow && iframe.contentWindow.openDetailsModal) {
          console.log('✅ openDetailsModal function is available!');
        } else {
          console.error('❌ openDetailsModal function NOT available');
        }
      }, 1000);
    };
  } else {
    console.error('❌ Iframe not found on page load');
  }
});

// Make function globally accessible
window.viewInquiryDetails = viewInquiryDetails;

// ===== Pre-load iframe when page loads =====
window.addEventListener('DOMContentLoaded', () => {
  console.log('📦 DOMContentLoaded - Looking for iframe...');
  const iframe = document.getElementById('detailsModalFrame');
  if (iframe) {
    console.log('✅ Iframe found, waiting for load...');

    iframe.onload = () => {
      console.log('✅ Details modal iframe loaded!');
      console.log('Iframe src:', iframe.src);
      console.log('ContentWindow available:', !!iframe.contentWindow);

      setTimeout(() => {
        if (iframe.contentWindow && iframe.contentWindow.openDetailsModal) {
          console.log('✅ openDetailsModal function is available!');
        } else {
          console.error('❌ openDetailsModal function NOT available');
        }
      }, 1000);
    };
  } else {
    console.error('❌ Iframe not found on page load');
  }
});

// ===== Cancel Inquiry Function =====
async function cancelInquiry(inquiryId) {
  console.log('🔍 Attempting to cancel inquiry:', inquiryId);
  console.log('🔍 API endpoint:', `${API_BASE}/inquiries/${inquiryId}/cancel`);

  if (!confirm('Are you sure you want to cancel this project inquiry?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/inquiries/${inquiryId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

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

// ===== Go to Inbox Function =====
function goToInbox(inquiryId) {
  // Redirect to inbox page with inquiry ID
  window.location.href = `./inbox.html?inquiry=${inquiryId}`;
}
// Make functions globally accessible
window.cancelInquiry = cancelInquiry;
window.goToInbox = goToInbox;

// ✅ Call the functions when page loads
fetchUserProfile();
fetchInquiryHistory();
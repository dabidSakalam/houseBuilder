// ===== DOM ELEMENTS =====
const tableBody = document.getElementById('inquiryTableBody');
const searchInput = document.getElementById('searchInquiry');
const statusFilter = document.getElementById('statusFilter');
const sortFilter = document.getElementById('sortFilter');

const API_URL = 'http://localhost:3000/api/v1/admin/adminInquiries';
const token = localStorage.getItem('adminToken');

const modal = document.getElementById('chatModal');
const chatContainer = document.getElementById('chatContainer');
const chatTitleEl = document.getElementById('chatTitle');
const chatSubtitleEl = document.getElementById('chatSubtitle');

let currentInquiryId = null;

// Store all inquiries for searching/filtering/sorting
let allInquiries = [];

// ===== SOCKET.IO CONNECTION =====
const socket = io('http://localhost:3000');

// Join / leave inquiry-specific rooms
function joinInquiryRoom(inquiryId) {
  socket.emit('join-inquiry', inquiryId);
  console.log('Joined inquiry room:', inquiryId);
}

function leaveInquiryRoom(inquiryId) {
  socket.emit('leave-inquiry', inquiryId);
  console.log('Left inquiry room:', inquiryId);
}

// Listen for new messages for the current inquiry
socket.on('new-message', (message) => {
  console.log('New message received:', message);
  if (message.inquiryId == currentInquiryId) {
    appendNewMessage(message);
  }
});

// Append a single new chat message
function appendNewMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message', message.senderType === 'admin' ? 'admin' : 'user');
  div.innerHTML = `
    <strong>${message.senderName}</strong>
    <span class="msg-date">${new Date(message.createdAt).toLocaleString()}</span>
    <p>${message.message}</p>
    ${message.imageUrl ? `<img src="${message.imageUrl}" class="chat-image">` : ''}
  `;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ===== IMAGE PREVIEW AND REMOVAL =====
const imgInput = document.getElementById('imgInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removePreview = document.getElementById('removePreview');
const fileLabel = document.getElementById('fileLabel');

if (imgInput) {
  imgInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        previewImg.src = event.target.result;
        imagePreview.style.display = 'block';
        fileLabel.classList.add('has-file');
        fileLabel.textContent = '✓';
      };
      reader.readAsDataURL(file);
    }
  });
}

if (removePreview) {
  removePreview.addEventListener('click', () => {
    imgInput.value = '';
    imagePreview.style.display = 'none';
    fileLabel.classList.remove('has-file');
    fileLabel.textContent = '📎';
  });
}

// ===== CLOSE CHAT MODAL =====
if (modal) {
  modal.querySelector('.close-btn').addEventListener('click', () => {
    if (currentInquiryId) {
      leaveInquiryRoom(currentInquiryId);
      currentInquiryId = null;
    }
    imgInput.value = '';
    imagePreview.style.display = 'none';
    fileLabel.classList.remove('has-file');
    fileLabel.textContent = '📎';
    chatContainer.innerHTML = '';
    if (chatTitleEl) chatTitleEl.textContent = 'Messages';
    if (chatSubtitleEl) chatSubtitleEl.textContent = 'Select an inquiry and click Reply to start chatting.';
    modal.style.display = 'none';
  });

  window.addEventListener('click', e => { 
    if (e.target === modal) {
      if (currentInquiryId) {
        leaveInquiryRoom(currentInquiryId);
        currentInquiryId = null;
      }
      imgInput.value = '';
      imagePreview.style.display = 'none';
      fileLabel.classList.remove('has-file');
      fileLabel.textContent = '📎';
      chatContainer.innerHTML = '';
      if (chatTitleEl) chatTitleEl.textContent = 'Messages';
      if (chatSubtitleEl) chatSubtitleEl.textContent = 'Select an inquiry and click Reply to start chatting.';
      modal.style.display = 'none';
    }
  });
}

// ===== FETCH ALL INQUIRIES =====
async function fetchInquiries() {
  try {
    const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to fetch inquiries');
    const data = await res.json();

    // Save all for searching/filtering
    allInquiries = Array.isArray(data) ? data : [];
    applyFiltersAndRender();
  } catch (err) {
    console.error(err);
  }
}

// ===== APPLY SEARCH + FILTER + SORT THEN RENDER =====
function applyFiltersAndRender() {
  if (!Array.isArray(allInquiries)) return;

  const query = (searchInput?.value || '').trim().toLowerCase();
  const statusValue = statusFilter ? statusFilter.value : 'all';
  const sortValue = sortFilter ? sortFilter.value : 'date-desc';

  let result = allInquiries.slice(); // clone

  // 1) Search
  if (query) {
    result = result.filter(inq => {
      const client = inq.client_name || '';
      const city = inq.city || '';
      const style = inq.style || '';
      const features = Array.isArray(inq.featureNames) ? inq.featureNames.join(', ') : '';
      const status = inq.status || '';

      const haystack = `${client} ${city} ${style} ${features} ${status}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  // 2) Status filter
  if (statusValue && statusValue !== 'all') {
    result = result.filter(inq => (inq.status || 'pending') === statusValue);
  }

  // 3) Sort
  result.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    const nameA = (a.client_name || '').toLowerCase();
    const nameB = (b.client_name || '').toLowerCase();

    switch (sortValue) {
      case 'date-asc':
        return dateA - dateB;
      case 'date-desc':
        return dateB - dateA;
      case 'name-asc':
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      case 'name-desc':
        if (nameA > nameB) return -1;
        if (nameA < nameB) return 1;
        return 0;
      default:
        return dateB - dateA;
    }
  });

  renderTable(result);
}

// Wire up controls
if (searchInput) {
  searchInput.addEventListener('input', () => {
    applyFiltersAndRender();
  });
}

if (statusFilter) {
  statusFilter.addEventListener('change', () => {
    applyFiltersAndRender();
  });
}

if (sortFilter) {
  sortFilter.addEventListener('change', () => {
    applyFiltersAndRender();
  });
}

// ===== RENDER TABLE (NO view-details BUTTON) =====
function renderTable(inquiries) {
  tableBody.innerHTML = '';
  inquiries.forEach(inq => {
    const featuresList = inq.featureNames?.join(', ') || 'None';
    const status = inq.status || 'pending';

    // Status Badge
    let statusBadge = '';
    if (status === 'pending') {
      statusBadge = '<span class="status-badge pending">⏳ Pending</span>';
    } else if (status === 'accepted') {
      statusBadge = '<span class="status-badge accepted">✅ Accepted</span>';
    } else if (status === 'completed') {
      statusBadge = '<span class="status-badge completed">🎉 Completed</span>';
    } else if (status === 'cancelled') {
      statusBadge = '<span class="status-badge cancelled">❌ Cancelled</span>';
    }

    // Action Buttons (no "View Details" anymore)
    let actionButtons = '';
    
    if (status === 'pending') {
      actionButtons = `
        <button class="accept-btn" data-id="${inq.inquiry_id}">✅ Accept</button>
      `;
    } else if (status === 'accepted') {
      actionButtons = `
        <button class="reply-btn" data-id="${inq.inquiry_id}">💬 Reply</button>
        <button class="complete-btn" data-id="${inq.inquiry_id}">✔️ Mark as Completed</button>
      `;
    } else if (status === 'completed') {
      actionButtons = `
        <em style="color: #27ae60;">Project Completed</em>
      `;
    } else if (status === 'cancelled') {
      actionButtons = `
        <em style="color: #7f8c8d;">Cancelled</em>
      `;
    }

    const row = document.createElement('tr');
    row.className = status;

    // store the inquiry id on the row itself
    row.dataset.id = inq.inquiry_id;

    row.innerHTML = `
      <td>${inq.client_name}</td>
      <td>${inq.bedrooms || 'N/A'}</td>
      <td>${inq.bathrooms || 'N/A'}</td>
      <td>${inq.floors || 'N/A'}</td>
      <td>${inq.style || 'N/A'}</td>
      <td>${inq.unit_size || 'N/A'}</td>
      <td>${featuresList}</td>
      <td>${inq.city || 'N/A'}</td>
      <td>${statusBadge}</td>
      <td>${inq.created_at ? new Date(inq.created_at).toLocaleDateString() : 'N/A'}</td>
      <td><div class="action-buttons">${actionButtons}</div></td>
    `;
    tableBody.appendChild(row);
  });
  attachRowActions();
}

// ===== ATTACH ROW + BUTTON ACTIONS =====
function attachRowActions() {
  // Row click -> open details
  tableBody.querySelectorAll('tr').forEach(row => {
    const inquiryId = row.dataset.id;
    if (!inquiryId) return;

    row.addEventListener('click', () => {
      if (typeof window.openDetailsModal === 'function') {
        window.openDetailsModal(inquiryId);
      } else {
        console.error('openDetailsModal function not found');
        alert('Details modal is not loaded yet. Please refresh the page.');
      }
    });
  });

  // Reply Button
  document.querySelectorAll('.reply-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation(); // prevent row click from firing
      const inquiryId = e.target.dataset.id;
      const inquiry = allInquiries.find(i => i.inquiry_id == inquiryId);

      currentInquiryId = inquiryId;

      // 🔹 Set chat title + subtitle here
      if (chatTitleEl) {
        const name = inquiry?.client_name || inquiry?.user_name || 'Client';
        chatTitleEl.textContent = `Messages · ${name}`;
      }
      if (chatSubtitleEl) {
        const city = inquiry?.city ? `City: ${inquiry.city}` : null;
        const idText = `Inquiry #${inquiryId}`;
        const pieces = [idText, city].filter(Boolean);
        chatSubtitleEl.textContent = pieces.join(' • ');
      }

      modal.style.display = 'block';
      fetchMessages(currentInquiryId);
      joinInquiryRoom(currentInquiryId);
    });
  });

  // Accept Button
  document.querySelectorAll('.accept-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // prevent row click
      const inquiryId = e.target.dataset.id;

      if (!confirm('Are you sure you want to accept this inquiry?')) {
        return;
      }

      const button = e.target;
      button.disabled = true;
      button.textContent = 'Accepting...';

      try {
        const res = await fetch(`http://localhost:3000/api/v1/admin/adminInquiries/${inquiryId}/accept`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to accept inquiry');
        }

        const result = await res.json();
        alert('✅ ' + result.message);
        fetchInquiries(); // Refresh table

      } catch (err) {
        console.error('Accept error:', err);
        alert('❌ Error: ' + err.message);
        button.disabled = false;
        button.textContent = '✅ Accept';
      }
    });
  });

  // Mark as Completed Button
  document.querySelectorAll('.complete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // prevent row click
      const inquiryId = e.target.dataset.id;

      if (!confirm('Mark this project as completed?')) {
        return;
      }

      const button = e.target;
      button.disabled = true;
      button.textContent = 'Processing...';

      try {
        const res = await fetch(`http://localhost:3000/api/v1/admin/adminInquiries/${inquiryId}/complete`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to mark as completed');
        }

        const result = await res.json();
        alert('🎉 ' + result.message);
        fetchInquiries(); // Refresh table

      } catch (err) {
        console.error('Complete error:', err);
        alert('❌ Error: ' + err.message);
        button.disabled = false;
        button.textContent = '✔️ Mark as Completed';
      }
    });
  });
}

// ===== FETCH CHAT MESSAGES =====
async function fetchMessages(inquiryId) {
  chatContainer.innerHTML = '<div class="loading">Loading messages...</div>';
  try {
    const res = await fetch(`http://localhost:3000/api/v1/admin/messages/${inquiryId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const messages = await res.json();
    renderMessages(messages);
  } catch (err) { 
    console.error(err);
    chatContainer.innerHTML = '<div class="loading">Failed to load messages</div>';
  }
}

// ===== RENDER MESSAGES =====
function renderMessages(messages) {
  chatContainer.innerHTML = '';
  messages.forEach(m => {
    const div = document.createElement('div');
    div.classList.add('message', m.senderType === 'admin' ? 'admin' : 'user');
    div.innerHTML = `
      <strong>${m.senderName}</strong>
      <span class="msg-date">${new Date(m.createdAt).toLocaleString()}</span>
      <p>${m.message}</p>
      ${m.imageUrl ? `<img src="${m.imageUrl}" class="chat-image">` : ''}
    `;
    chatContainer.appendChild(div);
  });
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ===== SEND MESSAGE (WITH IMAGE SUPPORT) =====
document.getElementById('sendMsgBtn').addEventListener('click', async () => {
  const msg = document.getElementById('msgInput').value.trim();
  const imageFile = imgInput.files[0];

  if (!msg && !imageFile) {
    alert('Please enter a message or select an image.');
    return;
  }

  if (!currentInquiryId) {
    alert('No inquiry selected.');
    return;
  }

  try {
    const sendBtn = document.getElementById('sendMsgBtn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    if (imageFile) {
      const formData = new FormData();
      formData.append('inquiryId', currentInquiryId);
      formData.append('senderType', 'admin');
      formData.append('message', msg || '');
      formData.append('image', imageFile);

      const res = await fetch('http://localhost:3000/api/v1/admin/messages/send-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to send image');
      }

      document.getElementById('msgInput').value = '';
      imgInput.value = '';
      imagePreview.style.display = 'none';
      fileLabel.classList.remove('has-file');
      fileLabel.textContent = '📎';

    } else {
      const res = await fetch('http://localhost:3000/api/v1/admin/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          inquiryId: currentInquiryId,
          senderType: 'admin',
          message: msg
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to send message');
      }

      document.getElementById('msgInput').value = '';
    }

    sendBtn.disabled = false;
    sendBtn.textContent = 'Send';

  } catch (err) {
    console.error('Send error:', err);
    alert('Error: ' + err.message);
    const sendBtn = document.getElementById('sendMsgBtn');
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send';
  }
});

// ===== IMAGE LIGHTBOX =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.querySelector('.lightbox-close');

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('chat-image')) {
    lightboxImg.src = e.target.src;
    lightbox.classList.add('active');
  }
});

if (lightboxClose) {
  lightboxClose.addEventListener('click', () => {
    lightbox.classList.remove('active');
  });
}

if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('active');
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
    lightbox.classList.remove('active');
  }
});

// ===== INITIAL LOAD =====
fetchInquiries();

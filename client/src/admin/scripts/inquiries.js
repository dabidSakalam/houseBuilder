const tableBody = document.getElementById('inquiryTableBody');
const API_URL = 'http://localhost:3000/api/v1/admin/adminInquiries';
const token = localStorage.getItem('adminToken');

const modal = document.getElementById('chatModal');
const chatContainer = document.getElementById('chatContainer');
let currentInquiryId = null;

// ✅ SOCKET.IO CONNECTION
const socket = io('http://localhost:3000');

// ✅ SOCKET FUNCTIONS
function joinInquiryRoom(inquiryId) {
  socket.emit('join-inquiry', inquiryId);
  console.log('Joined inquiry room:', inquiryId);
}

function leaveInquiryRoom(inquiryId) {
  socket.emit('leave-inquiry', inquiryId);
  console.log('Left inquiry room:', inquiryId);
}

// ✅ LISTEN FOR NEW MESSAGES
socket.on('new-message', (message) => {
  console.log('New message received:', message);
  if (message.inquiryId == currentInquiryId) {
    appendNewMessage(message);
  }
});

// ✅ APPEND NEW MESSAGE
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

removePreview.addEventListener('click', () => {
  imgInput.value = '';
  imagePreview.style.display = 'none';
  fileLabel.classList.remove('has-file');
  fileLabel.textContent = '🔎';
});

// ===== CLOSE MODAL =====
modal.querySelector('.close-btn').addEventListener('click', () => {
  if (currentInquiryId) {
    leaveInquiryRoom(currentInquiryId);
    currentInquiryId = null;
  }
  imgInput.value = '';
  imagePreview.style.display = 'none';
  fileLabel.classList.remove('has-file');
  fileLabel.textContent = '🔎';
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
    fileLabel.textContent = '🔎';
    modal.style.display = 'none';
  }
});

// ===== FETCH ALL INQUIRIES =====
async function fetchInquiries() {
  try {
    const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to fetch inquiries');
    const data = await res.json();
    renderTable(data);
  } catch (err) { console.error(err); }
}

// ===== RENDER TABLE =====
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

    // Action Buttons - UPDATED LOGIC
    let actionButtons = '';
    
    if (status === 'pending') {
      // Pending: View Details + Accept only
      actionButtons = `
        <button class="view-details-btn" data-id="${inq.inquiry_id}">👁️ View Details</button>
        <button class="accept-btn" data-id="${inq.inquiry_id}">✅ Accept</button>
      `;
    } else if (status === 'accepted') {
      // Accepted: View Details + Reply + Mark as Completed
      actionButtons = `
        <button class="view-details-btn" data-id="${inq.inquiry_id}">👁️ View Details</button>
        <button class="reply-btn" data-id="${inq.inquiry_id}">💬 Reply</button>
        <button class="complete-btn" data-id="${inq.inquiry_id}">✔️ Mark as Completed</button>
      `;
    } else if (status === 'completed') {
      // Completed: View Details only
      actionButtons = `
        <button class="view-details-btn" data-id="${inq.inquiry_id}">👁️ View Details</button>
        <em style="color: #27ae60;">Project Completed</em>
      `;
    } else if (status === 'cancelled') {
      // Cancelled: View Details only
      actionButtons = `
        <button class="view-details-btn" data-id="${inq.inquiry_id}">👁️ View Details</button>
        <em style="color: #7f8c8d;">Cancelled</em>
      `;
    }

    const row = document.createElement('tr');
    row.className = status;
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
      <td>${actionButtons}</td>
    `;
    tableBody.appendChild(row);
  });
  attachRowActions();
}

// ===== ATTACH ROW ACTIONS =====
function attachRowActions() {
  // View Details Button
  document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const inquiryId = e.target.dataset.id;
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
      if (currentInquiryId) leaveInquiryRoom(currentInquiryId);
      currentInquiryId = e.target.dataset.id;
      modal.style.display = 'block';
      fetchMessages(currentInquiryId);
      joinInquiryRoom(currentInquiryId);
    });
  });

  // Accept Button
  document.querySelectorAll('.accept-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
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

  // NEW: Mark as Completed Button
  document.querySelectorAll('.complete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
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
      fileLabel.textContent = '🔎';

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
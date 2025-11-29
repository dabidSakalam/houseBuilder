const tableBody = document.getElementById('inquiryTableBody');
const API_URL = 'http://localhost:3000/api/v1/admin/adminInquiries';
const token = localStorage.getItem('adminToken');

const modal = document.getElementById('chatModal');
const chatContainer = document.getElementById('chatContainer');
let currentInquiryId = null;

// ===== CLOSE MODAL =====
modal.querySelector('.close-btn').addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', e => { if(e.target === modal) modal.style.display = 'none'; });

// ===== FETCH ALL INQUIRIES =====
async function fetchInquiries() {
  try {
    const res = await fetch(API_URL, { headers:{ Authorization:`Bearer ${token}` } });
    if(!res.ok) throw new Error('Failed to fetch inquiries');
    const data = await res.json();
    renderTable(data);
  } catch(err){ console.error(err); }
}

// ===== RENDER TABLE =====
function renderTable(inquiries){
  tableBody.innerHTML = '';
  inquiries.forEach(inq => {
    const featuresList = inq.featureNames?.join(',') || '';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${inq.client_name}</td>
      <td>${inq.bedrooms || ''}</td>
      <td>${inq.bathrooms || ''}</td>
      <td>${inq.floors || 'N/A'}</td>
      <td>${inq.style || 'N/A'}</td>
      <td>${inq.unit_size || ''}</td>
      <td>${featuresList}</td>
      <td>${inq.city || ''}</td>
      <td>${inq.created_at ? new Date(inq.created_at).toLocaleDateString() : ''}</td>
      <td><button class="reply-btn" data-id="${inq.inquiry_id}">Reply</button></td>
    `;
    tableBody.appendChild(row);
  });
  attachRowActions();
}

// ===== ATTACH REPLY BUTTON =====
function attachRowActions(){
  document.querySelectorAll('.reply-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      currentInquiryId = e.target.dataset.id;
      modal.style.display = 'block';
      fetchMessages(currentInquiryId);
    });
  });
}

// ===== FETCH CHAT MESSAGES =====
async function fetchMessages(inquiryId){
  chatContainer.innerHTML = 'Loading...';
  try {
    const res = await fetch(`http://localhost:3000/api/v1/admin/messages/${inquiryId}`, {
      headers:{ Authorization:`Bearer ${token}` }
    });
    const messages = await res.json();
    renderMessages(messages);
  } catch(err){ console.error(err); }
}

// ===== RENDER MESSAGES =====
function renderMessages(messages){
  chatContainer.innerHTML = '';
  messages.forEach(m => {
    const div = document.createElement('div');
    div.classList.add('message', m.senderType === 'admin' ? 'admin' : 'user');
    div.innerHTML = `
      <strong>${m.senderName}</strong>
      <span class="msg-date">${new Date(m.createdAt).toLocaleString()}</span>
      <p>${m.message}</p>
    `;
    chatContainer.appendChild(div);
  });
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ===== SEND MESSAGE =====
document.getElementById('sendMsgBtn').addEventListener('click', async () => {
  const msg = document.getElementById('msgInput').value.trim();
  if (!msg || !currentInquiryId) {
    alert('Message cannot be empty.');
    return;
  }

  try {
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
      console.error(error);
      alert('Failed to send message: ' + error.message);
      return;
    }

    document.getElementById('msgInput').value = '';
    fetchMessages(currentInquiryId);

  } catch (err) {
    console.error(err);
    alert('An error occurred while sending the message.');
  }
});

// ===== INITIAL LOAD =====
fetchInquiries();

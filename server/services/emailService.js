const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Send inquiry notification to contractor
const sendInquiryNotification = async (inquiryData, clientInfo) => {
  try {
    const { bedrooms, bathrooms, style, floors, unit_size, city, features } = inquiryData;
    
    // Parse features if it's a JSON string or array
    let featuresList = [];
    if (features) {
      try {
        featuresList = Array.isArray(features) ? features : JSON.parse(features);
      } catch (e) {
        console.error('Error parsing features:', e);
        featuresList = [];
      }
    }

    // Build client name safely
    const clientName = `${clientInfo.first_name || ''} ${clientInfo.last_name || ''}`.trim() || 'N/A';
    const clientEmail = clientInfo.email || 'Not provided';
    const clientPhone = clientInfo.phone || 'Not provided';
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">
          🏠 New Project Inquiry
        </h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #34495e; margin-top: 0;">👤 Client Information</h3>
          <p style="margin: 8px 0;"><strong>Name:</strong> ${clientName}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${clientEmail}">${clientEmail}</a></p>
          <p style="margin: 8px 0;"><strong>Phone:</strong> ${clientPhone}</p>
        </div>
        
        <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #34495e; margin-top: 0;">📋 Project Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; width: 40%;"><strong>🎨 Style:</strong></td>
              <td style="padding: 10px 0;">${style || 'Not specified'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0;"><strong>🛏️ Bedrooms:</strong></td>
              <td style="padding: 10px 0;">${bedrooms || 'Not specified'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0;"><strong>🛁 Bathrooms:</strong></td>
              <td style="padding: 10px 0;">${bathrooms || 'Not specified'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0;"><strong>🏢 Floors:</strong></td>
              <td style="padding: 10px 0;">${floors || 'Not specified'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0;"><strong>📏 Unit Size:</strong></td>
              <td style="padding: 10px 0;">${unit_size || 'Not specified'} sqm</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0;"><strong>📍 Location:</strong></td>
              <td style="padding: 10px 0;">${city || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; vertical-align: top;"><strong>✨ Features:</strong></td>
              <td style="padding: 10px 0;">
                ${featuresList.length > 0 
                  ? featuresList.map(f => `<span style="background: #e8f4f8; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 2px;">${f}</span>`).join(' ')
                  : '<em style="color: #7f8c8d;">No features selected</em>'
                }
              </td>
            </tr>
          </table>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #e8f4f8; border-left: 4px solid #3498db; border-radius: 4px;">
          <p style="margin: 0; color: #2c3e50;">
            📧 <strong>Action Required:</strong> Please review this inquiry and contact the client to discuss the project details.
          </p>
        </div>
        
        <div style="margin-top: 20px; text-align: center; color: #7f8c8d; font-size: 12px;">
          <p style="margin: 5px 0;">This is an automated notification from HouseBuilder</p>
          <p style="margin: 5px 0;">Inquiry received on ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"HouseBuilder - New Inquiry" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTRACTOR_EMAIL,
      subject: `🏠 New Project Inquiry - ${city || 'Unknown'} | ${style || 'Unknown'} (${bedrooms || '?'} BR, ${bathrooms || '?'} BA)`,
      html: emailContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { 
  sendInquiryNotification,
  transporter // Export for testing if needed
};

// Add this after sendInquiryNotification function

// Send cancellation notification to contractor
const sendCancellationNotification = async (inquiryData, clientInfo) => {
  try {
    const { bedrooms, bathrooms, style, floors, unit_size, city, inquiry_id } = inquiryData;
    
    const clientName = `${clientInfo.first_name || ''} ${clientInfo.last_name || ''}`.trim() || 'N/A';
    const clientEmail = clientInfo.email || 'Not provided';
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c; border-bottom: 3px solid #e74c3c; padding-bottom: 10px;">
          ❌ Project Inquiry Cancelled
        </h2>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404;">
            <strong>⚠️ Notice:</strong> A client has cancelled their project inquiry.
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #34495e; margin-top: 0;">👤 Client Information</h3>
          <p style="margin: 8px 0;"><strong>Name:</strong> ${clientName}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${clientEmail}">${clientEmail}</a></p>
          <p style="margin: 8px 0;"><strong>Inquiry ID:</strong> #${inquiry_id}</p>
        </div>
        
        <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #34495e; margin-top: 0;">📋 Cancelled Project Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; width: 40%;"><strong>🎨 Style:</strong></td>
              <td style="padding: 10px 0;">${style || 'Not specified'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0;"><strong>🛏️ Bedrooms:</strong></td>
              <td style="padding: 10px 0;">${bedrooms || 'Not specified'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0;"><strong>🛁 Bathrooms:</strong></td>
              <td style="padding: 10px 0;">${bathrooms || 'Not specified'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0;"><strong>🏢 Floors:</strong></td>
              <td style="padding: 10px 0;">${floors || 'Not specified'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0;"><strong>📏 Unit Size:</strong></td>
              <td style="padding: 10px 0;">${unit_size || 'Not specified'} sqm</td>
            </tr>
            <tr>
              <td style="padding: 10px 0;"><strong>📍 Location:</strong></td>
              <td style="padding: 10px 0;">${city || 'Not specified'}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-top: 20px; text-align: center; color: #7f8c8d; font-size: 12px;">
          <p style="margin: 5px 0;">This is an automated notification from HouseBuilder</p>
          <p style="margin: 5px 0;">Cancelled on ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"HouseBuilder - Cancellation Notice" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTRACTOR_EMAIL,
      subject: `❌ Project Cancelled - Inquiry #${inquiry_id} | ${city || 'Unknown'} - ${style || 'Unknown'}`,
      html: emailContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Cancellation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Cancellation email error:', error);
    return { success: false, error: error.message };
  }
};

// Update module.exports
module.exports = { 
  sendInquiryNotification,
  sendCancellationNotification,
  transporter
};
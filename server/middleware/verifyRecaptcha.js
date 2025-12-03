// server/middleware/verifyRecaptcha.js

require("dotenv").config();

// If you're on Node < 18, install node-fetch:
//   npm install node-fetch
// and uncomment the next line:
// const fetch = require("node-fetch");

async function verifyRecaptcha(req, res, next) {
  try {
    const token = req.body.recaptchaToken;

    if (!token) {
      return res.status(400).json({ message: "reCAPTCHA token is missing." });
    }

    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET); // v2 SECRET
    params.append("response", token);

    const googleRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      }
    );

    const data = await googleRes.json();

    if (!data.success) {
      console.error("reCAPTCHA verification failed:", data);
      return res
        .status(400)
        .json({ message: "reCAPTCHA verification failed." });
    }

    // ✅ Passed – continue to actual handler
    next();
  } catch (err) {
    console.error("reCAPTCHA error:", err);
    res.status(500).json({ message: "Error verifying reCAPTCHA." });
  }
}

module.exports = verifyRecaptcha;

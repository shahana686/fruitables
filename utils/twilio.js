// const twilio = require("twilio");
// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// module.exports = client;


// utils/twilio.js

require('dotenv').config();  // ⬅️ IMPORTANT: Must be at the top

const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error("Missing Twilio credentials in .env file");
}

const client = twilio(accountSid, authToken);

module.exports = client;

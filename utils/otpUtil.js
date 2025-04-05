const axios = require("axios");

const sendOTP = async (phoneNumber, otp) => {
  try {
    console.log(`OTP ${otp} sent to ${phoneNumber}`);

    const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilioClient.messages.create({
      body: `Your OTP for GoSkilled is: ${otp}`,
      from: "+12182062861",
      to: `+91${phoneNumber}`
    });

    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    return false;
  }
};

module.exports = { sendOTP };

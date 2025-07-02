const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
  imagePublicId : { type: String },
  date: { type: String, required: true },
  time: { type: String, required: true },
  joinLink: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isExpired: { type: Boolean, default: false },
});

module.exports = mongoose.model("Meeting", meetingSchema);

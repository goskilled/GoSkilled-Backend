const mongoose = require("mongoose");
const Meeting = require("../../../models/meeting/Meeting");
const MeetingRegistration = require("../../../models/meeting/MeetingRegistration");

// Create a meeting
exports.createMeeting = async (req, res) => {
  try {
    const { title, description, date, time, image, imagePublicId, joinLink } = req.body;

    if (!title || !description || !date || !time || !imagePublicId || !joinLink || !image) {
      return res.status(400).json({ error: "All required fields must be filled." });
    }


    const meeting = new Meeting(req.body);
    await meeting.save();
    return res.status(201).json(meeting);
  } catch (err) {
    console.error("Create Meeting Error:", err);
    return res.status(500).json({ error: "Failed to create meeting." });
  }
};


exports.checkIfRegistered = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existing = await MeetingRegistration.findOne({ meetingId: id, email });
    res.json({ registered: !!existing });
  } catch (err) {
    console.error("Error checking registration", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all active (non-expired) meetings
exports.getMeetings = async (req, res) => {
  try {
    const now = new Date();

    // Mark expired meetings
    await Meeting.updateMany(
      {
        isExpired: false,
        $expr: {
          $lt: [
            { $dateFromString: { dateString: { $concat: ["$date", "T", "$time"] } } },
            now
          ]
        }
      },
      { isExpired: true }
    );

    const meetings = await Meeting.find({ isExpired: false }).sort({ date: 1, time: 1 });
    return res.status(200).json(meetings);
  } catch (err) {
    console.error("Fetch Meetings Error:", err);
    return res.status(500).json({ error: "Failed to fetch meetings." });
  }
};

// Update a meeting
exports.updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid meeting ID." });
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedMeeting) {
      return res.status(404).json({ error: "Meeting not found." });
    }

    return res.status(200).json({ message: "Meeting updated successfully", updatedMeeting });
  } catch (err) {
    console.error("Update Meeting Error:", err);
    return res.status(500).json({ error: "Failed to update meeting." });
  }
};


exports.getSingleMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid meeting ID." });
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found." });
    }

    res.status(200).json(meeting);
  } catch (err) {
    console.error("Failed to get meeting:", err);
    res.status(500).json({ error: "Server error while fetching meeting." });
  }
};

// Delete a meeting and its registrations
exports.deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid meeting ID." });
    }

    const deletedMeeting = await Meeting.findByIdAndDelete(id);
    if (!deletedMeeting) {
      return res.status(404).json({ error: "Meeting not found." });
    }

    await MeetingRegistration.deleteMany({ meetingId: id });

    return res.status(200).json({ message: "Meeting and related registrations deleted successfully." });
  } catch (err) {
    console.error("Delete Meeting Error:", err);
    return res.status(500).json({ error: "Failed to delete meeting." });
  }
};

// Register user for meeting
exports.registerForMeeting = async (req, res) => {
  try {
    const { meetingId, name, email, phone } = req.body;

    if (!meetingId || !name || !email || !phone) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID." });
    }

    const existingMeeting = await Meeting.findById(meetingId);
    if (!existingMeeting || existingMeeting.isExpired) {
      return res.status(404).json({ error: "Meeting not found or expired." });
    }

    const registration = new MeetingRegistration({ meetingId, name, email, phone });
    await registration.save();
    return res.status(201).json({ message: "Registered successfully." });
  } catch (err) {
    console.error("Meeting Registration Error:", err);
    return res.status(500).json({ error: "Registration failed." });
  }
};

// Get all registrations for a meeting (admin use)
exports.getRegistrationsByMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID." });
    }

    const registrations = await MeetingRegistration.find({ meetingId });
    return res.status(200).json(registrations);
  } catch (err) {
    console.error("Fetch Registrations Error:", err);
    return res.status(500).json({ error: "Failed to fetch registrations." });
  }
};

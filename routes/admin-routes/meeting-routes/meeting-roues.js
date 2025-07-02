const express = require("express");
const router = express.Router();
const meetingController = require("../../../controllers/admin-controller/meeting-controller/meetingController");

router.post("/", meetingController.createMeeting);

router.get("/", meetingController.getMeetings);

router.get("/:id", meetingController.getSingleMeeting); 

router.put("/:id", meetingController.updateMeeting)

router.delete("/:id", meetingController.deleteMeeting);

router.post("/register", meetingController.registerForMeeting);

router.get("/:meetingId/registrations", meetingController.getRegistrationsByMeeting);

router.get("/:id/registered", meetingController.checkIfRegistered);

module.exports = router;

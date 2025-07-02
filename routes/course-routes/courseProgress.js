const express = require("express");
const {
    getCurrentCourseProgress,
    markCurrentLectureAsViewed,
    resetCurrentCourseProgress,
} = require("../../controllers/course-controller/course-progress");

const router = express.Router();

router.get("/get/:userId/:courseId", getCurrentCourseProgress);
router.post("/mark-lecture-viewed", markCurrentLectureAsViewed);
router.post("/reset-progress", resetCurrentCourseProgress);
module.exports = router;

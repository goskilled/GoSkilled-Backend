const express = require("express");
const {
  getStudentViewCourseDetails,
  getAllStudentViewCourses,
  checkCoursePurchaseInfo,
  checkEnrolledCourse,
  clearUserCourses,
  getAllUserDetails,
} = require("../../controllers/course-controller/course-controller");

const router = express.Router();

router.get("/get", getAllStudentViewCourses);

router.get('/allUsers', getAllUserDetails);

router.get("/update/model/:userId", clearUserCourses);

router.get("/get/details/:id", getStudentViewCourseDetails);

router.get("/purchase-info/:id/:studentId", checkCoursePurchaseInfo);

router.get("/course-enrolled/:userId", checkEnrolledCourse)

module.exports = router;

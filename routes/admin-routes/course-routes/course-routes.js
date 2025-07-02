const express = require("express");
const {
    addNewCourse,
    getAllCourses,
    getCourseDetailsByID,
    updateCourseByID,
    deleteCourseById,
} = require("../../../controllers/admin-controller/courses-controller/course-controller");
const router = express.Router();

router.post("/add", addNewCourse);

router.get("/get", getAllCourses);

router.get("/get/details/:id", getCourseDetailsByID);

router.put("/update/:id", updateCourseByID);

router.delete("/delete/:id", deleteCourseById)

module.exports = router;

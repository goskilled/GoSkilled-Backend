const Course = require("../../../models/Course");
const User = require("../../../models/User");

const addNewCourse = async (req, res) => {
    try {
        const courseData = req.body;

        const newlyCreatedCourse = new Course(courseData);
        const saveCourse = await newlyCreatedCourse.save();

        if (saveCourse) {
            res.status(201).json({
                success: true,
                message: "Course saved successfully",
                data: saveCourse,
            });
        }
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Some error occured!",
        });
    }
};

const getAllCourses = async (req, res) => {
    try {
        const coursesList = await Course.find({});

        res.status(200).json({
            success: true,
            data: coursesList,
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Some error occured!",
        });
    }
};

const getCourseDetailsByID = async (req, res) => {
    try {
        const { id } = req.params;
        const courseDetails = await Course.findById(id);

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: "Course not found!",
            });
        }

        res.status(200).json({
            success: true,
            data: courseDetails,
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            success: false,
            message: "Some error occured!",
        });
    }
};

const deleteCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        // Step 1: Find and delete the course
        const course = await Course.findByIdAndDelete(id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found!",
            });
        }

        // Step 2: Remove the course ID from all users
        await User.updateMany(
            {
                $or: [
                    { purchasedCourses: id },
                    { enrolledCourses: id }
                ]
            },
            {
                $pull: {
                    purchasedCourses: id,
                    enrolledCourses: id
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: "Course deleted and removed from users' records.",
        });

    } catch (error) {
        console.error("Error deleting course:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while deleting course.",
        });
    }
};

const updateCourseByID = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCourseData = req.body;

        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            updatedCourseData,
            { new: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found!",
            });
        }

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse,
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            success: false,
            message: "Some error occured!",
        });
    }
};

module.exports = {
    addNewCourse,
    getAllCourses,
    updateCourseByID,
    getCourseDetailsByID,
    deleteCourseById,
};

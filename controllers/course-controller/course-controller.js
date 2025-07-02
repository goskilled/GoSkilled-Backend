const Course = require("../../models/Course");
const User = require("../../models/User");

const getAllStudentViewCourses = async (req, res) => {
  try {
    const {
      category = [],
      level = [],
      primaryLanguage = [],
      sortBy = "price-lowtohigh",
    } = req.query;

    let filters = {};
    if (category.length) {
      filters.category = { $in: category.split(",") };
    }
    if (level.length) {
      filters.level = { $in: level.split(",") };
    }
    if (primaryLanguage.length) {
      filters.primaryLanguage = { $in: primaryLanguage.split(",") };
    }

    let sortParam = {};
    switch (sortBy) {
      case "price-lowtohigh":
        sortParam.pricing = 1;

        break;
      case "price-hightolow":
        sortParam.pricing = -1;

        break;
      case "title-atoz":
        sortParam.title = 1;

        break;
      case "title-ztoa":
        sortParam.title = -1;

        break;

      default:
        sortParam.pricing = 1;
        break;
    }

    const coursesList = await Course.find(filters).sort(sortParam);

    res.status(200).json({
      success: true,
      data: coursesList,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getStudentViewCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const courseDetails = await Course.findById(id);

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "No course details found",
        data: null,
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

const checkCoursePurchaseInfo = async (req, res) => {
  try {
    const { id: courseId, studentId } = req.params;

    // Fetch the user and their enrolledCourses array
    const student = await User.findOne({ _id: studentId }).select('enrolledCourses');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check if the courseId exists in enrolledCourses array
    const isEnrolled = student.enrolledCourses.some(
      (enrolledCourseId) => enrolledCourseId.toString() === courseId
    );

    res.status(200).json({
      success: true,
      enrolled: isEnrolled,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: 'Some error occurred!',
    });
  }
};

const getAllUserDetails = async (req, res) => {
  try {
    const users = await User.find().select("name mobileNumber referralCode");

    const userData = await Promise.all(
      users.map(async (user) => {
        const totalReferrals = await User.countDocuments({ referredBy: user._id });
        return {
          _id: user._id,
          name: user.name,
          mobileNumber: user.mobileNumber,
          totalReferrals,
        };
      })
    );

    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
}

const checkEnrolledCourse = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        enrolled: false,
        message: "User not found"
      });
    }

    const isEnrolled = user.enrolledCourses && user.enrolledCourses.length > 0;

    return res.status(200).json({
      enrolled: isEnrolled,
      message: isEnrolled ? "User is enrolled in at least one course." : "User is not enrolled in any course."
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      enrolled: false,
      error: "Error checking enrollment"
    });
  }
}

const clearUserCourses = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          purchasedCourses: [],
          enrolledCourses: []
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, message: "Courses cleared", user });
  } catch (err) {
    console.error("Error clearing courses:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


module.exports = {
  getAllStudentViewCourses,
  getStudentViewCourseDetails,
  checkCoursePurchaseInfo,
  checkEnrolledCourse,
  clearUserCourses,
  getAllUserDetails,
};

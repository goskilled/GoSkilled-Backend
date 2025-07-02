const User = require("../../models/User");

const getAllUserDetails = async (req, res) => {
    try {
        const users = await User.find().select("name mobileNumber email registrationDate");

        const userData = await Promise.all(
            users.map(async (user) => {
                const totalReferrals = await User.countDocuments({ referredBy: user._id });
                return {
                    _id: user._id,
                    name: user.name,
                    mobileNumber: user.mobileNumber,
                    email: user.email,
                    createdAt: user.registrationDate,
                    totalReferrals,
                };
            })
        );

        res.status(200).json(userData);
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", error });
    }
};

module.exports = {
    getAllUserDetails
};

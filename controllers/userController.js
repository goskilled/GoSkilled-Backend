const User = require('../models/User');

const getUserDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const userKycDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user' });
  }
}

const checkReferralLink = async (req, res) => {
  try {
    const { id, code } = req.params;

    if (!id || !code) {
      return res.status(400).json({
        success: false,
        message: 'Missing user ID or referral code.',
        verified: false
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Invalid Referral Link',
        data: {
          verified: false
        }
      });
    }

    if (user.referralCode === code) {
      return res.status(200).json({
        success: true,
        message: 'Referral Code Verified',
        data: {
          verified: true
        }
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'Referral Code is not matched',
        data: {
          verified: false
        }
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error during referral check',
      verified: false
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

const getReferralTree = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Fields to return for users and their referrers
    const selectFields = 'name email mobileNumber referredBy';

    // Level 1 referrals
    const level1 = await User.find({ referredBy: user._id })
      .select(selectFields)
      .populate('referredBy', 'name email mobileNumber');

    // Level 2 referrals
    const level1Ids = level1.map(u => u._id);
    const level2 = await User.find({ referredBy: { $in: level1Ids } })
      .select(selectFields)
      .populate('referredBy', 'name email mobileNumber');

    // Level 3 referrals
    const level2Ids = level2.map(u => u._id);
    const level3 = await User.find({ referredBy: { $in: level2Ids } })
      .select(selectFields)
      .populate('referredBy', 'name email mobileNumber');

    res.json({
      user: {
        name: user.name,
        referralCode: user.referralCode,
        _id: user._id
      },
      referrals: {
        level1,
        level2,
        level3
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const getLeaderboardUsers = async (req, res) => {
  try {

    const topUsers = await User.aggregate([
      {
        $match: {
          referralCode: { $ne: 'GS9D64D228' }
        }
      },
      {
        $addFields: {
          level1Count: { $size: { $ifNull: ["$referralLevels.level1", []] } },
          level2Count: { $size: { $ifNull: ["$referralLevels.level2", []] } },
          level3Count: { $size: { $ifNull: ["$referralLevels.level3", []] } }
        }
      },
      {
        $addFields: {
          totalReferralCount: {
            $add: ["$level1Count", "$level2Count", "$level3Count"]
          }
        }
      },
      {
        $sort: {
          "wallet.totalEarned": -1,
          level1Count: -1,
          registrationDate: 1
        }
      },
      { $limit: 11 },
      {
        $project: {
          name: 1,
          email: 1,
          wallet: 1,
          referralCode: 1,
          level1Count: 1,
          totalReferralCount: 1,
          registrationDate: 1
        }
      }
    ]);

    res.status(200).json({ success: true, data: topUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateReferral = async (req, res) => {
  const allUsers = await User.find({}, '_id referredBy');
  let updates = 0;

  for (const user of allUsers) {
    const userId = user._id;

    if (!user.referredBy) continue;

    // Level 1
    const level1User = await User.findById(user.referredBy);
    if (level1User && !level1User.referralLevels.level1.includes(userId)) {
      level1User.referralLevels.level1.push(userId);
      await level1User.save();
      updates++;
    }

    // Level 2
    if (level1User?.referredBy) {
      const level2User = await User.findById(level1User.referredBy);
      if (level2User && !level2User.referralLevels.level2.includes(userId)) {
        level2User.referralLevels.level2.push(userId);
        await level2User.save();
        updates++;
      }

      // Level 3
      if (level2User?.referredBy) {
        const level3User = await User.findById(level2User.referredBy);
        if (level3User && !level3User.referralLevels.level3.includes(userId)) {
          level3User.referralLevels.level3.push(userId);
          await level3User.save();
          updates++;
        }
      }
    }
  }

  console.log(`Referral levels updated for ${updates} entries.`);
}

module.exports = {
  getUserDetails,
  getAllUserDetails,
  getReferralTree,
  getLeaderboardUsers,
  checkReferralLink,
  userKycDetails,
  updateReferral
}
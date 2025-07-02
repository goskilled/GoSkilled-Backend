const express = require("express");
const { getAllUserDetails } = require("../../controllers/admin-controller/admin-controller");
const router = express.Router();

router.get('/allUsers', getAllUserDetails);

module.exports = router;

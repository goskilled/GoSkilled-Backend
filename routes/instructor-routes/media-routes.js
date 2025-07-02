const express = require("express");
const multer = require("multer");
const fs = require("fs/promises");
const path = require("path");

const {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary,
  deletePhotoFromCloudinary,
} = require("../../utils/cloudinary");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file?.path;

  if (!filePath) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  try {
    const result = await uploadMediaToCloudinary(filePath);
    await fs.unlink(filePath);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    await fs.unlink(filePath).catch(() => {});

    res.status(500).json({ success: false, message: "Error uploading file" });
  }
});

router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: "Asset ID is required" });
  }

  try {
    const response = await deleteMediaFromCloudinary(id);

    res.status(200).json({
      success: true,
      message: "Asset deleted successfully from Cloudinary",
      data: response,
    });
  } catch (error) {
    console.error("Delete Media Error:", error);

    res.status(500).json({ success: false, message: "Error deleting media file" });
  }
});

router.delete("/delete/photo/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: "Asset ID is required" });
  }

  try {
    const response = await deletePhotoFromCloudinary(id);

    res.status(200).json({
      success: true,
      message: "Photo deleted successfully from Cloudinary",
      data: response,
    });
  } catch (error) {
    console.error("Delete Photo Error:", error);

    res.status(500).json({ success: false, message: "Error deleting photo file" });
  }
});

module.exports = router;

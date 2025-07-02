const Blogs = require("../../../models/Blogs");

// Create a blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content, author, image, imagePublicId } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const blog = new Blogs({ title, content, author, image, imagePublicId });
    await blog.save();

    res.status(201).json({ message: "Blog created successfully", data: blog });
  } catch (error) {
    console.error("Create blog error:", error);
    res.status(500).json({ error: "Failed to create blog" });
  }
};

// Get all blogs
exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blogs.find().sort({ createdAt: -1 });
    res.json({ data: blogs });
  } catch (error) {
    console.error("Fetch blogs error:", error);
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
};

// Get blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blogs.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.json({ data: blog });
  } catch (error) {
    console.error("Get blog by ID error:", error);
    res.status(500).json({ error: "Failed to fetch blog" });
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  try {
    const { title, content, author, image, imagePublicId } = req.body;

    const blog = await Blogs.findByIdAndUpdate(
      req.params.id,
      { title, content, author, image, imagePublicId },
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.json({ message: "Blog updated successfully", data: blog });
  } catch (error) {
    console.error("Update blog error:", error);
    res.status(500).json({ error: "Failed to update blog" });
  }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blogs.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Delete blog error:", error);
    res.status(500).json({ error: "Failed to delete blog" });
  }
};

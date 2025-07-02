const express = require('express');
const router = express.Router();
const blogController = require('../../../controllers/admin-controller/blogs-controller/blogs-controller');

// Public Routes
router.get('/', blogController.getBlogs);
router.get('/:id', blogController.getBlogById);

// Admin Routes
router.post('/', blogController.createBlog);
router.put('/:id', blogController.updateBlog);
router.delete('/:id', blogController.deleteBlog);

module.exports = router;

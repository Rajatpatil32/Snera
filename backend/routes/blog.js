const express = require('express');
const router  = express.Router();
const Blog    = require('../models/Blog');
const auth    = require('../middleware/auth');

// PUBLIC: paginated blog list
router.get('/', async (req, res) => {
  try {
    const page     = parseInt(req.query.page)  || 1;
    const limit    = parseInt(req.query.limit) || 9;
    const { category, tag } = req.query;

    const query = { isPublished: true };
    if (category) query.category = category;
    if (tag)      query.tags     = tag;

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .select('-content')
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Blog.countDocuments(query),
    ]);

    res.json({ data: blogs, pagination: { current: page, total: Math.ceil(total / limit), count: total } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUBLIC: single blog by slug + increment views
router.get('/slug/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true })
      .populate('relatedProducts', 'name slug price images');
    if (!blog) return res.status(404).json({ error: 'Not found' });
    await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });
    res.json(blog);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUBLIC: recent featured blogs (for homepage)
router.get('/featured/recent', async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true })
      .select('title slug excerpt featuredImage category publishedAt readTime')
      .sort({ publishedAt: -1 })
      .limit(parseInt(req.query.limit) || 3);
    res.json(blogs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUBLIC: list categories with counts
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Blog.distinct('category', { isPublished: true });
    const result = await Promise.all(
      categories.map(async name => ({
        name,
        count: await Blog.countDocuments({ category: name, isPublished: true }),
      }))
    );
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADMIN: all blogs (including drafts)
router.get('/admin/all', auth, async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const [data, total] = await Promise.all([
      Blog.find().select('-content').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
      Blog.countDocuments(),
    ]);
    res.json({ data, pagination: { current: page, total: Math.ceil(total/limit), count: total } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADMIN: single blog by id, full content, any publish status
router.get('/admin/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Not found' });
    res.json(blog);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADMIN: create blog
router.post('/admin', auth, async (req, res) => {
  try {
    const blog = new Blog(req.body);
    if (blog.isPublished && !blog.publishedAt) blog.publishedAt = new Date();
    const saved = await blog.save();
    res.status(201).json(saved);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ADMIN: update blog
router.put('/admin/:id', auth, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.isPublished && !update.publishedAt) update.publishedAt = new Date();
    const blog = await Blog.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!blog) return res.status(404).json({ error: 'Not found' });
    res.json(blog);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ADMIN: toggle publish
router.patch('/admin/:id/publish', auth, async (req, res) => {
  try {
    const { isPublished } = req.body;
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { isPublished, publishedAt: isPublished ? new Date() : null },
      { new: true }
    );
    if (!blog) return res.status(404).json({ error: 'Not found' });
    res.json(blog);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ADMIN: delete blog
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
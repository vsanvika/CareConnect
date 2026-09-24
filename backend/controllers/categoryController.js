// backend/controllers/categoryController.js
import ServiceCategory from '../models/ServiceCategory.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

// @desc   Get all active categories (public)
// @route  GET /api/v1/categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await ServiceCategory.find({ isActive: true }).sort('name');
  res.json({ success: true, data: categories });
});

// @desc   Get single category by ID (public)
// @route  GET /api/v1/categories/:id
export const getCategory = asyncHandler(async (req, res, next) => {
  const category = await ServiceCategory.findById(req.params.id);
  if (!category) return next(new ApiError('Category not found', 404));
  res.json({ success: true, data: category });
});

// @desc   Create a new category (admin only)
// @route  POST /api/v1/categories
export const createCategory = asyncHandler(async (req, res, next) => {
  const { name, description, basePrice, requiredSkillTags, icon } = req.body;
  if (!name || !description) return next(new ApiError('Name and description are required', 400));
  const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
  const existing = await ServiceCategory.findOne({ $or: [{ name }, { slug }] });
  if (existing) return next(new ApiError('Category already exists', 400));
  const category = await ServiceCategory.create({
    name,
    slug,
    description,
    basePrice: basePrice || 50,
    requiredSkillTags: requiredSkillTags || [],
    icon: icon || 'Wrench'
  });
  res.status(201).json({ success: true, data: category });
});

// @desc   Update category (admin only)
// @route  PUT /api/v1/categories/:id
export const updateCategory = asyncHandler(async (req, res, next) => {
  const updates = req.body;
  if (updates.name) updates.slug = updates.name.trim().toLowerCase().replace(/\s+/g, '-');
  const category = await ServiceCategory.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!category) return next(new ApiError('Category not found', 404));
  res.json({ success: true, data: category });
});

// @desc   Delete category (admin only)
// @route  DELETE /api/v1/categories/:id
export const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await ServiceCategory.findByIdAndDelete(req.params.id);
  if (!category) return next(new ApiError('Category not found', 404));
  res.json({ success: true, message: 'Category deleted' });
});

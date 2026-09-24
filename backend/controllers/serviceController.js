import ServiceCategory from '../models/ServiceCategory.js';

export const getServices = async (req, res, next) => {
  try {
    const services = await ServiceCategory.find({ isActive: true });
    res.json({ success: true, count: services.length, data: services });
  } catch (err) {
    next(err);
  }
};

export const createService = async (req, res, next) => {
  try {
    const { name, description, icon, basePrice, requiredSkillTags } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const service = await ServiceCategory.create({
      name,
      slug,
      description,
      icon: icon || 'Wrench',
      basePrice,
      requiredSkillTags: requiredSkillTags || []
    });
    res.status(201).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
};

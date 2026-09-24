export const isOwnerOrAdmin = (model, idParam = 'id', ownerField = 'customerId') => {
  return async (req, res, next) => {
    try {
      if (['PLATFORM_ADMIN', 'OPERATIONS_MANAGER'].includes(req.user.role)) {
        return next();
      }

      const resource = await model.findById(req.params[idParam]);
      if (!resource) {
        return res.status(404).json({ success: false, message: 'Requested resource not found.' });
      }

      const ownerId = resource[ownerField]?.toString() || resource.userId?.toString();

      if (ownerId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied: You do not own this resource.'
        });
      }

      req.resource = resource;
      next();
    } catch (err) {
      next(err);
    }
  };
};

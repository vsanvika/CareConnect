import path from 'path';
import JobEvidence from '../models/JobEvidence.js';
import ServiceRequest from '../models/ServiceRequest.js';

export const getProtectedUpload = async (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename);
    const localUrl = `/api/v1/files/${filename}`;
    const legacyUrl = `/uploads/${filename}`;
    const evidence = await JobEvidence.findOne({ fileUrls: { $in: [localUrl, legacyUrl] } }).populate('bookingId', 'customerId providerId');
    const request = await ServiceRequest.findOne({ images: { $in: [localUrl, legacyUrl] } }).select('customerId eligibleProviders.providerId');
    if (!evidence && !request) return res.status(404).json({ success: false, message: 'File not found' });

    const canView = ['PLATFORM_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_AGENT'].includes(req.user.role)
      || (evidence && (evidence.bookingId.customerId.toString() === req.user._id.toString() || evidence.bookingId.providerId.toString() === req.user._id.toString()))
      || (request && (request.customerId.toString() === req.user._id.toString() || request.eligibleProviders.some(({ providerId }) => providerId.toString() === req.user._id.toString())));
    if (!canView) return res.status(403).json({ success: false, message: 'Not authorized to view this file' });

    return res.sendFile(path.resolve('uploads', filename), { dotfiles: 'deny' }, (err) => {
      if (err && !res.headersSent) next(err);
    });
  } catch (err) {
    next(err);
  }
};
import Availability from '../models/Availability.js';
import { AvailabilityService } from '../services/availabilityService.js';
import { recordAudit } from '../utils/recordAudit.js';

const getProviderId = (req) => (
  req.user.role === 'PLATFORM_ADMIN' && req.query.providerId
    ? req.query.providerId
    : req.user._id
);

export const getAvailability = async (req, res, next) => {
  try {
    const providerId = getProviderId(req);
    const filter = { providerId };

    if (req.query.kind) {
      filter.kind = req.query.kind;
    }

    if (req.query.from || req.query.to) {
      filter.start = {};
      if (req.query.from) filter.start.$gte = new Date(req.query.from);
      if (req.query.to) filter.start.$lte = new Date(req.query.to);
    }

    const availability = await Availability.find(filter).sort({ start: 1 });
    res.json({ success: true, count: availability.length, data: availability });
  } catch (err) {
    next(err);
  }
};

export const createAvailability = async (req, res, next) => {
  try {
    const { start, end, kind = 'AVAILABLE', notes = '' } = req.body;
    const interval = await AvailabilityService.assertAvailabilityWindowIsFree(
      req.user._id,
      start,
      end,
      kind
    );

    const availability = await Availability.create({
      providerId: req.user._id,
      ...interval,
      kind,
      notes
    });
    await recordAudit({ req, action: 'AVAILABILITY_CREATED', entityType: 'Availability', entityId: availability._id, newState: { start: availability.start, end: availability.end, kind: availability.kind } });

    res.status(201).json({ success: true, data: availability });
  } catch (err) {
    next(err);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const availability = await Availability.findById(req.params.id);
    if (!availability) {
      return res.status(404).json({ success: false, message: 'Availability period not found' });
    }

    if (availability.providerId.toString() !== req.user._id.toString() && req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this availability period' });
    }

    const start = req.body.start ?? availability.start;
    const end = req.body.end ?? availability.end;
    const kind = req.body.kind ?? availability.kind;
    const interval = await AvailabilityService.assertAvailabilityWindowIsFree(
      availability.providerId,
      start,
      end,
      kind,
      availability._id
    );

    availability.start = interval.start;
    availability.end = interval.end;
    availability.kind = kind;
    if (req.body.notes !== undefined) availability.notes = req.body.notes;
    await availability.save();
    await recordAudit({ req, action: 'AVAILABILITY_UPDATED', entityType: 'Availability', entityId: availability._id, newState: { start: availability.start, end: availability.end, kind: availability.kind } });

    res.json({ success: true, data: availability });
  } catch (err) {
    next(err);
  }
};

export const deleteAvailability = async (req, res, next) => {
  try {
    const availability = await Availability.findById(req.params.id);
    if (!availability) {
      return res.status(404).json({ success: false, message: 'Availability period not found' });
    }

    if (availability.providerId.toString() !== req.user._id.toString() && req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this availability period' });
    }

    await availability.deleteOne();
    await recordAudit({ req, action: 'AVAILABILITY_DELETED', entityType: 'Availability', entityId: availability._id, previousState: { start: availability.start, end: availability.end, kind: availability.kind } });
    res.json({ success: true, message: 'Availability period deleted' });
  } catch (err) {
    next(err);
  }
};

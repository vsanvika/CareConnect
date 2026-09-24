import Notification from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    next(err);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipientId: req.user._id, read: false }, { $set: { read: true } });
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

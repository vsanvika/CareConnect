import Notification from '../models/Notification.js';
import User from '../models/User.js';

export class NotificationService {
  /**
   * Dispatches an in-app notification to a user
   */
  static async sendNotification({ recipientId, title, message, type = 'SYSTEM', linkUrl = '' }) {
    try {
      const notification = await Notification.create({
        recipientId,
        title,
        message,
        type,
        linkUrl
      });
      return notification;
    } catch (err) {
      console.error(`[Notification Error] Failed to create notification: ${err.message}`);
    }
  }

  static async notifyRoles({ roles, title, message, type = 'SYSTEM', linkUrl = '' }) {
    const users = await User.find({ role: { $in: roles }, isActive: true }).select('_id');
    await Promise.all(users.map((user) => this.sendNotification({
      recipientId: user._id,
      title,
      message,
      type,
      linkUrl
    })));
  }
}

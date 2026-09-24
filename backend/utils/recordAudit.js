import AuditLog from '../models/AuditLog.js';

export const recordAudit = async ({ req, action, entityType, entityId, previousState = null, newState = null, metadata = {} }) => AuditLog.create({
  actorId: req?.user?._id,
  action,
  entityType,
  entityId: entityId?.toString(),
  previousState,
  newState,
  metadata,
  targetCollection: entityType,
  targetId: entityId?.toString(),
  details: metadata,
  ipAddress: req?.ip || '127.0.0.1'
});
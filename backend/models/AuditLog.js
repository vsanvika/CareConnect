import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entityType: { type: String },
    entityId: { type: String },
    previousState: { type: mongoose.Schema.Types.Mixed },
    newState: { type: mongoose.Schema.Types.Mixed },
    metadata: { type: mongoose.Schema.Types.Mixed },
    targetCollection: { type: String },
    targetId: { type: String },
    ipAddress: { type: String, default: '127.0.0.1' },
    details: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

auditLogSchema.pre('save', function preventMutation(next) {
  if (!this.isNew) return next(new Error('Audit logs are immutable'));
  next();
});

for (const hook of ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete']) {
  auditLogSchema.pre(hook, function preventMutation(next) {
    next(new Error('Audit logs are immutable'));
  });
}

export default mongoose.model('AuditLog', auditLogSchema);

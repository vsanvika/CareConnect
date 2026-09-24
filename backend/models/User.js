import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, default: '' },
    role: {
      type: String,
      enum: ['CUSTOMER', 'SERVICE_PROVIDER', 'OPERATIONS_MANAGER', 'SUPPORT_AGENT', 'PLATFORM_ADMIN'],
      default: 'CUSTOMER'
    },
    avatarUrl: { type: String, default: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
    isVerified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: 'Metro City' },
      zipCode: { type: String, default: '10001' },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [-73.935242, 40.73061]
      }
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);

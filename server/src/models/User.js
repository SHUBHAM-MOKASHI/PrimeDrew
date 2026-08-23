import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const kycSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'pending'
    },
    dlNumber: { type: String, trim: true },
    dlExpiry: { type: Date },
    dlFrontUrl: { type: String, trim: true },
    dlBackUrl: { type: String, trim: true },
    selfieUrl: { type: String, trim: true },
    faceMatchScore: { type: Number, min: 0, max: 100 },
    rejectionReason: { type: String, trim: true }
  },
  { _id: false }
);

const bankDetailsSchema = new mongoose.Schema(
  {
    accountHolder: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true },
    upiId: { type: String, trim: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: function () {
        return this.phone ? `User ${this.phone.slice(-4)}` : 'Mobility Partner';
      }
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
      default: function () {
        return this.phone ? `${this.phone.replace(/\D/g, '')}@primedrew.com` : undefined;
      }
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      default: 'P2P_AUTH_SECRET_PASS',
      select: false
    },
    role: {
      type: String,
      enum: ['renter', 'host', 'admin'],
      default: 'renter'
    },
    roles: {
      type: [String],
      enum: ['renter', 'host', 'admin'],
      default: ['renter']
    },
    kycStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'pending'
    },
    kycDetails: {
      extractedData: { type: Object, default: {} },
      verifiedAt: { type: Date },
      similarityScore: { type: Number, min: 0, max: 100 }
    },
    kyc: {
      type: kycSchema,
      default: () => ({ status: 'pending' })
    },
    bankDetails: {
      type: bankDetailsSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

// Synchronize role and roles before saving
userSchema.pre('save', async function (next) {
  if (this.role && (!this.roles || this.roles.length === 0)) {
    this.roles = [this.role];
  } else if (this.roles && this.roles.length > 0 && !this.role) {
    this.role = this.roles[0];
  }

  if (this.kycStatus) {
    if (!this.kyc) this.kyc = { status: this.kycStatus };
    else this.kyc.status = this.kycStatus;
  }

  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Helper method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;

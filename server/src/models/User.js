import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const kycSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected', 'UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'],
      default: 'pending'
    },
    idType: { type: String, trim: true },
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

export const ADMIN_PHONE_NUMBER = '7387861807';

export const isMasterAdminPhone = (phone) => {
  if (!phone) return false;
  const digitsOnly = phone.toString().replace(/\D/g, '');
  return digitsOnly.endsWith(ADMIN_PHONE_NUMBER) || digitsOnly === ADMIN_PHONE_NUMBER;
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: function () {
        return this.phone ? `User ${this.phone.slice(-4)}` : 'Mobility Partner';
      }
    },
    fullName: {
      type: String,
      trim: true
    },
    isKycVerified: {
      type: Boolean,
      default: false
    },
    kycConfidenceScore: {
      type: Number,
      min: 0,
      max: 100
    },
    kycVerifiedAt: {
      type: Date
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
      enum: ['USER', 'HOST', 'ADMIN', 'renter', 'host', 'admin'],
      default: 'USER'
    },
    roles: {
      type: [String],
      enum: ['USER', 'HOST', 'ADMIN', 'renter', 'host', 'admin'],
      default: ['USER']
    },
    hostApplicationStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NONE'
    },
    hostApplicationDetails: {
      dlNumber: { type: String, trim: true },
      rcNumber: { type: String, trim: true },
      city: { type: String, trim: true },
      experienceYears: { type: Number, default: 1 },
      vehicleTypePreference: { type: String, trim: true },
      notes: { type: String, trim: true },
      appliedAt: { type: Date },
      reviewedAt: { type: Date },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: { type: String, trim: true }
    },
    kycStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected', 'UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'],
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

// Synchronize role and roles before saving & enforce Master Admin privileges
userSchema.pre('save', async function (next) {
  if (isMasterAdminPhone(this.phone)) {
    this.role = 'ADMIN';
    this.roles = ['ADMIN', 'HOST', 'USER'];
    this.hostApplicationStatus = 'APPROVED';
    this.isKycVerified = true;
    this.kycStatus = 'verified';
    if (!this.kyc) this.kyc = { status: 'verified' };
    else this.kyc.status = 'verified';
  } else {
    if (!this.role) this.role = 'USER';
    if (!this.roles || this.roles.length === 0) {
      this.roles = [this.role];
    }
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

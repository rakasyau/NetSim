import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';

/* ---------------------------------------------------------
 * Skema User — port dari bahan/skema mongoose/User.js
 * ------------------------------------------------------- */
const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Format email tidak valid'],
    },
    passwordHash: {
      type: String,
      required: function () {
        // tidak wajib jika user login via OAuth (Google)
        return (this as any).authProvider === 'credentials';
      },
      select: false, // tidak ikut ter-query kecuali diminta eksplisit
    },
    authProvider: {
      type: String,
      enum: ['credentials', 'google'],
      default: 'credentials',
    },
    institution: {
      type: String,
      trim: true,
      maxlength: 150,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'instructor', 'admin'],
      default: 'user',
    },
    storageUsedBytes: {
      type: Number,
      default: 0,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true } // createdAt & updatedAt otomatis
);

// Index untuk pencarian & login cepat
UserSchema.index({ email: 1 }, { unique: true });

// Hash password sebelum disimpan
UserSchema.pre('save', async function () {
  if (this.isModified('passwordHash') && this.passwordHash) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
});

// Method bantu untuk verifikasi login
UserSchema.methods.comparePassword = async function (plainPassword: string) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Jangan pernah kirim passwordHash ke response JSON
UserSchema.set('toJSON', {
  transform: (_doc: unknown, ret: Record<string, unknown>) => {
    delete ret.passwordHash;
    return ret;
  },
});

export type UserType = InferSchemaType<typeof UserSchema>;

export type UserModel = Model<UserType> & {
  // methods tambahan
};

const User =
  (mongoose.models.User as UserModel | undefined) ||
  mongoose.model<UserType, UserModel>('User', UserSchema);

export default User;

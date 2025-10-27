const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  cognitoUserId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  dateOfBirth: {
    type: Date
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true, // This adds createdAt and updatedAt automatically
  versionKey: false
});

// Index for better query performance
userProfileSchema.index({ email: 1 });
userProfileSchema.index({ createdAt: -1 });

// Instance method to get public profile data (without sensitive info)
userProfileSchema.methods.getPublicProfile = function() {
  const profile = this.toObject();
  delete profile.cognitoUserId;
  delete profile.isActive;
  return profile;
};

// Static method to find by Cognito User ID
userProfileSchema.statics.findByCognitoUserId = function(cognitoUserId) {
  return this.findOne({ cognitoUserId, isActive: true });
};

// Pre-save middleware to update timestamps
userProfileSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('UserProfile', userProfileSchema);

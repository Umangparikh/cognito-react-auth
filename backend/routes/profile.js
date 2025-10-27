const express = require('express');
const UserProfile = require('../models/UserProfile');
const { verifyToken, verifyEmailVerified } = require('../middleware/auth');

const router = express.Router();

/**
 * Create a new user profile
 * POST /profile
 */
router.post('/', verifyToken, verifyEmailVerified, async (req, res) => {
  try {
    const { name, gender, city, phone, dateOfBirth, bio } = req.body;
    
    // Validate required fields
    if (!name || !gender || !city) {
      return res.status(400).json({
        error: 'Name, gender, and city are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Check if profile already exists
    const existingProfile = await UserProfile.findByCognitoUserId(req.user.sub);
    if (existingProfile) {
      return res.status(409).json({
        error: 'Profile already exists',
        code: 'PROFILE_EXISTS'
      });
    }

    // Create new profile
    const profile = new UserProfile({
      cognitoUserId: req.user.sub,
      name,
      gender,
      city,
      email: req.user.email,
      phone: phone || '',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      bio: bio || ''
    });

    await profile.save();
    
    res.status(201).json({
      message: 'Profile created successfully',
      profile: profile.getPublicProfile()
    });
  } catch (error) {
    console.error('Profile creation error:', error.message);
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Profile already exists',
        code: 'DUPLICATE_PROFILE'
      });
    }
    
    res.status(400).json({
      error: 'Failed to create profile',
      details: error.message
    });
  }
});

/**
 * Get user profile
 * GET /profile
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const profile = await UserProfile.findByCognitoUserId(req.user.sub);
    
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    res.json({
      profile: profile.getPublicProfile()
    });
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch profile',
      details: error.message
    });
  }
});

/**
 * Update user profile
 * PUT /profile
 */
router.put('/', verifyToken, verifyEmailVerified, async (req, res) => {
  try {
    const { name, gender, city, phone, dateOfBirth, bio, preferences } = req.body;
    
    // Validate required fields if provided
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        error: 'Name cannot be empty',
        code: 'INVALID_NAME'
      });
    }

    const updateData = {
      updatedAt: new Date()
    };

    // Only update provided fields
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (city !== undefined) updateData.city = city;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (bio !== undefined) updateData.bio = bio;
    if (preferences !== undefined) updateData.preferences = preferences;

    const profile = await UserProfile.findOneAndUpdate(
      { cognitoUserId: req.user.sub, isActive: true },
      updateData,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      profile: profile.getPublicProfile()
    });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(400).json({
      error: 'Failed to update profile',
      details: error.message
    });
  }
});

/**
 * Delete user profile (soft delete)
 * DELETE /profile
 */
router.delete('/', verifyToken, verifyEmailVerified, async (req, res) => {
  try {
    const profile = await UserProfile.findOneAndUpdate(
      { cognitoUserId: req.user.sub, isActive: true },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    res.json({
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Profile deletion error:', error.message);
    res.status(500).json({
      error: 'Failed to delete profile',
      details: error.message
    });
  }
});

/**
 * Get user profile by ID (public endpoint - limited data)
 * GET /profile/:userId
 */
router.get('/:userId', async (req, res) => {
  try {
    const profile = await UserProfile.findOne({
      _id: req.params.userId,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Return only public information
    const publicProfile = profile.getPublicProfile();
    delete publicProfile.email; // Remove email from public profile
    delete publicProfile.phone; // Remove phone from public profile

    res.json({
      profile: publicProfile
    });
  } catch (error) {
    console.error('Public profile fetch error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch profile',
      details: error.message
    });
  }
});

module.exports = router;

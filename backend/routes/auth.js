const express = require('express');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Verify token and return user info
 * GET /auth/verify
 */
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: {
      id: req.user.sub,
      email: req.user.email,
      username: req.user.username,
      emailVerified: req.user.email_verified
    }
  });
});

/**
 * Get current user info
 * GET /auth/me
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const UserProfile = require('../models/UserProfile');
    const profile = await UserProfile.findByCognitoUserId(req.user.sub);
    
    const userInfo = {
      id: req.user.sub,
      email: req.user.email,
      username: req.user.username,
      emailVerified: req.user.email_verified,
      profile: profile ? profile.getPublicProfile() : null
    };

    res.json({
      user: userInfo
    });
  } catch (error) {
    console.error('User info fetch error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch user information',
      details: error.message
    });
  }
});

/**
 * Health check endpoint
 * GET /auth/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'cognito-express-auth'
  });
});

module.exports = router;

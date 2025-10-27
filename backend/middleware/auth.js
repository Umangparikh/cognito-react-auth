const { CognitoJwtVerifier } = require('aws-jwt-verify');

// Create the verifier outside the middleware so it can be reused
let verifier;
try {
  verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    tokenUse: 'id',
    clientId: process.env.COGNITO_CLIENT_ID,
  });
} catch (error) {
  console.error('Failed to create JWT verifier:', error.message);
  console.log('Make sure COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are set in .env');
}

/**
 * Middleware to verify JWT tokens from AWS Cognito
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = async (req, res, next) => {
  try {
    if (!verifier) {
      return res.status(500).json({
        error: 'JWT verifier not configured. Check environment variables.',
        code: 'VERIFIER_NOT_CONFIGURED'
      });
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Authorization header is required',
        code: 'NO_AUTH_HEADER'
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token is required',
        code: 'NO_TOKEN'
      });
    }

    // Verify the token with AWS Cognito
    const payload = await verifier.verify(token);
    
    // Add user information to request object
    req.user = {
      sub: payload.sub, // Cognito User ID
      email: payload.email,
      email_verified: payload.email_verified,
      username: payload['cognito:username'],
      token_use: payload.token_use
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    // Handle specific JWT errors
    if (error.message.includes('expired')) {
      return res.status(401).json({ 
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.message.includes('invalid')) {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    return res.status(401).json({ 
      error: 'Token verification failed',
      code: 'TOKEN_VERIFICATION_FAILED'
    });
  }
};

/**
 * Optional middleware to verify if email is verified
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyEmailVerified = (req, res, next) => {
  if (!req.user.email_verified) {
    return res.status(403).json({
      error: 'Email must be verified to access this resource',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

/**
 * Middleware to check if user has a profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireProfile = async (req, res, next) => {
  try {
    const UserProfile = require('../models/UserProfile');
    const profile = await UserProfile.findByCognitoUserId(req.user.sub);
    
    if (!profile) {
      return res.status(404).json({
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }
    
    req.profile = profile;
    next();
  } catch (error) {
    console.error('Profile check error:', error.message);
    return res.status(500).json({
      error: 'Failed to verify user profile',
      code: 'PROFILE_CHECK_FAILED'
    });
  }
};

module.exports = {
  verifyToken,
  verifyEmailVerified,
  requireProfile
};

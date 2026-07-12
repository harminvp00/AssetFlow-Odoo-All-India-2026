const service = require('./auth.service');
const mapper = require('./auth.mapper');
const messages = require('./auth.messages');
const env = require('../../config/env');

const signup = async (req, res, next) => {
  try {
    const newUser = await service.register(req.body);
    res.status(201).json({
      success: true,
      message: messages.SUCCESS_REGISTER,
      data: mapper.toDTO(newUser),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await service.login(email, password);

    // Set refresh token as secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: messages.SUCCESS_LOGIN,
      data: {
        token: accessToken,
        user: mapper.toDTO(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({
      success: true,
      message: messages.SUCCESS_LOGOUT,
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      });
    }

    const { accessToken } = await service.refreshAccessToken(token);
    res.json({
      success: true,
      data: {
        token: accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: mapper.toDTO(req.user),
    });
  } catch (error) {
    next(error);
  }
};

// Keep track of recently processed Google authorization codes to prevent double-redemption (invalid_grant) errors
const processedCodes = new Map();

// Periodic cleanup of expired codes
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of processedCodes.entries()) {
    if (now - data.timestamp > 60000) { // 1 minute expiry
      processedCodes.delete(code);
    }
  }
}, 30000);

const googleLogin = async (req, res, next) => {
  try {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (error) {
    next(error);
  }
};

const googleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=auth_failed`);
    }

    // If this code was already processed successfully, redirect with the cached tokens
    if (processedCodes.has(code)) {
      const cached = processedCodes.get(code);
      res.cookie('refreshToken', cached.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/success?token=${cached.accessToken}`);
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    if (tokens.error) {
      console.error('Google token exchange error:', tokens);
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=auth_failed`);
    }

    const { access_token } = tokens;

    // Get user info from Google userinfo endpoint
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const googleUser = await userResponse.json();
    const email = googleUser.email;

    if (!email) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=no_email`);
    }

    const { prisma } = require('../../config/database');

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const parts = (googleUser.name || googleUser.given_name || email.split('@')[0]).trim().split(/\s+/);
      const firstName = parts[0] || 'Unknown';
      const lastName = parts.slice(1).join(' ') || 'User';

      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          role: 'PROCUREMENT_OFFICER',
        },
      });
    }

    const { accessToken, refreshToken } = await service.socialLogin(user);

    // Save tokens in cache for duplicate requests
    processedCodes.set(code, {
      accessToken,
      refreshToken,
      timestamp: Date.now(),
    });

    // Set refresh token as secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend dashboard with access token in query
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/success?token=${accessToken}`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  logout,
  refresh,
  me,
  googleLogin,
  googleCallback,
};

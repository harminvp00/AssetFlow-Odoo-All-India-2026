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

const googleCallback = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=auth_failed`);
    }

    if (!user.status) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=user_inactive`);
    }

    const { accessToken, refreshToken } = await service.socialLogin(user);

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
  googleCallback,
};

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const repository = require('./auth.repository');
const env = require('../../config/env');

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRE }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRE }
  );
};

const register = async (userData) => {
  const existingUser = await repository.findByEmail(userData.email);
  if (existingUser) {
    const error = new Error('Email address is already registered.');
    error.statusCode = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  return repository.save({
    ...userData,
    password: hashedPassword,
  });
};

const login = async (email, password) => {
  const user = await repository.findByEmail(email);
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  if (!user.status) {
    const error = new Error('User account is inactive. Please contact administration.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const refreshAccessToken = async (token) => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const user = await repository.findById(decoded.userId);
    
    if (!user) {
      const error = new Error('User no longer exists.');
      error.statusCode = 401;
      throw error;
    }

    if (!user.status) {
      const error = new Error('User account is inactive.');
      error.statusCode = 403;
      throw error;
    }

    const accessToken = generateAccessToken(user);
    return { accessToken };
  } catch (err) {
    const error = new Error('Invalid or expired refresh token.');
    error.statusCode = 401;
    throw error;
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
};

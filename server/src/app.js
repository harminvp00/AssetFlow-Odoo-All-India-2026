const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const passport = require('passport');

const env = require('./config/env');
const rateLimiter = require('./middlewares/rateLimit.middleware');
const notFoundMiddleware = require('./middlewares/notFound.middleware');
const errorMiddleware = require('./middlewares/error.middleware');
const routes = require('./routes');

// Import passport configuration to load strategies
require('./config/passport');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Compression & Body Parsers
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging & Rate Limiting
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
  app.use('/api', rateLimiter);
}

// Passport initialization
app.use(passport.initialize());

// API Route Mount
app.use('/api', routes);

// 404 Route Handler
app.use(notFoundMiddleware);

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
// Trigger reload for new env configs - 3

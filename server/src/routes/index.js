const express = require('express');
const v1Router = require('./v1');

const router = express.Router();

// Mount API Versions
router.use('/v1', v1Router);

// Optional future expansions e.g., router.use('/v2', v2Router);

module.exports = router;

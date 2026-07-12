const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CLIENT_FEATURES_DIR = path.join(ROOT_DIR, 'client/src/features');
const SERVER_MODULES_DIR = path.join(ROOT_DIR, 'server/src/modules');
const SERVER_SHARED_DIR = path.join(ROOT_DIR, 'server/src/shared');

// List of all features/modules
const modules = [
  'auth',
  'dashboard',
  'employees',
  'departments',
  'locations',
  'categories',
  'assets',
  'attachments',
  'allocations',
  'transfers',
  'bookings',
  'maintenance',
  'audits',
  'notifications',
  'reports',
  'settings',
];

// Helper to make directory
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${path.relative(ROOT_DIR, dirPath)}`);
  }
}

// Helper to write file
function writeFile(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
    console.log(`📄 Created file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function initClientFeatures() {
  console.log('\n--- Initializing Client Features ---');
  ensureDir(CLIENT_FEATURES_DIR);

  modules.forEach((feature) => {
    const featureDir = path.join(CLIENT_FEATURES_DIR, feature);
    ensureDir(featureDir);

    // Create subdirectories
    const subdirs = [
      'api',
      'components',
      'hooks',
      'pages',
      'store',
      'validation',
      'constants',
      'utils',
    ];

    subdirs.forEach((sub) => ensureDir(path.join(featureDir, sub)));

    // Create a default Page component in pages/
    const componentName = feature.charAt(0).toUpperCase() + feature.slice(1);
    const pageFile = path.join(featureDir, 'pages', `${componentName}Page.jsx`);
    const pageContent = `
import React from 'react';

export default function ${componentName}Page() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">${componentName} Page</h1>
      <p className="text-slate-500 mt-2">Placeholder for ${feature} feature page.</p>
    </div>
  );
}
`;
    writeFile(pageFile, pageContent);

    // Create a slice in store/
    const sliceFile = path.join(featureDir, 'store', `${feature}Slice.js`);
    const sliceContent = `
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [],
  loading: false,
  error: null,
};

const ${feature}Slice = createSlice({
  name: '${feature}',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setData: (state, action) => {
      state.data = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setLoading, setData, setError } = ${feature}Slice.actions;
export default ${feature}Slice.reducer;
`;
    writeFile(sliceFile, sliceContent);

    // Create feature index.js (barrel export)
    const indexFile = path.join(featureDir, 'index.js');
    const indexContent = `
export { default as ${componentName}Page } from './pages/${componentName}Page';
export { default as ${feature}Reducer } from './store/${feature}Slice';
`;
    writeFile(indexFile, indexContent);
  });
}

function initServerModules() {
  console.log('\n--- Initializing Server Modules ---');
  ensureDir(SERVER_MODULES_DIR);

  modules.forEach((mod) => {
    const modDir = path.join(SERVER_MODULES_DIR, mod);
    ensureDir(modDir);

    const componentName = mod.charAt(0).toUpperCase() + mod.slice(1);

    // 1. routes.js
    const routesFile = path.join(modDir, `${mod}.routes.js`);
    const routesContent = `
const express = require('express');
const controller = require('./${mod}.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const validation = require('./${mod}.validation');

const router = express.Router();

router.get('/', controller.getAll);
router.post('/', validationMiddleware(validation.create), controller.create);

module.exports = router;
`;
    writeFile(routesFile, routesContent);

    // 2. controller.js
    const controllerFile = path.join(modDir, `${mod}.controller.js`);
    const controllerContent = `
const service = require('./${mod}.service');
const mapper = require('./${mod}.mapper');
const messages = require('./${mod}.messages');

const getAll = async (req, res, next) => {
  try {
    const items = await service.getAll();
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const newItem = await service.create(req.body);
    res.status(201).json({
      success: true,
      message: messages.SUCCESS_CREATED,
      data: mapper.toDTO(newItem),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  create,
};
`;
    writeFile(controllerFile, controllerContent);

    // 3. service.js
    const serviceFile = path.join(modDir, `${mod}.service.js`);
    const serviceContent = `
const repository = require('./${mod}.repository');

const getAll = async () => {
  return repository.findAll();
};

const create = async (data) => {
  return repository.save(data);
};

module.exports = {
  getAll,
  create,
};
`;
    writeFile(serviceFile, serviceContent);

    // 4. repository.js
    const repositoryFile = path.join(modDir, `${mod}.repository.js`);
    const repositoryContent = `
const { prisma } = require('../../config/database');

const findAll = async () => {
  // Placeholder database operation. Returns empty array by default.
  return [];
};

const save = async (data) => {
  // Placeholder save operation.
  return data;
};

module.exports = {
  findAll,
  save,
};
`;
    writeFile(repositoryFile, repositoryContent);

    // 5. validation.js
    const validationFile = path.join(modDir, `${mod}.validation.js`);
    const validationContent = `
const { z } = require('zod');

const create = z.object({
  body: z.object({
    // Basic validation schema
    name: z.string().min(1, 'Name is required'),
  }),
});

module.exports = {
  create,
};
`;
    writeFile(validationFile, validationContent);

    // 6. mapper.js
    const mapperFile = path.join(modDir, `${mod}.mapper.js`);
    const mapperContent = `
const toDTO = (model) => {
  if (!model) return null;
  return {
    ...model,
    // Add DTO mappings here
  };
};

module.exports = {
  toDTO,
};
`;
    writeFile(mapperFile, mapperContent);

    // 7. constants.js
    const constantsFile = path.join(modDir, `${mod}.constants.js`);
    const constantsContent = `
module.exports = {
  MODULE_NAME: '${mod.toUpperCase()}',
};
`;
    writeFile(constantsFile, constantsContent);

    // 8. messages.js
    const messagesFile = path.join(modDir, `${mod}.messages.js`);
    const messagesContent = `
module.exports = {
  SUCCESS_RETRIEVED: '${componentName} entries retrieved successfully.',
  SUCCESS_CREATED: '${componentName} created successfully.',
  ERROR_NOT_FOUND: '${componentName} entry not found.',
};
`;
    writeFile(messagesFile, messagesContent);

    // 9. index.js (barrel export)
    const indexFile = path.join(modDir, 'index.js');
    const indexContent = `
const routes = require('./${mod}.routes');
const controller = require('./${mod}.controller');
const service = require('./${mod}.service');
const repository = require('./${mod}.repository');

module.exports = routes;
`;
    writeFile(indexFile, indexContent);

    // Conditional events and scheduler files
    if (mod === 'notifications') {
      const eventsFile = path.join(modDir, 'notifications.events.js');
      const eventsContent = `
const logger = require('../../config/logger');

const triggerNotification = (event, data) => {
  logger.info(\`[EVENT] Notification triggered for event: \${event}\`);
  // Handle event processing here
};

module.exports = {
  triggerNotification,
};
`;
      writeFile(eventsFile, eventsContent);
    }

    if (mod === 'audits') {
      const eventsFile = path.join(modDir, 'audits.events.js');
      const eventsContent = `
const logger = require('../../config/logger');

const logAuditEvent = (action, details) => {
  logger.info(\`[EVENT] Audit log registered: \${action}\`);
  // Save audit log to database
};

module.exports = {
  logAuditEvent,
};
`;
      writeFile(eventsFile, eventsContent);
    }

    if (mod === 'maintenance') {
      const schedulerFile = path.join(modDir, 'maintenance.scheduler.js');
      const schedulerContent = `
const logger = require('../../config/logger');

const scheduleRecurringChecks = () => {
  logger.info('[SCHEDULER] Maintenance checks initialized...');
  // Set up cron job or intervals here
};

module.exports = {
  scheduleRecurringChecks,
};
`;
      writeFile(schedulerFile, schedulerContent);
    }
  });
}

function initServerShared() {
  console.log('\n--- Initializing Server Shared Folders ---');
  ensureDir(SERVER_SHARED_DIR);

  const sharedDirs = ['constants', 'validators', 'responses', 'utils', 'common'];
  sharedDirs.forEach((dir) => {
    const dirPath = path.join(SERVER_SHARED_DIR, dir);
    ensureDir(dirPath);

    // Create placeholder and barrel export in each shared folder
    const fileContent = 'module.exports = {};';
    writeFile(path.join(dirPath, 'index.js'), fileContent);
  });
}

function main() {
  console.log('🏁 Starting AssetFlow Codebase Initialization Script...');
  initClientFeatures();
  initServerModules();
  initServerShared();
  console.log('\n🎉 Project initialization complete!');
}

main();

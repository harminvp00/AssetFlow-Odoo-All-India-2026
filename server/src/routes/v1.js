const express = require('express');
const authRouter = require('../modules/auth');
const dashboardRouter = require('../modules/dashboard');
const employeesRouter = require('../modules/employees');
const departmentsRouter = require('../modules/departments');
const locationsRouter = require('../modules/locations');
const categoriesRouter = require('../modules/categories');
const assetsRouter = require('../modules/assets');
const attachmentsRouter = require('../modules/attachments');
const allocationsRouter = require('../modules/allocations');
const transfersRouter = require('../modules/transfers');
const bookingsRouter = require('../modules/bookings');
const maintenanceRouter = require('../modules/maintenance');
const auditsRouter = require('../modules/audits');
const notificationsRouter = require('../modules/notifications');
const reportsRouter = require('../modules/reports');
const settingsRouter = require('../modules/settings');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);
router.use('/employees', employeesRouter);
router.use('/departments', departmentsRouter);
router.use('/locations', locationsRouter);
router.use('/categories', categoriesRouter);
router.use('/assets', assetsRouter);
router.use('/attachments', attachmentsRouter);
router.use('/allocations', allocationsRouter);
router.use('/transfers', transfersRouter);
router.use('/bookings', bookingsRouter);
router.use('/maintenance', maintenanceRouter);
router.use('/audits', auditsRouter);
router.use('/notifications', notificationsRouter);
router.use('/reports', reportsRouter);
router.use('/settings', settingsRouter);

module.exports = router;

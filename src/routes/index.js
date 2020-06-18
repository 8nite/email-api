import express from 'express'
import email from './functions/email'
import routes from './functions/routes'
import OpenCase from './TOC/OpenCase'
import CancelCase from './TOC/CancelCase'
import ResolveCase from './TOC/ResolveCase'
import Assignment from './TOC/Assignment'
import ResolveTimeSLABreached from './TOC/ResolveTimeSLABreached'
import ResolveTimeSLAReminder from './TOC/ResolveTimeSLAReminder'
import ResponseTimeSLABreached from './TOC/ResponseTimeSLABreached'
import ResponseTimeSLAReminder from './TOC/ResponseTimeSLAReminder'

var router = express.Router();

router.use('/routes', routes)

router.use('/email', email);

router.use('/TOC/OpenCase', OpenCase);
router.use('/TOC/CancelCase', CancelCase);
router.use('/TOC/ResolveCase', ResolveCase);
router.use('/TOC/Assignment', Assignment);
router.use('/TOC/ResolveTimeSLABreached', ResolveTimeSLABreached);
router.use('/TOC/ResolveTimeSLAReminder', ResolveTimeSLAReminder);
router.use('/TOC/ResponseTimeSLABreached', ResponseTimeSLABreached);
router.use('/TOC/ResponseTimeSLAReminder', ResponseTimeSLAReminder);

module.exports = router;
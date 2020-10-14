import express from 'express'
import email from './functions/email'
import routes from './functions/routes'
import TOCOpenCase from './TOC/OpenCase'
import TOCCancelCase from './TOC/CancelCase'
import TOCResolveCase from './TOC/ResolveCase'
import TOCAssignment from './TOC/Assignment'
import TOCResolveTimeSLABreached from './TOC/ResolveTimeSLABreached'
import TOCResolveTimeSLAReminder from './TOC/ResolveTimeSLAReminder'
import TOCResponseTimeSLABreached from './TOC/ResponseTimeSLABreached'
import TOCResponseTimeSLAReminder from './TOC/ResponseTimeSLAReminder'
import PCFaultOpenCase from './PCFault/OpenCase'
import PCFaultCancelCase from './PCFault/CancelCase'
import PCFaultResolveCase from './PCFault/ResolveCase'

var router = express.Router();

router.use('/routes', routes)

router.use('/email', email);

router.use('/TOC/OpenCase', TOCOpenCase);
router.use('/TOC/CancelCase', TOCCancelCase);
router.use('/TOC/ResolveCase', TOCResolveCase);
router.use('/TOC/Assignment', TOCAssignment);
router.use('/TOC/ResolveTimeSLABreached', TOCResolveTimeSLABreached);
router.use('/TOC/ResolveTimeSLAReminder', TOCResolveTimeSLAReminder);
router.use('/TOC/ResponseTimeSLABreached', TOCResponseTimeSLABreached);
router.use('/TOC/ResponseTimeSLAReminder', TOCResponseTimeSLAReminder);


router.use('/PCFault/OpenCase', PCFaultOpenCase);
router.use('/PCFault/CancelCase', PCFaultCancelCase);
router.use('/PCFault/ResolveCase', PCFaultResolveCase);

module.exports = router;
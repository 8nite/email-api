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
import PCFaultAssignment from './PCFault/Assignment'
import PCFaultResolveTimeSLABreached from './PCFault/ResolveTimeSLABreached'
import PCFaultResolveTimeSLAReminder from './PCFault/ResolveTimeSLAReminder'
import PCFaultResponseTimeSLABreached from './PCFault/ResponseTimeSLABreached'
import PCFaultResponseTimeSLAReminder from './PCFault/ResponseTimeSLAReminder'

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
router.use('/PCFault/Assignment', PCFaultAssignment);
router.use('/PCFault/ResolveTimeSLABreached', PCFaultResolveTimeSLABreached);
router.use('/PCFault/ResolveTimeSLAReminder', PCFaultResolveTimeSLAReminder);
router.use('/PCFault/ResponseTimeSLABreached', PCFaultResponseTimeSLABreached);
router.use('/PCFault/ResponseTimeSLAReminder', PCFaultResponseTimeSLAReminder);

module.exports = router;
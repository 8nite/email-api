import express from 'express'
import email from './functions/email'
import routes from './functions/routes'
import recheckJobs from './functions/recheckJobs'
import TOCOpenCase from './TOC/OpenCase'
import TOCCancelCase from './TOC/CancelCase'
import TOCResolveCase from './TOC/ResolveCase'
import TOCAssignment from './TOC/Assignment'
import TOCResolveTimeSLABreached from './TOC/ResolveTimeSLABreached'
import TOCResolveTimeSLAReminder from './TOC/ResolveTimeSLAReminder'
import TOCResponseTimeSLABreached from './TOC/ResponseTimeSLABreached'
import TOCResponseTimeSLAReminder from './TOC/ResponseTimeSLAReminder'
import TOCAssignVendor from './TOC/AssignVendor'
import TOCAssignVendorApprove from './TOC/AssignVendorApprove'
import PCFaultOpenCase from './PCFault/OpenCase'
import PCFaultCancelCase from './PCFault/CancelCase'
import PCFaultResolveCase from './PCFault/ResolveCase'
import ServiceRequestOpenCase from './ServiceRequest/OpenCase'
import ServiceRequestCancelCase from './ServiceRequest/CancelCase'
import ServiceRequestResolveCase from './ServiceRequest/ResolveCase'
import ServiceRequestApprovalCase from './ServiceRequest/ApprovalCase'
import ServiceRequestApprovedCase from './ServiceRequest/ApprovedCase'
import ServiceRequestRejectedCase from './ServiceRequest/RejectedCase'
import ITDevOpenCase from './ITDev/OpenCase'
import ITDevCancelCase from './ITDev/CancelCase'
import HRNewHireOpenCase from './HR/NewHireOpenCase'
import AlertB4SiteVisit from './ICW/AlertB4SiteVisit'
import AlertAfterSiteVisit from './ICW/AlertAfterSiteVisit'
import PostalServiceCancelled from './PostalService/Cancelled'
import PostalServiceDone from './PostalService/Done'
import PostalServiceOpenCase from './PostalService/OpenCase'
import PostalServiceOutstanding1Day from './PostalService/Outstanding1Day'
import PostalServiceOutstandingMoreThan1Day from './PostalService/OutstandingMoreThan1Day'
import PostalServiceRejected from './PostalService/Rejected'

var router = express.Router();

router.use('/routes', routes)
router.use('/recheckJobs', recheckJobs)

router.use('/email', email);

router.use('/TOC/OpenCase', TOCOpenCase);
router.use('/TOC/CancelCase', TOCCancelCase);
router.use('/TOC/ResolveCase', TOCResolveCase);
router.use('/TOC/Assignment', TOCAssignment);
router.use('/TOC/ResolveTimeSLABreached', TOCResolveTimeSLABreached);
router.use('/TOC/ResolveTimeSLAReminder', TOCResolveTimeSLAReminder);
router.use('/TOC/ResponseTimeSLABreached', TOCResponseTimeSLABreached);
router.use('/TOC/ResponseTimeSLAReminder', TOCResponseTimeSLAReminder);
router.use('/TOC/AssignVendor', TOCAssignVendor);
router.use('/TOC/AssignVendorApprove', TOCAssignVendorApprove);

router.use('/PCFault/OpenCase', PCFaultOpenCase);
router.use('/PCFault/CancelCase', PCFaultCancelCase);
router.use('/PCFault/ResolveCase', PCFaultResolveCase);

router.use('/ServiceRequest/OpenCase', ServiceRequestOpenCase);
router.use('/ServiceRequest/CancelCase', ServiceRequestCancelCase);
router.use('/ServiceRequest/ResolveCase', ServiceRequestResolveCase);
router.use('/ServiceRequest/ApprovalCase', ServiceRequestApprovalCase);
router.use('/ServiceRequest/ApprovedCase', ServiceRequestApprovedCase);
router.use('/ServiceRequest/RejectedCase', ServiceRequestRejectedCase);

router.use('/ITDev/OpenCase', ITDevOpenCase);
router.use('/ITDev/CancelCase', ITDevCancelCase);

router.use('/HR/NewHireOpenCase', HRNewHireOpenCase);

router.use('/ICW/AlertB4SiteVisit', AlertB4SiteVisit);
router.use('/ICW/AlertAfterSiteVisit', AlertAfterSiteVisit);

router.use('/PostalService/Cancelled', PostalServiceCancelled);
router.use('/PostalService/Done', PostalServiceDone);
router.use('/PostalService/OpenCase', PostalServiceOpenCase);
router.use('/PostalService/Outstanding1Day', PostalServiceOutstanding1Day);
router.use('/PostalService/OutstandingMoreThan1Day', PostalServiceOutstandingMoreThan1Day);
router.use('/PostalService/Rejected', PostalServiceRejected);


module.exports = router;
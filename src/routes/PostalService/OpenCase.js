import express from 'express'
import rp from 'request-promise'
import queryString from 'query-string'
import { getEmails, getFieldMapping, getInsight } from '../../functions/jiraAPI'

require('dotenv').config()

var router = express.Router();

router.post('/', async (req, res) => {
    res.send('done')

    const mappedFields = await getFieldMapping(req.body.issue.fields)
    const caseNumber = req.body.issue.key
    const serviceName = req.body.issue.fields.issuetype.name
    const caseSubject = req.body.issue.fields.summary


    let to = mappedFields.reporter.emailAddress

    let cc = []

    let bcc = []

    let emailOptions = {
        method: 'POST',
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/email',
        json: true,
        body: {
            from: process.env.DEFUALTSENDER,
            subject: "Confirmation of Postal Service Submission - " + caseNumber
        }
    }

    emailOptions.body.to = to
    emailOptions.body.cc = cc
    emailOptions.body.bcc = bcc

    emailOptions.body.html = `Dear User,<br><br>

    We have received your request of Postal Service.  After completing your Postal Service request, we will send you the Postage Charges for your reference.<br>
    
    <a href=` + process.env.URL + `/browse/` + caseNumber + `">View request</a><br><br>
    
    This is an automatically generated email. Please do not reply to this email address as all responses are directed to an unattended mailbox, and will not receive a response.`

    rp(emailOptions)

    emailOptions.body.to = [
        'fannyf@hgc.com.hk',
        'CHRIS.YEUNG@hgc.com.hk',
        'crhis.yeung@hgc.com.hk'
    ]
    emailOptions.body.cc = cc
    emailOptions.body.bcc = bcc

    emailOptions.body.html = `Dear User,<br><br>

    We have received your request of Postal Service.  After completing your Postal Service request, we will send you the Postage Charges for your reference.<br>
    
    <a href=` + process.env.URL + `/browse/` + caseNumber + `">View request</a><br><br>
    
    This is an automatically generated email. Please do not reply to this email address as all responses are directed to an unattended mailbox, and will not receive a response.`

    rp(emailOptions)
})

module.exports = router;
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


    let to = [
        'fannyf@hgc.com.hk',
    ]

    let cc = []

    let bcc = []

    let emailOptions = {
        method: 'POST',
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/email',
        json: true,
        body: {
            from: process.env.DEFUALTSENDER,
            subject: "The request of Postal Service " + caseNumber + " has been outstanding for more than 1 day"
        }
    }

    emailOptions.body.to = to
    emailOptions.body.cc = cc
    emailOptions.body.bcc = bcc

    emailOptions.body.html = `Dear FADM Supervisor,<br><br>

    The captioned Postal Service is long outstanding.<br>
    
    <a href=` + process.env.URL + `/browse/` + caseNumber + `">View request</a><br><br>
    
    This is an automatically generated email. Please do not reply to this email address as all responses are directed to an unattended mailbox, and will not receive a response.`

    rp(emailOptions)
})

module.exports = router;
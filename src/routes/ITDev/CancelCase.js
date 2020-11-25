import express from 'express'
import rp from 'request-promise'
import queryString from 'query-string'
import { getEmails, getFieldMapping, issueNames } from '../../functions/jiraAPI'

require('dotenv').config()

var router = express.Router();

router.post('/', async (req, res) => {
    res.send('done')
    setTimeout(async function () {
        const mappedFields = await issueNames(req.body.issue.key).fields

        const caseNumber = req.body.issue.key
        const serviceName = req.body.issue.fields.issuetype.name
        const caseSubject = req.body.issue.fields.summary
        const caseDescription = req.body.issue.fields.description
        const statusChanger = req.body.issue.fields.reporter.name
        const submitterInsightId = mappedFields['Submitter'][0].match(/\(([-A-Z0-9]*)\)$/)[1]
        const userName = await getEmails('HGC', 'AD_USERS', 'Key', submitterInsightId, 'givenName')
        let service
        try {
            service = mappedFields['Category'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]
        } catch {}
        try {
            service = mappedFields['Service Request Items'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]
        } catch {}
        try {
            service = mappedFields['Account System'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]
        } catch {}

        let assignedGroup = mappedFields['Assigned Group'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]
        if (mappedFields['Customer Request Type'].requestType.name == 'Report Issues') {
            assignedGroup = mappedFields['2nd Tier Support'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]
        }
        const to = await getEmails('HGC', 'SelfServiceSupportUser', 'SelfServiceSupportTeam', assignedGroup, 'Name')
        const cc = ['hgctoc@hgc.com.hk', '008OPS@hgc.com.hk', 'hgcitsd@hgc.com.hk']
        const bcc = []

        const emailOptions = {
            method: 'POST',
            uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/email',
            json: true,
            body: {
                from: process.env.DEFUALTSENDER,
                to: to,
                cc: cc,
                bcc,
                subject: 'HGC Service Desk - ' + caseNumber + ' - ' + caseSubject + ' status had been changed to Cancelled',
                html: `Dear ` + assignedGroup + `</br></br>

                This is to acknowledge that `+ statusChanger + ` had changed the case ` + caseNumber + ` status to be cancelled</br></br>
            
            Ticket type : `+ serviceName + `</br>
            Reference Number : `+ caseNumber + `</br>
            Summary : `+ caseSubject + `</br>
            Service : `+ service + `</br></br>
            
            Please do not hesitate to contact us at 2128 2666 or hgctoc@hgc.com.hk if any further questions or inquires regarding your ticket</br>
            This is an auto notification sent from system, please do not reply this email.</br></br>
            
            HGC TOC`
            }
        }
        rp(emailOptions)
    }, 180000);
})

module.exports = router;
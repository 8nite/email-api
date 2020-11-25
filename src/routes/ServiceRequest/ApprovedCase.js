import express from 'express'
import rp from 'request-promise'
import queryString from 'query-string'
import { getEmails, getFieldMapping, issueNames } from '../../functions/jiraAPI'

require('dotenv').config()

var router = express.Router();

router.post('/', async (req, res) => {
    res.send('done')
    setTimeout(async function () {
        let mappedFields = await issueNames(req.body.issue.key)
        mappedFields = mappedFields.fields

        const caseNumber = req.body.issue.key
        const serviceName = req.body.issue.fields.issuetype.name
        const caseSubject = req.body.issue.fields.summary
        const Justification = mappedFields['Justification']
        const statusChanger = req.body.user.name
        const userName = mappedFields['Submitter'][0].match(/(.*) \(.*\) \(([-A-Z0-9]*)\)$/)[1]
        let service
        try {
            service = mappedFields['Service Request Items'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]
        } catch {}
        try {
            service = mappedFields['Account System'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]
        } catch {}

        const to = req.body.issue.fields.reporter.emailAddress
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
                subject: 'HGC Service Desk - ' + caseNumber + ' - ' + caseSubject + ' had been approved',
                html: `Dear ` + userName + `,</br></br>

                This is to acknowledge that your request had been approved by ` + statusChanger + `</br></br>
            
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
    }, 10000);
})

module.exports = router;
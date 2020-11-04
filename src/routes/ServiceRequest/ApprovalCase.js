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
        const statusChanger = req.body.issue.fields.reporter.name
        const userName = mappedFields['Submitter'][0].match(/(.*) \(.*\) \(([-A-Z0-9]*)\)$/)[1]

        let approvers = null
        if (req.body.issue.fields.status.name.toUpperCase() === 'Pending for 1st Approval'.toUpperCase()) {
            approvers = mappedFields['1st level Approval'].map((item) => {
                return item.emailAddress
            })
        }
        else if (req.body.issue.fields.status.name.toUpperCase() === 'Pending for 2nd Approval'.toUpperCase()) {
            approvers = mappedFields['2nd level Approval'].map((item) => {
                return item.emailAddress
            })
        }

        if (!approvers) {
            return
        }
        const to = approvers
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
                subject: 'HGC Service Desk - ' + caseNumber + ' - ' + caseSubject + ' is pending on your approval',
                html: `Dear Approvers,</br></br>

            This is to inform you that a case is pending on your approval</br></br>
            
            Ticket type : `+ serviceName + `</br>
            Reference Number : `+ caseNumber + `</br>
            Summary : `+ caseSubject + `</br>
            Service : `+ mappedFields['Service Request Items'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1] + `</br>
            Justification : ` + (Justification || '') + `</br>
            Requestor : `+ userName + `</br></br>
            
            Please do not hesitate to contact us at 2128 2666 or hgctoc@hgc.com.hk if any further questions or inquires regarding your ticket</br>
            This is an auto notification sent from system, please do not reply this email.</br></br>
            
            HGC TOC`
            }
        }
        rp(emailOptions)
    }, 10000);
})

module.exports = router;
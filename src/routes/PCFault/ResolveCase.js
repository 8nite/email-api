import express from 'express'
import rp from 'request-promise'
import queryString from 'query-string'
import { getEmails, getFieldMapping } from '../../functions/jiraAPI'

require('dotenv').config()

var router = express.Router();

router.post('/', async (req, res) => {
    res.send('done')
    const mappedFields = await getFieldMapping(req.body.issue.fields)

    const caseNumber = req.body.issue.key
    const serviceName = req.body.issue.fields.issuetype.name
    const caseSubject = req.body.issue.fields.summary
    const caseDescription = req.body.issue.fields.description
    const statusChanger = req.body.user.name

    const submitterInsightId = mappedFields['Submitter'][0].match(/\(([-A-Z0-9]*)\)$/)[1]
    const to = await getEmails('HGC', 'AD_USERS', 'Key', submitterInsightId, 'mail')
    const cc = []
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
            subject: 'HGC  - ' + caseNumber + ' - ' + caseSubject + ' - status had been changed to \' Resolved',
            html: `Dear All</br></br>

            This is to acknowledge that `+ statusChanger + ` had changed the case ` + caseNumber + ` status to be resolved</br></br>

            The incident would be closed 3 days after if there are no any reply on this case</br></br>

            Reference Number : `+ caseNumber + `</br>
            Description : `+ caseDescription + `</br></br>

            Please do not hesitate to contact us at hgcitsd@hgc.com.hk if any further questions or inquires regarding your ticket</br>
            This is an auto notification sent from system, please do not reply this email.</br></br>
            
            HGC`
    }
}
    rp(emailOptions)
})

module.exports = router;
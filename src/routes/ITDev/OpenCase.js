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
    const caseSubject = req.body.issue.fields.summary
    const caseDescription = req.body.issue.fields.description
    
    const assignedGroupInsightId = mappedFields['Assigned Group'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]
    const to = await getEmails('HGC', 'SelfServiceSupportUser', 'SelfServiceSupportTeam', assignedGroupInsightId, 'Name')
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
            subject: 'HGC  - ' + caseNumber + ' - ' + caseSubject + ' had been created',
            html: `Dear All</br></br>

            This is to acknowledge  the receipt of a reported case</br>
            We will have it checked and updates will be provided once available.</br></br>
            
            Reference Number : ` + caseNumber + `</br></br>

            <a href="https://jirasd.hgc.com.hk/browse/`+ caseNumber + `">https://jirasd.hgc.com.hk/browse/` + caseNumber + `</a></br></br>
            
            Please do not hesitate to contact us at hgcitsd@hgc.com.hk if any further questions or inquires regarding your ticket</br>
            This is an auto notification sent from system, please do not reply this email.</br></br>
            
            HGC`
        }
    }
    console.log(emailOptions)
    rp(emailOptions)
})

module.exports = router;
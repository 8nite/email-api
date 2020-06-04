import express from 'express'
import rp from 'request-promise'
import queryString from 'query-string'
import { getEmails, getFieldMapping } from '../../functions/jiraAPI'

require('dotenv').config()

var router = express.Router();

router.post('/', async (req, res) => {
    const mappedFields = await getFieldMapping(req.body.issue.fields)

    const caseNumber = req.body.issue.key
    const serviceName = req.body.issue.fields.issuetype.name
    const caseSubject = req.body.issue.fields.summary
    const assignmentGroup = mappedFields['Assignment Group'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1]
    const assignee = mappedFields.Assignee[0].split(' ')[0]
    const issueLink = mappedFields['Issue Type'].self.match(/[a-z]+:\/\/[^\/]+\//)[0]

    //console.log(mappedFields['Assignment Group'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1])

    //Send to Email
    let to = [assignee]

    let cc = await getEmails(assignmentGroup, 'Email')
    cc = cc.concat(await getEmails('TOC', 'Email'))
    //cc.push('BILLY.KWOK@hgc.com.hk')

    const emailOptions = {
        method: 'POST',
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/email',
        json: true,
        body: {
            from: process.env.DEFUALTSENDER,
            to: to,
            cc: cc,
            subject: caseNumber + " - " + serviceName + " - " + caseSubject + " - case had been assigned to you",
            html: `Dear All</br></br>

This is to inform you that a case is assigned to you</br>

Reference Number : `+ caseNumber + `</br>
Summary : ` + caseSubject + `</br>
Service : `+ serviceName + `</br></br>

<a href="`+ issueLink + 'browse/' + caseNumber + `">View request</a></br></br>

Please do not hesitate to contact us at 2128 2666 or hgctoc@hgc.com.hk if any further questions or inquires regarding your ticket
This is an auto notification sent from system, please do not reply this email.</br></br>

HGC TOC`
        }
    }
    rp(emailOptions)

    res.send('done')
})

module.exports = router;
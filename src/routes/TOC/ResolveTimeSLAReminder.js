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
    const caseSeverity = mappedFields['Severity'].value
    const assignmentGroup = mappedFields['Assignment Group'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1]
    const assignee = mappedFields.Assignee[0].split(' ')[0]
    const issueLink = mappedFields['Issue Type'].self.match(/[a-z]+:\/\/[^\/]+\//)[0]

    //Send to Email
    let to = [assignee]

    let cc = await getEmails('Assignment User', 'Group', assignmentGroup, 'Email')
    cc = cc.concat(await getEmails('Assignment User', 'Group', 'TOC', 'Email'))

    if (typeof caseSeverity == 'string' && (caseSeverity.search('2') >= 0 || caseSeverity.search('1') >= 0)) {
        cc.push('BILLY.KWOK@hgc.com.hk')
    }

    const emailOptions = {
        method: 'POST',
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/email',
        json: true,
        body: {
            from: process.env.DEFUALTSENDER,
            to: to,
            cc: cc,
            subject: caseSeverity + ' - ' + caseNumber + ' - ' + serviceName + ' - ' + caseSubject + ' - case is not yet resolved ',
            html: `Dear All</br></br>
This is an alert on a ` + caseSeverity + ` case ` + caseNumber + ` almost breached SLA on the resolve time</br></br>

Please response on the case as soon as possible</br></br>

Reference Number : ` + caseNumber + `</br>
Summary : ` + caseSubject + `</br>
Severity: ` + caseSeverity + `</br>
Service : ` + serviceName + `</br>
Assignment Group : ` + assignmentGroup + `</br>
Assignee: ` + assignee + `</br></br>

<a href="`+ issueLink + 'browse/' + caseNumber + `">View request</a></br></br>

Please do not hesitate to contact us at 2128 2666 or hgctoc@hgc.com.hk if any further questions or inquires regarding your ticket
This is an auto notification sent from system, please do not reply this email.</br></br>

HGC TOC`
        }
    }
    rp(emailOptions)
})

module.exports = router;
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
    const assignmentGroup = mappedFields['Assignment Group'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1]
    const assignee = mappedFields.Assignee[0].split(' ')[0]
    const issueLink = mappedFields['Issue Type'].self.match(/[a-z]+:\/\/[^\/]+\//)[0]
    const status = mappedFields.Status.name
    const statusChanger = req.body.user.name
    const userEmail = req.body.user.emailAddress
    const companyEmail = await getEmails('TOC','User Profile', 'Username', mappedFields['Contact - Company Reference'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1], 'Email')
    const serviceManager = mappedFields['Service Manager'].name

    //console.log(mappedFields['Assignment Group'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1])

    //Send to Email
    let to = companyEmail

    //let cc = await getEmails('TOC','Assignment User', 'Group', assignmentGroup, 'Email')
    //cc = cc.concat(await getEmails('TOC','Assignment User', 'Group', 'TOC', 'Email'))
    //cc.push('BILLY.KWOK@hgc.com.hk')

    let cc = 'hgctoc@hgc.com.hk'
    
    let bcc = []
    if (typeof caseSeverity == 'string' && (caseSeverity.search('2') >= 0 || caseSeverity.search('1') >= 0)) {
        bcc.push(serviceManager)
    }
    bcc.push('BILLY.KWOK@hgc.com.hk')
    bcc = bcc.concat(await getEmails('TOC','Assignment User', 'Group', 'TOC', 'Email'))

    const emailOptions = {
        method: 'POST',
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/email',
        json: true,
        body: {
            from: process.env.DEFUALTSENDER,
            to: to,
            cc: cc,
            bcc,
            subject: caseNumber + " - " + serviceName + " - " + caseSubject + " - status had been changed to " + status,
            html: `Dear All</br></br>

            This is to acknowledge that `+ statusChanger + ` had changed the case ` + caseNumber + ` status to be resolved</br></br>

            The incident would be closed 3 days after if there are no any reply on this case.</br></br>

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
})

module.exports = router;
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
    console.log(mappedFields['Assignee'])
    let assignmentGroup = ''
    try {
        assignmentGroup = await getInsight(mappedFields['Assignee'][0].originId.split('_')[1], 'Group') //mappedFields['AssignmentGroup'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1]
    } catch { }
    let assignee = ''
    try {
        assignee = await getInsight(mappedFields['Assignee'][0].originId.split('_')[1], 'Email')//mappedFields.Assignee[0].split(' ')[0]
    } catch { }
    const issueLink = mappedFields['Issue Type'].name //mappedFields['Issue Type'].self.match(/[a-z]+:\/\/[^\/]+\//)[0]

    //console.log(mappedFields['AssignmentGroup'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1])
    //console.log(assignmentGroup)
    //console.log(assignee)
    //Send to Email
    let to = [assignee]

    let cc = await getEmails('TOC','Assignment User', 'Group', assignmentGroup, 'Email')
    cc = cc.concat(await getEmails('TOC','Assignment User', 'Group', 'TOC', 'Email'))
    //cc.push('BILLY.KWOK@hgc.com.hk')

    const emailOptions = {
        method: 'POST',
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/email',
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

<a href="https://hgcitd.atlassian.net/browse/` + caseNumber + `">View request</a></br></br>

Please do not hesitate to contact us at 2128 2666 or hgctoc@hgc.com.hk if any further questions or inquires regarding your ticket
This is an auto notification sent from system, please do not reply this email.</br></br>

HGC TOC`
        }
    }
    rp(emailOptions)
})

module.exports = router;
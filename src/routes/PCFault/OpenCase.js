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
    const issueLink = mappedFields['Issue Type'].self.match(/[a-z]+:\/\/[^\/]+\//)[0]

    //console.log(mappedFields['Assignment Group'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1])

    //Send to Email
    let to = []
    try {
        to.push(await getEmails('TOC','Assignment User', 'Name', getEmails('SelfService', 'IssueSubCat', 'Name', mappedFields['Application'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1], 'AutoAssignUser'), 'Email'))
    } catch {}
    try {
        to.push(await getEmails('TOC','Assignment User', 'Name', getEmails('SelfService', 'IssueSubCat', 'Name', mappedFields['Hardware'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1], 'AutoAssignUser'), 'Email'))
    } catch {}
    try {
        to.push(await getEmails('TOC','Assignment User', 'Name', getEmails('SelfService', 'IssueSubCat', 'Name', mappedFields['Account'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1], 'AutoAssignUser'), 'Email'))
    } catch {}
    console.log(to)
    //let cc = await getEmails('TOC','Assignment User', 'Group', assignmentGroup, 'Email')
    //cc = cc.concat(await getEmails('TOC','Assignment User', 'Group', 'TOC', 'Email'))
    //cc.push('BILLY.KWOK@hgc.com.hk')

    let cc = []
    try {
        cc.push(await getEmails('TOC','Assignment User', 'Group', getEmails('SelfService', 'IssueSubCat', 'Name', mappedFields['Application'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1], 'AutoAssignGroup'), 'Email'))
    } catch {}
    try {
        cc.push(await getEmails('TOC','Assignment User', 'Group', getEmails('SelfService', 'IssueSubCat', 'Name', mappedFields['Hardware'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1], 'AutoAssignGroup'), 'Email'))
    } catch {}
    try {
        cc.push(await getEmails('TOC','Assignment User', 'Group', getEmails('SelfService', 'IssueSubCat', 'Name', mappedFields['Account'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1], 'AutoAssignGroup'), 'Email'))
    } catch {}
    console.log(cc)
    let bcc = []

    const emailOptions = {
        method: 'POST',
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/email',
        json: true,
        body: {
            from: process.env.DEFUALTSENDER,
            to: to,
            cc: cc,
            bcc,
            subject: caseNumber + " - " + caseSubject + " had been created",
            html: `Dear All</br></br>

This is to acknowledge  the receipt of a reported case</br>
We will have it checked and updates will be provided once available.</br></br>

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
import express from 'express'
import rp from 'request-promise'
import queryString from 'query-string'
import { getEmails, issueNames, getInsight } from '../../functions/jiraAPI'
import moment from 'moment-timezone'

require('dotenv').config()

var router = express.Router();

router.post('/', async (req, res) => {
    res.send('done')

    let mappedFields = await issueNames(req.body.issue.key)
    mappedFields = mappedFields.fields
    console.log("mappedFields['Authorized Vendor Personnel']")
    console.log(mappedFields['Authorized Vendor Personnel'])
    const caseNumber = req.body.issue.key
    const caseSubject = req.body.issue.fields.summary
    const requestor = req.body.issue.fields.reporter.emailAddress
    const requestDate = mappedFields['Created']
    let accessType = ''
    try {
        accessType = mappedFields['Access Type'].value
    } catch { }
    let serviceManager = ''
    try {
        serviceManager = mappedFields['Service Manager'].name
    } catch { }
    let dataCenter = ''
    let authorizerName = ''
    try {
        authorizerName = mappedFields['Authorizer'].displayName
    } catch { }
    let authorizerEmail = ''
    try {
        authorizerEmail = mappedFields['Authorizer'].emailAddress
    } catch { }
    let phone = ''
    try {
        phone = await getEmails('HGC', 'AD_USERS', 'mail', authorizerEmail, 'telephoneNumber')
    } catch { }
    let effectiveDate = ''
    try {
        effectiveDate = mappedFields['Effective Date']
    } catch { }
    let expirationDate = ''
    try {
        expirationDate = mappedFields['Expiration Date']
    } catch { }
    let remark = ''
    try {
        if (mappedFields['Remarks'])
            remark = mappedFields['Remarks']
    } catch { }
    let personnel = ''
    try {
        let x = JSON.parse(mappedFields['Authorized Vendor Personnel'])
        x.rows.forEach((row) => {
            if (row.columns.No)
                personnel += row.columns.No.toString() + ',     ' + row.columns['Staff_Name'] + ',     ' + row.columns['Staff_ID_or_HKID'] + ',    ' + row.columns['Company'] + ',     ' + row.columns['Appointed_Duty'] + ',     ' + row.columns.Rack + ' <br>'
        })
    } catch (e) { console.log(e) }

    //console.log(mappedFields['AssignmentGroup'][0].match(/(.*) \([-A-Z0-9]*\)$/)[1])

    //Send to Email
    let to = [authorizerEmail]

    let cc = []

    let bcc = []

    const emailOptions = {
        method: 'POST',
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/email',
        json: true,
        body: {
            from: process.env.DEFUALTSENDER,
            to: to,
            cc: cc,
            bcc,
            subject: '[' + caseNumber + '] ' + caseNumber + ' Pending for your approval',
            html: `
Dear ` + authorizerName + `,<br><br>

Please approve for the case: (` + caseNumber + `) ` + mappedFields['Summary'] + `<br><br>

<a href=` + process.env.URL + `/browse/` + caseNumber + `">View request</a></br></br>
`
        }
    }
    rp(emailOptions)
})

module.exports = router;
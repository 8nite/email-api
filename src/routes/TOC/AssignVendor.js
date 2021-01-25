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
    try {
        let x = JSON.parse(mappedFields['Authorized Vendor Personnel'])
        dataCenter = x.rows[0].columns.Rack.split('-')[0].trim()
    } catch (e) { console.log(e) }
    let authorizerName = ''
    try {
        authorizerName = mappedFields['Authorizer'].displayName
    } catch { }
    let authorizerEmail = ''
    try {
        authorizerEmail = mappedFields['Authorizer'].name
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
    let to = ['hgctoc@hgc.com.hk']
    //console.log(await getEmails('TOC', 'Data Centers', 'Data Center', dataCenter, 'Email'))
    try {
        let DCemail = await getEmails('TOC', 'Data Centers', 'Data Center', dataCenter, 'Email')
        to.push(DCemail[0])
    } catch (e) { console.log(e) }

    //let cc = await getEmails('TOC','Assignment User', 'Group', assignmentGroup, 'Email')
    //cc = cc.concat(await getEmails('TOC','Assignment User', 'Group', 'TOC', 'Email'))
    //cc.push('BILLY.KWOK@hgc.com.hk')

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
            subject: '[HGC SD][' + accessType + '] ' + caseNumber + ' Process Request (Data Center Operator) - Email Notification',
            html: `
Dear Support,<br><br>

Please note that you have a Data Center Site (` + accessType + `) Registration task to follow:<br><br>

Submitted by Operation <br>
Work Order Number: ` + caseNumber + ` <br>
Request Date:  ` + moment(requestDate).tz("Asia/Hong_Kong").format('YYYY-MM-DD') + ` <br>
Company Name: HGC Global Communications Limited <br>
Data Center: ` + dataCenter + ` <br>
Authorizer: ` + authorizerName + ` <br>
Authorizer's Email: ` + authorizerEmail + ` <br>
Office Direct: ` + phone + ` <br>
Fax: 3157 0400 <br>
Effective Date: ` + effectiveDate + ` <br>
Expiration Date: ` + expirationDate + ` <br>
Remark: ` + remark + ` <br>
List of Authorized Vendor's Personnel: <br>
No.,     Staff Name,      Staff ID / HKID, Company, Appointed Duty, Authorized Rack <br><br>
` + personnel + `<br><br>

Requested By: NSDOOPS <br>
Requested Date: ` + moment(requestDate).tz("Asia/Hong_Kong").format('YYYY-MM-DD') + ` <br><br>

Approved by Manager (Operation) <br>
Approved By: ` + authorizerName + ` <br>
Approved Date: ` + moment.tz("Asia/Hong_Kong").format('YYYY-MM-DD HH:mm') + ` <br><br>

[Enter Ticket Number: ] <br><br>

Please do not hesitate to contact us at 2128 2666 or hgctoc@hgc.com.hk if any further questions or inquires regarding your ticket
This is an auto notification sent from system, please do not reply this email.<br><br>

HGC TOC`
        }
    }
    rp(emailOptions)
})

module.exports = router;
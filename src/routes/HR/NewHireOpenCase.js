import express from 'express'
import rp from 'request-promise'
import queryString from 'query-string'
import { getEmails, getFieldMapping, issueNames } from '../../functions/jiraAPI'

require('dotenv').config()

var router = express.Router();

router.post('/', async (req, res) => {
    res.send('done')

    let options2 = {
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/issueNames?issueId=' + req.body.issue.key,
        json: true
    }
    let issusWithNames = await rp(options2)

    let CostCenterAdmins
    let CostCenter

    //Add support team for each request type
    try {
        if (issusWithNames.fields['Issue Type'].name === 'Task') {
            CostCenter = [issusWithNames.fields['Cost Center Group'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]]
            console.log('getting group ' + CostCenter)

            let param2 = {
                objectSchemaName: 'HGC',
                objectTypeName: 'Cost Center Admins',
                findAttribute: 'Group',
                findValue: CostCenter,
                returnAttribute: 'Name'
            }
            options2 = {
                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/object/attributeValue?' + queryString.stringify(param2),
                json: true
            }
            CostCenterAdmins = await rp(options2)
            console.log(CostCenterAdmins)

            CostCenterAdmins.forEach((admin) => {
                let options = {
                    uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/addWatcher?issueId=' + req.body.issue.key + '&name=' + admin,
                    json: true
                }
                rp(options)
            });
        }
    }
    catch (e) {
        console.log(e)
    }

    console.log('Sending Email for ' + req.body.issue.key)
    let mappedFields = await issueNames(req.body.issue.key)
    mappedFields = mappedFields.fields

    const caseNumber = req.body.issue.key
    const to = CostCenterAdmins
    const cc = ['arthurw@hgc.com.hk']
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
            subject: 'HGC Service Desk - Pending Submit New Hire Preparaton Request Task - ' + caseNumber,
            html: `Dear Department Admins,</br></br>

            A request has been submitted by HHRD `+ issusWithNames.fields['Creator'].displayName + ` to your team to prepare for new hire ` + issusWithNames.fields['Last Name (Eng)'] + ' ' + issusWithNames.fields['First Name (Eng)'] + ` who is to report duty on ` + issusWithNames.fields['Report Duty Date'] + `.</br></br>

            Information about the new hire:</br>
            Staff name: ` + issusWithNames.fields['Last Name (Eng)'] + ' ' + issusWithNames.fields['First Name (Eng)'] + `</br>
            Title: ` + issusWithNames.fields['Contractual Position (Eng)'] + `</br>
            Staff Type: ` + issusWithNames.fields['Staff Type'].value + `</br>
            Cost Center: ` + CostCenter + `</br>
            Staff ID: ` + issusWithNames.fields['Staff ID'] + `</br>
            Please click this <a href="` + issusWithNames.fields['Customer Request Type']._links.web + `">Link</a> to login workflow system and review and complete the request.</br></br>

            Please do not hesitate to contact us at 2128 2666 or hgctoc@hgc.com.hk if any further questions or inquires regarding your ticket</br>
            This is an auto notification sent from system, please do not reply this email.</br></br>
            
            HGC TOC`
        }
    }
    rp(emailOptions)
})

module.exports = router;
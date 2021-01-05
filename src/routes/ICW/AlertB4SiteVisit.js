import express from 'express'
import rp from 'request-promise'
import queryString from 'query-string'
import { getEmails, getFieldMapping, issueNames } from '../../functions/jiraAPI'

require('dotenv').config()

var router = express.Router();

router.post('/', async (req, res) => {
    res.send('done')

    let mappedFields = await issueNames(req.body.issue.key)
    mappedFields = mappedFields.fields

    const caseNumber = req.body.issue.key
    const serviceName = req.body.issue.fields.issuetype.name
    const caseSubject = req.body.issue.fields.summary

    const SurveyorInsightId = mappedFields['Surveyor'][0].match(/\(([-A-Z0-9]*)\)$/)[1]
    console.log(SurveyorInsightId)

    let options2 = {
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/object/keyAttributeValue?Key=' + SurveyorInsightId + '&returnAttribute=mail',
        json: true
    }

    let to = await rp(options2)

    let cc = []

    let bcc = []

    let options = {
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/issueScreenFields?screenId=' + '11547',
        json: true
    }

    let fields = await rp(options).then(($) => {
        return $.map((item) => { return item.name })
    })

    console.log(fields)

    let displayFields = {}

    fields.forEach((name) => {
        displayFields[name] = null

        try {
            displayFields[name] = mappedFields[name].value
        } catch { }
        if (!(displayFields[name] && displayFields[name].length > 0)) {
            try {
                displayFields[name] = mappedFields[name].name
            } catch { }
        }
        if (!(displayFields[name] && displayFields[name].length > 0)) {
            try {
                displayFields[name] = mappedFields[name][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]
            } catch { }
        }
        if (!(displayFields[name] && displayFields[name].length > 0)) {
            try {
                displayFields[name] = mappedFields[name].map((item) => { return item.value }).join(',')
            } catch { }
        }
        if (!(displayFields[name] && displayFields[name].length > 0)) {
            try {
                displayFields[name] = mappedFields[name]
            } catch { }
        }
    })

    let body = '<table border=1><tr><td>Fields Name</td><td>Value</td></tr>'
    Object.keys(displayFields).forEach((fieldName) => {
        body += '<tr><td>' + fieldName + '</td><td>' + (displayFields[fieldName] || '') + '</td></tr>'
    })
    body += '</table>'

    const emailOptions = {
        method: 'POST',
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/email',
        json: true,
        body: {
            from: process.env.DEFUALTSENDER,
            to: to,
            cc: cc,
            bcc,
            subject: "Alert for 1 day befor site visit - " + caseNumber + " - " + caseSubject + "",
            html: `Dear All</br></br>

            Alert for 1 day befor site visit.</br></br>

            Reference Number : `+ caseNumber + `</br>
            Summary : ` + caseSubject + `</br>
            Service : `+ serviceName + `</br></br>` + body + `</br></br>

            <a href="https://support.hgc.com.hk/browse/` + caseNumber + `">View request</a></br></br>

`
        }
    }
    rp(emailOptions)

    options = {
        method: 'POST',
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/CustomFieldID',
        body: { name: 'AlertMsgB4SiteVisit' },//'Creator User Info' },
        json: true
    }

    let customFieldID = await rp(options)
        .then(($) => {
            return $
        })

    options = {
        method: 'POST',
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/updateIssue',
        body: {
            "updateIssue": {
                "issueId": req.body.issue.key,
                "fields": {
                    [customFieldID]: 'Y'
                }
            }
        },
        json: true
    }

    rp(options)
})

module.exports = router;
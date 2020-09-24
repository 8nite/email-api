import express from 'express'
import rp from 'request-promise'
import queryString from 'query-string'
import { getEmails, getFieldMapping } from '../../functions/jiraAPI'

require('dotenv').config()

var router = express.Router();

router.post('/', async (req, res) => {
    //console.log(req.body)
    if (req.body.webhookEvent == 'jira:issue_created') {
        console.log('An issue was created: ' + req.body.issue.key + ' on project: ')
        console.log(req.body.issue.fields.project)
        if (req.body.issue.fields.project.name.search('HelpDesk') >= 0) {
            const param = {
                issueId: req.body.issue.key,
                from0: 'creator',
                from1: 'emailAddress',
                CMDBSchemaName: 'CivilWork',
                CMDBObjectTypeName: 'AD_USERS',
                CMDBObjectAttributeName: 'Email',
                fieldName: 'Creator User Info',
            }
            const options = {
                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/setJiraCreator?' + queryString.stringify(param),
                json: true
            }
            rp(options)
        }
        else if (req.body.issue.fields.project.name.search('Internal Civil Work Quotation (ICWQ)') >= 0) {
            const param = {
                issueId: req.body.issue.key,
                from0: 'fields',
                from1: 'Account Manager Email',
                CMDBSchemaName: 'CivilWork',
                CMDBObjectTypeName: 'AD_USERS',
                CMDBObjectAttributeName: 'Email',
                fieldName: 'Creator User Info',
            }
            const options = {
                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/setJiraCreator?' + queryString.stringify(param),
                json: true
            }
            rp(options)

            const param2 = {
                issueId: req.body.issue.key,
                from0: 'fields',
                from1: 'Solution Consultant Email',
                CMDBSchemaName: 'CivilWork',
                CMDBObjectTypeName: 'AD_USERS',
                CMDBObjectAttributeName: 'Email',
                fieldName: 'Creator User Info',
            }
            const options2 = {
                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/setJiraCreator?' + queryString.stringify(param),
                json: true
            }
            rp(options2)

            const param3 = {
                issueId: req.body.issue.key,
                from0: 'fields',
                from1: 'building ID',
                CMDBSchemaName: 'CivilWork',
                CMDBObjectTypeName: 'buil',
                CMDBObjectAttributeName: 'Email',
                fieldName: 'Creator User Info',
            }
            const options3 = {
                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/setJiraCreator?' + queryString.stringify(param),
                json: true
            }
            rp(options3)
        }
    }
    else if (req.body.issue.fields.project.name.search('TOC') >= 0 && req.body.changelog.items.some((item) => item.field === 'Assignee')) {
        console.log('Assignee changed: ' + req.body.changelog)
        const options = {
            method: 'POST',
            uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/TOC/Assignment',
            json: true,
            body: req.body
        }
        rp(options).then(($) => {
            res.send($)
        })
    }
    else {
        res.send("nothing done")
    }
})

module.exports = router;
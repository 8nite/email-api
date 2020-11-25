import express from 'express'
import rp from 'request-promise'
import queryString from 'query-string'
import { getEmails, getFieldMapping, getInsight } from '../../functions/jiraAPI'

require('dotenv').config()

var router = express.Router();

router.post('/', async (req, res) => {
    //console.log(req.body)
    if (req.body.webhookEvent == 'jira:issue_created') {
        console.log('An issue was created: ' + req.body.issue.key + ' on project: ')
        //console.log(req.body.issue.fields.project)
        if (req.body.issue.fields.project.name.search('Self Service') >= 0) {
            //Add Submitter to issue

            //get issue fields
            console.log('getting issue info...')
            let options2 = {
                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/issueNames?issueId=' + req.body.issue.key,
                json: true
            }
            let issusWithNames = await rp(options2)

            console.log('setting submitter...')
            try {
                const param = {
                    issueId: req.body.issue.key,
                    from0: 'reporter',
                    from1: 'emailAddress',
                    CMDBSchemaName: 'HGC',
                    CMDBObjectTypeName: 'AD_USERS',
                    CMDBObjectAttributeName: 'mail',
                    fieldName: 'Submitter',
                }
                let options = {
                    uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/setJiraCreator?' + queryString.stringify(param),
                    json: true
                }

                rp(options)
            } catch { }

            //Add support team for each request type
            try {
                let supportTeam

                try {
                    if (issusWithNames.fields['Issue Type'].name !== 'Incident' || issusWithNames.fields['Customer Request Type'].requestType.name != 'Report Issues') {
                        let ITSystemInsightId
                        if (issusWithNames.fields['Customer Request Type'].requestType.name == 'Service Request') {
                            ITSystemInsightId = issusWithNames.fields['Service Request Items'][0].match(/\(([-A-Z0-9]*)\)$/)[1]
                            console.log(ITSystemInsightId)

                            options2 = {
                                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/object/keyAttributeValue?Key=' + ITSystemInsightId + '&returnAttribute=Service Request Support Team',
                                json: true
                            }

                            supportTeam = await rp(options2)
                        }
                        else if (issusWithNames.fields['Customer Request Type'].requestType.name == 'Account and Access') {
                            ITSystemInsightId = issusWithNames.fields['Account System'][0].match(/\(([-A-Z0-9]*)\)$/)[1]
                            console.log(ITSystemInsightId)

                            options2 = {
                                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/object/keyAttributeValue?Key=' + ITSystemInsightId + '&returnAttribute=Account and Access Support Team',
                                json: true
                            }

                            supportTeam = await rp(options2)
                        }
                    }
                    else {
                        ITSystemInsightId = issusWithNames.fields['Category'][0].match(/\(([-A-Z0-9]*)\)$/)[1]
                        console.log(ITSystemInsightId)

                        options2 = {
                            uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/object/keyAttributeValue?Key=' + ITSystemInsightId + '&returnAttribute=Report Issue Support Team',
                            json: true
                        }

                        supportTeam = await rp(options2)
                    }
                } catch { }

                if (!supportTeam || supportTeam === '') {
                    if (issusWithNames.fields['Issue Type'].name !== 'Incident' || issusWithNames.fields['Customer Request Type'].requestType.name != 'Report Issues') {
                        let ITSystemInsightId
                        if (issusWithNames.fields['Customer Request Type'].requestType.name == 'Service Request') {
                            ITSystemInsightId = issusWithNames.fields['Service Request Items'][0].match(/\(([-A-Z0-9]*)\)$/)[1]
                            console.log(ITSystemInsightId)

                            options2 = {
                                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/object/keyAttributeValue?Key=' + ITSystemInsightId + '&returnAttribute=Support Team',
                                json: true
                            }

                            supportTeam = 'SW-SS ' + await rp(options2)
                        }
                        else if (issusWithNames.fields['Customer Request Type'].requestType.name == 'Account and Access') {
                            ITSystemInsightId = issusWithNames.fields['Account System'][0].match(/\(([-A-Z0-9]*)\)$/)[1]
                            console.log(ITSystemInsightId)

                            options2 = {
                                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/object/keyAttributeValue?Key=' + ITSystemInsightId + '&returnAttribute=Support Team',
                                json: true
                            }

                            supportTeam = 'AA-SS ' + await rp(options2)
                        }
                    }
                    else {
                        supportTeam = 'EUC'// + await rp(options2)
                    }
                }
                console.log('setting assign group: ' + supportTeam)

                let param2 = {
                    objectSchemaName: 'HGC',
                    objectTypeName: 'SelfServiceSupportTeam',
                    findAttribute: 'Name',
                    findValue: supportTeam,
                    returnAttribute: 'Key'
                }
                options2 = {
                    uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/object/attributeValue?' + queryString.stringify(param2),
                    json: true
                }
                const supportTeamId = await rp(options2)
                console.log(supportTeamId)

                let options = {
                    method: 'POST',
                    uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/CustomFieldID',
                    body: { name: 'Assigned Group' },//'Creator User Info' },
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
                                [customFieldID]: [{ 'key': supportTeamId[0] }]
                            }
                        }
                    },
                    json: true
                }

                rp(options).then(async () => {
                    /*const optionIssue = {
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/issue?issueId=' + req.body.issue.key,
                        json: true,
                    }

                    const openCase = {
                        method: 'POST',
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/ITDev/OpenCase',
                        json: true,
                        body: {
                            issue: await rp(optionIssue)
                        }
                    }

                    rp(openCase)*/
                })
            } catch (e) { console.log(e) }
            //Add 1st Approver to issue
            console.log('Starting for 1st approval')
            try {
                /*let SubmiterInsightId = null
                let department = null
 
                try {
                    SubmiterInsightId = issusWithNames.fields['Cost Center Group'][0].match(/\(([-A-Z0-9]*)\)$/)[1]
 
                    options2 = {
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/object/keyAttributeValue?Key=' + SubmiterInsightId + '&returnAttribute=Name',
                        json: true
                    }
                    department = await rp(options2)
                } catch { }
 
                while (!SubmiterInsightId) {
                    try {
                        console.log('Getting updated fields')
                        let options2 = {
                            uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/issueNames?issueId=' + req.body.issue.key,
                            json: true
                        }
                        let issusWithNames = await rp(options2)
                        console.log(issusWithNames.fields['Submitter'])
                        SubmiterInsightId = issusWithNames.fields['Submitter'][0].match(/\(([-A-Z0-9]*)\)$/)[1]
                    } catch {
 
                    }
                }
 
                console.log(SubmiterInsightId)
 
 
                if (!department) {
                    options2 = {
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/object/keyAttributeValue?Key=' + SubmiterInsightId + '&returnAttribute=department',
                        json: true
                    }
                    department = await rp(options2)
                }
                console.log('Getting Department of submitter: ' + department)
 
                let param2 = {
                    objectSchemaName: 'HGC',
                    objectTypeName: 'Cost Center Users',
                    findAttribute: 'CostCenter',
                    findValue: department,
                    findAttribute2: 'IsApprover',
                    findValue2: 'Y',
                    returnAttribute: 'Name'
                }
                options2 = {
                    uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/object/2attributeValue?' + queryString.stringify(param2),
                    json: true
                }
                const approver1list = await rp(options2)
                console.log('approver1list: ')
                console.log(approver1list)
                */

                const approver1list = [issusWithNames.fields['Department Approver'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]]

                let options = {
                    method: 'POST',
                    uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/CustomFieldID',
                    body: { name: '1st level Approval' },//'Creator User Info' },
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
                                [customFieldID]: approver1list.map((email) => { return { name: email } })
                            }
                        }
                    },
                    json: true
                }

                rp(options)
            } catch (e) { console.log(e) }
            //Add 1st Approver to issue
            console.log('Starting for 2nd approval')
            try {
                const ServiceRequestType = issusWithNames.fields['Service Request Type'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]

                const ITSystemInsightId = issusWithNames.fields['Service Request Items'][0].match(/\(([-A-Z0-9]*)\)$/)[1]

                options2 = {
                    uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/object/keyAttributeValue?Key=' + ITSystemInsightId + '&returnAttribute=Category',
                    json: true
                }
                const Category = await rp(options2)

                if ((ServiceRequestType !== "Application and System" || Category === "IT Infra") && Category !== "Video Conference") {

                    const approver1list = ['BILLY.KWOK@hgc.com.hk']

                    let options = {
                        method: 'POST',
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/CustomFieldID',
                        body: { name: '2nd level Approval' },//'Creator User Info' },
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
                                    [customFieldID]: approver1list.map((email) => { return { name: email } })
                                }
                            }
                        },
                        json: true
                    }

                    rp(options)
                }
            } catch (e) { console.log(e) }
            //Add UAT Sign off Approver to issue
            try {
                let options = {
                    method: 'POST',
                    uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/CustomFieldID',
                    body: { name: 'UAT Sign Off Approver' },//'Creator User Info' },
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
                                [customFieldID]: { name: req.body.issue.fields.reporter.emailAddress }
                            }
                        }
                    },
                    json: true
                }

                rp(options)
            } catch (e) { console.log(e) }

            //clone fields
            console.log('Start Cloning Fields')
            try {
                let options
                if (issusWithNames.fields['Customer Request Type'].requestType.name == 'Account and Access') {
                    options = {
                        method: 'POST',
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/CustomFieldID',
                        body: { name: 'NeedDevelopment' },//'Creator User Info' },
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
                                    [customFieldID]: 'N'
                                }
                            }
                        },
                        json: true
                    }

                    rp(options)

                    options = {
                        method: 'POST',
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/CustomFieldID',
                        body: { name: 'NeedUAT' },//'Creator User Info' },
                        json: true
                    }

                    customFieldID = await rp(options)
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
                                    [customFieldID]: 'N'
                                }
                            }
                        },
                        json: true
                    }

                    rp(options)

                    options = {
                        method: 'POST',
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/CloneInsightToField',
                        body: {
                            updateIssue: {
                                issueId: req.body.issue.key,
                                fieldName: 'Account System',
                                attributeName: 'need1stApproval',
                                replaceFieldName: 'need1stApproval'
                            }
                        },
                        json: true
                    }
                    rp(options)

                    options = {
                        method: 'POST',
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/CloneInsightToField',
                        body: {
                            updateIssue: {
                                issueId: req.body.issue.key,
                                fieldName: 'Account System',
                                attributeName: 'need2ndApproval',
                                replaceFieldName: 'need2ndApproval'
                            }
                        },
                        json: true
                    }
                    rp(options)
                }
                else {
                    options = {
                        method: 'POST',
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/CloneInsightToField',
                        body: {
                            updateIssue: {
                                issueId: req.body.issue.key,
                                fieldName: 'Service Request Items',
                                attributeName: 'NeedDevelopment',
                                replaceFieldName: 'NeedDevelopment'
                            }
                        },
                        json: true
                    }
                    rp(options)

                    options = {
                        method: 'POST',
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/CloneInsightToField',
                        body: {
                            updateIssue: {
                                issueId: req.body.issue.key,
                                fieldName: 'Service Request Items',
                                attributeName: 'NeedUAT',
                                replaceFieldName: 'NeedUAT'
                            }
                        },
                        json: true
                    }
                    rp(options)


                    options = {
                        method: 'POST',
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/CloneInsightToField',
                        body: {
                            updateIssue: {
                                issueId: req.body.issue.key,
                                fieldName: 'Service Request Items',
                                attributeName: 'need1stApproval',
                                replaceFieldName: 'need1stApproval'
                            }
                        },
                        json: true
                    }
                    rp(options)

                    options = {
                        method: 'POST',
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/CloneInsightToField',
                        body: {
                            updateIssue: {
                                issueId: req.body.issue.key,
                                fieldName: 'Service Request Items',
                                attributeName: 'need2ndApproval',
                                replaceFieldName: 'need2ndApproval'
                            }
                        },
                        json: true
                    }
                    rp(options)
                }
            } catch (e) { console.log(e) }
        }
        else if (req.body.issue.fields.project.name.search('IT Development') >= 0) {

            const openCase = {
                method: 'POST',
                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/ITDev/OpenCase',
                json: true,
                body: {
                    issue: req.body.issue
                }
            }
            console.log("Calling ITDEV OpenCase email...")
            rp(openCase)
        }
        else if (req.body.issue.fields.project.name.search('Internal Civil Work Quotation') >= 0) {
            const param = {
                issueId: req.body.issue.key,
                from0: 'fields',
                from1: 'Account Manager Email',
                CMDBSchemaName: 'HGC',
                CMDBObjectTypeName: 'AD_USERS',
                CMDBObjectAttributeName: 'Email',
                fieldName: 'Account Manager',
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
                CMDBSchemaName: 'HGC',
                CMDBObjectTypeName: 'AD_USERS',
                CMDBObjectAttributeName: 'Email',
                fieldName: 'Solution Consultant',
            }
            const options2 = {
                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/setJiraCreator?' + queryString.stringify(param2),
                json: true
            }
            rp(options2)

            const param3 = {
                issueId: req.body.issue.key,
                from0: 'fields',
                from1: 'building ID',
                CMDBSchemaName: 'CivilWork',
                CMDBObjectTypeName: 'Building',
                CMDBObjectAttributeName: 'Building ID',
                fieldName: 'Building',
            }
            const options3 = {
                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/setJiraCreator?' + queryString.stringify(param3),
                json: true
            }
            rp(options3)
        }
    }
    else if (req.body.webhookEvent == 'jira:issue_updated') {
        console.log('An issue was updated: ' + req.body.issue.key + ' on project: ')
        if (req.body.issue.fields.project.name.search('IT Development') >= 0 && req.body.issue.fields.status.name === "Canceled") {

            const cancelCase = {
                method: 'POST',
                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/ITDev/CancelCase',
                json: true,
                body: {
                    issue: req.body.issue
                }
            }

            rp(cancelCase)
        }
    }
    else if (req.body.issue.fields.project.name.search('TOC') >= 0 && req.body.changelog.items.some((item) => item.field === 'Assignee')) {
        console.log('Assignee changed: ' + req.body.changelog)
        const options = {
            method: 'POST',
            uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/TOC/Assignment',
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
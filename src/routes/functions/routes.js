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
        else if (req.body.issue.fields.project.name.search('PC Requisition') >= 0) {
            //Add Submitter to issue

            //get issue fields
            console.log('getting issue info...')
            let options2 = {
                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/issueNames?issueId=' + req.body.issue.key,
                json: true
            }
            let issusWithNames = await rp(options2)

            if (
                issusWithNames.fields['Customer Request Type'].requestType.name === 'PC Requisition' ||
                issusWithNames.fields['Customer Request Type'].requestType.name === 'Access Card Requisition' ||
                issusWithNames.fields['Customer Request Type'].requestType.name === 'Telephone Job Requisition'
            ) {
                //Add 1st Approver to issue
                console.log('Starting for 1st approval')
                try {

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

            }
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
        else if (req.body.issue.fields.project.name.search('Internal Civil Work') >= 0) {
            try {
                /*const param = {
                    issueId: req.body.issue.key,
                    from0: 'fields',
                    from1: 'Account Manager Email',
                    CMDBSchemaName: 'HGC',
                    CMDBObjectTypeName: 'AD_USERS',
                    CMDBObjectAttributeName: 'mail',
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
                    CMDBObjectAttributeName: 'mail',
                    fieldName: 'Solution Consultant',
                }
                const options2 = {
                    uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/setJiraCreator?' + queryString.stringify(param2),
                    json: true
                }
                rp(options2)*/

            } catch { }
            try {
                console.log('getting building ID...')
                let options = {
                    method: 'POST',
                    uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/CloneInsightToField',
                    body: {
                        updateIssue: {
                            issueId: req.body.issue.key,
                            fieldName: 'Building',
                            attributeName: 'Building ID',
                            replaceFieldName: 'Building ID'
                        }
                    },
                    json: true
                }
                rp(options).then(async (blah) => {
                    console.log('done building ID')
                    let options = {
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/issueNames?issueId=' + req.body.issue.key,
                        json: true
                    }
                    let issusWithNames = await rp(options)
                    console.log('getting fields...')
                    options = {
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/search?jql=project%20%3D%20ICW%20AND%20issuetype%20%3D%20"Service%20Request"%20AND%20"Building%20ID"%20~%20"' + issusWithNames.fields['Building ID'] + '"%20ORDER%20BY%20created%20DESC',
                        json: true
                    }
                    //console.log(options)
                    rp(options).then(async ($) => {
                        console.log('looking at latest tickets')
                        options = {
                            uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/issueNames?issueId=' + $.issues[0].key,
                            json: true
                        }
                        console.log('getting previous fields...')
                        let previousIssusWithNames = await rp(options)

                        const getPrevious = ['Civil Cost', 'External Cable Cost', 'Blockwiring Cost (HK$)']

                        getPrevious.forEach(async (fieldName) => {
                            console.log('getting previous fields for ' + fieldName)
                            let updateOptions = {
                                method: 'POST',
                                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/CustomFieldID',
                                body: { name: 'Latest ' + fieldName },//'Creator User Info' },
                                json: true
                            }

                            let customFieldID = await rp(updateOptions)
                                .then(($) => {
                                    return $
                                })
                            console.log(previousIssusWithNames.fields[fieldName])
                            updateOptions = {
                                method: 'POST',
                                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/updateIssue',
                                body: {
                                    "updateIssue": {
                                        "issueId": req.body.issue.key,
                                        "fields": {
                                            [customFieldID]: previousIssusWithNames.fields[fieldName].toString()
                                        }
                                    }
                                },
                                json: true
                            }
                            rp(updateOptions)
                        })
                    })
                })
            } catch(e) { console.log(e) }
        }
        else if (req.body.issue.fields.project.name.search('HR') >= 0) {
            console.log('HR: getting issue info...')
            let options2 = {
                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/issueNames?issueId=' + req.body.issue.key,
                json: true
            }
            let issusWithNames = await rp(options2)

            //Add support team for each request type
            try {
                if (issusWithNames.fields['Issue Type'].name === 'Task') {
                    const CostCenter = [issusWithNames.fields['Cost Center Group'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]]
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
                    const CostCenterAdmins = await rp(options2)
                    console.log(CostCenterAdmins)

                    /*CostCenterAdmins.forEach((admin) => {
                        let options = {
                            uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/set/jira/issue/addParticipant?issueId=' + req.body.issue.key + '&name=' + admin,
                            json: true
                        }
                        rp(options)
                    });*/


                    let options = {
                        method: 'POST',
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/CustomFieldID',
                        body: { name: 'Request participants' },//'Creator User Info' },
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
                                    [customFieldID]: CostCenterAdmins.map((email) => { return { name: email } })
                                }
                            }
                        },
                        json: true
                    }

                    rp(options)
                }
            }
            catch (e) {
                console.log(e)
            }
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
        else if (req.body.issue.fields.project.name.search('HR') >= 0 && req.body.issue.fields.status.name.toUpperCase() === "PENDING FOR DEPARTMENT TO EDIT") {
            //check if exsist
            console.log('HR:NewHire:checking insert to profile')
            let option = {
                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/sql/getTableData?' +
                    'user=' + process.env.HRDBUSER +
                    '&password=' + process.env.HRDBPASSWORD +
                    '&connString=' + process.env.HRDBCONNSTRING +
                    '&tableName=' + process.env.HRDBPROFILETABLE,
                json: true
            }

            rp(option).then(async ($) => {
                if ($ && $.rows && $.rows.every((row) => { return row.REFNO !== req.body.issue.key })) {
                    console.log('HR:NewHire:refno no existing, will insert now...')
                    let optionsNames = {
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/issueNames?issueId=' + req.body.issue.key,
                        json: true
                    }
                    let issusWithNames = await rp(optionsNames)

                    console.group('TO_DATE(\'' + issusWithNames.fields['Report Duty Date'] + '\', \'YYYY-MM-DD\')')

                    let initial = ''
                    try {
                        initial = issusWithNames.fields['First Name (Eng)'].substring(0, 1) + issusWithNames.fields['Last Name (Eng)'].substring(0, 1)
                    } catch { }
                    const option2 = {
                        method: 'POST',
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/sql/insertSQL',
                        body: {
                            sql: {
                                user: process.env.HRDBUSER,
                                password: process.env.HRDBPASSWORD,
                                connString: process.env.HRDBCONNSTRING,
                                tableName: process.env.HRDBPROFILETABLE,
                                fields: [
                                    'REFNO',
                                    'STAFFID',
                                    'TITLE',
                                    'FUNCTIONALTITLE',
                                    'TITLECHI',
                                    'MOBILENUMBER',
                                    'MOBILEPHONEMODEL',
                                    'REPORTDUTYDATE',
                                    'STAFFALIAS',
                                    'STAFFNAMECHI',
                                    'GRADE',
                                    'COSTCENTER',
                                    'CONTRACTENDDATE',
                                    'COMPANYCODE',
                                    'HHRDREMARK',
                                    'STAFFTYPE1',
                                    'STAFFINITIAL',
                                    'TEMPFIRST',
                                    'TEMPLAST',
                                    'STAFFFIRSTNAME',
                                    'STAFFLASTNAME',
                                    'REGION',
                                    'WORKLOCATION'
                                ],
                                values: [
                                    req.body.issue.key,
                                    issusWithNames.fields['Staff ID'] || '',
                                    issusWithNames.fields['Contractual Position (Eng)'] || '',
                                    issusWithNames.fields['Functional Title (Eng)'] || '',
                                    '',
                                    issusWithNames.fields['Mobile Number'] || '',
                                    issusWithNames.fields['Mobile Phone Model'] || '',
                                    issusWithNames.fields['Report Duty Date'] ? issusWithNames.fields['Report Duty Date'] + ' 00:00:00' : '',
                                    issusWithNames.fields['Alias (Eng)'] || '',
                                    issusWithNames.fields['Staff Name (Chi)'] || '',
                                    (issusWithNames.fields['Staff Grade'] && issusWithNames.fields['Staff Grade'].value ? issusWithNames.fields['Staff Grade'].value : ''),
                                    issusWithNames.fields['Cost Center Group'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1],
                                    issusWithNames.fields['Contract End Date'] ? issusWithNames.fields['Contract End Date'] + ' 00:00:00' : '',
                                    'HGC',
                                    '',
                                    '',
                                    initial,
                                    '',
                                    '',
                                    issusWithNames.fields['First Name (Eng)'] || '',
                                    issusWithNames.fields['Last Name (Eng)'] || '',
                                    '',
                                    issusWithNames.fields['Work Location'] || ''
                                ]
                            }
                        },
                        json: true
                    }
                    rp(option2)
                }
            })
        }
        else if (req.body.issue.fields.project.name.search('HR') >= 0 && req.body.issue.fields.status.name.toUpperCase() === "IT JOB") {
            //check if exsist
            let option = {
                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/sql/getTableData?' +
                    'user=' + process.env.HRDBUSER +
                    '&password=' + process.env.HRDBPASSWORD +
                    '&connString=' + process.env.HRDBCONNSTRING +
                    '&tableName=' + process.env.HRDBREQUESTTABLE,
                json: true
            }

            rp(option).then(async ($) => {
                if ($ && $.rows && $.rows.every((row) => { return row.REFNO !== req.body.issue.key })) {
                    let optionsNames = {
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/issueNames?issueId=' + req.body.issue.key,
                        json: true
                    }
                    let issusWithNames = await rp(optionsNames)

                    const option2 = {
                        method: 'POST',
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/sql/insertSQL',
                        body: {
                            sql: {
                                user: process.env.HRDBUSER,
                                password: process.env.HRDBPASSWORD,
                                connString: process.env.HRDBCONNSTRING,
                                tableName: process.env.HRDBREQUESTTABLE,
                                fields: ['REFNO', 'DEPTAPPROVBY'],
                                values: [req.body.issue.key, issusWithNames.fields['Updated']]
                            }
                        },
                        json: true
                    }
                    rp(option2)
                }
            })
        }
        else if (req.body.issue.fields.project.name.search('Internal Civil Work') >= 0) {
            try {
                //get issue fields
                console.log('getting issue info...')
                let options2 = {
                    uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/issueNames?issueId=' + req.body.issue.key,
                    json: true
                }
                let issusWithNames = await rp(options2)

                if (issusWithNames.fields['Issue Type'].name === 'Service Request' && issusWithNames.fields['Status'].name === 'Resolved') {
                    let body = {
                        sql: {
                            user: process.env.CIVILWORKDBUSER,
                            password: process.env.CIVILWORKDBPASSWORD,
                            connString: process.env.CIVILWORKDBCONNSTRING,
                            tableName: process.env.CIVILWORKDBTABLENAME,
                            formatting: true,
                            delRow: {
                                REQUEST_NO: req.body.issue.key
                            },
                            fields: ['REQUEST_NO'],
                            values: [req.body.issue.key]
                        }
                    }

                    body.sql.fields.push('PROJECT_NAME')
                    body.sql.values.push(issusWithNames.fields['Customer Request Type'].requestType.name)

                    body.sql.fields.push('REQUEST_DATE')
                    body.sql.values.push(issusWithNames.fields['Created'])

                    body.sql.fields.push('CREATE_DATE')
                    body.sql.values.push(issusWithNames.fields['Created'])

                    body.sql.fields.push('UPDATE_DATE')
                    body.sql.values.push(issusWithNames.fields['Updated'])

                    body.sql.fields = body.sql.fields.concat(Object.keys(issusWithNames.fields).map((name) => { return name.toUpperCase().replace(' ', '_') }))
                    body.sql.values = body.sql.values.concat(Object.keys(issusWithNames.fields).map((itemName) => {
                        if (!issusWithNames.fields[itemName])
                            return ''
                        else {
                            let ret
                            try {
                                ret = issusWithNames.fields[itemName].value
                            } catch { }
                            if (!(ret && ret.length > 0)) {
                                try {
                                    ret = issusWithNames.fields[itemName][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]
                                } catch { }
                            }
                            if (!(ret && ret.length > 0)) {
                                try {
                                    ret = issusWithNames.fields[itemName].map((item) => { return item.value }).join(',')
                                } catch { }
                            }
                            if (ret)
                                return ret
                            else
                                return JSON.stringify(issusWithNames.fields[itemName])
                        }
                    }))
                    //console.log(body)

                    let optionsInsert = {
                        method: 'POST',
                        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/sql/insertSQL',
                        body,
                        json: true
                    }
                    await rp(optionsInsert)
                }
            } catch (e) {
                console.log(e)
            }
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
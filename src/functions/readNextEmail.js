import imaps from 'imap-simple'
import atob from 'atob'
import rp from 'request-promise'
import { Base64 } from 'js-base64'

const readNextEmail = (() => {
    return new Promise((resolve, reject) => {
        const config = {
            imap: {
                user: 'FTNOPS@office.hgc.com.hk',//'hgcdom/herbtung',
                password: '$passwordFEB20',
                host: '172.25.16.130',
                port: 143
            }
        }

        try {
            imaps.connect(config).then(function (connection) {

                return connection.openBox('INBOX').then(function () {
                    const searchCriteria = [
                        'UNANSWERED'
                    ];

                    var fetchOptions = {
                        bodies: ['HEADER', 'TEXT'],
                        markSeen: false,
                        struct: true
                    };

                    return connection.search(searchCriteria, fetchOptions).then(function (results) {
                        let x = 0;
                        [results[0]].forEach(async (item) => {
                            //console.log(Object.keys(item))
                            if (!item)
                                return
                            //console.log(item)
                            //console.log(item.attributes.flags)
                            //console.log(item.parts)

                            let subject
                            try {
                                subject = (item.parts.filter((part) => { return part.which === 'HEADER' }))[0].body.subject[0]
                            } catch { }
                            const from = item.parts.filter((part) => { return part.which === 'HEADER' })[0].body.from;
                            const to = item.parts.filter((part) => { return part.which === 'HEADER' })[0].body.to;
                            const cc = item.parts.filter((part) => { return part.which === 'HEADER' })[0].body.cc;
                            //console.log(item)
                            const reference = item.parts.filter((part) => { return part.which === 'HEADER' })[0].body
                            let htmlBody = item.parts.filter((part) => { return part.which === 'TEXT' })[0].body.toString();
                            htmlBody = htmlBody.replace(/\=\r\n/g,'')
                            //console.log(item.parts.filter((part) => { return part.which === 'TEXT' }))
                            console.log(reference)

                            if (reference['content-transfer-encoding'] && reference['content-transfer-encoding'][0].toUpperCase() === 'BASE64') {
                                htmlBody = atob(htmlBody).toString()
                            }
                            //console.log(item.parts.filter((part) => { return part.which === 'HEADER' })[0].body)

                            let attachmentList = null

                            //const partsBody = item.parts.filter((part) => { return part.which === 'TEXT' });
                            //console.log(Object.keys(partsBody[0]))
                            //try {
                            const parts = imaps.getParts(item.attributes.struct)

                            let html = parts.filter(function (part) {
                                //console.log(part)
                                return part.type.toUpperCase() === 'TEXT'
                            }).map(function (part) {
                                // retrieve the attachments only of the messages with attachments
                                return connection.getPartData(item, part)
                                    .then(function (partData) {
                                        //console.log(partData)
                                        return partData
                                    });
                            })

                            //console.log(parts)
                            let attachments = []
                            attachments = attachments.concat(parts.filter(function (part) {
                                //console.log(part.disposition)
                                return part.disposition && (part.disposition.type.toUpperCase() === 'INLINE' || part.disposition.type.toUpperCase() === 'ATTACHMENT');
                            }).map(function (part) {
                                // retrieve the attachments only of the messages with attachments
                                return connection.getPartData(item, part)
                                    .then(function (partData) {
                                        //console.log(part)
                                        return {
                                            filename: part.disposition.params.filename,
                                            content: partData.toString('base64'),
                                            encoding: 'base64',
                                            cid: (part.id ? part.id.replace('<', '').replace('>', '') : null)
                                        };
                                    });
                            }));

                            let bodyInline = ''
                            //console.log(attachments)
                            await Promise.all(attachments).then((attachment) => {
                                attachmentList = attachment

                                attachment.map((item) => {
                                    let newItem = item
                                    if (!item.filename && !item.cid && item.encoding && item.encoding.toUpperCase() === 'BASE64') {
                                        newItem.content = Buffer.from(item.content).toString('base64');
                                        newItem.isMsg = true
                                    }
                                })
                                /*attachment.forEach((item) => {
                                    console.log(item.cid)
                                    if (item.cid) {
                                        bodyInline += '<' + item.cid.toUpperCase() + '>' + item.content
                                        bodyInline += '</' + item.cid.toUpperCase() + '>'
                                    }
                                })*/
                            })
                            //console.log(attachmentList)
                            if (attachmentList.length > 0) {
                                await Promise.all(html).then((body) => {
                                    //console.log(body)
                                    htmlBody = body[0]
                                })
                            }
                            //htmlBody += bodyInline
                            //} catch { }

                            console.log('from: ', from)
                            console.log('to: ', to)
                            console.log('cc: ', cc)
                            console.log('subject: ', subject)
                            console.log('htmlBody: ', htmlBody.toString().substring(0, 20))

                            //send to jira to create ticket / log email

                            const emailOptions = {
                                method: 'POST',
                                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/email',
                                json: true,
                                body: {
                                    from: process.env.DEFUALTSENDER,
                                    to: 'herbert.tung@hgc.com.hk',
                                    cc: 'herbert.tung@hgc.com.hk',
                                    bcc: 'herbert.tung@hgc.com.hk',
                                    subject: subject,
                                    html: htmlBody.toString(),
                                    attachments: attachmentList
                                }
                            }
                            //console.log(attachmentList)
                            //rp(emailOptions)

                            const jiraOptions = {
                                method: 'POST',
                                uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/IBVSD/gotEmail',
                                json: true,
                                body: {
                                    info: {
                                        from: (Array.isArray(from) ? from.join(';') : ''),
                                        to: (Array.isArray(to) ? to.join(';') : ''),
                                        cc: (Array.isArray(cc) ? cc.join(';') : ''),
                                        subject,
                                        body: Base64.encode(htmlBody.toString()),
                                        attachments: attachmentList
                                    }
                                }
                            }

                            rp(jiraOptions)
                            
                            connection.addFlags(item.attributes.uid, '\ANSWERED', (err) => {
                                if (!err){
                                    connection.end()
                                }
                            })
                            

                            //connection.end()

                            //console.log(htmlBody.toString())
                            rp('http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/email/get')
                            resolve(
                                { body: htmlBody.toString() }
                            )
                        })
                        //connection.end()
                        if (!results || (Array.isArray(results) && results.length < 1)) {
                            connection.end()
                            resolve()
                        }
                    });
                });
            })
                .catch((err) => {
                    console.log(err)
                })


        } catch (exception) {
            reject(exception)
        }
    })
})

export default readNextEmail
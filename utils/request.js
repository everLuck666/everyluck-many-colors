const https = require('https');

exports.httpGet = (callback, url) => {
    https.get(url, (res)=>{
        let data = ''
        res.on('data',(chunk)=>{
            data += chunk
        })
        res.on('end',()=>{
            callback(data)
        })
    })

}
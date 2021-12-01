const { basename } = require('path')
const http = require('http')

const [BASE_URL, PORT] = process.env.AWS_LAMBDA_RUNTIME_API.split(':')

const register = async () => {
    const options = {
        method: 'POST',
        hostname: BASE_URL,
        port: PORT,
        path: '/2020-01-01/extension/register',
        headers: {
            'Content-Type': 'application/json',
            'Lambda-Extension-Name': basename(__dirname),
        },
        maxRedirects: 20,
    }

    const resHeaders = await new Promise((resolve, reject) => {
        const req = http.request(options, function (res) {
            resolve(res.headers)

            res.on('error', function (err) {
                console.error(`[aws-lambda-layer-cache/register] ${err}`)
                reject(err)
            })
        })

        req.write(
            JSON.stringify({
                events: ['SHUTDOWN'],
            })
        )

        req.end()
    })

    return resHeaders['lambda-extension-identifier']
}

const next = async (extensionId) => {
    const options = {
        method: 'GET',
        hostname: BASE_URL,
        port: PORT,
        path: '/2020-01-01/extension/event/next',
        headers: {
            'Content-Type': 'application/json',
            'Lambda-Extension-Identifier': extensionId,
        },
        maxRedirects: 20,
    }
    return await new Promise((resolve, reject) => {
        var req = http.request(options, function (res) {
            var chunks = []

            res.on('data', function (chunk) {
                chunks.push(chunk)
            })

            res.on('end', function (chunk) {
                var body = Buffer.concat(chunks)
                let result
                try {
                    result = JSON.parse(body.toString())
                } catch (error) {
                    result = body.toString()
                }
                resolve(result)
            })

            res.on('error', function (err) {
                console.error(`[aws-lambda-layer-cache/next] ${err}`)
                reject(err)
            })
        })

        req.end()
    })
}

module.exports = {
    register,
    next,
}

#!/usr/bin/env node

const Constants = require('./constants')

const AWS = require('@aws-sdk/client-secrets-manager')
const AWSSecretManager = new AWS.SecretsManager()

const fs = require('fs')
const http = require('http')
const server = http.createServer()

const CACHE_TIMEOUT = !isNaN(process.env.CACHE_TIMEOUT) ? parseInt(process.env.CACHE_TIMEOUT) : 10

const inMemoryCache = {}
let expirationDate = new Date()
let cacheConfigContent

const initCache = () => {
    if (cacheConfigContent) return
    fs.open(Constants.CACHE_CONFIG_PATH, 'r', (err) => {
        if (err && err.code === 'ENOENT') {
            console.log('Config.yaml doesnt exist so no parsing required')
            return
        }
        readFile()
    })
}

const startHttpServer = () => {
    server.on('request', processPayload)

    server.listen(Constants.LOCALHOST_PORT, () => {
        console.log('Server created Successfully on', server.address())
    })
}

const readFile = async () => {
    try {
        const fileContents = cacheConfigContent ?? fs.readFileSync(Constants.CACHE_CONFIG_PATH, 'utf8')
        const cacheConfigData = JSON.parse(fileContents)

        if (cacheConfigData === null) return

        const secretKeys = cacheConfigData.secrets_keys ?? []
        const secretRecoveryPromises = secretKeys.map(async (secretId) => {
            try {
                // Read secrets from SecretManager
                const secretResponse = await AWSSecretManager.getSecretValue({ SecretId: secretId })
                inMemoryCache[secretId] = secretResponse.SecretString
            } catch (e) {
                console.log(JSON.stringify(e))
                console.log('Error while getting secret name ' + secretId)
            }
        })

        await Promise.all(secretRecoveryPromises)

        // Set expiration date cache
        const newExpirationDate = new Date()
        newExpirationDate.setMinutes(newExpirationDate.getMinutes() + CACHE_TIMEOUT)
        expirationDate = newExpirationDate
    } catch (e) {
        console.error(e)
    }
}

const processPayload = async (req, res) => {
    if (new Date().getTime() > expirationDate.getTime()) {
        await readFile()
        console.log('Cache update is complete')
    }

    const baseURL = req.protocol + '://' + req.headers.host + '/'
    const reqUrl = new URL(req.url, baseURL)

    const secretRequested = reqUrl.pathname.substr(1)
    const secretCache = inMemoryCache[secretRequested]

    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ $secretRequested: secretCache }))
}

module.exports = {
    initCache,
    startHttpServer,
}

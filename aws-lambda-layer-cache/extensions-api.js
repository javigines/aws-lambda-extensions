const fetch = require('node-fetch')
const { basename } = require('path')

const Constants = require('./constants')
const BASE_URL = Constants.EXTENSION_BASE_URL

const register = async () => {
    const res = await fetch(`${BASE_URL}/register`, {
        method: 'post',
        body: JSON.stringify({
            events: ['SHUTDOWN'],
        }),
        headers: {
            'Content-Type': 'application/json',
            'Lambda-Extension-Name': basename(__dirname),
        },
    })

    if (!res.ok) {
        console.error('register failed', await res.text())
    }

    return res.headers.get('lambda-extension-identifier')
}

const next = async (extensionId) => {
    const res = await fetch(`${BASE_URL}/event/next`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'Lambda-Extension-Identifier': extensionId,
        },
    })

    if (!res.ok) {
        console.error('next failed', await res.text())
        return null
    }

    return await res.json()
}

module.exports = {
    register,
    next,
}

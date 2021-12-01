const fetch = require('node-fetch');
const {basename} = require('path');

const Constants = require('./constants')
const BASE_URL = Constants.EXTENSION_BASE_URL

async function register() {
    const res = await fetch(`${BASE_URL}/register`, {
        method: 'post',
        body: JSON.stringify({
            'events': [
                'SHUTDOWN'
            ],
        }),
        headers: {
            'Content-Type': 'application/json',
            'Lambda-Extension-Name': basename(__dirname),
        }
    });

    if (!res.ok) {
        console.error('register failed', await res.text());
    }

    return res.headers.get('lambda-extension-identifier');
}

async function next(extensionId) {
    const res = await fetch(`${BASE_URL}/event/next`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'Lambda-Extension-Identifier': extensionId,
        }
    });

    if (!res.ok) {
        console.error('next failed', await res.text());
        return null;
    }

    return await res.json();
}

module.exports = {
    register,
    next
};

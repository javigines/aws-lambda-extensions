#!/usr/bin/env node
const ExtensionsAPI = require('./extensions-api')
const SecretCaches = require('./secrets')

const EventType = {
    SHUTDOWN: 'SHUTDOWN',
}

const handleShutdown = (event) => {
    console.log('Shutting down the container')
    process.exit(0)
}

const main = async () => {
    process.on('SIGINT', () => handleShutdown('SIGINT'))
    process.on('SIGTERM', () => handleShutdown('SIGTERM'))

    const extensionId = await ExtensionsAPI.register()

    // execute extensions logic

    SecretCaches.initCache()
    SecretCaches.startHttpServer()

    while (true) {
        const event = await ExtensionsAPI.next(extensionId)
        switch (event.eventType) {
            case EventType.SHUTDOWN:
                handleShutdown(event)
                break
            default:
                throw new Error('unknown event: ' + event.eventType)
        }
    }
}

main()

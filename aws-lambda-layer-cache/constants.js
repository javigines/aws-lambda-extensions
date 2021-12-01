module.exports = Object.freeze({
    LOCALHOST_PORT: !isNaN(process.env.LAMBDA_LAYER_CACHE_PORT) ? parseInt(process.env.LAMBDA_LAYER_CACHE_PORT) : 8080,
    CACHE_CONFIG_PATH: process.env.LAMBDA_LAYER_CACHE_CONFIG_PATH ?? '/var/task/config.json',
})

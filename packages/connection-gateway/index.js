const GuacamoleLite = require('./src/Server');
const { createLogger, transports, format } = require('winston');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { combine, splat, timestamp, printf } = format;

const PORT = process.env.PORT || 8080;
// const CRYPT_SECRET = process.env.CRYPT_SECRET; // 32 bytes for AES-256
const CRYPT_CYPHER = 'AES-256-CBC';
const GUACD_HOST = '127.0.0.1';
const GUACD_PORT = 4822;
const USER_DRIVE_ROOT = '/tmp/guacd-drives';

const loggerFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message} `;
    if (metadata) {
        msg += JSON.stringify(metadata);
    }
    return msg;
});

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(format.colorize(), splat(), timestamp(), loggerFormat),
    transports: [new transports.Console()],
});

const getGuacamoleCypherKey = async () => {
    const ssmClient = new SSMClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN,
        },
    });
    const parameterName = process.env.VLC_GUACAMOLE_CYPHER_KEY_PARAMETER_NAME;

    logger.info(`[GUACWS] Getting Guacamole cypher key from SSM parameter ${parameterName}`);

    const { Parameter } = await ssmClient.send(
        new GetParameterCommand({
            Name: parameterName,
        }),
    );

    return Parameter.Value;
};

function start(cryptKey, cryptCypher, websocketPort, guacdHost, guacdPort) {
    logger.info('[GUACWS] Starting Server');

    if (!cryptKey || cryptKey.length === 0) {
        logger.error('[GUACWS] No cypher key key specified');
        return;
    }

    const websocketOptions = {
        port: websocketPort,
    };

    const guacdOptions = {
        host: guacdHost,
        port: guacdPort,
    };

    const clientOptions = {
        crypt: {
            cypher: cryptCypher,
            key: cryptKey,
        },
    };

    const callbacks = {
        processConnectionSettings: function (settings, callback) {
            if (settings.userFolder) {
                settings.connection['drive-path'] =
                    USER_DRIVE_ROOT + '/user_' + settings.userFolder;
            }

            callback(null, settings);
        },
    };

    logger.info('[GUACWS] WebSocket on ws://0.0.0.0:' + websocketPort);
    logger.info('[GUACWS] GuacD host on ' + guacdHost + ':' + guacdPort);
    return new GuacamoleLite(logger, websocketOptions, guacdOptions, clientOptions, callbacks);
}

getGuacamoleCypherKey()
    .then((CRYPT_SECRET) => {
        const server = start(CRYPT_SECRET, CRYPT_CYPHER, PORT, GUACD_HOST, GUACD_PORT);
        if (server) {
            logger.info('[GUACWS] WebSocket Tunnel running on ws://0.0.0.0:' + PORT);
        } else {
            logger.error('[GUACWS] Failed to start WebSocket Tunnel');
        }
    })
    .catch((err) => {
        logger.error('[GUACWS] Failed to get Guacamole cypher key from SSM');
        logger.error(err);
    });

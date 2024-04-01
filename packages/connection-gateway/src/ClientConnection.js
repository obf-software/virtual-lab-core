const Url = require('url');
const DeepExtend = require('deep-extend');
const Moment = require('moment');

const GuacdClient = require('./GuacdClient.js');
const Crypt = require('./Crypt.js');

class ClientConnection {
    /**
     * @param {Server} server
     * @param {number} connectionId
     * @param {WebSocket.WebSocket} webSocket
     * @param req
     * @param {EventPublisher} eventPublisher
     */
    constructor(server, connectionId, webSocket, req, eventPublisher) {
        this.STATE_OPEN = 1;
        this.STATE_CLOSED = 2;

        this.state = this.STATE_OPEN;

        this.server = server;
        this.logger = server.logger.child({ connectionId: this.connectionId });
        this.connectionId = connectionId;
        this.webSocket = webSocket;
        this.query = Url.parse(req.url, true).query;
        this.lastActivity = Date.now();
        this.activityCheckInterval = null;
        this.eventPublisher = eventPublisher;

        this.logger.verbose('Client connection open');

        try {
            this.connectionSettings = this.decryptToken();
            this.connectionType = this.connectionSettings.connection.type;
            this.connectionSettings.connection = this.mergeConnectionOptions();
        } catch (error) {
            this.logger.error('Token validation failed');
            this.close(error);
            return;
        }

        server.callbacks.processConnectionSettings(this.connectionSettings, (err, settings) => {
            if (err) {
                return this.close(err);
            }

            this.connectionSettings = settings;

            this.logger.verbose('Opening guacd connection');

            this.guacdClient = new GuacdClient(server, this);

            webSocket.on('close', this.close.bind(this));
            webSocket.on('message', this.processReceivedMessage.bind(this));

            if (server.clientOptions.maxInactivityTime > 0) {
                this.activityCheckInterval = setInterval(this.checkActivity.bind(this), 1000);
            }
        });

        this.eventPublisher.publishConnectionStartedEvent(this.query.virtualId);
    }

    decryptToken() {
        const crypt = new Crypt(this.server);

        const encrypted = this.query.token;
        delete this.query.token;

        return crypt.decrypt(encrypted);
    }

    close(closeCode, reason) {
        if (this.state === this.STATE_CLOSED) {
            return;
        }

        if (this.activityCheckInterval) {
            clearInterval(this.activityCheckInterval);
        }

        if (closeCode) {
            this.logger.error('Closing connection with error: ', closeCode, reason);
        }

        if (this.guacdClient) {
            this.guacdClient.close();
        }

        this.webSocket.removeAllListeners('close');
        this.webSocket.close();
        this.server.activeConnections.delete(this.connectionId);

        this.state = this.STATE_CLOSED;

        this.logger.verbose('Client connection closed');

        this.eventPublisher.publishConnectionEndedEvent(this.query.virtualId);
    }

    error(error) {
        this.server.emit('error', this, error);
        this.close(error);
    }

    processReceivedMessage(message) {
        this.lastActivity = Date.now();
        this.guacdClient.send(message);
    }

    send(message) {
        if (this.state === this.STATE_CLOSED) {
            return;
        }

        this.logger.debug('>>>G2W> ' + message + '###');
        this.webSocket.send(message, { binary: false, mask: false }, (error) => {
            if (error) {
                this.close(error);
            }
        });
    }

    mergeConnectionOptions() {
        let unencryptedConnectionSettings = {};

        Object.keys(this.query)
            .filter((key) =>
                this.server.clientOptions.allowedUnencryptedConnectionSettings[
                    this.connectionType
                ].includes(key),
            )
            .forEach((key) => (unencryptedConnectionSettings[key] = this.query[key]));

        let compiledSettings = {};

        DeepExtend(
            compiledSettings,
            this.server.clientOptions.connectionDefaultSettings[this.connectionType],
            this.connectionSettings.connection.settings,
            unencryptedConnectionSettings,
        );

        return compiledSettings;
    }

    checkActivity() {
        if (Date.now() > this.lastActivity + this.server.clientOptions.maxInactivityTime) {
            this.close(new Error('WS was inactive for too long'));
        }
    }
}

module.exports = ClientConnection;

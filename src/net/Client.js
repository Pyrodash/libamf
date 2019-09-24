'use strict';

const url     = require('url');
const HTTP    = require('http');
const HTTPS   = require('https');

const Packet  = require('./Packet');
const Message = require('./Message');

class Client {
    /**
     * Creates a new AMF client
     * @param {Object} opts 
     */
    constructor(opts = {}) {
        /**
         * URL for the AMF endpoint
         * @type {String}
         */
        this.url = opts.url;

        /**
         * @type {Object}
         */
        this.responses = {};
    }

    /**
     * This doesn't actually connect since an AMF request is just an HTTP request.
     * @param {String} url - URL for the AMF endpoint
     */
    connect(url) {
        this.url = url;
    }

    /**
     * 
     * @param {String} command 
     * @param  {...any} args 
     * @returns {Promise}
     */
    call(command, ...args) {
        return new Promise((resolve, reject) => {
            var cb;

            if(typeof args[args.length - 1] === 'function') {
                cb = args.pop();
            }

            if(!this.packet) {
                this.packet = new Packet();
            }

            var responseURI = '/' + (this.packet.messages.length + 1);

            this.packet.messages.push(new Message({
                targetURI: command,
                responseURI,
                content: args
            }));

            this.responses[responseURI] = {resolve, reject};
            
            if(this.sendTimer) {
                clearTimeout(this.sendTimer);
            }

            this.sendTimer = setTimeout(() => {
                this.send();
            }, 0);
        });
    }

    /**
     * @private
     */
    send() {
        const packet = this.packet;
        const responses = this.responses;

        this.packet = null;
        this.responses = {};

        const raw = packet.write();

        const parsedURL = url.parse(this.url);
        const http = parsedURL.protocol === 'http:' ? HTTP : HTTPS;
        const options = {
            hostname: parsedURL.hostname,
            port: parsedURL.port,
            path: parsedURL.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-amf',
                'Content-Length': raw.length
            }
        };

        const req = http.request(options, res => {
            const data = [];

            res.on('data', d => {
                data.push(d);
            });

            res.on('close', () => {
                const buf = Buffer.concat(data);

                Packet.read(buf).then(packet => {
                    for(var i in responses) {
                        const response = responses[i];
                        const message = packet.messages.find(message => message.targetURI.startsWith(i))

                        if(message) {
                            response.resolve(message.content);
                        } else {
                            response.reject(new Error('Message ' + i.substr(1) + ' returned nothing.'));
                        }
                    }
                });
            });
        });

        req.on('error', err => {
            reject(err);
        });

        req.write(raw);
        req.end();
    }
}

module.exports = Client;
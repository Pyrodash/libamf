'use strict';

const express      = require('express');
const bodyParser   = require('body-parser');

const Packet       = require('./Packet');
const EventEmitter = require('events');

class Server extends EventEmitter {
    /**
     * Create an AMF server
     * @param {Object} opts
     */
    constructor(opts = {}) {
        super();
        
        /**
         * @type {Number}
         */
        this.port = opts.port || 8080;

        /**
         * @type {String}
         */
        this.path = opts.path || '/';

        /**
         * XML crossdomain
         * @type {String}
         */
        this.crossdomain = opts.crossdomain || '<cross-domain-policy><allow-access-from domain="*" to-ports="*" /></cross-domain-policy>';

        /**
         * @type {Object}
         */
        this.services = {};

        this.init();
    }

    init() {
        this.app = express();

        this.app.use(bodyParser.raw({
            type: 'application/x-amf'
        }));

        this.app.get('/crossdomain.xml', (req, res) => {
            res.set('Content-Type', 'text/xml');
            res.send(this.crossdomain);
        });

        this.app.post(this.path, this.processPacket.bind(this));
    }

    /**
     * @param {Number=} port
     * @param {Function=} cb
     */
    listen(port, cb) {
        return new Promise((resolve, reject) => {
            if(!cb && typeof port === 'function') {
                cb = port;
                port = this.port;
            }

            this.port = port;
            this.app.listen(port, () => {
                if(cb) {
                    cb();
                }

                resolve();
            });
        });
    }

    /**
     * @param {Service} service 
     */
    registerService(service) {
        this.services[service.name] = service;
    }

    processPacket(req, res) {
        Packet.read(req, res).then(packet => {
            this.emit('data', packet);
            
            for(const message of packet.messages) {
                const args = message.targetURI.split('.');
                const method = args.pop();
                const service = this.services[args.join('.')];

                if(service) {
                    service.process(method, message, packet);
                }
            }
        });
    }
}


module.exports = Server;
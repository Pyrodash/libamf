'use strict';

const packets = new WeakMap();

class Message {
    constructor(...args) {
        var targetURI;
        var responseURI;
        var content;
        var packet;

        if (typeof args[0] !== 'object') {
            targetURI = args.shift();
            responseURI = args.shift();
            content = args.shift();
            packet = args.shift();
        } else {
            const opts = args.shift();

            targetURI = opts.targetURI;
            responseURI = opts.responseURI;
            content = opts.content;
            packet = opts.packet;
        }

        /**
         * @type {String}
         */
        this.targetURI = targetURI;

        /**
         * @type {String}
         */
        this.responseURI = responseURI;

        /**
         * @type {*}
         */
        this.content = content;

        packets.set(this, packet);
    }

    get packet() {
        return packets.get(this);
    }

    resolveURI(uri = '') {
        uri = uri.charAt(0) === '/' ? uri.substr(1) : uri;

        return this.responseURI + (uri.length > 0 ? '/' + uri : '');
    }

    respond(data, isStatus) {
        if(this.packet) {
            return this.packet.respond(data, isStatus, this);
        } else {
            throw new Error('You cannot respond to this message.');
        }
    }
}

module.exports = Message;
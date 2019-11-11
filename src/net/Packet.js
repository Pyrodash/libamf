'use strict';

const express   = require('express');
const ByteArray = require('bytearray-node');

const AMF       = require('../');
const Header    = require('./Header');
const Message   = require('./Message');

const Helper    = require('./Helper');
const Data      = new WeakMap();

const UNKNOWN_CONTENT_LENGTH = 1;

class Packet {
    /**
     * 
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    constructor(req, res) {
        Data.set(this, {});

        /**
         * @type {express.Request}
         */
        this.request = req;
        
        /**
         * @type {express.Response}
         */
        this.response = res;

        /**
         * AMF encoding version (0 or 3)
         * @type {Number}
         */
        this.version = 3;

        /**
         * List of headers sent in a packet
         * @type {Array<Header>}
         */
        this.headers = [];

        /**
         * List of messages sent in a packet
         * @type {Array<Message>}
         */
        this.messages = [];

        /**
         * @type {Packet}
         */
        this.res = null;
    }

    get request() {
        return Data.get(this).request;
    }

    set request(req) {
        const data = Data.get(this);
        
        return data.request = req;
    }

    get response() {
        return Data.get(this).response;
    }

    set response(req) {
        const data = Data.get(this);

        return data.response = req;
    }

    read(buffer, cb) {
        return new Promise((resolve, reject) => {
            if(typeof buffer === 'function') {
                cb = buffer;
                buffer = null;
            }

            if(!buffer) {
                buffer = this.request.body;
            }

            const amf = new AMF.AMF0(AMF);
            amf.byteArray = new ByteArray(buffer);
            
            this.version = amf.readUnsignedShort();

            if(this.version !== 0 && this.version !== 3) {
                return reject(new Error('Malformed AMF packet.'));
            }


            const headerCount = amf.readUnsignedShort();

            for(var i = 0; i < headerCount; i++) {
                amf.resetReferences();

                const name = amf.readUTF();
                const required = amf.readBoolean();
                const length = amf.readUnsignedInt();

                const type = amf.readByte();
                const content = amf.read(type);

                this.headers.push(new Header({
                    name,
                    required,
                    content
                }));
            }

            const messageCount = amf.readUnsignedShort();
            
            var lastLength = 0;

            for(var i = 0; i < messageCount; i++) {
                amf.resetReferences();

                const targetURI = amf.readUTF();
                const responseURI = amf.readUTF();

                const length = amf.readUnsignedInt();
                const content = amf.read();

                this.messages.push(new Message({
                    targetURI,
                    responseURI,
                    content,
                    packet: this
                }));

                lastLength = length;
            }

            if(cb) {
                cb(this);
            }

            resolve(this);
        });
    }

    write() {
        const res = new AMF.AMF0();
        
        if(this.version === 3) {
            res.avmPlus = true;
        }

        res.writeShort(this.version);
        res.writeUnsignedShort(this.headers.length);

        for(var i = 0; i < this.headers.length; i++) {
            res.resetReferences();

            const header = this.headers[i];

            res.writeUTF(header.name);
            res.writeBoolean(header.required, false);
            res.writeUnsignedInt(UNKNOWN_CONTENT_LENGTH);
            res.write(header.content);
        }

        res.writeUnsignedShort(this.messages.length);

        for(var i = 0; i < this.messages.length; i++) {
            res.resetReferences();

            const message = this.messages[i];

            res.writeUTF(message.targetURI);
            res.writeUTF(message.responseURI);
            res.writeUnsignedInt(UNKNOWN_CONTENT_LENGTH);
            res.write(message.content);
        }

        const buffer = res.byteArray.buffer;

        if(this.response) {
            this.response.set('Content-Type', 'application/x-amf');
            this.response.set('Content-Length', buffer.length);
            this.response.end(buffer);

            this.response = null;
        } else {
            return buffer;
        }
    }

    /**
     * @param {Message|Array<Message>|*} data - Data to send back
     * @param {Boolean} [isStatus=false] - Whether or not this message's targetURI will be onStatus
     * @param {Message=} parentMessage
     */
    respond(data, isStatus = false, parentMessage) {
        if(!this.res) {
            this.res = new Packet(this.request, this.response);
        }

        if(!parentMessage) {
            parentMessage = this.messages[0];
        }

        const packet = this.res;
        packet.version = 3;

        if(data instanceof Message) {
            packet.messages.push(data);
        } else if(Helper.isPacketArray(data)) {
            packet.messages.push(...data);
        } else {
            const isBaseObject = data && data.targetURI !== undefined;
            const targetURI = isStatus || data && data.isStatus ? parentMessage.resolveURI('onStatus') : parentMessage.resolveURI('onResult');
            const responseURI = parentMessage.resolveURI();

            if(data && typeof data === 'object') {
                data.isStatus = null;
                delete data.isStatus;
            }

            const message = new Message(isBaseObject ? data : {
                targetURI: targetURI,
                responseURI: responseURI,
                content: data
            });

            packet.messages.push(message);

            if(isBaseObject && data.headers) {
                packet.headers = data.headers;
            }
        }

        if(packet.sendTimer) {
            clearTimeout(packet.sendTimer);
        }

        packet.sendTimer = setTimeout(() => {
            packet.sendTimer = null;
            packet.write();
        }, 0);
    }

    /**
     * @param {Packet} packet 
     */
    send(packet) {
        packet.request = this.request;
        packet.response = this.response;

        return packet.write();
    }

    /**
     * @param {Message|Array<Message>|*} data - Data to send back
     */
    status(data) {
        return this.respond(data, true);
    }
}

Packet.read = function(...args) {
    var buf;

    if(args[0] instanceof Buffer) {
        buf = args.shift();
    }

    const packet = new Packet(...args);

    return packet.read(buf);
};

Packet.create = function(data, ...args) {
    if(typeof args[0] === 'boolean') {
        const isStatus = args.shift();
    }

    const packet = new Packet(...args);

    return packet.respond(data, isStatus);
};

module.exports = Packet;
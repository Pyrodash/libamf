'use strict';

const path    = require('path');
const Helper  = require('./Helper');

const Message = require('./Message');
const Packet  = require('./Packet');

class Service {
    constructor(name) {
        if(typeof name !== 'string') {
            name = null;
        }

        this.path = Helper.getPath(this);
        this.name = Helper.formatServiceName(name || path.basename(this.path));

        this.methods = {};
        this.bannedMethods = [];
    }

    /**
     * Registers a method to allow it to be used since JavaScript does not have typed functions so we have no way of determining what functions should and shouldn't be usable.
     * @param {String} name - Name of the method.
     * @param {Function|String} method - Method to be registered. This can be a function or the name of a function inside this class instance.
     */
    register(name, method) {
        if(!name) {
            throw new Error('Tried to register a method ' + method + ' without a name.');
        }

        if(typeof method === 'string' && typeof this[method] === 'function') {
            method = this[method].bind(this);
        }

        if(typeof method === 'function') {
            this.methods[name] = method;
        } else {
            throw new Error('Tried to register an invalid method: ' + method);
        }
    }

    /**
     * Processes a message.
     * @param {String} method 
     * @param {Message} message 
     * @param {Packet} packet 
     */
    process(method, message, packet) {
        var handler;

        if(this.requireRegistration || Service.RequireRegistration) {
            handler = this.methods[name];
        } else {
            if(!method.startsWith('_') && !Service.BannedMethods.includes(method) && (!this.bannedMethods || !this.bannedMethods.includes(method))) {
                handler = typeof this[method] === 'function' ? this[method].bind(this) : null;
            }
        }

        if(handler) {
            handler(...message.content, message);
        } else {
            packet.status(new Error('Method ' + method + ' not found.'));
        }
    }
}

Service.BannedMethods = ['constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toString', 'valueOf', 'toLocaleString']; // Ban default object methods
Service.RequireRegistration = true;
Service.ForceSuffix = true;

module.exports = Service;
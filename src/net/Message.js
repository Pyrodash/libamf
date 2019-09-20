'use strict';

class Message {
    constructor(...args) {
        var targetURI;
        var responseURI;
        var content;

        if (typeof args[0] !== 'object') {
            targetURI = args.shift();
            responseURI = args.shift();
            content = args.shift();
        } else {
            const opts = args.shift();

            targetURI = opts.targetURI;
            responseURI = opts.responseURI;
            content = opts.content;
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
    }
}

module.exports = Message;
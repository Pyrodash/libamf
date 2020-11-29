'use strict';

class Header {
    constructor(...args) {
        var name;
        var required;
        var content;

        if(typeof args[0] !== 'object') {
            name = args.shift();
            required = args.shift();
            content = args.shift();
        } else {
            const opts = args.shift();
            
            name = opts.name;
            required = opts.required;
            content = opts.content;
        }

        /**
         * @type {String}
         */
        this.name = name;

        /**
         * If a header is has the required flag set to true, the flag will instruct the
           endpoint to abort and generate an error if the header is not understood.
           If a header is sent to the Flash Player with required set to true and the
           NetConnection instance's client object does not have a method to handle the header, then
           the Flash Player will invoke the onStatus handler on the NetConnection object.
         * @type {Boolean}
         */
        this.required = required || false;

        /**
         * @type {*}
         */
        this.content = content;
    }
}

module.exports = Header;
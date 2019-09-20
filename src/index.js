'use strict';

const {convertToBuffer} = require('./utils/Utils');

const AMF0 = require('./amf/AMF0');
const AMF3 = require('./amf/AMF3');

const classMap = {
    'flex.messaging.io.ArrayCollection': require('./amf/flash/flex/ArrayCollection')
};

class AMF {
    constructor() {
        this.ENCODING = {
            AMF0: 0,
            AMF3: 3
        };

        this.exportClasses();
    }

    get classMap() {
        return classMap;
    }

    /**
     * @private
     */
    exportClasses() {
        for (var i in classMap) {
            const cl = classMap[i];
            const name = cl.constructor.name;
            
            this[name] = cl;
        }

        this.AMF0 = AMF0;
        this.AMF3 = AMF3;
    }

    /**
     * Register an alias for a class/typed object.
     * @param {String=} name 
     * @param {Function} cls 
     */
    registerClassAlias(name, cls) {
        if(typeof name === 'function' && !cls) {
            cls = name;
            name = cls.constructor.name;
        }

        classMap[name] = cls;
    }

    /**
     * @param {String} action 
     * @param {*} data 
     * @param {Number} [encoding=0] - AMF.ENCODING.AMF0 or AMF.ENCODING.AMF3
     * @private
     */
    run(action, data, encoding) {
        const handler = encoding == 3 ? new AMF3(this) : new AMF0(this);
        var method;

        handler.reset();

        const args = [];

        switch(action) {
            case 'serializer':
            case 'serialize':
                method = 'write';
                
                args.push(data);
            break;
            default:
                method = 'read';

                if(data.buffer && (!(data instanceof Buffer))) {
                    handler.position = data.position;
                    handler.buffer = convertToBuffer(data.buffer);
                } else {
                    handler.buffer = convertToBuffer(data);
                }
        }

        return handler[method](...args);
    }

    /**
     * Serialize data using AMF0 or AMF3
     * @param {*} data 
     * @param {Number} encoding - AMF.ENCODING.AMF0 or AMF.ENCODING.AMF3
     * @returns {Buffer}
     */
    serialize(data, encoding = 0) {
        return this.run('serializer', data, encoding);
    }

    /**
    * Deserialize data using AMF0 or AMF3
    * @param {*} data
    * @param {Number} encoding - AMF.ENCODING.AMF0 or AMF.ENCODING.AMF3
    * @returns {*}
    */
    deserialize(data, encoding = 0) {
        return this.run('deserializer', data, encoding);
    }
}

module.exports = new AMF;

module.exports.Dictionary = require('./amf/flash/Dictionary');
module.exports.Vector = require('./amf/flash/Vector');
module.exports.ByteArray = require('bytearray-node');

module.exports.Packet = require('./net/Packet');
module.exports.Header = require('./net/Header');
module.exports.Message = require('./net/Message');
module.exports.Service = require('./net/Service');
module.exports.Server = require('./net/Server');
module.exports.Client = require('./net/Client');

// Is this a horrible solution for cyclic dependencies? If you know a better solution please submit a PR
'use strict';

const ByteArray = require('bytearray-node');
const AMF       = require('../');

class AbstractAMF extends ByteArray {
    constructor(core) {
        super();

        /**
         * @type {AMF}
         */
        this.core = core || AMF;
    }

    /**
     * @param {Function} cls
     */
    getClassName(cls) {
        if(typeof cls === 'object') {
            cls = cls.constructor;
        }

        for(var i in this.core.classMap) {
            const lCls = this.core.classMap[i];

            if(lCls === cls) {
                return i;
            }
        }

        return cls.name;
    }

    /**
     * @param {String} name 
     */
    getClass(name) {
        const cls = this.core.classMap[name];

        if(!cls) {
            switch(name) {
                case 'String': return String;
            }
        }

        return cls;
    }
}

module.exports = AbstractAMF;
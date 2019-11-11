'use strict';

const ByteArray = require('bytearray-node').Proxy;
const AMF       = require('../');

const utils     = require('../utils/Utils');
const methods   = new WeakMap();

class AbstractAMF {
    constructor(core) {
        /**
         * @type {AMF}
         */
        this.core = core || AMF;

        if(!methods.get(this.constructor)) {
            methods.set(this.constructor, utils.getAllMethods(this));
        }
    }

    set byteArray(ba) {
        if(ba) {
            const locMethods = utils.getAllMethods(ba);
            const originalMethods = methods.get(this.constructor);

            for(var i in locMethods) {
                var methodName = locMethods[i];
                
                if(originalMethods.includes(methodName)) {
                    this['super_' + methodName] = ba[methodName].bind(ba);
                } else {
                    this[methodName] = ba[methodName].bind(ba);
                }
            }
        }

        this.__byteArray = ba;
    }

    get byteArray() {
        return this.__byteArray;
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
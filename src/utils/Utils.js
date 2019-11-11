const fs   = require('fs');
const util = require('util');

/**
 * Construct a class using variable string
 * @param {String} className
 * @exports
 * @returns {Object}
 */
exports.constructClass = (className) => {
    class Dummy {
        constructor() {}
    }

    return new ({ [className]: class extends Dummy { } })[className]()
};

/**
 * A function to convert to a buffer when needed
 * @param {Buffer|Array|String} buffer
 * @exports
 * @returns {Buffer}
 */
exports.convertToBuffer = (buffer) => {
    return Buffer.isBuffer(buffer)
        ? buffer
        : Array.isArray(buffer)
            ? Buffer.from(buffer)
            : Buffer.from(buffer.replace(/ /g, ''), 'hex');
};

exports.isAssociativeArray = data => data instanceof Array && Object.keys(data).length !== data.length;

exports.getConstructor = cls => cls.constructor.name !== 'Function' ? cls.constructor : cls;

exports.getAllMethods = function (obj) {
    function isGetter(obj, prop) {
        return !!obj.__lookupGetter__(prop)
    }

    let keys = []
    let topObject = obj

    const onlyOriginalMethods = (p, i, arr) => {
        return !isGetter(topObject, p) &&
            typeof topObject[p] === 'function' &&
            p !== 'constructor' &&
            (i === 0 || p !== arr[i - 1]) &&
            keys.indexOf(p) === -1
    }

    do {
        const l = Object.getOwnPropertyNames(obj)
            .sort()
            .filter(onlyOriginalMethods)
        keys = keys.concat(l)

        // walk-up the prototype chain
        obj = Object.getPrototypeOf(obj)
    } while (
        // not the the Object prototype methods (hasOwnProperty, etc...)
        obj && Object.getPrototypeOf(obj)
    )

    return keys
};
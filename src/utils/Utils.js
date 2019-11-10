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

exports.readFileAsync = util.promisify(fs.readFile);
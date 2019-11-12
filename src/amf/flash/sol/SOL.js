'use strict';

/* Credits to Gabriel Mariani for SOL [https://github.com/gmariani] */
/* Warning: Not tested well enough */

const fs        = require('fs');
const ByteArray = require('bytearray-node');

const AMF       = require('../../../');
const Markers   = require('../../Markers').SOL;

const Header    = require('./Header');
const LSO       = require('./LSO');
const FilePath  = require('./FilePath');

const SOLTraits = new WeakMap();

class SOL {
    constructor() {
        this.traits = {};
    }

    set traits(traits) {
        return SOLTraits.set(this, traits);
    }

    get traits() {
        return SOLTraits.get(this);
    }

    set amf0(amf0) {
        return this.traits.amf0 = amf0;
    }

    get amf0() {
        return this.traits.amf0;
    }

    set amf3(amf3) {
        return this.traits.amf3 = amf3;
    }

    get amf3() {
        return this.traits.amf3;
    }

    /**
     * @returns {void}
     */
    reset() {
        this.amf0 = new AMF.AMF0(AMF);
        this.amf3 = new AMF.AMF3(AMF);
    }

    set byteArray(ba) {
        //ba.endian = false;
        this.traits.byteArray = ba;

        this.amf0.byteArray = ba;
        this.amf3.byteArray = ba;
        
        return ba;
    }

    get byteArray() {
        return this.traits.byteArray;
    }

    /**
     * Parses SOL data
     * @param {ByteArray|Buffer} data 
     */
    parse(data) {
        if(!data) {
            data = this.data || this.byteArray;
        }

        if(!(data instanceof ByteArray)) {
            data = new ByteArray(data);
            //data.endian = false;
        }

        this.reset();
        this.readTags(data);
    }

    readTags(data) {
        this.byteArray = data;

        var start = data.position;
        var header;

        while(header = this.readHeader()) {
            var method = this['read' + header.name];

            if(typeof method === 'function') {
                method = method.bind(this);
                const tag = method(header);

                switch(header.type) {
                    case Markers.LSO:
                        this.header = tag.header;
                        this.body = tag.body;
                        this.filename = tag.filename;
                        this.version = tag.version;
                    break;
                    case Markers.FilePath:
                        this.flex = tag;
                    break;
                }

                data.position += (header.tagLength - (data.position - start));
            } else {
                data.position += header.tagLength;
            }

            if(data.bytesAvailable === 0) {
                break;
            }

            start = data.position;
            header = this.readHeader();
        }
    }

    readHeader() {
        return new Header().read(this);
    }

    readLSO(header) {
        return new LSO(header).read(this);
    }

    readFilePath(header) {
        return new FilePath(header).read(this);
    }
}

/**
 * @param data {ByteArray|Buffer}
 */
SOL.read = function(data) {
    const sol = new SOL();
    sol.parse(data);

    return sol;
};
/**
 * @param path {String}
 */
SOL.readFile = function(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if(err) {
                reject(err);
            } else {
                resolve(this.read(data));
            }
        })
    });
};
/**
 * @param path {String} - Target filepath
 * @param data {LSO|FilePath|Object} - Data to be written
 */
SOL.writeFile = function(path, data) {
    if(!(data instanceof LSO || data instanceof FilePath)) {
        data = new LSO(data);
    }

    return new Promise((resolve, reject) => {
        fs.writeFile(path, data.write(), (err) => {
           if(err)  {
               reject(err);
           } else {
               resolve();
           }
        });
    });
};
/**
 * @param data {ByteArray|Buffer}
 */
SOL.parse = function(data) {
    return this.read(data);
};

module.exports = SOL;
module.exports.Header = Header;
module.exports.LSO = LSO;
module.exports.FilePath = FilePath;
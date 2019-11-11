'use strict';

const Utils       = require('../utils/Utils');
const Markers     = require('./Markers').AMF0;

const AbstractAMF = require('./AbstractAMF');
const ByteArray   = require('bytearray-node');

const AMF3        = require('./AMF3');
const XML         = require('./flash/XML');

class AMF0 extends AbstractAMF {
    constructor(core) {
        super(core);

        /**
         * An array containing objects that are used as references. 
         * @type {Array}
         */
        this.references = null;

        /**
         * Whether or not objects will be delegated to AMF3 format
         * @type {Boolean}
         */
        this.avmPlus = null;

        /**
         * @type {AMF3}
         */
        this.amf3 = null;

        /**
         * @type {ByteArray}
         */
        this.byteArray = null;

        this.reset();
    }

    get markers() {
        return Markers;
    }

    resetReferences() {
        this.references = [];

        if(this.amf3) {
            this.amf3.resetReferences();
        }
    }

    reset() {
        this.avmPlus = false;
        this.resetReferences();
        
        this.amf3 = new AMF3(this.core);

        if(this.byteArray) {
            this.byteArray.reset();
        } else {
            this.byteArray = new ByteArray();
        }
    }

    read(marker) {
        if(!marker) {
            marker = this.readByte();
        }

        switch(marker) {
            case Markers.NULL: return null; break
            case Markers.UNDEFINED: return undefined; break
            case Markers.STRING: return this.readString(); break
            case Markers.LONG_STRING: return this.readString(true); break
            case Markers.NUMBER: return this.readDouble(); break
            case Markers.BOOLEAN: return this.readBoolean(); break
            case Markers.REFERENCE: return this.readReference(); break
            case Markers.STRICT_ARRAY: return this.readStrictArray(); break
            case Markers.ECMA_ARRAY: return this.readECMAArray(); break
            case Markers.OBJECT: return this.readObject(); break
            case Markers.TYPED_OBJECT: return this.readObject(true); break
            case Markers.DATE: return this.readDate(); break
            case Markers.XML_DOC: return this.readXML(); break
            case Markers.AVMPLUS: return this.readAVMPlus(); break
        }
    }

    /**
     * @param {Boolean} long - Whether or not the string being read is a long string
     */
    readString(long = false) {
        const length = long ? this.readUnsignedInt() : this.readUnsignedShort();

        return this.readUTFBytes(length);
    }

    readReference() {
        const index = this.readUnsignedShort();
        
        return this.references[index];
    }

    /**
     * @returns {Array}
     */
    readStrictArray() {
        const length = this.readUnsignedInt();
        const arr = [];

        this.references.push(arr);

        for(var i = 0; i < length; i++) {
            arr.push(this.read());
        }

        return arr;
    }

    /**
     * @returns {Map}
     */
    readECMAArray() {
        const length = this.readUnsignedShort();
        const map = new Map();

        this.references.push(map);

        for(var i = 0; i < length; i++) {
            const key = this.readUTF();
            const value = this.read();

            map.set(key, value);
        }

        return map;
    }

    /**
     * @param {Boolean} isTyped - Whether or not the object is a typed one (class instance)
     * @returns {Object}
     */
    readObject(isTyped = false) {
        var name;
        var obj = {};

        if(isTyped) {
            name = this.readUTF();
            const cls = this.getClass(name);

            obj = cls ? new cls : Utils.constructClass(name);
        }

        this.references.push(obj);

        var marker = this.readByte();

        while(marker !== Markers.OBJECT_END) {
            this.byteArray.position--;

            const key = this.readUTF();
            const value = this.read();

            obj[key] = value;

            marker = this.readByte();
        }
        
        return obj;
    }

    /**
     * @returns {Date}
     */
    readDate() {
        const time = this.readDouble();
        const offset = this.readShort(); // todo: make use of offset

        const date = new Date(time);

        this.references.push(date);

        return date;
    }

    /**
     * @returns {XML}
     */
    readXML() {
        return XML.parse(this.readString(true), false);
    }

    /**
     * @returns {*}
     */
    readAVMPlus() {
        this.amf3.byteArray = this.byteArray;

        const res = this.amf3.read();

        return res;
    }

    getReference(data) {
        const index = this.references.indexOf(data);

        if(index > -1) {
            return index;
        }

        this.references.push(data);

        return false;
    }

    write(data) {
        if(data == null) {
            this.writeByte(data === null ? Markers.NULL : Markers.UNDEFINED);
            
            return this.byteArray.buffer;
        }

        const type = typeof data;

        switch (type) {
            case 'string': this.writeString(data); break
            case 'number': this.writeDouble(Number(data)); break
            case 'bigint': this.writeString(data.toString()); break
            case 'boolean': this.writeBoolean(data); break
            case 'object':
                const index = this.getReference(data);

                if (index !== false) {
                    this.writeReference(index);

                    break
                }

                if (data instanceof Date) {
                    this.writeDate(data);
                } else if(this.avmPlus) {
                    this.writeAVMPlus(data);
                } else if (data instanceof Map || (Utils.isAssociativeArray(data))) {
                    this.writeECMAArray(data);
                } else if (data instanceof Array) {
                    this.writeStrictArray(data);
                } else if(data instanceof XML) {
                    this.writeXML(data);
                } else {
                    this.writeObject(data);
                }
            break;
            default:
                throw new Error('Invalid data type: ' + type);
        }
        
        return this.byteArray.buffer;
    }

    /**
     * @param {String} data 
     * @param {Boolean} writeType
     * @param {Boolean} [forceLong=false]
     */
    writeString(data, writeType = true, forceLong = false) {
        data = String(data);

        if (forceLong || data.length > 65535) {
            if (writeType) {
                this.writeByte(Markers.AMF0.LONG_STRING);
            }

            this.writeUnsignedInt(data.length);
        } else {
            if (writeType) {
                this.writeByte(Markers.STRING);
            }

            this.writeUnsignedShort(data.length);
        }

        this.writeUTFBytes(data);
    }

    /**
     * @param {Number} data 
     */
    writeDouble(data) {
        this.writeByte(Markers.NUMBER);
        this.super_writeDouble(data);
    }

    /**
     * @param {Boolean} data 
     * @param {Boolean} [writeType=true]
     */
    writeBoolean(data, writeType = true) {
        if(writeType) {
            this.writeByte(Markers.BOOLEAN);
        }
        
        this.super_writeBoolean(data);
    }

    /**
     * @param {Date} data
     */
    writeDate(data) {
        this.writeByte(Markers.DATE);
        this.super_writeDouble(data.getTime());
        this.writeShort(data.getTimezoneOffset());
    }

    /**
     * @param {Number} data - Reference index
     */
    writeReference(data) {
        this.writeByte(Markers.REFERENCE);
        this.writeUnsignedShort(data);
    }

    /**
     * @param {Array} data 
     */
    writeStrictArray(data) {
        this.writeByte(Markers.STRICT_ARRAY);
        this.writeUnsignedInt(data.length);

        for(var i in data) {
            this.write(data[i]);
        }
    }

    /**
     * @param {XML} data
     */
    writeXML(data) {
        this.writeByte(Markers.XML_DOC);
        this.writeString(data.stringify(), false, true);
    }
    
    /**
     * @param {Map|Array} data
     */
    writeECMAArray(data) {
        this.writeByte(Markers.ECMA_ARRAY);

        if(data instanceof Map) {
            this.writeUnsignedShort(data.size);

            for(const [key, value] of data) {
                this.writeString(key, false);
                this.write(value);
            }
        } else {
            // AMF0 uses 0 length for associative arrays, we write the length anyway
            this.writeUnsignedShort(Object.keys(data).length)

            for (const key in data) {
                this.writeString(key, false)
                this.write(data[key])
            }
        }

        this.writeObjectEnd();
    }

    /**
     * @param {Object} data 
     */
    writeObject(data) {
        const className = this.getClassName(data);

        if(className !== 'Object') {
            this.writeByte(Markers.TYPED_OBJECT);
            this.writeString(className, false);
        } else {
            this.writeByte(Markers.OBJECT);
        }

        for(var i in data) {
            this.writeString(i, false);
            this.write(data[i]);
        }

        this.writeObjectEnd();
    }

    writeObjectEnd() {
        this.writeByte(Markers.OBJECT_END);
    }

    /**
     * Write an object using AMF3
     * @param {Object} data
     */
    writeAVMPlus(data) {
        this.writeByte(Markers.AVMPLUS);

        this.amf3.byteArray = this.byteArray;
        this.amf3.write(data);
    }
}

module.exports = AMF0;
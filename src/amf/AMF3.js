'use strict';

const Utils          = require('../utils/Utils');
const Markers        = require('./Markers').AMF3;

const Dictionary     = require('./flash/Dictionary');
const Vector         = require('./flash/Vector');
const XML            = require('./flash/XML');

const AbstractAMF    = require('./AbstractAMF');
const ByteArray      = require('bytearray-node');
const AMF0           = require('./AMF0');

const EMPTY_STRING    = '';
const UINT29_MASK     = 2^29 - 1;
const INT28_MAX_VALUE = 0x0FFFFFFF; // 2^28 - 1
const INT28_MIN_VALUE = 0xF0000000; // -2^28 in 2^29 scheme

class AMF3 extends AbstractAMF {
    constructor(core) {
        super(core);

        /**
         * A map containing strings to be used for references
         * @type {Map}
         */
        this.stringTable = null;

        /**
         * A map containing objects to be used for references
         * @type {Map}
         */
        this.objectTable = null;

        /**
         * A map containing traits to be used for references
         * @type {Map}
         */
        this.traitTable = null;

        this.reset();
    }

    get markers() {
        return Markers;
    }

    resetReferences() {
        this.stringTable = new Map();
        this.objectTable = new Map();
        this.traitTable = new Map();
    }

    reset() {
        this.resetReferences();
        super.reset();
    }

    /**
     * Reads an unsigned 29-bit integer
     */
    readUInt29() {
        var value;

        // Each byte must be treated as unsigned
        var b = this.readUnsignedByte() & 0xFF;

        if (b < 128)
            return b;

        value = (b & 0x7F) << 7;
        b = this.readUnsignedByte() & 0xFF;

        if (b < 128)
            return (value | b);

        value = (value | (b & 0x7F)) << 7;
        b = this.readUnsignedByte() & 0xFF;

        if (b < 128)
            return (value | b);

        value = (value | (b & 0x7F)) << 8;
        b = this.readUnsignedByte() & 0xFF;

        return (value | b);
    }

    /**
     * Writes an unsigned 29-bit integer
     * @param {Number} value 
     */
    writeUInt29(value) {
        if (value < 0x80) {
            this.writeUnsignedByte(value);
        } else if (value < 0x4000) {
            this.writeUnsignedByte(((value >> 7) & 0x7F) | 0x80);
            this.writeUnsignedByte(value & 0x7F);
        } else if (value < 0x200000) {
            this.writeUnsignedByte(((value >> 14) & 0x7F) | 0x80);
            this.writeUnsignedByte(((value >> 7) & 0x7F) | 0x80);
            this.writeUnsignedByte(value & 0x7F);
        } else if (value < 0x40000000) {
            this.writeUnsignedByte(((value >> 22) & 0x7F) | 0x80);
            this.writeUnsignedByte(((value >> 15) & 0x7F) | 0x80);
            this.writeUnsignedByte(((value >> 8) & 0x7F) | 0x80);
            this.writeUnsignedByte(value & 0xFF);
        } else {
            throw new RangeError('Integer out of range: ' + value);
        }
    }

    /**
     * @param {Number} index
     * @param {String} table
     */
    getReference(index, table) {
        return this[table + 'Table'].get(index);
    }

    /**
     * @param {*} data 
     * @param {String=} type
     */
    byReference(data, type) {
        var container;

        if(!type) type = typeof data;

        switch (type) {
            case 'string': container = this.stringTable; break
            case 'object': container = this.objectTable; break
            case 'trait': container = this.traitTable; break
            default: return false
        }

        if (container.has(data)) {
            if(type !== 'trait') {
                this.writeUInt29(container.get(data) << 1);
            } else {
                this.writeUInt29((container.get(data) << 2) | 1);
            }

            return true;
        }

        container.set(data, container.size);
        return false;
    }

    /**
     * @param {Function} data
     */
    getTraitsByClass(data) {
        if(typeof data === 'object') {
            data = data.constructor;
        }

        for(const traits of this.traitTable) {
            if(traits.class === data) {
                return traits;
            }
        }

        return null;
    }

    read(marker) {
        if(!marker) {
            marker = this.readByte();
        }

        switch(marker) {
            case Markers.UNDEFINED: return undefined; break
            case Markers.NULL: return null; break
            case Markers.STRING: return this.readString(); break
            case Markers.DOUBLE: return this.readDouble(); break
            case Markers.INT: return this.readInteger(); break
            case Markers.TRUE: return true; break
            case Markers.FALSE: return false; break
            case Markers.DATE: return this.readDate(); break
            case Markers.ARRAY: return this.readArray(); break
            case Markers.DICTIONARY: return this.readDictionary(); break
            case Markers.VECTOR_OBJECT: case Markers.VECTOR_INT: case Markers.VECTOR_UINT: case Markers.VECTOR_DOUBLE: return this.readVector(marker); break
            case Markers.BYTE_ARRAY: return this.readByteArray(); break
            case Markers.XML: return this.readXML(); break
            case Markers.XML_DOC: return this.readXML(true); break
            case Markers.OBJECT: return this.readObject(); break
        }
    }

    /**
     * @returns {String}
     */
    readString() {
        const ref = this.readUInt29();

        if ((ref & 1) === 0) {
            return this.getReference(ref >> 1, 'string');
        }

        const len = ref >> 1;
        
        if(len === 0) {
            return EMPTY_STRING;
        }

        const str = this.readUTFBytes(len);
        this.stringTable.set(this.stringTable.size, str);

        return str;
    }

    /**
     * @returns {Date}
     */
    readDate() {
        const ref = this.readUInt29();

        if((ref & 1) === 0) {
            return this.getReference(ref >> 1, 'object');
        }

        const time = this.readDouble();
        const date = new Date(time);

        this.objectTable.set(this.objectTable.size, date);

        return date;
    }

    /**
     * @returns {Number}
     */
    readInteger() {
        return (((this.readUInt29()) << 3) >> 3);
    }

    /**
     * @returns {Map|Array}
     */
    readArray() {
        const ref = this.readUInt29();

        if((ref & 1) === 0) {
            return this.getReference(ref >> 1, 'object');
        }

        const map = new Map();

        var key = this.readString();

        if(key.length > 0) {
            this.objectTable.set(this.objectTable.size, map);

            while(key.length > 0) {
                map.set(key, this.read());

                key = this.readString();
            }

            return map;
        } else {
            const length = ref >> 1;
            const arr = [];

            this.objectTable.set(this.objectTable.size, arr);

            for (var i = 0; i < length; i++) {
                arr.push(this.read());
            }

            return arr;
        }
    }

    /**
     * @returns {Dictionary}
     */
    readDictionary() {
        const ref = this.readUInt29();

        if((ref & 1) === 0) {
            return this.getReference(ref >> 1, 'object');
        }

        this.readBoolean(); // useWeakReferences
        
        const length = ref >> 1;
        const map = new Dictionary();

        this.objectTable.set(this.objectTable.size, map);

        for(var i = 0; i < length; i++) {
            map.set(this.read(), this.read());
        }

        return map;
    }

    /**
     * @param {String} [type=Markers.VECTOR_OBJECT]
     * @returns {Vector}
     */
    readVector(type = Markers.VECTOR_OBJECT) {
        const ref = this.readUInt29();

        if((ref & 1) === 0) {
            return this.getReference(ref >> 1, 'object');
        }

        const length = ref >> 1;
        const fixed = super.readBoolean();
        
        var cls = type !== Markers.VECTOR_OBJECT ? Number : null;
        var clsName = null;

        var dynamic = false;

        if(type === Markers.VECTOR_OBJECT) {
            clsName = this.readString();
            
            if(clsName === null || clsName.length === 0) {
                dynamic = true;
            }

            if(!cls && clsName)
                cls = this.getClass(clsName);
        }

        if(!cls && !dynamic) {
            throw new Error('Invalid vector received with type ' + type + ' and class name ' + clsName);
        }

        var vector = new Vector(cls);
        
        this.objectTable.set(this.objectTable.size, vector);

        for(var i = 0; i < length; i++) {
            var val = null;

            switch(type) {
                case Markers.VECTOR_INT: val = this.readInt(); break
                case Markers.VECTOR_UINT: val = this.readUInt(); break
                case Markers.VECTOR_DOUBLE: val = this.readDouble(); break
                case Markers.VECTOR_OBJECT: val = this.read(); break
            }

            if(dynamic) {
                clsName = val.constructor.name;
                cls = val.constructor;
                vector.type = cls;
                dynamic = false;
            }

            vector.push(val);
        }

        if(fixed) {
            vector = Object.seal(vector);
        }

        return vector;
    }

    /**
     * @returns {ByteArray}
     */
    readByteArray() {
        const ref = this.readUInt29();

        if((ref & 1) === 0) {
            return this.getReference(ref >> 1, 'object');
        }

        const length = ref >> 1;
        const byteArray = new ByteArray();
        
        this.objectTable.set(this.objectTable.size, byteArray);

        for(var i = 0; i < length; i++) {
            byteArray.writeByte(this.readByte());
        }
        
        byteArray.position = 0;

        return byteArray;
    }

    /**
     * @param {Boolean} legacy
     * @returns {XML}
     */
    readXML(legacy = false) {
        const ref = this.readUInt29();

        if((ref & 1) === 0) {
            return this.getReference(ref >> 1, 'object');
        }
        
        const len = ref >> 1;
        const raw = len > 0 ? this.readUTFBytes(len) : EMPTY_STRING;
        const xml = XML.parse(raw, legacy);
        xml.legacy = legacy;

        this.objectTable.set(this.objectTable.size, xml);

        return xml;
    }

    /**
     * @param {Object} data 
     */
    readObject() {
        const ref = this.readUInt29();

        if((ref & 1) === 0) {
            return this.getReference(ref >> 1, 'object');
        }

        const traits = this.readTraits(ref);
        const cls = this.getClass(traits.className);
        const obj = cls ? new cls : (traits.className.length > 0 ? Utils.constructClass(traits.className) : new Object());

        traits.class = cls;

        this.objectTable.set(this.objectTable.size, obj);

        if(traits.isExternalizable) {
            obj.readExternal(this, traits);
        } else {
            this.readObjectProperties(obj, traits);
        }

        return obj;
    }

    /**
     * @param {Number} ref 
     */
    readTraits(ref) {
        if ((ref & 3) === 1) {
            // This is a reference
            
            return this.getReference(ref >> 2, 'trait');
        }

        const isExternalizable = ((ref & 4) == 4);
        const isDynamic = ((ref & 8) == 8);

        const count = (ref >> 4); // uint29
        const className = this.readString();

        const properties = [];

        for (var i = 0; i < count; i++) {
            properties.push(this.readString());
        }

        const traits = {
            className,
            isExternalizable,
            isDynamic,
            properties
        };

        this.traitTable.set(this.traitTable.size, traits);

        return traits;
    }

    /**
     * @param {Object} data 
     * @param {Object} traits 
     */
    readObjectProperties(data, traits) {
        if(!traits) {
            traits = this.getTraitsByClass(data);
        }

        if(!traits) {
            throw new Error('Traits for object were not found.');
        }

        const {properties} = traits;

        for (var i = 0; i < properties.length; i++) {
            const prop = properties[i];
            const val = this.read();

            data[prop] = val;
        }

        if (traits.isDynamic) {
            var key = this.readString();

            while (key.length > 0) {
                data[key] = this.read();

                key = this.readString();
            }
        }
    }

    /**
     * @param {*} data 
     */
    write(data) {
        if(data == null) {
            this.writeByte(data === undefined ? Markers.UNDEFINED : Markers.NULL);

            return this.buffer;
        }

        if(typeof data.writeExternal === 'function') {
            this.writeObject(data);

            return this.buffer;
        }

        const type = typeof data;

        switch(type) {
            case 'string': this.writeString(data.toString()); break
            case 'number': this.writeNumber(data); break
            case 'bigint': this.writeString(data.toString()); break
            case 'boolean': this.writeBoolean(data); break
            case 'object':
                if(data instanceof Date) {
                    this.writeDate(data);
                } else if (data instanceof Dictionary) {
                    this.writeDictionary(data);
                } else if (data instanceof Vector) {
                    this.writeVector(data);
                } else if(data instanceof Map || Utils.isAssociativeArray(data)) {
                    this.writeECMAArray(data);
                } else if(data instanceof Array) {
                    this.writeArray(data);
                } else if(data instanceof ByteArray) {
                    this.writeByteArray(data);
                } else if(data instanceof XML) {
                    this.writeXML(data);
                } else {
                    this.writeObject(data);
                }
            break;
            default:
                throw new Error('Invalid data type: ' + type);
        }

        return this.buffer;
    }

    writeUTF(data) {
        this.writeUInt29((Buffer.byteLength(data) << 1) | 1);
        this.writeMultiByte(data);
    }

    /**
     * @param {String} data
     * @param {Boolean} [writeType=true]
     */
    writeString(data, writeType = true) {
        data = String(data);

        if(writeType) {
            this.writeByte(Markers.STRING);
        }

        if(data.length === 0) {
            return this.writeUInt29(1);
        }

        if(!this.byReference(data)) {
            this.writeUTF(data);
        }
    }

    /**
     * @param {Number} data 
     */
    writeInteger(data) {
        if (data >= INT28_MIN_VALUE && data <= INT28_MAX_VALUE) {
            this.writeByte(Markers.INT);
            this.writeUInt29(data & UINT29_MASK);
        } else {
            this.writeDouble(data);
        }
    }

    /**
     * @param {Number} data 
     */
    writeDouble(data) {
        this.writeByte(Markers.DOUBLE);
        super.writeDouble(data);
    }

    /**
     * @param {Number} data 
     */
    writeNumber(data) {
        if(AMF3.AssumeIntegers) {
            if(data % 1 === 0) {
                // Write whole numbers as integers
                return this.writeInteger(data);
            }
        }

        return this.writeDouble(data);
    }

    /**
     * @param {Boolean} data 
     */
    writeBoolean(data) {
        this.writeByte(data ? Markers.TRUE : Markers.FALSE);
    }

    /**
     * @param {Date} data 
     */
    writeDate(data) {
        this.writeByte(Markers.DATE);

        if(!this.byReference(data)) {
            this.writeUInt29(1); // Write invalid reference
            super.writeDouble(data.getTime());
        }
    }

    /**
     * @param {Map|Array} data
     */
    writeECMAArray(data) {
        this.writeByte(Markers.ARRAY);

        if(!this.byReference(data)) {
            this.writeUInt29(1); // Write invalid reference

            if (data instanceof Map) {
                for (const [key, value] of data) {
                    this.writeString(key, false);
                    this.write(value);
                }
            } else {
                for (const key in data) {
                    this.writeString(key, false)
                    this.write(data[key])
                }
            }

            this.writeString(EMPTY_STRING, false);
        }
    }

    /**
     * @param {Dictionary} data 
     */
    writeDictionary(data) {
        this.writeByte(Markers.DICTIONARY);

        if(!this.byReference(data)) {
            this.writeUInt29((data.size << 1) | 1);
            this.writeBoolean(false); // usingWeakKeys

            for(const [key, value] of data) {
                this.write(key);
                this.write(value);
            }
        }
    }

    /**
     * @param {Vector} data
     */
    writeVector(data) {
        var type = Markers.VECTOR_OBJECT;

        if(data.type === Number) {
            type = Markers.VECTOR_DOUBLE;
        }

        this.writeByte(type);

        if(!this.byReference(data)) {
            this.writeUInt29((data.length << 1) | 1);
            super.writeBoolean(true); // fixed

            if(type === Markers.VECTOR_OBJECT) {
                const className = !([Number, String, Object]).includes(type.constructor) ? this.getClassName(data.type) : EMPTY_STRING; // Empty string if it's a primitve type

                this.writeString(className, false);
            }

            for(var i = 0; i < data.length; i++) {
                const val = data[i];

                if(type === Markers.VECTOR_INT) {
                    this.writeInt(val);
                } else if(type === Markers.VECTOR_DOUBLE) {
                    super.writeDouble(val);
                } else {
                    this.write(val);
                }
            }
        }
    }

    /**
     * @param {Array} data 
     */
    writeArray(data) {
        this.writeByte(Markers.ARRAY);

        if(!this.byReference(data)) {
            this.writeUInt29((data.length << 1) | 1);
            this.writeString(EMPTY_STRING, false); // Send an empty string to imply no named keys

            for(var i = 0; i < data.length; i++) {
                this.write(data[i]);
            }
        }
    }

    /**
     * @param {ByteArray} data
     */
    writeByteArray(data) {
        this.writeByte(Markers.BYTE_ARRAY);
        this.writeUInt29((data.length << 1) | 1);

        data.position = 0;

        for(var i = 0; i < data.length; i++) {
            this.writeByte(data.readByte());
        }

        data.position = 0;
    }

    /**
     * @param {XML} data
     */
    writeXML(data) {
        this.writeByte(data.legacy ? Markers.XML_DOC : Markers.XML);

        if(!this.byReference(data)) {
            this.writeUTF(data.stringify());
        }
    }

    /**
     * @param {Object} data
     */
    writeObject(data) {
        this.writeByte(Markers.OBJECT);

        if(!this.byReference(data)) {
            const traits = this.writeObjectTraits(data);

            if(!traits.isExternalizable) {
                this.writeObjectProperties(data, traits);
            } else {
                data.writeExternal(this, traits);
            }
        }
    }
    
    /**
     * @param {Object}
     * @returns {Object}
     */
    writeObjectTraits(data) {
        const name = data.constructor === Object ? EMPTY_STRING : this.getClassName(data);

        const isExternalizable = typeof data.writeExternal === 'function';
        const isDynamic = data.isDynamic !== undefined ? data.isDynamic : false; // not quite sure how this is supposed to work

        const keys = isExternalizable ? [] : Object.keys(data);
        const count = keys.length;
        const traits = {
            className: name,
            isExternalizable,
            isDynamic,
            properties: keys,
            class: data.constructor
        };

        if (!this.byReference(traits, 'trait')) {
            this.writeUInt29(3 | (isExternalizable ? 4 : 0) | (isDynamic ? 8 : 0) | (count << 4));
            this.writeString(name, false);
        }

        return traits;
    }

    /**
     * @param {Object} data
     * @param {Object} traits
     */
    writeObjectProperties(data, traits) {
        if(!traits) {
            traits = this.getTraitsByClass(data);
        }

        const properties = traits ? traits.properties : Object.keys(data);

        for (var i = 0; i < properties.length; i++) {
            this.writeString(properties[i], false);
        }

        for (var i = 0; i < properties.length; i++) {
            this.write(data[properties[i]]);
        }
    }
}

AMF3.AssumeIntegers = false;

module.exports = AMF3;
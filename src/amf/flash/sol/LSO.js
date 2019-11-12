'use strict';

/* Credits to Gabriel Mariani for SOL [https://github.com/gmariani] */

const AMF       = require('../../../');
const ByteArray = require('bytearray-node');

class LSO {
    constructor(body, header) {
        if(body && body.contentLength && body.tagLength) {
            header = body;
            body = null;
        }

        this.body = body;
        this.header = header;
    }

    read(ctx) {
        const ba = ctx.byteArray;
        var start = ba.position;

        const sig = ba.readUTFBytes(4);

        if (sig !== 'TCSO') {
            throw new Error('Missing TCSO signature, not a SOL file');
        }

        var pos1 = ba.position;
        ba.readUTFBytes(6);

        this.filename = ba.readUTF();
        this.version = ba.readUnsignedInt();

        if(this.version !== 0 && this.version !== 3) {
            this.body = false; // Unsupported format
        } else {
            this.body = {};

            while(ba.bytesAvailable > 1 && ba.position < this.header.contentLength) {
                var key = '';
                var val;

                if(this.version === 3) {
                    key = ctx.amf3.readString();
                    val = ctx.amf3.read();
                } else if(this.version === 0) {
                    key = ba.readUTF();
                    val = ctx.amf0.read();
                }

                ba.readUnsignedByte(); // ending byte
                this.body[key] = val;
            }
        }

        return this;
    }

    write(ctx) {
        if(this.body.filename && !this.filename) {
            this.filename = this.body.filename;
            this.body.filename = null;

            delete this.body.filename;
        }

        if((!isNaN(this.body.version) && this.body.version !== null) && !this.version) {
            this.version = this.body.version;
            this.body.version = null;

            delete this.body.version;
        }

        const baBody = new ByteArray();
        //baBody.endian = false;

        var amf3;
        var amf0;

        if(ctx) {
            ctx.amf3.reset();
            ctx.amf0.reset();

            amf3 = ctx.amf3;
            amf0 = ctx.amf0;
        } else {
            amf3 = new AMF.AMF3(AMF);
            amf0 = new AMF.AMF0(AMF);
        }
        
        amf3.byteArray = baBody;
        amf0.byteArray = baBody;

        baBody.writeUTFBytes('TCSO');
        baBody.writeUnsignedShort(4); // unknown header
        baBody.writeUnsignedInt(0); // ^

        baBody.writeUTF(this.filename);
        baBody.writeUnsignedInt(this.version);

        for(var i in this.body) {
            if(this.version === 3) {
                amf3.writeString(i);
                amf3.write(this.body[i]);
            } else if(this.version === 0) {
                baBody.writeUTF(i);
                amf0.write(this.body[i]);
            }

            baBody.writeUnsignedByte();
        }

        const ba = ctx && ctx.byteArray ? ctx.byteArray : new ByteArray();
        ba.writeByte(0x00);
        ba.writeUnsignedByte(0xbf);
        ba.writeUnsignedInt(baBody.position);
        ba.writeBytes(baBody);

        return ba.buffer;
    }
}

module.exports = LSO;